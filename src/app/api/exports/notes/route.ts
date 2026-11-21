import { randomUUID } from "node:crypto";
import { attachmentHeaders, privateTransferHeaders, transferError } from "@/lib/transfer/http";
import { markdownFilename, TransferInputError } from "@/lib/transfer/markdown";
import { exportNotesSnapshot } from "@/lib/transfer/service";
import { prepareMarkdownZip, streamZip } from "@/lib/transfer/zip";

export function HEAD() {
  return new Response(null, { status: 405, headers: { ...privateTransferHeaders, Allow: "GET" } });
}

export async function GET(request: Request) {
  const requestId = randomUUID();
  const deadline = Date.now() + 30_000;
  try {
    if (request.headers.get("sec-fetch-site") === "cross-site") {
      throw new TransferInputError("Start the bulk export from your workspace.", 403);
    }
    const snapshot = await exportNotesSnapshot();
    const zip = prepareMarkdownZip(snapshot.notes.map((note) => ({
      filename: markdownFilename(note.title, note.id),
      body: note.body,
    })));
    if (request.signal.aborted || Date.now() >= deadline) throw new Error("Export interrupted.");
    return new Response(streamZip(zip.chunks, request.signal, deadline, () => {
      console.error("Markdown export interrupted.", { requestId });
    }), {
      headers: {
        ...attachmentHeaders("cosmiccore-notes.zip", "application/zip", zip.size),
        "X-Export-Snapshot": snapshot.asOf,
      },
    });
  } catch (error) {
    return transferError(error, requestId);
  }
}
