"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Appearance = "cosmic" | "minimal";
type Color = "light" | "dark" | "system";
type AppearanceContext = {
  appearance: Appearance;
  color: Color;
  resolvedColor: "light" | "dark";
  setAppearance: (value: Appearance) => void;
  setColor: (value: Color) => void;
};
const Context = createContext<AppearanceContext | null>(null);
const appearanceKey = "cosmiccore-appearance";
const colorKey = "cosmiccore-color";

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [appearance, setAppearanceState] = useState<Appearance>("cosmic");
  const [color, setColorState] = useState<Color>("system");
  const [systemDark, setSystemDark] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const resolvedColor = color === "system" ? (systemDark ? "dark" : "light") : color;

  useEffect(() => {
    const storedAppearance = localStorage.getItem(appearanceKey);
    const storedColor = localStorage.getItem(colorKey);
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
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.dataset.appearance = appearance;
    document.documentElement.dataset.color = color;
    document.documentElement.classList.toggle("dark", resolvedColor === "dark");
  }, [appearance, color, resolvedColor, hydrated]);

  function setAppearance(value: Appearance) {
    setAppearanceState(value);
    localStorage.setItem(appearanceKey, value);
  }
  function setColor(value: Color) {
    setColorState(value);
    localStorage.setItem(colorKey, value);
  }

  return <Context.Provider value={{ appearance, color, resolvedColor, setAppearance, setColor }}>{children}</Context.Provider>;
}

export function useAppearance() {
  const value = useContext(Context);
  if (!value) throw new Error("AppearanceProvider is missing");
  return value;
}
