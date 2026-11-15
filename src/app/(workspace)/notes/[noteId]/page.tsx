import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { NoteEditor } from "@/components/notes/note-editor";
import { DataAccessError } from "@/lib/db/owned-data";
import { getNote } from "@/lib/notes/service";

export const dynamic = "force-dynamic";

export default async function NotePage({ params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = await params;
  try {
    const note = await getNote(noteId);
    return <div className="page-wrap"><div className="page-heading"><Link className="text-link" href="/notes"><ArrowLeft size={16}/> All notes</Link><span className="eyebrow"><FileText size={15}/> PRIVATE NOTE</span><h1>{note.title || "Untitled"}</h1><p>Last saved {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(note.updatedAt)}</p></div>
      <NoteEditor noteId={note.id} initialTitle={note.title} initialBody={note.body} initialRevision={note.revision}/>
    </div>;
  } catch (error) {
    if (error instanceof DataAccessError && error.code === "NOT_FOUND") notFound();
    if (error instanceof DataAccessError && error.code === "VALIDATION") notFound();
    return <div className="page-wrap"><section className="note-state-card" role="alert"><h1>Note temporarily unavailable</h1><p>Try again in a moment. Your saved note remains private.</p><Link className="secondary-link" href="/notes">Back to notes</Link></section></div>;
  }
}
