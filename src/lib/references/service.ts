import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { withPrivateData } from "@/lib/db/private-data";
import { withPrivateMutation } from "@/lib/db/private-mutation";
import { noteReferences, references, referenceTags } from "@/lib/db/schema";
import { DataAccessError } from "@/lib/db/owned-data";
import { MAX_REFERENCE_TAGS, normalizeReference } from "./rules";

export class DuplicateReferenceError extends Error {
  readonly code = "DUPLICATE_REFERENCE";

  constructor(readonly existingReferenceId: string) {
    super("This URL is already saved.");
    this.name = "DuplicateReferenceError";
  }
}

export class ReferenceConflictError extends Error {
  readonly code = "CONFLICT";

  constructor() {
    super("The saved reference changed. Refresh and try again.");
    this.name = "ReferenceConflictError";
  }
}

export function getReference(referenceId: string, picker = false, after?: string) {
  return withPrivateData(async (data) => ({
    ...await data.getReference(referenceId),
    tagIds: await data.getReferenceTagIds(referenceId),
    linkedNotes: await data.listReferenceNotes(referenceId, picker, after),
    collections: await data.listCollections(),
    tags: await data.listTags(),
  }));
}

export function getReferenceLibrary(input: { before?: string; query?: string; collectionId?: string; tagIds: string[]; view: "grid" | "list" }) {
  const query = input.query?.trim() ?? "";
  if (Array.from(query).length > 200 || /[\u0000\uD800-\uDFFF]/u.test(query)) throw new DataAccessError("VALIDATION");
  const collectionId = input.collectionId?.toLowerCase() || null;
  const tagIds = [...new Set(input.tagIds.map((id) => id.toLowerCase()))].sort();
  return withPrivateData(async (data) => {
    await data.assertAssociations(collectionId, tagIds, MAX_REFERENCE_TAGS);
    return {
      ...await data.listReferences({ before: input.before, query, collectionId, tagIds, view: input.view }),
      collections: await data.listCollections(),
      tags: await data.listTags(),
    };
  });
}

type ReferenceFields = {
  mutationId: string;
  url: string;
  title: string;
  description?: string;
  collectionId: string | null;
  tagIds: string[];
};

type ReferenceRevision = { referenceId: string; expectedRevision: number; mutationId: string };

function validateRevision(revision: number) {
  if (!Number.isSafeInteger(revision) || revision < 1) throw new DataAccessError("VALIDATION");
}

export async function createReference(input: ReferenceFields) {
  const { storageBytes, tagIds, ...fields } = normalizeReference(input);
  const result = await withPrivateMutation({
    operation: "create_reference",
    mutationId: input.mutationId,
    payload: { ...fields, tagIds },
  }, {
    prepare: async (tx, ownerId, data) => {
      const existing = await data.findReferenceByUrlKey(fields.canonicalUrlKey);
      if (existing) throw new DuplicateReferenceError(existing.id);
      await data.assertAssociations(fields.collectionId, tagIds, MAX_REFERENCE_TAGS);

      return {
        changes: { references_count: 1, references_bytes: storageBytes },
        apply: async () => {
          const [saved] = await tx.insert(references).values({ ownerId, ...fields })
            .onConflictDoNothing({ target: [references.ownerId, references.canonicalUrlKey] })
            .returning({ entityId: references.id, revision: references.revision, resultUpdatedAt: references.updatedAt });
          if (!saved) {
            const duplicate = await data.findReferenceByUrlKey(fields.canonicalUrlKey);
            if (duplicate) throw new DuplicateReferenceError(duplicate.id);
            throw new ReferenceConflictError();
          }
          if (tagIds.length) {
            await tx.insert(referenceTags).values(tagIds.map((tagId) => ({ ownerId, referenceId: saved.entityId, tagId })));
          }
          return saved;
        },
      };
    },
    authorizeReplay: async (data, receipt) => { await data.getReference(receipt.entityId); },
  });

  return {
    referenceId: result.entityId,
    revision: result.revision,
    updatedAt: result.resultUpdatedAt,
  };
}

