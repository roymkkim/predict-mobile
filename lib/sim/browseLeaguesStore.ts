// When on, Categories and Sports list leagues under each sport (accordion).
// There is no sport landing page — a league opens Games / Props directly.
import { useSyncExternalStore } from "react";

let enabled = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getBrowseLeagues(): boolean {
  return enabled;
}

export function setBrowseLeagues(next: boolean): void {
  if (next === enabled) return;
  enabled = next;
  listeners.forEach((listener) => listener());
}

export function useBrowseLeagues(): boolean {
  return useSyncExternalStore(subscribe, getBrowseLeagues, getBrowseLeagues);
}
