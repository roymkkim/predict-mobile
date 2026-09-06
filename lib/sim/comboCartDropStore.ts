import { useSyncExternalStore } from "react";

// Display → Combos → Cart drop. On by default. Adding a leg flies into the FAB,
// then the badge count updates.
const STORAGE_KEY = "predict.combo-cart-drop";

let enabled = true;
const listeners = new Set<() => void>();
let lastPointer: { x: number; y: number } | null = null;

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
  const root = globalThis as typeof globalThis & {
    addEventListener?: (type: string, listener: (e: PointerEvent) => void, opts?: boolean) => void;
  };
  if (typeof root.addEventListener === "function") {
    try {
      root.addEventListener(
        "pointerdown",
        (e) => {
          lastPointer = { x: e.clientX, y: e.clientY };
        },
        true,
      );
    } catch {
      /* native */
    }
  }
}

export function setComboCartDrop(next: boolean) {
  if (next === enabled) return;
  enabled = next;
  persist(next);
  emit();
}

export function getComboCartDrop(): boolean {
  return enabled;
}

export function getComboCartDropPointer(): { x: number; y: number } | null {
  return lastPointer;
}

export function setComboCartDropPointer(next: { x: number; y: number } | null): void {
  lastPointer = next;
}

export function useComboCartDrop(): boolean {
  return useSyncExternalStore(subscribe, getComboCartDrop, getComboCartDrop);
}