export async function updateReference(input: ReferenceFields & ReferenceRevision) {
  validateRevision(input.expectedRevision);
  const { storageBytes, tagIds, ...fields } = normalizeReference(input);
  const { referenceId, expectedRevision } = input;
  const result = await withPrivateMutation({
    operation: "update_reference",
    mutationId: input.mutationId,
    payload: { referenceId, expectedRevision, ...fields, tagIds },
  }, {
    prepare: async (tx, ownerId, data) => {
      const current = await data.getReference(referenceId);
      if (current.revision !== expectedRevision) throw new ReferenceConflictError();
      const duplicate = await data.findReferenceByUrlKey(fields.canonicalUrlKey);
      if (duplicate && duplicate.id !== current.id) throw new DuplicateReferenceError(duplicate.id);
      await data.assertAssociations(fields.collectionId, tagIds, MAX_REFERENCE_TAGS);
      return {
        changes: { references_bytes: storageBytes - current.storageBytes },
        apply: async () => {
          const [saved] = await tx.update(references)
            .set({ ...fields, revision: sql`${references.revision} + 1`, updatedAt: sql`clock_timestamp()` })
            .where(and(eq(references.ownerId, ownerId), eq(references.id, current.id), eq(references.revision, expectedRevision)))
            .returning({ entityId: references.id, revision: references.revision, resultUpdatedAt: references.updatedAt });
          if (!saved) throw new ReferenceConflictError();
          await tx.delete(referenceTags).where(and(eq(referenceTags.ownerId, ownerId), eq(referenceTags.referenceId, current.id)));
          if (tagIds.length) {
            await tx.insert(referenceTags).values(tagIds.map((tagId) => ({ ownerId, referenceId: current.id, tagId })));
          }
          return saved;
        },
      };
    },
    authorizeReplay: async (data, receipt) => { await data.getReference(receipt.entityId); },
  }).catch(async (error: unknown) => {
    // A concurrent writer outside the app can still race the duplicate precheck.
    let cause = error;
    for (let depth = 0; depth < 5 && cause && typeof cause === "object"; depth++) {
      const failure = cause as { code?: unknown; constraint?: unknown; cause?: unknown };
      if (failure.code === "23505" && failure.constraint === "references_owner_url_key") {
        const duplicate = await withPrivateData((data) => data.findReferenceByUrlKey(fields.canonicalUrlKey));
        if (duplicate && duplicate.id.toLowerCase() !== referenceId.toLowerCase()) {
          throw new DuplicateReferenceError(duplicate.id);
        }
        throw new ReferenceConflictError();
      }
      cause = failure.cause;
    }
    throw error;
  });
  return { referenceId: result.entityId, revision: result.revision, updatedAt: result.resultUpdatedAt };
}

export async function deleteReference({ referenceId, expectedRevision, mutationId }: ReferenceRevision) {
  validateRevision(expectedRevision);
  const result = await withPrivateMutation({
    operation: "delete_reference",
    mutationId,
    payload: { referenceId, expectedRevision },
  }, {
    prepare: async (tx, ownerId, data) => {
      const current = await data.getReference(referenceId);
      if (current.revision !== expectedRevision) throw new ReferenceConflictError();
      return {
        changes: { references_count: -1, references_bytes: -current.storageBytes },
        apply: async () => {
          const [deleted] = await tx.delete(references)
            .where(and(eq(references.ownerId, ownerId), eq(references.id, current.id), eq(references.revision, expectedRevision)))
            .returning({ entityId: references.id });
          if (!deleted) throw new ReferenceConflictError();
          return deleted;
        },
      };
    },
    // The owned receipt remains valid after the reference has been removed.
    authorizeReplay: async () => {},
  });
  return { referenceId: result.entityId };
}

export async function setReferenceNoteLink(input: {
  referenceId: string; noteId: string; linked: boolean; mutationId: string;
}) {
  const { referenceId, noteId, linked, mutationId } = input;
  if (typeof linked !== "boolean") throw new DataAccessError("VALIDATION");
  const result = await withPrivateMutation({
    operation: linked ? "link_reference_note" : "unlink_reference_note",
    mutationId,
    payload: { referenceId, noteId },
  }, {
    prepare: async (tx, ownerId, data) => {
      const reference = await data.getReference(referenceId);
      const note = await data.lockNoteForUpdate(noteId);
      return {
        changes: {},
        apply: async () => {
          if (linked) {
            await tx.insert(noteReferences).values({ ownerId, noteId: note.id, referenceId: reference.id }).onConflictDoNothing();
          } else {
            await tx.delete(noteReferences).where(and(eq(noteReferences.ownerId, ownerId),
              eq(noteReferences.noteId, note.id), eq(noteReferences.referenceId, reference.id)));
          }
          return { entityId: reference.id };
        },
      };
    },
    authorizeReplay: async (data, receipt) => {
      await data.getReference(receipt.entityId);
      await data.getNote(noteId);
    },
  });
  return { referenceId: result.entityId };
}
