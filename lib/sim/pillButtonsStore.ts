// Bet-button shape store: default is 12px rounded corners; "pill" switches the
// outcome buttons to fully-rounded capsules. Module-level store +
// useSyncExternalStore, same pattern as uxrModeStore. Read non-reactively by
// outcomeButtonVisual (buttonStyle.ts) — every consumer component must
// subscribe via usePillButtons() (alongside its useUxrMode() call) so mounted
// cards re-render when the toggle flips.
import { useSyncExternalStore } from "react";

let pill = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPillButtons(): boolean {
  return pill;
}

export function setPillButtons(next: boolean): void {
  if (next === pill) return;
  pill = next;
  listeners.forEach((l) => l());
}

export function usePillButtons(): boolean {
  return useSyncExternalStore(subscribe, getPillButtons, getPillButtons);
}

// Reactive bet-button corner radius: 12px rounded (default) or fully-rounded
// capsule when the "Pill buttons" setting is on. Use for every outcome/bet
// button, including carousel cards and detail pages.
export function useBetRadius(): number {
  return usePillButtons() ? 999 : 12;
}
