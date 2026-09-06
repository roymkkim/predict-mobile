// Shared market-detail action placement preference.
// The new fixed-bottom treatment is the default, with inline actions retained
// as a toggleable comparison variant in Display settings.
import { useSyncExternalStore } from "react";

export type MarketDetailActions = "fixed" | "inline";

let placement: MarketDetailActions = "fixed";
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getMarketDetailActions(): MarketDetailActions {
  return placement;
}

export function setMarketDetailActions(next: MarketDetailActions): void {
  if (next === placement) return;
  placement = next;
  listeners.forEach((listener) => listener());
}

export function useMarketDetailActions(): MarketDetailActions {
  return useSyncExternalStore(subscribe, getMarketDetailActions, getMarketDetailActions);
}

export function useFixedMarketActions(): boolean {
  return useMarketDetailActions() === "fixed";
}