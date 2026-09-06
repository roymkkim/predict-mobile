import { useSyncExternalStore } from "react";

// Display → Social UX → "What people are saying". Persist so a refresh keeps
// the ticker vs. carousel choice.
export type HomeSocialStyle = "ticker" | "carousel";

const STORAGE_KEY = "predict.home-social-style";

let current: HomeSocialStyle = "carousel";
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function persist(next: HomeSocialStyle) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, next);
  } catch {
    /* session-only */
  }
}

if (typeof globalThis !== "undefined") {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw === "ticker" || raw === "carousel") current = raw;
  } catch {
    /* keep default */
  }
}

export function setHomeSocialStyle(next: HomeSocialStyle) {
  if (next === current) return;
  current = next;
  persist(next);
  emit();
}

export function getHomeSocialStyle(): HomeSocialStyle {
  return current;
}

export function useHomeSocialStyle(): HomeSocialStyle {
  return useSyncExternalStore(subscribe, getHomeSocialStyle, getHomeSocialStyle);
}
