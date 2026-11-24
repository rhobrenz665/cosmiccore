import assert from "node:assert/strict";
import test from "node:test";
import { generateNoteAnswer } from "../src/lib/ai/note-answer.ts";

const input = { question: "Where are the invoices?", passage: "The invoices are in the blue folder." };

test("sends the selected passage and returns only a complete answer", async () => {
  const request: typeof fetch = async (url, options) => {
    assert.equal(url, "https://api.groq.com/openai/v1/chat/completions");
    const body = JSON.parse(String(options?.body));
    assert.deepEqual(JSON.parse(body.messages[1].content), input);
    assert.equal(body.max_completion_tokens, 1536);
    return Response.json({ choices: [{ finish_reason: "stop", message: {
      content: JSON.stringify({ answer: "In the blue folder.", quote: input.passage }), reasoning: "Hidden reasoning",
    } }] });
  };
  assert.deepEqual(await generateNoteAnswer("test-key", input, request), {
    kind: "answered", answer: "In the blue folder.",
  });
});

test("handles no evidence, rate limits, truncation and missing credentials", async () => {
  const complete = (content: string, finish_reason: string) => async () =>
    Response.json({ choices: [{ finish_reason, message: { content } }] });
  assert.deepEqual(await generateNoteAnswer("test-key", input, complete('{"answer":null,"quote":null}', "stop")), { kind: "insufficient" });
  assert.deepEqual(await generateNoteAnswer("test-key", input, complete("Partial response", "length")), { kind: "unavailable" });
  assert.deepEqual(await generateNoteAnswer("test-key", input, async () =>
    new Response(null, { status: 429 })), { kind: "rate-limited" });
  assert.deepEqual(await generateNoteAnswer("test-key", input,
    complete('{"answer":"They are due Friday.","quote":"Due Friday."}', "stop")), { kind: "insufficient" });
  let called = false;
  const result = await generateNoteAnswer("", input, async () => {
    called = true;
    return new Response();
  });
  assert.deepEqual(result, { kind: "unavailable" });
  assert.equal(called, false);
});

test("current weather questions do not send a historical passage to Groq", async () => {
  let called = false;
  const result = await generateNoteAnswer("test-key", {
    question: "What is the weather in London today?",
    passage: "London weather log, July 2, 2022: rain in the afternoon.",
  }, async () => {
    called = true;
    return new Response();
  });
  assert.deepEqual(result, { kind: "insufficient" });
  assert.equal(called, false);
});
