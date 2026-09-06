import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PageHeader } from "@/components/PageHeader";
import { StandardCard } from "@/components/sim/StandardCard";
import { VersusCard } from "@/components/sim/VersusCard";
import { FeedSettingsProvider, type FeedSettings } from "@/lib/sim/FeedSettingsContext";
import { LiveTickProvider } from "@/lib/sim/LiveTickContext";
import { LiveCueColorProvider } from "@/lib/sim/LiveCueColorContext";
import { useMatchLayout } from "@/lib/sim/matchLayoutStore";
import { useVersusMode } from "@/lib/sim/versusModeStore";
import { useAccentControls } from "@/lib/sim/accentControlsStore";
import { useVersusHeaderAlign } from "@/lib/sim/versusHeaderAlignStore";
import { useThemeMode } from "@/lib/sim/dsModeStore";
import { useUxrMode } from "@/lib/sim/uxrModeStore";
import { colors as simColors, FILTER_CHIP_ACTIVE_BG, FILTER_CHIP_INACTIVE_TEXT } from "@/lib/sim/colors";
import type { Match, Team } from "@/lib/sim/types";
import { geist } from "@/lib/sim/geistFonts";

const c = simColors;

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
  // Match the current live-stamp component: "LIVE" on the first row, the
  // period/game detail (e.g. "Game 2") on the second.
  liveFormat: "stacked",
  scoreGlow: false,
  scoreGlowMode: "inPlace",
  scorerCallout: false,
  innerGlow: true,
  whiteBars: false,
  barTrack: false,
  heroSection: "carousel",
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

// ── Match data ───────────────────────────────────────────────────────────────

type Side = { name: string; abbr?: string; color: string };
type VsSpec = {
  league: string;
  leagueColor?: string;
  sport?: string;
  home: Side;
  away: Side;
  pct: [number, number];
  vol: string;
  markets: number;
  date: string;
  time?: string;
  live?: { mins: string; score?: [number, number] };
};

function vsMatch(s: VsSpec): Match {
  const mk = (t: Side, pct: number, score?: number): Team => ({
    name: t.name,
    pct: `${pct}%`,
    color: t.color,
    initial: (t.abbr ?? t.name)[0]!.toUpperCase(),
    ...(t.abbr ? { abbr: t.abbr } : {}),
    ...(score != null ? { score } : {}),
  });
  return {
    league: s.league,
    ...(s.leagueColor ? { leagueColor: s.leagueColor } : {}),
    ...(s.sport ? { sport: s.sport } : {}),
    ...(s.live ? { live: { mins: s.live.mins } } : {}),
    teams: [mk(s.home, s.pct[0], s.live?.score?.[0]), mk(s.away, s.pct[1], s.live?.score?.[1])],
    vol: s.vol,
    date: s.date,
    ...(s.time ? { time: s.time } : {}),
    markets: s.markets,
  };
}

type TabKey = "cs2" | "lol" | "dota2" | "valorant";
const TABS: { key: TabKey; label: string }[] = [
  { key: "cs2", label: "CS2" },
  { key: "lol", label: "League of Legends" },
  { key: "dota2", label: "Dota 2" },
  { key: "valorant", label: "Valorant" },
];

// Flat list for hosts that fold e-sports into an in-place tab (single-nav
// Trending) instead of pushing this nested page.
export function allEsportsGames(): Match[] {
  return TABS.flatMap((t) => GAMES[t.key]);
}

