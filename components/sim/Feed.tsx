import { Fragment, useState, type ReactNode } from "react";
import { Platform, Pressable, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { colors } from "@/lib/sim/colors";
import { FEED_SECTION_GAP } from "@/lib/sim/layout";

// Section headers pin under the fixed nav header while their section is on
// screen, then get pushed off by the next section (CSS sticky — web demo
// target; native ignores the value and renders inline).
// Pinning disabled by user preference for the Feed home layout: section
// headers and the category tile row scroll away normally. (The Tabs layout
// keeps its own pinned tab row in PillHome.)
const STICKY_HEADER_STYLE = null;
const stickyHeaderStyleAt = (_top: number) => null;
const STICKY_TABS_STYLE = null;
import { matchDetailHref } from "@/lib/sim/marketRoutes";
import {
  APPROVAL_MARKET,
  BTC_DAILY,
  BTC_DOM_MARKET,
  CANADA_PM_MARKET,
  CLARITY_ACT_MARKET,
  CRYPTO_MARKET,
  DOGE_MARKET,
  ELECTION_MARKET,
  ETF_MARKET,
  ETH_MARKET,
  F1_MARKET,
  F1_RACE,
  FED_MARKET,
  GOLF,
  HOUSE_MARKET,
  MCAP_MARKET,
  MLB_MARKET,
  NBA,
  NBA_TITLE_MARKET,
  NCAAF_MICH_OSU,
  NCAAF_UGA_BAMA,
  NFL,
  NFL_CAR_ARI,
  NFL_GB_PIT,
  NFL_MARKET,
  NHL,
  POLITICS_MARKET,
  PRESS_SECRETARY_FEED,
  PRESS_SECRETARY_MARKET,
  SENATE_MARKET,
  SHUTDOWN_MARKET,
  SOCCER,
  SOCCER_BRA_ARG,
  SOCCER_POR_NED,
  SOL_MARKET,
  SPURS_KNICKS,
  TENNIS,
  TENNIS_DECIDER,
  UCL_MARKET,
  UK_PM_MARKET,
} from "@/lib/sim/data";
import { ROW_STAGGER_MS } from "@/lib/sim/useLiveOdds";
import { FeedSettingsProvider, FEED_SECTION_ORDER, FEED_SECTION_TITLES, useFeedSettings, type FeedSectionKey } from "@/lib/sim/FeedSettingsContext";
import { useTrendingFilterMode } from "@/lib/sim/trendingInlineStore";
import { TOPICS, MatchCard, BinaryCard } from "@/lib/sim/topicMarkets";
import { allEsportsGames } from "@/app/esports";
import { useTennisHidden } from "@/lib/sim/tennisHiddenStore";
import { useSportsExamples } from "@/lib/sim/sportsExamplesStore";
import type { Match, PoliticsMarket } from "@/lib/sim/types";
import { FeedTabs, POPULAR_TOPIC_CONTENT, PopularPills, PopularPillsRow, SectionHeader, type HomeCategorySelect } from "./FeedChrome";
import { PoliticsCard } from "./PoliticsCard";
import { ProdBalanceCard } from "./ProdBalanceCard";
import { StandardCard } from "./StandardCard";
import { VersusCard } from "./VersusCard";
import { WorldCupCard } from "./WorldCupCard";
import { BtcDailyCard } from "./BtcDailyCard";
import { HeroCarousel } from "./HeroCarousel";
import { useUxrMode } from "@/lib/sim/uxrModeStore";
import { useCombinationsVisible, useShowCombinationsBanner } from "@/lib/sim/combinationsStore";
import { useComboTemplates } from "@/lib/sim/comboTemplatesStore";
import { CurrentPositionsCard } from "./CurrentPositionsCard";
import { CombinationsBanner } from "./CombinationsBanner";
import { CombinationsSection } from "./CombinationsSection";
import { LiveGamesCarousel } from "./LiveGamesCarousel";
import { LiveCardsCarousel } from "./LiveCardsCarousel";
import { HomeSocialTicker } from "./HomeSocialTicker";
import { getSlidesKind } from "@/lib/sim/slidesDemo";
import { useSportsIa } from "@/lib/sim/sportsIaStore";
import { useMmProposalControls } from "@/lib/sim/mmProposalStore";
import { useKalshiMvp } from "@/lib/sim/kalshiFlavorStore";
import { useSocialUx } from "@/lib/sim/socialUxStore";
import { CategoriesSection } from "@/components/mm-proposal/CategoriesSection";

// Individual sports with no head-to-head VersusCard variant in the Version A
// design — they always collapse to the stacked-row StandardCard regardless of
// the matchLayout toggle (tennis already did this; golf + F1 join it).
const STANDARD_LAYOUT_SPORTS = new Set(["tennis", "golf", "racing"]);
const HOME_SECTION_CARD_LIMIT = 3;
const TRENDING_HOME_CARD_LIMIT = 5;

// Home Trending uses the shared feed controls, but sports detail pages use a
// deliberate sides-style preset: centered live status, stacked LIVE stamp,
// probability bars below the score, and the metadata footer tag. Keep that
// preset local to game cards so home-only center/Live-left controls cannot
// change the sports card's established format.
function HomeSportsVersusCard({ match, delay }: { match: Match; delay: number }) {
  const feedSettings = useFeedSettings();
  const sportsDetailSettings = {
    ...feedSettings,
    versusLayout: "sides" as const,
    versusCenterLive: "centered" as const,
    footerPosition: "bottom" as const,
    versusVersion: "a" as const,
    versusHeaderAlign: "center" as const,
    liveFormat: "stacked" as const,
  };

  return (
    <FeedSettingsProvider value={sportsDetailSettings}>
      <VersusCard
        match={match}
        live
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
        animate
        animStyle="border"
        liveBaseDelayMs={delay}
        staggerMs={ROW_STAGGER_MS}
        combo={false}
      />
    </FeedSettingsProvider>
  );
}

// Deterministic Fisher-Yates so the mixed Trending order stays stable across
// renders yet still reads as genuinely shuffled. Ported verbatim from the web
// Feed so the native order matches Version A exactly.
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Interleave match (game) cards with non-game market cards so two games never
// appear back-to-back. Each list is shuffled deterministically, then fillers are
// distributed across the gaps around the games — every internal gap gets a
// filler first, so consecutive games are always separated whenever there are at
// least (games - 1) fillers.
function interleaveNoAdjacentGames<T>(games: T[], fillers: T[], seed: number): T[] {
  const g = seededShuffle(games, seed);
  const f = seededShuffle(fillers, (seed ^ 0x5bd1e995) >>> 0);
  const n = g.length;
  if (n === 0) return f;
  const gaps: T[][] = Array.from({ length: n + 1 }, () => []);
  let fi = 0;
  for (let i = 1; i < n && fi < f.length; i++) gaps[i].push(f[fi++]);
  for (let i = 0; fi < f.length; i++) gaps[i % (n + 1)].push(f[fi++]);
  const out: T[] = [];
  for (let i = 0; i <= n; i++) {
    out.push(...gaps[i]);
    if (i < n) out.push(g[i]);
  }
  return out;
}

// Native 1:1 rebuild of predict-simulator-2's "Version A" mobile feed. Every
// card prop below is the resolved Version A preset value (no config surface —
// this is a fixed reproduction of one preset, not the design tool).
type FeedItem = { rows: number; game: boolean; render: (delay: number) => ReactNode; tennis?: boolean; href?: string; pm?: string };

// UXR: game cards deep-link to the right detail page via the shared
// matchDetailHref (generic /match-detail keyed by both team abbrs, plus the
// bespoke tennis/game pages for their canonical fixtures).
const matchHref = (match: Match): string => matchDetailHref(match);

export function Feed({ onComboBuy, categorySelect }: { onComboBuy?: (picks: import("./ComboSheet").ComboPick[], opts?: { expanded?: boolean }) => void; categorySelect?: HomeCategorySelect } = {}) {
  const router = useRouter();
  const { density, matchLayout, versusUpcoming, cardStyle, heroSection, sections, popularPlacement, popularRows, showLiveGames, showActivePositions, showBtcUpDown, headerBalance = true, showClaim, showPositionBanner, positionBannerPlacement } = useFeedSettings();
  // UXR mode drops the hero promo carousel entirely.
  const uxr = useUxrMode() === "uxr";
  const sportsIa = useSportsIa();
  const { showCategories } = useMmProposalControls();
  const kalshiMvp = useKalshiMvp();
  const socialUx = useSocialUx();
  const showCombinationsBanner = useShowCombinationsBanner();
  const combinationsVisible = useCombinationsVisible();
  const comboTemplates = useComboTemplates();
  // In the header-balance mode the portfolio card's big balance + tiles are
  // gone; only render the card when it still has content (claim / inline notice).
  // Own the inline-notice dismissal here so a dismissed notice also drops the slot.
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  // UXR in-place variant: the category row pins under the app header while
  // scrolling; measured height offsets the section headers pinned beneath it.
  const tabsSticky = false;
  const [tabsH, setTabsH] = useState(0);
  // In-place Trending filter (Settings → Trending filters → In place): the
  // Popular chips select a topic that replaces the Trending list right here.
  const trendingInline = useTrendingFilterMode() === "inline";
  const [trendingTopic, setTrendingTopic] = useState<string | null>(null);
  const inlineNoticeActive = showPositionBanner && positionBannerPlacement === "inline" && !noticeDismissed;
  const balanceCardHasContent = !headerBalance || showClaim || inlineNoticeActive;
  const tennisHidden = useTennisHidden();
  const sportsExamples = useSportsExamples();
  const listMode = cardStyle === "list";
  // Mobile screen gutter: 16px all around in comfort, 12px in compact.
  const gutter = density === "comfort" ? 16 : 12;
  // Chain every card's live-odds cascade off a running outcome-row count so the
  // whole feed reads as one continuous wave down the page (ROW_STAGGER_MS/row).
  let rowOffset = 0;
  const nextDelay = (rows: number) => {
    const delay = rowOffset * ROW_STAGGER_MS;
    rowOffset += rows;
    return delay;
  };

  // A game (match) card. "versus" uses the sports-detail VersusCard preset,
  // while "standard" and "mixed" use StandardCards on Home. StandardCard
  // renders a draw row when the match has one, so World Cup keeps its draw
  // outcome in either layout.
  const renderMatchCard = (match: Match, key: string, delay: number) =>
    // Tennis always uses the stacked-row StandardCard regardless of matchLayout
    // (it has no head-to-head VersusCard variant in the Version A design).
    // When "Versus for upcoming games" is off, only live games keep the
    // head-to-head VersusCard — every upcoming (non-live) game collapses to the
    // StandardCard layout too.
    matchLayout !== "versus" || STANDARD_LAYOUT_SPORTS.has(match.sport ?? "") || (!versusUpcoming && !match.live) ? (
      <StandardCard
        key={key}
        match={match}
        live
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
        animate
        animStyle="border"
        liveBaseDelayMs={delay}
        staggerMs={ROW_STAGGER_MS}
        combo={false}
      />
    ) : (
      <HomeSportsVersusCard
        key={key}
        match={match}
        delay={delay}
      />
    );

  // Shared card renderers for the curated category sections (Sports/Crypto/
  // Politics). Same resolved Version A props as the Trending cards.
  const politicsItem = (market: PoliticsMarket, key: string): FeedItem => ({
    rows: market.outcomes.length,
    game: false,
    pm: market.question,
    render: (delay) => (
      <PoliticsCard
        key={key}
        market={market}
        cardPadding="12"
        metaStyle="filled"
        metaPlacement="bottom"
        buttonText="gray-colored"
        buttonSize="md"
        buttonStyle="default"
        buttonAnim="slot"
        animate
        liveBaseDelayMs={delay}
        staggerMs={ROW_STAGGER_MS}
        showAvatar
        combo={false}
      />
    ),
  });

  const standardItem = (match: Match, key: string): FeedItem => ({
    rows: match.teams.length + (match.draw ? 1 : 0),
    game: true,
    tennis: match.sport === "tennis",
    href: matchHref(match),
    render: (delay) => (
      <StandardCard
        key={key}
        match={match}
        live
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
        animate
        animStyle="border"
        liveBaseDelayMs={delay}
        staggerMs={ROW_STAGGER_MS}
        combo={false}
      />
    ),
  });

  const matchItem = (match: Match, key: string): FeedItem => ({
    rows: match.teams.length + (match.draw ? 1 : 0),
    game: true,
    // Derive from the data so every tennis card routes to /tennis-detail no
    // matter which section builds it (sports-examples included).
    tennis: match.sport === "tennis",
    href: matchHref(match),
    render: (delay) => renderMatchCard(match, key, delay),
  });

  // Upcoming (not-yet-started) variants of two home-feed games so the feed reads
  // as a realistic mix of live + upcoming markets. These show a scheduled time
  // instead of a live score, and are the games the "Versus for upcoming games"
  // toggle flips between the head-to-head VersusCard and the stacked StandardCard.
  // Kept local so the shared data (and other pages) stay unchanged.
  const NHL_UPCOMING: Match = { ...NHL, live: undefined };
  const SOCCER_POR_NED_UPCOMING: Match = { ...SOCCER_POR_NED, live: undefined };

  const trendingItems: FeedItem[] = [
    {
      rows: CRYPTO_MARKET.outcomes.length,
      game: false,
      pm: CRYPTO_MARKET.question,
      render: (delay) => (
        <PoliticsCard
          key="tr-crypto"
          market={CRYPTO_MARKET}
          cardPadding="12"
          metaStyle="filled"
          metaPlacement="bottom"
          buttonText="gray-colored"
          buttonSize="md"
          buttonStyle="default"
          buttonAnim="slot"
          animate
          liveBaseDelayMs={delay}
          staggerMs={ROW_STAGGER_MS}
          showAvatar
          combo={false}
        />
      ),
    },
    {
      rows: POLITICS_MARKET.outcomes.length,
      game: false,
      pm: POLITICS_MARKET.question,
      render: (delay) => (
        <PoliticsCard
          key="tr-politics"
          market={POLITICS_MARKET}
          cardPadding="12"
          metaStyle="filled"
          metaPlacement="bottom"
          buttonText="gray-colored"
          buttonSize="md"
          buttonStyle="default"
          buttonAnim="slot"
          animate
          liveBaseDelayMs={delay}
          staggerMs={ROW_STAGGER_MS}
          showAvatar
          combo={false}
        />
      ),
    },
    {
      rows: TENNIS.teams.length,
      game: true,
      tennis: true,
      href: matchDetailHref(TENNIS),
      render: (delay) => (
        <StandardCard
          key="tr-tennis"
          match={TENNIS}
          live
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
          animate
          animStyle="border"
          liveBaseDelayMs={delay}
          staggerMs={ROW_STAGGER_MS}
          combo={false}
        />
      ),
    },
    {
      rows: TENNIS_DECIDER.teams.length,
      game: true,
      tennis: true,
      href: matchDetailHref(TENNIS_DECIDER),
      render: (delay) => (
        <StandardCard
          key="tr-tennis-decider"
          match={TENNIS_DECIDER}
          live
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
          animate
          animStyle="border"
          liveBaseDelayMs={delay}
          staggerMs={ROW_STAGGER_MS}
          combo={false}
        />
      ),
    },
    {
      rows: ETH_MARKET.outcomes.length,
      game: false,
      pm: ETH_MARKET.question,
      render: (delay) => (
        <PoliticsCard
          key="tr-eth"
          market={ETH_MARKET}
          cardPadding="12"
          metaStyle="filled"
          metaPlacement="bottom"
          buttonText="gray-colored"
          buttonSize="md"
          buttonStyle="default"
          buttonAnim="slot"
          animate
          liveBaseDelayMs={delay}
          staggerMs={ROW_STAGGER_MS}
          showAvatar
          combo={false}
        />
      ),
    },
    {
      rows: FED_MARKET.outcomes.length,
      game: false,
      pm: FED_MARKET.question,
      render: (delay) => (
        <PoliticsCard
          key="tr-fed"
          market={FED_MARKET}
          cardPadding="12"
          metaStyle="filled"
          metaPlacement="bottom"
          buttonText="gray-colored"
          buttonSize="md"
          buttonStyle="default"
          buttonAnim="slot"
          animate
          liveBaseDelayMs={delay}
          staggerMs={ROW_STAGGER_MS}
          showAvatar
          combo={false}
        />
      ),
    },
    {
      rows: NBA.teams.length,
      game: true,
      href: matchHref(NBA),
      render: (delay) => renderMatchCard(NBA, "tr-nba", delay),
    },
    {
      rows: NHL.teams.length,
      game: true,
      href: matchHref(NHL_UPCOMING),
      render: (delay) => renderMatchCard(NHL_UPCOMING, "tr-nhl", delay),
    },
    {
      rows: SPURS_KNICKS.teams.length,
      game: true,
      href: matchHref(SPURS_KNICKS),
      render: (delay) => renderMatchCard(SPURS_KNICKS, "tr-spurs-knicks", delay),
    },
    {
      rows: ELECTION_MARKET.outcomes.length,
      game: false,
      pm: ELECTION_MARKET.question,
      render: (delay) => (
        <PoliticsCard
          key="tr-election"
          market={ELECTION_MARKET}
          cardPadding="12"
          metaStyle="filled"
          metaPlacement="bottom"
          buttonText="gray-colored"
          buttonSize="md"
          buttonStyle="default"
          buttonAnim="slot"
          animate
          liveBaseDelayMs={delay}
          staggerMs={ROW_STAGGER_MS}
          showAvatar
          combo={false}
        />
      ),
    },
    {
      rows: SENATE_MARKET.outcomes.length,
      game: false,
      pm: SENATE_MARKET.question,
      render: (delay) => (
        <PoliticsCard
          key="tr-senate"
          market={SENATE_MARKET}
          cardPadding="12"
          metaStyle="filled"
          metaPlacement="bottom"
          buttonText="gray-colored"
          buttonSize="md"
          buttonStyle="default"
          buttonAnim="slot"
          animate
          liveBaseDelayMs={delay}
          staggerMs={ROW_STAGGER_MS}
          showAvatar
          combo={false}
        />
      ),
    },
    {
      rows: F1_MARKET.outcomes.length,
      game: false,
      pm: F1_MARKET.question,
      render: (delay) => (
        <PoliticsCard
          key="tr-f1"
          market={F1_MARKET}
          cardPadding="12"
          metaStyle="filled"
          metaPlacement="bottom"
          buttonText="gray-colored"
          buttonSize="md"
          buttonStyle="default"
          buttonAnim="slot"
          animate
          liveBaseDelayMs={delay}
          staggerMs={ROW_STAGGER_MS}
          showAvatar
          combo={false}
        />
      ),
    },
    {
      rows: MLB_MARKET.outcomes.length,
      game: false,
      pm: MLB_MARKET.question,
      render: (delay) => (
        <PoliticsCard
          key="tr-mlb"
          market={MLB_MARKET}
          cardPadding="12"
          metaStyle="filled"
          metaPlacement="bottom"
          buttonText="gray-colored"
          buttonSize="md"
          buttonStyle="default"
          buttonAnim="slot"
          animate
          liveBaseDelayMs={delay}
          staggerMs={ROW_STAGGER_MS}
          showAvatar
          combo={false}
        />
      ),
    },
  ];

  const trending = [
    politicsItem(CLARITY_ACT_MARKET, "tr-clarity-act"),
    politicsItem(PRESS_SECRETARY_FEED, "tr-press-sec"),
    ...interleaveNoAdjacentGames(
      trendingItems.filter((it) => it.game),
      trendingItems.filter((it) => !it.game),
      0x9e3779b1,
    ),
  ];

  // Curated single-category sections, each with its own dedicated markets so no
  // card duplicates the Trending feed. Game and outcome cards are ordered so two
  // game cards never sit back-to-back within the (sliced) section.
  const sportsItems: FeedItem[] = [
    // NFL is pinned first so the live possession cue always survives the slice.
    matchItem(NFL, "sp-nfl-live"),
    politicsItem(NFL_MARKET, "sp-nfl"),
    { ...matchItem(TENNIS, "sp-tennis"), tennis: true },
    // Soccer carries a 3-way (Draw) outcome — kept within the default section
    // count so the sports examples always surface at least one draw scenario.
    matchItem(SOCCER_BRA_ARG, "sp-soccer-1"),
    politicsItem(UCL_MARKET, "sp-ucl"),
    politicsItem(NBA_TITLE_MARKET, "sp-nba-title"),
    matchItem(SOCCER_POR_NED_UPCOMING, "sp-soccer-2"),
    matchItem(SOCCER, "sp-soccer-3"),
  ];

  // "Sport examples" toggle: a curated one-of-each-sport demo set that replaces
  // the Sports section. The home section cap still applies, so the first three
  // examples are shown without making the home feed taller than other sections.
  const sportsExampleItems: FeedItem[] = [
    matchItem(NFL, "ex-nfl"),
    matchItem(NBA, "ex-nba"),
    matchItem(SOCCER_BRA_ARG, "ex-soccer"),
    matchItem(GOLF, "ex-golf"),
    matchItem(TENNIS, "ex-tennis"),
    matchItem(F1_RACE, "ex-f1"),
  ];

  const cryptoItems: FeedItem[] = [
    politicsItem(SOL_MARKET, "cr-sol"),
    politicsItem(ETF_MARKET, "cr-etf"),
    politicsItem(BTC_DOM_MARKET, "cr-dom"),
    politicsItem(DOGE_MARKET, "cr-doge"),
    politicsItem(MCAP_MARKET, "cr-mcap"),
  ];

  const politicsItems: FeedItem[] = [
    politicsItem(PRESS_SECRETARY_FEED, "po-press-sec"),
    politicsItem(SHUTDOWN_MARKET, "po-shutdown"),
    politicsItem(UK_PM_MARKET, "po-ukpm"),
    politicsItem(HOUSE_MARKET, "po-house"),
    politicsItem(APPROVAL_MARKET, "po-approval"),
    politicsItem(CANADA_PM_MARKET, "po-canada"),
  ];

  // Global "hide tennis" filter — drops the tennis cards (Wimbledon StandardCards
  // in Trending + the Sports tennis match) from every section when enabled.
  const dropTennis = (items: FeedItem[]) => (tennisHidden ? items.filter((it) => !it.tennis) : items);
  const sectionItems: Record<FeedSectionKey, FeedItem[]> = {
    trending: dropTennis(trending),
    sports: sportsExamples ? sportsExampleItems : dropTennis(sportsItems),
    crypto: cryptoItems,
    politics: politicsItems,
  };

  // Social home slide: ticker is the feature. Live rails / Trending bury it.
  if (getSlidesKind() === "home") {
    return (
      <View style={{ flexDirection: "column", gap: FEED_SECTION_GAP, paddingBottom: 112 }}>
        <HomeSocialTicker gutter={gutter} />
      </View>
    );
  }

  // Kalshi MVP: a limited home — balance card, then just two game sections
  // (NFL, NCAAF). Kalshi V2 keeps the regular MM Proposal feed below.
  if (kalshiMvp) {
    const kalshiSections: { title: string; items: FeedItem[]; href?: string }[] = [
      { title: "NFL", items: [matchItem(NFL_GB_PIT, "ka-nfl-1"), matchItem(NFL_CAR_ARI, "ka-nfl-2")], href: "/uxr-sport/football?league=NFL" },
      { title: "NCAAF", items: [matchItem(NCAAF_UGA_BAMA, "ka-ncaaf-1"), matchItem(NCAAF_MICH_OSU, "ka-ncaaf-2")], href: "/uxr-sport/football?league=NCAAF" },
    ];
    return (
      <View style={{ flexDirection: "column", gap: FEED_SECTION_GAP, paddingBottom: 112 }}>
        {balanceCardHasContent && (
          <View style={{ paddingHorizontal: gutter }}>
            <ProdBalanceCard noticeDismissed={noticeDismissed} onCloseNotice={() => setNoticeDismissed(true)} />
          </View>
        )}
        {showLiveGames && (
          uxr
            ? <LiveCardsCarousel gutter={gutter} sportsVariant="production" />
            : <LiveGamesCarousel gutter={gutter} />
        )}
        {combinationsVisible && comboTemplates ? (
          <CombinationsSection gutter={gutter} />
        ) : null}
        {kalshiSections.map((sec) => (
          <View key={sec.title} style={{ flexDirection: "column" }}>
            <View style={STICKY_HEADER_STYLE}>
              <SectionHeader title={sec.title} onPress={sec.href ? () => router.push(sec.href as Href) : undefined} />
            </View>
            <View style={{ flexDirection: "column", gap: 12, paddingHorizontal: gutter }}>
              {sec.items.map((it, idx) => {
                const node = it.render(nextDelay(it.rows));
                return it.href ? (
                  <Pressable key={`${sec.title}-${idx}`} onPress={() => router.push(it.href as Href)}>
                    {node}
                  </Pressable>
                ) : (
                  <View key={`${sec.title}-${idx}`}>{node}</View>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={{ gap: FEED_SECTION_GAP }}>
      {balanceCardHasContent ? (
        <View style={{ paddingHorizontal: gutter }}>
          <ProdBalanceCard noticeDismissed={noticeDismissed} onCloseNotice={() => setNoticeDismissed(true)} />
        </View>
      ) : null}
      {!balanceCardHasContent && showCombinationsBanner ? (
        <View style={{ paddingHorizontal: gutter }}>
          <CombinationsBanner />
        </View>
      ) : null}

      {(heroSection === "world-cup" || heroSection === "btc") && (
        <View style={{ paddingHorizontal: gutter }}>
          {heroSection === "world-cup" ? <WorldCupCard /> : <BtcDailyCard market={BTC_DAILY} />}
        </View>
      )}
      {heroSection === "carousel" && !uxr && (
        <View>
          <HeroCarousel />
        </View>
      )}

      {showBtcUpDown && (
        <View style={{ flexDirection: "column" }}>
          <View style={STICKY_HEADER_STYLE}>
            <SectionHeader title="BTC Up or Down" onPress={() => router.push("/crypto")} />
          </View>
          <View style={{ paddingHorizontal: gutter }}>
            <BtcDailyCard market={BTC_DAILY} variant="seek-left" />
          </View>
        </View>
      )}

      {showActivePositions && <CurrentPositionsCard gutter={gutter} />}

      {/* Section order: Live → Categories → Combos. */}
      {showLiveGames && (
        uxr
          ? <LiveCardsCarousel gutter={gutter} sportsVariant="production" />
          : <LiveGamesCarousel gutter={gutter} />
      )}

      {showCategories ? (
        <View
          style={tabsSticky ? STICKY_TABS_STYLE : undefined}
          onLayout={tabsSticky ? (e) => setTabsH(Math.round(e.nativeEvent.layout.height)) : undefined}
        >
          {sportsIa === "polymarket-sport-pages" ? (
            <CategoriesSection />
          ) : (
            <FeedTabs select={categorySelect} />
          )}
        </View>
      ) : null}

      {combinationsVisible && comboTemplates ? (
        <CombinationsSection gutter={gutter} />
      ) : null}

      <View style={{ flexDirection: "column", gap: FEED_SECTION_GAP, paddingBottom: 112 }}>
        {/* popular section — standalone unless folded into Trending */}
        {popularPlacement === "section" && <PopularPills rows={popularRows} />}

        {/* content sections — each toggleable + count-capped via settings */}
        {FEED_SECTION_ORDER.map((key) => {
          const cfg = sections[key];
          if (!cfg.enabled) return null;
          // Home Trending is capped at 5; sports/crypto/politics stay at 3.
          const shown = sectionItems[key].slice(
            0,
            key === "trending"
              ? TRENDING_HOME_CARD_LIMIT
              : Math.min(cfg.count, HOME_SECTION_CARD_LIMIT),
          );
          if (shown.length === 0) return null;
          // When folded into Trending, the Popular chips ride as the first row.
          const inlinePopular = key === "trending" && popularPlacement === "inTrending";
          return (
            <View key={key} style={{ flexDirection: "column" }}>
              <View style={tabsSticky ? stickyHeaderStyleAt(tabsH) : STICKY_HEADER_STYLE}>
                <SectionHeader
                  title={FEED_SECTION_TITLES[key]}
                  onPress={
                    key === "trending"
                      ? () => router.push("/trending")
                      : key === "sports"
                        ? () => router.push("/sports-leagues")
                        : key === "politics"
                          ? () => router.push("/politics")
                          : undefined
                  }
                />
              </View>
              {inlinePopular && (
                <PopularPillsRow
                  rows={popularRows}
                  select={trendingInline ? { selected: trendingTopic, onSelect: setTrendingTopic } : undefined}
                />
              )}
              {key === "trending" && trendingInline && trendingTopic ? (
                <View style={{ flexDirection: "column", gap: 12, paddingHorizontal: gutter }}>
                  {(() => {
                    const tk = POPULAR_TOPIC_CONTENT[trendingTopic];
                     if (tk === "esports")
                       return allEsportsGames().slice(0, HOME_SECTION_CARD_LIMIT).map((m, i) => <MatchCard key={`es-${i}`} m={m} layout={matchLayout === "versus" ? "versus" : "standard"} />);
                    const def = TOPICS[tk];
                    if (!def) return null;
                    const topicCards =
                      def.kind === "binary"
                        ? def.data.slice(0, HOME_SECTION_CARD_LIMIT).map((b, i) => <BinaryCard key={`${tk}-${i}`} item={b} />)
                        : def.data.slice(0, HOME_SECTION_CARD_LIMIT).map((m, i) => <MatchCard key={`${tk}-${i}`} m={m} layout={matchLayout === "versus" ? "versus" : "standard"} />);
                    if (trendingTopic !== "Trump") return topicCards;
                    return [
                      <Pressable
                        key="tr-clarity-act-topic"
                        onPress={() =>
                          router.push({ pathname: "/prediction-detail", params: { pm: CLARITY_ACT_MARKET.question } })
                        }
                      >
                        {politicsItem(CLARITY_ACT_MARKET, "tr-clarity-act-topic").render(0)}
                      </Pressable>,
                      <Pressable
                        key="tr-press-sec-topic"
                        onPress={() =>
                          router.push({ pathname: "/prediction-detail", params: { pm: PRESS_SECRETARY_MARKET.question } })
                        }
                      >
                        {politicsItem(PRESS_SECRETARY_FEED, "tr-press-sec-topic").render(0)}
                      </Pressable>,
                      ...topicCards,
                    ];
                  })()}
                </View>
              ) : (

              <View style={{ flexDirection: "column", gap: listMode ? 0 : 12, paddingHorizontal: gutter }}>
                {shown.map((it, idx) => {
                  const node = it.render(nextDelay(it.rows));
                  const tappable = (
                    // UXR: general (non-game) markets open the prediction detail
                    // page; game cards stay non-tappable pending an overhaul.
                    <Pressable
                      key={`${key}-tap-${idx}`}
                      onPress={
                        // Both modes share the per-card routing: game cards
                        // deep-link to their own detail page via href
                        // (matchDetailHref), non-game markets open
                        // /prediction-detail seeded with the tapped market's
                        // question. The old one-size-fits-all /market page is
                        // no longer linked from the feed.
                        it.game
                          ? it.href
                            ? () => router.push(it.href as Href)
                            : it.tennis
                              ? () => router.push("/tennis-detail")
                              : undefined
                          : () => router.push(it.pm ? { pathname: "/prediction-detail", params: { pm: it.pm } } : "/prediction-detail")
                      }
                    >
                      {node}
                    </Pressable>
                  );
                  if (!listMode) return tappable;
                  // List mode: no card container, so separate markets with a hairline.
                  return (
                    <Fragment key={`${key}-row-${idx}`}>
                      {idx > 0 && <View style={{ height: 1, marginHorizontal: -gutter, backgroundColor: colors.cardBorder }} />}
                      {tappable}
                    </Fragment>
                  );
                })}
              </View>
              )}
            </View>
          );
        })}
        <HomeSocialTicker gutter={gutter} />
      </View>
    </View>
  );
}
