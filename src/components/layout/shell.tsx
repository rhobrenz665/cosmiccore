"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Moon, Sparkles, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAppearance } from "@/components/appearance/provider";
import { primaryNavigation, secondaryNavigation } from "@/lib/navigation";

const mobilePrimary = primaryNavigation.filter(item => item.href !== "/references");
const moreNavigation = [primaryNavigation[3], ...secondaryNavigation];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const { resolvedColor, setColor } = useAppearance();
  const nextColor = resolvedColor === "dark" ? "light" : "dark";
  return <div className="shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <aside className="sidebar" aria-label="Workspace navigation">
      <Link href="/" className="brand"><span className="brand-mark"><Sparkles size={20}/></span><span>CosmicCore<small>YOUR KNOWLEDGE SPACE</small></span></Link>
      <div className="sidebar-body">
        <p className="nav-caption">WORKSPACE</p>
        <nav aria-label="Primary">{primaryNavigation.map(item => <NavLink key={item.href} item={item} active={pathname === item.href}/>)}</nav>
      </div>
      <nav aria-label="Utilities" className="sidebar-footer">{secondaryNavigation.map(item => <NavLink key={item.href} item={item} active={pathname === item.href}/>)}</nav>
    </aside>
    <div className="shell-main">
      <header className="topbar"><Link href="/" className="mobile-brand"><Sparkles size={19}/> CosmicCore</Link><span className="topbar-label">Your knowledge space</span><Button variant="outline" size="icon" aria-label={`Switch to ${nextColor} mode`} title={`Switch to ${nextColor} mode`} onClick={() => setColor(nextColor)}>{resolvedColor === "dark" ? <Sun size={18}/> : <Moon size={18}/>}</Button></header>
      <main id="main-content" tabIndex={-1} className="main-content">{children}</main>
    </div>
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {mobilePrimary.map(item => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined} className="mobile-link"><item.icon size={20}/><span>{item.label === "AI Chat" ? "Chat" : item.label}</span></Link>)}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}><SheetTrigger render={<button type="button" className="mobile-link" aria-label="More navigation"><Menu size={20}/><span>More</span></button>}/><SheetContent side="bottom"><SheetHeader><SheetTitle>More destinations</SheetTitle></SheetHeader><nav aria-label="More destinations" className="more-links">{moreNavigation.map(item => <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)} aria-current={pathname === item.href ? "page" : undefined}><item.icon size={19}/>{item.label}</Link>)}</nav></SheetContent></Sheet>
    </nav>
  </div>;
}

type Item = (typeof primaryNavigation)[number] | (typeof secondaryNavigation)[number];
function NavLink({ item, active }: { item: Item; active: boolean }) {
  return <Link href={item.href} className="sidebar-link" aria-current={active ? "page" : undefined}><item.icon size={19}/><span>{item.label}</span></Link>;
}
