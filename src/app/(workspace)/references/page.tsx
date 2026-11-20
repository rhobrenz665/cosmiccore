import Link from "next/link";
import { ArrowRight, Link2 } from "lucide-react";
import { unstable_rethrow } from "next/navigation";
import { ReferenceCaptureForm } from "@/components/references/capture-form";
import { Button } from "@/components/ui/button";
import { ReferenceRetryButton } from "@/components/references/retry-button";
import { DataAccessError } from "@/lib/db/owned-data";
import { getReferenceLibrary } from "@/lib/references/service";

export const dynamic = "force-dynamic";

export default async function ReferencesPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { before, q, collection, tag, view } = await searchParams;
  const query = typeof q === "string" ? q : "";
  const collectionId = typeof collection === "string" ? collection : "";
  const tagIds = typeof tag === "string" ? [tag] : tag ?? [];
  const grid = view === "grid";
  const filtered = !!(query.trim() || collectionId || tagIds.length);
  const filters = new URLSearchParams();
  if (query) filters.set("q", query);
  if (collectionId) filters.set("collection", collectionId);
  for (const id of tagIds) filters.append("tag", id);
  if (grid) filters.set("view", "grid");

  function pageHref(cursor?: string) {
    const params = new URLSearchParams(filters);
    if (cursor) params.set("before", cursor);
    const search = params.toString();
    return search ? `/references?${search}` : "/references";
  }
  let library: Awaited<ReturnType<typeof getReferenceLibrary>>;
  try {
    if (Array.isArray(before) || Array.isArray(q) || Array.isArray(collection) || tagIds.length > 20) {
      throw new DataAccessError("VALIDATION");
    }
    library = await getReferenceLibrary({ before, query, collectionId, tagIds, view: grid ? "grid" : "list" });
  } catch (error) {
    unstable_rethrow(error);
    const invalidPage = error instanceof DataAccessError && (error.code === "VALIDATION" || error.code === "NOT_FOUND");
    return <div className="page-wrap">
      <div className="page-heading"><h1>References</h1></div>
      <section className="note-state-card" role="alert">
        <h2>{invalidPage ? "This page is unavailable" : "References could not be loaded"}</h2>
        <p>{invalidPage ? "Return to the first page to see your saved references." : "Try again in a moment."}</p>
        {invalidPage ? <Link className="secondary-link" href="/references">Back to references</Link> : <ReferenceRetryButton />}
      </section>
    </div>;
  }

  const first = !filtered && !before && library.items.length === 0;
  return (
    <div className="page-wrap">
      <header className="page-heading notes-heading">
        <div>
          <h1>References</h1>
          <p>Save useful websites and repositories with your own context.</p>
        </div>
        <ReferenceCaptureForm first={first} collections={library.collections} tags={library.tags} />
      </header>
      {!first && (
        <form action="/references" method="get" className="mb-5 space-y-3 rounded-xl border border-border bg-card p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="min-w-0 space-y-1">
              <span className="block font-medium">Search references</span>
              <input name="q" type="search" defaultValue={query} className="w-full rounded-lg border border-input bg-background px-3 py-2" />
            </label>
            <label className="min-w-0 space-y-1">
              <span className="block font-medium">Collection</span>
              <select name="collection" defaultValue={collectionId} className="w-full rounded-lg border border-input bg-background px-3 py-2">
                <option value="">All collections</option>
                {library.collections.map(({ id, displayName }) => <option key={id} value={id}>{displayName}</option>)}
              </select>
            </label>
            <label className="min-w-0 space-y-1">
              <span className="block font-medium">View</span>
              <select name="view" defaultValue={grid ? "grid" : "list"} className="w-full rounded-lg border border-input bg-background px-3 py-2">
                <option value="list">List</option>
                <option value="grid">Grid</option>
              </select>
            </label>
          </div>
          {library.tags.length > 0 && (
            <fieldset className="min-w-0">
              <legend className="font-medium">Match all selected tags (up to 20)</legend>
              <div className="mt-1 flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                {library.tags.map(({ id, displayName }) => (
                  <label key={id} className="flex min-w-0 items-center gap-2 rounded-md border border-border px-2 py-1 wrap-anywhere">
                    <input name="tag" value={id} type="checkbox" defaultChecked={tagIds.includes(id)} />{displayName}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit">Apply</Button>
            {filtered && <Link className="secondary-link" href={grid ? "/references?view=grid" : "/references"}>Clear filters</Link>}
          </div>
        </form>
      )}
      {library.items.length ? (
        <section aria-labelledby="saved-references">
          <div className="notes-section-title">
            <div><h2 id="saved-references">Saved references</h2><p>Most recently updated</p></div>
          </div>
          <ul className={grid ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-3" : "grid gap-3"}>
            {library.items.map((item) => (
              <li key={item.id}>
                <Link className="group flex h-full min-w-0 items-start gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-ring" href={`/references/${item.id}`} prefetch={false}>
                  <Link2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold wrap-anywhere">{item.title}</h3>
                    <p className="text-sm text-muted-foreground wrap-anywhere">{URL.canParse(item.url) ? new URL(item.url).hostname : "Website"}</p>
                    {item.excerpt && <p className="mt-1 line-clamp-2 text-sm wrap-anywhere">{item.excerpt}</p>}
                  </div>
                  <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="note-empty-state">
          <div className="note-empty-icon"><Link2 aria-hidden="true" /></div>
          <h2>{first ? "No saved references yet" : filtered ? "No matching references" : "You’ve reached the end"}</h2>
          <p>{first ? "Add a link to something you want to revisit." : filtered ? "Try a different search or remove filters." : "Return to the first page for your most recently updated references."}</p>
        </section>
      )}
      {(before || library.nextCursor) && (
        <nav aria-label="Reference pages" className="mt-5 flex flex-wrap gap-3">
          {before && <Link className="secondary-link" href={pageHref()}>First page</Link>}
          {library.nextCursor && <Link className="secondary-link" href={pageHref(library.nextCursor)}>Next page <ArrowRight size={16} aria-hidden="true" /></Link>}
        </nav>
      )}
    </div>
  );
}
