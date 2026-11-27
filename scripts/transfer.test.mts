import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_IMPORT_BYTES,
  markdownFilename,
  readMarkdown,
  TransferInputError,
} from "../src/lib/transfer/markdown.ts";
import { prepareMarkdownZip, streamZip } from "../src/lib/transfer/zip.ts";

test("imports UTF-8 Markdown and trims path components from the title", async () => {
  const result = await readMarkdown(new File(["# CosmicCore\n🌌"], "../nested/CosmicCore.md"));
  assert.deepEqual(result, { title: "CosmicCore", body: "# CosmicCore\n🌌" });
});

test("rejects a non-Markdown extension", async () => {
  await assert.rejects(() => readMarkdown(new File(["text"], "notes.txt")), /Choose a \.md file/);
});

test("rejects invalid UTF-8 and binary control characters", async () => {
  await assert.rejects(() => readMarkdown(new File([Uint8Array.of(0xff)], "invalid.md")), /UTF-8/);
  await assert.rejects(() => readMarkdown(new File([Uint8Array.of(0x41, 0x00, 0x42)], "nul.md")), /control characters/);
  await assert.rejects(() => readMarkdown(new File([Uint8Array.of(0x41, 0x01, 0x42)], "binary.md")), /control characters/);
});

test("accepts the exact body byte limit and rejects one byte over", async () => {
  const exactBytes = new Uint8Array(MAX_IMPORT_BYTES).fill(0x61);
  const exact = await readMarkdown(new File([exactBytes], "exact.md"));
  assert.equal(new TextEncoder().encode(exact.body).length, MAX_IMPORT_BYTES);
  await assert.rejects(
    () => readMarkdown(new File([new Uint8Array(MAX_IMPORT_BYTES + 1).fill(0x61)], "over.md")),
    (error) => error instanceof TransferInputError && error.status === 413,
  );
});

test("sanitizes traversal-like and reserved export filenames", () => {
  assert.equal(markdownFilename("../../CON"), "note-CON.md");
  assert.equal(markdownFilename("🌌✨"), "untitled.md");
  assert.equal(markdownFilename("A research note", "note-123"), "A-research-note-note-123.md");
});

test("creates a valid stored ZIP entry with the complete UTF-8 body", () => {
  const entryBody = "# CosmicCore\nA galaxy: 🌌";
  const zip = prepareMarkdownZip([{ filename: "cosmiccore.md", body: entryBody }]);
  const bytes = Buffer.concat(zip.chunks);
  assert.equal(zip.size, bytes.length);
  assert.equal(bytes.readUInt32LE(0), 0x04034b50);
  const nameLength = bytes.readUInt16LE(26);
  const extraLength = bytes.readUInt16LE(28);
  const bodyStart = 30 + nameLength + extraLength;
  const bodyLength = bytes.readUInt32LE(18);
  assert.equal(bytes.subarray(30, 30 + nameLength).toString("ascii"), "cosmiccore.md");
  assert.equal(bytes.subarray(bodyStart, bodyStart + bodyLength).toString("utf8"), entryBody);
  assert.equal(bytes.readUInt32LE(bodyStart + bodyLength), 0x02014b50);
  assert.equal(bytes.readUInt32LE(bytes.length - 22), 0x06054b50);
});

test("aborted ZIP streams reject pending reads and report interruption once", async () => {
  const controller = new AbortController();
  const chunks = [Uint8Array.of(1), Uint8Array.of(2)];
  let errors = 0;
  const stream = streamZip(chunks, controller.signal, Date.now() + 5_000, () => errors++);
  const reader = stream.getReader();
  assert.deepEqual((await reader.read()).value, Uint8Array.of(1));
  controller.abort();
  await assert.rejects(() => reader.read(), /Export interrupted/);
  assert.equal(errors, 1);
  assert.equal(chunks.length, 0);
});

test("expired ZIP stream fails before yielding data", async () => {
  let errors = 0;
  const reader = streamZip([Uint8Array.of(1)], new AbortController().signal, Date.now() - 1, () => errors++).getReader();
  await assert.rejects(() => reader.read(), /Export interrupted/);
  assert.equal(errors, 1);
});
