import { EPL_ARS_LIV, NBA_OKC_HOU, sportBySlug } from "@/components/sim/UxrBrowse";
import {
  MLB_MARKET,
  NFL_CAR_ARI,
  NFL_GB_PIT,
  NFL_MARKET,
  TENNIS,
} from "@/lib/sim/data";
import type { Match, PoliticsMarket } from "@/lib/sim/types";

export const SPORTS_HUB_SECTION_LIMIT = 3;

export type SportsHubCard =
  | { kind: "match"; match: Match }
  | { kind: "market"; market: PoliticsMarket };

export type SportsHubSection = {
  title: string;
  href: string;
  cards: SportsHubCard[];
};

function takeCards(cards: SportsHubCard[], limit = SPORTS_HUB_SECTION_LIMIT): SportsHubCard[] {
  return cards.slice(0, limit);
}

function sportLeagueMatches(slug: string, league: string): Match[] {
  const sport = sportBySlug(slug);
  if (!sport) return [];
  return sport.games.flatMap((group) => group.matches).filter((match) => match.league === league);
}

/** MLB, NFL, and Other Sports — three cards each, like home Trending sections. */
export function sportsHubSections(): SportsHubSection[] {
  const mlbGames = sportLeagueMatches("baseball", "MLB");
  return [
    {
      title: "MLB",
      href: "/uxr-sport/baseball?league=MLB",
      cards: takeCards([
        ...mlbGames.map((match) => ({ kind: "match" as const, match })),
        { kind: "market", market: MLB_MARKET },
      ]),
    },
    {
      title: "NFL",
      href: "/uxr-sport/football?league=NFL",
      cards: takeCards([
        { kind: "match", match: NFL_CAR_ARI },
        { kind: "match", match: NFL_GB_PIT },
        { kind: "market", market: NFL_MARKET },
      ]),
    },
    {
      title: "Other Sports",
      href: "/uxr-sport/basketball",
      cards: takeCards([
        { kind: "match", match: NBA_OKC_HOU },
        { kind: "match", match: EPL_ARS_LIV },
        { kind: "match", match: TENNIS },
      ]),
    },
  ];
}
