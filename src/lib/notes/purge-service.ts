import "server-only";

import { withDbTransaction } from "@/lib/db/transaction";
import { purgeExpiredNotesWithTransaction } from "./purge-core";
export type { PurgeBatchResult } from "./purge-core";

// Internal only: no public route or Server Action exposes maintenance.
export const purgeExpiredNotes = (batchSize = 50) => purgeExpiredNotesWithTransaction(withDbTransaction, batchSize);
