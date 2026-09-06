// Latest-play row on the live carousel sports cards: a one-line "what just
// happened" ticker (timestamp + play text) under the team rows. Toggled from
// Settings; HIDDEN by default (user request). Module-level store +
// useSyncExternalStore, same pattern as navModeStore / spreadVariantStore.
import { useSyncExternalStore } from "react";

let enabled = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setLatestPlay(v: boolean) {
  enabled = v;
  listeners.forEach((l) => l());
}

export function useLatestPlay(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => enabled,
    () => enabled,
  );
}
