import assert from "node:assert/strict";
import test from "node:test";
import { selectNotePassage } from "../src/lib/retrieval/note-passage.ts";

test("questions select different passages from the same saved note", () => {
  const body = "Travel costs are covered.\n\nThe launch date is Friday.";
  assert.equal(selectNotePassage(body, "What is the launch date?"), "The launch date is Friday.");
  assert.equal(selectNotePassage(body, "What are the travel costs?"), "Travel costs are covered.");
  assert.equal(selectNotePassage(body, "Where are the invoices?"), null);
  assert.equal(selectNotePassage(body, "What is it?"), null);
});

test("finds late text in a long paragraph and preserves the original Unicode", () => {
  const body = "🌌".repeat(1200) + " Ｂｕｄｇｅｔ is approved.";
  const excerpt = selectNotePassage(body, "What is the budget?");
  assert.ok(excerpt?.includes("Ｂｕｄｇｅｔ"));
  assert.ok(body.includes(excerpt!) && Array.from(excerpt!).length <= 600);
});
