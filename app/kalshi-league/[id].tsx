import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { colors } from "@/lib/sim/colors";
import type { Match } from "@/lib/sim/types";
import { PageHeader } from "@/components/PageHeader";
import {
  leagueGames,
  leagueProps,
  sportBySlug,
  UxrCardProviders,
  UxrGameGroups,
  UxrPageScroll,
  UxrPropsList,
  type GameGroup,
} from "@/components/sim/UxrBrowse";
import { KalshiTabs } from "@/components/sim/KalshiIA";
import { type Binary } from "@/lib/sim/topicMarkets";

// ── Kalshi IA: league page ───────────────────────────────────────────────────
// Kalshi's league-screen structure (GAMES / FUTURES / LEAGUE LEADER / NEXT
// CLUB text tabs, date-grouped games) rendered with the app's own visual
// system: shared dynamic PageHeader, tab nav below it, and the existing
// home-feed cards (via UxrCardProviders).

type Tab = "games" | "futures" | "leader" | "next";
const TABS: { key: Tab; label: string }[] = [
  { key: "games", label: "Games" },
  { key: "futures", label: "Futures" },
  { key: "leader", label: "League Leader" },
  { key: "next", label: "Next Club" },
];

// Award + player fixtures per sport for the LEAGUE LEADER / NEXT CLUB tabs
// (Kalshi lists player markets; rendered as standard outcome cards here).
const LEADER: Record<string, { award: string; players: [string, string]; pcts: [number, number] }> = {
  soccer: { award: "Golden Boot", players: ["Denis Bouanga", "Robert Lewandowski"], pcts: [38, 29] },
  football: { award: "MVP", players: ["Patrick Mahomes", "Josh Allen"], pcts: [34, 27] },
  basketball: { award: "MVP", players: ["Nikola Jokic", "Shai Gilgeous-Alexander"], pcts: [41, 33] },
  baseball: { award: "Home Run Leader", players: ["Aaron Judge", "Shohei Ohtani"], pcts: [44, 36] },
  hockey: { award: "Art Ross Trophy", players: ["Connor McDavid", "Nathan MacKinnon"], pcts: [47, 24] },
};
const NEXT_CLUB: Record<string, { player: string; clubs: [string, string]; pcts: [number, number] }> = {
  soccer: { player: "Son Heung-min", clubs: ["LAFC", "Stays at current club"], pcts: [56, 44] },
  football: { player: "Aaron Rodgers", clubs: ["Steelers", "Retires"], pcts: [61, 39] },
  basketball: { player: "LeBron James", clubs: ["Lakers", "Any other team"], pcts: [72, 28] },
};

const outcomeBinary = (title: string, labels: [string, string], pcts: [number, number], league: string): Binary => ({
  title,
  match: {
    league,
    leagueColor: "#5b8cff",
    teams: [
      { name: labels[0], pct: `${pcts[0]}%`, color: "#5b8cff", initial: labels[0][0] },
      { name: labels[1], pct: `${pcts[1]}%`, color: "#71717a", initial: labels[1][0] },
    ],
    vol: "$84K Vol.",
    date: "Dec 31",
    markets: 0,
  },
});

export default function KalshiLeaguePage() {
  const { id, sport: sportParam } = useLocalSearchParams<{ id: string; sport?: string }>();
  const league = decodeURIComponent(String(id ?? ""));
  const sport = sportBySlug(String(sportParam ?? ""));
  const [tab, setTab] = useState<Tab>("games");

  const gameGroups = useMemo<GameGroup[]>(() => {
    // League fixtures fall back to the parent sport's games — dedupe by
    // identity so merged fallbacks never repeat.
    const seen = new Set<Match>();
    const all = leagueGames(league)
      .flatMap((g) => g.matches)
      .filter((m) => (seen.has(m) ? false : (seen.add(m), true)));
    const live = all.filter((m) => m.live);
    const byDate = new Map<string, Match[]>();
    all.filter((m) => !m.live).forEach((m) => byDate.set(m.date, [...(byDate.get(m.date) ?? []), m]));
    return [
      ...(live.length ? [{ title: "Happening now", matches: live }] : []),
      ...[...byDate.entries()].map(([title, matches]) => ({ title, matches })),
    ];
  }, [league]);

  const props = useMemo(() => leagueProps(league), [league]);
  const slug = sport?.slug ?? "soccer";
  const leader = LEADER[slug];
  const nextClub = NEXT_CLUB[slug];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <PageHeader title={league} />
      <KalshiTabs tabs={TABS} active={tab} onChange={setTab} />
      <UxrPageScroll>
        <UxrCardProviders>
          {tab === "games" && <UxrGameGroups groups={gameGroups} />}
          {tab === "futures" && <UxrPropsList props={props} />}
          {tab === "leader" && (
            <UxrPropsList
              props={leader ? [outcomeBinary(`${league} ${leader.award}`, leader.players, leader.pcts, league)] : []}
            />
          )}
          {tab === "next" && (
            <UxrPropsList
              props={
                nextClub
                  ? [outcomeBinary(`${nextClub.player}: Next Club`, nextClub.clubs, nextClub.pcts, league)]
                  : []
              }
            />
          )}
        </UxrCardProviders>
      </UxrPageScroll>
    </View>
  );
}
