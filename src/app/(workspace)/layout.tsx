import { AccountAppearanceProvider } from "@/components/appearance/provider";
import { Shell } from "@/components/layout/shell";
import { requireAppUser } from "@/lib/auth/app-user";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAppUser();

  return <AccountAppearanceProvider key={user.id} initial={{
    appearance: user.appearance, colorScheme: user.colorScheme, revision: user.preferencesRevision,
  }}>
    <Shell user={{ name: user.displayName, email: user.email }}>{children}</Shell>
  </AccountAppearanceProvider>;
}
