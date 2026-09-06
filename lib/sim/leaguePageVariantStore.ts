// League-page variant store (UXR): "combined" (default) drops the
// SINGLE/COMBO switcher — every market is combinable by default, announced by
// a banner up top. "switcher" keeps the segmented SINGLE/COMBO toggle.
// Module-level store + useSyncExternalStore, same pattern as uxrModeStore.
import { useSyncExternalStore } from "react";

export type LeaguePageVariant = "combined" | "switcher";

let variant: LeaguePageVariant = "combined";
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLeaguePageVariant(): LeaguePageVariant {
  return variant;
}

export function setLeaguePageVariant(next: LeaguePageVariant): void {
  if (next === variant) return;
  variant = next;
  listeners.forEach((l) => l());
}

export function useLeaguePageVariant(): LeaguePageVariant {
  return useSyncExternalStore(subscribe, getLeaguePageVariant, getLeaguePageVariant);
}
