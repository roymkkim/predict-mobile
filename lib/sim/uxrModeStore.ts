// App-mode store: "uxr" (default) is the new design direction the app is
// moving toward; "classic" preserves the current design untouched. Components
// branch on `useUxrMode()` as UXR-specific design changes land, so classic
// stays exactly as-is. Module-level store + useSyncExternalStore, same pattern
// as dsModeStore/feedTopControlsStore.
import { useSyncExternalStore } from "react";
import { colors, PREDICT_PALETTE } from "./colors";

export type UxrMode = "uxr" | "classic";

// UXR surface overrides: solid dark elevation layers from the design reference.
// Applied to the shared mutable `colors` palette (same pattern as dsModeStore)
// and re-applied by dsModeStore after its own palette swaps.
// Layer strategy: background is pure black; cards use #18181B while nested
// buttons, controls, and tags use #222226. Cards have no border.
export const UXR_COLOR_OVERRIDES = {
  bg: "#000000",
  surface: "#18181B",
  surfaceTransparent: "#18181B",
  surface2: "#222226",
  cardBorder: "rgba(0,0,0,0)",
} as const;

// Light-theme equivalent of the UXR layer strategy: white background with
// cards as a black-5% wash, chips at black-3%. Selected by dsModeStore's
// theme mode via setUxrThemeOverrides.
export const UXR_LIGHT_COLOR_OVERRIDES = {
  bg: "#ffffff",
  surface: "rgba(19,20,22,0.05)",
  surfaceTransparent: "rgba(19,20,22,0.05)",
  surface2: "rgba(19,20,22,0.03)",
  cardBorder: "rgba(0,0,0,0)",
} as const;

// Which UXR surface set is active (dark by default). dsModeStore swaps this
// when the theme mode changes, before re-applying via applyUxrColors.
let uxrOverrides: typeof UXR_COLOR_OVERRIDES | typeof UXR_LIGHT_COLOR_OVERRIDES = UXR_COLOR_OVERRIDES;
export function setUxrThemeOverrides(theme: "dark" | "light"): void {
  uxrOverrides = theme === "light" ? UXR_LIGHT_COLOR_OVERRIDES : UXR_COLOR_OVERRIDES;
}

// Restoring classic must return to the ACTIVE ds-mode base palette (predict
// or metamask), not hardcode PREDICT_PALETTE — dsModeStore registers its
// current base values here whenever it swaps.
type BaseSurfaces = { bg: string; surface: string; surfaceTransparent: string; surface2: string; cardBorder: string };
let baseSurfaces: BaseSurfaces = {
  bg: PREDICT_PALETTE.bg,
  surface: PREDICT_PALETTE.surface,
  surfaceTransparent: PREDICT_PALETTE.surfaceTransparent,
  surface2: PREDICT_PALETTE.surface2,
  cardBorder: PREDICT_PALETTE.cardBorder,
};

export function setUxrBaseSurfaces(next: BaseSurfaces): void {
  baseSurfaces = next;
}

export function applyUxrColors(current: UxrMode): void {
  Object.assign(colors, current === "uxr" ? uxrOverrides : baseSurfaces);
}

let mode: UxrMode = "uxr";
// Default mode is "uxr", so the overrides apply at module load (this module is
// imported by buttonStyle.ts, which loads before any card renders).
applyUxrColors(mode);
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getUxrMode(): UxrMode {
  return mode;
}

export function setUxrMode(next: UxrMode): void {
  if (next === mode) return;
  mode = next;
  applyUxrColors(mode);
  listeners.forEach((l) => l());
}

export function useUxrMode(): UxrMode {
  return useSyncExternalStore(subscribe, getUxrMode, getUxrMode);
}
