import { useSyncExternalStore } from "react";

// Success screen chrome: flat black page by default, or an animated brand wash.
export type SuccessScreenStyle = "gradient" | "flat";

const STORAGE_KEY = "predict.success-screen-style-v2";

let current: SuccessScreenStyle = "flat";
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function persist(next: SuccessScreenStyle) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, next);
  } catch {
    /* session-only */
  }
}

if (typeof globalThis !== "undefined") {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw === "gradient" || raw === "flat") current = raw;
  } catch {
    /* keep default */
  }
}

export function setSuccessScreenStyle(next: SuccessScreenStyle) {
  if (next === current) return;
  current = next;
  persist(next);
  emit();
}

export function getSuccessScreenStyle(): SuccessScreenStyle {
  return current;
}

export function useSuccessScreenStyle(): SuccessScreenStyle {
  return useSyncExternalStore(subscribe, getSuccessScreenStyle, getSuccessScreenStyle);
}
