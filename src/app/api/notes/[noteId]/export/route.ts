import { randomUUID } from "node:crypto";
import { attachmentHeaders, transferError } from "@/lib/transfer/http";
import { markdownFilename } from "@/lib/transfer/markdown";
import { exportMarkdownNote } from "@/lib/transfer/service";

export async function GET(_request: Request, { params }: { params: Promise<{ noteId: string }> }) {
  const requestId = randomUUID();
  try {
    const { noteId } = await params;
    const note = await exportMarkdownNote(noteId);
    return new Response(note.body, {
      headers: attachmentHeaders(markdownFilename(note.title), "text/markdown; charset=utf-8", Buffer.byteLength(note.body)),
    });
  } catch (error) {
    return transferError(error, requestId, "note");
  }
}
