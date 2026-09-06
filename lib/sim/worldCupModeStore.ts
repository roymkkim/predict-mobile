import { useSyncExternalStore } from "react";

// The two World Cup page layouts, toggled from the home display-settings sheet
// but rendered on the standalone World Cup page:
// - "simple": stripped-down view with two tabs (Games / Props), each a flat list
// - "full": the rich multi-section view (day filters, early R16, advance, props)
export type WorldCupMode = "simple" | "full";

// App-wide shared store. The home screen owns the toggle, but the value is read
// on the standalone World Cup page (which has its own local FeedSettings), so it
// lives in a tiny module-level store both screens subscribe to. "simple" (the
// stripped-down two-tab view) is the default. A full app reload (the demo "r"
// reset on web) restores this default.
let current: WorldCupMode = "simple";
const listeners = new Set<() => void>();

export function setWorldCupMode(next: WorldCupMode) {
  if (next === current) return;
  current = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Reactive read — components re-render when the shared value changes.
export function useWorldCupMode(): WorldCupMode {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );
}
