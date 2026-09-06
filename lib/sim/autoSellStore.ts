import { useSyncExternalStore } from "react";

// Global driver for the post-limit-order "Auto sell if you're up?" prompt.
// The sheet itself is mounted once in app/_layout.tsx (like BetSlipSheet):
// on web the JS stack can render duplicate route cards that stack above any
// overlay mounted inside a screen, so screen-local overlays ghost.

// detailHref: where "Not now" lands (the market's detail page); when unset the
// sheet just closes (callers already on the detail page).
export type AutoSellRequest = { tint: string; cost: number; toWin: number; onSet?: (target: number) => void; detailHref?: string };

type State = { open: boolean; req: AutoSellRequest | null };

let state: State = { open: false, req: null };
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

function get(): State {
  return state;
}

export function openAutoSell(req: AutoSellRequest) {
  state = { open: true, req };
  emit();
}

export function closeAutoSell() {
  if (!state.open) return;
  state = { ...state, open: false };
  emit();
}

export function useAutoSell(): State {
  return useSyncExternalStore(subscribe, get, get);
}
