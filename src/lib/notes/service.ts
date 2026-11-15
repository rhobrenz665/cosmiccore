import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";
import { withPrivateData } from "@/lib/db/private-data";
import { withPrivateMutation } from "@/lib/db/private-mutation";
import { collections, noteTags, notes, referenceTags, references, tags } from "@/lib/db/schema";
import { DataAccessError } from "@/lib/db/owned-data";
import { MAX_BODY_BYTES, MAX_ORGANIZATION_NAME_CODE_POINTS, MAX_TAGS_PER_NOTE, MAX_TITLE_CODE_POINTS } from "./rules";

export const listNotes = () => withPrivateData((data) => data.listNotes());
export const getNote = (id: string) => withPrivateData((data) => data.getNote(id));
export const getNoteEditorData = (id: string) => withPrivateData(async (data) => ({
  note: await data.getNote(id),
  tagIds: await data.getNoteTagIds(id),
  collections: await data.listCollections(),
  tags: await data.listTags(),
}));

export class NoteConflictError extends Error {
  constructor(readonly latest: { id: string; title: string; body: string; collectionId: string | null; tagIds: string[]; collections: { id: string; displayName: string }[]; tags: { id: string; displayName: string }[]; revision: number; updatedAt: Date }) {
    super("The note or its organization changed elsewhere.");
    this.name = "NoteConflictError";
  }
}

export class NoteInputError extends Error {
  constructor() { super("Invalid note content."); this.name = "NoteInputError"; }
}

export class DuplicateOrganizationNameError extends Error {
  constructor() { super("That name is already in use."); this.name = "DuplicateOrganizationNameError"; }
}

function normalizeNote(title: unknown, body: unknown) {
  if (typeof title !== "string" || typeof body !== "string" || title.includes("\0") || body.includes("\0")) throw new NoteInputError();
  const normalizedTitle = title.normalize("NFC").trim();
  if (Array.from(normalizedTitle).length > MAX_TITLE_CODE_POINTS || Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) throw new NoteInputError();
  return { title: normalizedTitle, body };
}

export async function saveNote(input: { noteId: string; expectedRevision: number; mutationId: string; title: string; body: string; collectionId: string | null; tagIds: string[] }) {
  const { title, body } = normalizeNote(input.title, input.body);
  if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 1 || (input.collectionId !== null && typeof input.collectionId !== "string") || !Array.isArray(input.tagIds) || input.tagIds.length > MAX_TAGS_PER_NOTE || input.tagIds.some((id) => typeof id !== "string")) throw new NoteInputError();
  const collectionId = input.collectionId?.toLowerCase() ?? null;
  const tagIds = [...new Set(input.tagIds.map((id) => id.toLowerCase()))].sort();
  if (tagIds.length !== input.tagIds.length) throw new NoteInputError();
  return withPrivateMutation({
    operation: "save_note", mutationId: input.mutationId,
    payload: { noteId: input.noteId, expectedRevision: input.expectedRevision, title, body, collectionId, tagIds },
  }, {
    prepare: async (tx, ownerId, data) => {
      const current = await data.lockNoteForUpdate(input.noteId);
      const currentTagIds = await data.getNoteTagIds(current.id);
      const conflict = async () => new NoteConflictError({
        ...current,
        tagIds: currentTagIds,
        collections: await data.listCollections(),
        tags: await data.listTags(),
      });
      if (current.revision !== input.expectedRevision) throw await conflict();
      try {
        await data.assertAssociations(collectionId, tagIds);
      } catch (error) {
        // An organization may have been deleted while still only selected in
        // this local buffer. Return the current authorized state so the editor
        // can resolve that stale association instead of retrying NOT_FOUND.
        if (error instanceof DataAccessError && error.code === "NOT_FOUND") throw await conflict();
        throw error;
      }
      const changes = { notes_bytes: Buffer.byteLength(title, "utf8") + Buffer.byteLength(body, "utf8") - current.storageBytes };
      const associationsChanged = current.collectionId !== collectionId || currentTagIds.join("\0") !== tagIds.join("\0");
      return {
        changes,
        apply: async () => {
          if (current.title === title && current.body === body && !associationsChanged) {
            return { entityId: current.id, revision: current.revision, resultUpdatedAt: current.updatedAt };
          }
          const [saved] = await tx.update(notes).set({
            title, body, collectionId, revision: sql`${notes.revision} + 1`, updatedAt: sql`clock_timestamp()`,
          }).where(sql`${notes.id} = ${current.id} and ${notes.ownerId} = ${ownerId}`).returning({
            id: notes.id, revision: notes.revision, updatedAt: notes.updatedAt,
          });
          if (!saved) throw new DataAccessError("NOT_FOUND");
          if (associationsChanged) {
            await tx.delete(noteTags).where(and(eq(noteTags.ownerId, ownerId), eq(noteTags.noteId, current.id)));
            if (tagIds.length) await tx.insert(noteTags).values(tagIds.map((tagId) => ({ ownerId, noteId: current.id, tagId })));
          }
          return { entityId: saved.id, revision: saved.revision, resultUpdatedAt: saved.updatedAt };
        },
      };
    },
    authorizeReplay: async (data, result) => { await data.getNote(result.entityId); },
  });
}

type OrganizationKind = "collection" | "tag";
type OrganizationAction = "create" | "rename" | "delete";
function normalizeOrganizationName(value: unknown) {
  if (typeof value !== "string" || value.includes("\0")) throw new NoteInputError();
  const name = value.normalize("NFC").trim();
  if (Array.from(name).length < 1 || Array.from(name).length > MAX_ORGANIZATION_NAME_CODE_POINTS) throw new NoteInputError();
  return name;
}

