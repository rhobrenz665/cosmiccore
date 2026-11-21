import Link from "next/link";
import { notFound, unstable_rethrow } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { ReferenceMutationButton } from "@/components/references/mutation-button";
import { DownloadMarkdown } from "@/components/transfer/download-markdown";
import { NoteEditor } from "@/components/notes/note-editor";
import { DataAccessError } from "@/lib/db/owned-data";
import { getNoteEditorData } from "@/lib/notes/service";

export const dynamic = "force-dynamic";

export default async function NotePage({ params, searchParams }: {
  params: Promise<{ noteId: string }>;
  searchParams: Promise<{ referencesAfter?: string | string[] }>;
}) {
  const { noteId } = await params;
  const { referencesAfter } = await searchParams;
  const after = typeof referencesAfter === "string" ? referencesAfter : undefined;
  let editorData: Awaited<ReturnType<typeof getNoteEditorData>>;
  try {
    editorData = await getNoteEditorData(noteId, { after });
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof DataAccessError && error.code === "NOT_FOUND") notFound();
    if (error instanceof DataAccessError && error.code === "VALIDATION") notFound();
    return <div className="page-wrap"><section className="note-state-card" role="alert"><h1>Note temporarily unavailable</h1><p>Try again in a moment. Your saved note remains private.</p><Link className="secondary-link" href="/notes">Back to notes</Link></section></div>;
  }
  const { note, tagIds, collections, tags, linkedReferences } = editorData;
  return <div className="page-wrap"><div className="page-heading"><Link className="text-link" href="/notes"><ArrowLeft size={16}/> All notes</Link><span className="eyebrow"><FileText size={15}/> PRIVATE NOTE</span><h1>{note.title || "Untitled"}</h1><p>Last saved {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(note.updatedAt)}</p></div>
    <NoteEditor noteId={note.id} initialTitle={note.title} initialBody={note.body} initialRevision={note.revision} initialCollectionId={note.collectionId} initialTagIds={tagIds} collections={collections} tags={tags}/>
    <section className="mt-6 space-y-2" aria-labelledby="note-export">
      <h2 className="font-semibold" id="note-export">Export Markdown</h2>
      <p className="text-sm text-muted-foreground">Downloads the last saved version. Wait for the editor to show Saved to include your latest changes.</p>
      <DownloadMarkdown href={`/api/notes/${note.id}/export`} label="Download saved Markdown" />
    </section>
    <section className="mt-6 space-y-3" aria-labelledby="note-references">
      <h2 className="font-semibold" id="note-references">Linked references</h2>
      {linkedReferences?.items.length ? (
        <ul className="space-y-2">
          {linkedReferences.items.map((reference) => (
            <li key={reference.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
              <Link className="text-link wrap-anywhere" href={`/references/${reference.id}`} prefetch={false}>{reference.title}</Link>
              <ReferenceMutationButton command={{ type: "link", referenceId: reference.id, noteId: note.id, linked: false }} />
            </li>
          ))}
        </ul>
      ) : <p className="text-muted-foreground">No linked references on this page.</p>}
      <Link className="secondary-link" href="/references">Browse references to link this note</Link>
      {(after || linkedReferences?.next) && <nav className="flex flex-wrap gap-3" aria-label="Linked reference pages">
        {after && <Link className="secondary-link" href={`/notes/${note.id}`}>First page</Link>}
        {linkedReferences?.next && <Link className="secondary-link" href={`/notes/${note.id}?referencesAfter=${linkedReferences.next}`}>Next page</Link>}
      </nav>}
    </section>
  </div>;
}
