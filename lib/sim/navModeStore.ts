// Navigation-mode store: how category browsing is structured in the UXR app.
//   "nested"  (default) — current nested drill-down pages (categories → sport → league)
//   "single"  — one combined category page
// Module-level store + useSyncExternalStore, same pattern as uxrModeStore.
import { useSyncExternalStore } from "react";

export type NavMode = "nested" | "single" | "picker";

export const NAV_MODE_LABELS: Record<NavMode, string> = {
  nested: "Nested pages",
  single: "Category hub",
  picker: "Header picker",
};

let mode: NavMode = "single";
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getNavMode(): NavMode {
  return mode;
}

export function setNavMode(next: NavMode): void {
  if (next === mode) return;
  mode = next;
  listeners.forEach((l) => l());
}

export function useNavMode(): NavMode {
  return useSyncExternalStore(subscribe, getNavMode, getNavMode);
}
