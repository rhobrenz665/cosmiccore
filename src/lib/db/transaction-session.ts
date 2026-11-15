import { Client } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";

export type DbTransaction = Parameters<Parameters<NeonDatabase["transaction"]>[0]>[0];

// Internal transport shared with the manual check. Application services import
// the server-only withDbTransaction wrapper, never accept a browser-supplied URL.
export async function runTransaction<T>(
  connectionString: string,
  work: (tx: DbTransaction) => Promise<T>,
): Promise<T> {
  if (typeof globalThis.WebSocket !== "function") {
    throw new Error("Database transactions require Node.js 22 or newer with native WebSocket support.");
  }

  // A fresh client belongs to this operation only; close it even if connection,
  // BEGIN, callback, COMMIT or ROLLBACK fails. Never hold it across model calls.
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 5_000,
    query_timeout: 15_000,
  });
  client.on("error", () => {
    console.error("Database transaction connection failed.");
  });

  try {
    await client.connect();
    return await drizzle({ client }).transaction(async (tx) => {
      await tx.execute(sql`select
        set_config('statement_timeout', '10000', true),
        set_config('lock_timeout', '3000', true),
        set_config('idle_in_transaction_session_timeout', '10000', true)
      `);
      return work(tx);
    });
  } finally {
    try {
      await client.end();
    } catch {
      // A close error must not hide the transaction error or turn an already
      // committed mutation into an apparent failure. Never log driver secrets.
      console.error("Database transaction connection cleanup failed.");
    }
  }
}
