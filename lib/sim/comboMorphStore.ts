import { useSyncExternalStore } from "react";

export type ComboMorphOrigin = {
  x: number;
  y: number;
  width: number;
  height: number;
  windowWidth: number;
  windowHeight: number;
  radius: number;
};

let origin: ComboMorphOrigin | null = null;
/** Last Build a combo bounds — FAB ↔ sheet must not overwrite this. */
let returnTarget: ComboMorphOrigin | null = null;
/** Cart FAB morphing back into Build a combo (progress 1 → 0). */
let reverse = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setComboMorphOrigin(
  next: ComboMorphOrigin | null,
  opts?: { rememberReturn?: boolean },
): void {
  origin = next;
  reverse = false;
  if (opts?.rememberReturn && next) returnTarget = next;
  emit();
}

export function getComboMorphOrigin(): ComboMorphOrigin | null {
  return origin;
}

export function getComboMorphReverse(): boolean {
  return reverse;
}

export function getComboMorphReturnTarget(): ComboMorphOrigin | null {
  return returnTarget;
}

/** Update the Build a combo return slot without starting a morph. */
export function setComboMorphReturnTarget(next: ComboMorphOrigin): void {
  returnTarget = next;
  emit();
}

/** Replay shared-element morph from cart FAB back to Build a combo. */
export function beginComboCartReturn(): boolean {
  if (!returnTarget) return false;
  origin = returnTarget;
  reverse = true;
  emit();
  return true;
}

export function clearComboMorphOrigin(): void {
  if (!origin && !reverse) return;
  origin = null;
  reverse = false;
  emit();
}

export function clearComboMorphReturnTarget(): void {
  returnTarget = null;
}

export function useComboMorphOrigin(): ComboMorphOrigin | null {
  return useSyncExternalStore(subscribe, getComboMorphOrigin, getComboMorphOrigin);
}

export function useComboMorphReverse(): boolean {
  return useSyncExternalStore(subscribe, getComboMorphReverse, getComboMorphReverse);
}

export function useComboMorphReturnTarget(): ComboMorphOrigin | null {
  return useSyncExternalStore(subscribe, getComboMorphReturnTarget, getComboMorphReturnTarget);
}
