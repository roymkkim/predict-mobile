// Kalshi demo flavor. Independent of the Polymarket/Kalshi venue toggle
// (`regionStore`): the home badge switches the venue; Display picks which
// Kalshi experience to show once Kalshi is on.
//
//   "mvp" (default) — US-only home: NFL + NCAAF. League pages are a header
//                     plus Games / Props tabs.
//   "v2"            — the regular MM Proposal home and sport pages.
import { useSyncExternalStore } from "react";

import { getRegion, useRegion } from "@/lib/sim/regionStore";

export type KalshiFlavor = "mvp" | "v2";

export const KALSHI_FLAVOR_OPTIONS: KalshiFlavor[] = ["mvp", "v2"];

export const KALSHI_FLAVOR_LABELS: Record<KalshiFlavor, string> = {
  mvp: "Kalshi MVP",
  v2: "Kalshi V2",
};

let flavor: KalshiFlavor = "mvp";
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getKalshiFlavor(): KalshiFlavor {
  return flavor;
}

export function setKalshiFlavor(next: KalshiFlavor): void {
  if (next === flavor) return;
  flavor = next;
  listeners.forEach((listener) => listener());
}

export function useKalshiFlavor(): KalshiFlavor {
  return useSyncExternalStore(subscribe, getKalshiFlavor, getKalshiFlavor);
}

export function isKalshiMvp(): boolean {
  return getRegion() === "kalshi" && getKalshiFlavor() === "mvp";
}

export function useKalshiMvp(): boolean {
  const region = useRegion();
  const kalshiFlavor = useKalshiFlavor();
  return region === "kalshi" && kalshiFlavor === "mvp";
}
