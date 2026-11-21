import { MAX_BODY_BYTES, MAX_TITLE_CODE_POINTS } from "../notes/rules.ts";

export const MAX_IMPORT_BYTES = MAX_BODY_BYTES;
export const MAX_MULTIPART_BYTES = 320 * 1024;

export class TransferInputError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function readMarkdown(file: File) {
  if (!/\.md$/i.test(file.name)) throw new TransferInputError("Choose a .md file.");
  if (file.size > MAX_IMPORT_BYTES) throw new TransferInputError("Choose a Markdown file up to 256 KiB.", 413);
  let body: string;
  try {
    body = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(await file.arrayBuffer());
  } catch {
    throw new TransferInputError("The file could not be read as UTF-8 Markdown.");
  }
  if (/[^\P{Cc}\t\n\r]/u.test(body)) throw new TransferInputError("The file contains binary control characters.");
  const name = file.name.replaceAll("\\", "/").split("/").at(-1) ?? "";
  const title = Array.from(name.slice(0, -3).replace(/[\p{Cc}\uD800-\uDFFF]/gu, "").trim())
    .slice(0, MAX_TITLE_CODE_POINTS).join("").trim();
  return { title, body };
}

export function markdownFilename(title: string, id?: string) {
  let stem = title.normalize("NFKD").replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "").slice(0, 80);
  if (!stem || /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i.test(stem)) stem = stem ? `note-${stem}` : "untitled";
  return `${stem}${id ? `-${id}` : ""}.md`;
}
