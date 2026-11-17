"use server";

import { MutationError } from "@/lib/db/mutation-core";
import { changeNoteLifecycle, NoteLifecycleConflictError, createNote, DuplicateOrganizationNameError, getNoteEditorData, NoteConflictError, NoteInputError, mutateOrganization, saveNote } from "@/lib/notes/service";
import { DataAccessError } from "@/lib/db/owned-data";
import { MAX_TAGS_PER_NOTE } from "@/lib/notes/rules";

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

type SaveNoteInput = { noteId: string; expectedRevision: number; mutationId: string; title: string; body: string; collectionId: string | null; tagIds: string[] };
type SaveNoteResult =
  | { ok: true; revision: number; updatedAt: string; replayed: boolean }
  | { ok: false; code: "VALIDATION" | "NOT_FOUND" | "EXPIRED" | "RATE_LIMITED" | "QUOTA_EXCEEDED" | "DEPENDENCY_UNAVAILABLE"; message: string }
  | { ok: false; code: "CONFLICT"; message: string; latest: { title: string; body: string; collectionId: string | null; tagIds: string[]; collections: { id: string; displayName: string }[]; tags: { id: string; displayName: string }[]; revision: number; updatedAt: string } };

export async function saveNoteAction(input: SaveNoteInput): Promise<SaveNoteResult> {
  try {
    if (!input || typeof input !== "object" || typeof input.noteId !== "string" || typeof input.mutationId !== "string" || typeof input.title !== "string" || typeof input.body !== "string" || (input.collectionId !== null && typeof input.collectionId !== "string") || !Array.isArray(input.tagIds) || input.tagIds.length > MAX_TAGS_PER_NOTE || input.tagIds.some((id) => typeof id !== "string") || !Number.isSafeInteger(input.expectedRevision)) {
      return { ok: false, code: "VALIDATION", message: "Check the note fields and try again." };
    }
    const saved = await saveNote(input);
    return { ok: true, revision: saved.revision ?? input.expectedRevision, updatedAt: (saved.resultUpdatedAt ?? new Date()).toISOString(), replayed: saved.replayed };
  } catch (error) {
    if (error instanceof NoteConflictError) return { ok: false, code: "CONFLICT", message: "This note or one of its organization choices changed elsewhere. Choose which version to keep.", latest: { title: error.latest.title, body: error.latest.body, collectionId: error.latest.collectionId, tagIds: error.latest.tagIds, collections: error.latest.collections, tags: error.latest.tags, revision: error.latest.revision, updatedAt: error.latest.updatedAt.toISOString() } };
    if (error instanceof MutationError && error.code === "EXPIRED") {
      try {
        const editorData = await getNoteEditorData(input.noteId);
        const { note: latest, tagIds } = editorData;
        return { ok: false, code: "CONFLICT", message: "The save retry window expired. Compare the latest saved version before continuing.", latest: { title: latest.title, body: latest.body, collectionId: latest.collectionId, tagIds, collections: editorData.collections, tags: editorData.tags, revision: latest.revision, updatedAt: latest.updatedAt.toISOString() } };
      } catch {
        return { ok: false, code: "EXPIRED", message: "The save retry window expired. Reload this note before trying again." };
      }
    }
    if (error instanceof NoteInputError || (error instanceof DataAccessError && error.code === "VALIDATION")) return { ok: false, code: "VALIDATION", message: "Check the note fields and try again." };
    if (error instanceof DataAccessError && error.code === "NOT_FOUND") return { ok: false, code: "NOT_FOUND", message: "The note or selected organization no longer exists." };
    if (error instanceof DataAccessError || (error instanceof MutationError && error.code === "DEPENDENCY_UNAVAILABLE") || (error instanceof Error && error.message.startsWith("Configure COSMICCORE_GLOBAL_"))) return { ok: false, code: error instanceof MutationError ? error.code : "DEPENDENCY_UNAVAILABLE", message: "Notes are temporarily unavailable. Your changes are still in this editor." };
    if (error instanceof MutationError) return { ok: false, code: error.code, message: error.message };
    return { ok: false, code: "DEPENDENCY_UNAVAILABLE", message: "Notes are temporarily unavailable. Your changes are still in this editor." };
  }
}

type OrganizationInput = { kind: "collection" | "tag"; action: "create" | "rename" | "delete"; mutationId: string; id?: string; name?: string; noteId?: string };
type OrganizationResult =
  | { ok: true; id: string; displayName?: string; affectedCount?: number; noteRevision?: number }
  | { ok: false; code: string; message: string };

export async function mutateOrganizationAction(input: OrganizationInput): Promise<OrganizationResult> {
  try {
    if (!input || typeof input !== "object" || !["collection", "tag"].includes(input.kind) || !["create", "rename", "delete"].includes(input.action) || typeof input.mutationId !== "string" || (input.action !== "create" && typeof input.id !== "string") || (input.action !== "delete" && typeof input.name !== "string") || (input.noteId !== undefined && typeof input.noteId !== "string")) {
      return { ok: false, code: "VALIDATION", message: "Check the name and try again." };
    }
    const result = await mutateOrganization(input);
    return { ok: true, id: result.entityId, ...("displayName" in result ? { displayName: result.displayName } : { affectedCount: result.affectedCount, noteRevision: result.replayed ? undefined : result.revision }) };
  } catch (error) {
    if (error instanceof DuplicateOrganizationNameError) return { ok: false, code: "NAME_TAKEN", message: "A collection or tag with that name already exists." };
    if (error instanceof NoteInputError || (error instanceof DataAccessError && error.code === "VALIDATION")) return { ok: false, code: "VALIDATION", message: "Names must contain 1 to 60 characters." };
    if (error instanceof DataAccessError && error.code === "NOT_FOUND") return { ok: false, code: "NOT_FOUND", message: "That collection or tag is no longer available." };
    if (error instanceof MutationError) return { ok: false, code: error.code, message: error.message };
    if (error instanceof Error && error.message.startsWith("Configure COSMICCORE_GLOBAL_")) return { ok: false, code: "DEPENDENCY_UNAVAILABLE", message: "Organization changes are temporarily unavailable." };
    return { ok: false, code: "DEPENDENCY_UNAVAILABLE", message: "Organization changes are temporarily unavailable." };
  }
}


type LifecycleInput = { noteId: string; expectedRevision: number; mutationId: string; action: "trash" | "restore" };
export async function changeNoteLifecycleAction(input: LifecycleInput): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  try {
    if (!input || typeof input !== "object" || typeof input.noteId !== "string" || typeof input.mutationId !== "string" || !["trash", "restore"].includes(input.action) || !Number.isSafeInteger(input.expectedRevision)) {
      return { ok: false, code: "VALIDATION", message: "Check the note and try again." };
    }
    await changeNoteLifecycle(input);
    return { ok: true };
  } catch (error) {
    if (error instanceof NoteLifecycleConflictError) return { ok: false, code: "CONFLICT", message: error.message };
    if (error instanceof NoteInputError || (error instanceof DataAccessError && error.code === "VALIDATION")) return { ok: false, code: "VALIDATION", message: "Check the note and try again." };
    if (error instanceof DataAccessError && error.code === "NOT_FOUND") return { ok: false, code: "NOT_FOUND", message: "This note is no longer available for that action. Reload to see its current state." };
    if (error instanceof MutationError) return { ok: false, code: error.code, message: error.code === "EXPIRED" ? "The restore deadline or retry window has expired. Reload to see the current state." : error.message };
    return { ok: false, code: "DEPENDENCY_UNAVAILABLE", message: "The change could not be confirmed. Retry to safely check whether it completed." };
  }
}
