import React from "react";
import {
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { screenTopInset } from "@/lib/sim/layout";
import { useRouter } from "expo-router";

import colors from "@/constants/colors";
import { PageHeader, BackIcon, SearchIcon } from "@/components/PageHeader";
import { SectionHeader } from "@/components/sim/FeedChrome";
import { StandardCard } from "@/components/sim/StandardCard";
import { LiveDot } from "@/components/sim/Crest";
import { VersusCard } from "@/components/sim/VersusCard";
import { FeedSettingsProvider, type FeedSettings } from "@/lib/sim/FeedSettingsContext";
import { LiveTickProvider } from "@/lib/sim/LiveTickContext";
import { LiveCueColorProvider } from "@/lib/sim/LiveCueColorContext";
import { ScrollRevealProvider } from "@/lib/sim/ScrollRevealContext";
import { useMatchLayout } from "@/lib/sim/matchLayoutStore";
import { useVersusMode } from "@/lib/sim/versusModeStore";
import { useTopControls } from "@/lib/sim/feedTopControlsStore";
import { useAccentControls } from "@/lib/sim/accentControlsStore";
import { useVersusHeaderAlign } from "@/lib/sim/versusHeaderAlignStore";
import { useWorldCupHeader } from "@/lib/sim/worldCupHeaderStore";
import { useWorldCupMode } from "@/lib/sim/worldCupModeStore";
import { useWorldCupBracket } from "@/lib/sim/worldCupBracketStore";
import { WorldCupBracketSection } from "@/components/sim/WorldCupBracketBrowser";
import type { Match, Team } from "@/lib/sim/types";
import { FILTER_CHIP_ACTIVE_BG, FILTER_CHIP_INACTIVE_TEXT } from "@/lib/sim/colors";
import { geist } from "@/lib/sim/geistFonts";

const c = colors.light;

// Feed display settings for this standalone page — mirrors the home feed's
// defaults so the shared VersusCard renders identically here.
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
  showPositionBanner: true,
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

// First day-filter chip label — selects the live matches.
const GAME_DAY = "Game day";

// Country-flag avatar (flagcdn) — same source the team crests use. cc is an ISO
// 3166-1 alpha-2 code (or flagcdn subdivision like "gb-eng" for England).
const flag = (cc: string) => ({ uri: `https://flagcdn.com/w160/${cc}.png` });

// "Who will win the World Cup?" outright-winner market: each contender is a chip
// (rounded-square flag + country name + win % odds). Ordered by odds (favorites
// first). Rendered as a two-row swipeable carousel.
type Winner = { name: string; cc: string; pct: number };
const WORLD_CUP_WINNER: Winner[] = [
  { name: "England", cc: "gb-eng", pct: 18 },
  { name: "Argentina", cc: "ar", pct: 16 },
  { name: "France", cc: "fr", pct: 14 },
  { name: "Brazil", cc: "br", pct: 13 },
  { name: "Spain", cc: "es", pct: 11 },
  { name: "Germany", cc: "de", pct: 7 },
  { name: "Portugal", cc: "pt", pct: 6 },
  { name: "Netherlands", cc: "nl", pct: 5 },
  { name: "Italy", cc: "it", pct: 4 },
  { name: "Belgium", cc: "be", pct: 3 },
  { name: "USA", cc: "us", pct: 3 },
  { name: "Croatia", cc: "hr", pct: 2 },
  { name: "Uruguay", cc: "uy", pct: 2 },
  { name: "Colombia", cc: "co", pct: 1 },
];

// "Who will advance to Round 16?" — same chip carousel for the Round-of-32 sides
// favored to reach the Round of 16. The % is each side's win odds from its
// Round-of-32 fixture (WORLD_CUP_KNOCKOUT). Ordered by odds.
const WORLD_CUP_ADVANCE: Winner[] = [
  { name: "Italy", cc: "it", pct: 72 },
  { name: "Brazil", cc: "br", pct: 71 },
  { name: "Germany", cc: "de", pct: 70 },
  { name: "France", cc: "fr", pct: 69 },
  { name: "Netherlands", cc: "nl", pct: 67 },
  { name: "England", cc: "gb-eng", pct: 66 },
  { name: "USA", cc: "us", pct: 66 },
  { name: "Argentina", cc: "ar", pct: 64 },
  { name: "Belgium", cc: "be", pct: 64 },
  { name: "Norway", cc: "no", pct: 62 },
  { name: "Spain", cc: "es", pct: 59 },
  { name: "Uruguay", cc: "uy", pct: 57 },
  { name: "Portugal", cc: "pt", pct: 56 },
  { name: "Colombia", cc: "co", pct: 47 },
];

// Hero artwork (title baked in) used by the "hero" (default) and "banner" headers.
const WORLD_CUP_BANNER = require("@/assets/figmaAssets/worldcup-banner.jpg");

// Full FIFA World Cup Round of 32 knockout slate — all 16 matchups rendered as
// versus cards. The first match is live; the rest are upcoming fixtures with a
// kickoff date/time. Two-outcome (win/win) markets — knockouts have no draw.
type KnockoutTeam = { name: string; abbr: string; flag: string; color: string };
type KnockoutSpec = {
  home: KnockoutTeam;
  away: KnockoutTeam;
  pct: [number, number];
  vol: string;
  markets: number;
  date: string;
  time?: string;
  live?: { mins: string; score: [number, number]; ball: 0 | 1 };
};

function knockoutMatch(s: KnockoutSpec): Match {
  const mk = (t: KnockoutTeam, pct: number, score?: number, ball?: boolean): Team => ({
    name: t.name,
    pct: `${pct}%`,
    color: t.color,
    initial: t.abbr[0],
    abbr: t.abbr,
    flag: t.flag,
    ...(score != null ? { score } : {}),
    ...(ball ? { hasBall: true } : {}),
  });
  return {
    league: "FIFA World Cup",
    leagueColor: "#326295",
    sport: "soccer",
    ...(s.live ? { live: { mins: s.live.mins } } : {}),
    teams: [
      mk(s.home, s.pct[0], s.live?.score[0], s.live?.ball === 0),
      mk(s.away, s.pct[1], s.live?.score[1], s.live?.ball === 1),
    ],
    vol: s.vol,
    date: s.date,
    ...(s.time ? { time: s.time } : {}),
    markets: s.markets,
  };
}

// Exported for the match-detail REGISTRY + check-market-links validation.
export const WORLD_CUP_KNOCKOUT: Match[] = [
  knockoutMatch({ home: { name: "Canada", abbr: "CAN", flag: "ca", color: "#d52b1e" }, away: { name: "Bosnia", abbr: "BIH", flag: "ba", color: "#002395" }, pct: [54, 46], vol: "$1.2M Vol.", markets: 12, date: "Live", live: { mins: "1ST · 13'", score: [1, 1], ball: 0 } }),
  knockoutMatch({ home: { name: "USA", abbr: "USA", flag: "us", color: "#3c3b6e" }, away: { name: "Paraguay", abbr: "PAR", flag: "py", color: "#d52b1e" }, pct: [66, 34], vol: "$850K Vol.", markets: 9, date: "Tomorrow", time: "10:00 AM" }),
  knockoutMatch({ home: { name: "Qatar", abbr: "QAT", flag: "qa", color: "#8d1b3d" }, away: { name: "Switzerland", abbr: "SUI", flag: "ch", color: "#d52b1e" }, pct: [25, 75], vol: "$640K Vol.", markets: 7, date: "Tomorrow", time: "2:00 PM" }),
  knockoutMatch({ home: { name: "Brazil", abbr: "BRA", flag: "br", color: "#009c3b" }, away: { name: "Morocco", abbr: "MAR", flag: "ma", color: "#c1272d" }, pct: [71, 29], vol: "$2.1M Vol.", markets: 14, date: "Jun 18", time: "10:00 AM" }),
  knockoutMatch({ home: { name: "Argentina", abbr: "ARG", flag: "ar", color: "#75aadb" }, away: { name: "Nigeria", abbr: "NGA", flag: "ng", color: "#008751" }, pct: [64, 36], vol: "$1.4M Vol.", markets: 11, date: "Jun 18", time: "2:00 PM" }),
  knockoutMatch({ home: { name: "France", abbr: "FRA", flag: "fr", color: "#1d4ed8" }, away: { name: "Japan", abbr: "JPN", flag: "jp", color: "#bc002d" }, pct: [69, 31], vol: "$1.1M Vol.", markets: 10, date: "Jun 19", time: "10:00 AM" }),
  knockoutMatch({ home: { name: "Spain", abbr: "ESP", flag: "es", color: "#c60b1e" }, away: { name: "Croatia", abbr: "CRO", flag: "hr", color: "#ff0000" }, pct: [59, 41], vol: "$980K Vol.", markets: 9, date: "Jun 19", time: "2:00 PM" }),
  knockoutMatch({ home: { name: "Portugal", abbr: "POR", flag: "pt", color: "#006600" }, away: { name: "Mexico", abbr: "MEX", flag: "mx", color: "#006847" }, pct: [56, 44], vol: "$760K Vol.", markets: 8, date: "Jun 20", time: "10:00 AM" }),
  knockoutMatch({ home: { name: "England", abbr: "ENG", flag: "gb-eng", color: "#cf142b" }, away: { name: "Senegal", abbr: "SEN", flag: "sn", color: "#00853f" }, pct: [66, 34], vol: "$1.3M Vol.", markets: 12, date: "Jun 20", time: "2:00 PM" }),
  knockoutMatch({ home: { name: "Germany", abbr: "GER", flag: "de", color: "#111827" }, away: { name: "Ecuador", abbr: "ECU", flag: "ec", color: "#ffd100" }, pct: [70, 30], vol: "$890K Vol.", markets: 10, date: "Jun 21", time: "10:00 AM" }),
  knockoutMatch({ home: { name: "Netherlands", abbr: "NED", flag: "nl", color: "#ff6a13" }, away: { name: "South Korea", abbr: "KOR", flag: "kr", color: "#003478" }, pct: [67, 33], vol: "$720K Vol.", markets: 8, date: "Jun 21", time: "2:00 PM" }),
  knockoutMatch({ home: { name: "Belgium", abbr: "BEL", flag: "be", color: "#c8102e" }, away: { name: "Australia", abbr: "AUS", flag: "au", color: "#00843d" }, pct: [64, 36], vol: "$680K Vol.", markets: 7, date: "Jun 22", time: "10:00 AM" }),
  knockoutMatch({ home: { name: "Italy", abbr: "ITA", flag: "it", color: "#0066cc" }, away: { name: "Ghana", abbr: "GHA", flag: "gh", color: "#006b3f" }, pct: [72, 28], vol: "$1.0M Vol.", markets: 9, date: "Jun 22", time: "2:00 PM" }),
  knockoutMatch({ home: { name: "Uruguay", abbr: "URU", flag: "uy", color: "#5b9bd5" }, away: { name: "Iran", abbr: "IRN", flag: "ir", color: "#239f40" }, pct: [57, 43], vol: "$610K Vol.", markets: 6, date: "Jun 23", time: "10:00 AM" }),
  knockoutMatch({ home: { name: "Colombia", abbr: "COL", flag: "co", color: "#fcd116" }, away: { name: "Denmark", abbr: "DEN", flag: "dk", color: "#c8102e" }, pct: [47, 53], vol: "$590K Vol.", markets: 6, date: "Jun 23", time: "2:00 PM" }),
  knockoutMatch({ home: { name: "Norway", abbr: "NOR", flag: "no", color: "#ba0c2f" }, away: { name: "Saudi Arabia", abbr: "KSA", flag: "sa", color: "#006c35" }, pct: [62, 38], vol: "$540K Vol.", markets: 6, date: "Jun 24", time: "10:00 AM" }),
];

// "Predict early on Round 16" — a single upcoming Round-of-16 fixture surfaced
// ahead of the bracket so users can bet early. Rendered as the shared match card.
export const EARLY_R16: Match = knockoutMatch({
  home: { name: "England", abbr: "ENG", flag: "gb-eng", color: "#cf142b" },
  away: { name: "Mexico", abbr: "MEX", flag: "mx", color: "#006847" },
  pct: [58, 42],
  vol: "$1.6M Vol.",
  markets: 10,
  date: "Sun, Jun 28",
  time: "12:00 PM",
});

// Fake World Cup prop markets (mirrors the reference screenshot). Each is a
// two-outcome market rendered in the standard card layout with no avatar; the
// market name is the card title and the "FIFA World Cup" league sits in the
// footer pill.
type Prop = { title: string; match: Match };
function propMarket(p: {
  title: string;
  a: [string, number];
  b: [string, number];
  colors: [string, string];
  vol: string;
  date: string;
  time?: string;
}): Prop {
  return {
    title: p.title,
    match: {
      league: "FIFA World Cup",
      leagueColor: "#326295",
      sport: "soccer",
      teams: [
        { name: p.a[0], pct: `${p.a[1]}%`, color: p.colors[0], initial: p.a[0][0] },
        { name: p.b[0], pct: `${p.b[1]}%`, color: p.colors[1], initial: p.b[0][0] },
      ],
      vol: p.vol,
      date: p.date,
      ...(p.time ? { time: p.time } : {}),
      markets: 0,
    },
  };
}

const ROUND_32_PROPS: Prop[] = [
  propMarket({ title: "Silver Boot Winner", a: ["Álvaro Morata", 46], b: ["Ousmane Dembélé", 45], colors: ["#5b8cff", "#f7931a"], vol: "$210K Vol.", date: "Jul 19" }),
  propMarket({ title: "Group F · Second Place", a: ["Japan", 40], b: ["Netherlands", 34], colors: ["#ff5fa2", "#2dd4bf"], vol: "$180K Vol.", date: "Jun 26" }),
  propMarket({ title: "Vinicius Jr. · Total Goals", a: ["2+ goals", 75], b: ["3+ goals", 64], colors: ["#a78bfa", "#38bdf8"], vol: "$240K Vol.", date: "Jul 19" }),
];

// Single matchup card. Follows the shared layout toggle: "standard" stacks the
// outcomes in a StandardCard, while "versus" and "mixed" use the head-to-head
// VersusCard. Live matches animate their border.
function MatchCard({ m, layout }: { m: Match; layout: "versus" | "standard" | "mixed" }) {
  if (layout === "standard") {
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

// One Round-of-32 prop market in the standard card layout: market name as the
// title (no avatar), self-describing outcome rows, "FIFA World Cup" footer pill.
function PropCard({ prop }: { prop: Prop }) {
  return (
    <StandardCard
      match={prop.match}
      live={false}
      score="aside"
      display="name"
      title="show"
      titleText={prop.title}
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
      animate={false}
      animStyle="border"
    />
  );
}

// One outright-winner contender chip: rounded-square flag + country name with
// the win % odds underneath. Rounded-rectangle pill.
function WinnerChip({ w }: { w: Winner }) {
  return (
    <View style={styles.winnerChip}>
      <Image source={flag(w.cc)} style={styles.winnerFlag} resizeMode="cover" />
      <View style={{ flexShrink: 1 }}>
        <Text style={styles.winnerName} numberOfLines={1}>
          {w.name}
        </Text>
        <Text style={styles.winnerVol} numberOfLines={1}>
          {w.pct}%
        </Text>
      </View>
    </View>
  );
}

// "Who will win the World Cup?" — two rows of contender chips that swipe across
// together as one horizontal carousel (mirrors the Popular-pills pattern).
function WinnerCarousel({ data }: { data: Winner[] }) {
  const rows = [
    data.filter((_, i) => i % 2 === 0),
    data.filter((_, i) => i % 2 === 1),
  ];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
    >
      <View style={{ gap: 10 }}>
        {rows.map((row, r) => (
          <View key={`wr-${r}`} style={{ flexDirection: "row", gap: 10 }}>
            {row.map((w) => (
              <WinnerChip key={w.name} w={w} />
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export default function WorldCupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // Back from World Cup always returns to the main home feed. When the page was
  // reached via a normal push the back stack already lands on home; when opened
  // directly (deep link / reload) there's no stack, so navigate home explicitly.
  const goHome = React.useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }, [router]);
  const { width: screenW } = useWindowDimensions();
  // Reflect the home feed's layout toggle: "standard" forces every matchup into
  // the stacked-row StandardCard, "mixed" keeps the head-to-head VersusCard.
  const matchLayout = useMatchLayout();
  const headerVariant = useWorldCupHeader();
  // Stripped-down "simple" view (two flat-list tabs) vs the rich "full" view.
  const mode = useWorldCupMode();
  const isSimple = mode === "simple";
  // Home display-settings toggle: when on, show the knockout bracket map at the
  // top of the page (mobile port of the refined "BracketMap" canvas mockup).
  const showBracket = useWorldCupBracket();
  const versusMode = useVersusMode();
  // Inherit the home feed's top "Card" controls (footer + the three versus
  // toggles) so this page reflects the home display-settings choices.
  const topControls = useTopControls();
  const accentControls = useAccentControls();
  const versusHeaderAlign = useVersusHeaderAlign();
  const settings = React.useMemo<FeedSettings>(() => ({ ...FEED_SETTINGS, matchLayout, versusMode, ...topControls, ...accentControls, versusHeaderAlign }), [matchLayout, versusMode, topControls, accentControls, versusHeaderAlign]);

  // --- Probability-bar grow-in (same scroll-reveal infra as the home feed) ---
  // Provide a real ScrollReveal so each card's thin probability bars animate from
  // 0px width as they scroll into view (centerHighlight stays "off" — only the
  // bar grow-in uses this here). Bumping barResetKey replays it when the shared
  // Mixed/All-standard layout toggle flips.
  const contentRef = React.useRef<View>(null);
  const [viewportH, setViewportH] = React.useState(0);
  const [contentH, setContentH] = React.useState(0);
  const cards = React.useRef<Map<string, { y: number; h: number }>>(new Map());
  const lastHaptic = React.useRef(0);
  const [cardsVersion, setCardsVersion] = React.useState(0);
  const registerCard = React.useCallback((id: string, box: { y: number; h: number }) => {
    const prev = cards.current.get(id);
    if (prev && prev.y === box.y && prev.h === box.h) return;
    cards.current.set(id, box);
    setCardsVersion((v) => v + 1);
  }, []);
  const [barResetKey, setBarResetKey] = React.useState(0);
  const firstLayoutRun = React.useRef(true);
  React.useEffect(() => {
    if (firstLayoutRun.current) {
      firstLayoutRun.current = false;
      return;
    }
    setBarResetKey((k) => k + 1);
  }, [matchLayout]);

  // --- Collapsing banner header (only for the "banner" variant) ---
  // The full-bleed artwork + overlaid title scroll up together with the page,
  // while the back arrow stays pinned. The banner stops scrolling out once the
  // "World Cup 2026" title sits 16px below the back-arrow row — a collapsing
  // header. The scroll value must live here (with the ScrollView), so the banner
  // is rendered locally rather than via PageHeader's static banner variant.
  // "compact" header: a minimal centered-title nav bar. Tapping the title
  // expands it into the full-bleed banner in place (and tapping the banner title
  // collapses it back). The expansion is local page state, so it resets on
  // navigation / reload.
  const [expanded, setExpanded] = React.useState(false);
  const fromCompact = headerVariant === "compact";
  const isCompact = fromCompact && !expanded;
  const isBanner = headerVariant === "banner" || (fromCompact && expanded);
  const topInset = screenTopInset(insets.top);
  const bannerFullHeight = screenW / (393 / 277);
  // Back-arrow row: 40px box at top = topInset + 8. Collapsed title top sits 16px
  // below that row; 16px of breathing room remains below the title.
  const [titleH, setTitleH] = React.useState(64);
  const collapsedTitleTop = topInset + 8 + 40 + 16;
  const collapsedHeight = collapsedTitleTop + titleH + 16;
  const maxTranslate = Math.max(0, bannerFullHeight - collapsedHeight);
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const bannerTranslate = scrollY.interpolate({
    inputRange: [0, maxTranslate || 1],
    outputRange: [0, -(maxTranslate || 1)],
    extrapolate: "clamp",
  });
  // Zoom the artwork in as the header collapses — anchored on the soccer ball
  // (transformOrigin "65% 42%") so the ball stays low and fully in frame instead
  // of riding up into the pinned top edge. Scaled image clipped by overflow:hidden.
  const bannerScale = scrollY.interpolate({
    inputRange: [0, maxTranslate || 1],
    outputRange: [1, 1.35],
    extrapolate: "clamp",
  });
  // Day-filter chip bar pins just below the collapsed banner so it stays in view
  // while the match list scrolls. It rides up with the page until its top reaches
  // collapsedHeight, then holds (a second, smaller collapsing element).
  const chipBarHeight = 66;
  const chipRestTop = bannerFullHeight + 4;
  const chipPinStart = Math.max(0, chipRestTop - collapsedHeight);
  const chipTranslate = scrollY.interpolate({
    inputRange: [0, chipPinStart || 1],
    outputRange: [chipPinStart || 1, 0],
    extrapolate: "clamp",
  });

  // ScrollReveal value (defined here so it can reference the page's scrollY).
  const scrollReveal = React.useMemo(
    () => ({
      mode: "off" as const,
      centerHighlight: "off" as const,
      reflectTarget: "both" as const,
      present: true,
      scrollY,
      viewportH,
      contentH,
      topPad: 0,
      contentRef,
      cards,
      cardsVersion,
      barResetKey,
      registerCard,
      lastHaptic,
    }),
    [scrollY, viewportH, contentH, cardsVersion, barResetKey, registerCard],
  );

  const liveGames = React.useMemo(() => WORLD_CUP_KNOCKOUT.filter((m) => m.live), []);
  const upcomingGames = React.useMemo(() => WORLD_CUP_KNOCKOUT.filter((m) => !m.live), []);
  // Distinct kickoff dates among upcoming games, in fixture order.
  const upcomingDates = React.useMemo(() => {
    const seen: string[] = [];
    for (const m of upcomingGames) {
      const d = m.date ?? "";
      if (d && !seen.includes(d)) seen.push(d);
    }
    return seen;
  }, [upcomingGames]);
  // Day filter chips: "Game day" (the live games) first, then one chip per
  // upcoming date. Default-select "Game day".
  const dayChips = React.useMemo(() => [GAME_DAY, ...upcomingDates], [upcomingDates]);
  const [activeDay, setActiveDay] = React.useState<string>(GAME_DAY);
  const visibleGames = React.useMemo(
    () => (activeDay === GAME_DAY ? liveGames : upcomingGames.filter((m) => (m.date ?? "") === activeDay)),
    [activeDay, liveGames, upcomingGames],
  );
  // Simple-view tabs: a single flat "Games" list (all dates) and a "Props" list.
  const [activeTab, setActiveTab] = React.useState<"games" | "props">("games");
  const allGames = React.useMemo(() => [...liveGames, ...upcomingGames], [liveGames, upcomingGames]);

  // Horizontal day-filter chip row — rendered inline (non-banner variants) or
  // inside the pinned chip-bar overlay (banner variant).
  const chipRow = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
    >
      {dayChips.map((d) => {
        const active = d === activeDay;
        return (
          <Pressable
            key={d}
            onPress={() => setActiveDay(d)}
            style={[styles.dateChip, active ? styles.chipActive : styles.chipInactive]}
            hitSlop={6}
          >
            <Text style={[styles.dateChipText, { color: active ? "#fff" : FILTER_CHIP_INACTIVE_TEXT }]}>{d}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  const matchList = (
    <View style={{ gap: 12 }}>
      {visibleGames.length > 0 ? (
        visibleGames.map((m, i) => (
          <View key={`g-${i}`} style={{ paddingHorizontal: 16 }}>
            <MatchCard m={m} layout={matchLayout} />
          </View>
        ))
      ) : (
        <View style={styles.emptyProps}>
          <Text style={styles.emptyPropsText}>No games scheduled.</Text>
        </View>
      )}
    </View>
  );

  // Simple-view "Games"/"Props" tab chips. "Games" carries a pulsing green dot to
  // signal there are live games inside. Reuses the day-chip styling.
  const tabChipRow = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
    >
      {(["games", "props"] as const).map((t) => {
        const active = t === activeTab;
        return (
          <Pressable
            key={t}
            onPress={() => setActiveTab(t)}
            style={[styles.dateChip, styles.tabChip, active ? styles.chipActive : styles.chipInactive]}
            hitSlop={6}
          >
            {t === "games" && <LiveDot color={c.green} pulse />}
            <Text style={[styles.dateChipText, { color: active ? "#fff" : FILTER_CHIP_INACTIVE_TEXT }]}>
              {t === "games" ? "Games" : "Props"}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  // Flat "Games" list — every matchup across all dates as a single list.
  const allGamesList = (
    <View style={{ gap: 12 }}>
      {allGames.map((m, i) => (
        <View key={`ag-${i}`} style={{ paddingHorizontal: 16 }}>
          <MatchCard m={m} layout={matchLayout} />
        </View>
      ))}
    </View>
  );

  const earlyR16Section = (
    <View style={{ gap: 12 }}>
      <SectionHeader title="Predict early on Round 16" showChevron={false} titleStyle={SECTION_TITLE} />
      <View style={{ paddingHorizontal: 16 }}>
        <MatchCard m={EARLY_R16} layout={matchLayout} />
      </View>
    </View>
  );

  const advanceSection = (
    <View style={{ gap: 12 }}>
      <SectionHeader title="Who will advance to Round 16?" showChevron={false} titleStyle={SECTION_TITLE} />
      <WinnerCarousel data={WORLD_CUP_ADVANCE} />
    </View>
  );

  const winnerSection = (
    <View style={{ gap: 12 }}>
      <SectionHeader title="Who will win the World Cup?" showChevron={false} titleStyle={SECTION_TITLE_LG} />
      <WinnerCarousel data={WORLD_CUP_WINNER} />
    </View>
  );

  const propsSection = (
    <View style={{ gap: 12 }}>
      <SectionHeader title="Props" showChevron={false} titleStyle={SECTION_TITLE_LG} />
      <View style={{ gap: 12 }}>
        {ROUND_32_PROPS.map((p, i) => (
          <View key={`prop-${i}`} style={{ paddingHorizontal: 16 }}>
            <PropCard prop={p} />
          </View>
        ))}
      </View>
    </View>
  );

  // Simple-view body: a single flat list per tab. "Games" = all matchups then
  // the "Who will win the World Cup?" carousel; "Props" = that carousel first,
  // then the props list.
  const simpleBody =
    activeTab === "games" ? (
      <View style={{ gap: 24 }}>
        {/* The hero banner already shows "World Cup 2026 / Round 32", so drop the
            redundant Round 32 list title (and its extra top padding) in banner mode. */}
        <View style={{ gap: 12, paddingTop: isBanner ? 0 : 16 }}>
          {!isBanner && (
            <SectionHeader title="Round of 32" showChevron={false} titleStyle={SECTION_TITLE_LG} />
          )}
          {allGamesList}
        </View>
        {winnerSection}
      </View>
    ) : (
      <View style={{ gap: 32 }}>
        <View style={{ paddingTop: 16 }}>{winnerSection}</View>
        {propsSection}
      </View>
    );

  // The chip row varies by mode: day filters (full) vs Games/Props tabs (simple).
  const activeChipRow = isSimple ? tabChipRow : chipRow;

  const scrollBody = isBanner ? (
    // Banner variant: chips live in the pinned overlay below, so the scroll
    // content reserves room for the full banner + the rest-position chip bar.
    <View style={{ gap: 24, paddingTop: chipRestTop + chipBarHeight }}>
      {showBracket && (
        <WorldCupBracketSection onExpand={() => router.push("/worldcup-bracket")} />
      )}
      {isSimple ? (
        simpleBody
      ) : (
        <>
          {matchList}
          {earlyR16Section}
          {advanceSection}
          {winnerSection}
          {propsSection}
        </>
      )}
    </View>
  ) : (
    // Non-banner: chips are pinned in a fixed bar above the ScrollView (see
    // render below), so the scroll body starts straight at the content.
    <View style={{ gap: 24 }}>
      {showBracket && (
        <WorldCupBracketSection onExpand={() => router.push("/worldcup-bracket")} />
      )}
      {isSimple ? simpleBody : matchList}
      {!isSimple && (
        <>
          {earlyR16Section}
          {advanceSection}
          {winnerSection}
          {propsSection}
        </>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: isBanner ? 0 : topInset }}>
      {isCompact && (
        <View style={styles.compactBar}>
          <Pressable style={styles.compactSide} onPress={goHome} hitSlop={8}>
            <BackIcon size={24} color="#fff" />
          </Pressable>
          <Pressable onPress={() => setExpanded(true)} hitSlop={8}>
            <Text style={styles.compactTitle}>World Cup</Text>
          </Pressable>
          <Pressable style={styles.compactSide} onPress={() => {}} hitSlop={8} accessibilityRole="button" accessibilityLabel="Search">
            <SearchIcon size={24} color="#fff" />
          </Pressable>
        </View>
      )}
      {!isBanner && !isCompact && (
        <PageHeader
          title="World Cup 2026"
          variant={headerVariant === "hero" ? "hero" : "lg"}
          banner={WORLD_CUP_BANNER}
          bannerAspectRatio={393 / 277}
        />
      )}
      {!isBanner && (
        <View
          style={{
            paddingTop: headerVariant === "lg" || headerVariant === "compact" ? 0 : 16,
            paddingBottom: 16,
            backgroundColor: c.bg,
            zIndex: 1,
          }}
        >
          {activeChipRow}
        </View>
      )}
      <FeedSettingsProvider value={settings}>
        <LiveTickProvider>
          <LiveCueColorProvider cue="green">
            <ScrollRevealProvider value={scrollReveal}>
              {isBanner ? (
                <Animated.ScrollView
                  style={{ flex: 1 }}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                  contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
                  scrollEventThrottle={16}
                  onLayout={(e) => setViewportH(e.nativeEvent.layout.height)}
                  onContentSizeChange={(_w, h) => setContentH(h)}
                  onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
                    useNativeDriver: true,
                  })}
                >
                  <View ref={contentRef}>{scrollBody}</View>
                </Animated.ScrollView>
              ) : (
                <Animated.ScrollView
                  style={{ flex: 1 }}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                  contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
                  scrollEventThrottle={16}
                  onLayout={(e) => setViewportH(e.nativeEvent.layout.height)}
                  onContentSizeChange={(_w, h) => setContentH(h)}
                  onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
                    useNativeDriver: true,
                  })}
                >
                  <View ref={contentRef}>{scrollBody}</View>
                </Animated.ScrollView>
              )}
            </ScrollRevealProvider>
          </LiveCueColorProvider>
        </LiveTickProvider>
      </FeedSettingsProvider>

      {/* Collapsing banner: artwork + title scroll up together (pinned once the
          title reaches 16px below the arrow); the back arrow stays fixed. */}
      {isBanner && (
        <>
          {/* Day-filter chip bar: rides up with the page, then pins just below the
              collapsed banner. Rendered before the banner so the banner draws over
              it when both are pinned. */}
          <Animated.View
            style={[
              styles.chipBar,
              { top: collapsedHeight, height: chipBarHeight, transform: [{ translateY: chipTranslate }] },
            ]}
          >
            {activeChipRow}
          </Animated.View>
          <Animated.View
            pointerEvents={fromCompact ? "box-none" : "none"}
            style={[
              styles.bannerOverlay,
              { height: bannerFullHeight, transform: [{ translateY: bannerTranslate }] },
            ]}
          >
            <Animated.Image
              source={WORLD_CUP_BANNER}
              style={{
                width: screenW,
                height: bannerFullHeight,
                transformOrigin: "65% 42%",
                transform: [{ scale: bannerScale }],
              }}
              resizeMode="cover"
            />
            <Pressable
              style={styles.bannerTitleWrap}
              onLayout={(e) => setTitleH(e.nativeEvent.layout.height)}
              onPress={fromCompact ? () => setExpanded(false) : undefined}
              disabled={!fromCompact}
            >
              <Text style={styles.bannerTitle}>World Cup 2026</Text>
              <Text style={styles.bannerTitle}>Round of 32</Text>
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

const SECTION_TITLE = { fontFamily: geist.semibold, fontSize: 16, lineHeight: 22 } as const;
const SECTION_TITLE_LG = { fontFamily: geist.semibold, fontSize: 20, lineHeight: 26 } as const;

const styles = StyleSheet.create({
  chipActive: { backgroundColor: FILTER_CHIP_ACTIVE_BG },
  chipInactive: { backgroundColor: "transparent" },
  dateChip: { height: 34, justifyContent: "center", paddingHorizontal: 14, borderRadius: 10 },
  tabChip: { flexDirection: "row", alignItems: "center", gap: 7 },
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
  dateChipText: { fontFamily: geist.medium, fontSize: 16, lineHeight: 22 },
  emptyProps: { paddingVertical: 32, paddingHorizontal: 16, alignItems: "center" },
  emptyPropsText: { color: c.textMuted, fontFamily: geist.medium, fontSize: 14 },
  winnerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: c.surface,
    borderRadius: 14,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 16,
  },
  winnerFlag: { width: 32, height: 32, borderRadius: 8, backgroundColor: c.surface2 },
  winnerName: { color: c.textPrimary, fontFamily: geist.regular, fontSize: 14, lineHeight: 18 },
  winnerVol: { color: c.textMuted, fontFamily: geist.medium, fontSize: 14, lineHeight: 18, marginTop: 1 },
  chipBar: { position: "absolute", left: 0, right: 0, backgroundColor: c.bg, paddingVertical: 16 },
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
