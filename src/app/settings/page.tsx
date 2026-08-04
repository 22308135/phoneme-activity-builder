"use client";

import { SiteShell } from "@/components/SiteShell";
import { useSyncExternalStore } from "react";

const readCookie = (name: string) => document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1];
const setCookie = (name: string, value: string) => { document.cookie = `${name}=${value};path=/;max-age=31536000;SameSite=Lax`; };
const subscribe = (callback: () => void) => { window.addEventListener("phoneme-preference", callback); return () => window.removeEventListener("phoneme-preference", callback); };
const notifyPreferenceChange = () => window.dispatchEvent(new Event("phoneme-preference"));

export default function SettingsPage() {
  const theme = useSyncExternalStore(subscribe, () => readCookie("phoneme-theme") === "dark" ? "dark" : "light", () => "light");
  const layout = useSyncExternalStore(subscribe, () => readCookie("phoneme-layout") === "compact" ? "compact" : "comfortable", () => "comfortable");


  const updateTheme = (value: string) => { setCookie("phoneme-theme", value); document.documentElement.dataset.theme = value; notifyPreferenceChange(); };
  const updateLayout = (value: string) => { setCookie("phoneme-layout", value); document.documentElement.dataset.layout = value; notifyPreferenceChange(); };

  return <SiteShell><section className="content-page"><p className="eyebrow">Preferences</p><h1>Settings</h1>
    <div className="settings-card"><h2>Colour theme</h2><p>Choose a high-contrast, comfortable working environment.</p><div className="radio-group" role="radiogroup" aria-label="Colour theme"><label><input type="radio" name="theme" checked={theme === "light"} onChange={() => updateTheme("light")} /> Light</label><label><input type="radio" name="theme" checked={theme === "dark"} onChange={() => updateTheme("dark")} /> Dark</label></div></div>
    <div className="settings-card"><h2>Layout density</h2><p>Adjust spacing to suit your screen and working preference.</p><div className="radio-group" role="radiogroup" aria-label="Layout density"><label><input type="radio" name="layout" checked={layout === "comfortable"} onChange={() => updateLayout("comfortable")} /> Comfortable</label><label><input type="radio" name="layout" checked={layout === "compact"} onChange={() => updateLayout("compact")} /> Compact</label></div></div>
    <p className="muted" role="status">Your preferences are stored in cookies on this device.</p>
  </section></SiteShell>;
}
