import "server-only";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { appUsers, type AppUser } from "@/lib/db/schema";
import { db } from "@/lib/db/client";
import { auth } from "@/lib/auth/server";

export async function requireAppUser(): Promise<AppUser> {
  const { data: session, error } = await auth.getSession();
  const user = session?.user;

  if (error || !user) {
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

  if (!appUser) {
    redirect("/auth/sign-in?error=account_unavailable");
  }

  if (appUser.status !== "active") {
    redirect("/auth/sign-in?error=account_unavailable");
  }

  return appUser;
}
