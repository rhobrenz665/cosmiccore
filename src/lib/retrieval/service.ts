import "server-only";

import { requireAppUser } from "@/lib/auth/app-user";
import { withDbTransaction } from "@/lib/db/transaction";
import { indexSource, type Source } from "./index-core";
import { retrieveSources } from "./search-core";

export async function indexPrivateSource(source: Source) {
  const owner = await requireAppUser("throw");
  await withDbTransaction(tx => indexSource(tx, owner.id, source));
}

export async function retrievePrivateSources(query: string) {
  const owner = await requireAppUser("throw");
  return withDbTransaction(tx => retrieveSources(tx, owner.id, query));
}
