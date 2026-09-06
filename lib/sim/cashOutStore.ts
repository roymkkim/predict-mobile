import { useSyncExternalStore } from "react";

// Global cash-out confirmation sheet, mirroring autoSellStore: any position
// card calls openCashOut(req) and the sheet mounted at the app root raises.

export type CashOutRequest = {
  tint: string;
  title: string; // market line, e.g. "Panthers vs Cardinals"
  sub: string; // "$4.10 on Bogdan · 41¢"
  current: number; // cash-out value now
  cost: number; // original stake (for the +delta line)
  cents: number; // price used for the "Selling N shares at NN¢" line
  combo?: boolean;
  onConfirm?: () => void;
};

type State = { open: boolean; req: CashOutRequest | null };

let state: State = { open: false, req: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function openCashOut(req: CashOutRequest) {
  state = { open: true, req };
  emit();
}

export function closeCashOut() {
  if (!state.open) return;
  state = { open: false, req: state.req };
  emit();
}

export function useCashOut(): State {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => state,
    () => state,
  );
}
