import type { Match } from "@/lib/sim/types";

/** Domestic/regular-season soccer — always Home | Draw | Away. */
const SOCCER_LEAGUE_RE =
  /premier league|\bmls\b|la liga|serie a|bundesliga|ligue 1|championship|liga mx|eredivisie|primeira liga|brasileir[aã]o|primera divisi[oó]n|saudi pro league|2\.?\s*bundesliga/i;

/** Cup / knockout competitions. 2-way only when the match has no draw market. */
const SOCCER_TOURNAMENT_RE =
  /world cup|champions league|europa league|conference league|fa cup|copa del rey|coppa italia|copa libertadores|knockout|round of|quarter-?final|semi-?final/i;

export function isSoccerKnockoutTournament(match: Pick<Match, "sport" | "league" | "draw">): boolean {
  if (match.sport !== "soccer") return false;
  const league = match.league ?? "";
  if (SOCCER_LEAGUE_RE.test(league)) return false;
  return SOCCER_TOURNAMENT_RE.test(league) && !match.draw;
}

export function soccerShowsDraw(match: Pick<Match, "sport" | "league" | "draw">): boolean {
  return match.sport === "soccer" && !isSoccerKnockoutTournament(match);
}

export function soccerDrawCents(match: Pick<Match, "sport" | "league" | "draw" | "teams">): number | undefined {
  if (!soccerShowsDraw(match)) return undefined;
  if (match.draw) {
    const n = parseInt(match.draw.pct, 10);
    return Number.isFinite(n) ? n : undefined;
  }
  const home = parseFloat(match.teams[0]?.pct ?? "") || 0;
  const away = parseFloat(match.teams[1]?.pct ?? "") || 0;
  const leftover = Math.max(1, 100 - home - away);
  if (home + away < 95) return leftover;
  return Math.max(8, Math.round(Math.min(home, away) * 0.4));
}
