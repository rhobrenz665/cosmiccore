"use server";

import { MutationError } from "@/lib/db/mutation-core";
import { createNote } from "@/lib/notes/service";

type CreateNoteResult =
  | { ok: true; noteId: string }
  | { ok: false; message: string; code: string };

export async function createNoteAction(mutationId: string): Promise<CreateNoteResult> {
  try {
    const result = await createNote(mutationId);
    return { ok: true, noteId: result.entityId };
  } catch (error) {
    if (error instanceof MutationError) return { ok: false, code: error.code, message: error.message };
    if (error instanceof Error && error.message.startsWith("Configure COSMICCORE_GLOBAL_")) {
      return { ok: false, code: "DEPENDENCY_UNAVAILABLE", message: "Notes are temporarily unavailable. Try again later." };
    }
    throw error;
  }
}
