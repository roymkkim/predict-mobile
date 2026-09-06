import { useSyncExternalStore } from "react";

export type PolymarketSportPagesNav = "tabs" | "chips";

// The latest Sport Pages treatment is the default; Settings can switch back
// to the previous Games / Props tab presentation.
let nav: PolymarketSportPagesNav = "tabs";
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPolymarketSportPagesNav(): PolymarketSportPagesNav {
  return nav;
}

export function setPolymarketSportPagesNav(next: PolymarketSportPagesNav): void {
  if (next === nav) return;
  nav = next;
  listeners.forEach((listener) => listener());
}

export function usePolymarketSportPagesNav(): PolymarketSportPagesNav {
  return useSyncExternalStore(subscribe, getPolymarketSportPagesNav, getPolymarketSportPagesNav);
}