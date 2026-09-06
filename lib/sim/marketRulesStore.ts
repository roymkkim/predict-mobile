import { useSyncExternalStore } from "react";

export type MarketRulesStyle = "banner" | "section" | "about";

const STORAGE_KEY = "predict.event-page-style";

let style: MarketRulesStyle = "about";
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function persist(next: MarketRulesStyle) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, next);
  } catch {
    /* session-only */
  }
}

if (typeof globalThis !== "undefined") {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw === "banner" || raw === "section" || raw === "about") style = raw;
  } catch {
    /* keep default */
  }
}

export function getMarketRulesStyle(): MarketRulesStyle {
  return style;
}

export function setMarketRulesStyle(next: MarketRulesStyle): void {
  if (next === style) return;
  style = next;
  persist(next);
  listeners.forEach((l) => l());
}

export function useMarketRulesStyle(): MarketRulesStyle {
  return useSyncExternalStore(subscribe, getMarketRulesStyle, getMarketRulesStyle);
}
