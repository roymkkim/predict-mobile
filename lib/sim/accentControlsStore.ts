import { useSyncExternalStore } from "react";

import type { CenterAccentWidth, StandardAccent, VersusAccent } from "./types";

// App-wide shared store for the live-accent + bloom display controls (the
// "Live border accent + glow" + "Versus accent + bloom (center)" toggles, the
// versus/standard accent placement, the centered glow width, and the accent
// opacity). The home screen owns the toggles, but standalone pages that reuse
// the feed cards (Sports, World Cup, the category/topic pages, etc.) must
// reflect the same choices, so the values live in a tiny module-level store
// both the home feed and those pages subscribe to. Defaults mirror the home
// feed. A full app reload clears module state back to these defaults.
export type AccentControls = {
  showLiveAccent: boolean;
  hideVersusAccent: boolean;
  versusAccent: VersusAccent;
  standardAccent: StandardAccent;
  centerAccentWidth: CenterAccentWidth;
  accentOpacity: number;
};

let current: AccentControls = {
  showLiveAccent: true,
  hideVersusAccent: false,
  versusAccent: "center",
  standardAccent: "corner",
  centerAccentWidth: "default",
  accentOpacity: 0.54,
};
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setShowLiveAccent(v: boolean) {
  if (v === current.showLiveAccent) return;
  current = { ...current, showLiveAccent: v };
  emit();
}

export function setHideVersusAccent(v: boolean) {
  if (v === current.hideVersusAccent) return;
  current = { ...current, hideVersusAccent: v };
  emit();
}

export function setVersusAccent(v: VersusAccent) {
  if (v === current.versusAccent) return;
  current = { ...current, versusAccent: v };
  emit();
}

export function setStandardAccent(v: StandardAccent) {
  if (v === current.standardAccent) return;
  current = { ...current, standardAccent: v };
  emit();
}

export function setCenterAccentWidth(v: CenterAccentWidth) {
  if (v === current.centerAccentWidth) return;
  current = { ...current, centerAccentWidth: v };
  emit();
}

export function setAccentOpacity(v: number) {
  if (v === current.accentOpacity) return;
  current = { ...current, accentOpacity: v };
  emit();
}

// Reactive read — components re-render when any accent control changes. The
// snapshot reference is stable between changes, so it is safe for memo deps.
export function useAccentControls(): AccentControls {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );
}
