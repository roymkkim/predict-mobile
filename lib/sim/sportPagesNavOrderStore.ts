import { useSyncExternalStore } from "react";

// Sport-page navigation order:
// - "chipsFirst" (current default): league filter chips on top, Games/Props on
//   the second line.
// - "tabsFirst": Leagues/Games/Props tabs on top, filter chips on the second
//   line. The Leagues tab lists leagues inline (no separate page); tapping a
//   league row selects it and jumps to the Games tab.
export type SportPagesNavOrder = "chipsFirst" | "tabsFirst";

let order: SportPagesNavOrder = "chipsFirst";
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSportPagesNavOrder(): SportPagesNavOrder {
  return order;
}

export function setSportPagesNavOrder(next: SportPagesNavOrder): void {
  if (next === order) return;
  order = next;
  listeners.forEach((listener) => listener());
}

export function useSportPagesNavOrder(): SportPagesNavOrder {
  return useSyncExternalStore(subscribe, getSportPagesNavOrder, getSportPagesNavOrder);
}
