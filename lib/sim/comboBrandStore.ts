import { useSyncExternalStore } from "react";

/** Combo branding: blue→lime wash, or solid white. */
export type ComboBrandStyle = "gradient" | "flat";

export const COMBO_BRAND_STYLE_STORAGE_KEY = "predict.combo-brand-style";
export const COMBO_BRAND_STYLE_DEFAULT: ComboBrandStyle = "flat";
export const COMBO_BRAND_FLAT = "#ffffff";
/** Ink on a filled branding plate — dark on white, white on the gradient. */
export const COMBO_BRAND_ON_FILL_FLAT = "#111111";
export const COMBO_BRAND_ON_FILL_GRADIENT = "#ffffff";

const listeners = new Set<() => void>();
let current: ComboBrandStyle = COMBO_BRAND_STYLE_DEFAULT;

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function persist(next: ComboBrandStyle) {
  try {
    globalThis.localStorage?.setItem(COMBO_BRAND_STYLE_STORAGE_KEY, next);
  } catch {
    /* session-only */
  }
}

export function parseComboBrandStyle(raw: string | null | undefined): ComboBrandStyle {
  if (raw === "flat") return "flat";
  if (raw === "gradient") return "gradient";
  return COMBO_BRAND_STYLE_DEFAULT;
}

if (typeof globalThis !== "undefined") {
  try {
    current = parseComboBrandStyle(globalThis.localStorage?.getItem(COMBO_BRAND_STYLE_STORAGE_KEY));
  } catch {
    /* keep default */
  }
}

export function setComboBrandStyle(next: ComboBrandStyle) {
  if (next === current) return;
  current = next;
  persist(next);
  emit();
}

export function getComboBrandStyle(): ComboBrandStyle {
  return current;
}

export function useComboBrandStyle(): ComboBrandStyle {
  return useSyncExternalStore(subscribe, getComboBrandStyle, getComboBrandStyle);
}

export function comboBrandOnFillInk(style: ComboBrandStyle): string {
  return style === "flat" ? COMBO_BRAND_ON_FILL_FLAT : COMBO_BRAND_ON_FILL_GRADIENT;
}
