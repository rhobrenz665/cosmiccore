"use server";

import { unstable_rethrow } from "next/navigation";
import { DataAccessError } from "@/lib/db/owned-data";
import { indexPrivateSource } from "@/lib/retrieval/service";

export async function prepareSavedSource(kind: unknown, id: unknown) {
  if ((kind !== "note" && kind !== "reference") || typeof id !== "string" ||
      !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) {
    return { ok: false as const, message: "This source is unavailable." };
  }

  try {
    return { ok: true as const, revision: await indexPrivateSource({ kind, id }) };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof DataAccessError) return { ok: false as const, message: "This source is unavailable." };
    if (error instanceof RangeError) return { ok: false as const, message: "This source exceeds the indexing limits. Your original content is unchanged." };
    return { ok: false as const, message: "Indexing could not finish. Try again." };
  }
}
