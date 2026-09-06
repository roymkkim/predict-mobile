import React, { useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { screenTopInset } from "@/lib/sim/layout";

import colors from "@/constants/colors";
import { BackIcon } from "@/components/PageHeader";
import { PulsingDot } from "@/components/PulsingDot";
import { FeedSettingsProvider, type FeedSettings } from "@/lib/sim/FeedSettingsContext";
import { LiveTickProvider } from "@/lib/sim/LiveTickContext";
import { LiveCueColorProvider } from "@/lib/sim/LiveCueColorContext";
import { useMatchLayout } from "@/lib/sim/matchLayoutStore";
import { useTennisHidden } from "@/lib/sim/tennisHiddenStore";
import { useVersusMode } from "@/lib/sim/versusModeStore";
import { useAccentControls } from "@/lib/sim/accentControlsStore";
import { useVersusHeaderAlign } from "@/lib/sim/versusHeaderAlignStore";
import {
  vsMatch,
  binary,
  flag,
  MatchCard,
  BinaryCard,
  type Binary,
} from "@/lib/sim/topicMarkets";
import type { Match } from "@/lib/sim/types";
import { geist } from "@/lib/sim/geistFonts";

const c = colors.light;

// Standalone feed display settings — mirrors the home feed so the shared cards
// render identically here.
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

// ── Wimbledon market data ─────────────────────────────────────────────────────
// Realistic singles draw: live/upcoming men's and women's matches plus
// tournament prop bets, built on the shared vsMatch/binary helpers.

// Alcaraz vs. Sinner shows full tennis detail: the games-per-set boxes (1st set
// won 6-4, 2nd set in progress 1-0) plus the CURRENT game's point score
// (30-15) in the live chip — driven by setScores + scoreText (see useLiveScores).
const ALCARAZ_SINNER = vsMatch({
  league: "Wimbledon · Men's",
  leagueColor: "#2e8b57",
  sport: "tennis",
  home: { name: "Alcaraz", abbr: "ALC", color: "#cf102c", flag: flag("es") },
  away: { name: "Sinner", abbr: "SIN", color: "#1e58cd", flag: flag("it") },
  pct: [54, 46],
  vol: "$2.8M Vol.",
  markets: 8,
  date: "Live",
  live: { mins: "2nd set" },
});
ALCARAZ_SINNER.teams[0].setScores = [6, 1];
ALCARAZ_SINNER.teams[0].scoreText = "30";
ALCARAZ_SINNER.teams[1].setScores = [4, 0];
ALCARAZ_SINNER.teams[1].scoreText = "15";

// Exported for the match-detail REGISTRY + check-market-links validation.
export const WIMBLEDON_GAMES: Match[] = [
  ALCARAZ_SINNER,
  vsMatch({
    league: "Wimbledon · Women's",
    leagueColor: "#7b2d8e",
    sport: "tennis",
    home: { name: "Swiatek", abbr: "SWI", color: "#0c5b3c", flag: flag("pl") },
    away: { name: "Sabalenka", abbr: "SAB", color: "#f7931a", flag: flag("by") },
    pct: [51, 49],
    vol: "$1.9M Vol.",
    markets: 7,
    date: "Live",
    live: { mins: "1st set", score: [0, 0] },
  }),
  vsMatch({
    league: "Wimbledon · Men's",
    leagueColor: "#2e8b57",
    sport: "tennis",
    home: { name: "Djokovic", abbr: "DJO", color: "#1d3a8a", flag: flag("rs") },
    away: { name: "Zverev", abbr: "ZVE", color: "#cf102c", flag: flag("de") },
    pct: [58, 42],
    vol: "$1.4M Vol.",
    markets: 6,
    date: "Today",
    time: "2:00 PM",
  }),
  vsMatch({
    league: "Wimbledon · Women's",
    leagueColor: "#7b2d8e",
    sport: "tennis",
    home: { name: "Gauff", abbr: "GAU", color: "#552583", flag: flag("us") },
    away: { name: "Rybakina", abbr: "RYB", color: "#0e2240", flag: flag("kz") },
    pct: [47, 53],
    vol: "$980K Vol.",
    markets: 6,
    date: "Today",
    time: "4:30 PM",
  }),
  vsMatch({
    league: "Wimbledon · Men's",
    leagueColor: "#2e8b57",
    sport: "tennis",
    home: { name: "Fritz", abbr: "FRI", color: "#cf102c", flag: flag("us") },
    away: { name: "Rune", abbr: "RUN", color: "#c60c30", flag: flag("dk") },
    pct: [49, 51],
    vol: "$620K Vol.",
    markets: 5,
    date: "Tomorrow",
    time: "1:00 PM",
  }),
  vsMatch({
    league: "Wimbledon · Men's",
    leagueColor: "#2e8b57",
    sport: "tennis",
    home: { name: "Musetti", abbr: "MUS", color: "#1e58cd", flag: flag("it") },
    away: { name: "Shelton", abbr: "SHE", color: "#0a2240", flag: flag("us") },
    pct: [44, 56],
    vol: "$410K Vol.",
    markets: 5,
    date: "Tomorrow",
    time: "3:30 PM",
  }),
];

const PROPS: Binary[] = [
  binary({
    title: "Will Carlos Alcaraz win Wimbledon 2026?",
    yes: 34,
    no: 66,
    colors: ["#2e8b57", "#71717a"],
    vol: "$1.6M Vol.",
    date: "Jul 12",
  }),
  binary({
    title: "Will the men's final go to five sets?",
    yes: 41,
    no: 59,
    colors: ["#5b8cff", "#71717a"],
    vol: "$720K Vol.",
    date: "Jul 12",
  }),
  binary({
    title: "Aryna Sabalenka to reach the women's final?",
    yes: 48,
    no: 52,
    colors: ["#f7931a", "#71717a"],
    vol: "$540K Vol.",
    date: "Jul 11",
  }),
  binary({
    title: "Any match with 50+ aces this tournament?",
    yes: 63,
    no: 37,
    colors: ["#7b2d8e", "#71717a"],
    vol: "$910K Vol.",
    date: "Jul 12",
  }),
  binary({
    title: "Will a first-time champion win the women's title?",
    yes: 44,
    no: 56,
    colors: ["#ff5fa2", "#71717a"],
    vol: "$380K Vol.",
    date: "Jul 11",
  }),
  binary({
    title: "Defending men's champion out before the semis?",
    yes: 29,
    no: 71,
    colors: ["#cf102c", "#71717a"],
    vol: "$460K Vol.",
    date: "Jul 9",
  }),
];

type Tab = "games" | "props";

// Cropped court artwork (racket + legs + tennis balls) for the expandable banner.
const WIMBLEDON_BANNER = require("@/assets/figmaAssets/wimbledon-banner.jpg");
const BANNER_AR = 964 / 780;

export default function WimbledonScreen() {
  const tennisHidden = useTennisHidden();
  if (tennisHidden) return <Redirect href="/" />;
  return <WimbledonScreenInner />;
}

function WimbledonScreenInner() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: screenW } = useWindowDimensions();
  const matchLayout = useMatchLayout();
  const versusMode = useVersusMode();
  const accentControls = useAccentControls();
  const versusHeaderAlign = useVersusHeaderAlign();
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(tabParam === "props" ? "props" : "games");

  const settings = React.useMemo<FeedSettings>(
    () => ({ ...FEED_SETTINGS, matchLayout, versusMode, ...accentControls, versusHeaderAlign }),
    [matchLayout, versusMode, accentControls, versusHeaderAlign],
  );

  // Back always returns to the home feed.
  const goHome = React.useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }, [router]);

  // --- Collapsing banner header ---
  // The page opens with the full-bleed court banner expanded by default. The
  // banner collapses as the list scrolls, and tapping the banner title collapses
  // it to a minimal centered-title nav bar ("compact"); tapping that title
  // re-expands it. Local state, so it resets on navigation / reload.
  const [expanded, setExpanded] = React.useState(true);
  const isCompact = !expanded;
  const isBanner = expanded;
  const topInset = screenTopInset(insets.top);
  const bannerFullHeight = screenW / BANNER_AR;
  const [titleH, setTitleH] = React.useState(64);
  const collapsedTitleTop = topInset + 8 + 40 + 16;
  const collapsedHeight = collapsedTitleTop + titleH + 16;
  const maxTranslate = Math.max(0, bannerFullHeight - collapsedHeight);
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const scrollRef = React.useRef<any>(null);
  // Always expand from a fully-extended banner: if the list was scrolled while
  // compact, reset scroll to the top before showing the banner so it never opens
  // partially collapsed.
  const expand = React.useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    scrollY.setValue(0);
    setExpanded(true);
  }, [scrollY]);
  const bannerTranslate = scrollY.interpolate({
    inputRange: [0, maxTranslate || 1],
    outputRange: [0, -(maxTranslate || 1)],
    extrapolate: "clamp",
  });
  // The artwork rests already zoomed in (1.32) and is bottom-anchored
  // (transformOrigin 62% 100%) so its bottom edge stays flush with the container
  // bottom; it zooms a bit further as the header collapses, growing upward only.
  const bannerScale = scrollY.interpolate({
    inputRange: [0, maxTranslate || 1],
    outputRange: [1.32, 1.55],
    extrapolate: "clamp",
  });
  // Games/Props chip bar pins just below the collapsed banner.
  const chipBarHeight = 72;
  const chipRestTop = bannerFullHeight + 4;
  const chipPinStart = Math.max(0, chipRestTop - collapsedHeight);
  const chipTranslate = scrollY.interpolate({
    inputRange: [0, chipPinStart || 1],
    outputRange: [chipPinStart || 1, 0],
    extrapolate: "clamp",
  });

  const body =
    tab === "games"
      ? WIMBLEDON_GAMES.map((m, i) => (
          <View key={`game-${i}`} style={styles.cardWrap}>
            <MatchCard m={m} layout={matchLayout} />
          </View>
        ))
      : PROPS.map((b, i) => (
          <View key={`prop-${i}`} style={styles.cardWrap}>
            <BinaryCard item={b} />
          </View>
        ));

  const chipRow = (
    <View style={styles.chips}>
      {(["games", "props"] as const).map((t) => {
        const active = tab === t;
        return (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.chip, active && styles.chipActive]}
          >
            {t === "games" ? <PulsingDot size={6} color={c.green} /> : null}
            <Text style={[styles.chipText, active && { color: "#000" }]}>
              {t === "games" ? "Games" : "Props"}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: isBanner ? 0 : topInset }]}>
      {isCompact && (
        <View style={styles.compactBar}>
          <Pressable style={styles.compactSide} onPress={goHome} hitSlop={8}>
            <BackIcon size={24} color="#fff" />
          </Pressable>
          <Pressable onPress={expand} hitSlop={8}>
            <Text style={styles.compactTitle}>Wimbledon</Text>
          </Pressable>
          <View style={styles.compactSide} />
        </View>
      )}
      {!isBanner && <View style={styles.chipWrap}>{chipRow}</View>}

      <FeedSettingsProvider value={settings}>
        <LiveTickProvider>
          <LiveCueColorProvider cue="green">
            <Animated.ScrollView
              ref={scrollRef}
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
              scrollEventThrottle={16}
              onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
                useNativeDriver: true,
              })}
            >
              <View
                style={{ gap: 12, paddingTop: isBanner ? chipRestTop + chipBarHeight : 0 }}
              >
                {body}
              </View>
            </Animated.ScrollView>
          </LiveCueColorProvider>
        </LiveTickProvider>
      </FeedSettingsProvider>

      {isBanner && (
        <>
          <Animated.View
            style={[
              styles.chipBar,
              { top: collapsedHeight, height: chipBarHeight, transform: [{ translateY: chipTranslate }] },
            ]}
          >
            {chipRow}
          </Animated.View>
          <Animated.View
            pointerEvents="box-none"
            style={[
              styles.bannerOverlay,
              { height: bannerFullHeight, transform: [{ translateY: bannerTranslate }] },
            ]}
          >
            <Animated.Image
              source={WIMBLEDON_BANNER}
              style={{
                width: screenW,
                height: bannerFullHeight,
                transformOrigin: "62% 100%",
                transform: [{ scale: bannerScale }],
              }}
              resizeMode="cover"
            />
            <Pressable
              style={styles.bannerTitleWrap}
              onLayout={(e) => setTitleH(e.nativeEvent.layout.height)}
              onPress={() => setExpanded(false)}
            >
              <Text style={styles.bannerTitle}>Wimbledon 2026</Text>
            </Pressable>
          </Animated.View>
          <Pressable style={[styles.bannerBack, { top: topInset + 8 }]} onPress={goHome} hitSlop={8}>
            <BackIcon size={24} color="#fff" />
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  cardWrap: { paddingHorizontal: 16 },
  chipWrap: { paddingBottom: 16, backgroundColor: c.bg, zIndex: 1 },
  chips: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 12,
    backgroundColor: c.surface,
  },
  chipActive: { backgroundColor: "#fff" },
  chipText: {
    color: "#fff",
    fontFamily: geist.medium,
    fontSize: 14,
    lineHeight: 22,
  },
  compactBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12 + (Platform.OS === "web" ? 56 : 0),
    paddingBottom: 16,
  },
  compactSide: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  compactTitle: { color: "#fff", fontFamily: geist.semibold, fontSize: 16 },
  chipBar: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: c.bg,
    paddingVertical: 16,
  },
  bannerOverlay: { position: "absolute", top: 0, left: 0, right: 0, overflow: "hidden" },
  bannerTitleWrap: { position: "absolute", left: 16, bottom: 16 },
  bannerTitle: {
    fontFamily: geist.semibold,
    fontSize: 24,
    lineHeight: 32,
    color: "#fff",
  },
  bannerBack: {
    position: "absolute",
    left: 12,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
