import Link from "next/link";
import { redirect, unstable_rethrow } from "next/navigation";
import { CreateNoteButton } from "@/components/notes/create-note-button";
import { ReferenceCaptureForm } from "@/components/references/capture-form";
import { ReferenceRetryButton } from "@/components/references/retry-button";
import { DataAccessError } from "@/lib/db/owned-data";
import { getDashboard } from "@/lib/knowledge/service";

export const dynamic = "force-dynamic";

type Recent = { id: string; title: string; updatedAt: Date };
const date = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

function RecentSection({ type, items }: { type: "notes" | "references"; items?: Recent[] }) {
  return <section className="min-w-0 space-y-3 rounded-xl border border-border bg-card p-4" aria-labelledby={`recent-${type}`}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="font-semibold" id={`recent-${type}`}>Recent {type}</h2>
      <Link className="text-link" href={`/${type}`}>View all {type}</Link>
    </div>
    {items === undefined ? <div role="alert" className="space-y-2">
      <p>Recent {type} could not be loaded.</p><ReferenceRetryButton />
    </div> : items.length > 0 ? (
      <ul className="divide-y divide-border">
        {items.map((item) => <li key={item.id} className="py-3">
          <Link className="text-link wrap-anywhere" href={`/${type}/${item.id}`} prefetch={false}>{item.title || "Untitled"}</Link>
          <time className="block text-xs text-muted-foreground" dateTime={item.updatedAt.toISOString()}>{date.format(item.updatedAt)} UTC</time>
        </li>)}
      </ul>
    ) : <p className="text-muted-foreground">{type === "notes" ? "Your active notes will appear here." : "Save a web address to see it here."}</p>}
  </section>;
}

export default async function Dashboard() {
  let data: Awaited<ReturnType<typeof getDashboard>>;
  try {
    data = await getDashboard();
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof DataAccessError && error.code === "ACCOUNT_UNAVAILABLE") redirect("/auth/sign-in?error=account_unavailable");
    return <div className="page-wrap">
      <div className="page-heading"><h1>Dashboard</h1></div>
      <section className="note-state-card" role="alert"><h2>Dashboard could not be loaded</h2><p>Try again to load your workspace.</p><ReferenceRetryButton /></section>
    </div>;
  }
  const notes = data.notes.ok ? data.notes.data : undefined;
  const references = data.references.ok ? data.references.data : undefined;
  const note = notes?.[0];
  const reference = references?.items[0];
  const resume = note && (!reference || note.updatedOrder >= reference.updatedOrder)
    ? { ...note, href: `/notes/${note.id}` } : reference && { ...reference, href: `/references/${reference.id}` };

  return <div className="page-wrap space-y-6">
    <header className="page-heading dashboard-heading">
      <h1>Your knowledge workspace</h1>
      <p>Capture an idea or pick up where you left off.</p>
      <div className="dashboard-actions" aria-label="Quick actions">
        <CreateNoteButton label="New note" />
        {references ? <ReferenceCaptureForm collections={references.collections} tags={references.tags} />
          : <Link className="secondary-link" href="/references">Open References</Link>}
      </div>
    </header>
    {resume && <section aria-labelledby="resume-work" className="dashboard-resume rounded-xl border border-border bg-card p-4">
      <h2 className="font-semibold" id="resume-work">Resume recent work</h2>
      <Link className="text-link wrap-anywhere" href={resume.href} prefetch={false}>{resume.title || "Untitled"}</Link>
    </section>}
    <div className="grid gap-4 md:grid-cols-2">
      <RecentSection type="notes" items={notes} />
      <RecentSection type="references" items={references?.items} />
    </div>
  </div>;
}
