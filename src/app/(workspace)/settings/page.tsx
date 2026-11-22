import Link from "next/link";
import { AccountDeletion } from "@/components/settings/account-deletion";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { SignOutButton } from "@/components/settings/sign-out-button";
import { DownloadMarkdown } from "@/components/transfer/download-markdown";
import { requireAppUser } from "@/lib/auth/app-user";

export default async function Settings({ searchParams }: {
  searchParams: Promise<{ confirmDeletion?: string; deletionError?: string }>;
}) {
  const user = await requireAppUser();
  const params = await searchParams;
  return <div className="page-wrap space-y-6">
    <header className="page-heading"><h1>Settings</h1></header>
    <section className="space-y-3 rounded-xl border border-border bg-card p-4" aria-labelledby="profile-settings">
      <h2 id="profile-settings" className="text-lg font-semibold">Profile</h2>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div><dt className="text-muted-foreground">Name</dt><dd className="wrap-anywhere">{user.displayName || "User"}</dd></div>
        <div><dt className="text-muted-foreground">Google email</dt><dd className="wrap-anywhere">{user.email}</dd></div>
      </dl>
      <p className="text-sm text-muted-foreground">Manage your name and email in your Google account.</p>
      <SignOutButton />
    </section>
    <AppearanceSettings />
    <section className="space-y-3 rounded-xl border border-border bg-card p-4" aria-labelledby="data-settings">
      <h2 id="data-settings" className="text-lg font-semibold">Your data</h2>
      <p className="text-sm">Export includes saved active note bodies. Trash holds deleted notes for up to seven days.</p>
      <div className="flex flex-wrap items-start gap-3">
        <Link className="secondary-link" href="/notes/import">Import Markdown</Link>
        <DownloadMarkdown href="/api/exports/notes" label="Export active notes" />
        <Link className="secondary-link" href="/trash">Open Trash</Link>
      </div>
    </section>
    <section className="space-y-2 rounded-xl border border-border bg-card p-4" aria-labelledby="privacy-settings">
      <h2 id="privacy-settings" className="text-lg font-semibold">Privacy</h2>
      <p className="text-sm">AI chat is planned for a later build. Your knowledge is currently used within your private workspace.</p>
    </section>
    {params.deletionError === "1" && <p role="alert">Google confirmation did not complete. You can start again below.</p>}
    <AccountDeletion enabled={process.env.COSMICCORE_ACCOUNT_DELETION_ENABLED === "true"} returning={params.confirmDeletion === "1"} />
  </div>;
}
