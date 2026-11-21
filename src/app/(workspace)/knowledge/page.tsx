import { randomUUID } from "node:crypto";
import Link from "next/link";
import { redirect, unstable_rethrow } from "next/navigation";
import { BookOpen, Link2 } from "lucide-react";
import { KnowledgeSearchForm } from "@/components/knowledge/search-form";
import { CreateNoteButton } from "@/components/notes/create-note-button";
import { ReferenceCaptureForm } from "@/components/references/capture-form";
import { ReferenceRetryButton } from "@/components/references/retry-button";
import { DataAccessError } from "@/lib/db/owned-data";
import { InvalidKnowledgeSearch, parseKnowledgeSearch } from "@/lib/knowledge/search-core";
import { searchKnowledge } from "@/lib/knowledge/service";
import { normalizeReferenceUrl, ReferenceInputError } from "@/lib/references/rules";

export const dynamic = "force-dynamic";

function referenceDestination(url: string | null) {
  if (url === null) return null;
  try {
    return new URL(normalizeReferenceUrl(url).url);
  } catch (error) {
    if (!(error instanceof ReferenceInputError)) throw error;
    return null;
  }
}

export default async function KnowledgePage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  let filters: ReturnType<typeof parseKnowledgeSearch>;
  let results: Awaited<ReturnType<typeof searchKnowledge>>;
  try {
    filters = parseKnowledgeSearch(params);
    results = await searchKnowledge(filters);
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof DataAccessError && error.code === "ACCOUNT_UNAVAILABLE") redirect("/auth/sign-in?error=account_unavailable");
    const invalid = error instanceof InvalidKnowledgeSearch ||
      error instanceof DataAccessError && (error.code === "VALIDATION" || error.code === "NOT_FOUND");
    const requestId = invalid ? null : randomUUID();
    if (requestId) console.error("Knowledge search failed.", { requestId });
    return <div className="page-wrap">
      <div className="page-heading"><h1>Knowledge</h1></div>
      <section className="note-state-card" role="alert">
        <h2>{invalid ? "Search or page unavailable" : "Knowledge could not be loaded"}</h2>
        <p>{invalid ? "Reset the search to remove invalid or outdated filters or pagination." : "Try again to load your saved work."}</p>
        {requestId && <p className="text-sm">Request ID {requestId}</p>}
        {invalid ? <Link className="secondary-link" href="/knowledge">Reset search</Link> : <ReferenceRetryButton />}
      </section>
    </div>;
  }

  const filtered = !!(filters.query || filters.collectionId || filters.tagIds.length || filters.type !== "all");
  function href(view = filters.view, cursor?: string) {
    const state = new URLSearchParams();
    if (filters.query) state.set("q", filters.query);
    if (filters.type !== "all") state.set("type", filters.type);
    if (filters.collectionId) state.set("collection", filters.collectionId);
    for (const tag of filters.tagIds) state.append("tag", tag);
    if (params.sort === "recent") state.set("sort", "recent");
    if (view === "grid") state.set("view", "grid");
    if (cursor) state.set("cursor", cursor);
    return state.size ? `/knowledge?${state}` : "/knowledge";
  }

  const date = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
  return <div className="page-wrap space-y-5">
    <header className="page-heading"><h1>Knowledge</h1></header>
    <KnowledgeSearchForm {...filters} sort={params.sort === "recent" ? "recent" : ""}
      collections={results.collections} tags={results.tags} filtered={filtered} />
    <nav className="flex flex-wrap gap-2" aria-label="Result view">
      <Link className="secondary-link" aria-current={filters.view === "list" ? "true" : undefined} href={href("list", filters.cursor)}>List view</Link>
      <Link className="secondary-link" aria-current={filters.view === "grid" ? "true" : undefined} href={href("grid", filters.cursor)}>Grid view</Link>
    </nav>
    {results.items.length ? (
      <section aria-labelledby="knowledge-results">
        <h2 id="knowledge-results" className="mb-3 font-semibold" aria-live="polite">
          {filtered ? "Search results" : "Recent knowledge"}
        </h2>
        <ul className={filters.view === "grid" ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-3" : "grid gap-3"}>
          {results.items.map((item) => {
            const isNote = item.kind === "note";
            const destination = referenceDestination(item.url);
            const Icon = isNote ? BookOpen : Link2;
            return <li key={`${item.kind}:${item.id}`} className="min-w-0 space-y-2 rounded-xl border border-border bg-card p-4 wrap-anywhere">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon size={16} aria-hidden="true" />{isNote ? "Note" : "Reference"}
              </div>
              <h3 className="font-semibold"><Link className="text-link" prefetch={false} href={`/${isNote ? "notes" : "references"}/${item.id}`}>{item.title || "Untitled"}</Link></h3>
              {item.excerpt && <p className="line-clamp-3 text-sm">{item.excerpt}</p>}
              {destination && <p className="text-sm">
                <a className="text-link" href={destination.href} target="_blank" rel="noopener noreferrer">Open {destination.hostname}<span className="sr-only"> (opens in a new tab)</span></a>
              </p>}
              {(item.collection || item.tags.length > 0) && <ul className="flex flex-wrap gap-2 text-sm" aria-label="Organization">
                {item.collection && <li><Link className="text-link" href={`/knowledge?collection=${item.collection.id}`}>{item.collection.displayName}<span className="sr-only"> collection</span></Link></li>}
                {item.tags.map((tag) => <li key={tag.id}><Link className="text-link" href={`/knowledge?tag=${tag.id}`}>{tag.displayName}<span className="sr-only"> tag</span></Link></li>)}
              </ul>}
              <time dateTime={item.time} className="block text-xs text-muted-foreground">{date.format(new Date(item.time))} UTC</time>
            </li>;
          })}
        </ul>
      </section>
    ) : (
      <section className="note-empty-state" aria-live="polite">
        <h2>{filtered ? "No matching knowledge" : filters.cursor ? "You’ve reached the end" : "Your Knowledge Base is empty"}</h2>
        {filtered ? <p>Try a different search or clear the filters.</p> : !filters.cursor && <>
          <p>Create a Markdown note or save a link you want to revisit.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <CreateNoteButton label="New note" />
            <Link className="secondary-link" href="/notes/import">Import Markdown</Link>
            <ReferenceCaptureForm first collections={results.collections} tags={results.tags} />
          </div>
        </>}
      </section>
    )}
    {(filters.cursor || results.nextCursor) && <nav className="flex flex-wrap gap-3" aria-label="Knowledge pages">
      {filters.cursor && <Link className="secondary-link" href={href()}>First page</Link>}
      {results.nextCursor && <Link className="secondary-link" href={href(filters.view, results.nextCursor)}>Next page</Link>}
    </nav>}
  </div>;
}
