import Link from "next/link";
import { requireAppUser } from "@/lib/auth/app-user";
import { MarkdownImport } from "@/components/transfer/markdown-import";

export const dynamic = "force-dynamic";

export default async function ImportNotePage() {
  await requireAppUser();
  return <div className="page-wrap space-y-5">
    <Link className="secondary-link" href="/notes">Back to notes</Link>
    <header className="page-heading">
      <h1>Import Markdown</h1>
      <p>Choose one UTF-8 .md file up to 256 KiB. The filename becomes the title and the file contents become the note body.</p>
    </header>
    <MarkdownImport />
  </div>;
}
