import { sql } from "drizzle-orm";

import { DataAccessError } from "../db/owned-data.ts";
import type { DbTransaction } from "../db/transaction-session.ts";
import { CHUNK_FORMAT } from "./chunks.ts";
import { requireActiveOwner } from "./index-core.ts";

export type RetrievalMatch = {
  kind: "note" | "reference";
  sourceId: string;
  revision: number;
  ordinal: number;
  title: string;
  heading: string | null;
  text: string;
};

export async function retrieveSources(tx: DbTransaction, ownerId: string, input: string) {
  const query = input.trim();
  if (!query || query.length > 1000 || query.includes("\0")) throw new DataAccessError("VALIDATION");
  await requireActiveOwner(tx, ownerId);

  const { rows } = await tx.execute<RetrievalMatch>(sql`
    with search_query as (select plainto_tsquery('simple', ${query}) as terms),
    eligible as (
      select v.id, case when n.id is not null then 'note' else 'reference' end as kind,
        coalesce(n.id, r.id) as source_id, v.revision::float8 as revision,
        coalesce(n.title, r.title) as title
      from retrieval_versions v
      left join notes n on n.owner_id = v.owner_id and n.id = v.note_id
        and n.revision = v.revision and n.deleted_at is null
      left join "references" r on r.owner_id = v.owner_id and r.id = v.reference_id
        and r.revision = v.revision
      where v.owner_id = ${ownerId} and v.format = ${CHUNK_FORMAT}
        and (n.id is not null or r.id is not null)
    ), ranked as (
      select e.kind, e.source_id, e.revision, e.title, c.ordinal, c.heading, c.body,
        ts_rank_cd(document, q.terms, 32) as score
      from eligible e
      join retrieval_chunks c on c.owner_id = ${ownerId} and c.version_id = e.id
      cross join search_query q
      cross join lateral (
        select setweight(to_tsvector('simple', e.title), 'A')
          || setweight(to_tsvector('simple', coalesce(c.heading, '')), 'B')
          || setweight(to_tsvector('simple', c.body), 'D') as document
      ) as vectors
      where document @@ q.terms
    ), diverse as (
      select *, row_number() over (partition by kind, source_id order by score desc, ordinal) as position
      from ranked
    )
    select kind, source_id as "sourceId", revision, ordinal, title, heading, body as text
    from diverse where position <= 2
    order by score desc, kind, source_id, ordinal
    limit 6
  `);
  return rows;
}
