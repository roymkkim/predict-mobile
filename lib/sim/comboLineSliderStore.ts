import { useSyncExternalStore } from "react";

/** Combo sheet LinePicker under spread / totals / win-by. Off also hides those markets’ swap. */
export const COMBO_LINE_SLIDER_STORAGE_KEY = "predict.combo-line-slider.v2";
export const COMBO_LINE_SLIDER_DEFAULT = false;

let enabled = COMBO_LINE_SLIDER_DEFAULT;
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
    globalThis.localStorage?.setItem(COMBO_LINE_SLIDER_STORAGE_KEY, next ? "1" : "0");
  } catch {
    /* session-only */
  }
}

export function parseComboLineSlider(raw: string | null | undefined): boolean {
  if (raw === "0") return false;
  if (raw === "1") return true;
  return COMBO_LINE_SLIDER_DEFAULT;
}

if (typeof globalThis !== "undefined") {
  try {
    enabled = parseComboLineSlider(globalThis.localStorage?.getItem(COMBO_LINE_SLIDER_STORAGE_KEY));
  } catch {
    /* keep default */
  }
}

export function setComboLineSlider(next: boolean) {
  if (next === enabled) return;
  enabled = next;
  persist(next);
  emit();
}

export function getComboLineSlider(): boolean {
  return enabled;
}

export function useComboLineSlider(): boolean {
  return useSyncExternalStore(subscribe, getComboLineSlider, getComboLineSlider);
}
