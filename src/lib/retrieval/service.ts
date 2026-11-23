import "server-only";

import { and, eq } from "drizzle-orm";
import { retrievalVersions } from "@/lib/db/schema";
import { CHUNK_FORMAT } from "./chunks";

import { requireAppUser } from "@/lib/auth/app-user";
import { withDbTransaction } from "@/lib/db/transaction";
import { indexSource, requireActiveOwner, type Source } from "./index-core";
import { retrieveSources } from "./search-core";

export async function indexPrivateSource(source: Source) {
  const owner = await requireAppUser("throw");
  return withDbTransaction(tx => indexSource(tx, owner.id, source));
}

export async function retrievePrivateSources(query: string) {
  const owner = await requireAppUser("throw");
  return withDbTransaction(tx => retrieveSources(tx, owner.id, query));
}

export async function getIndexedRevision(source: Source) {
  const owner = await requireAppUser("throw");
  return withDbTransaction(async tx => {
    await requireActiveOwner(tx, owner.id);
    const sourceColumn = source.kind === "note" ? retrievalVersions.noteId : retrievalVersions.referenceId;
    const [version] = await tx.select({ revision: retrievalVersions.revision }).from(retrievalVersions)
      .where(and(eq(retrievalVersions.ownerId, owner.id), eq(sourceColumn, source.id), eq(retrievalVersions.format, CHUNK_FORMAT)));
    return version?.revision ?? null;
  });
}
