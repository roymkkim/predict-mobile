import { useSyncExternalStore } from "react";

// Session store of bets the user actually placed (single bet-slip buys and
// combination tickets). The Positions page "Active positions" tab renders
// from this list; it starts empty each session.

export type PlacedLeg = {
  category: string;
  categoryEmoji?: string;
  label: string; // "Yes · Packers vs Steelers"
  color: string;
  cents: number;
};

export type PlacedPosition =
  | {
      kind: "single";
      id: string;
      market?: string;
      title: string; // pick label, e.g. "Panthers"
      color: string;
      cents: number;
      cost: number;
      toWin: number;
      // Market orders are immediately filled and do not expose auto-sell.
      orderType: "market" | "limit";
      // Route of the market's detail page, e.g. "/match-detail?m=kc".
      detailHref?: string;
      // Auto-sell limit target (dollars) when the user has set one.
      autoSellAt?: number;
    }
  | {
      kind: "combo";
      id: string;
      legs: PlacedLeg[];
      cost: number;
      toWin: number;
    };

let positions: PlacedPosition[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

function get(): PlacedPosition[] {
  return positions;
}

let seq = 0;

// Omit distributed over the union so each variant keeps its own fields.
type NewPosition = PlacedPosition extends infer P ? (P extends PlacedPosition ? Omit<P, "id"> & { id?: string } : never) : never;

export function addPlacedPosition(p: NewPosition) {
  const id = p.id ?? `pos-${++seq}-${p.kind}`;
  positions = [{ ...p, id } as PlacedPosition, ...positions];
  emit();
}

export function setAutoSellTarget(id: string, target: number) {
  positions = positions.map((p) => (p.id === id ? { ...p, autoSellAt: target } : p));
  emit();
}

export function usePlacedPositions(): PlacedPosition[] {
  return useSyncExternalStore(subscribe, get, get);
}

// Deterministic mock "current value" drift so a fresh bet shows a plausible
// unrealized gain without any live pricing.
export function mockCurrent(p: PlacedPosition): { current: number; changePct: number } {
  let h = 0;
  for (const ch of p.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const changePct = 1 + (h % 280) / 10; // +1.0% … +28.9%
  return { current: p.cost * (1 + changePct / 100), changePct };
}

// "CAR at 62¢ · Panthers vs Cardinals" — the price stays with the pick, never
// dangling at the end of a longer title like "CAR · Panthers vs Cardinals".
export function positionMeta(title: string, cents: number): string {
  const at = ` at ${Math.round(cents)}¢`;
  const i = title.indexOf(" · ");
  return i >= 0 ? `${title.slice(0, i)}${at}${title.slice(i)}` : `${title}${at}`;
}
