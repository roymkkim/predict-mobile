// Design-system mode store: swaps the shared `colors` palette between the
// Predict brand palette and MetaMask's official dark-theme design tokens
// (@metamask/design-tokens). Module-level store + useSyncExternalStore, same
// pattern as feedTopControlsStore. The home screen keys its feed subtree on
// the mode so every component re-reads the mutated palette on toggle.
import { useSyncExternalStore } from "react";
import { darkTheme, lightTheme } from "@metamask/design-tokens";
import { colors, PREDICT_PALETTE, setSemanticTheme } from "./colors";
import { applyUxrColors, getUxrMode, setUxrBaseSurfaces, setUxrThemeOverrides } from "./uxrModeStore";

export type DsMode = "predict" | "metamask";

const mm = darkTheme.colors;

// MetaMask dark-theme overrides. Their token set already shares bg/surface/
// success-lime/error-red values with the Predict palette; the visible shifts
// are the indigo primary, softer muted text, and hairline borders.
const METAMASK_OVERRIDES: Partial<Record<keyof typeof PREDICT_PALETTE, string>> = {
  // Keep the requested dark elevation model while using MetaMask tokens for
  // typography, accents, status colors, and other semantic values.
  bg: "#000000",
  muted: "#141414",
  surface: "#18181B",
  surface2: "#222226",
  surfaceTransparent: "#18181B",
  cardBorder: mm.border.muted,
  textPrimary: mm.text.default,
  textAlternative: mm.text.alternative,
  textMuted: mm.text.alternative,
  mono: mm.text.alternative,
  accent: mm.primary.default,
  controlAccent: mm.border.default,
  green: mm.success.default,
  greenOutline: mm.success.default,
  greenSoft: mm.success.muted,
  red: mm.error.default,
  redSoft: mm.error.muted,
  liveGlow: mm.error.muted,
  liveOrange: mm.accent01.normal,
};

// Theme mode: dark (default, the Predict/MetaMask dark palettes above) or
// light (MetaMask's official light-theme design tokens). Light overrides the
// ds-mode surface/text colors wholesale; the ds-mode toggle still picks the
// accent set underneath.
export type ThemeMode = "dark" | "light";

const ml = lightTheme.colors;
const LIGHT_OVERRIDES: Partial<Record<keyof typeof PREDICT_PALETTE, string>> = {
  bg: ml.background.default,
  muted: "rgba(60,77,157,0.10)",
  surface: ml.background.section,
  surface2: ml.background.muted,
  surfaceTransparent: ml.background.muted,
  cardBorder: ml.border.muted,
  textPrimary: ml.text.default,
  textAlternative: ml.text.alternative,
  textMuted: ml.text.alternative,
  mono: ml.text.alternative,
  accent: ml.primary.default,
  controlAccent: ml.border.default,
  // Inverted segmented-control chips: dark pill with white text on light.
  controlActiveBg: "#16171a",
  controlActiveText: "#ffffff",
  // Light semantic palette from the provided success/error reference swatches.
  green: "#527941",
  greenOutline: "#527941",
  greenSoft: "#EDF2EB",
  red: "#BA4247",
  redSoft: "#F7EBEC",
  liveGlow: "#F7EBEC",
  liveOrange: ml.accent01.normal,
};

let mode: DsMode = "predict";
let theme: ThemeMode = "dark";
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDsMode(): DsMode {
  return mode;
}

function recompute(): void {
  const base =
    theme === "light"
      ? { ...PREDICT_PALETTE, ...LIGHT_OVERRIDES }
      : mode === "metamask"
        ? { ...PREDICT_PALETTE, ...METAMASK_OVERRIDES }
        : PREDICT_PALETTE;
  Object.assign(colors, base);
  setSemanticTheme(theme);
  // Register this palette's base surfaces as the UXR "classic" restore target,
  // point the UXR overrides at the matching theme set, then re-apply so a
  // palette swap doesn't clobber the active UXR surfaces.
  setUxrBaseSurfaces({ bg: colors.bg, surface: colors.surface, surfaceTransparent: colors.surfaceTransparent, surface2: colors.surface2, cardBorder: colors.cardBorder });
  setUxrThemeOverrides(theme);
  applyUxrColors(getUxrMode());
  listeners.forEach((l) => l());
}

export function setDsMode(next: DsMode): void {
  if (next === mode) return;
  mode = next;
  recompute();
}

export function getThemeMode(): ThemeMode {
  return theme;
}

export function setThemeMode(next: ThemeMode): void {
  if (next === theme) return;
  theme = next;
  recompute();
}

export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(subscribe, getThemeMode, getThemeMode);
}

export function useDsMode(): DsMode {
  return useSyncExternalStore(subscribe, getDsMode, getDsMode);
}

