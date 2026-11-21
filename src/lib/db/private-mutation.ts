import "server-only";

import { requireAppUser } from "@/lib/auth/app-user";
import { executeMutation, type MutationHandler, type MutationRequest } from "@/lib/db/mutation-core";
import { readQuotaPolicy } from "@/lib/db/quota-policy";
import { withDbTransaction } from "@/lib/db/transaction";

// Trusted feature-service entry point, not a Server Action. Browser input must
// never supply a handler, owner ID, usage delta, policy or clock override.
export async function withPrivateMutation(request: MutationRequest, handler: MutationHandler, failure?: "throw") {
  const user = await requireAppUser(failure);
  const policy = readQuotaPolicy(process.env);
  return withDbTransaction((tx) => executeMutation(tx, user.id, request, policy, handler));
}
