// Region store: which market source the app displays.
//   "polymarket" (default) — international feed; session-only
//   "kalshi"               — US provider until the app refreshes
// Not persisted: a reload always returns to the local-region default (Polymarket).
// Module-level store + useSyncExternalStore so pages outside the home feed
// (e.g. the UXR sports hub) can react to the region without prop-drilling.
import { useSyncExternalStore } from "react";

export type Region = "polymarket" | "kalshi";

let region: Region = "polymarket";
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRegion(): Region {
  return region;
}

export function setRegion(next: Region): void {
  if (next === region) return;
  region = next;
  listeners.forEach((l) => l());
}

export function useRegion(): Region {
  return useSyncExternalStore(subscribe, getRegion, getRegion);
}
