"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { MutationError } from "@/lib/db/mutation-core";
import { DataAccessError } from "@/lib/db/owned-data";
import { ReferenceInputError } from "@/lib/references/rules";
import { createReference, deleteReference, DuplicateReferenceError, ReferenceConflictError, setReferenceNoteLink, updateReference } from "@/lib/references/service";

const fieldMessages = {
  url: "Enter an HTTP or HTTPS address up to 2,048 bytes, without credentials.",
  title: "Enter a title between 1 and 200 characters.",
  description: "Keep the description within 8 KiB and remove invalid characters.",
  collectionId: "Select an available collection.",
  tagIds: "Select up to 20 different tags.",
};

type ReferenceResult =
  | { ok: true; referenceId: string }
  | {
    ok: false;
    message: string;
    field?: keyof typeof fieldMessages;
    existingReferenceId?: string;
    retrySameRequest?: boolean;
    conflict?: boolean;
  };

async function runReferenceAction(
  input: { mutationId: string },
  run: () => Promise<{ referenceId: string }>,
): Promise<ReferenceResult> {
  try {
    if (!input || typeof input !== "object" || typeof input.mutationId !== "string") {
      return { ok: false, message: "Check the fields and try again." };
    }
    const result = await run();
    revalidatePath("/references");
    revalidatePath("/references/[referenceId]", "page");
    revalidatePath("/notes/[noteId]", "page");
    return { ok: true, referenceId: result.referenceId };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ReferenceInputError) {
      return { ok: false, field: error.field, message: fieldMessages[error.field] };
    }
    if (error instanceof DuplicateReferenceError) {
      return { ok: false, message: "You already saved this address. Links that differ only by the part after # count as the same address.", existingReferenceId: error.existingReferenceId };
    }
    if (error instanceof ReferenceConflictError) return { ok: false, message: error.message, conflict: true };
    if (error instanceof DataAccessError && error.code === "NOT_FOUND") {
      return { ok: false, message: "The reference or selected collection or tag is no longer available. Review your library and try again." };
    }
    if (error instanceof DataAccessError && error.code === "VALIDATION") {
      return { ok: false, message: "Check the fields and try again." };
    }
    if (error instanceof MutationError) {
      if (error.code === "QUOTA_EXCEEDED") return { ok: false, message: "A reference storage limit was reached. Try a shorter description or contact support if the problem persists." };
      if (error.code === "RATE_LIMITED") return { ok: false, message: "Too many changes in a short time. Wait a minute and try again." };
      if (error.code === "EXPIRED") return { ok: false, message: "The retry window expired. Check your library before saving again." };
      if (error.code === "VALIDATION") return { ok: false, message: "Check the fields and try again." };
    }
    return { ok: false, message: "The change could not be confirmed. Retry to check whether it completed.", retrySameRequest: true };
  }
}

export async function createReferenceAction(input: Parameters<typeof createReference>[0]) {
  return runReferenceAction(input, () => createReference(input));
}

export async function updateReferenceAction(input: Parameters<typeof updateReference>[0]) {
  return runReferenceAction(input, () => updateReference(input));
}

export async function deleteReferenceAction(input: Parameters<typeof deleteReference>[0]) {
  return runReferenceAction(input, () => deleteReference(input));
}

export async function setReferenceNoteLinkAction(input: Parameters<typeof setReferenceNoteLink>[0]) {
  return runReferenceAction(input, () => setReferenceNoteLink(input));
}
