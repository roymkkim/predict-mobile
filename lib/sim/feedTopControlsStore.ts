import { useSyncExternalStore } from "react";

import type { VersusLayout, VersusVersion } from "./types";

// App-wide shared store for the top "Card" controls in the display-settings
// sheet (the four emphasized toggles: Footer, VS card header, Versus score, and
// Versus for upcoming games). The home screen owns the toggles, but standalone
// pages that reuse the feed cards (e.g. World Cup) must reflect the same choices,
// so the values live in a tiny module-level store both the home feed and those
// pages subscribe to. Card metadata (showFooter) is ON on first visit and
// persisted; other card controls stay session-only.
export type FeedTopControls = {
  showFooter: boolean;
  versusVersion: VersusVersion;
  versusLayout: VersusLayout;
  versusUpcoming: boolean;
};

const FOOTER_KEY = "predict.card-metadata";

let current: FeedTopControls = {
  showFooter: true,
  versusVersion: "a",
  versusLayout: "sides",
  versusUpcoming: false,
};
const listeners = new Set<() => void>();

function persistFooter(next: boolean) {
  try {
    globalThis.localStorage?.setItem(FOOTER_KEY, next ? "1" : "0");
  } catch {
    /* session-only */
  }
}

if (typeof globalThis !== "undefined") {
  try {
    const raw = globalThis.localStorage?.getItem(FOOTER_KEY);
    if (raw === "1") current = { ...current, showFooter: true };
    if (raw === "0") current = { ...current, showFooter: false };
  } catch {
    /* keep default */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setShowFooter(v: boolean) {
  if (v === current.showFooter) return;
  current = { ...current, showFooter: v };
  persistFooter(v);
  emit();
}

export function setVersusVersion(v: VersusVersion) {
  if (v === current.versusVersion) return;
  current = { ...current, versusVersion: v };
  emit();
}

export function setVersusLayout(v: VersusLayout) {
  if (v === current.versusLayout) return;
  current = { ...current, versusLayout: v };
  emit();
}

export function setVersusUpcoming(v: boolean) {
  if (v === current.versusUpcoming) return;
  current = { ...current, versusUpcoming: v };
  emit();
}

// Reactive read — components re-render when any top control changes. The
// snapshot reference is stable between changes, so it is safe for memo deps.
export function useTopControls(): FeedTopControls {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );
}
