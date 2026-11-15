import { redirect } from "next/navigation";

import { SignInCard } from "@/components/auth/sign-in-card";
import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function SignInPage({ searchParams }: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const params = await searchParams;
  const { data: session } = await auth.getSession();

  if (session?.user && params.error !== "account_unavailable") {
    redirect("/dashboard");
  }

  return <SignInCard />;
}
