import { useSyncExternalStore } from "react";

import { requestOnboarding } from "./onboardingStore";
import type { OutcomeAvatar } from "./types";

// The outcome a tapped price/odds button wants to bet on. Kept intentionally
// small: a display title (e.g. "Portugal"), the price in cents (76.5 -> 76.5¢),
// an accent color for the header swatch, and an optional initial Yes/No side.
export type BetSlipPick = {
  title: string;
  // The parent market this outcome belongs to (e.g. "Portugal vs Spain"),
  // shown muted above the bold outcome title in the slip header.
  market?: string;
  oddsCents: number;
  color: string;
  side?: "yes" | "no";
  // Per-outcome avatar (headshot, crest, etc.). When absent the slip looks
  // the outcome up from the prediction registry, then falls back to `color`.
  avatar?: OutcomeAvatar;
  // Where the trade-submitted (congrats) screen should return the user on
  // exit — e.g. "/game-detail" when the slip was opened from the detail page.
  // Defaults to the positions page when absent.
  returnTo?: string;
};

// Global bet-slip state. The slip is mounted once at the app root, and any card
// button anywhere calls openBetSlip(pick) to raise it — so the state lives in a
// module-level store rather than React context (no provider plumbing needed,
// works across every route). Mirrors the other sim stores' shape.
export type BetSlipState = {
  open: boolean;
  pick: BetSlipPick | null;
};

let current: BetSlipState = { open: false, pick: null };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function openBetSlip(pick: BetSlipPick) {
  // First bet attempt gates on the onboarding (verification) flow: if it is
  // enabled and not yet completed, raise it instead of the slip.
  if (requestOnboarding()) return;
  current = { open: true, pick };
  emit();
}

export function closeBetSlip() {
  if (!current.open) return;
  current = { open: false, pick: current.pick };
  emit();
}

export function useBetSlip(): BetSlipState {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );
}
