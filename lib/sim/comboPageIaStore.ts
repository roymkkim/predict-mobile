import { useSyncExternalStore } from "react";

// Combinations page IA: sport tabs + in-page league chips (default), or the
// original browse chips that navigate to a sport page.
export type ComboPageIa = "tabs" | "browse";

const STORAGE_KEY = "predict.combo-page-ia";

let current: ComboPageIa = "tabs";
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function persist(next: ComboPageIa) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, next);
  } catch {
    /* session-only */
  }
}

if (typeof globalThis !== "undefined") {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw === "tabs" || raw === "browse") current = raw;
  } catch {
    /* keep default */
  }
}

export function setComboPageIa(next: ComboPageIa) {
  if (next === current) return;
  current = next;
  persist(next);
  emit();
}

export function getComboPageIa(): ComboPageIa {
  return current;
}

export function useComboPageIa(): ComboPageIa {
  return useSyncExternalStore(subscribe, getComboPageIa, getComboPageIa);
}
