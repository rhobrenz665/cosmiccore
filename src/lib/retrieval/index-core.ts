import { and, eq, isNull } from "drizzle-orm";

import { DataAccessError } from "../db/owned-data.ts";
import { appUsers, notes, references, retrievalChunks, retrievalVersions } from "../db/schema.ts";
import type { DbTransaction } from "../db/transaction-session.ts";
import { CHUNK_FORMAT, prepareSource } from "./chunks.ts";

export type Source = { kind: "note" | "reference"; id: string };

async function requireActiveOwner(tx: DbTransaction, ownerId: string) {
  const [account] = await tx.select({ status: appUsers.status }).from(appUsers)
    .where(eq(appUsers.id, ownerId)).for("share");
  if (account?.status !== "active") throw new DataAccessError("ACCOUNT_UNAVAILABLE");
}

// One bounded source per transaction. The source lock is released on abort,
// leaving the previous version intact; the reader checks live revision.
export async function indexSource(tx: DbTransaction, ownerId: string, source: Source) {
  await requireActiveOwner(tx, ownerId);
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(source.id)) throw new DataAccessError("VALIDATION");
  const [record] = source.kind === "note"
    ? await tx.select({ title: notes.title, body: notes.body, revision: notes.revision })
      .from(notes).where(and(eq(notes.ownerId, ownerId), eq(notes.id, source.id), isNull(notes.deletedAt))).for("update")
    : await tx.select({ title: references.title, body: references.description, revision: references.revision })
      .from(references).where(and(eq(references.ownerId, ownerId), eq(references.id, source.id))).for("update");
  if (!record) throw new DataAccessError("NOT_FOUND");

  const noteId = source.kind === "note" ? source.id : null;
  const referenceId = source.kind === "reference" ? source.id : null;
  const key = and(eq(retrievalVersions.ownerId, ownerId),
    eq(source.kind === "note" ? retrievalVersions.noteId : retrievalVersions.referenceId, source.id));
  const [previous] = await tx.select({ revision: retrievalVersions.revision, format: retrievalVersions.format })
    .from(retrievalVersions).where(key);
  if (previous?.revision === record.revision && previous.format === CHUNK_FORMAT) return record.revision;

  const { hash, chunks } = prepareSource(record.title, record.body);
  await tx.delete(retrievalVersions).where(key);
  const [version] = await tx.insert(retrievalVersions)
    .values({ ownerId, noteId, referenceId, revision: record.revision, format: CHUNK_FORMAT, hash })
    .returning({ id: retrievalVersions.id });
  for (let first = 0; first < chunks.length; first += 100) {
    await tx.insert(retrievalChunks).values(chunks.slice(first, first + 100)
      .map(chunk => ({ ownerId, versionId: version.id, ...chunk })));
  }
  return record.revision;
}

export { requireActiveOwner };
