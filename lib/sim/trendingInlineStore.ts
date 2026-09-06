// Trending filter behavior on the home feed: tapping a Popular topic chip
// either navigates to the Trending page (default) or filters the Trending
// section in place, in context of the home page. Module-level store +
// useSyncExternalStore, same pattern as homeLayoutStore.
import { useSyncExternalStore } from "react";

export type TrendingFilterMode = "navigate" | "inline";

let mode: TrendingFilterMode = "navigate";
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTrendingFilterMode(): TrendingFilterMode {
  return mode;
}

export function setTrendingFilterMode(next: TrendingFilterMode): void {
  if (next === mode) return;
  mode = next;
  listeners.forEach((l) => l());
}

export function useTrendingFilterMode(): TrendingFilterMode {
  return useSyncExternalStore(subscribe, getTrendingFilterMode, getTrendingFilterMode);
}
