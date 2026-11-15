import "server-only";

import { withPrivateData } from "@/lib/db/private-data";
import { withPrivateMutation } from "@/lib/db/private-mutation";
import { notes } from "@/lib/db/schema";

export const listNotes = () => withPrivateData((data) => data.listNotes());
export const getNote = (id: string) => withPrivateData((data) => data.getNote(id));

export async function createNote(mutationId: string) {
  return withPrivateMutation({ operation: "create_note", mutationId, payload: { title: "", body: "" } }, {
    prepare: async (tx, ownerId) => ({
      changes: { notes_count: 1, notes_bytes: 0 },
      apply: async () => {
        const [created] = await tx.insert(notes).values({ ownerId, title: "", body: "" }).returning({
          id: notes.id, revision: notes.revision, updatedAt: notes.updatedAt,
        });
        return { entityId: created.id, revision: created.revision, resultUpdatedAt: created.updatedAt };
      },
    }),
    authorizeReplay: async (data, result) => { await data.getNote(result.entityId); },
  });
}
