"use server";

import { MutationError } from "@/lib/db/mutation-core";
import { createNote, getNote, NoteConflictError, NoteInputError, saveNote } from "@/lib/notes/service";
import { DataAccessError } from "@/lib/db/owned-data";

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

type SaveNoteInput = { noteId: string; expectedRevision: number; mutationId: string; title: string; body: string };
type SaveNoteResult =
  | { ok: true; revision: number; updatedAt: string; replayed: boolean }
  | { ok: false; code: "VALIDATION" | "NOT_FOUND" | "EXPIRED" | "RATE_LIMITED" | "QUOTA_EXCEEDED" | "DEPENDENCY_UNAVAILABLE"; message: string }
  | { ok: false; code: "CONFLICT"; message: string; latest: { title: string; body: string; revision: number; updatedAt: string } };

export async function saveNoteAction(input: SaveNoteInput): Promise<SaveNoteResult> {
  try {
    if (!input || typeof input !== "object" || typeof input.noteId !== "string" || typeof input.mutationId !== "string" || typeof input.title !== "string" || typeof input.body !== "string" || !Number.isSafeInteger(input.expectedRevision)) {
      return { ok: false, code: "VALIDATION", message: "Check the note fields and try again." };
    }
    const saved = await saveNote(input);
    return { ok: true, revision: saved.revision ?? input.expectedRevision, updatedAt: (saved.resultUpdatedAt ?? new Date()).toISOString(), replayed: saved.replayed };
  } catch (error) {
    if (error instanceof NoteConflictError) return { ok: false, code: "CONFLICT", message: "This note changed in another tab. Choose which version to keep.", latest: { title: error.latest.title, body: error.latest.body, revision: error.latest.revision, updatedAt: error.latest.updatedAt.toISOString() } };
    if (error instanceof MutationError && error.code === "EXPIRED") {
      try {
        const latest = await getNote(input.noteId);
        return { ok: false, code: "CONFLICT", message: "The save retry window expired. Compare the latest saved version before continuing.", latest: { title: latest.title, body: latest.body, revision: latest.revision, updatedAt: latest.updatedAt.toISOString() } };
      } catch {
        return { ok: false, code: "EXPIRED", message: "The save retry window expired. Reload this note before trying again." };
      }
    }
    if (error instanceof NoteInputError || (error instanceof DataAccessError && error.code === "VALIDATION")) return { ok: false, code: "VALIDATION", message: "Check the note fields and try again." };
    if (error instanceof DataAccessError || (error instanceof MutationError && error.code === "DEPENDENCY_UNAVAILABLE") || (error instanceof Error && error.message.startsWith("Configure COSMICCORE_GLOBAL_"))) return { ok: false, code: error instanceof MutationError ? error.code : "DEPENDENCY_UNAVAILABLE", message: "Notes are temporarily unavailable. Your changes are still in this editor." };
    if (error instanceof MutationError) return { ok: false, code: error.code, message: error.message };
    return { ok: false, code: "DEPENDENCY_UNAVAILABLE", message: "Notes are temporarily unavailable. Your changes are still in this editor." };
  }
}
