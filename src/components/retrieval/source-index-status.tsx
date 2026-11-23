"use client";

import { useState, useTransition } from "react";
import { prepareSavedSource } from "@/app/(workspace)/retrieval-actions";
import { Button } from "@/components/ui/button";
import type { Source } from "@/lib/retrieval/index-core";

export function SourceIndexStatus({ source, revision, initialIndexedRevision, disabled }: {
  source: Source;
  revision: number;
  initialIndexedRevision: number | null | undefined;
  disabled?: boolean;
}) {
  const [indexed, setIndexed] = useState(initialIndexedRevision);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const ready = indexed === revision;
  const status = pending ? "Indexing the saved version…" : error || (ready ? "Saved version is indexed."
    : indexed === undefined ? "Index status is temporarily unavailable." : "Saved version is awaiting indexing.");

  return <section aria-label="AI source index" className="my-4 flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
    <div className="mr-auto min-w-0">
      <h2 className="font-semibold">AI source index</h2>
      <p className="text-sm text-muted-foreground" role="status">{status}</p>
    </div>
    {!ready && <Button variant="outline" disabled={disabled || pending} onClick={() => {
      setError("");
      startTransition(async () => {
        try {
          const result = await prepareSavedSource(source.kind, source.id);
          if (result.ok) setIndexed(result.revision);
          else setError(result.message);
        } catch {
          setError("Indexing could not finish. Try again.");
        }
      });
    }}>{error ? "Retry indexing" : "Index saved content"}</Button>}
  </section>;
}
