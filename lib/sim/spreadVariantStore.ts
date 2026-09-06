// Spread-card variant store: how the Spread market renders on game detail.
//   "rows"     (default) — "Spreads" card with per-team rows (underline + cents pill)
//   "sentence" — "{TEAM} wins by more than {line} points" with Yes/No buttons
// Both share the swipeable line strip; swiping updates the rows/sentence.
// Module-level store + useSyncExternalStore, same pattern as navModeStore.
import { useSyncExternalStore } from "react";

export type SpreadVariant = "rows" | "sentence";

export const SPREAD_VARIANT_LABELS: Record<SpreadVariant, string> = {
  rows: "Team rows",
  sentence: "Sentence + Yes/No",
};

let variant: SpreadVariant = "rows";
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSpreadVariant(): SpreadVariant {
  return variant;
}

export function setSpreadVariant(next: SpreadVariant): void {
  if (next === variant) return;
  variant = next;
  listeners.forEach((l) => l());
}

export function useSpreadVariant(): SpreadVariant {
  return useSyncExternalStore(subscribe, getSpreadVariant, getSpreadVariant);
}
