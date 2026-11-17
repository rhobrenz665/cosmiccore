"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { changeNoteLifecycleAction } from "@/app/(workspace)/notes/actions";

export function NoteLifecycleButton({ noteId, action, getRevision, disabled = false, onLockedChange }: {
  noteId: string; action: "trash" | "restore"; getRevision: () => number; disabled?: boolean; onLockedChange?: (locked: boolean) => void;
}) {
  const router = useRouter();
  const requestRef = useRef<Parameters<typeof changeNoteLifecycleAction>[0] | null>(null);
  const pendingRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);

  async function submit() {
    if (pendingRef.current || disabled) return;
    if (!requestRef.current) {
      if (!window.confirm(action === "trash" ? "Move this saved note to Trash? You can restore it for seven days. It continues to use storage until permanently cleaned up." : "Restore this note to your active notes?")) return;
      requestRef.current = { noteId, action, expectedRevision: getRevision(), mutationId: crypto.randomUUID() };
    }
    pendingRef.current = true;
    setPending(true);
    onLockedChange?.(true);
    setMessage(null);
    const result = await changeNoteLifecycleAction(requestRef.current).catch(() => ({ ok: false as const, code: "DEPENDENCY_UNAVAILABLE", message: "The change could not be confirmed. Retry to safely check whether it completed." }));
    pendingRef.current = false;
    setPending(false);
    if (result.ok) {
      router.replace(action === "trash" ? "/trash" : `/notes/${noteId}`);
      router.refresh();
      return;
    }
    const unknown = result.code === "DEPENDENCY_UNAVAILABLE";
    setUncertain(unknown);
    if (!unknown) {
      requestRef.current = null;
      onLockedChange?.(false);
    }
    setMessage(result.message);
  }

  return <div className="note-lifecycle-action">
    <Button variant={action === "trash" ? "destructive" : "outline"} disabled={disabled || pending} onClick={() => { void submit(); }}>
      {pending ? "Working…" : uncertain ? "Retry confirmation" : action === "trash" ? "Move to Trash" : "Restore note"}
    </Button>
    {message && <p role="alert">{message}</p>}
  </div>;
}
