import Link from "next/link";
import { listTrash } from "@/lib/notes/service";
import { RestoreNoteButton } from "@/components/notes/restore-note-button";

export const dynamic = "force-dynamic";

export default async function TrashPage({ searchParams }: { searchParams: Promise<{ before?: string; id?: string }> }) {
  const params = await searchParams;
  let result: Awaited<ReturnType<typeof listTrash>>;
  try {
    if ((params.before === undefined) !== (params.id === undefined)) throw new Error("Invalid cursor");
    result = await listTrash(params.before !== undefined ? { deletedAt: params.before, id: params.id! } : undefined);
  } catch {
    return <div className="page-wrap"><section className="note-state-card" role="alert"><h1>Trash could not be loaded</h1><p>Try loading Trash again.</p><Link href="/trash" className="secondary-link">Reload Trash</Link></section></div>;
  }
  return <div className="page-wrap"><div className="page-heading"><h1>Trash</h1><p>Restore notes within seven days of deletion. Trashed notes continue to use storage until permanent cleanup.</p><Link href="/notes" className="text-link">Back to notes</Link></div>
    {!result.items.length ? <section className="note-state-card"><h2>{params.before ? "No more trashed notes" : "Trash is empty"}</h2><p>{params.before ? "Return to the first page to see the latest deleted notes." : "Notes you move to Trash will appear here."}</p>{params.before && <Link href="/trash">First page</Link>}</section> : <section aria-label="Trashed notes" className="note-card-grid">
      {result.items.map((note) => <article key={note.id} className="note-card"><h2>{note.title || "Untitled"}</h2><p>Deleted {note.deletedAt?.toISOString()}</p><p>{note.expired ? "Restore period ended. Awaiting permanent cleanup." : `Restore before ${note.purgeAfter?.toISOString()}`}</p>{!note.expired && <RestoreNoteButton noteId={note.id} revision={note.revision}/>}</article>)}
    </section>}
    {result.nextCursor && <Link className="secondary-link" href={`/trash?${new URLSearchParams({ before: result.nextCursor.deletedAt, id: result.nextCursor.id })}`}>Older deleted notes</Link>}
  </div>;
}
