"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Choice = { id: string; displayName: string };
type Props = {
  query: string; type: string; collectionId: string | null; tagIds: string[];
  sort: string; view: string; collections: Choice[]; tags: Choice[]; filtered: boolean;
};

const control = "block w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2";

export function KnowledgeSearchForm({ query, type, collectionId, tagIds, sort, view, collections, tags, filtered }: Props) {
  const [draftTags, setDraftTags] = useState(tagIds);
  const params = new URLSearchParams({ q: query, type, sort, view });
  if (collectionId) params.set("collection", collectionId);
  for (const tagId of tagIds) params.append("tag", tagId);

  function withoutFilter(key: string, value?: string) {
    const next = new URLSearchParams(params);
    if (value === undefined) next.delete(key);
    else next.delete(key, value);
    return `/knowledge?${next}`;
  }

  const chips = [
    ...(type === "note" || type === "reference" ? [{ label: type === "note" ? "Notes" : "References", href: withoutFilter("type") }] : []),
    ...collections.filter(item => item.id === collectionId).map(item => ({ label: item.displayName, href: withoutFilter("collection") })),
    ...tags.filter(item => tagIds.includes(item.id)).map(item => ({ label: item.displayName, href: withoutFilter("tag", item.id) })),
  ];

  return (
    <form action="/knowledge" method="get" className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-40 flex-1 space-y-1">
          <span className="font-medium">Search notes and references</span>
          <input type="search" name="q" defaultValue={query} className={control} />
        </label>
        <Button className="min-h-11" type="submit">Search</Button>
      </div>
      <input type="hidden" name="view" value={view} />
      {chips.length > 0 && <ul className="flex flex-wrap gap-2" aria-label="Active filters">
        {chips.map(chip => <li key={chip.href} className="min-w-0">
          <Link className="inline-flex min-h-11 max-w-full items-center rounded-lg border border-border px-3" href={chip.href} aria-label={`Remove filter: ${chip.label}`}><span className="min-w-0 wrap-anywhere">{chip.label}</span><span aria-hidden="true" className="ml-2">×</span></Link>
        </li>)}
      </ul>}
      <details className="space-y-3">
        <summary className="min-h-11 cursor-pointer content-center font-medium">Filters and sort</summary>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="min-w-0 space-y-1">
            <span>Type</span>
            <select name="type" defaultValue={type} className={control}>
              <option value="all">All types</option><option value="note">Notes</option><option value="reference">References</option>
            </select>
          </label>
          <label className="min-w-0 space-y-1">
            <span>Collection</span>
            <select name="collection" defaultValue={collectionId ?? ""} className={control}>
              <option value="">All collections</option>
              {collections.map((item) => <option key={item.id} value={item.id}>{item.displayName}</option>)}
            </select>
          </label>
          <label className="min-w-0 space-y-1">
            <span>Sort</span>
            <select name="sort" defaultValue={sort} className={control}>
              <option value="">Best match when searching</option><option value="recent">Most recently updated</option>
            </select>
          </label>
        </div>
        {tags.length > 0 && <fieldset className="min-w-0">
          <legend>Match all selected tags (up to 20)</legend>
          <div className="mt-2 flex max-h-36 flex-wrap gap-2 overflow-y-auto p-1">
            {tags.map((tag) => <label key={tag.id} className="flex min-h-11 min-w-0 items-center gap-2 rounded-md border border-border px-2 wrap-anywhere">
              <input type="checkbox" name="tag" value={tag.id} checked={draftTags.includes(tag.id)}
                onChange={event => setDraftTags(event.target.checked
                  ? [...draftTags, tag.id]
                  : draftTags.filter(id => id !== tag.id))}
                disabled={draftTags.length >= 20 && !draftTags.includes(tag.id)} />{tag.displayName}
            </label>)}
          </div>
        </fieldset>}
        <Button type="submit" variant="outline" className="min-h-11">Apply filters</Button>
      </details>
      {filtered && <Link className="secondary-link" href={view === "grid" ? "/knowledge?view=grid" : "/knowledge"}>Clear filters</Link>}
    </form>
  );
}
