import { randomUUID } from "node:crypto";
import { and, asc, eq, gt, lte, sql } from "drizzle-orm";
import {
  accountDeletionIntents, accountDeletionJobs, appUsers, collections, globalQuotaUsage,
  mutationReceipts, noteExportUsage, notes, quotaUsage, references, tags,
} from "../db/schema.ts";
import type { DbTransaction } from "../db/transaction-session.ts";

type RunTransaction = <T>(work: (tx: DbTransaction) => Promise<T>) => Promise<T>;
const clock = sql`clock_timestamp()`;
const epoch = new Date(0);

export async function processAccountDeletions(
  transact: RunTransaction,
  issuer: string,
  removeAuthUser: (subject: string) => Promise<void>,
  limit = 5,
) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new Error("Invalid deletion batch size.");
  const { candidates, overdue } = await transact(async (tx) => {
    // Also bound retention maintenance. Completed accounts retain only the
    // provider identity as a short-lived deny record for stale sessions.
    await tx.execute(sql`delete from ${accountDeletionIntents} where owner_id in (
      select owner_id from ${accountDeletionIntents} where expires_at <= ${clock}
      order by expires_at limit 100 for update skip locked
    )`);
    await tx.execute(sql`delete from ${appUsers} where auth_issuer = ${issuer} and status = 'blocked' and id in (
      select ${accountDeletionJobs.ownerId} from ${accountDeletionJobs}
      where ${accountDeletionJobs.stage} = 'complete'
        and ${accountDeletionJobs.completedAt} <= ${clock} - interval '7 days'
        and exists (select 1 from ${appUsers} where ${appUsers.id} = ${accountDeletionJobs.ownerId}
          and ${appUsers.authIssuer} = ${issuer})
      order by ${accountDeletionJobs.completedAt} limit 100
    )`);

    const [counts] = (await tx.execute<{ overdue: number }>(sql`
      select count(*)::int as overdue from ${accountDeletionJobs} join ${appUsers}
        on ${accountDeletionJobs.ownerId} = ${appUsers.id}
      where ${appUsers.authIssuer} = ${issuer} and ${accountDeletionJobs.stage} <> 'complete'
        and ${accountDeletionJobs.requestedAt} <= ${clock} - interval '7 days'
    `)).rows;
    const candidates = await tx.select({ ownerId: accountDeletionJobs.ownerId })
      .from(accountDeletionJobs).innerJoin(appUsers, eq(appUsers.id, accountDeletionJobs.ownerId))
      .where(and(eq(appUsers.authIssuer, issuer), eq(appUsers.status, "deletion_pending"),
        sql`${accountDeletionJobs.stage} <> 'complete'`, lte(accountDeletionJobs.availableAt, clock)))
      .orderBy(asc(accountDeletionJobs.availableAt), asc(accountDeletionJobs.ownerId)).limit(limit);
    return { candidates, overdue: counts.overdue };
  });

  let completed = 0;
  let failed = 0;
  for (const { ownerId } of candidates) {
    const lease = randomUUID();
    const ownJob = eq(accountDeletionJobs.ownerId, ownerId);
    try {
      const claimed = await transact(async (tx) => {
        // Match the lock order used by note purge and quota-accounted writes.
        await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`cosmiccore:mutation:${ownerId}`}, 0))`);
        // Use the same row lock that makes the immediate access block atomic.
        const [account] = await tx.select({
          subject: appUsers.authSubject, status: appUsers.status,
        }).from(appUsers).where(and(eq(appUsers.id, ownerId), eq(appUsers.authIssuer, issuer))).for("update");
        if (account?.status !== "deletion_pending") return null;
        const [job] = await tx.select().from(accountDeletionJobs)
          .where(and(ownJob, sql`${accountDeletionJobs.stage} <> 'complete'`, lte(accountDeletionJobs.availableAt, clock))).for("update");
        if (!job) return null;
        if (job.stage === "queued") {
          const usage = await tx.select().from(quotaUsage)
            .where(and(eq(quotaUsage.ownerId, ownerId), eq(quotaUsage.windowStart, epoch), gt(quotaUsage.used, 0)))
            .orderBy(asc(quotaUsage.metric));
          for (const { metric, used } of usage) {
            const [changed] = await tx.update(globalQuotaUsage).set({ used: sql`${globalQuotaUsage.used} - ${used}` })
              .where(and(eq(globalQuotaUsage.metric, metric), eq(globalQuotaUsage.windowStart, epoch),
                sql`${globalQuotaUsage.used} >= ${used}`)).returning({ metric: globalQuotaUsage.metric });
            if (!changed) throw new Error("Quota reconciliation failed.");
          }
          // Existing FK cascades remove note/reference links and tag edges.
          await tx.delete(notes).where(eq(notes.ownerId, ownerId));
          await tx.delete(references).where(eq(references.ownerId, ownerId));
          await tx.delete(collections).where(eq(collections.ownerId, ownerId));
          await tx.delete(tags).where(eq(tags.ownerId, ownerId));
          await tx.delete(quotaUsage).where(eq(quotaUsage.ownerId, ownerId));
          await tx.delete(mutationReceipts).where(eq(mutationReceipts.ownerId, ownerId));
          await tx.delete(noteExportUsage).where(eq(noteExportUsage.ownerId, ownerId));
          await tx.update(appUsers).set({
            email: "", displayName: null, avatarUrl: null, appearance: "cosmic", colorScheme: "system", preferencesRevision: 1,
          }).where(eq(appUsers.id, ownerId));
        }
        await tx.update(accountDeletionJobs).set({
          stage: "provider_pending", lease, availableAt: sql`${clock} + interval '2 minutes'`,
          attempts: sql`${accountDeletionJobs.attempts} + 1`, lastError: null,
        }).where(ownJob);
        return account.subject;
      });
      if (!claimed) continue;

      try {
        await removeAuthUser(claimed);
      } catch {
        await transact(async (tx) => {
          await tx.update(accountDeletionJobs).set({
            lease: null, lastError: "provider_retry",
            availableAt: sql`${clock} + least(3600, 30 * power(2, least(${accountDeletionJobs.attempts}, 7))) * interval '1 second'`,
          }).where(and(ownJob, eq(accountDeletionJobs.lease, lease)));
        });
        failed++;
        continue;
      }

      const done = await transact(async (tx) => {
        await tx.select({ id: appUsers.id }).from(appUsers).where(eq(appUsers.id, ownerId)).for("update");
        const [finished] = await tx.update(accountDeletionJobs).set({
          stage: "complete", lease: null, completedAt: clock, lastError: null,
        }).where(and(ownJob, eq(accountDeletionJobs.lease, lease))).returning({ id: accountDeletionJobs.id });
        if (!finished) return false;
        await tx.update(appUsers).set({ status: "blocked" }).where(eq(appUsers.id, ownerId));
        await tx.delete(accountDeletionIntents).where(eq(accountDeletionIntents.ownerId, ownerId));
        return true;
      });
      if (done) completed++;
    } catch {
      failed++;
      await transact(async (tx) => {
        await tx.update(accountDeletionJobs).set({
          lastError: "database_retry", availableAt: sql`${clock} + interval '2 minutes'`,
        }).where(and(ownJob, sql`${accountDeletionJobs.stage} <> 'complete'`,
          sql`(${accountDeletionJobs.lease} is null or ${accountDeletionJobs.lease} = ${lease})`));
      }).catch(() => {});
    }
  }
  return { scanned: candidates.length, completed, failed, overdue };
}
