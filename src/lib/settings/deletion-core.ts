import { createHash } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { accountDeletionIntents, accountDeletionJobs, appUsers } from "../db/schema.ts";
import { DataAccessError } from "../db/owned-data.ts";
import type { DbTransaction } from "../db/transaction-session.ts";

const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export async function beginDeletion(tx: DbTransaction, ownerId: string, sessionId: string, token: string) {
  const [account] = await tx.select({ status: appUsers.status }).from(appUsers).where(eq(appUsers.id, ownerId)).for("update");
  if (account?.status !== "active") throw new DataAccessError("ACCOUNT_UNAVAILABLE");
  const values = {
    tokenHash: hash(token), originalSessionHash: hash(sessionId),
    createdAt: sql`clock_timestamp()`, expiresAt: sql`clock_timestamp() + interval '5 minutes'`,
  };
  await tx.insert(accountDeletionIntents).values({ ownerId, ...values }).onConflictDoUpdate({
    target: accountDeletionIntents.ownerId, set: values,
  });
}

export async function confirmDeletion(tx: DbTransaction, proof: {
  issuer: string; subject: string; token: string; sessionId: string; sessionCreatedAt: Date;
}) {
  if (!Number.isFinite(proof.sessionCreatedAt.getTime())) return false;
  const [account] = await tx.select({ id: appUsers.id, status: appUsers.status }).from(appUsers)
    .where(and(eq(appUsers.authIssuer, proof.issuer), eq(appUsers.authSubject, proof.subject))).for("update");
  if (!account) return false;

  const [intent] = await tx.select({ ownerId: accountDeletionIntents.ownerId }).from(accountDeletionIntents)
    .where(and(
      eq(accountDeletionIntents.ownerId, account.id),
      eq(accountDeletionIntents.tokenHash, hash(proof.token)),
      sql`${accountDeletionIntents.originalSessionHash} <> ${hash(proof.sessionId)}`,
      sql`${accountDeletionIntents.expiresAt} > clock_timestamp()`,
      sql`${accountDeletionIntents.createdAt} <= ${proof.sessionCreatedAt.toISOString()}::timestamptz`,
      sql`${proof.sessionCreatedAt.toISOString()}::timestamptz <= clock_timestamp() + interval '5 seconds'`,
    ));
  if (!intent) return false;
  // Keep the consumed intent until expiry so a lost response can be acknowledged.
  // The account lock and durable job make subsequent confirmations no-ops.
  if (account.status === "deletion_pending") {
    const [job] = await tx.select({ id: accountDeletionJobs.id }).from(accountDeletionJobs).where(eq(accountDeletionJobs.ownerId, account.id));
    return !!job;
  }
  if (account.status !== "active") return false;
  await tx.update(appUsers).set({ status: "deletion_pending", updatedAt: sql`clock_timestamp()` }).where(eq(appUsers.id, account.id));
  await tx.insert(accountDeletionJobs).values({ ownerId: account.id });
  return true;
}
