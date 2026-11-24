import { randomUUID } from "node:crypto";
import Link from "next/link";
import { loadChat } from "@/lib/chat/history";
import { AnswerForm } from "@/components/chat/answer-form";
import { Button } from "@/components/ui/button";
import { removeChat, submitChatQuestion } from "./actions";

export const dynamic = "force-dynamic";

export default async function Chat({ searchParams }: {
  searchParams: Promise<{ id?: string; error?: string }>;
}) {
  const { id, error } = await searchParams;
  const { history, selected, turns } = await loadChat(id);
  const enabled = process.env.COSMICCORE_CHAT_ANSWERS_ENABLED === "true" && Boolean(process.env.GROQ_API_KEY?.trim());
  return <div className="page-wrap space-y-5">
    <header className="page-heading"><h1>AI Chat</h1></header>
    <div className="grid gap-4 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
      <nav className="note-state-card" aria-label="Chat history">
        <Link className="secondary-link" href="/chat">New conversation</Link>
        <ul className="space-y-2">
          {history.map(item => <li key={item.id} className="break-words">
            <Link className="underline" href={`/chat?id=${item.id}`}
              aria-current={selected?.id === item.id ? "page" : undefined}>{item.title}</Link>
          </li>)}
        </ul>
      </nav>
      <section className="note-state-card" aria-labelledby="conversation-title">
        <h2 id="conversation-title" className="break-words">{selected?.title ?? "New conversation"}</h2>
        <p>{enabled ? "Ask about your indexed notes and references." : "Questions are saved privately. AI answers are unavailable."}</p>
        {id && !selected && <p role="status">Conversation unavailable.</p>}
        {error && <p role="alert">The question could not be saved. Check its length and available chat storage.</p>}
        <ol className="space-y-3">
          {turns.map(turn => <li key={turn.id} className="whitespace-pre-wrap break-words">
            <p>{turn.question}</p>
            {turn.answer && <p>{turn.answer}</p>}
            {turn.sources.map((source, index) => <p key={index}>
              {source.href ? <Link className="underline" href={source.href}>
                Open source {index + 1} ({source.kind})
              </Link> : "Source changed or unavailable."}
            </p>)}
            {enabled && selected && !turn.answer && <AnswerForm conversationId={selected.id} turnId={turn.id} />}
          </li>)}
        </ol>
        <form action={submitChatQuestion} className="grid gap-2">
          <input type="hidden" name="conversationId" value={selected?.id ?? randomUUID()} />
          <input type="hidden" name="create" value={String(!selected)} />
          <input type="hidden" name="submissionId" value={randomUUID()} />
          <label htmlFor="chat-question">Question</label>
          <textarea id="chat-question" name="question" required maxLength={8192}
            className="rounded-lg border border-input bg-background p-3" rows={3} />
          <Button type="submit" className="justify-self-start">Save question</Button>
        </form>
        {selected && <details>
          <summary>Delete conversation</summary>
          <form action={removeChat}>
            <input type="hidden" name="conversationId" value={selected.id} />
            <p>This permanently removes the conversation and its questions.</p>
            <Button variant="destructive" type="submit">Confirm deletion</Button>
          </form>
        </details>}
      </section>
    </div>
  </div>;
}
