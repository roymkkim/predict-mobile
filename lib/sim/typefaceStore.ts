// Typeface store: "current" is Geist throughout. "future" is Oswald on titles
// and large display numbers, Inter everywhere else. Same module-level pattern
// as pillButtonsStore.
import { useSyncExternalStore } from "react";
import { Platform } from "react-native";
import { geist } from "@/lib/sim/geistFonts";

export type TypefaceMode = "current" | "future";

let mode: TypefaceMode = "current";
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTypeface(): TypefaceMode {
  return mode;
}

export function setTypeface(next: TypefaceMode): void {
  if (next === mode) return;
  mode = next;
  listeners.forEach((l) => l());
}

export function useTypeface(): TypefaceMode {
  return useSyncExternalStore(subscribe, getTypeface, getTypeface);
}

export const OSWALD_FONT = Platform.select({
  web: '"Oswald", sans-serif',
  default: "Oswald_600SemiBold",
})!;

/** Oswald in Future type; otherwise the current-type fallback (Geist). */
export function useDisplayFont(current: string = geist.semibold): string {
  return useTypeface() === "future" ? OSWALD_FONT : current;
}

/** RN-web dataSet so future-type.css can keep Oswald past the Geist→Inter remap. */
export function useOswaldDataSet(): { dataSet: { oswald: string } } | Record<string, never> {
  const on = useTypeface() === "future" && Platform.OS === "web";
  return on ? { dataSet: { oswald: "true" } } : {};
}

export function usePredictionsTitleFont(): string {
  return useDisplayFont(geist.semibold);
}
