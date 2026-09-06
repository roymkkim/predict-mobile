import { useSyncExternalStore } from "react";

export type ScoreUnitPadding = 16 | "hug";

// Global scoring-unit layout. The default sizes the five units to their
// contents and uses 24px between units; the 16px option remains available for
// compact detail headers.
let current: ScoreUnitPadding = "hug";
const listeners = new Set<() => void>();

export function setScoreUnitPadding(next: ScoreUnitPadding): void {
  if (next === current) return;
  current = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useScoreUnitPadding(): ScoreUnitPadding {
  return useSyncExternalStore(subscribe, () => current, () => current);
}