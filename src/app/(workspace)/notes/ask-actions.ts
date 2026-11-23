"use server";

import { selectNotePassage } from "@/lib/retrieval/note-passage";
import { unstable_rethrow } from "next/navigation";
import { DataAccessError } from "@/lib/db/owned-data";
import { getPrivateNote } from "@/lib/db/private-data";

export async function previewNoteQuestion(input: { noteId: string; revision: number; question: string }) {
  if (!input || typeof input.question !== "string" || input.question.length > 500 ||
      !input.question.trim() || !Number.isSafeInteger(input.revision) || input.revision < 1) {
    return { ok: false as const, message: "Enter a question of up to 500 characters." };
  }

  try {
    const note = await getPrivateNote(input.noteId);
    if (note.revision !== input.revision) {
      return { ok: false as const, message: "This note changed. Reload the saved note before asking again." };
    }
    const body = note.body.trim();
    if (!body) return { ok: false as const, message: "Add and save some text in this note first." };

    const excerpt = selectNotePassage(body, input.question);
    if (!excerpt) return { ok: false as const, message: "No matching passage found. Try a specific word or phrase from the note." };
    return {
      ok: true as const,
      revision: note.revision,
      title: note.title || "Untitled",
      excerpt,
    };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof DataAccessError) return { ok: false as const, message: "This saved note is unavailable." };
    return { ok: false as const, message: "The preview could not load. Try again." };
  }
}
