import { and, desc, eq, inArray, isNull } from "drizzle-orm";

import { appUsers, collections, noteTags, notes, references, tags } from "./schema.ts";
import { MAX_TAGS_PER_NOTE } from "../notes/rules.ts";
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

  return {
    async listNotes() {
      return tx.select({
        id: notes.id, title: notes.title, body: notes.body, revision: notes.revision,
        createdAt: notes.createdAt, updatedAt: notes.updatedAt,
      }).from(notes).where(and(eq(notes.ownerId, ownerId), isNull(notes.deletedAt)))
        .orderBy(desc(notes.updatedAt), desc(notes.id)).limit(200);
    },
    async listCollections() {
      return tx.select({ id: collections.id, displayName: collections.displayName })
        .from(collections).where(eq(collections.ownerId, ownerId)).orderBy(collections.normalizedName).limit(50);
    },
    async listTags() {
      return tx.select({ id: tags.id, displayName: tags.displayName })
        .from(tags).where(eq(tags.ownerId, ownerId)).orderBy(tags.normalizedName).limit(100);
    },
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
        revision: references.revision, createdAt: references.createdAt, updatedAt: references.updatedAt,
      }).from(references).where(and(eq(references.ownerId, ownerId), eq(references.id, id)));
      if (!reference) throw new DataAccessError("NOT_FOUND");
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
    async assertAssociations(collectionId: string | null, tagIds: readonly string[]) {
      if (collectionId !== null) validateId(collectionId);
      if (!Array.isArray(tagIds) || tagIds.length > MAX_TAGS_PER_NOTE) throw new DataAccessError("VALIDATION");
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
