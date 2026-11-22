"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Moon, Search, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAppearance } from "@/components/appearance/provider";
import { primaryNavigation, secondaryNavigation } from "@/lib/navigation";
import { BrandMark } from "./brand-mark";
import { SignOutButton } from "@/components/settings/sign-out-button";

const mobilePrimary = primaryNavigation.filter(item => item.href !== "/references");
const moreNavigation = [...primaryNavigation.filter(item => item.href === "/references"), ...secondaryNavigation];

type ShellUser = { name: string | null; email: string };

export function Shell({ children, user }: { children: React.ReactNode; user: ShellUser }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const { appearance, resolvedColor, setColor, saving, message } = useAppearance();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const moreDestination = moreNavigation.find(item => isActive(item.href));
  const nextColor = resolvedColor === "dark" ? "light" : "dark";

  return <div className="shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <aside className="sidebar" aria-label="Workspace navigation">
      <Link href="/" className="brand"><BrandMark/><span>CosmicCore</span></Link>
      <div className="sidebar-body">
        <p className="nav-caption">WORKSPACE</p>
        <nav aria-label="Primary">{primaryNavigation.map(item => <NavLink key={item.href} item={item} active={isActive(item.href)}/>)}</nav>
      </div>
      <nav aria-label="Utilities" className="sidebar-footer">{secondaryNavigation.map(item => <NavLink key={item.href} item={item} active={isActive(item.href)}/>)}</nav>
    </aside>
    <div className="shell-main">
      <header className="topbar">
        <Link href="/" className="mobile-brand"><BrandMark/> CosmicCore</Link>
        <Link href="/knowledge" className="workspace-search" aria-label="Search Knowledge">
          <Search size={17} aria-hidden="true"/><span>Search Knowledge</span>
        </Link>
        <span className="account-label" title={user.email}>{user.name || user.email}</span>
        {appearance === "minimal" && (
          <Button variant="outline" size="icon" aria-label={`Switch to ${nextColor} mode`} title={`Switch to ${nextColor} mode`}
            disabled={saving} onClick={() => setColor(nextColor)}>
            {resolvedColor === "dark" ? <Sun size={18} aria-hidden="true"/> : <Moon size={18} aria-hidden="true"/>}
          </Button>
        )}
        <SignOutButton iconOnly />
        {message && message !== "Saved" && <span className="signout-error" role="status">{message}</span>}
      </header>
      <main id="main-content" tabIndex={-1} className="main-content">{children}</main>
    </div>
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {mobilePrimary.map(item => (
        <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? "page" : undefined} className="mobile-link">
          <item.icon size={20} aria-hidden="true"/><span>{item.label === "AI Chat" ? "Chat" : item.label}</span>
        </Link>
      ))}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetTrigger render={
          <button type="button" className="mobile-link" data-current-section={moreDestination ? "" : undefined}
            aria-label={moreDestination ? `More navigation, current section ${moreDestination.label}` : "More navigation"}>
            <Menu size={20} aria-hidden="true"/><span>More</span>
          </button>
        }/>
        <SheetContent side="bottom" className="workspace-more-sheet">
          <SheetHeader><SheetTitle>More destinations</SheetTitle></SheetHeader>
          <nav aria-label="More destinations" className="more-links">
            {moreNavigation.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)}
                aria-current={isActive(item.href) ? "page" : undefined}>
                <item.icon size={19} aria-hidden="true"/>{item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </nav>
  </div>;
}

type Item = (typeof primaryNavigation)[number] | (typeof secondaryNavigation)[number];
function NavLink({ item, active }: { item: Item; active: boolean }) {
  return <Link href={item.href} className="sidebar-link" aria-label={item.label} title={item.label} aria-current={active ? "page" : undefined}><item.icon size={19} aria-hidden="true"/><span>{item.label}</span></Link>;
}
