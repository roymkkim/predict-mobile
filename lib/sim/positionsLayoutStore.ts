import { useSyncExternalStore } from "react";

// The Positions-page header layout, toggled from the home display-settings sheet
// but rendered on the standalone Positions page:
// - "default": the stacked "Available balance" / "Unrealized P&L" rows card.
// - "stats": a two-column "Balance" / "Winnings" header with a green balance
//   delta under Balance and a "Win Rate" line under Winnings.
export type PositionsLayout = "default" | "stats";

// App-wide shared store. The home screen owns the toggle, but the value is read
// on the standalone Positions page (which has no FeedSettings context), so it
// lives in a tiny module-level store both screens subscribe to. "stats" is the
// default; a full app reload restores it.
let current: PositionsLayout = "stats";
const listeners = new Set<() => void>();

export function setPositionsLayout(next: PositionsLayout) {
  if (next === current) return;
  current = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Reactive read — components re-render when the shared value changes.
export function usePositionsLayout(): PositionsLayout {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );
}
