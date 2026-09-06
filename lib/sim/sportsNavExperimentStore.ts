import { useSyncExternalStore } from "react";

// Sports-page navigation experiment (Robinhood-style). Off by default:
// the Live + league carousel stays as-is until Settings turns this on.
//
// After a league is chosen, the carousel is replaced by a compact chrome:
//   "dropdowns" — [X] [League] [Games / Props]
//   "chips"     — [X] [League] + a horizontally scrolling market-filter rail

export type SportsNavVariant = "dropdowns" | "chips";

export const SPORTS_NAV_VARIANT_OPTIONS: SportsNavVariant[] = ["dropdowns", "chips"];

export const SPORTS_NAV_VARIANT_LABELS: Record<SportsNavVariant, string> = {
  dropdowns: "Two dropdowns",
  chips: "Dropdown + chips",
};

type SportsNavExperimentState = {
  enabled: boolean;
  variant: SportsNavVariant;
};

let current: SportsNavExperimentState = { enabled: false, variant: "dropdowns" };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setSportsNavEnabled(enabled: boolean) {
  if (current.enabled === enabled) return;
  current = { ...current, enabled };
  emit();
}

export function setSportsNavVariant(variant: SportsNavVariant) {
  if (current.variant === variant) return;
  current = { ...current, variant };
  emit();
}

export function useSportsNavExperiment(): SportsNavExperimentState {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );
}
