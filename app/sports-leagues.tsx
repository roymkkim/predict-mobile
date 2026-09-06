import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";

import { PageHeader } from "@/components/PageHeader";
import { StandardCard } from "@/components/sim/StandardCard";
import { VersusCard } from "@/components/sim/VersusCard";
import { colors } from "@/lib/sim/colors";
import {
  NBA,
  NHL,
  SOCCER,
  SOCCER_BRA_ARG,
  SPURS_KNICKS,
  TENNIS,
} from "@/lib/sim/data";
import type { Match, Team } from "@/lib/sim/types";
import { FeedSettingsProvider, type FeedSettings } from "@/lib/sim/FeedSettingsContext";
import { LiveTickProvider } from "@/lib/sim/LiveTickContext";
import { LiveCueColorProvider } from "@/lib/sim/LiveCueColorContext";
import { useMatchLayout } from "@/lib/sim/matchLayoutStore";
import { useTennisHidden } from "@/lib/sim/tennisHiddenStore";
import { useVersusMode } from "@/lib/sim/versusModeStore";
import { useAccentControls } from "@/lib/sim/accentControlsStore";
import { useVersusHeaderAlign } from "@/lib/sim/versusHeaderAlignStore";
import { useThemeMode } from "@/lib/sim/dsModeStore";
import { geist } from "@/lib/sim/geistFonts";

type Glyph = { mi: keyof typeof MaterialIcons.glyphMap } | { flag: string };
type League = { label: string; glyph: Glyph };

const LEAGUES: League[] = [
  { label: "World Cup", glyph: { mi: "sports-soccer" } },
  { label: "Serie A", glyph: { flag: "it" } },
  { label: "Premier League", glyph: { flag: "gb-eng" } },
  { label: "NBA", glyph: { mi: "sports-basketball" } },
  { label: "NHL", glyph: { mi: "sports-hockey" } },
  { label: "Euroleague", glyph: { mi: "sports-basketball" } },
  { label: "Argentina Serie A", glyph: { flag: "ar" } },
  { label: "Ligue 1", glyph: { flag: "fr" } },
  { label: "CBA", glyph: { flag: "cn" } },
  { label: "Japan B League", glyph: { flag: "jp" } },
  { label: "LNB", glyph: { flag: "ar" } },
  { label: "Greek Basketball", glyph: { flag: "gr" } },
  { label: "KHL", glyph: { flag: "ru" } },
  { label: "SHL", glyph: { flag: "se" } },
];

// Feed display settings for the shared sim cards — mirrors the home feed's
// defaults so VersusCard/StandardCard render identically here.
const FEED_SETTINGS: FeedSettings = {
  density: "comfort",
  showFooter: true,
  footerDetail: { metadata: true, volume: true, endDate: false, outcomes: true },
  versusLayout: "sides",
  versusMode: "new",
  versusAccent: "corner",
  versusHeaderAlign: "center",
  versusVersion: "a",
  versusUpcoming: true,
  standardAccent: "corner",
  centerAccentWidth: "default",
  accentOpacity: 0.54,
  oddsUnit: "cents",
  matchLayout: "mixed",
  scoreGlow: false,
  scoreGlowMode: "inPlace",
  scorerCallout: false,
  innerGlow: true,
  whiteBars: false,
  barTrack: false,
  heroSection: "none",
  sections: {
    trending: { enabled: true, count: 5 },
    sports: { enabled: true, count: 4 },
    crypto: { enabled: true, count: 4 },
    politics: { enabled: true, count: 4 },
  },
  popularPlacement: "inTrending",
  popularRows: 1,
  cardStyle: "card",
  showClaim: false,
  showPositionBanner: false,
  positionBannerPlacement: "carousel",
  showLiveGames: false,
  showActivePositions: false,
  showBtcUpDown: false,
  showTeamAvatars: true,
  standardDateInFooter: true,
  teamAvatars: "logo",
  possessionScope: "none",
  openSettings: () => {},
};

