import React, { useMemo, useRef, useState } from "react";
import { Animated, Image, Pressable, Text, View, useWindowDimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";

import { backgroundMuted, buttonTextOnColor, colors, marketAccentColor, UXR } from "@/lib/sim/colors";
import { screenTopInset } from "@/lib/sim/layout";
import { useThemeMode } from "@/lib/sim/dsModeStore";
import { useBetRadius } from "@/lib/sim/pillButtonsStore";
import { openBetSlip } from "@/lib/sim/betSlipStore";
import { F1_RACE, GOLF, NBA, NCAAF_MICH_OSU, NCAAF_UGA_BAMA, NFL, NFL_GB_PIT, NHL, SOCCER, SOCCER_BRA_ARG, SOCCER_POR_NED, SPURS_KNICKS, TENNIS_DECIDER, WORLD_CUP } from "@/lib/sim/data";
import { MARCH_MADNESS, NBA as NBA_TOPIC, UFC } from "@/lib/sim/topicMarkets";
import { EXTRA_SPORT_MATCHES, NCAAF_GEORGIA_ALABAMA, NCAAF_MICHIGAN_OSU, PANTHERS_CARDINALS, PACKERS_STEELERS } from "@/components/sim/UxrBrowse";
import { soccerDrawCents } from "@/lib/sim/soccerMoneyline";
import { matchKey } from "@/lib/sim/marketRoutes";
import { allEsportsGames } from "./esports";
import { WIMBLEDON_GAMES } from "./wimbledon";
import { EARLY_R16, WORLD_CUP_KNOCKOUT } from "./worldcup";
import { UPCOMING_GAMES } from "./sports-leagues";
import { marketPeriod, ScopeToggle, soccerPeriodScopesForSport, scopeSlug, SpreadCard, TotalCard } from "@/components/sim/MatchMarkets";
import { FilterButton } from "@/components/sim/FilterButton";
import { ComboSelectedButton } from "@/components/sim/ComboGradient";
import { outcomeButtonVisual } from "@/lib/sim/buttonStyle";
import { useComboMode, useComboPageUnselectedChrome } from "@/lib/sim/comboFlowStore";
import { useCombinationsVisible } from "@/lib/sim/combinationsStore";
import { HeaderComboMark } from "@/components/sim/ComboMark";
import { BuildComboButton, BUILD_COMBO_STACK_GAP } from "@/components/sim/BuildComboButton";
import { ComboSheet } from "@/components/sim/ComboSheet";
import { comboListPaddingBottom, useComboSheetHeight } from "@/lib/sim/comboSheetHeightStore";
import { comboAvatarFromTeam } from "@/lib/sim/comboTeamMark";
import { comboOutcomeOn } from "@/lib/sim/comboPickEdit";
import { toggleComboPick, removeComboPick, replaceComboPick, clearComboPicks, useComboPicks } from "@/lib/sim/comboPicksStore";
import { HelmetIcon } from "@/components/sim/HelmetIcon";
import { ChartWithPeriods } from "@/components/sim/ScoreChartUnit";
import { SportScoreHeader, headerKind, TeamAvatar } from "@/components/sim/SportScoreHeader";
import { MatchPositionsSection } from "@/components/sim/MatchPositionsSection";
import { liveChatFooterReserve } from "@/components/sim/MarketLiveChat";
import { MarketPageBody } from "@/components/sim/MarketPageTabs";
import { MarketRulesSection } from "@/components/sim/MarketRulesSection";
import { MarketActionFooter, marketActionFooterSpace } from "@/components/sim/MarketActionFooter";
import { MatchComboPicksCarousel } from "@/components/sim/CombinationsSection";
import { MarketDetailHeader, MARKET_DETAIL_NAV_H } from "@/components/sim/MarketDetailHeader";
import { MatchTitleScoreHeader } from "@/components/sim/MatchTitleScoreHeader";
import { LiveTimestamp } from "@/components/sim/LiveTimestamp";
import { smoothAreaPath, smoothPath } from "@/lib/sim/chartPath";
import { DOT, RippleDot } from "@/components/sim/RippleDot";
import { useFixedMarketActions } from "@/lib/sim/marketDetailActionsStore";
import type { Match, Team } from "@/lib/sim/types";
import { geist } from "@/lib/sim/geistFonts";
import { VolumeText } from "@/components/sim/VolumeText";

// Generic sport match detail page — the tennis/game-detail pattern adopted for
// every sport in the feed: centered "A vs. B" nav title, "● Live · {clock}"
// subheader, per-team rows (avatar · name · sport-specific scoreline · % pill),
// a stepped odds chart with glowing live end dots, Live/6H/1D/Max pills, and a
// Moneyline market card (three-way when the match has a draw).
// Route: /match-detail?m=<matchKey, e.g. "kc-bal"> (both team abbrs, lowercase).

// Canonical Chiefs–Ravens fixture for the live carousel card (a distinct
// matchup from the Chiefs–Bills feed card; composite keys keep them separate).
const CHIEFS_RAVENS: Match = {
  league: "NFL",
  leagueColor: "#013369",
  sport: "americanFootball",
  live: { mins: "Q3 · 5:58" },
  teams: [
    { name: "Chiefs", pct: "62%", color: "#e31837", initial: "K", abbr: "KC", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png", hasBall: true, score: 21 },
    { name: "Ravens", pct: "38%", color: "#241773", initial: "R", abbr: "BAL", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/bal.png", score: 17 },
  ],
  vol: "$2.7M Vol.",
  date: "Aug 10",
  markets: 8,
};

// Exported for scripts/check-market-links (broken-card-link validation).
export const REGISTRY: Record<string, Match> = Object.fromEntries(
  // Keyed by matchKey (both team abbrs, "kc-bal") so different matchups that
  // share a first team never collide. Object.fromEntries keeps the LAST
  // duplicate, so list the canonical feed matches last.
  [
    // Dedicated-page fixtures (esports / Wimbledon / World Cup knockout /
    // upcoming games) registered first so canonical feed matches still win
    // any key collisions below.
    ...allEsportsGames(),
    ...WIMBLEDON_GAMES,
    ...WORLD_CUP_KNOCKOUT, EARLY_R16,
    ...UPCOMING_GAMES,
    ...EXTRA_SPORT_MATCHES,
    ...MARCH_MADNESS,
    ...NBA_TOPIC,
    ...UFC,
    ...WORLD_CUP,
    PANTHERS_CARDINALS,
    PACKERS_STEELERS,
    NCAAF_GEORGIA_ALABAMA, NCAAF_MICHIGAN_OSU,
    NFL_GB_PIT, NCAAF_UGA_BAMA, NCAAF_MICH_OSU,
    TENNIS_DECIDER,
    SOCCER, SOCCER_BRA_ARG, SOCCER_POR_NED, NBA, SPURS_KNICKS, NHL, NFL, GOLF, F1_RACE,
    CHIEFS_RAVENS,
  ].map((m) => [matchKey(m), m]),
);

// Generic matchup props for the Predict → Props pill, derived from the match
// so every sport detail page has believable prop content.
function propsFor(match: Match): { title: string; yes: number; vol: string }[] {
  const [a, b] = match.teams;
  const pctA = Math.round(parseFloat(a.pct) || 50);
  const clamp = (n: number) => Math.max(4, Math.min(96, n));
  return [
    { title: `${a.name} wins by 5+?`, yes: clamp(pctA - 18), vol: "$42K Vol." },
    { title: `${b.name} takes an early lead?`, yes: clamp(100 - pctA + 8), vol: "$27K Vol." },
    { title: "Lead changes 3+ times?", yes: clamp(38), vol: "$19K Vol." },
  ];
}

// Modern scoreboard layout (mock): LIVE-first period set + content tabs.
const PERIODS_MODERN = ["LIVE", "1D", "1W", "1M", "1Y"];
// Panthers game-detail chart geometry: 150px tall, points plotted in a 12px
// vertically-inset band so lines/dots never clip the edges.
const CHART_H = 150;
const PLOT_H = CHART_H - 24;
const DOT_END_PAD = 64;

// Stepped odds series (holds + jumps, same vocabulary as tennis-detail); the
// final value is pinned to the team's live probability so the chart agrees
// with the % pills.
function mkSteps(seed: number, endV: number): number[] {
  // Chunkier series than before: fewer, longer holds so the rounded corners
  // read as soft "waves" (reference look) instead of dense jitter.
  const N = 13;
  const out: number[] = [];
  let v = Math.max(0.2, Math.min(0.8, endV + 0.1));
  for (let i = 0; i < N; i++) {
    const r = Math.sin(seed * 12.9898 + i * 78.233);
    v += r * 0.12;
    // Drift toward the live value over the run so the end lands naturally.
    v += (endV - v) * (i / N) * 0.35;
    v = Math.max(0.06, Math.min(0.9, v));
    out.push(v);
  }
  out[N - 1] = Math.max(0.05, Math.min(0.95, endV));
  return out;
}

// Rounded step path: horizontal holds with vertical jumps, every corner
// rounded via quadratic beziers, ending in a horizontal run into (endX, endY)
// — matches the soft "plumbing diagram" reference look.
function stepPath(points: number[], w: number, h: number, endX: number, endY: number): string {
  const n = points.length;
  const x = (i: number) => (i / (n - 1)) * w;
  const y = (v: number) => h - v * h;
  const R = 7; // corner radius
  let d = `M ${x(0)} ${y(points[0])}`;
  let curY = y(points[0]);
  const segW = w / (n - 1);
  for (let i = 1; i < n; i++) {
    const nextY = y(points[i]);
    const xi = x(i);
    const dy = nextY - curY;
    if (Math.abs(dy) < 1) {
      d += ` L ${xi} ${curY}`;
    } else {
      const r = Math.min(R, Math.abs(dy) / 2, segW / 2);
      const s = dy > 0 ? 1 : -1;
      // hold → rounded corner down/up → vertical → rounded corner → next hold
      d += ` L ${xi - r} ${curY}`;
      d += ` Q ${xi} ${curY} ${xi} ${curY + s * r}`;
      d += ` L ${xi} ${nextY - s * r}`;
      d += ` Q ${xi} ${nextY} ${Math.min(xi + r, w)} ${nextY}`;
    }
    curY = nextY;
  }
  // Run into the live dot: vertical adjust (rounded) then horizontal to it.
  const dy = endY - curY;
  if (Math.abs(dy) > 1) {
    const r = Math.min(R, Math.abs(dy) / 2);
    const s = dy > 0 ? 1 : -1;
    d += ` L ${w} ${curY} Q ${w + r} ${curY} ${w + r} ${curY + s * r} L ${w + r} ${endY - s * r} Q ${w + r} ${endY} ${w + 2 * r} ${endY}`;
  }
  d += ` L ${endX} ${endY}`;
  return d;
}

function pctNum(t: Team): number {
  return parseInt(t.pct, 10) || 0;
}

// Feed-card style split probability bar: 2px segments proportional to each
// outcome's odds, full card width, sitting between the card body and buttons.
function ProbBarline({ segs }: { segs: { pct: number; color: string }[] }) {
  const total = segs.reduce((a, s) => a + s.pct, 0) || 1;
  return (
    <View style={{ flexDirection: "row", gap: 4, width: "100%", height: 2, marginTop: 14 }}>
      {segs.map((s, i) => (
        <View
          key={i}
          style={{
            flexGrow: 0,
            flexShrink: 1,
            flexBasis: `${(s.pct / total) * 100}%`,
            height: 2,
            borderRadius: 999,
            backgroundColor: s.color,
          }}
        />
      ))}
    </View>
  );
}

export default function MatchDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const themeMode = useThemeMode();
  const { width: winW } = useWindowDimensions();
  const { m } = useLocalSearchParams<{ m?: string }>();
  const fixedMarketActions = useFixedMarketActions();
  // Unknown/missing ?m= is a routing bug — surface it instead of silently
  // rendering the wrong match.
  const match: Match | undefined = typeof m === "string" ? REGISTRY[m.toLowerCase()] : undefined;
  // Sport-accurate header treatment; everything below the header is the
  // standardized game-detail (Panthers vs. Cardinals) structure.
  //  - scoreboard: team sports — avatar · big score · LIVE/clock · score · avatar
  //  - duel: 1-v-1 (MMA/boxing, chess, esports) — names + round info, scores only when real
  //  - tennis: player rows with flags, per-set boxes and current game points
  //  - rows: leaderboard sports (golf, racing, poker) — entrant row list
  const kind = headerKind(match ?? NBA);
  // Spread/Total market cards only make sense for team sports.
  // Baseball gets a sport-specific header, but remains a team-sport detail
  // page so its existing spread/total market cards stay in place.
  const modern = kind === "scoreboard" || kind === "baseball";
  const [period, setPeriod] = useState("LIVE");
  const betR = useBetRadius();
  const comboMode = useComboMode();
  const unselectedChrome = useComboPageUnselectedChrome();
  const combosOn = useCombinationsVisible();
  const comboPicks = useComboPicks();
  const comboSheetH = useComboSheetHeight();
  // Stacked sections (game-detail structure): Positions first, then Predict
  // with Games/Props pills.
  const [pill, setPill] = useState<"Games" | "Props">("Games");
  const [mlScope, setMlScope] = useState(0);
  const [home, away] = (match ?? NBA).teams;
  const live = period === "LIVE" || period === "Live";
  const scrollY = useRef(new Animated.Value(0)).current;
  const topInset = Math.max(screenTopInset(insets.top), 12);
  const detailTitle = `${home.name} vs. ${away.name}`;
  const headerNavH = kind === "tennis" ? 72 : MARKET_DETAIL_NAV_H;
  // Collapsed sticky header: score chips only once the game has a live/final
  // score. Upcoming/scheduled fixtures keep the same "A vs. B" title (combo mark
  // included) instead of empty "—" score squares.
  const matchIsLive = !!match?.live;
  const hasScore = (match ?? NBA).teams.some((t) => {
    const raw = t.scoreText ?? (t.score != null ? String(t.score) : "");
    return raw !== "" && raw !== "—" && raw !== "-" && raw !== "–";
  });
  const showCollapsedScoreHeader = matchIsLive || hasScore;

  const series = useMemo(
    () => [
      { team: home, pts: mkSteps(3, pctNum(home) / 100) },
      { team: away, pts: mkSteps(5, pctNum(away) / 100) },
    ],
    [home, away],
  );

  const chartW = winW - DOT_END_PAD;
  // Line endpoints stay true to the team pcts; only the DOT positions are
  // nudged apart when a close market would overlap them (visual-only).
  const dotYs = useMemo(() => {
    const ys = series.map(({ pts }) => 12 + (1 - pts[pts.length - 1]) * PLOT_H);
    const MIN_PX = 24;
    if (Math.abs(ys[0] - ys[1]) < MIN_PX) {
      const mid = (ys[0] + ys[1]) / 2;
      const dir = ys[0] <= ys[1] ? -1 : 1;
      ys[0] = mid + (dir * MIN_PX) / 2;
      ys[1] = mid - (dir * MIN_PX) / 2;
    }
    return ys;
  }, [series]);

  if (!match) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", gap: 14, padding: 24 }}>
        <Text style={{ fontFamily: geist.semibold, fontSize: 17, color: colors.textPrimary }}>
          Match not found
        </Text>
        <Text style={{ fontFamily: geist.regular, fontSize: 14, color: colors.textMuted, textAlign: "center" }}>
          {`No match is registered for "${typeof m === "string" ? m : ""}".`}
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ paddingHorizontal: 20, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.1)" }}>
          <Text style={{ fontFamily: geist.semibold, fontSize: 15, color: colors.textPrimary }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  // Moneyline outcomes: three-way when the match has a draw (soccer).
  // Outcome colors snap to the UXR palette tokens so the prob bar, button
  // text, and chart lines all share the exact same color.
  const drawPct = soccerDrawCents(match) ?? (match.draw ? parseInt(match.draw.pct, 10) || 0 : undefined);
  const outcomes = [
    { key: home.abbr ?? home.initial, label: home.abbr ?? home.initial, pct: pctNum(home), color: marketAccentColor(home.color) },
    ...(drawPct != null ? [{ key: "draw", label: "Draw", pct: drawPct, color: "#FFFFFF" }] : []),
    { key: away.abbr ?? away.initial, label: away.abbr ?? away.initial, pct: pctNum(away), color: marketAccentColor(away.color) },
  ];
  const moneylinePeriodScopes = soccerPeriodScopesForSport(match.sport);
  const moneylinePeriod = marketPeriod(moneylinePeriodScopes, mlScope);
  const moneylinePeriodKey = moneylinePeriod ? `${scopeSlug(moneylinePeriod)}:` : "";
  const drawBackground = backgroundMuted(themeMode);
  const openMoneyline = (o: (typeof outcomes)[number]) => {
    openBetSlip({
      title: o.label,
      market: match.sport === "golf" ? "Tournament winner" : match.sport === "racing" ? "Race winner" : "Moneyline",
      oddsCents: o.pct,
      color: o.color,
      side: "yes",
      returnTo: `/match-detail?m=${typeof m === "string" ? m : ""}`,
    });
  };
  const moneylineActions = outcomes.map((o) => ({
    key: o.key,
    label: `${o.label} \u00b7 ${o.pct}\u00a2`,
    color: o.key === "draw" ? drawBackground : o.color,
    textColor: o.key === "draw" ? colors.textPrimary : buttonTextOnColor(),
    onPress: () => openMoneyline(o),
  }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Animated.ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        contentContainerStyle={{ paddingTop: topInset + headerNavH, paddingBottom: comboListPaddingBottom(comboMode, comboSheetH, insets.bottom, fixedMarketActions ? marketActionFooterSpace(combosOn) : 40) }}
      >
        {/* Sport-accurate scoring header (componentized: scoreboard / duel /
            tennis / rows — see SportScoreHeader). */}
        <SportScoreHeader match={match} />

        {/* Shared Panthers vs. Cardinals chart + MetaMask watermark + period
            pills, extracted verbatim from game-detail. */}
        <ChartWithPeriods
          series={series.map(({ team, pts }) => ({ color: marketAccentColor(team.color), points: pts }))}
          live={!!match.live}
          showGrid={false}
          scrubNames={series.map(({ team }) => team.name)}
        />

        {/* Primary moneyline actions are inline only in the comparison variant. */}
        {!fixedMarketActions && !comboMode && (
          <View style={{ paddingHorizontal: 16, marginTop: 16, gap: BUILD_COMBO_STACK_GAP }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
            {moneylineActions.map((action) => {
              const visual = outcomeButtonVisual("default", "gray-colored", action.color, { mode: "fill", label: action.label });
              return (
              <Pressable
                key={action.key}
                onPress={action.onPress}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: betR,
                  alignItems: "center",
                  justifyContent: "center",
                  ...visual.container,
                }}
              >
                <Text style={{ fontFamily: geist.semibold, fontSize: 15, ...visual.text }}>
                  {action.label}
                </Text>
              </Pressable>
              );
            })}
            </View>
            {combosOn ? <BuildComboButton radius={betR === 999 ? 24 : 12} /> : null}
          </View>
        )}

        <MarketPageBody
          stickyTop={topInset + headerNavH}
          marketTitle={`${home.name} vs. ${away.name}`}
          footerReserve={fixedMarketActions ? liveChatFooterReserve(combosOn) : 0}
          positionNames={match.teams.flatMap((t) => [t.name, t.abbr ?? t.initial])}
          rules={<MarketRulesSection subject={`${home.name} vs. ${away.name}`} />}
          positions={({ tabbed }) => (
            <MatchPositionsSection
              names={match.teams.flatMap((t) => [t.name, t.abbr ?? t.initial])}
              marketTitle={`${home.name} vs. ${away.name}`}
              returnTo={`/match-detail?m=${typeof m === "string" ? m : ""}`}
              hideHeading={tabbed}
              showEmpty={tabbed}
            />
          )}
          predict={
            <>
        <MatchComboPicksCarousel
          names={match.teams.map((t) => t.name)}
          sport={match.sport}
          league={match.league}
          logos={match.teams.map((t) => t.logo)}
          vol={match.vol}
        />
        <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, marginTop: 16 }}>
          {(["Games", "Props"] as const).map((g) => (
            <FilterButton
              key={g}
              label={g === "Games" ? "Game lines" : g}
              active={pill === g}
              onPress={() => setPill(g)}
            />
          ))}
        </View>

        {/* Props: a couple of matchup props rendered with the same card visual. */}
        {pill === "Props" && (
          <View style={{ paddingHorizontal: 16, marginTop: 16, gap: 14 }}>
            {propsFor(match).map((prop) => {
              return (
                <View key={prop.title} style={{ borderRadius: 16, backgroundColor: "rgba(255,255,255,0.08)", padding: 16 }}>
                  <Text style={{ fontFamily: geist.semibold, fontSize: 16, color: colors.textPrimary }}>{prop.title}</Text>
                  <VolumeText style={{ fontSize: 13, marginTop: 4 }}>{prop.vol}</VolumeText>
                  <ProbBarline segs={[{ pct: prop.yes, color: UXR.green }, { pct: 100 - prop.yes, color: UXR.red }]} />
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                    {[
                      { label: "Yes", pct: prop.yes, color: UXR.green },
                      { label: "No", pct: 100 - prop.yes, color: UXR.red },
                    ].map((o) => {
                      const id = `prop:${matchKey(match)}:${prop.title}:${o.label}`;
                      const on = comboMode && comboPicks.some((p) => p.id === id);
                      const onPress = () => {
                        if (comboMode) {
                          toggleComboPick({
                            id,
                            category: match.league ?? match.sport ?? "Sports",
                            label: `${o.label} · ${prop.title}`,
                            color: o.color,
                            cents: o.pct,
                            side: "yes",
                          });
                          return;
                        }
                        openBetSlip({ title: o.label, market: prop.title, oddsCents: o.pct, color: o.color, side: "yes", returnTo: `/match-detail?m=${typeof m === "string" ? m : ""}` });
                      };
                      if (comboMode) {
                        return (
                          <ComboSelectedButton
                            key={o.label}
                            selected={!!on}
                            onPress={onPress}
                            label={`${o.label} \u00b7 ${o.pct}\u00a2`}
                            radius={betR}
                            height={48}
                            flex={1}
                            fontSize={15}
                            fontFamily={geist.semibold}
                            unselectedColor={o.color}
                            unselectedChrome={unselectedChrome}
                          />
                        );
                      }
                      const visual = outcomeButtonVisual("default", "gray-colored", o.color, {
                        mode: "muted-color",
                        label: o.label,
                      });
                      return (
                        <Pressable
                          key={o.label}
                          onPress={onPress}
                          style={{
                            flex: 1,
                            height: 48,
                            borderRadius: betR,
                            alignItems: "center",
                            justifyContent: "center",
                            ...visual.container,
                          }}
                        >
                          <Text style={{ fontFamily: geist.semibold, fontSize: 15, ...visual.text }}>
                            {`${o.label} \u00b7 ${o.pct}\u00a2`}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Game lines: combo mode relocates the primary moneyline CTAs here
            for every sport. Spread/Total remain team-sport only — MMA/duel
            previously had an empty Games body once the footer CTAs hid. */}
        {pill === "Games" && (comboMode || modern) && (
          <View style={{ paddingHorizontal: 16, marginTop: 16, gap: 14 }}>
            {comboMode ? (
              <View style={{ borderRadius: 16, backgroundColor: "rgba(255,255,255,0.08)", padding: 16 }}>
                <Text style={{ fontFamily: geist.semibold, fontSize: 17, lineHeight: 22, color: colors.textPrimary }}>Moneyline</Text>
                {moneylinePeriodScopes ? (
                  <ScopeToggle options={[...moneylinePeriodScopes]} index={mlScope} onIndex={setMlScope} />
                ) : null}
                <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                  {outcomes.map((o) => {
                    const id = `ml:${matchKey(match)}:${moneylinePeriodKey}${o.key}`;
                    const on = comboOutcomeOn(comboPicks, id);
                    const team = o.key === "draw" ? undefined : o.key === (home.abbr ?? home.initial) ? home : away;
                    const other = team === home ? away : team === away ? home : undefined;
                    return (
                      <ComboSelectedButton
                        key={o.key}
                        selected={on}
                        onPress={() =>
                          toggleComboPick({
                            id,
                            category: match.league ?? match.sport ?? "Sports",
                            label: `${o.label} · ${home.name} vs ${away.name}`,
                            color: o.color,
                            cents: o.pct,
                            side: "yes",
                            kind: "ml",
                            sport: match.sport,
                            period: moneylinePeriod,
                            avatar: comboAvatarFromTeam(team),
                            alt: other
                              ? {
                                  id: `ml:${matchKey(match)}:${moneylinePeriodKey}${other.abbr ?? other.initial}`,
                                  label: `${other.abbr ?? other.initial} · ${home.name} vs ${away.name}`,
                                  color: marketAccentColor(other.color),
                                  cents: Math.max(8, Math.min(92, 100 - o.pct)),
                                  avatar: comboAvatarFromTeam(other),
                                }
                              : undefined,
                          })
                        }
                        label={`${o.label} · ${o.pct}¢`}
                        radius={betR}
                        height={48}
                        flex={1}
                        fontSize={15}
                        fontFamily={geist.semibold}
                        unselectedColor={o.color}
                        unselectedChrome={unselectedChrome}
                      />
                    );
                  })}
                </View>
              </View>
            ) : null}
            {modern ? (
              <>
                <SpreadCard match={match} teamColor={(t) => marketAccentColor(t.color)} />
                <TotalCard match={match} />
              </>
            ) : null}
          </View>
        )}
            </>
          }
        />
      </Animated.ScrollView>
      {fixedMarketActions && (
        <MarketActionFooter actions={moneylineActions} bottomInset={insets.bottom} showBuildCombo />
      )}
      <MarketDetailHeader
        scrollY={scrollY}
        topInset={topInset}
        navHeight={headerNavH}
        onBack={() => router.back()}
        expandedContent={
          <View style={{ alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              {comboMode ? <HeaderComboMark /> : null}
              <Text style={{ fontFamily: geist.semibold, fontSize: 16, lineHeight: 21, color: colors.textPrimary }} numberOfLines={1}>
                {detailTitle}
              </Text>
            </View>
            {kind === "tennis" && match.live ? (
              <View style={{ marginTop: 2 }}>
                <LiveTimestamp
                  descriptor={match.live.mins}
                  variant="linear"
                  align="center"
                  fontSize={12}
                  uppercaseDescriptor
                  liveColor={colors.greenOutline}
                  descriptorColor={colors.textMuted}
                />
              </View>
            ) : null}
          </View>
        }
        collapsedContent={
          showCollapsedScoreHeader ? (
            <MatchTitleScoreHeader
              leftName={home.name}
              rightName={away.name}
              leftScore={home.scoreText ?? home.score ?? "—"}
              rightScore={away.scoreText ?? away.score ?? "—"}
              clock={match.live?.mins}
              live={!!match.live}
            />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              {comboMode ? <HeaderComboMark /> : null}
              <Text style={{ fontFamily: geist.semibold, fontSize: 16, lineHeight: 21, color: colors.textPrimary }} numberOfLines={1}>
                {detailTitle}
              </Text>
            </View>
          )
        }
      />
      {comboMode ? (
        <ComboSheet
          picks={comboPicks}
          onRemove={removeComboPick}
          onReplace={replaceComboPick}
          onClear={clearComboPicks}
          docked
          maxTop={topInset + headerNavH}
          returnTo="/combination"
        />
      ) : null}
    </View>
  );
}
