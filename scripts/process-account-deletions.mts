import { sql } from "drizzle-orm";
import { processAccountDeletions } from "../src/lib/settings/cleanup.ts";
import { runTransaction } from "../src/lib/db/transaction-session.ts";

async function run() {
  const { DATABASE_URL, NEON_AUTH_BASE_URL, NEON_DELETION_API_KEY, NEON_DELETION_PROJECT_ID, NEON_DELETION_BRANCH_ID } = process.env;
  if (!DATABASE_URL || !NEON_AUTH_BASE_URL || !NEON_DELETION_API_KEY ||
      !NEON_DELETION_PROJECT_ID || !/^[a-z][a-z0-9-]+$/.test(NEON_DELETION_PROJECT_ID) ||
      !NEON_DELETION_BRANCH_ID || !/^br-[a-z0-9-]+$/.test(NEON_DELETION_BRANCH_ID)) {
    throw new Error("Configure the paired database, Auth issuer, project, branch and worker key.");
  }
  const auth = new URL(NEON_AUTH_BASE_URL);
  const db = new URL(DATABASE_URL);
  const api = `https://console.neon.tech/api/v2/projects/${NEON_DELETION_PROJECT_ID}/branches/${NEON_DELETION_BRANCH_ID}`;
  const options = { headers: { Authorization: `Bearer ${NEON_DELETION_API_KEY}` }, redirect: "error" as const };

  async function get(path: string) {
    const response = await fetch(api + path, { ...options, signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error("Neon branch configuration could not be verified.");
    return response.json();
  }

  const config = await get("/auth");
  const { endpoints } = await get("/endpoints");
  const computeId = db.hostname.split(".")[0].replace(/-pooler$/, "");
  if (auth.protocol !== "https:" || auth.href.replace(/\/$/, "") !== config.base_url?.replace(/\/$/, "") ||
      config.auth_provider !== "better_auth" || config.branch_id !== NEON_DELETION_BRANCH_ID ||
      config.db_name !== decodeURIComponent(db.pathname.slice(1)) ||
      !endpoints?.some((endpoint: { id: string; host: string; branch_id: string }) =>
        endpoint.id === computeId && endpoint.branch_id === NEON_DELETION_BRANCH_ID &&
        db.hostname.replace("-pooler.", ".") === endpoint.host)) {
    throw new Error("Database and Neon Auth do not match the configured branch.");
  }

  const report = await processAccountDeletions((work) => runTransaction(DATABASE_URL, work), NEON_AUTH_BASE_URL, async (subject) => {
    const response = await fetch(api + "/auth/users/" + encodeURIComponent(subject), {
      ...options, method: "DELETE", signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok && response.status !== 404) {
      throw new Error("Neon Auth deletion request failed.");
    }

    // Both successful requests and replays must leave the managed identity absent.
    const exists = await runTransaction(DATABASE_URL, async (tx) => {
      const { rows } = await tx.execute<{ exists: boolean }>(sql`select exists (
        select 1 from neon_auth."user" where id::text = ${subject}
      ) as exists`);
      return rows[0].exists;
    });
    if (exists) throw new Error("Neon Auth deletion could not be verified.");
  });
  console.log("Account deletion cleanup", report);
  if (report.failed || report.overdue) process.exitCode = 1;
}

run().catch(() => {
  console.error("Account deletion cleanup failed. Check the configured database, branch, Auth issuer and worker access.");
  process.exitCode = 1;
});
