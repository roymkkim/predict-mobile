import { useSyncExternalStore } from "react";

import {
  COMBO_CART_STYLE_DEFAULT,
  COMBO_CART_STYLE_STORAGE_KEY,
  parseComboCartStyle,
  type ComboCartStyle,
} from "./comboCartStyle";

export type { ComboCartStyle };

let current: ComboCartStyle = COMBO_CART_STYLE_DEFAULT;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function persist(next: ComboCartStyle) {
  try {
    globalThis.localStorage?.setItem(COMBO_CART_STYLE_STORAGE_KEY, next);
  } catch {
    /* session-only */
  }
}

if (typeof globalThis !== "undefined") {
  try {
    current = parseComboCartStyle(globalThis.localStorage?.getItem(COMBO_CART_STYLE_STORAGE_KEY));
  } catch {
    /* keep default */
  }
}

export function setComboCartStyle(next: ComboCartStyle) {
  if (next === current) return;
  current = next;
  persist(next);
  emit();
}

export function getComboCartStyle(): ComboCartStyle {
  return current;
}

export function useComboCartStyle(): ComboCartStyle {
  return useSyncExternalStore(subscribe, getComboCartStyle, getComboCartStyle);
}
