import { SignInCard } from "@/components/auth/sign-in-card";

export const dynamic = "force-dynamic";

export default async function SignInPage({ searchParams }: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  await searchParams;
  return <SignInCard />;
}
