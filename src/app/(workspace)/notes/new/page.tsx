import Link from "next/link";
import { ArrowLeft, FilePlus2 } from "lucide-react";
import { CreateNoteButton } from "@/components/notes/create-note-button";

export const dynamic = "force-dynamic";

export default function NewNotePage() {
  return <div className="page-wrap"><div className="page-heading"><span className="eyebrow"><FilePlus2 size={15}/> NEW NOTE</span><h1>Start with a blank page</h1><p>A note is created only after you choose to begin. Your content stays private to your account.</p></div>
    <section className="note-state-card new-note-card"><div className="note-empty-icon"><FilePlus2 size={24}/></div><h2>Create a private note</h2><p>Your note opens in the editor, where you can write in Markdown, preview formatting, and organize it with collections and tags.</p><div className="note-actions-row"><Link className="secondary-link" href="/notes"><ArrowLeft size={16}/> Back to notes</Link><CreateNoteButton/></div></section>
  </div>;
}
