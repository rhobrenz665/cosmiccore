"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FilePlus2, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createNoteAction } from "@/app/(workspace)/notes/actions";

export function CreateNoteButton({ label = "Create note" }: { label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mutationId = useRef<string | null>(null);

  async function create() {
    setBusy(true);
    setError("");
    const requestId = mutationId.current ?? crypto.randomUUID();
    mutationId.current = requestId;
    try {
      const result = await createNoteAction(requestId);
      if (!result.ok) {
        setError(result.message);
        setBusy(false);
        return;
      }
      mutationId.current = null;
      router.push(`/notes/${result.noteId}`);
      router.refresh();
    } catch {
      setError("The note could not be created. Try again.");
      setBusy(false);
    }
  }

  return <div className="create-note-action">
    <Button onClick={create} disabled={busy}>
      {busy ? <LoaderCircle className="spin" size={16}/> : <FilePlus2 size={16}/>}
      {busy ? "Creating…" : label}
    </Button>
    {error && <p className="note-feedback note-feedback-error" role="alert">{error}</p>}
  </div>;
}
