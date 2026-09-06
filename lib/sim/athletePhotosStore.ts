import { useSyncExternalStore } from "react";

// App-wide shared store for the "Athlete photos" toggle. Individual sports
// (golf, tennis, racing) carry one real headshot per competitor; when this flag
// is on, StandardCard swaps in that photo for those sports. Default true — the
// individual cards show the athlete headshot unless the user turns it off. A
// full app reload restores the default.
let current = true;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setAthletePhotos(v: boolean) {
  if (v === current) return;
  current = v;
  emit();
}

// Reactive read — components re-render when the flag changes.
export function useAthletePhotos(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );
}
