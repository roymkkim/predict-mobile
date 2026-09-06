import { useSyncExternalStore } from "react";

import type { MatchLayout } from "./types";

// App-wide shared store for the three card variants:
// "versus" = VersusCards everywhere, "standard" = StandardCards everywhere,
// and "mixed" = StandardCards on Home but VersusCards on sports pages.
// All screens subscribe to the same value so the Settings choice cannot drift
// between routes. A full app reload clears module state back to the default.
let current: MatchLayout = "versus";
const listeners = new Set<() => void>();

export function setMatchLayout(next: MatchLayout) {
  if (next === current) return;
  current = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Reactive read — components re-render when the shared value changes.
export function useMatchLayout(): MatchLayout {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );
}
