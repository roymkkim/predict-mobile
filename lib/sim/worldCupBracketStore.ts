import { useSyncExternalStore } from "react";

// App-wide shared toggle for the minimal World Cup knockout bracket. The toggle
// lives in the home screen's display-settings sheet, but the bracket renders on
// the standalone World Cup page (which has its own local FeedSettings), so the
// flag lives in a tiny module-level store both screens subscribe to. Off by
// default. A full app reload (the demo "r" reset on web) restores this default.
let current = false;
const listeners = new Set<() => void>();

export function setWorldCupBracket(next: boolean) {
  if (next === current) return;
  current = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Reactive read — components re-render when the shared value changes.
export function useWorldCupBracket(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );
}
