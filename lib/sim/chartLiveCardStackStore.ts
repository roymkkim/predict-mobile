import { useSyncExternalStore } from "react";

import type { ChartLiveCardStack } from "./types";

const STORAGE_KEY = "predict.chart-live-card-stack";

let current: ChartLiveCardStack = "header";
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function persist(next: ChartLiveCardStack) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, next);
  } catch {
    /* session-only */
  }
}

if (typeof globalThis !== "undefined") {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw === "header" || raw === "chart") current = raw;
  } catch {
    /* keep default */
  }
}

export function setChartLiveCardStack(next: ChartLiveCardStack) {
  if (next === current) return;
  current = next;
  persist(next);
  emit();
}

export function getChartLiveCardStack(): ChartLiveCardStack {
  return current;
}

export function useChartLiveCardStack(): ChartLiveCardStack {
  return useSyncExternalStore(subscribe, getChartLiveCardStack, getChartLiveCardStack);
}
