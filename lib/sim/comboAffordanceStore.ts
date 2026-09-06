import { useSyncExternalStore } from "react";

import {
  COMBO_AFFORDANCE_DEFAULT,
  COMBO_AFFORDANCE_STORAGE_KEY,
  parseComboAffordance,
  type ComboAffordance,
} from "./comboAffordance";

export type { ComboAffordance };

let current: ComboAffordance = COMBO_AFFORDANCE_DEFAULT;
let slipOpen = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function persist(next: ComboAffordance) {
  try {
    globalThis.localStorage?.setItem(COMBO_AFFORDANCE_STORAGE_KEY, next);
  } catch {
    /* session-only */
  }
}

if (typeof globalThis !== "undefined") {
  try {
    current = parseComboAffordance(globalThis.localStorage?.getItem(COMBO_AFFORDANCE_STORAGE_KEY));
  } catch {
    /* keep default */
  }
}

export function setComboAffordance(next: ComboAffordance) {
  if (next === current) return;
  current = next;
  if (next !== "cart") slipOpen = false;
  persist(next);
  emit();
}

export function getComboAffordance(): ComboAffordance {
  return current;
}

export function useComboAffordance(): ComboAffordance {
  return useSyncExternalStore(subscribe, getComboAffordance, getComboAffordance);
}

export function openComboCartSlip(): void {
  if (slipOpen) return;
  slipOpen = true;
  emit();
}

export function closeComboCartSlip(): void {
  if (!slipOpen) return;
  slipOpen = false;
  emit();
}

export function getComboCartSlipOpen(): boolean {
  return slipOpen;
}

export function useComboCartSlipOpen(): boolean {
  return useSyncExternalStore(subscribe, getComboCartSlipOpen, getComboCartSlipOpen);
}