// Small factory for upcoming (non-live) fixtures: a head-to-head market with a
// kickoff date/time and no scores. Soccer sides carry a flag; others fall back
// to a colored initial avatar.
type UpcomingTeam = { name: string; abbr: string; color: string; flag?: string };
type UpcomingSpec = {
  league: string;
  leagueColor: string;
  sport: string;
  home: UpcomingTeam;
  away: UpcomingTeam;
  pct: [number, number];
  draw?: number;
  vol: string;
  markets: number;
  date: string;
  time: string;
};

function upcomingMatch(s: UpcomingSpec): Match {
  const mk = (t: UpcomingTeam, pct: number): Team => ({
    name: t.name,
    pct: `${pct}%`,
    color: t.color,
    initial: t.abbr[0],
    abbr: t.abbr,
    ...(t.flag ? { flag: t.flag } : {}),
  });
  return {
    league: s.league,
    leagueColor: s.leagueColor,
    sport: s.sport,
    teams: [mk(s.home, s.pct[0]), mk(s.away, s.pct[1])],
    ...(s.draw != null ? { draw: { pct: `${s.draw}%` } } : {}),
    vol: s.vol,
    date: s.date,
    time: s.time,
    markets: s.markets,
  };
}

// Live games shown up top — reuse the curated live match slate.
const LIVE_GAMES: Match[] = [SOCCER, NBA, TENNIS, SOCCER_BRA_ARG, NHL, SPURS_KNICKS];

// Upcoming fixtures shown below the live list.
// Exported for the match-detail REGISTRY + check-market-links validation.
export const UPCOMING_GAMES: Match[] = [
  upcomingMatch({
    league: "Premier League",
    leagueColor: "#3d195b",
    sport: "soccer",
    home: { name: "Arsenal", abbr: "ARS", color: "#ef0107", flag: "gb-eng" },
    away: { name: "Chelsea", abbr: "CHE", color: "#034694", flag: "gb-eng" },
    pct: [46, 31],
    draw: 23,
    vol: "$1.2M Vol.",
    markets: 10,
    date: "Jun 24",
    time: "12:30 PM",
  }),
  upcomingMatch({
    league: "NBA",
    leagueColor: "#c8102e",
    sport: "basketball",
    home: { name: "Warriors", abbr: "GSW", color: "#1d428a" },
    away: { name: "Suns", abbr: "PHX", color: "#e56020" },
    pct: [57, 43],
    vol: "$2.0M Vol.",
    markets: 8,
    date: "Jun 24",
    time: "8:00 PM",
  }),
  upcomingMatch({
    league: "Serie A",
    leagueColor: "#0b6cb7",
    sport: "soccer",
    home: { name: "Inter", abbr: "INT", color: "#0068a8", flag: "it" },
    away: { name: "Juventus", abbr: "JUV", color: "#000000", flag: "it" },
    pct: [44, 33],
    draw: 23,
    vol: "$890K Vol.",
    markets: 9,
    date: "Jun 25",
    time: "2:45 PM",
  }),
  upcomingMatch({
    league: "NHL",
    leagueColor: "#111111",
    sport: "hockey",
    home: { name: "Rangers", abbr: "NYR", color: "#0038a8" },
    away: { name: "Bruins", abbr: "BOS", color: "#fcb514" },
    pct: [52, 48],
    vol: "$640K Vol.",
    markets: 7,
    date: "Jun 25",
    time: "7:00 PM",
  }),
  upcomingMatch({
    league: "Ligue 1",
    leagueColor: "#091c3e",
    sport: "soccer",
    home: { name: "PSG", abbr: "PSG", color: "#004170", flag: "fr" },
    away: { name: "Marseille", abbr: "OM", color: "#2faee0", flag: "fr" },
    pct: [61, 18],
    draw: 21,
    vol: "$1.1M Vol.",
    markets: 11,
    date: "Jun 26",
    time: "3:00 PM",
  }),
];

function LeagueIcon({ glyph }: { glyph: Glyph }) {
  if ("flag" in glyph) {
    return (
      <Image
        source={{ uri: `https://flagcdn.com/w80/${glyph.flag}.png` }}
        style={{ width: 24, height: 24, borderRadius: 6 }}
        resizeMode="cover"
      />
    );
  }
  return <MaterialIcons name={glyph.mi} size={20} color={colors.textPrimary} />;
}

