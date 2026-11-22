"use server";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { requireAppUser } from "@/lib/auth/app-user";
import { auth } from "@/lib/auth/server";
import { appUsers } from "@/lib/db/schema";
import { withDbTransaction } from "@/lib/db/transaction";
import { beginDeletion, confirmDeletion } from "@/lib/settings/deletion-core";
import { validPreferences } from "@/lib/settings/preferences";

const intentCookie = "__Secure-cosmiccore.delete-intent";
const intentCookieOptions = { httpOnly: true, secure: true, sameSite: "lax", path: "/" } as const;

export async function cancelAccountDeletion() {
  (await cookies()).set(intentCookie, "", { ...intentCookieOptions, maxAge: 0 });
}

export async function savePreferences(input: unknown) {
  if (!validPreferences(input)) return { ok: false as const, message: "Check your appearance choices." };
  try {
    const user = await requireAppUser();
    return await withDbTransaction(async (tx) => {
      const [account] = await tx.select({ status: appUsers.status }).from(appUsers).where(eq(appUsers.id, user.id)).for("update");
      if (account?.status !== "active") return { ok: false as const, message: "This account is unavailable." };
      const selection = { appearance: appUsers.appearance, colorScheme: appUsers.colorScheme, revision: appUsers.preferencesRevision };
      const [saved] = await tx.update(appUsers).set({
        appearance: input.appearance, colorScheme: input.colorScheme,
        preferencesRevision: sql`${appUsers.preferencesRevision} + 1`,
      }).where(and(eq(appUsers.id, user.id), eq(appUsers.preferencesRevision, input.revision))).returning(selection);
      if (saved) return { ok: true as const, preferences: saved };
      const [latest] = await tx.select(selection).from(appUsers).where(eq(appUsers.id, user.id));
      if (latest.appearance === input.appearance && latest.colorScheme === input.colorScheme) {
        return { ok: true as const, preferences: latest };
      }
      return { ok: false as const, message: "Appearance changed in another tab. Review the latest choices and try again.", latest };
    });
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false as const, message: "Appearance could not be saved. Try again." };
  }
}

export async function beginAccountDeletion() {
  if (process.env.COSMICCORE_ACCOUNT_DELETION_ENABLED !== "true") return { ok: false, message: "Account deletion is unavailable in this environment." };
  try {
    const user = await requireAppUser();
    const { data } = await auth.getSession();
    if (!data?.session.id || data.user.id !== user.authSubject) return { ok: false, message: "Sign in again before continuing." };
    const token = randomBytes(32).toString("base64url");
    await withDbTransaction((tx) => beginDeletion(tx, user.id, data.session.id, token));
    (await cookies()).set(intentCookie, token, { ...intentCookieOptions, maxAge: 300 });
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, message: "Could not start account deletion. Try again." };
  }
}

export async function confirmAccountDeletion(confirmation: string) {
  if (process.env.COSMICCORE_ACCOUNT_DELETION_ENABLED !== "true" || confirmation !== "DELETE") {
    return { ok: false, message: "Type DELETE to confirm account deletion." };
  }
  try {
    const jar = await cookies();
    const token = jar.get(intentCookie)?.value;
    const issuer = process.env.NEON_AUTH_BASE_URL;
    const { data } = await auth.getSession();
    if (!token || !issuer || !data?.session.id || !data.user.id) {
      return { ok: false, message: "Start again and complete the Google sign-in confirmation." };
    }
    const confirmed = await withDbTransaction((tx) => confirmDeletion(tx, {
      issuer, subject: data.user.id, token, sessionId: data.session.id, sessionCreatedAt: new Date(data.session.createdAt),
    }));
    if (!confirmed) return { ok: false, message: "Confirmation expired or Google did not issue a new session for this account. Start again." };
    jar.set(intentCookie, "", { ...intentCookieOptions, maxAge: 0 });
    return { ok: true };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, message: "The request could not be confirmed. Try again before closing this page." };
  }
}
