import { useSyncExternalStore } from "react";

// Display → Combos → Templates. On by default. Home shows a templates
// carousel between Live and Explore; the Combos page prepends a Templates tab.
const STORAGE_KEY = "predict.combo-templates";

let enabled = true;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function persist(next: boolean) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, next ? "1" : "0");
  } catch {
    /* session-only */
  }
}

if (typeof globalThis !== "undefined") {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw === "1") enabled = true;
    if (raw === "0") enabled = false;
  } catch {
    /* keep default */
  }
}

export function setComboTemplates(next: boolean) {
  if (next === enabled) return;
  enabled = next;
  persist(next);
  emit();
}

export function getComboTemplates(): boolean {
  return enabled;
}

export function useComboTemplates(): boolean {
  return useSyncExternalStore(subscribe, getComboTemplates, getComboTemplates);
}
