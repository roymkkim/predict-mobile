import React, { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { colors } from "@/lib/sim/colors";
import type { Match } from "@/lib/sim/types";
import { PageHeader } from "@/components/PageHeader";
import {
  sportBySlug,
  UxrCardProviders,
  UxrGameGroups,
  UxrPageScroll,
  UxrPropsList,
  type GameGroup,
} from "@/components/sim/UxrBrowse";
import { KalshiLeagueRow, KalshiSectionTitle, KalshiTabs } from "@/components/sim/KalshiIA";
import { geist } from "@/lib/sim/geistFonts";

// ── Kalshi IA: sport page ────────────────────────────────────────────────────
// Kalshi's sport-screen structure (GAMES / LEAGUES / TO ADVANCE / FUTURES text
// tabs, "Happening now" + date groups, Featured/More Leagues) rendered with
// the app's own visual system: the shared dynamic PageHeader on top, the tab
// nav below it, and the existing home-feed cards (via UxrCardProviders).

type Tab = "games" | "leagues" | "advance" | "futures";
const TABS: { key: Tab; label: string }[] = [
  { key: "games", label: "Games" },
  { key: "leagues", label: "Leagues" },
  { key: "advance", label: "To Advance" },
  { key: "futures", label: "Futures" },
];

export default function KalshiSportPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("games");
  const sport = sportBySlug(String(slug ?? ""));

  const { gameGroups, advanceGroups } = useMemo(() => {
    const all: Match[] = (sport?.games ?? []).flatMap((g) => g.matches);
    const live = all.filter((m) => m.live);
    const upcoming = all.filter((m) => !m.live);
    // Kalshi groups upcoming games under bare date headers ("Aug 19").
    const byDate = new Map<string, Match[]>();
    upcoming.forEach((m) => byDate.set(m.date, [...(byDate.get(m.date) ?? []), m]));
    const groups: GameGroup[] = [
      ...(live.length ? [{ title: "Happening now", matches: live }] : []),
      ...[...byDate.entries()].map(([title, matches]) => ({ title, matches })),
    ];
    return {
      gameGroups: groups,
      advanceGroups: all.length ? [{ title: "To advance", matches: all.slice(0, 3) }] : [],
    };
  }, [sport]);

  if (!sport) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <PageHeader title="Sport" />
        <Text style={{ fontFamily: geist.medium, fontSize: 14, color: colors.textMuted, textAlign: "center", paddingTop: 32 }}>
          Nothing here yet
        </Text>
      </View>
    );
  }

  const featured = sport.leagues.slice(0, 5);
  const more = sport.leagues.slice(5);
  const leagueHref = (name: string) =>
    `/kalshi-league/${encodeURIComponent(name)}?sport=${encodeURIComponent(sport.slug)}`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <PageHeader title={sport.label} />
      <KalshiTabs tabs={TABS} active={tab} onChange={setTab} />
      <UxrPageScroll>
        {tab === "games" && (
          <UxrCardProviders>
            <UxrGameGroups groups={gameGroups} />
          </UxrCardProviders>
        )}

        {tab === "leagues" && (
          <View style={{ gap: 8 }}>
            <KalshiSectionTitle title="Featured" />
            <View style={{ paddingHorizontal: 16 }}>
              {featured.map((l, i) => (
                <KalshiLeagueRow
                  key={l.name}
                  name={l.name}
                  count={l.count}
                  last={i === featured.length - 1 && more.length === 0}
                  onPress={() => router.push(leagueHref(l.name) as never)}
                />
              ))}
            </View>
            {more.length > 0 && (
              <>
                <View style={{ height: 12 }} />
                <KalshiSectionTitle title="More Leagues" />
                <View style={{ paddingHorizontal: 16 }}>
                  {more.map((l, i) => (
                    <KalshiLeagueRow
                      key={l.name}
                      name={l.name}
                      count={l.count}
                      last={i === more.length - 1}
                      onPress={() => router.push(leagueHref(l.name) as never)}
                    />
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {tab === "advance" && (
          <UxrCardProviders>
            <UxrGameGroups groups={advanceGroups} />
          </UxrCardProviders>
        )}

        {tab === "futures" && (
          <UxrCardProviders>
            <UxrPropsList props={sport.props} />
          </UxrCardProviders>
        )}
      </UxrPageScroll>
    </View>
  );
}
