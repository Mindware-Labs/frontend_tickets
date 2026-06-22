/**
 * Theme-aware inline style for a colored status/disposition/priority chip.
 *
 * Light mode keeps the curated `lightBg` / `lightFg` hex palette. Dark mode
 * derives a translucent background + lightened text from the `accent` color so
 * chips don't render light-mode hexes on a dark surface.
 *
 * Relies on `color-scheme` (set on :root / .dark in globals.css) for the
 * `light-dark()` CSS function to resolve the correct value per theme.
 *
 * @param accent  Vivid accent color (e.g. the dot/marker color).
 * @param lightBg Background used in light mode.
 * @param lightFg Text color used in light mode (defaults to `accent`).
 */
export function chipColors(
  accent: string,
  lightBg: string,
  lightFg: string = accent,
): { color: string; background: string } {
  return {
    color: `light-dark(${lightFg}, color-mix(in srgb, ${accent} 78%, white))`,
    background: `light-dark(${lightBg}, color-mix(in srgb, ${accent} 20%, transparent))`,
  };
}

/** Translucent border derived from an accent color, theme-agnostic. */
export function chipBorder(accent: string, pct = 35): string {
  return `color-mix(in srgb, ${accent} ${pct}%, transparent)`;
}
