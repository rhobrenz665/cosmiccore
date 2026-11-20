import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { notFound, unstable_rethrow } from "next/navigation";
import { ReferenceCaptureForm } from "@/components/references/capture-form";
import { ReferenceMutationButton } from "@/components/references/mutation-button";
import { ReferenceRetryButton } from "@/components/references/retry-button";
import { buttonVariants } from "@/components/ui/button";
import { DataAccessError } from "@/lib/db/owned-data";
import { normalizeReferenceUrl, ReferenceInputError } from "@/lib/references/rules";
import { getReference } from "@/lib/references/service";

export const dynamic = "force-dynamic";

export default async function ReferenceDetailPage({ params, searchParams }: {
  params: Promise<{ referenceId: string }>;
  searchParams: Promise<{ pick?: string; after?: string | string[] }>;
}) {
  const { referenceId } = await params;
  const { pick, after } = await searchParams;
  const picker = pick === "1";
  const detailUrl = `/references/${referenceId}`;
  let reference: Awaited<ReturnType<typeof getReference>>;
  try {
    reference = await getReference(referenceId, picker, typeof after === "string" ? after : undefined);
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof DataAccessError && (error.code === "NOT_FOUND" || error.code === "VALIDATION")) notFound();
    return <div className="page-wrap">
      <section className="note-state-card" role="alert">
        <h1>Reference could not be loaded</h1>
        <p>Try again in a moment.</p>
        <div className="flex flex-wrap gap-3">
          <ReferenceRetryButton />
          <Link className="secondary-link" href="/references">Back to references</Link>
        </div>
      </section>
    </div>;
  }

  let destination: URL | undefined;
  try {
    destination = new URL(normalizeReferenceUrl(reference.url).url);
  } catch (error) {
    if (!(error instanceof ReferenceInputError)) throw error;
  }
  const collection = reference.collections.find((choice) => choice.id === reference.collectionId);
  const tags = reference.tags.filter((tag) => reference.tagIds.includes(tag.id));

  return (
    <div className="page-wrap">
      <Link className="secondary-link mb-5" href="/references"><ArrowLeft size={16} aria-hidden="true" /> References</Link>
      <article className="rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-7">
        <header className="space-y-3">
          <h1 className="font-heading text-3xl font-semibold wrap-anywhere">{reference.title}</h1>
          {destination ? (
            <>
              <p className="text-sm text-muted-foreground wrap-anywhere">{destination.hostname}</p>
              <a className={buttonVariants({ size: "lg" })} href={destination.href} target="_blank" rel="noopener noreferrer">
                Open website <ExternalLink aria-hidden="true" /> <span className="sr-only">(opens in a new tab)</span>
              </a>
              <p className="text-sm text-muted-foreground wrap-anywhere">{destination.href}</p>
            </>
          ) : <p className="text-sm text-muted-foreground">This saved address can’t be opened.</p>}
        </header>
        {reference.description && (
          <section className="mt-6 border-t border-border pt-5" aria-labelledby="reference-description">
            <h2 id="reference-description" className="font-semibold">Description</h2>
            <p className="mt-2 whitespace-pre-wrap wrap-anywhere">{reference.description}</p>
          </section>
        )}
        {(collection || tags.length > 0) && (
          <dl className="mt-6 space-y-3 border-t border-border pt-5 text-sm">
            {collection && <div><dt className="font-medium">Collection</dt><dd className="wrap-anywhere">{collection.displayName}</dd></div>}
            {tags.length > 0 && <div>
              <dt className="font-medium">Tags</dt>
              <dd><ul className="mt-1 flex flex-wrap gap-2">{tags.map((tag) => <li key={tag.id} className="rounded-md border border-border px-2 py-1 wrap-anywhere">{tag.displayName}</li>)}</ul></dd>
            </div>}
          </dl>
        )}
        <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-5">
          <ReferenceCaptureForm reference={reference} collections={reference.collections} tags={reference.tags} />
          <ReferenceMutationButton command={{ type: "delete", referenceId: reference.id, expectedRevision: reference.revision }} />
        </div>
      </article>
      <section className="mt-6 space-y-3" aria-labelledby="reference-notes">
        <h2 className="font-semibold" id="reference-notes">{picker ? "Choose an active note" : "Linked notes"}</h2>
        <Link className="secondary-link" href={picker ? detailUrl : `${detailUrl}?pick=1`}>{picker ? "Show linked notes" : "Manage note links"}</Link>
        {reference.linkedNotes.items.length === 0 && <p>{picker ? "No active notes on this page." : "No linked notes on this page."}</p>}
        <ul className="space-y-2">
          {reference.linkedNotes.items.map((note) => (
            <li key={note.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
              <Link className="text-link wrap-anywhere" href={`/notes/${note.id}`} prefetch={false}>{note.title || "Untitled"}</Link>
              <ReferenceMutationButton command={{ type: "link", referenceId: reference.id, noteId: note.id, linked: !note.linked }} />
            </li>
          ))}
        </ul>
        {(after || reference.linkedNotes.next) && <nav className="flex flex-wrap gap-3" aria-label="Linked note pages">
          {after && <Link className="secondary-link" href={picker ? `${detailUrl}?pick=1` : detailUrl}>First page</Link>}
          {reference.linkedNotes.next && <Link className="secondary-link" href={`${detailUrl}?${picker ? "pick=1&" : ""}after=${reference.linkedNotes.next}`}>Next page</Link>}
        </nav>}
      </section>
    </div>
  );
}
