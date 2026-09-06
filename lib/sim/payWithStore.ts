import { useSyncExternalStore } from "react";

import type { PayWithMethod } from "@/components/sim/PayWithSheet";

// Global Pay with sheet. Mounted once at the app root so it stacks above the
// bet slip Modal and the in-tree combo sheet (nested Modals ghost on web).

type State = { open: boolean; selected: PayWithMethod };

let state: State = { open: false, selected: "usdc" };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function openPayWith() {
  state = { ...state, open: true };
  emit();
}

export function closePayWith() {
  if (!state.open) return;
  state = { ...state, open: false };
  emit();
}

export function setPayWithMethod(selected: PayWithMethod) {
  state = { ...state, selected };
  emit();
}

export function usePayWith(): State {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => state,
    () => state,
  );
}
