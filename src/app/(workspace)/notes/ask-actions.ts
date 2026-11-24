"use server";

import { generateNoteAnswer } from "@/lib/ai/note-answer";
import { reserveNoteAnswer } from "@/lib/ai/note-answer-quota";
import { requireAppUser } from "@/lib/auth/app-user";
import { openOwnedData } from "@/lib/db/owned-data";
import { withDbTransaction } from "@/lib/db/transaction";
import { selectNotePassage } from "@/lib/retrieval/note-passage";
import { unstable_rethrow } from "next/navigation";
import { DataAccessError } from "@/lib/db/owned-data";
import { getPrivateNote } from "@/lib/db/private-data";

export async function previewNoteQuestion(input: { noteId: string; revision: number; question: string; sendToGroq?: boolean }) {
  if (!input || typeof input.question !== "string" || input.question.length > 500 ||
      !input.question.trim() || !Number.isSafeInteger(input.revision) || input.revision < 1) {
    return { ok: false as const, message: "Enter a question of up to 500 characters." };
  }

  try {
    if (input.sendToGroq === true) {
      const key = process.env.GROQ_API_KEY?.trim();
      if (!key || process.env.COSMICCORE_NOTE_ANSWERS_ENABLED !== "true") {
        return { ok: false as const, message: "AI answers are currently unavailable." };
      }
      const owner = await requireAppUser("throw");
      const source = await withDbTransaction(async tx => {
        const data = await openOwnedData(tx, owner.id);
        const note = await data.getNote(input.noteId);
        if (note.revision !== input.revision) return { message: "This note changed. Reload it before asking again." };
        const excerpt = selectNotePassage(note.body, input.question);
        if (!excerpt) return { message: "No matching passage found in the saved note." };
        if (!await reserveNoteAnswer(tx, owner.id)) return { message: "The AI usage limit was reached. Try again later." };
        return { excerpt, title: note.title || "Untitled" };
      });
      if (source.message !== undefined) return { ok: false as const, message: source.message };
      const latest = await getPrivateNote(input.noteId);
      if (latest.revision !== input.revision) return { ok: false as const, message: "This note changed. Ask again after saving." };
      const result = await generateNoteAnswer(key, { question: input.question, passage: source.excerpt });
      const current = await getPrivateNote(input.noteId);
      if (current.revision !== input.revision) return { ok: false as const, message: "This note changed. Ask again after saving." };
      if (result.kind === "answered") {
        return { ok: true as const, revision: current.revision, title: source.title, excerpt: source.excerpt, answer: result.answer };
      }
      const message = result.kind === "insufficient" ? "The matching passage did not contain enough information."
        : result.kind === "rate-limited" ? "Groq is busy. Try again later." : "The answer could not load. Try again.";
      return { ok: false as const, message };
    }
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
