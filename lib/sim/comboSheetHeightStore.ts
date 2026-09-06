import { useSyncExternalStore } from "react";

/** Collapsed 2-leg tray (header + Next) before first onLayout. */
export const COMBO_SHEET_SCROLL_FALLBACK = 320;

let height = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setComboSheetHeight(next: number): void {
  const h = Math.max(0, Math.round(next));
  if (h === height) return;
  height = h;
  emit();
}

export function getComboSheetHeight(): number {
  return height;
}

export function useComboSheetHeight(): number {
  return useSyncExternalStore(subscribe, getComboSheetHeight, getComboSheetHeight);
}

/** Scroll inset so last market cards can sit above the docked combo tray. */
export function comboListPaddingBottom(
  comboMode: boolean,
  sheetHeight: number,
  safeBottom: number,
  otherwise: number,
): number {
  if (!comboMode) return otherwise;
  const overlay = sheetHeight > 0 ? sheetHeight : COMBO_SHEET_SCROLL_FALLBACK;
  return overlay + safeBottom;
}
