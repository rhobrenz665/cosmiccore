"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { safeInternalRedirect } from "@/lib/auth/redirect";

const errorMessages: Record<string, string> = {
  access_denied: "Google sign-in was canceled. You can try again when you are ready.",
  account_unavailable: "This CosmicCore account is unavailable.",
  oauth_error: "Google could not complete sign-in. Please try again.",
};

export function SignInCard() {
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const callbackURL = safeInternalRedirect(searchParams.get("returnTo"));
  const queryError = searchParams.get("error");
  const visibleError = localError ?? (queryError ? errorMessages[queryError] ?? errorMessages.oauth_error : null);

  async function signInWithGoogle() {
    setPending(true);
    setLocalError(null);

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL,
        errorCallbackURL: "/auth/sign-in?error=oauth_error",
      });

      if (result.error) {
        setLocalError(result.error.message || errorMessages.oauth_error);
        setPending(false);
      }
    } catch {
      setLocalError(errorMessages.oauth_error);
      setPending(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="sign-in-title">
        <Link href="/" className="auth-brand"><span className="brand-mark"><Sparkles size={20} /></span>CosmicCore</Link>
        <span className="eyebrow">YOUR PRIVATE KNOWLEDGE SPACE</span>
        <h1 id="sign-in-title">Welcome back.</h1>
        <p>Sign in with Google to open your private workspace.</p>
        {visibleError && <p className="auth-error" role="alert">{visibleError}</p>}
        <Button className="google-sign-in" type="button" onClick={signInWithGoogle} disabled={pending}>
          {pending ? <LoaderCircle className="spin" size={18} /> : <GoogleMark />}
          {pending ? "Opening Google…" : "Continue with Google"}
        </Button>
        <p className="auth-note">CosmicCore stores a private application profile linked to your Google identity. Your notes are never shared with other accounts.</p>
      </section>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
      <path fill="currentColor" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z" />
      <path fill="currentColor" opacity=".8" d="M12 22c2.7 0 4.98-.9 6.64-2.43l-3.24-2.51c-.9.6-2.05.96-3.4.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.6A10 10 0 0 0 12 22Z" />
      <path fill="currentColor" opacity=".65" d="M6.39 13.89A6 6 0 0 1 6.08 12c0-.66.11-1.3.31-1.89V7.5H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.5l3.35-2.61Z" />
      <path fill="currentColor" opacity=".5" d="M12 5.98c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.5l3.35 2.61C7.18 7.74 9.39 5.98 12 5.98Z" />
    </svg>
  );
}
