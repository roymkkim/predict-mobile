import { useSyncExternalStore } from "react";

// Combos bottom-sheet chrome. Muted hairline is the default; gradient is the
// older combo-ring treatment.
export type ComboSheetBorder = "muted" | "gradient";

const STORAGE_KEY = "predict.combo-sheet-border";

let current: ComboSheetBorder = "muted";
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function persist(next: ComboSheetBorder) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, next);
  } catch {
    /* session-only */
  }
}

if (typeof globalThis !== "undefined") {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw === "muted" || raw === "gradient") current = raw;
  } catch {
    /* keep default */
  }
}

export function setComboSheetBorder(next: ComboSheetBorder) {
  if (next === current) return;
  current = next;
  persist(next);
  emit();
}

export function getComboSheetBorder(): ComboSheetBorder {
  return current;
}

export function useComboSheetBorder(): ComboSheetBorder {
  return useSyncExternalStore(subscribe, getComboSheetBorder, getComboSheetBorder);
}
