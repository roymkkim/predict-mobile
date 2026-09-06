import { useSyncExternalStore } from "react";

// App-wide shared store for the global "hide all tennis markets" toggle. Tennis
// content spans the home feed (Trending + Sports tennis cards), the Wimbledon
// hero-carousel banner, the Tennis category tile, the Sports leagues live games,
// and the dedicated Tennis/Wimbledon pages — so the flag lives in a tiny
// module-level store every one of those surfaces subscribes to. Default false
// (tennis shown). A full app reload clears it back to the default.
let current = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setTennisHidden(v: boolean) {
  if (v === current) return;
  current = v;
  emit();
}

// Reactive read — components re-render when the flag changes.
export function useTennisHidden(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );
}
