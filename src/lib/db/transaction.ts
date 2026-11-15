import "server-only";

import { runTransaction, type DbTransaction } from "@/lib/db/transaction-session";

export type { DbTransaction } from "@/lib/db/transaction-session";

export async function withDbTransaction<T>(work: (tx: DbTransaction) => Promise<T>): Promise<T> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to access application data.");
  }

  // Authorization will be provided by the next service layer, not this driver.
  return runTransaction(databaseUrl, work);
}
