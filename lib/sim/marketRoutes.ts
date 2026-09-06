import * as data from "./data";
import { NFL, NFL_CAR_ARI, NFL_GB_PIT, SPURS_KNICKS } from "./data";
import { findPredictionMarket } from "./predictionRegistry";
import type { Match } from "./types";

// Shared card → detail-page routing (UXR). Games route to the generic
// /match-detail keyed by BOTH teams' abbrs ("kc-bal") so two fixtures sharing
// a first team (Chiefs–Bills vs. Chiefs–Ravens) never collide in the registry
// (see app/match-detail.tsx REGISTRY). Binary/topic markets use
// /prediction-detail.

// Composite registry key for a match: "firstabbr-secondabbr", lowercase.
export const matchKey = (m: Match): string =>
  m.teams
    .slice(0, 2)
    .map((t) => (t.abbr ?? t.initial).toLowerCase())
    .join("-");

export const matchDetailHref = (m: Match): string => {
  const key = matchKey(m);
  // Two fully-designed bespoke pages keep their dedicated routes:
  // Alcaraz–Sinner tennis and Panthers–Cardinals (Moneyline / Spread /
  // Total Points + combo ticket). Every other fixture — including other
  // tennis matches — uses the generic match-detail page.
  if (key === "alc-sin") return "/tennis-detail";
  if (key === "car-ari") return "/game-detail";
  return `/match-detail?m=${key}`;
};

export const PREDICTION_DETAIL_HREF = "/prediction-detail";

// Fallback when a bet slip was opened from a feed/carousel card that didn't
// pass returnTo — map the market title back to the matching detail route.
function normMarket(s: string): string {
  return s.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
}

function isMatchShape(v: unknown): v is Match {
  if (!v || typeof v !== "object") return false;
  const m = v as Match;
  return Array.isArray(m.teams) && typeof m.league === "string" && m.teams.length >= 2;
}

function findMatchByMarket(market: string): Match | undefined {
  const target = normMarket(market).replace(/\s*vs\s*/g, " vs ");
  const known: Match[] = [NFL_GB_PIT, NFL_CAR_ARI, NFL, SPURS_KNICKS];
  const rest = Object.values(data).filter(isMatchShape);
  for (const match of [...known, ...rest]) {
    const [a, b] = match.teams;
    const vs = normMarket(`${a.name} vs ${b.name}`);
    const rev = normMarket(`${b.name} vs ${a.name}`);
    if (target.includes(vs) || vs.includes(target) || target.includes(rev) || rev.includes(target)) {
      return match;
    }
  }
  return undefined;
}

export function inferDetailHref(market?: string): string | undefined {
  if (!market) return undefined;
  const m = market.toLowerCase();
  if (/\bbtc\b/.test(m) && /up or down/.test(m)) return "/btc-updown";
  if (/bitcoin/.test(m) && /150/.test(m)) return "/btc-150k";
  const game = findMatchByMarket(market);
  if (game) return matchDetailHref(game);
  const pm = findPredictionMarket(market);
  if (pm) return `/prediction-detail?pm=${encodeURIComponent(pm.question)}`;
  return undefined;
}
