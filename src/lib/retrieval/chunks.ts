import { createHash } from "node:crypto";

export const CHUNK_FORMAT = 1;
const MAX_SOURCE_BYTES = 262_144;
const TARGET_UNITS = 1_500;
const OVERLAP_UNITS = 150;
const MAX_CHUNKS = 512;

export type SourceChunk = {
  ordinal: number;
  heading: string | null;
  start: number;
  end: number;
  text: string;
};

function safeBoundary(text: string, pos: number) {
  const code = text.charCodeAt(pos);
  return code >= 0xdc00 && code <= 0xdfff ? pos - 1 : pos;
}

/** Offsets are UTF-16 indices into the original text. No markup is executed. */
export function prepareSource(title: string, body: string) {
  if (Buffer.byteLength(body) > MAX_SOURCE_BYTES) throw new RangeError("Source exceeds the indexing limit.");

  const chunks: SourceChunk[] = [];
  let heading: string | null = null;
  let start = 0;
  let fence: string | null = null;

  function append(from: number, to: number) {
    while (from < to) {
      let end = safeBoundary(body, Math.min(from + TARGET_UNITS, to));
      if (end < to) {
        const newline = body.lastIndexOf("\n", end - 1);
        if (newline >= from + TARGET_UNITS / 2) end = newline + 1;
      }
      const text = body.slice(from, end);
      if (text.trim()) {
        if (chunks.length >= MAX_CHUNKS) throw new RangeError("Source exceeds the chunk count limit.");
        chunks.push({ ordinal: chunks.length, heading, start: from, end, text });
      }
      if (end >= to) break;
      from = safeBoundary(body, end - OVERLAP_UNITS);
    }
  }

  for (const line of body.matchAll(/[^\n]*(?:\n|$)/g)) {
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line[0].trimEnd());
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = null;
      continue;
    }
    if (fence) continue;
    const section = /^ {0,3}#{1,6}[ \t]+(.+)$/.exec(line[0].trimEnd());
    if (!section) continue;
    append(start, line.index);
    heading = section[1].trim().slice(0, safeBoundary(section[1].trim(), 200));
    start = line.index;
  }

  append(start, body.length);
  if (!chunks.length && title.trim()) chunks.push({ ordinal: 0, heading: null, start: 0, end: 0, text: "" });

  const hash = createHash("sha256").update(JSON.stringify([CHUNK_FORMAT, title, body])).digest("hex");
  return { hash, chunks };
}
