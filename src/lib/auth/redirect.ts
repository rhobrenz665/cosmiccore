export function safeInternalRedirect(candidate: string | null | undefined, fallback = "/dashboard") {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }

  try {
    const parsed = new URL(candidate, "https://cosmiccore.local");
    const target = `${parsed.pathname}${parsed.search}${parsed.hash}`;

    return parsed.origin === "https://cosmiccore.local" && !target.startsWith("//")
      ? target
      : fallback;
  } catch {
    return fallback;
  }
}
