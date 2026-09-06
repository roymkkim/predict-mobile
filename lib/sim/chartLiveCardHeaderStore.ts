import { useSyncExternalStore } from "react";

import type { ChartLiveCardHeader } from "./types";

const STORAGE_KEY = "predict.chart-live-card-header";

let current: ChartLiveCardHeader = "avatar";
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function persist(next: ChartLiveCardHeader) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, next);
  } catch {
    /* session-only */
  }
}

if (typeof globalThis !== "undefined") {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw === "avatar" || raw === "score" || raw === "minimized") current = raw;
  } catch {
    /* keep default */
  }
}

export function setChartLiveCardHeader(next: ChartLiveCardHeader) {
  if (next === current) return;
  current = next;
  persist(next);
  emit();
}

export function getChartLiveCardHeader(): ChartLiveCardHeader {
  return current;
}

export function useChartLiveCardHeader(): ChartLiveCardHeader {
  return useSyncExternalStore(subscribe, getChartLiveCardHeader, getChartLiveCardHeader);
}