function isDuplicateName(error: unknown) {
  let current: unknown = error;
  for (let i = 0; i < 5 && current; i++) {
    if (typeof current === "object" && current !== null) {
      const value = current as { code?: unknown; constraint?: unknown; cause?: unknown };
      if (value.code === "23505" && (value.constraint === "collections_owner_name_key" || value.constraint === "tags_owner_name_key")) return true;
      current = value.cause;
    } else break;
  }
  return false;
}

export async function mutateOrganization(input: { kind: OrganizationKind; action: OrganizationAction; mutationId: string; id?: string; name?: string; noteId?: string }) {
  if (!["collection", "tag"].includes(input.kind) || !["create", "rename", "delete"].includes(input.action)) throw new NoteInputError();
  if (input.action !== "create" && typeof input.id !== "string") throw new NoteInputError();
  const name = input.action === "delete" ? undefined : normalizeOrganizationName(input.name);
  const table = input.kind === "collection" ? collections : tags;
  const usageMetric = input.kind === "collection" ? "collections_count" : "tags_count";
  const operation = `${input.action}_${input.kind}`;
  let result: { entityId: string; revision: number | null; affectedCount: number; resultUpdatedAt: Date | null; deletedAt: Date | null; purgeAfter: Date | null; replayed: boolean };
  try {
    result = await withPrivateMutation({
      operation, mutationId: input.mutationId,
      payload: { kind: input.kind, action: input.action, id: input.id ?? null, name: name ?? null, noteId: input.noteId ?? null },
    }, {
      prepare: async (tx, ownerId, data) => {
        if (input.noteId) await data.getNote(input.noteId);
        const changes = input.action === "create" ? { [usageMetric]: 1 } : input.action === "delete" ? { [usageMetric]: -1 } : {};
        if (input.action === "create") return {
          changes,
          apply: async () => {
            const [created] = await tx.insert(table).values({ ownerId, displayName: name! }).returning({ id: table.id });
            return { entityId: created.id };
          },
        };

        const resource = input.kind === "collection" ? await data.lockCollectionForUpdate(input.id!) : await data.lockTagForUpdate(input.id!);
        if (input.action === "rename") return {
          changes,
          apply: async () => {
            if (resource.displayName === name) return { entityId: resource.id };
            const [renamed] = await tx.update(table).set({ displayName: name!, updatedAt: sql`clock_timestamp()` })
              .where(and(eq(table.ownerId, ownerId), eq(table.id, resource.id))).returning({ id: table.id });
            return { entityId: renamed.id };
          },
        };

        let affectedNoteIds: string[] = [];
        if (input.kind === "collection") {
          affectedNoteIds = (await tx.select({ id: notes.id }).from(notes)
            .where(and(eq(notes.ownerId, ownerId), eq(notes.collectionId, resource.id))).for("update")).map((note) => note.id);
        } else {
          affectedNoteIds = (await tx.select({ noteId: noteTags.noteId }).from(noteTags)
            .where(and(eq(noteTags.ownerId, ownerId), eq(noteTags.tagId, resource.id)))).map((row) => row.noteId);
          await tx.delete(noteTags).where(and(eq(noteTags.ownerId, ownerId), eq(noteTags.tagId, resource.id)));
          await tx.delete(referenceTags).where(and(eq(referenceTags.ownerId, ownerId), eq(referenceTags.tagId, resource.id)));
        }
        return {
          changes,
          apply: async () => {
            let currentNote: { revision: number; updatedAt: Date } | undefined;
            if (affectedNoteIds.length) {
              const updatedNotes = await tx.update(notes).set({
                ...(input.kind === "collection" ? { collectionId: null } : {}),
                revision: sql`${notes.revision} + 1`, updatedAt: sql`clock_timestamp()`,
              }).where(and(eq(notes.ownerId, ownerId), inArray(notes.id, affectedNoteIds)))
                .returning({ id: notes.id, revision: notes.revision, updatedAt: notes.updatedAt });
              currentNote = updatedNotes.find((note) => note.id === input.noteId);
            }
            if (input.kind === "collection") {
              await tx.update(references).set({ collectionId: null }).where(and(eq(references.ownerId, ownerId), eq(references.collectionId, resource.id)));
            }
            await tx.delete(table).where(and(eq(table.ownerId, ownerId), eq(table.id, resource.id)));
            return { entityId: resource.id, affectedCount: affectedNoteIds.length, revision: currentNote?.revision, resultUpdatedAt: currentNote?.updatedAt };
          },
        };
      },
      authorizeReplay: async (data, receipt) => {
        // A successful delete receipt is a metadata tombstone; the resource is
        // expected to be absent. Active-account authorization still runs first.
        if (input.action !== "delete") {
          if (input.kind === "collection") await data.getCollection(receipt.entityId);
          else await data.getTag(receipt.entityId);
        }
      },
    });
  } catch (error) {
    if (isDuplicateName(error)) throw new DuplicateOrganizationNameError();
    throw error;
  }
  if (input.action === "delete") return { entityId: result.entityId, affectedCount: result.affectedCount, revision: result.revision ?? undefined, updatedAt: result.resultUpdatedAt ?? undefined, replayed: result.replayed };
  const current = await withPrivateData((data) => input.kind === "collection" ? data.getCollection(result.entityId) : data.getTag(result.entityId));
  return { entityId: current.id, displayName: current.displayName };
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
