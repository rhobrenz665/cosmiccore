import Link from "next/link";
import { BookOpen, FileText, Plus } from "lucide-react";
import { listNotes } from "@/lib/notes/service";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  let notes: Awaited<ReturnType<typeof listNotes>>;
  try {
    notes = await listNotes();
  } catch {
    return <div className="page-wrap"><div className="page-heading"><span className="eyebrow"><BookOpen size={15}/> YOUR KNOWLEDGE</span><h1>Notes</h1><p>Your notes could not be loaded.</p></div><section className="note-state-card" role="alert"><h2>Notes are temporarily unavailable</h2><p>Try again in a moment. Your saved notes remain private.</p><Link className="secondary-link" href="/notes">Retry</Link></section></div>;
  }

  return <div className="page-wrap notes-page">
    <div className="page-heading notes-heading"><div><span className="eyebrow"><BookOpen size={15}/> YOUR KNOWLEDGE</span><h1>Notes</h1><p>A private home for ideas, drafts, and things you want to remember.</p></div><Link className="primary-link" href="/notes/new"><Plus size={17}/> New note</Link></div>
    {notes.length === 0 ? <section className="note-empty-state"><div className="note-empty-icon"><FileText size={24}/></div><h2>Your notes begin here</h2><p>Create a private note to write in Markdown, preview formatting, and organize it with collections and tags.</p><Link className="primary-link" href="/notes/new"><Plus size={17}/> Create your first note</Link></section> : <section aria-labelledby="note-list-heading"><div className="notes-section-title"><div><h2 id="note-list-heading">Your notes</h2><p>Most recently updated</p></div><span className="notes-count">{notes.length} notes</span></div><div className="note-card-grid">
      {notes.map((note) => <Link className="note-card" key={note.id} href={`/notes/${note.id}`}>
        <span className="note-card-date">Updated {new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(note.updatedAt)}</span>
        <h3>{note.title || "Untitled"}</h3>
        <p className="note-card-excerpt">{note.body.trim().slice(0, 150) || "An empty note, ready for an idea."}</p>
      </Link>)}
    </div></section>}
  </div>;
}
