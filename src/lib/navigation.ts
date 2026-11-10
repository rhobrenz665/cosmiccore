import { BookOpen, FolderSearch, LayoutDashboard, Link2, MessageCircle, Settings2, Trash2 } from "lucide-react";

export const primaryNavigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/knowledge", label: "Knowledge", icon: FolderSearch },
  { href: "/notes", label: "Notes", icon: BookOpen },
  { href: "/references", label: "References", icon: Link2 },
  { href: "/chat", label: "AI Chat", icon: MessageCircle },
] as const;
export const secondaryNavigation = [
  { href: "/trash", label: "Trash", icon: Trash2 },
  { href: "/settings", label: "Settings", icon: Settings2 },
] as const;
