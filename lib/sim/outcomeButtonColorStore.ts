import { useSyncExternalStore } from "react";

// Outcome-button color treatment. App default is solid fill. Event-detail
// in-card pills opt into muted-color locally; the sticky footer stays fill.
// Yes/No (and Up/Down) always keep green/red on the text.
export type OutcomeButtonColorMode = "fill" | "muted-color" | "muted-white";

const STORAGE_KEY = "predict.outcome-button-color";

let current: OutcomeButtonColorMode = "fill";
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function persist(next: OutcomeButtonColorMode) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, next);
  } catch {
    /* session-only */
  }
}

if (typeof globalThis !== "undefined") {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw === "fill" || raw === "muted-color" || raw === "muted-white") current = raw;
  } catch {
    /* keep default */
  }
}

export function setOutcomeButtonColorMode(next: OutcomeButtonColorMode) {
  if (next === current) return;
  current = next;
  persist(next);
  emit();
}

export function getOutcomeButtonColorMode(): OutcomeButtonColorMode {
  return current;
}

export function useOutcomeButtonColorMode(): OutcomeButtonColorMode {
  return useSyncExternalStore(subscribe, getOutcomeButtonColorMode, getOutcomeButtonColorMode);
}
