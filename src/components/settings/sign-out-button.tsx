"use client";

import { useState } from "react";
import { LoaderCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

export function SignOutButton({ iconOnly = false }: { iconOnly?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function signOut() {
    if (document.querySelector('[data-note-unsaved="true"]') &&
        !window.confirm("This note has unsaved changes. Sign out and discard them?")) return;
    setBusy(true);
    setError(false);
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error("Sign-out failed.");
      document.documentElement.dataset.signingOut = "true";
      window.location.replace("/");
    } catch {
      setBusy(false);
      setError(true);
    }
  }

  return <>
    {error && <span className="signout-error" role="alert">Sign-out could not be confirmed. Try again.</span>}
    <Button variant="outline" size={iconOnly ? "icon" : "lg"} aria-label="Sign out" title="Sign out" onClick={signOut} disabled={busy}>
      {busy ? <LoaderCircle className="spin" aria-hidden="true" /> : <LogOut aria-hidden="true" />}
      {!iconOnly && (busy ? "Signing out…" : "Sign out")}
    </Button>
  </>;
}
