import "server-only";

import { requireAppUser } from "@/lib/auth/app-user";
import { openOwnedData, type OwnedData } from "@/lib/db/owned-data";
import { withDbTransaction } from "@/lib/db/transaction";

// Trusted server code only. This module exposes no raw client, owner parameter,
// dynamic table selection or write method. Await all work inside the callback.
export async function withPrivateData<T>(work: (data: OwnedData) => Promise<T>, failure?: "throw"): Promise<T> {
  const user = await requireAppUser(failure);
  return withDbTransaction(async (tx) => work(await openOwnedData(tx, user.id)));
}

export const getPrivateNote = (id: string) => withPrivateData((data) => data.getNote(id));
export const getPrivateReference = (id: string) => withPrivateData((data) => data.getReference(id));
export const getPrivateCollection = (id: string) => withPrivateData((data) => data.getCollection(id));
export const getPrivateTag = (id: string) => withPrivateData((data) => data.getTag(id));
