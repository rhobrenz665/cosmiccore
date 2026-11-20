export const MAX_REFERENCE_TAGS = 20;
const MAX_URL_BYTES = 2048;
const MAX_TITLE_CODE_POINTS = 200;
const MAX_DESCRIPTION_BYTES = 8192;

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const urlControls = /\p{Cc}/u;
const malformedText = /[\u0000\uD800-\uDFFF]/u;

export class ReferenceInputError extends Error {
  constructor(readonly field: "url" | "title" | "description" | "collectionId" | "tagIds") {
    super("Invalid reference input.");
    this.name = "ReferenceInputError";
  }
}

export function normalizeReferenceUrl(input: unknown) {
  if (typeof input !== "string" || Buffer.byteLength(input, "utf8") > MAX_URL_BYTES
      || urlControls.test(input) || malformedText.test(input)) {
    throw new ReferenceInputError("url");
  }

  const value = input.trim();
  // Check the supplied authority because the parser can repair missing slashes
  // and discard empty user info before exposing hostname and credentials.
  const authority = /^https?:\/\/([^/?#\\]+)/i.exec(value)?.[1];
  if (!authority || authority.includes("@") || value.includes("\\")) {
    throw new ReferenceInputError("url");
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new ReferenceInputError("url");
  }
  if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password) {
    throw new ReferenceInputError("url");
  }
  const url = parsed.href;
  parsed.hash = "";
  const canonicalUrlKey = parsed.href;
  if (Buffer.byteLength(url, "utf8") > MAX_URL_BYTES || Buffer.byteLength(canonicalUrlKey, "utf8") > MAX_URL_BYTES) {
    throw new ReferenceInputError("url");
  }
  return { url, canonicalUrlKey };
}

export function normalizeReference(input: {
  url: unknown; title: unknown; description?: unknown; collectionId: unknown; tagIds: unknown;
}) {
  const destination = normalizeReferenceUrl(input.url);
  if (typeof input.title !== "string" || malformedText.test(input.title)) {
    throw new ReferenceInputError("title");
  }
  const title = input.title.trim();
  if (!title || Array.from(title).length > MAX_TITLE_CODE_POINTS) {
    throw new ReferenceInputError("title");
  }
  const description = input.description === undefined ? "" : input.description;
  if (typeof description !== "string" || malformedText.test(description)
      || Buffer.byteLength(description, "utf8") > MAX_DESCRIPTION_BYTES) {
    throw new ReferenceInputError("description");
  }
  if (input.collectionId !== null && (typeof input.collectionId !== "string" || !uuid.test(input.collectionId))) {
    throw new ReferenceInputError("collectionId");
  }
  if (!Array.isArray(input.tagIds) || input.tagIds.length > MAX_REFERENCE_TAGS) {
    throw new ReferenceInputError("tagIds");
  }
  const tagIds = Array.from(input.tagIds, (id: unknown) => {
    if (typeof id !== "string" || !uuid.test(id)) throw new ReferenceInputError("tagIds");
    return id.toLowerCase();
  }).sort();
  if (new Set(tagIds).size !== tagIds.length) throw new ReferenceInputError("tagIds");

  return {
    ...destination, title, description,
    collectionId: input.collectionId?.toLowerCase() ?? null,
    tagIds,
    storageBytes: Buffer.byteLength(destination.url, "utf8")
      + Buffer.byteLength(title, "utf8") + Buffer.byteLength(description, "utf8"),
  };
}
