import { useSyncExternalStore } from "react";

import type { VersusHeaderAlign } from "./types";

// App-wide shared store for the "Versus header" alignment toggle ("center" vs
// "left"). The home screen owns the toggle, but standalone pages that reuse the
// feed cards (Sports, World Cup, the category/topic pages, etc.) must reflect
// the same choice, so the value lives in a tiny module-level store both the home
// feed and those pages subscribe to (rather than per-screen React state).
// Defaults mirror the home feed. A full app reload clears module state back to
// this default.
let current: VersusHeaderAlign = "center";
const listeners = new Set<() => void>();

export function setVersusHeaderAlign(next: VersusHeaderAlign) {
  if (next === current) return;
  current = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Reactive read — components re-render when the shared value changes.
export function useVersusHeaderAlign(): VersusHeaderAlign {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );
}
