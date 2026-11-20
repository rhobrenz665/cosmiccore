"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { deleteReferenceAction, setReferenceNoteLinkAction } from "@/app/(workspace)/references/actions";
import { Button } from "@/components/ui/button";

type Command =
  | { type: "delete"; referenceId: string; expectedRevision: number }
  | { type: "link"; referenceId: string; noteId: string; linked: boolean };

export function ReferenceMutationButton({ command }: { command: Command }) {
  const router = useRouter();
  const pending = useRef<{ command: Command; mutationId: string } | null>(null);
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(false);
  const [message, setMessage] = useState("");
  const deleting = command.type === "delete";

  async function submit() {
    if (inFlight.current) return;
    if (!pending.current && deleting && !window.confirm("Permanently delete this reference? Linked notes will remain.")) return;
    inFlight.current = true;
    setBusy(true);
    setMessage("");
    try {
      const request = pending.current ??= { command, mutationId: crypto.randomUUID() };
      const input = { ...request.command, mutationId: request.mutationId };
      const result = input.type === "delete" ? await deleteReferenceAction(input) : await setReferenceNoteLinkAction(input);
      if (!result.ok) {
        setMessage(result.message);
        setRetry(!!result.retrySameRequest);
        if (!result.retrySameRequest) pending.current = null;
        if (result.conflict) router.refresh();
        return;
      }
      pending.current = null;
      setRetry(false);
      if (deleting) router.replace("/references");
      else router.refresh();
    } catch {
      setRetry(true);
      setMessage("The change could not be confirmed. Retry to check whether it completed.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  const label = command.type === "delete" ? "Delete permanently" : command.linked ? "Link note" : "Remove link";
  return (
    <div className="min-w-0">
      <Button type="button" className="min-h-11" variant={deleting ? "destructive" : "outline"} disabled={busy} onClick={submit}>
        {busy ? "Working…" : retry ? "Retry change" : label}
      </Button>
      {message && <p className="mt-1 text-sm wrap-anywhere" role="alert">{message}</p>}
    </div>
  );
}
