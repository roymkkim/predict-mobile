import { useSyncExternalStore } from "react";

import type { BtcLiveCarouselCard } from "./types";

const STORAGE_KEY = "predict.btc-live-carousel-card-v3";

// Unset / first visit: compact BTC dial. localStorage "chart" is kept as-is.
let current: BtcLiveCarouselCard = "simple";
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function persist(next: BtcLiveCarouselCard) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, next);
  } catch {
    /* session-only */
  }
}

if (typeof globalThis !== "undefined") {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw === "simple" || raw === "chart") current = raw;
  } catch {
    /* keep default */
  }
}

export function setBtcLiveCarouselCard(next: BtcLiveCarouselCard) {
  if (next === current) return;
  current = next;
  persist(next);
  emit();
}

export function getBtcLiveCarouselCard(): BtcLiveCarouselCard {
  return current;
}

export function useBtcLiveCarouselCard(): BtcLiveCarouselCard {
  return useSyncExternalStore(subscribe, getBtcLiveCarouselCard, getBtcLiveCarouselCard);
}
