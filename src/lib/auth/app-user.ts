import "server-only";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { appUsers, type AppUser } from "@/lib/db/schema";
import { db } from "@/lib/db/client";
import { auth } from "@/lib/auth/server";

export class PrivateAccountUnavailable extends Error {
  constructor() {
    super("Sign in to an active account to continue.");
  }
}

export async function requireAppUser(failure: "redirect" | "throw" = "redirect"): Promise<AppUser> {
  const { data: session, error } = await auth.getSession();
  const user = session?.user;

  if (error || !user) {
    if (failure === "throw") throw new PrivateAccountUnavailable();
    redirect("/auth/sign-in");
  }

  const issuer = process.env.NEON_AUTH_BASE_URL;
  if (!issuer) {
    throw new Error("NEON_AUTH_BASE_URL is required for identity mapping.");
  }

  const [appUser] = await db
    .insert(appUsers)
    .values({
      authIssuer: issuer,
      authSubject: user.id,
      email: user.email,
      displayName: user.name,
      avatarUrl: user.image,
    })
    .onConflictDoUpdate({
      target: [appUsers.authIssuer, appUsers.authSubject],
      set: {
        email: user.email,
        displayName: user.name,
        avatarUrl: user.image,
        updatedAt: new Date(),
      },
      setWhere: eq(appUsers.status, "active"),
    })
    .returning();

  if (!appUser || appUser.status !== "active") {
    if (failure === "throw") throw new PrivateAccountUnavailable();
    redirect("/auth/sign-in?error=account_unavailable");
  }


  return appUser;
}
