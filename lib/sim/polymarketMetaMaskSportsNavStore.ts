import { useSyncExternalStore } from "react";

export type PolymarketMetaMaskSportsNav = "tabs" | "tiles";

let navigation: PolymarketMetaMaskSportsNav = "tabs";
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPolymarketMetaMaskSportsNav(): PolymarketMetaMaskSportsNav {
  return navigation;
}

export function setPolymarketMetaMaskSportsNav(next: PolymarketMetaMaskSportsNav): void {
  if (next === navigation) return;
  navigation = next;
  listeners.forEach((listener) => listener());
}

export function usePolymarketMetaMaskSportsNav(): PolymarketMetaMaskSportsNav {
  return useSyncExternalStore(
    subscribe,
    getPolymarketMetaMaskSportsNav,
    getPolymarketMetaMaskSportsNav,
  );
}