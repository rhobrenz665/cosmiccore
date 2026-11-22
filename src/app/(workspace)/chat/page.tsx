import Link from "next/link";
import { MessageCircle } from "lucide-react";

export default function Chat() {
  return <div className="page-wrap space-y-5">
    <header className="page-heading"><h1>AI Chat</h1></header>
    <section className="note-state-card" aria-labelledby="chat-availability">
      <MessageCircle aria-hidden="true" size={24}/>
      <h2 id="chat-availability">Grounded chat is coming</h2>
      <p>In the meantime, use Knowledge to search your saved notes and references.</p>
      <Link className="secondary-link" href="/knowledge">Open Knowledge</Link>
    </section>
  </div>;
}
