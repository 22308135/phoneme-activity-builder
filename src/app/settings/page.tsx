"use client";

import { SiteShell } from "@/components/SiteShell";
import { ThemePreference, usePreferences } from "@/components/PreferenceProvider";

export default function SettingsPage() {
  const { theme, layout, setTheme, setLayout } = usePreferences();
  return <SiteShell><section className="content-page"><p className="eyebrow">Preferences</p><h1>Settings</h1>
    <div className="settings-card"><h2>Colour theme</h2><p>Choose light, dark, or follow your browser and operating-system preference.</p><div className="radio-group" role="radiogroup" aria-label="Colour theme">{(["system", "light", "dark"] as ThemePreference[]).map((option) => <label key={option}><input type="radio" name="theme" checked={theme === option} onChange={() => setTheme(option)} /> {option.charAt(0).toUpperCase() + option.slice(1)}</label>)}</div></div>
    <div className="settings-card"><h2>Layout density</h2><p>Adjust spacing to suit your screen and working preference.</p><div className="radio-group" role="radiogroup" aria-label="Layout density"><label><input type="radio" name="layout" checked={layout === "comfortable"} onChange={() => setLayout("comfortable")} /> Comfortable</label><label><input type="radio" name="layout" checked={layout === "compact"} onChange={() => setLayout("compact")} /> Compact</label></div></div>
    <p className="muted" role="status">Your preferences are stored in one-year cookies on this device.</p>
  </section></SiteShell>;
}
