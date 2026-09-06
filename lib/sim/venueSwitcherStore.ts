import { useSyncExternalStore } from "react";

// Home header venue switcher. "badge" is the Perps Lite/Pro-style Kalshi/
// Polymarket pill; "icon" is a Material settings gear.
const STORAGE_KEY = "predict.venue-switcher";

export type VenueSwitcher = "badge" | "icon";

export const VENUE_SWITCHER_OPTIONS: VenueSwitcher[] = ["badge", "icon"];

export const VENUE_SWITCHER_LABELS: Record<VenueSwitcher, string> = {
  badge: "Badge",
  icon: "Settings icon",
};

let current: VenueSwitcher = "badge";
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function persist(next: VenueSwitcher) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, next);
  } catch {
    /* session-only */
  }
}

if (typeof globalThis !== "undefined") {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw === "badge" || raw === "icon") current = raw;
  } catch {
    /* keep default */
  }
}

export function setVenueSwitcher(next: VenueSwitcher) {
  if (next === current) return;
  current = next;
  persist(next);
  emit();
}

export function getVenueSwitcher(): VenueSwitcher {
  return current;
}

export function useVenueSwitcher(): VenueSwitcher {
  return useSyncExternalStore(subscribe, getVenueSwitcher, getVenueSwitcher);
}