// Renders one match in the shared sim card: "standard" stacks the outcome rows,
// while "versus" and "mixed" use the head-to-head VersusCard. Live matches
// animate their border.
function MatchCard({ m, layout }: { m: Match; layout: "versus" | "standard" | "mixed" }) {
  // Tennis never uses the head-to-head VersusCard format — always the
  // stacked-row StandardCard regardless of the layout toggle.
  if (layout === "standard" || m.sport === "tennis") {
    return (
      <StandardCard
        match={m}
        live={!!m.live}
        score="aside"
        display="avatar"
        title="show"
        possession="icon"
        asideCue="score"
        buttons="simple"
        buttonSize="md"
        buttonText="gray-colored"
        buttonStyle="default"
        buttonAnim="slot"
        metaStyle="filled"
        metaPlacement="bottom"
        cardPadding="12"
        animate={!!m.live}
        animStyle="border"
      />
    );
  }
  return (
    <VersusCard
      match={m}
      live={!!m.live}
      display="avatar"
      layout="sides"
      buttonText="gray-colored"
      buttonSize="md"
      buttonStyle="default"
      buttonAnim="slot"
      metaStyle="filled"
      metaPlacement="bottom"
      cardPadding="12"
      title="show"
      sidesLive="center"
      possession="icon"
      animate={!!m.live}
      animStyle="border"
    />
  );
}

export default function SportsLeaguesScreen() {
  const router = useRouter();
  useThemeMode();
  const insets = useSafeAreaInsets();
  const matchLayout = useMatchLayout();
  const versusMode = useVersusMode();
  const accentControls = useAccentControls();
  const versusHeaderAlign = useVersusHeaderAlign();
  const tennisHidden = useTennisHidden();
  const liveGames = tennisHidden ? LIVE_GAMES.filter((m) => m.sport !== "tennis") : LIVE_GAMES;
  const settings = React.useMemo<FeedSettings>(
    () => ({ ...FEED_SETTINGS, matchLayout, versusMode, ...accentControls, versusHeaderAlign }),
    [matchLayout, versusMode, accentControls, versusHeaderAlign],
  );

  const open = (league: League) =>
    router.push(
      (league.label === "World Cup"
        ? "/worldcup"
        : `/league/${encodeURIComponent(league.label)}`) as never,
    );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <PageHeader title="Sports" />
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Pressable
          onPress={() => router.push("/browse-leagues" as never)}
          hitSlop={8}
          style={{ paddingLeft: 16, paddingRight: 12, height: 40, justifyContent: "center" }}
        >
          <MaterialCommunityIcons name="sort-variant" size={22} color={colors.textPrimary} />
        </Pressable>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 16, gap: 8, alignItems: "center" }}
          style={{ flex: 1 }}
        >
          {LEAGUES.map((league, i) => (
          <Pressable
            key={`${league.label}-${i}`}
            onPress={() => open(league)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              height: 40,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: colors.surface,
            }}
          >
            <LeagueIcon glyph={league.glyph} />
            <Text style={{ fontFamily: geist.medium, fontSize: 14, lineHeight: 22, color: colors.textPrimary }}>
              {league.label}
            </Text>
          </Pressable>
          ))}
        </ScrollView>
      </View>

      <FeedSettingsProvider value={settings}>
        <LiveTickProvider>
          <LiveCueColorProvider cue="green">
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 24, gap: 12 }}
              showsVerticalScrollIndicator={false}
            >
               <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>Live</Text>
              {liveGames.map((m, i) => (
                <View key={`live-${i}`} style={{ paddingHorizontal: 16 }}>
                  <MatchCard m={m} layout={matchLayout} />
                </View>
              ))}

               <Text style={[styles.sectionHeader, { paddingTop: 8, color: colors.textPrimary }]}>Upcoming</Text>
              {UPCOMING_GAMES.map((m, i) => (
                <View key={`upcoming-${i}`} style={{ paddingHorizontal: 16 }}>
                  <MatchCard m={m} layout={matchLayout} />
                </View>
              ))}
            </ScrollView>
          </LiveCueColorProvider>
        </LiveTickProvider>
      </FeedSettingsProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    fontFamily: geist.semibold,
    fontSize: 18,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
});
