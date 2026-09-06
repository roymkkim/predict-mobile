import { useSyncExternalStore } from "react";

import type { VersusMode } from "./types";

// App-wide shared store for the versus-card format toggle ("new" vs "old").
// The home screen owns the toggle in its settings sheet, but the standalone
// pages that reuse VersusCard (World Cup, categories, trending, esports) must
// reflect the same choice, so the value lives in a tiny module-level store both
// the home feed and those pages subscribe to. A full app reload (e.g. the demo
// "r" reset on web) clears module state back to the default.
let current: VersusMode = "new";
const listeners = new Set<() => void>();

export function setVersusMode(next: VersusMode) {
  if (next === current) return;
  current = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Reactive read — components re-render when the shared value changes.
export function useVersusMode(): VersusMode {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );
}
