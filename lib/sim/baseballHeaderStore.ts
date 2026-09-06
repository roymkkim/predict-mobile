import { useSyncExternalStore } from "react";

export type BaseballHeaderVariant = "original" | "bases";

// Simple (football-style scoreboard + T5 / B7) is the default. The diamond
// treatment remains available as an explicit Display setting for comparison.
let current: BaseballHeaderVariant = "original";
const listeners = new Set<() => void>();

export function setBaseballHeaderVariant(next: BaseballHeaderVariant): void {
  if (next === current) return;
  current = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useBaseballHeaderVariant(): BaseballHeaderVariant {
  return useSyncExternalStore(subscribe, () => current, () => current);
}