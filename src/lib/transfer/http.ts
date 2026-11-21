import "server-only";

import { PrivateAccountUnavailable } from "@/lib/auth/app-user";
import { MutationError } from "@/lib/db/mutation-core";
import { DataAccessError } from "@/lib/db/owned-data";
import { TransferInputError } from "./markdown";

export const privateTransferHeaders = {
  "Cache-Control": "private, no-store, no-transform",
  "X-Content-Type-Options": "nosniff",
};

export function attachmentHeaders(filename: string, contentType: string, size: number) {
  return {
    ...privateTransferHeaders,
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Content-Length": String(size),
    "X-Export-Bytes": String(size),
  };
}

export function transferError(error: unknown, requestId: string, resource = "transfer") {
  function response(status: number, code: string, message: string, retryAfterSeconds?: number) {
    const retry = retryAfterSeconds === undefined ? {} : { retryAfterSeconds };
    const headers = new Headers(privateTransferHeaders);
    if (retryAfterSeconds !== undefined) headers.set("Retry-After", String(retryAfterSeconds));
    return Response.json({ ok: false, code, message, requestId, ...retry }, { status, headers });
  }
  if (error instanceof PrivateAccountUnavailable || error instanceof DataAccessError && error.code === "ACCOUNT_UNAVAILABLE") {
    return response(401, "UNAUTHENTICATED", "Sign in to an active account to continue.");
  }
  if (error instanceof TransferInputError) {
    const code = ({ 403: "FORBIDDEN", 413: "TOO_LARGE", 429: "RATE_LIMITED" } as Record<number, string>)[error.status] ?? "VALIDATION";
    return response(error.status, code, error.message);
  }
  if (error instanceof DataAccessError) {
    return response(resource === "note" ? 404 : 400, "NOT_FOUND", resource === "note"
      ? "That note is unavailable." : "A selected collection or tag is unavailable.");
  }
  if (error instanceof MutationError && error.code !== "DEPENDENCY_UNAVAILABLE") {
    const status = error.code === "QUOTA_EXCEEDED" || error.code === "RATE_LIMITED" ? 429 : error.code === "EXPIRED" ? 409 : 400;
    return response(status, error.code, error.message, error.retryAfterSeconds);
  }
  console.error("Markdown transfer failed.", { requestId });
  return response(503, "DEPENDENCY_UNAVAILABLE", "Markdown transfer is temporarily unavailable. Try again.");
}
