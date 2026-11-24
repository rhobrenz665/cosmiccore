"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const messages: Record<string, string> = {
  retrieving: "Searching indexed notes and references…",
  generating: "Generating and checking the answer…",
  insufficient: "The indexed notes and references did not provide enough evidence.",
  long: "Ask a question of 500 characters or fewer to request an answer.",
  limited: "The AI usage limit was reached. Try again later.",
  changed: "The source changed before the answer could be saved.",
  canceled: "Stopped waiting for the answer.",
  unavailable: "The answer could not be generated. Try again later.",
  saved: "Answer saved.",
  active: "A generation is already running. Try again after it finishes.",
  interrupted: "The previous generation was interrupted. You can try again.",
};

export function AnswerForm({ conversationId, turnId, attemptStatus }: { conversationId: string; turnId: string; attemptStatus: string | null }) {
  const router = useRouter();
  const attempt = useRef<AbortController | null>(null);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("");
  useEffect(() => () => attempt.current?.abort(), []);

  return <form className="grid gap-2" onSubmit={async event => {
    event.preventDefault();
    if (attempt.current || new FormData(event.currentTarget).get("consent") !== "on") return;
    const controller = new AbortController();
    attempt.current = controller;
    setPending(true);
    setStatus("retrieving");
    try {
      const response = await fetch("/api/chat/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, turnId, consent: true }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) throw new Error();
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      let finalStatus = "unavailable";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += value;
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!Object.hasOwn(messages, line)) continue;
            if (line !== "retrieving" && line !== "generating") finalStatus = line;
            setStatus(line);
          }
        }
      } finally {
        reader.releaseLock();
      }
      setStatus(finalStatus);
      if (finalStatus === "saved") router.refresh();
    } catch {
      setStatus(controller.signal.aborted ? "canceled" : "unavailable");
      if (controller.signal.aborted) router.refresh();
    } finally {
      attempt.current = null;
      setPending(false);
    }
  }}>
    <label className="flex items-start gap-2 text-sm">
      <input type="checkbox" name="consent" required disabled={pending} />
      Send this question, up to four earlier questions, and up to three matching passages to Groq.
    </label>
    <div className="flex flex-wrap gap-2">
      <Button type="submit" disabled={pending}>Get AI answer</Button>
      {pending && <Button type="button" variant="outline" onClick={() => attempt.current?.abort()}>
        Stop generation
      </Button>}
    </div>
    <p role="status">{messages[status || attemptStatus || ""]}</p>
  </form>;
}
