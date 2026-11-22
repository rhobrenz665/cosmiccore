"use client";

import { useAppearance } from "@/components/appearance/provider";
import { appearances, colorSchemes } from "@/lib/settings/preferences";

export function AppearanceSettings() {
  const { appearance, color, setAppearance, setColor, saving, message } = useAppearance();
  return <section className="space-y-3" aria-labelledby="appearance-settings">
    <h2 id="appearance-settings" className="text-lg font-semibold">Appearance</h2>
    <div className="settings-card">
      <div><h3>Visual style</h3><p>Choose Cosmic or Minimal for your workspace.</p></div>
      <div className="choice-row" role="group" aria-label="Visual style">
        {appearances.map((value) => <button key={value} type="button" disabled={saving}
          aria-pressed={appearance === value} onClick={() => setAppearance(value)}>{value === "cosmic" ? "Cosmic" : "Minimal"}</button>)}
      </div>
    </div>
    <div className="settings-card">
      <div><h3>Color preference</h3><p>System follows your device’s light or dark appearance.</p></div>
      <div className="choice-row" role="group" aria-label="Color preference">
        {colorSchemes.map((value) => <button key={value} type="button" disabled={saving}
          aria-pressed={color === value} onClick={() => setColor(value)}>{value[0].toUpperCase() + value.slice(1)}</button>)}
      </div>
    </div>
    <p className="min-h-5 text-sm" role="status">{saving ? "Saving…" : message}</p>
  </section>;
}
