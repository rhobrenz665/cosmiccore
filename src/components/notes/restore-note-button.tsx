"use client";

import { NoteLifecycleButton } from "./note-lifecycle-button";

export function RestoreNoteButton({ noteId, revision }: { noteId: string; revision: number }) {
  return <NoteLifecycleButton noteId={noteId} action="restore" getRevision={() => revision}/>;
}