const GAMES: Record<TabKey, Match[]> = {
  cs2: [
    vsMatch({ league: "BLAST Premier", leagueColor: "#f59e0b", sport: "esports", home: { name: "FaZe", abbr: "FAZE", color: "#e43d30" }, away: { name: "NAVI", abbr: "NAVI", color: "#ffea00" }, pct: [48, 52], vol: "$420K Vol.", markets: 6, date: "Live", live: { mins: "Map 2 · 12-9", score: [1, 1] } }),
    vsMatch({ league: "BLAST Premier", leagueColor: "#f59e0b", sport: "esports", home: { name: "Vitality", abbr: "VIT", color: "#fde047" }, away: { name: "G2", abbr: "G2", color: "#e11d2b" }, pct: [57, 43], vol: "$310K Vol.", markets: 5, date: "Tonight", time: "8:00 PM" }),
    vsMatch({ league: "BLAST Premier", leagueColor: "#f59e0b", sport: "esports", home: { name: "Spirit", abbr: "SPR", color: "#1e3a8a" }, away: { name: "MOUZ", abbr: "MOUZ", color: "#e11d48" }, pct: [51, 49], vol: "$190K Vol.", markets: 4, date: "Tomorrow", time: "11:00 AM" }),
  ],
  lol: [
    vsMatch({ league: "LoL Worlds", leagueColor: "#06b6d4", sport: "esports", home: { name: "T1", abbr: "T1", color: "#e2012d" }, away: { name: "Gen.G", abbr: "GEN", color: "#aa8a00" }, pct: [55, 45], vol: "$680K Vol.", markets: 7, date: "Live", live: { mins: "Game 3", score: [1, 1] } }),
    vsMatch({ league: "LoL Worlds", leagueColor: "#06b6d4", sport: "esports", home: { name: "JDG", abbr: "JDG", color: "#c8102e" }, away: { name: "BLG", abbr: "BLG", color: "#1d4ed8" }, pct: [49, 51], vol: "$430K Vol.", markets: 6, date: "Tomorrow", time: "5:00 AM" }),
    vsMatch({ league: "LoL Worlds", leagueColor: "#06b6d4", sport: "esports", home: { name: "G2", abbr: "G2", color: "#e11d2b" }, away: { name: "Fnatic", abbr: "FNC", color: "#ff5500" }, pct: [62, 38], vol: "$220K Vol.", markets: 5, date: "Sat", time: "9:00 AM" }),
  ],
  dota2: [
    vsMatch({ league: "The International", leagueColor: "#dc2626", sport: "esports", home: { name: "Team Spirit", abbr: "TS", color: "#1e3a8a" }, away: { name: "Gaimin", abbr: "GG", color: "#16a34a" }, pct: [53, 47], vol: "$540K Vol.", markets: 6, date: "Live", live: { mins: "Game 2", score: [1, 0] } }),
    vsMatch({ league: "The International", leagueColor: "#dc2626", sport: "esports", home: { name: "Liquid", abbr: "TL", color: "#1d4ed8" }, away: { name: "LGD", abbr: "LGD", color: "#b91c1c" }, pct: [46, 54], vol: "$300K Vol.", markets: 5, date: "Tomorrow", time: "6:00 AM" }),
    vsMatch({ league: "The International", leagueColor: "#dc2626", sport: "esports", home: { name: "Falcons", abbr: "FLC", color: "#0ea5e9" }, away: { name: "BetBoom", abbr: "BB", color: "#f59e0b" }, pct: [58, 42], vol: "$170K Vol.", markets: 4, date: "Sun", time: "7:00 AM" }),
  ],
  valorant: [
    vsMatch({ league: "VCT Champions", leagueColor: "#ef4444", sport: "esports", home: { name: "Sentinels", abbr: "SEN", color: "#b91c1c" }, away: { name: "Fnatic", abbr: "FNC", color: "#ff5500" }, pct: [50, 50], vol: "$390K Vol.", markets: 6, date: "Live", live: { mins: "Map 2 · 7-5", score: [1, 0] } }),
    vsMatch({ league: "VCT Champions", leagueColor: "#ef4444", sport: "esports", home: { name: "Paper Rex", abbr: "PRX", color: "#ec4899" }, away: { name: "DRX", abbr: "DRX", color: "#1e40af" }, pct: [54, 46], vol: "$260K Vol.", markets: 5, date: "Tonight", time: "9:30 PM" }),
    vsMatch({ league: "VCT Champions", leagueColor: "#ef4444", sport: "esports", home: { name: "LOUD", abbr: "LLL", color: "#16a34a" }, away: { name: "EG", abbr: "EG", color: "#2563eb" }, pct: [47, 53], vol: "$150K Vol.", markets: 4, date: "Tomorrow", time: "3:00 PM" }),
  ],
};

function MatchCard({ m, layout }: { m: Match; layout: "versus" | "standard" | "mixed" }) {
  if (layout === "standard") {
    return (
      <StandardCard
        match={m}
        live={!!m.live}
        score="aside"
        display="avatar"
        title="show"
        possession="none"
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
      possession="none"
      animate={!!m.live}
      animStyle="border"
    />
  );
}

export default function EsportsScreen() {
  const insets = useSafeAreaInsets();
  useThemeMode();
  useUxrMode();
  const matchLayout = useMatchLayout();
  const versusMode = useVersusMode();
  const accentControls = useAccentControls();
  const versusHeaderAlign = useVersusHeaderAlign();
  const [activeTab, setActiveTab] = React.useState<TabKey>("cs2");

  const settings = React.useMemo<FeedSettings>(() => ({ ...FEED_SETTINGS, matchLayout, versusMode, ...accentControls, versusHeaderAlign }), [matchLayout, versusMode, accentControls, versusHeaderAlign]);

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <PageHeader title="E-sports" showSearch />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
        style={styles.chipScroll}
      >
        {TABS.map((t) => {
          const active = t.key === activeTab;
          return (
            <Pressable
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              style={[styles.chip, active && styles.chipActive]}
              hitSlop={6}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FeedSettingsProvider value={settings}>
        <LiveTickProvider>
          <LiveCueColorProvider cue="green">
            <ScrollView
              style={{ flex: 1, minHeight: 0 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
            >
              <View style={{ gap: 12 }}>
                {GAMES[activeTab].map((m, i) => (
                  <View key={`${activeTab}-${i}`} style={styles.cardWrap}>
                    <MatchCard m={m} layout={matchLayout} />
                  </View>
                ))}
              </View>
            </ScrollView>
          </LiveCueColorProvider>
        </LiveTickProvider>
      </FeedSettingsProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  chipScroll: { flexGrow: 0, flexShrink: 0 },
  filterScroll: { paddingHorizontal: 16, paddingVertical: 6, gap: 8, alignItems: "center" },
  chip: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  chipActive: { backgroundColor: FILTER_CHIP_ACTIVE_BG },
  chipText: { color: FILTER_CHIP_INACTIVE_TEXT, fontFamily: geist.medium, fontSize: 14, lineHeight: 22 },
  chipTextActive: { color: simColors.textPrimary },
  cardWrap: { paddingHorizontal: 16 },
});
