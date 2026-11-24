import { AccountAppearanceProvider } from "@/components/appearance/provider";
import { Shell } from "@/components/layout/shell";
import { requireAppUser } from "@/lib/auth/app-user";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAppUser();

  return <AccountAppearanceProvider key={user.id} initial={{
    appearance: user.appearance, colorScheme: user.colorScheme, revision: user.preferencesRevision,
  }}>
    <script dangerouslySetInnerHTML={{ __html: `
      var root = document.documentElement;
      root.dataset.appearance = "${user.appearance === "minimal" ? "minimal" : "cosmic"}";
      root.dataset.color = "${user.colorScheme === "light" || user.colorScheme === "dark" ? user.colorScheme : "system"}";
      root.classList.toggle("dark", root.dataset.appearance === "cosmic" ||
        root.dataset.color === "dark" ||
        (root.dataset.color === "system" && matchMedia("(prefers-color-scheme: dark)").matches));
    ` }} />
    <Shell user={{ name: user.displayName, email: user.email }}>{children}</Shell>
  </AccountAppearanceProvider>;
}
