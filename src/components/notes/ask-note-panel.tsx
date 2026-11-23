"use client";

import { useId, useState, useTransition } from "react";
import { previewNoteQuestion } from "@/app/(workspace)/notes/ask-actions";
import { Button } from "@/components/ui/button";

type Result = Awaited<ReturnType<typeof previewNoteQuestion>>;

export function AskNotePanel({ noteId, revision, disabled }: {
  noteId: string;
  revision: number;
  disabled: boolean;
}) {
  const questionId = useId();
  const [question, setQuestion] = useState("");
  const [attempt, setAttempt] = useState<{ revision: number; result: Result } | null>(null);
  const [pending, startTransition] = useTransition();
  const result = !disabled && attempt?.revision === revision ? attempt.result : null;

  return <details className="my-4 rounded-xl border border-border bg-card p-4">
    <summary className="min-h-11 cursor-pointer content-center font-semibold">Ask about this note</summary>
    <p className="pb-3 text-sm text-muted-foreground">Find a passage in this saved note using words from your question.</p>
    <form className="flex flex-col gap-2" onSubmit={event => {
      event.preventDefault();
      if (disabled || pending || !question.trim()) return;
      setAttempt(null);
      startTransition(async () => {
        try {
          const result = await previewNoteQuestion({ noteId, revision, question });
          setAttempt({ revision, result });
        } catch {
          setAttempt({ revision, result: { ok: false, message: "The preview could not load. Try again." } });
        }
      });
    }}>
      <label htmlFor={questionId} className="text-sm font-medium">Question</label>
      <textarea id={questionId} name="question" rows={2} required maxLength={500} value={question}
        onChange={event => { setQuestion(event.target.value); setAttempt(null); }} disabled={pending}
        className="w-full rounded-lg border border-input bg-background p-3" />
      <Button type="submit" className="min-h-11 self-start" disabled={disabled || pending || !question.trim()}>
        {pending ? "Loading preview…" : "Find passage"}
      </Button>
    </form>
    <div className="mt-3 text-sm" role="status">
      {disabled ? "Wait for the note to finish saving before previewing its source."
        : pending ? "Reading the saved note…"
        : result?.ok ? <>
          <p className="font-semibold">Source · {result.title}</p>
          <blockquote className="mt-2 border-l-2 border-border pl-3 whitespace-pre-wrap wrap-anywhere">
            {result.excerpt}
          </blockquote>
        </> : result?.message}
    </div>
  </details>;
}
