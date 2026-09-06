import { useSyncExternalStore } from "react";

// Combinations stays a feature toggle (on/off). When on, entry chooses the
// home affordance: a colored Categories tile, the in-feed banner, or a
// floating button at the bottom.
export type CombinationsEntry = "tile" | "banner" | "fab";
export type CombinationsMode = "off" | CombinationsEntry;

const VISIBLE_KEY = "predict.combinations";
const ENTRY_KEY = "predict.combinations-entry-v2";

let visible = true;
let entry: CombinationsEntry = "tile";
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function persistVisible(next: boolean) {
  try {
    globalThis.localStorage?.setItem(VISIBLE_KEY, next ? "1" : "0");
  } catch {
    /* session-only */
  }
}

function persistEntry(next: CombinationsEntry) {
  try {
    globalThis.localStorage?.setItem(ENTRY_KEY, next);
  } catch {
    /* session-only */
  }
}

if (typeof globalThis !== "undefined") {
  try {
    const rawVisible = globalThis.localStorage?.getItem(VISIBLE_KEY);
    if (rawVisible === "1") visible = true;
    if (rawVisible === "0") visible = false;
    const rawEntry = globalThis.localStorage?.getItem(ENTRY_KEY);
    if (rawEntry === "tile" || rawEntry === "banner" || rawEntry === "fab") entry = rawEntry;
  } catch {
    /* keep defaults */
  }
}

function getMode(): CombinationsMode {
  return visible ? entry : "off";
}

export function getCombinationsVisible(): boolean {
  return visible;
}

export function getCombinationsEntry(): CombinationsEntry {
  return entry;
}

export function getCombinationsMode(): CombinationsMode {
  return getMode();
}

export function setCombinationsVisible(next: boolean): void {
  if (next === visible) return;
  visible = next;
  persistVisible(next);
  emit();
}

export function setCombinationsEntry(next: CombinationsEntry): void {
  if (next === entry) return;
  entry = next;
  persistEntry(next);
  emit();
}

export function setCombinationsMode(next: CombinationsMode): void {
  if (next === "off") {
    setCombinationsVisible(false);
    return;
  }
  const visChanged = !visible;
  const entryChanged = entry !== next;
  if (!visChanged && !entryChanged) return;
  visible = true;
  entry = next;
  persistVisible(true);
  persistEntry(next);
  emit();
}

export function useCombinationsVisible(): boolean {
  return useSyncExternalStore(subscribe, getCombinationsVisible, getCombinationsVisible);
}

export function useCombinationsEntry(): CombinationsEntry {
  return useSyncExternalStore(subscribe, getCombinationsEntry, getCombinationsEntry);
}

export function useCombinationsMode(): CombinationsMode {
  return useSyncExternalStore(subscribe, getCombinationsMode, getCombinationsMode);
}

export function useShowCombinationsBanner(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => visible && entry === "banner",
    () => visible && entry === "banner",
  );
}

export function useShowCombinationsFab(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => visible && entry === "fab",
    () => visible && entry === "fab",
  );
}

export function useShowCombinationsTile(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => visible && entry === "tile",
    () => visible && entry === "tile",
  );
}
