import "server-only";

import { sql } from "drizzle-orm";
import { withPrivateData } from "@/lib/db/private-data";
import { withPrivateMutation } from "@/lib/db/private-mutation";
import { notes } from "@/lib/db/schema";
import { DataAccessError } from "@/lib/db/owned-data";
import { MAX_BODY_BYTES, MAX_TITLE_CODE_POINTS } from "./rules";

export const listNotes = () => withPrivateData((data) => data.listNotes());
export const getNote = (id: string) => withPrivateData((data) => data.getNote(id));

export class NoteConflictError extends Error {
  constructor(readonly latest: { id: string; title: string; body: string; collectionId: string | null; revision: number; updatedAt: Date }) {
    super("The note changed elsewhere.");
    this.name = "NoteConflictError";
  }
}

export class NoteInputError extends Error {
  constructor() { super("Invalid note content."); this.name = "NoteInputError"; }
}

function normalizeNote(title: unknown, body: unknown) {
  if (typeof title !== "string" || typeof body !== "string" || title.includes("\0") || body.includes("\0")) throw new NoteInputError();
  const normalizedTitle = title.normalize("NFC").trim();
  if (Array.from(normalizedTitle).length > MAX_TITLE_CODE_POINTS || Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) throw new NoteInputError();
  return { title: normalizedTitle, body };
}

export async function saveNote(input: { noteId: string; expectedRevision: number; mutationId: string; title: string; body: string }) {
  const { title, body } = normalizeNote(input.title, input.body);
  if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 1) throw new NoteInputError();
  return withPrivateMutation({
    operation: "save_note", mutationId: input.mutationId,
    payload: { noteId: input.noteId, expectedRevision: input.expectedRevision, title, body },
  }, {
    prepare: async (tx, ownerId, data) => {
      const current = await data.lockNoteForUpdate(input.noteId);
      if (current.revision !== input.expectedRevision) throw new NoteConflictError(current);
      const changes = { notes_bytes: Buffer.byteLength(title, "utf8") + Buffer.byteLength(body, "utf8") - current.storageBytes };
      return {
        changes,
        apply: async () => {
          if (current.title === title && current.body === body) {
            return { entityId: current.id, revision: current.revision, resultUpdatedAt: current.updatedAt };
          }
          const [saved] = await tx.update(notes).set({
            title, body, revision: sql`${notes.revision} + 1`, updatedAt: sql`clock_timestamp()`,
          }).where(sql`${notes.id} = ${current.id} and ${notes.ownerId} = ${ownerId}`).returning({
            id: notes.id, revision: notes.revision, updatedAt: notes.updatedAt,
          });
          if (!saved) throw new DataAccessError("NOT_FOUND");
          return { entityId: saved.id, revision: saved.revision, resultUpdatedAt: saved.updatedAt };
        },
      };
    },
    authorizeReplay: async (data, result) => { await data.getNote(result.entityId); },
  });
}

export async function createNote(mutationId: string) {
  return withPrivateMutation({ operation: "create_note", mutationId, payload: { title: "", body: "" } }, {
    prepare: async (tx, ownerId) => ({
      changes: { notes_count: 1, notes_bytes: 0 },
      apply: async () => {
        const [created] = await tx.insert(notes).values({ ownerId, title: "", body: "" }).returning({
          id: notes.id, revision: notes.revision, updatedAt: notes.updatedAt,
        });
        return { entityId: created.id, revision: created.revision, resultUpdatedAt: created.updatedAt };
      },
    }),
    authorizeReplay: async (data, result) => { await data.getNote(result.entityId); },
  });
}
