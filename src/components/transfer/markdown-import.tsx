"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { readMarkdown, TransferInputError } from "@/lib/transfer/markdown";

export function MarkdownImport() {
  const router = useRouter();
  const selection = useRef(0);
  const inFlight = useRef(false);
  const [draft, setDraft] = useState<{ file: File; title: string; body: string; mutationId: string }>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);

  async function preview(file?: File) {
    const token = ++selection.current;
    setDraft(undefined);
    setError("");
    setReading(!!file);
    if (!file) return;
    try {
      const decoded = await readMarkdown(file);
      if (token === selection.current) setDraft({ file, ...decoded, mutationId: crypto.randomUUID() });
    } catch (error) {
      if (token === selection.current) setError(error instanceof TransferInputError ? error.message : "The preview could not be loaded.");
    } finally {
      if (token === selection.current) setReading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    const data = new FormData();
    data.set("file", draft.file);
    data.set("mutationId", draft.mutationId);
    try {
      const response = await fetch("/api/import/markdown", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        setError(result.message ?? "Import could not be confirmed. Try again with the same file.");
        return;
      }
      router.push(`/notes/${result.noteId}`);
      router.refresh();
    } catch {
      setError("Import could not be confirmed. Try again without changing the file.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return <form className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-6" onSubmit={submit} aria-busy={busy || reading}>
    <label className="block space-y-2 font-medium">
      <span>Markdown file</span>
      <input className="block w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2" type="file"
        accept=".md" disabled={busy} onChange={(event) => void preview(event.target.files?.[0])} />
    </label>
    {reading && <p role="status">Reading preview…</p>}
    {draft && <section aria-labelledby="import-preview">
      <h2 id="import-preview" className="font-semibold">Preview</h2>
      <p className="mt-1 wrap-anywhere">Title: {draft.title || "Untitled"}</p>
      <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap wrap-anywhere rounded-lg border border-border p-3 text-sm"
        tabIndex={0} aria-label="Markdown source">{draft.body || "(Empty Markdown file)"}</pre>
    </section>}
    {error && <p className="text-sm" role="alert">{error}</p>}
    <Button type="submit" className="min-h-11" disabled={!draft || busy}>{busy ? "Importing…" : "Import as a new note"}</Button>
  </form>;
}
