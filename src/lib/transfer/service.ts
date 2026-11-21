import "server-only";

import { sql } from "drizzle-orm";
import { requireAppUser } from "@/lib/auth/app-user";
import { openOwnedData } from "@/lib/db/owned-data";
import { withPrivateData } from "@/lib/db/private-data";
import { noteExportUsage, notes } from "@/lib/db/schema";
import { withDbTransaction } from "@/lib/db/transaction";
import { TransferInputError } from "./markdown";

const MAX_EXPORT_NOTES = 200;
const MAX_EXPORT_BYTES = 10 * 1024 * 1024;

export function exportMarkdownNote(id: string) {
  return withPrivateData((data) => data.getNote(id), "throw");
}

export async function exportNotesSnapshot() {
  const user = await requireAppUser("throw");
  const setting = process.env.COSMICCORE_BULK_EXPORTS_PER_HOUR ?? "5";
  if (!/^[1-9]\d{0,2}$/.test(setting)) throw new Error("Invalid bulk export limit.");

  return withDbTransaction(async (tx) => {
    await openOwnedData(tx, user.id);
    const clock = sql`statement_timestamp()`;
    const expired = sql`${noteExportUsage.windowStart} <= ${clock} - interval '1 hour'`;
    const [reserved] = await tx.insert(noteExportUsage)
      .values({ ownerId: user.id, windowStart: clock, used: 1 })
      .onConflictDoUpdate({
        target: noteExportUsage.ownerId,
        set: {
          windowStart: sql`case when ${expired} then ${clock} else ${noteExportUsage.windowStart} end`,
          used: sql`case when ${expired} then 1 else ${noteExportUsage.used} + 1 end`,
        },
        setWhere: sql`${expired} or ${noteExportUsage.used} < ${Number(setting)}`,
      }).returning({ used: noteExportUsage.used });
    if (!reserved) throw new TransferInputError("The bulk export limit was reached. Try again later.", 429);

    // Select metadata and payload in one statement snapshot. Do not transfer body
    // bytes if either archive limit would be exceeded.
    const { rows } = await tx.execute<{ id: string | null; title: string; body: string; allowed: boolean; asOf: string }>(sql`
      with selected as materialized (
        select ${notes.id} as id, ${notes.storageBytes} as bytes, ${notes.updatedAt} as updated_at
        from ${notes} where ${notes.ownerId} = ${user.id} and ${notes.deletedAt} is null
        order by ${notes.updatedAt} desc, ${notes.id} desc limit ${MAX_EXPORT_NOTES + 1}
      ), bounds as (
        select count(*) <= ${MAX_EXPORT_NOTES} and coalesce(sum(bytes), 0) <= ${MAX_EXPORT_BYTES} as allowed from selected
      )
      select payload.id, payload.title, payload.body, bounds.allowed,
        to_char(statement_timestamp() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as "asOf"
      from bounds left join lateral (
        select selected.id, selected.updated_at, ${notes.title} as title, ${notes.body} as body
        from selected join ${notes} on ${notes.id} = selected.id
        where bounds.allowed and ${notes.ownerId} = ${user.id}
      ) payload on true
      order by payload.updated_at desc, payload.id desc
    `);
    if (!rows[0].allowed) throw new TransferInputError("The active notes exceed the bulk export limit. Export individual notes instead.", 413);
    return { asOf: rows[0].asOf, notes: rows.flatMap(({ id, title, body }) => id === null ? [] : [{ id, title, body }]) };
  });
}
