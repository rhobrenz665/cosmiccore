import { redirect } from "next/navigation";

import { SignInCard } from "@/components/auth/sign-in-card";
import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const { data: session } = await auth.getSession();

  if (session?.user) {
    redirect("/dashboard");
  }

  return <SignInCard />;
}
