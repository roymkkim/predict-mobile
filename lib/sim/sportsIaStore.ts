// Sports IA store: which information architecture the sports experience uses.
// Sports IA variants:
//   "polymarket"             — the existing category-hub experience
//   "kalshi"               — Kalshi replication: sport pages with
//                            GAMES / LEAGUES / TO ADVANCE / FUTURES tabs and
//                            league pages with GAMES / FUTURES / LEAGUE LEADER /
//                            NEXT CLUB, entered from the Categories Carousel.
//   "polymarket-metamask"  — the new MetaMask ButtonFilter-based Polymarket IA.
//   "polymarket-sport-pages" — Polymarket with a dedicated page per sport.
// Module-level store + useSyncExternalStore, same pattern as navModeStore.
import { useSyncExternalStore } from "react";

export type SportsIa = "polymarket" | "kalshi" | "polymarket-metamask" | "polymarket-sport-pages";

export const SPORTS_IA_LABELS: Record<SportsIa, string> = {
  kalshi: "Kalshi",
  polymarket: "Polymarket",
  "polymarket-metamask": "Polymarket (MetaMask)",
  "polymarket-sport-pages": "MM Proposal",
};

// Keep the legacy MetaMask IA value routable, but expose only the three
// currently approved choices in the settings selector.
export const SPORTS_IA_OPTIONS: SportsIa[] = [
  "kalshi",
  "polymarket",
  "polymarket-sport-pages",
];

let ia: SportsIa = "polymarket-sport-pages";
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSportsIa(): SportsIa {
  return ia;
}

export function setSportsIa(next: SportsIa): void {
  if (next === ia) return;
  ia = next;
  listeners.forEach((l) => l());
}

export function useSportsIa(): SportsIa {
  return useSyncExternalStore(subscribe, getSportsIa, getSportsIa);
}
