import assert from "node:assert/strict";
import test from "node:test";
import { generateChatEvidence } from "../src/lib/ai/chat-evidence.ts";

const passages = ["The launch date is April 4.", "The launch owner is Morgan."];
const requestWith = (citations: unknown): typeof fetch => async () => Response.json({
  choices: [{ finish_reason: "stop", message: {
    content: JSON.stringify({ answer: "Morgan owns the April 4 launch.", citations }),
  } }],
});

test("accepts evidence from two indexed passages", async () => {
  const result = await generateChatEvidence("fixture", "When is the launch and who owns it?", passages,
    requestWith([{ index: 0, quote: "April 4" }, { index: 1, quote: "Morgan" }]));
  assert.deepEqual(result, { kind: "answered", answer: "Morgan owns the April 4 launch.", indices: [0, 1] });
});

test("rejects an invented citation even if another citation is valid", async () => {
  const result = await generateChatEvidence("fixture", "When is the launch?", passages,
    requestWith([{ index: 0, quote: "April 4" }, { index: 1, quote: "April 4" }]));
  assert.deepEqual(result, { kind: "insufficient" });
});
