"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  ["Home", "/"],
  ["Activities", "/activities"],
  ["Dashboard", "/dashboard"],
  ["Word Dictionary", "/dictionary"],
  ["Wordle", "/wordle"],
  ["Word Search", "/word-search"],
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return <div className="site-shell">
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Phoneme Play Builder home">
        <span className="brand-mark" aria-hidden="true">/ə/</span>
        <span>Phoneme Play <small>builder</small></span>
      </Link>
      <nav className="primary-nav" aria-label="Main navigation">
        {links.map(([label, href]) => <Link key={href} href={href} aria-current={pathname === href || (href === "/activities" && pathname.startsWith("/activities/")) ? "page" : undefined}>{label}</Link>)}
      </nav>
      <div className="menu-wrap">
        <button className="menu-button" aria-expanded={open} aria-controls="more-menu" onClick={() => setOpen(!open)}>Menu <span aria-hidden="true">☰</span></button>
        {open && <div id="more-menu" className="more-menu">
          <Link href="/about" onClick={() => setOpen(false)}>About</Link>
          <Link href="/settings" onClick={() => setOpen(false)}>Settings</Link>
        </div>}
      </div>
    </header>
    <main id="main-content">{children}</main>
    <footer><span>Phoneme Play Builder · Assessment 2</span><span>Louis Callander · 22308135</span></footer>
  </div>;
}
