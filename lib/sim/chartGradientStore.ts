// Shared chart-gradient visibility preference. Gradients remain hidden by
// default and can be enabled from the Display settings sheet.
import { useSyncExternalStore } from "react";

let shown = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setChartGradient(v: boolean): void {
  shown = v;
  listeners.forEach((listener) => listener());
}

export function useChartGradient(): boolean {
  return useSyncExternalStore(subscribe, () => shown, () => shown);
}