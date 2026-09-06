import { useSyncExternalStore } from "react";

// App-wide shared store for the bet-slip display controls surfaced in the
// settings sheet: whether the slip offers Market/Limit order types (default
// ON), and whether it shows the Yes/No side selector pill on both market and
// limit orders (default OFF/hidden). Like the other cross-page control stores
// (accentControlsStore, etc.) the values live in a tiny module-level store so
// the slip — which is mounted once at the app root and can be opened from any
// card on any page — reflects the same choices the home settings sheet writes.
// A full reload restores the defaults.
export type BetSlipSettings = {
  // Show the "Market" / "Limit" order-type tabs in the bet slip.
  orderTypes: boolean;
  // Show the green "YES" / red "NO" side selector pill in the bet slip
  // (applies to both market and limit modes). Hidden by default.
  yesNoMarket: boolean;
};

let current: BetSlipSettings = {
  orderTypes: true,
  yesNoMarket: false,
};
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setOrderTypes(v: boolean) {
  if (v === current.orderTypes) return;
  current = { ...current, orderTypes: v };
  emit();
}

export function setYesNoMarket(v: boolean) {
  if (v === current.yesNoMarket) return;
  current = { ...current, yesNoMarket: v };
  emit();
}

export function useBetSlipSettings(): BetSlipSettings {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );
}
