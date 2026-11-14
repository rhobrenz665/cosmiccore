import { Shell } from "@/components/layout/shell";
import { requireAppUser } from "@/lib/auth/app-user";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAppUser();

  return <Shell user={{ name: user.displayName, email: user.email, image: user.avatarUrl }}>{children}</Shell>;
}
