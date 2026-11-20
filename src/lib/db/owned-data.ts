import { createHash } from "node:crypto";
import { and, desc, eq, gt, inArray, isNull, isNotNull, sql } from "drizzle-orm";

import { appUsers, collections, noteReferences, noteTags, notes, references, referenceTags, tags } from "./schema.ts";
import { MAX_TAGS_PER_NOTE } from "../notes/rules.ts";
import { queryKnowledge } from "../knowledge/search-core.ts";
import type { DbTransaction } from "./transaction-session.ts";

export class DataAccessError extends Error {
  readonly code: "ACCOUNT_UNAVAILABLE" | "NOT_FOUND" | "VALIDATION";

  constructor(code: DataAccessError["code"]) {
    super(code === "VALIDATION" ? "Invalid resource identifier or associations." : code === "NOT_FOUND" ? "Resource not found." : "Account unavailable.");
    this.name = "DataAccessError";
    this.code = code;
  }
}

function validateId(value: unknown): asserts value is string {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new DataAccessError("VALIDATION");
  }
}

// Internal core for server services and the manual check. ownerId must come from
// verified session mapping, never request input. The caller owns the transaction.
export async function openOwnedData(tx: DbTransaction, ownerId: string) {
  validateId(ownerId);
  const [account] = await tx.select({ status: appUsers.status }).from(appUsers)
    .where(eq(appUsers.id, ownerId)).for("share");

  if (!account || account.status !== "active") throw new DataAccessError("ACCOUNT_UNAVAILABLE");
  // Hold this lock through the operation. Status updates/deletion must wait;
  // once a block commits, later operations see and reject the blocked status.

  function listCollections(source = tx) {
    return source.select({ id: collections.id, displayName: collections.displayName })
      .from(collections).where(eq(collections.ownerId, ownerId)).orderBy(collections.normalizedName).limit(50);
  }

  function listTags(source = tx) {
    return source.select({ id: tags.id, displayName: tags.displayName })
      .from(tags).where(eq(tags.ownerId, ownerId)).orderBy(tags.normalizedName).limit(100);
  }

  return {
    searchKnowledge(filters: Parameters<typeof queryKnowledge>[2]) {
      return queryKnowledge(tx, ownerId, filters);
    },
    recentNotes() {
      return tx.transaction((region) => region.select({
        id: notes.id, title: notes.title, updatedAt: notes.updatedAt,
        updatedOrder: sql<string>`to_char(${notes.updatedAt} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`,
      }).from(notes).where(and(eq(notes.ownerId, ownerId), isNull(notes.deletedAt)))
        .orderBy(desc(notes.updatedAt), desc(notes.id)).limit(5));
    },
    recentReferences() {
      return tx.transaction(async (region) => {
        const items = await region.select({
          id: references.id, title: references.title, updatedAt: references.updatedAt,
          updatedOrder: sql<string>`to_char(${references.updatedAt} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`,
        }).from(references).where(eq(references.ownerId, ownerId))
          .orderBy(desc(references.updatedAt), desc(references.id)).limit(5);
        return { items, collections: await listCollections(region), tags: await listTags(region) };
      });
    },
    async listNotes() {
      return tx.select({
        id: notes.id, title: notes.title, body: notes.body, revision: notes.revision,
        createdAt: notes.createdAt, updatedAt: notes.updatedAt,
      }).from(notes).where(and(eq(notes.ownerId, ownerId), isNull(notes.deletedAt)))
        .orderBy(desc(notes.updatedAt), desc(notes.id)).limit(200);
    },
    async listTrash(cursor?: { deletedAt: string; id: string }) {
      if (cursor) {
        validateId(cursor.id);
        if (typeof cursor.deletedAt !== "string" || cursor.deletedAt.length > 64 || !Number.isFinite(Date.parse(cursor.deletedAt))) throw new DataAccessError("VALIDATION");
      }
      const rows = await tx.select({
        id: notes.id, title: notes.title, revision: notes.revision,
        deletedAt: notes.deletedAt, purgeAfter: notes.purgeAfter,
        cursorTime: sql<string>`${notes.deletedAt}::text`,
        expired: sql<boolean>`${notes.purgeAfter} <= clock_timestamp()`,
      }).from(notes).where(and(eq(notes.ownerId, ownerId), isNotNull(notes.deletedAt),
        cursor ? sql`(${notes.deletedAt}, ${notes.id}) < (${cursor.deletedAt}::timestamptz, ${cursor.id}::uuid)` : undefined))
        .orderBy(desc(notes.deletedAt), desc(notes.id)).limit(51);
      const items = rows.slice(0, 50);
      const last = items.at(-1);
      return { items, nextCursor: rows.length > 50 && last ? { deletedAt: last.cursorTime, id: last.id } : null };
    },
    async lockNoteLifecycle(id: string) {
      validateId(id);
      const [note] = await tx.select({ id: notes.id, revision: notes.revision, deletedAt: notes.deletedAt, purgeAfter: notes.purgeAfter })
        .from(notes).where(and(eq(notes.ownerId, ownerId), eq(notes.id, id))).for("update");
      if (!note) throw new DataAccessError("NOT_FOUND");
      return note;
    },
    listCollections: () => listCollections(),
    listTags: () => listTags(),
    async getNoteTagIds(noteId: string) {
      validateId(noteId);
      const rows = await tx.select({ tagId: noteTags.tagId }).from(noteTags)
        .where(and(eq(noteTags.ownerId, ownerId), eq(noteTags.noteId, noteId))).orderBy(noteTags.tagId);
      return rows.map((row) => row.tagId);
    },
    async getNote(id: string) {
      validateId(id);
      const [note] = await tx.select({
        id: notes.id, title: notes.title, body: notes.body,
        collectionId: notes.collectionId, revision: notes.revision,
        createdAt: notes.createdAt, updatedAt: notes.updatedAt,
      }).from(notes).where(and(eq(notes.ownerId, ownerId), eq(notes.id, id), isNull(notes.deletedAt)));
      if (!note) throw new DataAccessError("NOT_FOUND");
      return note;
    },
    async lockNoteForUpdate(id: string) {
      validateId(id);
      const [note] = await tx.select({
        id: notes.id, title: notes.title, body: notes.body, storageBytes: notes.storageBytes,
        collectionId: notes.collectionId, revision: notes.revision, updatedAt: notes.updatedAt,
      }).from(notes).where(and(eq(notes.ownerId, ownerId), eq(notes.id, id), isNull(notes.deletedAt))).for("update");
      if (!note) throw new DataAccessError("NOT_FOUND");
      return note;
    },
    async getReference(id: string) {
      validateId(id);
      const [reference] = await tx.select({
        id: references.id, url: references.url, title: references.title,
        description: references.description, collectionId: references.collectionId,
        storageBytes: references.storageBytes, revision: references.revision, createdAt: references.createdAt, updatedAt: references.updatedAt,
      }).from(references).where(and(eq(references.ownerId, ownerId), eq(references.id, id)));
      if (!reference) throw new DataAccessError("NOT_FOUND");
      return reference;
    },
    async listReferences({ before, query, collectionId, tagIds, view }: {
      before?: string; query: string; collectionId: string | null; tagIds: string[]; view: "grid" | "list";
    }) {
      const pageSize = 20;
      const context = createHash("sha256").update(JSON.stringify([ownerId, query, collectionId, tagIds, view])).digest("hex");
      const matches = and(
        eq(references.ownerId, ownerId),
        collectionId ? eq(references.collectionId, collectionId) : undefined,
        query ? sql`to_tsvector('simple', ${references.title} || ' ' || ${references.description} || ' ' || ${references.url}) @@ plainto_tsquery('simple', ${query})` : undefined,
        ...tagIds.map((tagId) => sql`exists (
          select 1 from ${referenceTags}
          where ${referenceTags.ownerId} = ${references.ownerId}
            and ${referenceTags.referenceId} = ${references.id} and ${referenceTags.tagId} = ${tagId}
        )`),
      );
      let cursor: { time: string; id: string } | undefined;
      if (before !== undefined) {
        if (before.length !== 101) throw new DataAccessError("VALIDATION");
        const [id, cursorContext] = before.split(".");
        validateId(id);
        if (cursorContext !== context) throw new DataAccessError("VALIDATION");
        [cursor] = await tx.select({ id: references.id, time: sql<string>`${references.updatedAt}::text` })
          .from(references).where(and(matches, eq(references.id, id)));
        if (!cursor) throw new DataAccessError("VALIDATION");
      }
      const rows = await tx.select({
        id: references.id, url: references.url, title: references.title,
        excerpt: sql<string>`left(${references.description}, 160)`,
      }).from(references).where(and(matches,
        cursor ? sql`(${references.updatedAt}, ${references.id}) < (${cursor.time}::timestamptz, ${cursor.id}::uuid)` : undefined))
        .orderBy(desc(references.updatedAt), desc(references.id)).limit(pageSize + 1);
      return { items: rows.slice(0, pageSize), nextCursor: rows.length > pageSize ? `${rows[pageSize - 1].id}.${context}` : null };
    },
    async listReferenceNotes(referenceId: string, picker: boolean, after?: string) {
      validateId(referenceId);
      if (after !== undefined) validateId(after);
      const rows = await tx.select({
        id: notes.id, title: notes.title, linked: sql<boolean>`${noteReferences.noteId} is not null`,
      }).from(notes).leftJoin(noteReferences, and(eq(noteReferences.ownerId, ownerId),
        eq(noteReferences.noteId, notes.id), eq(noteReferences.referenceId, referenceId)))
        .where(and(eq(notes.ownerId, ownerId), isNull(notes.deletedAt),
          picker ? undefined : isNotNull(noteReferences.noteId), after ? gt(notes.id, after) : undefined))
        .orderBy(notes.id).limit(21);
      return { items: rows.slice(0, 20), next: rows.length > 20 ? rows[19].id : null };
    },
    async listNoteReferences(noteId: string, after?: string) {
      validateId(noteId);
      if (after !== undefined) validateId(after);
      const rows = await tx.select({ id: references.id, title: references.title }).from(noteReferences)
        .innerJoin(notes, and(eq(notes.ownerId, noteReferences.ownerId), eq(notes.id, noteReferences.noteId)))
        .innerJoin(references, and(eq(references.ownerId, noteReferences.ownerId), eq(references.id, noteReferences.referenceId)))
        .where(and(eq(noteReferences.ownerId, ownerId), eq(noteReferences.noteId, noteId),
          isNull(notes.deletedAt), after ? gt(references.id, after) : undefined))
        .orderBy(references.id).limit(21);
      return { items: rows.slice(0, 20), next: rows.length > 20 ? rows[19].id : null };
    },
    async getReferenceTagIds(referenceId: string) {
      validateId(referenceId);
      const rows = await tx.select({ tagId: referenceTags.tagId }).from(referenceTags)
        .where(and(eq(referenceTags.ownerId, ownerId), eq(referenceTags.referenceId, referenceId)))
        .orderBy(referenceTags.tagId);
      return rows.map((row) => row.tagId);
    },
    async findReferenceByUrlKey(canonicalUrlKey: string) {
      const [reference] = await tx.select({ id: references.id }).from(references)
        .where(and(eq(references.ownerId, ownerId), eq(references.canonicalUrlKey, canonicalUrlKey)));
      return reference;
    },
    async getCollection(id: string) {
      validateId(id);
      const [collection] = await tx.select({
        id: collections.id, displayName: collections.displayName, normalizedName: collections.normalizedName,
      }).from(collections).where(and(eq(collections.ownerId, ownerId), eq(collections.id, id)));
      if (!collection) throw new DataAccessError("NOT_FOUND");
      return collection;
    },
    async lockCollectionForUpdate(id: string) {
      validateId(id);
      const [collection] = await tx.select({ id: collections.id, displayName: collections.displayName })
        .from(collections).where(and(eq(collections.ownerId, ownerId), eq(collections.id, id))).for("update");
      if (!collection) throw new DataAccessError("NOT_FOUND");
      return collection;
    },
    async getTag(id: string) {
      validateId(id);
      const [tag] = await tx.select({
        id: tags.id, displayName: tags.displayName, normalizedName: tags.normalizedName,
      }).from(tags).where(and(eq(tags.ownerId, ownerId), eq(tags.id, id)));
      if (!tag) throw new DataAccessError("NOT_FOUND");
      return tag;
    },
    async lockTagForUpdate(id: string) {
      validateId(id);
      const [tag] = await tx.select({ id: tags.id, displayName: tags.displayName })
        .from(tags).where(and(eq(tags.ownerId, ownerId), eq(tags.id, id))).for("update");
      if (!tag) throw new DataAccessError("NOT_FOUND");
      return tag;
    },
    async assertAssociations(collectionId: string | null, tagIds: readonly string[], maxTags = MAX_TAGS_PER_NOTE) {
      if (collectionId !== null) validateId(collectionId);
      if (!Array.isArray(tagIds) || tagIds.length > maxTags) throw new DataAccessError("VALIDATION");
      for (const id of tagIds) validateId(id);
      const normalizedIds = tagIds.map((id) => id.toLowerCase());
      if (new Set(normalizedIds).size !== normalizedIds.length) throw new DataAccessError("VALIDATION");
      if (collectionId !== null) {
        const [collection] = await tx.select({ id: collections.id }).from(collections)
          .where(and(eq(collections.ownerId, ownerId), eq(collections.id, collectionId))).for("key share");
        if (!collection) throw new DataAccessError("NOT_FOUND");
      }
      if (normalizedIds.length) {
        const ownedTags = await tx.select({ id: tags.id }).from(tags)
          .where(and(eq(tags.ownerId, ownerId), inArray(tags.id, normalizedIds)))
          .orderBy(tags.id).for("key share");
        if (ownedTags.length !== normalizedIds.length) throw new DataAccessError("NOT_FOUND");
      }
    },
  };
}

export type OwnedData = Awaited<ReturnType<typeof openOwnedData>>;
