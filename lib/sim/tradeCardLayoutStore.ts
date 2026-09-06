import { useSyncExternalStore } from "react";

// Compact row (ticker + outcome tag + $ / %) vs the detailed ticket
// (market, outcome, cost, max payout / current value).
export type TradeCardLayout = "ticket" | "compact";

const STORAGE_KEY = "predict.trade-card-layout";

let current: TradeCardLayout = "ticket";
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function persist(next: TradeCardLayout) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, next);
  } catch {
    /* session-only */
  }
}

if (typeof globalThis !== "undefined") {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw === "ticket" || raw === "compact") current = raw;
  } catch {
    /* keep default */
  }
}

export function setTradeCardLayout(next: TradeCardLayout) {
  if (next === current) return;
  current = next;
  persist(next);
  emit();
}

export function getTradeCardLayout(): TradeCardLayout {
  return current;
}

export function useTradeCardLayout(): TradeCardLayout {
  return useSyncExternalStore(subscribe, getTradeCardLayout, getTradeCardLayout);
}
