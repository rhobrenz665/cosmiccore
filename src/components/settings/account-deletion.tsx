"use client";

import { useState } from "react";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { beginAccountDeletion, cancelAccountDeletion, confirmAccountDeletion } from "@/app/(workspace)/settings/actions";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

export function AccountDeletion({ enabled, returning }: { enabled: boolean; returning: boolean }) {
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);

  async function begin() {
    setBusy(true);
    setMessage("");
    try {
      const result = await beginAccountDeletion();
      if (!result.ok) {
        setMessage(result.message ?? "Could not start account deletion. Try again.");
        return;
      }
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: new URL("/settings?confirmDeletion=1", window.location.origin).href,
        errorCallbackURL: new URL("/settings?deletionError=1", window.location.origin).href,
      });
      if (error) setMessage("Google confirmation could not start. Try again.");
    } catch {
      setMessage("Google confirmation could not start. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    setBusy(true);
    setMessage("");
    try {
      const result = await confirmAccountDeletion(confirmation);
      if (!result.ok) {
        setMessage(result.message ?? "Account deletion could not be confirmed. Try again.");
        return;
      }
      window.location.replace("/auth/sign-in?notice=deletion_requested");
    } catch {
      setMessage("The request could not be confirmed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function closeConfirmation() {
    try {
      await cancelAccountDeletion();
      window.location.replace("/settings");
    } catch {
      setMessage("Could not clear the confirmation. It will expire after five minutes.");
    }
  }

  return <section className="space-y-3 rounded-xl border border-border bg-card p-4" aria-labelledby="delete-account">
    <h2 id="delete-account" className="text-lg font-semibold">Delete account</h2>
    <p>Deletion immediately blocks access to CosmicCore and cannot be undone. We aim to remove live notes, references, chat, and account data within seven days. Your Google account is unaffected.</p>
    {!open && message && <p role="alert">{message}</p>}
    {enabled ? (
      <AlertDialog.Root open={open} onOpenChange={(next) => { if (busy) return;
        setOpen(next);
        setMessage("");
        setConfirmation("");
        if (!next && returning) void closeConfirmation(); }}>
        <AlertDialog.Trigger render={<Button variant="destructive" />}>
          {returning ? "Review deletion confirmation" : "Delete account"}
        </AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/50" />
          <AlertDialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[min(32rem,calc(100vw-2rem))] max-h-[90dvh] -translate-1/2 space-y-3 overflow-auto rounded-xl border border-border bg-popover p-5">
            <AlertDialog.Title className="text-lg font-semibold">Delete your CosmicCore account?</AlertDialog.Title>
            <AlertDialog.Description>
              {returning ? "Confirm only if you want immediate, permanent account deletion." : "Continue with the same Google account for a new sign-in session. You can cancel before the final confirmation."}
            </AlertDialog.Description>
            {returning && <label className="block space-y-1">
              <span>Type DELETE to confirm</span>
              <input className="block w-full rounded-lg border border-input bg-background p-2" autoComplete="off"
                disabled={busy} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
            </label>}
            {message && <p role="alert">{message}</p>}
            <div className="flex flex-wrap justify-end gap-2">
              <AlertDialog.Close render={<Button variant="outline" disabled={busy} />}>Cancel</AlertDialog.Close>
              {returning && message && <Button variant="outline" disabled={busy} onClick={begin}>Start again with Google</Button>}
              <Button variant="destructive" disabled={busy || returning && confirmation !== "DELETE"} onClick={returning ? confirm : begin}>
                {busy ? "Working…" : returning ? "Confirm permanent deletion" : "Continue with Google"}
              </Button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    ) : <p role="status" className="text-muted-foreground">Account deletion is unavailable in this environment.</p>}
  </section>;
}
