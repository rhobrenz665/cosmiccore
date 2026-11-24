import { answerChatQuestion } from "@/lib/chat/history";

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return new Response(null, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (body?.consent !== true || typeof body.conversationId !== "string" || typeof body.turnId !== "string") {
    return new Response(null, { status: 400 });
  }

  const encoder = new TextEncoder();
  const abort = new AbortController();
  const signal = AbortSignal.any([abort.signal, request.signal]);
  const stream = new ReadableStream({
    async start(controller) {
      function emit(event: string) {
        if (!signal.aborted) controller.enqueue(encoder.encode(event + "\n"));
      }
      emit("retrieving");
      try {
        const status = await answerChatQuestion(body.conversationId, body.turnId, {
          signal, onProgress: () => emit("generating"),
        });
        emit(status ?? "unavailable");
      } catch {
        emit("unavailable");
      } finally {
        if (!abort.signal.aborted) controller.close();
      }
    },
    cancel() {
      abort.abort();
    },
  });
  return new Response(stream, { headers: {
    "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store",
  } });
}
