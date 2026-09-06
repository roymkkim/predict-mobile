import { useSyncExternalStore } from "react";

/** Sports landing: category directory (current) vs Politics-style hub feed. */
export type SportsPageLayout = "list" | "page";

export const SPORTS_PAGE_LAYOUT_DEFAULT: SportsPageLayout = "list";
export const SPORTS_PAGE_LAYOUT_STORAGE_KEY = "predict.sports-page-layout";

export const SPORTS_PAGE_LAYOUT_OPTIONS: SportsPageLayout[] = ["list", "page"];

export const SPORTS_PAGE_LAYOUT_LABELS: Record<SportsPageLayout, string> = {
  list: "List",
  page: "Sports page",
};

let current: SportsPageLayout = SPORTS_PAGE_LAYOUT_DEFAULT;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function persist(next: SportsPageLayout) {
  try {
    globalThis.localStorage?.setItem(SPORTS_PAGE_LAYOUT_STORAGE_KEY, next);
  } catch {
    /* session-only */
  }
}

export function parseSportsPageLayout(raw: string | null | undefined): SportsPageLayout {
  if (raw === "page" || raw === "list") return raw;
  return SPORTS_PAGE_LAYOUT_DEFAULT;
}

if (typeof globalThis !== "undefined") {
  try {
    current = parseSportsPageLayout(globalThis.localStorage?.getItem(SPORTS_PAGE_LAYOUT_STORAGE_KEY));
  } catch {
    /* keep default */
  }
}

export function setSportsPageLayout(next: SportsPageLayout) {
  if (next === current) return;
  current = next;
  persist(next);
  emit();
}

export function getSportsPageLayout(): SportsPageLayout {
  return current;
}

export function useSportsPageLayout(): SportsPageLayout {
  return useSyncExternalStore(subscribe, getSportsPageLayout, getSportsPageLayout);
}
