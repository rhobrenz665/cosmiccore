import "server-only";

import { unstable_rethrow } from "next/navigation";
import { withPrivateData } from "@/lib/db/private-data";
import { parseKnowledgeSearch } from "./search-core";

export function searchKnowledge(filters: ReturnType<typeof parseKnowledgeSearch>) {
  return withPrivateData(async (data) => {
    await data.assertAssociations(filters.collectionId, filters.tagIds, 20);
    return {
      ...await data.searchKnowledge(filters),
      collections: await data.listCollections(),
      tags: await data.listTags(),
    };
  });
}

async function loadRegion<T>(load: () => Promise<T>) {
  try {
    return { ok: true as const, data: await load() };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false as const };
  }
}

export function getDashboard() {
  return withPrivateData(async (data) => ({
    notes: await loadRegion(data.recentNotes),
    references: await loadRegion(data.recentReferences),
  }));
}
