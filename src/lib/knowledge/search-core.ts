import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { notes, references, noteTags, referenceTags, collections, tags } from "../db/schema.ts";
import type { DbTransaction } from "../db/transaction-session.ts";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const timestamp = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{6}Z$/;
type Kind = "note" | "reference";

export class InvalidKnowledgeSearch extends Error {}

export function parseKnowledgeSearch(params: Record<string, string | string[] | undefined>) {
  const { q, type = "all", collection, tag, sort, view = "list", cursor } = params;
  if ([q, collection, cursor].some(Array.isArray) ||
    (type !== "all" && type !== "note" && type !== "reference") ||
    (sort !== undefined && sort !== "" && sort !== "recent" && sort !== "relevance") ||
    (view !== "list" && view !== "grid")) throw new InvalidKnowledgeSearch();

  const query = (typeof q === "string" ? q : "").trim();
  const collectionId = typeof collection === "string" ? collection.toLowerCase() || null : null;
  const tagIds = (typeof tag === "string" ? [tag] : tag ?? []).map((id) => id.toLowerCase()).sort();
  if (Array.from(query).length > 200 || /[\u0000\uD800-\uDFFF]/u.test(query) ||
    (collectionId && !uuid.test(collectionId)) || tagIds.length > 20 ||
    tagIds.some((id) => !uuid.test(id)) || new Set(tagIds).size !== tagIds.length) throw new InvalidKnowledgeSearch();
  return {
    query, collectionId, tagIds, type: type as Kind | "all", view: view as "list" | "grid",
    sort: query && sort !== "recent" ? "relevance" as const : "recent" as const,
    cursor: typeof cursor === "string" ? cursor : undefined,
  };
}

type Filters = ReturnType<typeof parseKnowledgeSearch>;
type Key = { rank: number; time: string; kind: Kind; id: string };

function readCursor(cursor: string, context: string): Key {
  if (cursor.length > 320 || !/^[\w-]+$/.test(cursor)) throw new InvalidKnowledgeSearch();
  try {
    const [version, fingerprint, rank, time, kind, id] = JSON.parse(Buffer.from(cursor, "base64url").toString());
    if (version === 1 && fingerprint === context && typeof rank === "number" && rank >= 0 && rank <= 1 &&
      typeof time === "string" && timestamp.test(time) &&
      new Date(time).toISOString() === time.replace(/(\.\d{3})\d{3}Z$/, "$1Z") &&
      (kind === "note" || kind === "reference") && typeof id === "string" && uuid.test(id)) {
      return { rank, time, kind, id };
    }
  } catch {
    // Invalid encodings and invalid timestamps use the same reset state.
  }
  throw new InvalidKnowledgeSearch();
}

type Choice = { id: string; displayName: string };
type SearchRow = Key & { title: string; excerpt: string; url: string | null; collection: Choice | null; tags: Choice[] };

