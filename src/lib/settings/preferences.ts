export const appearances = ["cosmic", "minimal"] as const;
export const colorSchemes = ["light", "dark", "system"] as const;

export type Appearance = typeof appearances[number];
export type ColorScheme = typeof colorSchemes[number];
export type Preferences = { appearance: Appearance; colorScheme: ColorScheme; revision: number };

export function validPreferences(value: unknown): value is Preferences {
  if (!value || typeof value !== "object") return false;
  const input = value as Preferences;
  return appearances.includes(input.appearance) && colorSchemes.includes(input.colorScheme)
    && Number.isSafeInteger(input.revision) && input.revision > 0 && input.revision <= 2147483647;
}
