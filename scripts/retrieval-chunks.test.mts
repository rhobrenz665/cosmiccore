import assert from "node:assert/strict";
import test from "node:test";

import { prepareSource } from "../src/lib/retrieval/chunks.ts";

test("retains offsets, Markdown and headings without treating code lines as headings", () => {
  const source = "# First\r\n```md\r\n# Inside code\r\n```\r\n\r\n## Second\r\nBody";
  const { chunks } = prepareSource("Title", source);
  assert.deepEqual(chunks.map(chunk => chunk.heading), ["First", "Second"]);
  for (const chunk of chunks) assert.equal(chunk.text, source.slice(chunk.start, chunk.end));
  assert.match(chunks[0].text, /Inside code/);
});

test("chunks large input with bounded overlap and preserves Unicode boundaries", () => {
  const source = "A".repeat(1499) + "🌌".repeat(1500);
  const { chunks } = prepareSource("Title", source);
  assert.ok(chunks.length > 1);
  assert.equal(chunks.at(-1)?.end, source.length);
  for (const [index, chunk] of chunks.entries()) {
    assert.equal(chunk.ordinal, index);
    assert.equal(chunk.text, source.slice(chunk.start, chunk.end));
    assert.ok(chunk.text.length <= 1500 && chunk.text.isWellFormed());
    if (index) assert.ok(chunks[index - 1].end - chunk.start <= 151);
  }
});

test("hash detects changes and title-only records can be indexed", () => {
  assert.notEqual(prepareSource("one", "").hash, prepareSource("two", "").hash);
  assert.notEqual(prepareSource("one", "").hash, prepareSource("one", "body").hash);
  assert.equal(prepareSource("one", "").chunks.length, 1);
  assert.deepEqual(prepareSource("", "\n").chunks, []);
  assert.throws(() => prepareSource("", "a".repeat(262145)), RangeError);
});

test("rejects highly fragmented sources instead of returning a partial version", () => {
  assert.throws(() => prepareSource("Title", "# Heading\n".repeat(513)), /chunk count/);
});