export async function queryKnowledge(tx: DbTransaction, ownerId: string, filters: Filters) {
  const { query, type, collectionId, tagIds, sort, cursor } = filters;
  const context = createHash("sha256").update(JSON.stringify([ownerId, query, type, collectionId, tagIds, sort])).digest("hex");
  const after = cursor === undefined ? undefined : readCursor(cursor, context);
  const pageSize = 20;
  const textQuery = sql`plainto_tsquery('simple', ${query})`;

  function projection(kind: Kind) {
    const table = kind === "note" ? notes : references;
    const association = kind === "note" ? noteTags : referenceTags;
    const itemId = kind === "note" ? noteTags.noteId : referenceTags.referenceId;
    const content = kind === "note"
      ? sql`regexp_replace(${notes.body}, ${'(^|\n)[ \t]{0,3}(#{1,6}|>|[-+*])[ \t]+|[\x60*_~]'}, ' ', 'g')`
      : sql`${references.description}`;
    const weighted = (value: ReturnType<typeof sql>, weight: string) =>
      sql`setweight(to_tsvector('simple', ${value}), ${weight}::"char")`;
    const title = weighted(sql`${table.title}`, "A");
    const body = weighted(content, "C");
    const extra = kind === "note"
      ? weighted(sql`coalesce(array_to_string(array(select parts[1] from regexp_matches(${notes.body}, ${'^ {0,3}#{1,6}[ \t]+([^\n]+)'}, 'gn') as heading(parts)), ' '), '')`, "B")
      : weighted(sql`${references.url}`, "D");
    return sql`
      select ${table.id} as id, ${kind}::text as kind, ${table.title} as title,
        left(regexp_replace(${content}, '[[:space:]]+', ' ', 'g'), 240) as excerpt,
        ${kind === "note" ? sql`null::text` : sql`${references.url}`} as url,
        ${table.collectionId} as collection_id, ${table.updatedAt} as updated_at,
        ${query ? sql`${title} || ${body} || ${extra}` : sql`null::tsvector`} as document
      from ${table}
      where ${table.ownerId} = ${ownerId}
        ${kind === "note" ? sql`and ${notes.deletedAt} is null` : sql.empty()}
        ${collectionId ? sql`and ${table.collectionId} = ${collectionId}` : sql.empty()}
        ${sql.join(tagIds.map((id) => sql`and exists (
          select 1 from ${association} where ${association.ownerId} = ${ownerId}
            and ${itemId} = ${table.id} and ${association.tagId} = ${id}
        )`), sql` `)}
    `;
  }

  const sources = type === "all" ? sql`${projection("note")} union all ${projection("reference")}` : projection(type);
  const rank = sort === "relevance" ? sql`ts_rank(document, ${textQuery}, 33)` : sql`0::real`;
  const boundary = after ? sql`where rank < ${after.rank}::real or (
    rank = ${after.rank}::real and (
      updated_at < ${after.time}::timestamptz or (updated_at = ${after.time}::timestamptz and (
        kind > ${after.kind} or (kind = ${after.kind} and id < ${after.id}::uuid)
      ))
    )
  )` : sql.empty();

  const { rows } = await tx.execute<SearchRow>(sql`
    with resources as (${sources}),
    ranked as (
      select *, ${rank} as rank from resources
      ${query ? sql`where document @@ ${textQuery}` : sql.empty()}
    ),
    page as (
      select * from ranked ${boundary}
      order by rank desc, updated_at desc, kind asc, id desc limit ${pageSize + 1}
    )
    select page.id, page.kind, page.title, page.excerpt, page.url, page.rank,
      to_char(page.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as time,
      case when ${collections.id} is not null then
        json_build_object('id', ${collections.id}, 'displayName', ${collections.displayName}) end as collection,
      coalesce((
        select json_agg(json_build_object('id', ${tags.id}, 'displayName', ${tags.displayName}) order by ${tags.normalizedName})
        from ${tags}
        join lateral (
          select ${noteTags.tagId} as tag_id from ${noteTags}
            where page.kind = 'note' and ${noteTags.ownerId} = ${ownerId} and ${noteTags.noteId} = page.id
          union all
          select ${referenceTags.tagId} as tag_id from ${referenceTags}
            where page.kind = 'reference' and ${referenceTags.ownerId} = ${ownerId} and ${referenceTags.referenceId} = page.id
        ) labels on labels.tag_id = ${tags.id}
        where ${tags.ownerId} = ${ownerId}
      ), '[]'::json) as tags
    from page
    left join ${collections} on ${collections.ownerId} = ${ownerId} and ${collections.id} = page.collection_id
    order by page.rank desc, page.updated_at desc, page.kind asc, page.id desc
  `);
  const items = rows.slice(0, pageSize);
  const last = items.at(-1);
  return {
    items,
    nextCursor: rows.length > pageSize && last
      ? Buffer.from(JSON.stringify([1, context, last.rank, last.time, last.kind, last.id])).toString("base64url")
      : null,
  };
}
