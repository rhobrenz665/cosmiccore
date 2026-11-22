"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

import { savePreferences } from "@/app/(workspace)/settings/actions";
import type { Appearance, ColorScheme as Color, Preferences } from "@/lib/settings/preferences";
type AppearanceContext = {
  appearance: Appearance;
  color: Color;
  resolvedColor: "light" | "dark";
  setAppearance: (value: Appearance) => void;
  setColor: (value: Color) => void;
  saving: boolean;
  message: string;
};
const Context = createContext<AppearanceContext | null>(null);
const appearanceKey = "cosmiccore-appearance";
const colorKey = "cosmiccore-color";

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  return <AppearanceState>{children}</AppearanceState>;
}

export function AccountAppearanceProvider({ children, initial }: { children: React.ReactNode; initial: Preferences }) {
  return <AppearanceState initial={initial}>{children}</AppearanceState>;
}

function AppearanceState({ children, initial }: { children: React.ReactNode; initial?: Preferences }) {
  const [appearance, setAppearanceState] = useState<Appearance>(initial?.appearance ?? "cosmic");
  const [color, setColorState] = useState<Color>(initial?.colorScheme ?? "system");
  const [systemDark, setSystemDark] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const previous = useRef(initial);
  const pending = useRef(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const accountScoped = !!initial;
  const resolvedColor = color === "system" ? (systemDark ? "dark" : "light") : color;

  useEffect(() => {
    const storedAppearance = accountScoped ? null : localStorage.getItem(appearanceKey);
    const storedColor = accountScoped ? null : localStorage.getItem(colorKey);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemDark(media.matches);
    queueMicrotask(() => {
      if (storedAppearance === "cosmic" || storedAppearance === "minimal") setAppearanceState(storedAppearance);
      if (storedColor === "light" || storedColor === "dark" || storedColor === "system") setColorState(storedColor);
      update();
      setHydrated(true);
    });
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [accountScoped]);

  useEffect(() => {
    if (!accountScoped) return;
    document.documentElement.dataset.accountAppearance = "true";
    return () => { delete document.documentElement.dataset.accountAppearance; };
  }, [accountScoped]);

  useEffect(() => {
    if (!hydrated || !accountScoped && document.documentElement.dataset.accountAppearance) return;
    document.documentElement.dataset.appearance = appearance;
    document.documentElement.dataset.color = color;
    document.documentElement.classList.toggle("dark", resolvedColor === "dark");
  }, [appearance, color, resolvedColor, hydrated, accountScoped]);

  async function change(nextAppearance: Appearance, nextColor: Color) {
    if (pending.current) return;
    setAppearanceState(nextAppearance);
    setColorState(nextColor);
    if (!previous.current) {
      localStorage.setItem(appearanceKey, nextAppearance);
      localStorage.setItem(colorKey, nextColor);
      return;
    }

    pending.current = true;
    setSaving(true);
    setMessage("");
    try {
      const result = await savePreferences({ appearance: nextAppearance, colorScheme: nextColor, revision: previous.current.revision });
      if (result.ok) {
        previous.current = result.preferences;
        setMessage("Saved");
      } else {
        if ("latest" in result && result.latest) previous.current = result.latest;
        setAppearanceState(previous.current.appearance);
        setColorState(previous.current.colorScheme);
        setMessage(result.message);
      }
    } catch {
      setAppearanceState(previous.current.appearance);
      setColorState(previous.current.colorScheme);
      setMessage("Appearance could not be saved. Try again.");
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  return <Context.Provider value={{
    appearance, color, resolvedColor, saving, message,
    setAppearance: (value) => void change(value, color),
    setColor: (value) => void change(appearance, value),
  }}>{children}</Context.Provider>;
}

export function useAppearance() {
  const value = useContext(Context);
  if (!value) throw new Error("AppearanceProvider is missing");
  return value;
}
