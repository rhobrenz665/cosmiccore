import { randomUUID } from "node:crypto";
import { importMarkdownNote } from "@/lib/notes/service";
import { MAX_TAGS_PER_NOTE } from "@/lib/notes/rules";
import { privateTransferHeaders, transferError } from "@/lib/transfer/http";
import { MAX_MULTIPART_BYTES, readMarkdown, TransferInputError } from "@/lib/transfer/markdown";

async function readMultipart(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^multipart\/form-data\s*;/i.test(contentType) || !request.body) throw new TransferInputError("Send one Markdown file.");
  if (Number(request.headers.get("content-length")) > MAX_MULTIPART_BYTES) {
    throw new TransferInputError("The import request is too large.", 413);
  }

  const reader = request.body.getReader();
  const bytes = new Uint8Array(MAX_MULTIPART_BYTES);
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (size + value.length > MAX_MULTIPART_BYTES) {
        void reader.cancel().catch(() => {});
        throw new TransferInputError("The import request is too large.", 413);
      }
      bytes.set(value, size);
      size += value.length;
    }
  } finally {
    reader.releaseLock();
  }

  try {
    return await new Response(bytes.subarray(0, size), { headers: { "Content-Type": contentType } }).formData();
  } catch {
    throw new TransferInputError("The upload could not be read. Choose one Markdown file.");
  }
}

function readMetadata(data: FormData) {
  for (const key of data.keys()) {
    if (!["file", "mutationId", "collectionId", "tagIds"].includes(key) || data.getAll(key).length !== 1) {
      throw new TransferInputError("Send one file and one set of import details.");
    }
  }
  const mutationId = data.get("mutationId");
  const collection = data.get("collectionId");
  const tags = data.get("tagIds");
  if (typeof mutationId !== "string" || (collection !== null && typeof collection !== "string") ||
    (tags !== null && typeof tags !== "string")) throw new TransferInputError("Check the import details.");

  let tagIds: unknown = [];
  if (tags !== null) {
    try {
      tagIds = JSON.parse(tags);
    } catch {
      throw new TransferInputError("Check the selected tags.");
    }
  }
  if (!Array.isArray(tagIds) || tagIds.length > MAX_TAGS_PER_NOTE || tagIds.some((id) => typeof id !== "string")) {
    throw new TransferInputError("Check the selected tags.");
  }
  return { mutationId, collectionId: collection?.toLowerCase() || null, tagIds: tagIds.map((id) => id.toLowerCase()).sort() };
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  try {
    const host = request.headers.get("host");
    const protocol = new URL(request.url).protocol;
    // Next can use its bind hostname in request.url. The HTTP Host is the
    // browser-facing authority and cannot be set by cross-origin JavaScript.
    if (!host || request.headers.get("origin") !== `${protocol}//${host}`) {
      throw new TransferInputError("Import requests must come from this workspace.", 403);
    }
    const form = await readMultipart(request);
    const file = form.get("file");
    if (!(file instanceof File)) throw new TransferInputError("Choose one .md file.");
    const saved = await importMarkdownNote({ ...readMetadata(form), ...await readMarkdown(file) });
    return Response.json({ ok: true, noteId: saved.entityId, revision: saved.revision, replayed: saved.replayed }, {
      status: saved.replayed ? 200 : 201, headers: privateTransferHeaders,
    });
  } catch (error) {
    return transferError(error, requestId);
  }
}
