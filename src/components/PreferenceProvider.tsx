"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";

export type ThemePreference = "light" | "dark" | "system";
export type LayoutPreference = "comfortable" | "compact";
type Value = { theme: ThemePreference; layout: LayoutPreference; setTheme: (value: ThemePreference) => void; setLayout: (value: LayoutPreference) => void };

const PREFERENCE_EVENT = "phoneme-preference";
const PreferenceContext = createContext<Value | null>(null);
const cookie = (name: string) => document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1];
const subscribe = (onChange: () => void) => { window.addEventListener(PREFERENCE_EVENT, onChange); return () => window.removeEventListener(PREFERENCE_EVENT, onChange); };
const getTheme = (): ThemePreference => { const saved = cookie("phoneme-theme"); return saved === "light" || saved === "dark" ? saved : "system"; };
const getLayout = (): LayoutPreference => cookie("phoneme-layout") === "compact" ? "compact" : "comfortable";
const getServerTheme = (): ThemePreference => "system";
const getServerLayout = (): LayoutPreference => "comfortable";
const writeCookie = (name: string, value: string) => { document.cookie = `${name}=${value};path=/;max-age=31536000;SameSite=Lax`; window.dispatchEvent(new Event(PREFERENCE_EVENT)); };

export function PreferenceProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);
  const layout = useSyncExternalStore(subscribe, getLayout, getServerLayout);
  useEffect(() => { const media = window.matchMedia("(prefers-color-scheme: dark)"); const apply = () => { document.documentElement.dataset.theme = theme === "system" ? (media.matches ? "dark" : "light") : theme; }; apply(); media.addEventListener("change", apply); return () => media.removeEventListener("change", apply); }, [theme]);
  useEffect(() => { document.documentElement.dataset.layout = layout; }, [layout]);
  const value = useMemo<Value>(() => ({ theme, layout, setTheme: (next) => writeCookie("phoneme-theme", next), setLayout: (next) => writeCookie("phoneme-layout", next) }), [theme, layout]);
  return <PreferenceContext.Provider value={value}>{children}</PreferenceContext.Provider>;
}

export function usePreferences() { const value = useContext(PreferenceContext); if (!value) throw new Error("usePreferences must be used inside PreferenceProvider"); return value; }
