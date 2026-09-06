import React, { useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

import { buttonTextOnColor, colors, filledChipBackground, filledChipForeground, marketAccentColor, uxrPaletteColor } from "@/lib/sim/colors";
import { screenTopInset } from "@/lib/sim/layout";
import { useThemeMode } from "@/lib/sim/dsModeStore";
import { useMmLogo } from "@/lib/sim/mmLogoStore";
import { useChartGradient } from "@/lib/sim/chartGradientStore";
import type { ChartSeries } from "@/components/market/MarketGraph";
import { LIVE_DOT_SIZE, LIVE_DOT_TEXT_GAP, LiveDot } from "@/components/sim/Crest";
import { HelmetIcon } from "@/components/sim/HelmetIcon";
import { BuildComboButton, BUILD_COMBO_STACK_GAP } from "@/components/sim/BuildComboButton";
import { ComboSheet, type ComboPick } from "@/components/sim/ComboSheet";
import { comboListPaddingBottom, useComboSheetHeight } from "@/lib/sim/comboSheetHeightStore";
import { mockCurrent, usePlacedPositions, positionMeta, setAutoSellTarget } from "@/lib/sim/positionsStore";
import { openBetSlip } from "@/lib/sim/betSlipStore";
import { useComboMode, useComboPageUnselectedChrome } from "@/lib/sim/comboFlowStore";
import { useCombinationsVisible } from "@/lib/sim/combinationsStore";
import { HeaderComboMark } from "@/components/sim/ComboMark";
import { toggleComboPick, removeComboPick, replaceComboPick, replacePickInList, clearComboPicks, useComboPicks } from "@/lib/sim/comboPicksStore";
import { comboOutcomeOn, comboPickAtSpreadIndex, comboSpreadPickerState } from "@/lib/sim/comboPickEdit";
import { comboAvatarFromTeam } from "@/lib/sim/comboTeamMark";
import { openCashOut } from "@/lib/sim/cashOutStore";
import { openAutoSell } from "@/lib/sim/autoSellStore";
import { ScrubOverlay } from "@/components/sim/ScoreChartUnit";
import { PositionCard } from "@/components/sim/CurrentPositionsCard";
import { MarketRulesSection } from "@/components/sim/MarketRulesSection";
import { MarketActionFooter, marketActionFooterSpace } from "@/components/sim/MarketActionFooter";
import { MarketDetailHeader, MARKET_DETAIL_NAV_H } from "@/components/sim/MarketDetailHeader";
import { MatchTitleScoreHeader } from "@/components/sim/MatchTitleScoreHeader";
import { ComboPositionCard } from "@/components/sim/ComboPositionCard";
import { useSpreadVariant } from "@/lib/sim/spreadVariantStore";
import { useBetRadius } from "@/lib/sim/pillButtonsStore";
import { outcomeButtonVisual } from "@/lib/sim/buttonStyle";
import { useFixedMarketActions } from "@/lib/sim/marketDetailActionsStore";
import { useFeedSettings } from "@/lib/sim/FeedSettingsContext";
import { MarketHelpSheet } from "@/components/sim/MarketHelpSheet";
import { SPREAD_HELP, totalHelp } from "@/components/sim/MatchMarkets";
import { smoothAreaPath, smoothPath } from "@/lib/sim/chartPath";
import { DOT, RippleDot } from "@/components/sim/RippleDot";
import { Crest } from "@/components/sim/Crest";
import { PositionAvatar } from "@/components/sim/PositionAvatar";
import { liveChatFooterReserve } from "@/components/sim/MarketLiveChat";
import { MarketPageBody } from "@/components/sim/MarketPageTabs";
import { MatchPositionsSection } from "@/components/sim/MatchPositionsSection";
import { FilterButton } from "@/components/sim/FilterButton";
import { MatchComboPicksCarousel } from "@/components/sim/CombinationsSection";
import type { Team } from "@/lib/sim/types";
import { ComboSelectedButton } from "@/components/sim/ComboGradient";
import { LinePicker } from "@/components/sim/LinePicker";
import { geist } from "@/lib/sim/geistFonts";
import { useDisplayFont, useOswaldDataSet } from "@/lib/sim/typefaceStore";
import { VolumeText } from "@/components/sim/VolumeText";

function ComboAwarePill({
  selected,
  onPress,
  label,
  color,
  height = 48,
  minWidth,
  flex,
  radius,
  paddingHorizontal,
  disabled,
  selectedFill,
  unselectedColor,
}: {
  selected: boolean;
  onPress: () => void;
  label: string;
  color: string;
  height?: number;
  minWidth?: number;
  flex?: number;
  radius: number;
  paddingHorizontal?: number;
  disabled?: boolean;
  selectedFill?: string;
  unselectedColor?: string;
}) {
  const comboMode = useComboMode();
  const unselectedChrome = useComboPageUnselectedChrome();
  if (comboMode) {
    return (
      <ComboSelectedButton
        selected={selected}
        onPress={onPress}
        label={label}
        radius={radius}
        height={height}
        minWidth={minWidth}
        flex={flex}
        paddingHorizontal={paddingHorizontal}
        fontSize={15}
        fontFamily={geist.semibold}
        unselectedColor={unselectedColor ?? color}
        unselectedChrome={unselectedChrome}
        labelForInk={label}
        disabled={disabled}
      />
    );
  }
  const visual = outcomeButtonVisual("default", "gray-colored", color, { mode: "muted-color", label });
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={{
        flex,
        minWidth,
        height,
        borderRadius: radius,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal,
        ...visual.container,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <Text style={[{ fontFamily: geist.semibold, fontSize: 15 }, visual.text]}>
        {label}
      </Text>
    </Pressable>
  );
}

// Positions tab: placed positions that reference this matchup; empty state
// says "No positions".
function GamePositions() {
  const placed = usePlacedPositions();
  // "Buy more" re-opens the combo ticket pre-loaded with the position's legs.
  const [slipPicks, setSlipPicks] = React.useState<ComboPick[]>([]);
  const names = ["Panthers", "Cardinals", "CAR", "ARI"];
  const mine = placed.filter((p) =>
    p.kind === "single"
      ? names.some((n) => (p.market ?? "").includes(n) || p.title.includes(n))
      : p.legs.some((l) => names.some((n) => l.label.includes(n))),
  );
  // No positions: hide the whole section (heading included).
  if (mine.length === 0) return null;
  return (
    <>
    <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Positions</Text>
    <View style={{ paddingHorizontal: 16, marginTop: 18, gap: 12 }}>
      {mine.map((p) => {
        if (p.kind === "combo")
          return (
            <ComboPositionCard
              key={p.id}
              position={p}
              onBuyMore={() =>
                setSlipPicks(
                  p.legs.map((leg, i) => ({
                    id: `${p.id}:${i}`,
                    category: leg.category,
                    categoryEmoji: leg.categoryEmoji,
                    label: leg.label,
                    color: leg.color,
                    cents: leg.cents,
                  })),
                )
              }
              onCashOut={() => {
                const { current } = mockCurrent(p);
                openCashOut({
                  tint: p.legs[0]?.color ?? colors.green,
                  title: `${p.legs.length} market combination`,
                  sub: `$${p.cost.toFixed(2)} used`,
                  current,
                  cost: p.cost,
                  cents: p.legs[0]?.cents ?? 50,
                  combo: true,
                });
              }}
            />
          );
        const { current, changePct } = mockCurrent(p);
        const autoSellEnabled = p.orderType === "limit";
        return (
          <PositionCard
            key={p.id}
            avatar={<HelmetIcon color={uxrPaletteColor(p.color)} size={40} />}
            title={p.market ?? p.title}
            meta={positionMeta(p.title.split(" \u00b7 ")[0], p.cents)}
            value={`$${current.toFixed(2)}`}
            changeText={`+${changePct.toFixed(2)}%`}
            positive
            onBuyMore={() => openBetSlip({ title: p.title, market: p.market, oddsCents: p.cents, color: p.color, side: "yes", returnTo: "/game-detail" })}
            onCashOut={() =>
              openCashOut({
                tint: uxrPaletteColor(p.color),
                title: p.market ?? p.title,
                sub: positionMeta(p.title.split(" \u00b7 ")[0], p.cents),
                current,
                cost: p.cost,
                cents: p.cents,
              })
            }
            onAutoSell={
              autoSellEnabled
                ? () =>
                    openAutoSell({
                      tint: uxrPaletteColor(p.color),
                      cost: current,
                      toWin: p.cost + p.toWin,
                      onSet: (target) => setAutoSellTarget(p.id, target),
                    })
                : undefined
            }
            autoSellTarget={autoSellEnabled ? p.autoSellAt : undefined}
          />
        );
      })}
      {slipPicks.length > 0 && (
        <ComboSheet
          key={slipPicks.map((x) => x.id).join(",")}
          picks={slipPicks}
          onRemove={(id) => setSlipPicks((prev) => prev.filter((x) => x.id !== id))}
          onReplace={(id, next) => setSlipPicks((prev) => replacePickInList(prev, id, next))}
          onClear={() => setSlipPicks([])}
          onClose={() => setSlipPicks([])}
          initialScreen={1}
          returnTo="/game-detail"
        />
      )}
    </View>
    </>
  );
}

// UXR NFL game detail page (Panthers vs Cardinals). Two header treatments,
// switched by the `hv` route param:
//   hv=1 (default) — nav row holds the matchup title; the score strip below
//     puts the LIVE clock between the two scores.
//   hv=2 — nav row holds the LIVE clock; the score strip shows named team logos
//     flanking a big center "21 - 0".
// On scroll both collapse to the same fixed nav: LIVE clock over
// "Panthers [21] – [0] Cardinals" boxed scores.

const CAR: Team = {
  abbr: "CAR",
  name: "Panthers",
  initial: "P",
  pct: "53%",
  color: marketAccentColor("#0085ca"),
  logo: "https://a.espncdn.com/i/teamlogos/nfl/500/car.png",
  score: 21,
};
const ARI: Team = {
  abbr: "ARI",
  name: "Cardinals",
  initial: "C",
  pct: "47%",
  color: marketAccentColor("#97233f"),
  logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ari.png",
  score: 0,
};
const CLOCK = "Q1 12:22";

function slipOutcomeName(label: string) {
  return label.split(" \u00b7 ")[0].replace(/\s+\d+\u00a2$/, "").trim();
}

function slipMatchupTitle(label: string, dotted = true) {
  const vs = dotted ? `${CAR.name} vs. ${ARI.name}` : `${CAR.name} vs ${ARI.name}`;
  return `${slipOutcomeName(label)} \u00b7 ${vs}`;
}

const SERIES: ChartSeries[] = [
  {
    label: "Panthers",
    color: CAR.color,
    points: [0.62, 0.64, 0.61, 0.65, 0.67, 0.64, 0.68, 0.71, 0.68, 0.63, 0.62, 0.55, 0.4, 0.44, 0.53],
  },
  {
    label: "Cardinals",
    color: ARI.color,
    points: [0.2, 0.22, 0.21, 0.25, 0.27, 0.26, 0.3, 0.29, 0.33, 0.35, 0.36, 0.44, 0.58, 0.54, 0.47],
  },
];

// MetaMask wordmark (attached mm.svg), 49x24 viewBox.
const MM_WORDMARK_PATH =
  "M27.4896 18.5169V23.7777H24.7728V20.1329L21.6768 20.4929C20.9968 20.5713 20.6976 20.7937 20.6976 21.2033C20.6976 21.8033 21.2656 22.0561 22.4832 22.0561C23.2256 22.0561 24.048 21.9457 24.7744 21.7553L23.368 23.7457C22.8 23.8721 22.2464 23.9345 21.6624 23.9345C19.1984 23.9345 17.792 22.9553 17.792 21.2177C17.792 19.6849 18.8976 18.8801 21.4096 18.5953L24.728 18.2097C24.5488 17.2449 23.8208 16.8257 22.3728 16.8257C21.0144 16.8257 19.5136 17.1729 18.1712 17.8209L18.5984 15.4673C19.8464 14.9457 21.2688 14.6769 22.7056 14.6769C25.8656 14.6769 27.4928 15.9889 27.4928 18.5153L27.4896 18.5169ZM3.04956 11.9297L0.0799561 23.7777H3.04956L4.52316 17.8241L7.07836 20.8865H10.1744L12.7296 17.8241L14.2032 23.7777H17.1728L14.2032 11.9281L8.62556 18.5521L3.04796 11.9281L3.04956 11.9297ZM14.2032 0.0800781L8.62556 6.70408L3.04956 0.0800781L0.0799561 11.9297H3.04956L4.52316 5.97608L7.07836 9.03848H10.1744L12.7296 5.97608L14.2032 11.9297H17.1728L14.2032 0.0800781ZM34.6304 18.4065L32.2288 18.0593C31.6288 17.9649 31.392 17.7745 31.392 17.4433C31.392 16.9057 31.976 16.6689 33.1776 16.6689C34.568 16.6689 35.816 16.9537 37.128 17.5697L36.7968 15.2481C35.7376 14.8689 34.5216 14.6801 33.2576 14.6801C30.304 14.6801 28.6912 15.7073 28.6912 17.5553C28.6912 18.9937 29.576 19.7985 31.456 20.0833L33.8896 20.4465C34.5056 20.5409 34.7584 20.7777 34.7584 21.1569C34.7584 21.6945 34.1904 21.9473 33.0368 21.9473C31.52 21.9473 29.8768 21.5841 28.5344 20.9361L28.8032 23.2577C29.9568 23.6849 31.4576 23.9377 32.864 23.9377C35.8976 23.9377 37.4768 22.8785 37.4768 20.9985C37.4768 19.4977 36.592 18.6913 34.6336 18.4081L34.6304 18.4065ZM38.5328 12.9873V23.7777H41.2496V12.9873H38.5328ZM44.424 18.9281L48.2016 14.8353H44.8208L41.2496 19.0689L45.0576 23.7761H48.4864L44.424 18.9265V18.9281ZM38.1536 9.36968C38.1536 11.1073 39.56 12.0865 42.024 12.0865C42.608 12.0865 43.1616 12.0225 43.7296 11.8977L45.136 9.90728C44.4096 10.0961 43.5872 10.2081 42.8448 10.2081C41.6288 10.2081 41.0592 9.95528 41.0592 9.35528C41.0592 8.94408 41.36 8.72328 42.0384 8.64488L45.1344 8.28488V11.9297H47.8512V6.66888C47.8512 4.14088 46.224 2.83048 43.064 2.83048C41.6256 2.83048 40.2048 3.09928 38.9568 3.62088L38.5296 5.97448C39.872 5.32648 41.3728 4.97928 42.7312 4.97928C44.1792 4.97928 44.9072 5.39848 45.0864 6.36328L41.768 6.74888C39.256 7.03368 38.1504 7.83848 38.1504 9.37128L38.1536 9.36968ZM30.5552 8.80168C30.5552 10.9825 31.8192 12.0881 34.3152 12.0881C35.3104 12.0881 36.1328 11.9297 36.9216 11.5665L37.2688 9.18088C36.5104 9.63848 35.736 9.87528 34.9616 9.87528C33.792 9.87528 33.2704 9.40168 33.2704 8.34248V5.18248H37.3936V2.98728H33.2704V1.12328L28.104 3.85608V5.18248H30.552V8.80008L30.5552 8.80168ZM27.8848 7.80648V8.34408H20.5424C20.8736 9.43848 21.8576 9.93928 23.6048 9.93928C24.9952 9.93928 26.2912 9.65448 27.4432 9.10248L27.112 11.4097C26.0528 11.8513 24.7104 12.0897 23.336 12.0897C19.6864 12.0897 17.696 10.4785 17.696 7.49288C17.696 4.50728 19.7184 2.83208 22.8464 2.83208C25.9744 2.83208 27.8864 4.64968 27.8864 7.80808L27.8848 7.80648ZM20.5072 6.51048H25.1504C24.9056 5.46248 24.1008 4.91528 22.8144 4.91528C21.528 4.91528 20.7648 5.44808 20.5072 6.51048Z";

const PERIODS = ["LIVE", "1D", "1W", "1M", "1Y"];

// Stepped "staircase" path (per the approved reference): hold each value
// horizontally, then jump vertically at the tick — odds move in discrete
// steps, not a smooth wave. Sub-steps between data points add the dense
// small-tick texture of the reference image.
function stepPath(points: number[], w: number, h: number): string {
  if (points.length === 0 || w <= 0) return "";
  // Interpolate sub-ticks between data points with a deterministic wobble,
  // then QUANTIZE to discrete levels — collapsing near-equal values into
  // flat plateaus like the reference (long holds, occasional jumps).
  const LEVEL = 0.045;
  const fine: number[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    for (let k = 0; k < 3; k++) {
      const t = k / 3;
      const wobble = Math.sin((i * 3 + k) * 2.9) * 0.018;
      fine.push(a + (b - a) * t + wobble);
    }
  }
  fine.push(points[points.length - 1]);
  const n = fine.length;
  const dx = w / (n - 1);
  const y = (v: number) =>
    (1 - Math.max(0.02, Math.min(0.98, Math.round(v / LEVEL) * LEVEL))) * h;
  // Build the staircase as a polyline of corner vertices (hold horizontally,
  // then move vertically at each tick)…
  const vx: number[] = [0];
  const vy: number[] = [y(fine[0])];
  for (let i = 1; i < n; i++) {
    const yy = y(fine[i]);
    const prevY = vy[vy.length - 1];
    if (Math.abs(yy - prevY) < 0.5) continue; // extend the current plateau
    vx.push(i * dx, i * dx);
    vy.push(prevY, yy);
  }
  vx.push(w);
  vy.push(vy[vy.length - 1]);
  // …then trace it with rounded corners (quadratic through each vertex) so
  // every step reads as a soft S-bend instead of a hard 90° notch.
  const R = 7;
  let d = `M ${vx[0].toFixed(2)} ${vy[0].toFixed(2)}`;
  for (let i = 1; i < vx.length - 1; i++) {
    const x0 = vx[i - 1], y0 = vy[i - 1];
    const x1 = vx[i], y1 = vy[i];
    const x2 = vx[i + 1], y2 = vy[i + 1];
    const inLen = Math.hypot(x1 - x0, y1 - y0);
    const outLen = Math.hypot(x2 - x1, y2 - y1);
    const r = Math.min(R, inLen / 2, outLen / 2);
    const ax = x1 - ((x1 - x0) / (inLen || 1)) * r;
    const ay = y1 - ((y1 - y0) / (inLen || 1)) * r;
    const bx = x1 + ((x2 - x1) / (outLen || 1)) * r;
    const by = y1 + ((y2 - y1) / (outLen || 1)) * r;
    d += ` L ${ax.toFixed(2)} ${ay.toFixed(2)} Q ${x1.toFixed(2)} ${y1.toFixed(2)} ${bx.toFixed(2)} ${by.toFixed(2)}`;
  }
  d += ` L ${vx[vx.length - 1].toFixed(2)} ${vy[vy.length - 1].toFixed(2)}`;
  return d;
}

// Live endpoint: solid dot with a ring that ripples outward on a loop.

// ------------------------------------------------------------- game markets
// Each market: two outcomes; line markets carry a stepper of alternate lines.
// Prices are per-line; "--" (undefined) rows render disabled, like the ref.

type Outcome = { key: string; label: string; cents?: number; color: string; dark: string };
type LineMarket = {
  id: string;
  title: string;
  vol: string;
  lines?: number[]; // stepper values; label templates resolve per line
  defaultLine?: number;
  outcomes: (line: number | undefined) => [Outcome, Outcome];
};

const CENTS = (a?: number) => a;
const MARKETS: LineMarket[] = [
  {
    id: "ml",
    title: "Moneyline",
    vol: "$81.5K Vol.",
    outcomes: () => [
      { key: "car", label: `${CAR.abbr} · 53¢`, cents: 53, color: CAR.color, dark: "#0C3246" },
      { key: "ari", label: `${ARI.abbr} · 47¢`, cents: 47, color: ARI.color, dark: "#571622" },
    ],
  },
  {
    id: "spread",
    title: "Spread",
    vol: "$8.2K Vol.",
    lines: [0.5, 1.5, 2.5, 3.5],
    defaultLine: 0.5,
    outcomes: (line) => [
      { key: "car", label: `${CAR.abbr} · +${line}`, cents: 62, color: CAR.color, dark: "#0C3246" },
      { key: "ari", label: `${ARI.abbr} · +${line}`, cents: 41, color: ARI.color, dark: "#571622" },
    ],
  },
  {
    id: "total",
    title: "Total Points",
    vol: "$114 Vol.",
    lines: [43.5, 44.5, 45.5],
    defaultLine: 44.5,
    outcomes: (line) => [
      { key: "over", label: `O ${line}`, cents: line === 44.5 ? 55 : undefined, color: colors.green, dark: "#1C2B00" },
      { key: "under", label: `U ${line}`, cents: line === 44.5 ? 48 : undefined, color: "#D9C7FF", dark: "#2A1650" },
    ],
  },
];

// --------------------------------------------------------------- prop markets
// Player props: over/under markets reuse the LineMarket shape (line stepper +
// two outcome pills) with realistic per-line prices (over decays as the line
// climbs; under is the complement, minus a small vig).
// (OVER_COLOR / UNDER_COLOR are shared with the totals card, declared below.)
const OVER_DARK = "#1C2B00";
const UNDER_DARK = "#2A1650";

function propOU(
  id: string,
  title: string,
  vol: string,
  lines: number[],
  defaultLine: number,
  anchorOver: number,
  slope: number, // cents the Over loses per unit of line
): LineMarket {
  return {
    id,
    title,
    vol,
    lines,
    defaultLine,
    outcomes: (line) => {
      const l = line ?? defaultLine;
      const over = Math.max(3, Math.min(96, Math.round(anchorOver - (l - defaultLine) * slope)));
      const under = Math.max(3, Math.min(96, 103 - over)); // ~3¢ combined vig
      return [
        { key: "over", label: `O ${l} · ${over}¢`, cents: over, color: OVER_COLOR, dark: OVER_DARK },
        { key: "under", label: `U ${l} · ${under}¢`, cents: under, color: UNDER_COLOR, dark: UNDER_DARK },
      ];
    },
  };
}

// Dense line strip for the swipeable picker: center ± 10 steps.
const propLines = (center: number, step: number) =>
  Array.from({ length: 21 }, (_, i) => center + (i - 10) * step);

const PROP_MARKETS: LineMarket[] = [
  propOU("byoung-pass", "Bryce Young Passing Yards", "$24.1K Vol.", propLines(249.5, 5), 249.5, 54, 0.62),
  propOU("kmurray-pass", "Kyler Murray Passing Yards", "$18.7K Vol.", propLines(255.5, 5), 255.5, 49, 0.62),
  propOU("hubbard-rush", "Chuba Hubbard Rushing Yards", "$9.3K Vol.", propLines(64.5, 5), 64.5, 57, 1.1),
  propOU("conner-rush", "James Conner Rushing Yards", "$7.8K Vol.", propLines(69.5, 5), 69.5, 52, 1.1),
  propOU("mcbride-rec", "Trey McBride Receiving Yards", "$5.4K Vol.", propLines(59.5, 5), 59.5, 55, 1.2),
];

// Anytime touchdown scorer: one card, a row per player with a Yes price.
type TdScorer = { key: string; name: string; team: typeof CAR; cents: number };
const TD_SCORERS: TdScorer[] = [
  { key: "hubbard", name: "Chuba Hubbard", team: CAR, cents: 46 },
  { key: "conner", name: "James Conner", team: ARI, cents: 41 },
  { key: "mcbride", name: "Trey McBride", team: ARI, cents: 34 },
  { key: "johnston", name: "Xavier Legette", team: CAR, cents: 28 },
  { key: "harrison", name: "Marvin Harrison Jr.", team: ARI, cents: 27 },
  { key: "thielen", name: "Adam Thielen", team: CAR, cents: 24 },
];

// ------------------------------------------------------ spread swipe picker
// Simpler Spread UI (per approved reference): one swipeable strip of lines —
// CAR lines to the LEFT of a center divider, ARI lines to the RIGHT — and the
// primary buttons are Yes / No for the sentence "{TEAM} wins by more than
// {line} points". Swiping (or tapping a number) picks both team and line.

type SpreadEntry = { team: typeof CAR; line: number; yes: number };
const SPREAD_LINES = Array.from({ length: 33 }, (_, i) => i + 0.5); // 0.5 … 32.5
// Yes prices decay smoothly from the 0.5-line anchor toward 1¢ at the far
// lines (replaces the old 4-entry lookup table now that lines run to 32.5).
function spreadYes(anchor: number, line: number): number {
  const decayed = Math.round(anchor * Math.exp(-(line - 0.5) * 0.22));
  return Math.max(1, Math.min(99, decayed));
}
const SPREAD_YES: Record<string, Record<number, number>> = {
  car: Object.fromEntries(SPREAD_LINES.map((l) => [l, spreadYes(62, l)])),
  ari: Object.fromEntries(SPREAD_LINES.map((l) => [l, spreadYes(41, l)])),
};
// CAR descending, then ARI ascending (mirrored around the divider).
const SPREAD_ENTRIES: SpreadEntry[] = [
  ...SPREAD_LINES.slice().reverse().map((l) => ({ team: CAR, line: l, yes: SPREAD_YES.car[l] })),
  ...SPREAD_LINES.map((l) => ({ team: ARI, line: l, yes: SPREAD_YES.ari[l] })),
];
const SPREAD_LABELS = SPREAD_ENTRIES.map((en) => String(en.line));

// Total Points shares the spread's line-strip pattern: one long strip of
// point lines (no team divider), default 44.5. Over price decays as the line
// climbs; Under is the complement.
const TOTAL_LINES = Array.from({ length: 31 }, (_, i) => i + 30.5); // 30.5 … 60.5
function totalOver(line: number): number {
  return Math.max(1, Math.min(99, Math.round(55 - (line - 44.5) * 3.5)));
}
const TOTAL_DEFAULT_INDEX = TOTAL_LINES.indexOf(44.5);
const TOTAL_LABELS = TOTAL_LINES.map((l) => String(l));
const OVER_COLOR = colors.green;
const UNDER_COLOR = "#D9C7FF";

// "Team rows" spread variant (default, per approved reference): "Spreads"
// title + one row per team (name, team-color underline scaled by price,
// signed line, cents pill). Swiping the same line strip updates both rows.
function SpreadRowsCard({
  selectedId,
  onToggle,
}: {
  selectedId?: string;
  onToggle: (pick: ComboPick) => void;
}) {
  const comboPicks = useComboPicks();
  const stored = selectedId ? comboPicks.find((p) => p.id === selectedId) : undefined;
  const withLines = stored ? { ...stored, lines: stored.lines?.length ? stored.lines : SPREAD_LINES } : undefined;
  const strip = withLines ? comboSpreadPickerState(withLines) : null;
  const [browseIdx, setBrowseIdx] = useState(SPREAD_LINES.length);
  const [help, setHelp] = useState(false);
  const betR = useBetRadius();
  const idx = strip?.index ?? browseIdx;
  const en = SPREAD_ENTRIES[idx];
  // Selected team covers the spread at +line for en.yes¢; the other side is
  // the complement at -line.
  const rows = [CAR, ARI].map((team) => {
    const isSel = team.abbr === en.team.abbr;
    const cents = isSel ? en.yes : 100 - en.yes;
    return { team, cents, lineLabel: `${isSel ? "+" : "-"}${en.line}`, isSel };
  });
  return (
    <View
      style={{
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "rgba(255,255,255,0.08)",
        paddingTop: 16,
        paddingHorizontal: 16,
        paddingBottom: 0,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontFamily: geist.semibold, fontSize: 16, lineHeight: 21, color: colors.textPrimary }}>
          Spreads
        </Text>
        <Pressable hitSlop={8} onPress={() => setHelp(true)}>
          <Feather name="help-circle" size={18} color={colors.textMuted} />
        </Pressable>
        <MarketHelpSheet visible={help} title="What's a spread?" paragraphs={SPREAD_HELP} onClose={() => setHelp(false)} />
      </View>
      <View style={{ marginTop: 14, gap: 14 }}>
        {rows.map(({ team, cents, lineLabel, isSel }) => {
          const id = `spread:${isSel ? "yes" : "no"}@${en.team.abbr}${en.line}:${team.abbr}`;
          const selected = comboOutcomeOn(comboPicks, id);
          return (
            <View key={team.abbr} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: geist.medium, fontSize: 16, lineHeight: 21, color: colors.textPrimary }}>
                  {team.abbr}
                </Text>
                {/* Underline length tracks the price so the favored side reads longer. */}
                <View
                  style={{
                    marginTop: 6,
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: team.color,
                    width: `${Math.max(10, cents)}%`,
                  }}
                />
              </View>
              <Text style={{ fontFamily: geist.medium, fontSize: 15, color: colors.textPrimary }}>
                {lineLabel}
              </Text>
              <ComboAwarePill
                selected={selected}
                onPress={() =>
                  onToggle({
                    id,
                    category: "Pro Football",
                    categoryEmoji: "\u{1F3C8}",
                    label: `${team.abbr} ${lineLabel} \u00b7 ${CAR.name} vs ${ARI.name}`,
                    color: team.color,
                    cents,
                    kind: "spread",
                    line: en.line,
                    lines: SPREAD_LINES,
                    avatar: team.logo ? { uri: team.logo } : undefined,
                    alt: {
                      id: `spread:${isSel ? "no" : "yes"}@${en.team.abbr}${en.line}:${team === CAR ? ARI.abbr : CAR.abbr}`,
                      label: `${team === CAR ? ARI.abbr : CAR.abbr} ${isSel ? "-" : "+"}${en.line} \u00b7 ${CAR.name} vs ${ARI.name}`,
                      color: team === CAR ? ARI.color : CAR.color,
                      cents: 100 - cents,
                      avatar: { uri: (team === CAR ? ARI : CAR).logo! },
                    },
                  })
                }
                label={`${cents}\u00a2`}
                color={team.color}
                height={44}
                minWidth={72}
                radius={betR}
                paddingHorizontal={14}
              />
            </View>
          );
        })}
      </View>
      <View style={{ marginTop: 12 }}>
        <LinePicker
          labels={SPREAD_LABELS}
          dividerAt={SPREAD_LINES.length}
          index={idx}
          onIndex={(i) => {
            if (withLines) {
              replaceComboPick(withLines.id, comboPickAtSpreadIndex(withLines, i));
              return;
            }
            setBrowseIdx(i);
          }}
          dividerColors={[CAR.color, ARI.color]}
        />
      </View>
    </View>
  );
}

// Total Points, "rows" variant — same styling as SpreadRowsCard: title row
// with help icon, Over/Under rows (label, colored underline scaled by price,
// cents pill), and the shared swipeable line strip below.
function TotalRowsCard({
  onToggle,
}: {
  selectedId?: string;
  onToggle: (pick: ComboPick) => void;
}) {
  const comboPicks = useComboPicks();
  const [idx, setIdx] = useState(TOTAL_DEFAULT_INDEX);
  const betR = useBetRadius();
  const [help, setHelp] = useState(false);
  const line = TOTAL_LINES[idx];
  const over = totalOver(line);
  const rows = [
    { key: "over", label: "Over", cents: over, color: OVER_COLOR },
    { key: "under", label: "Under", cents: 100 - over, color: UNDER_COLOR },
  ];
  return (
    <View
      style={{
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "rgba(255,255,255,0.08)",
        paddingTop: 16,
        paddingHorizontal: 16,
        paddingBottom: 0,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontFamily: geist.semibold, fontSize: 16, lineHeight: 21, color: colors.textPrimary }}>
          Total Points
        </Text>
        <Pressable hitSlop={8} onPress={() => setHelp(true)}>
          <Feather name="help-circle" size={18} color={colors.textMuted} />
        </Pressable>
        <MarketHelpSheet visible={help} title="What's a totals market?" paragraphs={totalHelp("points")} onClose={() => setHelp(false)} />
      </View>
      <View style={{ marginTop: 14, gap: 14 }}>
        {rows.map((r) => {
          const id = `total:${r.key}@${line}`;
          const selected = comboOutcomeOn(comboPicks, id);
          return (
            <View key={r.key} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: geist.medium, fontSize: 16, lineHeight: 21, color: colors.textPrimary }}>
                  {r.label}
                </Text>
                <View
                  style={{
                    marginTop: 6,
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: r.color,
                    width: `${Math.max(10, r.cents)}%`,
                  }}
                />
              </View>
              <Text style={{ fontFamily: geist.medium, fontSize: 15, color: colors.textPrimary }}>
                {`${r.key === "over" ? "O" : "U"} ${line}`}
              </Text>
              <ComboAwarePill
                selected={selected}
                onPress={() =>
                  onToggle({
                    id,
                    category: "Pro Football",
                    categoryEmoji: "\u{1F3C8}",
                    label: `${r.label} ${line} \u00b7 ${CAR.name} vs ${ARI.name}`,
                    color: r.color,
                    cents: r.cents,
                    kind: "ou",
                    sport: "americanFootball",
                    line,
                    lines: TOTAL_LINES,
                    avatar: comboAvatarFromTeam(r.key === "over" ? CAR : ARI),
                    alt: {
                      id: `total:${r.key === "over" ? "under" : "over"}@${line}`,
                      label: `${r.key === "over" ? "Under" : "Over"} ${line} \u00b7 ${CAR.name} vs ${ARI.name}`,
                      color: r.key === "over" ? UNDER_COLOR : OVER_COLOR,
                      cents: 100 - r.cents,
                      avatar: comboAvatarFromTeam(r.key === "over" ? ARI : CAR),
                    },
                  })
                }
                label={`${r.cents}\u00a2`}
                color={r.color}
                height={44}
                minWidth={72}
                radius={betR}
                paddingHorizontal={14}
              />
            </View>
          );
        })}
      </View>
      <View style={{ marginTop: 12 }}>
        <LinePicker labels={TOTAL_LABELS} index={idx} onIndex={setIdx} />
      </View>
    </View>
  );
}

// Total Points, "sentence" variant — mirrors the spread sentence card:
// "Total points will be more than {line}" + Yes / No buttons + line strip.
function TotalSentenceCard({
  onToggle,
}: {
  selectedId?: string;
  onToggle: (pick: ComboPick) => void;
}) {
  const comboPicks = useComboPicks();
  const [idx, setIdx] = useState(TOTAL_DEFAULT_INDEX);
  const betR = useBetRadius();
  const line = TOTAL_LINES[idx];
  const yes = totalOver(line);
  const no = 100 - yes;
  const pill = (kind: "yes" | "no") => {
    const cents = kind === "yes" ? yes : no;
    const color = kind === "yes" ? colors.green : colors.red;
    const id = `total:${kind}@${line}`;
    const selected = comboOutcomeOn(comboPicks, id);
    return (
      <ComboAwarePill
        key={kind}
        selected={selected}
        onPress={() =>
          onToggle({
            id,
            category: "Pro Football",
            categoryEmoji: "\u{1F3C8}",
            label: `${kind === "yes" ? "Over" : "Under"} ${line} \u00b7 ${CAR.name} vs ${ARI.name}`,
            color,
            cents,
            kind: "ou",
            sport: "americanFootball",
            line,
            lines: TOTAL_LINES,
            avatar: comboAvatarFromTeam(kind === "yes" ? CAR : ARI),
            alt: {
              id: `total:${kind === "yes" ? "no" : "yes"}@${line}`,
              label: `${kind === "yes" ? "Under" : "Over"} ${line} \u00b7 ${CAR.name} vs ${ARI.name}`,
              color: kind === "yes" ? colors.red : colors.green,
              cents: kind === "yes" ? no : yes,
              avatar: comboAvatarFromTeam(kind === "yes" ? ARI : CAR),
            },
          })
        }
        label={`${kind === "yes" ? "Yes" : "No"} \u00b7 ${cents}\u00a2`}
        color={color}
        height={48}
        flex={1}
        radius={betR}
      />
    );
  };
  return (
    <View
      style={{
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "rgba(255,255,255,0.08)",
        paddingTop: 16,
        paddingHorizontal: 16,
        paddingBottom: 0,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 5 }}>
        <Text style={{ fontFamily: geist.regular, fontSize: 16, lineHeight: 21, color: colors.textMuted }}>
          Total points will be more than
        </Text>
        <Text style={{ fontFamily: geist.semibold, fontSize: 16, lineHeight: 21, color: colors.textPrimary }}>
          {line}
        </Text>
      </View>
      <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
        {pill("yes")}
        {pill("no")}
      </View>
      <View style={{ marginTop: 12 }}>
        <LinePicker labels={TOTAL_LABELS} index={idx} onIndex={setIdx} />
      </View>
    </View>
  );
}

function SpreadCard({
  selectedId,
  onToggle,
}: {
  selectedId?: string;
  onToggle: (pick: ComboPick) => void;
}) {
  const comboPicks = useComboPicks();
  const stored = selectedId ? comboPicks.find((p) => p.id === selectedId) : undefined;
  const withLines = stored ? { ...stored, lines: stored.lines?.length ? stored.lines : SPREAD_LINES } : undefined;
  const strip = withLines ? comboSpreadPickerState(withLines) : null;
  const [browseIdx, setBrowseIdx] = useState(SPREAD_LINES.length);
  const betR = useBetRadius();
  const idx = strip?.index ?? browseIdx;
  const en = SPREAD_ENTRIES[idx];
  const yes = en.yes;
  const no = 100 - yes;
  const pill = (kind: "yes" | "no") => {
    const cents = kind === "yes" ? yes : no;
    const color = kind === "yes" ? colors.green : colors.red;
    const id = `spread:${kind}@${en.team.abbr}${en.line}`;
    const selected = comboOutcomeOn(comboPicks, id);
    return (
      <ComboAwarePill
        key={kind}
        selected={selected}
        onPress={() =>
          onToggle({
            id,
            category: "Pro Football",
            categoryEmoji: "\u{1F3C8}",
            label: `${kind === "yes" ? "Yes" : "No"} \u00b7 ${en.team.abbr} +${en.line} \u00b7 ${CAR.name} vs ${ARI.name}`,
            color,
            cents,
            kind: "spread",
            line: en.line,
            lines: SPREAD_LINES,
          })
        }
        label={`${kind === "yes" ? "Yes" : "No"} \u00b7 ${cents}\u00a2`}
        color={color}
        height={48}
        flex={1}
        radius={betR}
      />
    );
  };
  return (
    <View
      style={{
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "rgba(255,255,255,0.08)",
        paddingTop: 16,
        paddingHorizontal: 16,
        // No padding below the caret — it sits flush with the card edge.
        paddingBottom: 0,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 5 }}>
        <Text style={{ fontFamily: geist.semibold, fontSize: 16, lineHeight: 21, color: colors.textPrimary }}>
          {en.team.abbr}
        </Text>
        <Text style={{ fontFamily: geist.regular, fontSize: 16, lineHeight: 21, color: colors.textMuted }}>
          wins by more than
        </Text>
        <Text style={{ fontFamily: geist.semibold, fontSize: 16, lineHeight: 21, color: colors.textPrimary }}>
          {en.line}
        </Text>
        <Text style={{ fontFamily: geist.regular, fontSize: 16, lineHeight: 21, color: colors.textMuted }}>
          points
        </Text>
      </View>
      <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
        {pill("yes")}
        {pill("no")}
      </View>
      <View style={{ marginTop: 12 }}>
        <LinePicker
          labels={SPREAD_LABELS}
          dividerAt={SPREAD_LINES.length}
          index={idx}
          onIndex={(i) => {
            if (withLines) {
              replaceComboPick(withLines.id, comboPickAtSpreadIndex(withLines, i));
              return;
            }
            setBrowseIdx(i);
          }}
          dividerColors={[CAR.color, ARI.color]}
        />
      </View>
    </View>
  );
}

// Anytime TD scorer: a row per player — name + team, and a Yes-price pill on
// the right that selects/deselects like the other market buttons.
function TdScorerCard({
  selectedId,
  onToggle,
}: {
  selectedId?: string;
  onToggle: (pick: ComboPick) => void;
}) {
  // Respect the button-shape setting: rounded rectangle by default, pill when on.
  const betR = useBetRadius();
  return (
    <View style={{ borderRadius: 16, backgroundColor: "rgba(255,255,255,0.08)", padding: 16 }}>
      <Text style={{ fontFamily: geist.semibold, fontSize: 17, lineHeight: 22, color: colors.textPrimary }}>
        Anytime Touchdown Scorer
      </Text>
      <VolumeText style={{ fontSize: 13, lineHeight: 17, marginTop: 2 }}>
        $12.6K Vol.
      </VolumeText>
      <View style={{ marginTop: 8 }}>
        {TD_SCORERS.map((p, i) => {
          const id = `td:${p.key}`;
          const selected = selectedId === id;
          return (
            <View
              key={p.key}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
              }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ fontFamily: geist.medium, fontSize: 15, lineHeight: 20, color: colors.textPrimary }}>
                  {p.name}
                </Text>
                <Text style={{ fontFamily: geist.regular, fontSize: 12, lineHeight: 16, color: p.team.color, marginTop: 1 }}>
                  {p.team.abbr}
                </Text>
              </View>
              <ComboAwarePill
                selected={selected}
                onPress={() =>
                  onToggle({
                    id,
                    category: "Pro Football",
                    categoryEmoji: "\u{1F3C8}",
                    label: `${p.name} · Anytime TD`,
                    color: p.team.color,
                    cents: p.cents,
                  })
                }
                label={`${p.cents}¢`}
                color={p.team.color}
                height={40}
                minWidth={72}
                radius={betR === 999 ? 999 : 12}
                paddingHorizontal={16}
                unselectedColor={colors.textPrimary}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

function MarketCard({
  market,
  selectedId,
  onToggle,
}: {
  market: LineMarket;
  selectedId?: string;
  onToggle: (pick: ComboPick) => void;
}) {
  const [line, setLine] = useState(market.defaultLine);
  const betR = useBetRadius();
  // Spread sentence: which team the "wins by more than" line refers to.
  const [flip, setFlip] = useState(false);
  const lines = market.lines;
  const idx = lines && line !== undefined ? lines.indexOf(line) : -1;
  const [a, b] = market.outcomes(line);
  const isSpread = market.id === "spread";
  const sentenceTeam = flip ? ARI : CAR;

  const pillFor = (o: Outcome) => {
    const color = marketAccentColor(o.color);
    const id = `${market.id}:${o.key}${line !== undefined ? `@${line}` : ""}`;
    const selected = selectedId === id;
    const disabled = o.cents === undefined;
    return (
      <ComboAwarePill
        key={o.key}
        selected={selected}
        disabled={disabled}
        onPress={() =>
          onToggle({
            id,
            category: "Pro Football",
            categoryEmoji: "\u{1F3C8}",
            label: slipMatchupTitle(o.label, false),
            color,
            cents: o.cents ?? 0,
          })
        }
        label={o.cents !== undefined || isSpread ? o.label : `${o.label}  --`}
        color={color}
        height={48}
        flex={1}
        radius={betR}
        selectedFill={market.id === "total" ? "#ffffff" : undefined}
      />
    );
  };

  return (
    <View
      style={{
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "rgba(255,255,255,0.08)",
        paddingTop: 16,
        paddingHorizontal: 16,
        paddingBottom: lines && idx >= 0 ? 0 : 16,
      }}
    >
      <Text style={{ fontFamily: geist.semibold, fontSize: 17, lineHeight: 22, color: colors.textPrimary }}>
        {market.title}
      </Text>
      {isSpread ? (
        <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
          <Pressable onPress={() => setFlip((f) => !f)} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ fontFamily: geist.medium, fontSize: 15, lineHeight: 20, color: sentenceTeam.color }}>
              {sentenceTeam.name}
            </Text>
            <Feather name="repeat" size={14} color={colors.textMuted} />
          </Pressable>
          <Text style={{ fontFamily: geist.regular, fontSize: 15, lineHeight: 20, color: colors.textMuted }}>
            wins by more than
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
            <Text style={{ fontFamily: geist.semibold, fontSize: 15, lineHeight: 20, color: colors.textPrimary }}>{line}</Text>
            <Feather name="chevron-down" size={14} color={colors.textMuted} />
          </View>
          <Text style={{ fontFamily: geist.regular, fontSize: 15, lineHeight: 20, color: colors.textMuted }}>points</Text>
        </View>
      ) : (
        <VolumeText style={{ fontSize: 13, lineHeight: 17, marginTop: 2 }}>
          {market.vol}
        </VolumeText>
      )}
      {/* Split probability bar (feed style) — sides match the button colors. */}
      {a.cents !== undefined && b.cents !== undefined && (
        <View style={{ flexDirection: "row", gap: 4, width: "100%", height: 2, marginTop: 14 }}>
          {[a, b].map((o, i) => (
            <View
              key={i}
              style={{
                flexGrow: 0,
                flexShrink: 1,
                flexBasis: `${Math.round(((o.cents ?? 0) / ((a.cents ?? 0) + (b.cents ?? 0))) * 100)}%`,
                height: 2,
                borderRadius: 999,
                backgroundColor: marketAccentColor(o.color),
              }}
            />
          ))}
        </View>
      )}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
        {pillFor(a)}
        {pillFor(b)}
      </View>

      {lines && idx >= 0 && (
        <View style={{ marginTop: 12 }}>
          <LinePicker labels={lines.map((l) => String(l))} index={idx} onIndex={(i) => setLine(lines[i])} />
        </View>
      )}
    </View>
  );
}
function LiveClockRow({ size = 13 }: { size?: number }) {
  return (
    <View style={styles.liveRow}>
      <LiveDot color={colors.green} size={LIVE_DOT_SIZE} />
      <Text style={[styles.liveText, { fontSize: size }]}>LIVE</Text>
      <Text style={[styles.clockText, { fontSize: size, color: colors.textMuted }]}>{CLOCK}</Text>
    </View>
  );
}

export default function GameDetailScreen() {
  useThemeMode();
  const displayFont = useDisplayFont();
  const oswald = useOswaldDataSet();
  const { teamAvatars = "logo" } = useFeedSettings();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { hv, pick: pickParam, pill: pillParam } = useLocalSearchParams<{ hv?: string; pick?: string; pill?: string }>();
  const variant = hv === "2" ? 2 : 1;

  const [period, setPeriod] = useState("LIVE");
  const mmLogo = useMmLogo();
  const showChartGradient = useChartGradient();
  const [pill, setPill] = useState(pillParam === "Props" ? "Props" : "Games");
  const spreadVariant = useSpreadVariant();
  // Combination mode toggle: off = no docked combo tray; taps open the
  // single-market bet slip instead.
  const comboMode = useComboMode();
  const combosOn = useCombinationsVisible();
  const comboPicks = useComboPicks();
  const comboSheetH = useComboSheetHeight();
  const fixedMarketActions = useFixedMarketActions();
  const teamAvatar = (team: Team, size: number) => (
    <Crest team={team} size={size} radius={size >= 50 ? 12 : 10} />
  );
  // Inherit a selection tapped on the league page (?pick=car|ari): pre-select
  // the matching moneyline pill.
  const [picks, setPicks] = useState<ComboPick[]>(() => {
    const key = typeof pickParam === "string" ? pickParam.toLowerCase() : undefined;
    if (key !== "car" && key !== "ari") return [];
    const ml = MARKETS.find((m) => m.id === "ml");
    const o = ml?.outcomes(ml.defaultLine).find((x) => x.key === key);
    if (!o) return [];
    return [
      {
        id: `ml:${o.key}`,
        category: "Pro Football",
        categoryEmoji: "\u{1F3C8}",
        label: slipMatchupTitle(o.label, false),
        color: marketAccentColor(o.color),
        cents: o.cents ?? 0,
      },
    ];
  });
  const [chartW, setChartW] = useState(0);
  const chartBetR = useBetRadius() === 999 ? 999 : 12;
  const moneylineActions = MARKETS.find((mk) => mk.id === "ml")!.outcomes(undefined).map((o) => {
    const color = marketAccentColor(o.color);
    return {
      key: o.key,
      label: o.label,
      color,
      textColor: buttonTextOnColor(),
      onPress: () =>
        openBetSlip({
          title: slipMatchupTitle(o.label),
          market: "Moneyline",
          oddsCents: o.cents ?? 0,
          color,
          side: "yes",
          returnTo: "/game-detail",
        }),
    };
  });
  // Tap/drag scrubbing: dots follow the finger along the lines (same behavior
  // as the shared ChartWithPeriods); null = pinned to the live edge.
  const [scrub, setScrub] = useState<number | null>(null);
  const plotW = chartW - 116;
  const handleChartTouch = (x: number) => {
    const frac = Math.min(1, Math.max(0, x / Math.max(1, plotW)));
    setScrub(frac >= 0.985 ? null : frac);
  };
  const sampleAt = (points: number[], frac: number) => {
    const n = points.length;
    if (n < 2) return points[0] ?? 0;
    const t = frac * (n - 1);
    const i0 = Math.floor(t);
    const i1 = Math.min(n - 1, i0 + 1);
    return points[i0] + (points[i1] - points[i0]) * (t - i0);
  };
  // Live odds tick: nudge the last point of each line (complementary, so the
  // pair still sums to ~1) on the same cadence as the endpoint ripple.
  const [liveDelta, setLiveDelta] = useState(0);
  React.useEffect(() => {
    if (period !== "LIVE") {
      setLiveDelta(0);
      return;
    }
    let n = 0;
    const iv = setInterval(() => {
      n += 1;
      // Small deterministic wander in [-0.03, 0.03].
      setLiveDelta(Math.sin(n * 1.7) * 0.03);
    }, 1600);
    return () => clearInterval(iv);
  }, [period]);
  const rawSeries = SERIES.map((s, i) => {
    const pts = s.points.slice();
    pts[pts.length - 1] = Math.min(0.95, Math.max(0.05, pts[pts.length - 1] + (i === 0 ? liveDelta : -liveDelta)));
    return { ...s, points: pts };
  });
  // Lift the lines so the highest point sits near the top of the chart bounds
  // (render-only; scrub % labels read the raw values).
  const liftMax = Math.max(0.01, ...rawSeries.flatMap((s) => s.points));
  const liveSeries = rawSeries.map((s) => ({ ...s, points: s.points.map((v) => v / liftMax) }));
  // Keep the two live end dots from ever touching: enforce a minimum vertical
  // separation on the final points (DOT is 12px over a ~126px plot, so 0.18
  // leaves clear air between the dots), pushing them apart symmetrically.
  {
    const a = liveSeries[0].points;
    const b = liveSeries[1].points;
    const MIN_GAP = 0.18;
    const va = a[a.length - 1];
    const vb = b[b.length - 1];
    const gap = Math.abs(va - vb);
    if (gap < MIN_GAP) {
      const push = (MIN_GAP - gap) / 2;
      const hiIsA = va >= vb;
      const hi = hiIsA ? a : b;
      const lo = hiIsA ? b : a;
      hi[hi.length - 1] = Math.min(0.95, hi[hi.length - 1] + push);
      lo[lo.length - 1] = Math.max(0.05, lo[lo.length - 1] - push);
    }
  }

  const scrollY = useRef(new Animated.Value(0)).current;

  const topInset = Math.max(screenTopInset(insets.top), 12);
  const H = 150;
  const CHART_H = H;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Animated.ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        contentContainerStyle={{ paddingTop: topInset + MARKET_DETAIL_NAV_H, paddingBottom: comboListPaddingBottom(comboMode, comboSheetH, insets.bottom, insets.bottom + (fixedMarketActions ? marketActionFooterSpace(combosOn) : 140)) }}
      >
        {/* Score strip — two treatments. */}
        {variant === 1 ? (
          <View style={styles.scoreStrip1}>
            <View style={styles.avatarCol}>
              {teamAvatar(CAR, 46)}
              <Text style={[styles.avatarAbbr, { color: colors.textAlternative }]}>{CAR.abbr?.toUpperCase()}</Text>
            </View>
            <Text {...oswald} style={[styles.bigScore, { fontFamily: displayFont, color: colors.textPrimary }]}>{CAR.score}</Text>
            <View style={styles.centerClock}>
              <View style={styles.liveRow}>
                <LiveDot color={colors.green} size={LIVE_DOT_SIZE} />
                <Text style={[styles.liveText, { fontSize: 13 }]}>LIVE</Text>
              </View>
              <Text style={[styles.clockText, { fontSize: 13, marginTop: 2, color: colors.textMuted }]}>{CLOCK}</Text>
            </View>
            <Text {...oswald} style={[styles.bigScore, { fontFamily: displayFont, color: colors.textPrimary }]}>{ARI.score}</Text>
            <View style={styles.avatarCol}>
              {teamAvatar(ARI, 46)}
              <Text style={[styles.avatarAbbr, { color: colors.textAlternative }]}>{ARI.abbr?.toUpperCase()}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.scoreStrip2}>
            <View style={styles.teamCol}>
              {teamAvatar(CAR, 54)}
              <Text style={[styles.teamName, { color: colors.textPrimary }]}>{CAR.name}</Text>
            </View>
            <Text {...oswald} style={[styles.bigScoreCenter, { fontFamily: displayFont, color: colors.textPrimary }]}>{`${CAR.score} - ${ARI.score}`}</Text>
            <View style={styles.teamCol}>
              {teamAvatar(ARI, 54)}
              <Text style={[styles.teamName, { color: colors.textPrimary }]}>{ARI.name}</Text>
            </View>
          </View>
        )}

        {/* Probability chart. */}
        <View
          style={{ height: CHART_H, marginTop: 36, marginBottom: 24 }}
          onLayout={(e) => setChartW(e.nativeEvent.layout.width)}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(e) => handleChartTouch(e.nativeEvent.locationX)}
          onResponderMove={(e) => handleChartTouch(e.nativeEvent.locationX)}
        >
          {chartW > 0 ? (
            <Svg width={chartW} height={CHART_H}>
              {showChartGradient ? (
                <Defs>
                  {SERIES.map((s, i) => (
                    <LinearGradient key={`g${i}`} id={`fade${i}`} x1="0" y1="0" x2="1" y2="0">
                      <Stop offset="0" stopColor={s.color} stopOpacity="0" />
                      <Stop offset="0.14" stopColor={s.color} stopOpacity="1" />
                      <Stop offset="1" stopColor={s.color} stopOpacity="1" />
                    </LinearGradient>
                  ))}
                  {SERIES.map((s, i) => (
                    <LinearGradient key={`a${i}`} id={`area${i}`} x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor={s.color} stopOpacity="0.16" />
                      <Stop offset="1" stopColor={s.color} stopOpacity="0" />
                    </LinearGradient>
                  ))}
                </Defs>
              ) : null}
              {liveSeries.map((s, i) => (
                <React.Fragment key={i}>
                  {showChartGradient ? <Path
                    d={smoothAreaPath(s.points, plotW, CHART_H - 24)}
                    fill={`url(#area${i})`}
                    transform="translate(0 12)"
                  /> : null}
                  <Path
                    d={smoothPath(s.points, plotW, CHART_H - 24)}
                    stroke={showChartGradient ? `url(#fade${i})` : s.color}
                    strokeWidth={2}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    transform="translate(0 12)"
                  />
                </React.Fragment>
              ))}
            </Svg>
          ) : null}
          {chartW > 0 && scrub != null ? (
            <View pointerEvents="none" style={{ position: "absolute", left: scrub * plotW, top: 6, bottom: 6, width: 1, backgroundColor: "rgba(255,255,255,0.18)" }} />
          ) : null}
          {chartW > 0 ? (
            <ScrubOverlay scrub={scrub ?? 1} plotW={plotW} series={liveSeries} values={rawSeries} names={[CAR.name, ARI.name]} period={period} showTime={scrub != null} />
          ) : null}
          {chartW > 0
            ? liveSeries.map((s, i) => {
                const v = scrub == null ? s.points[s.points.length - 1] ?? 0 : sampleAt(s.points, scrub);
                const x = scrub == null ? plotW : scrub * plotW;
                return (
                  <View
                    key={`d${i}`}
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: x - DOT / 2,
                      top: 12 + (1 - v) * (CHART_H - 24) - DOT / 2,
                    }}
                  >
                    <RippleDot color={s.color} size={DOT} active={period === "LIVE" && scrub == null} />
                  </View>
                );
              })
            : null}
        </View>

        {/* Watermark + period selector. */}
        <View style={styles.periodRow}>
          {mmLogo && (
            /* 18px wrapper margin + the row's 6px gap = 24px before LIVE. */
            <View style={{ marginRight: 18 }}>
              <Svg width={49} height={24} viewBox="0 0 49 24">
                <Path d={MM_WORDMARK_PATH} fill="#48484E" />
              </Svg>
            </View>
          )}
          {PERIODS.map((p) => {
            const active = p === period;
            return (
              <Pressable
                key={p}
                onPress={() => setPeriod(p)}
                style={[styles.periodBtn, active && { backgroundColor: filledChipBackground() }]}
              >
                <Text style={[styles.periodText, { color: active ? filledChipForeground() : colors.textMuted }]}>{p}</Text>
              </Pressable>
            );
          })}
        </View>

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
                  borderRadius: chartBetR,
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
            {combosOn ? <BuildComboButton radius={chartBetR === 999 ? 24 : 12} /> : null}
          </View>
        )}

        <MarketPageBody
          stickyTop={topInset + MARKET_DETAIL_NAV_H}
          marketTitle="Panthers vs. Cardinals"
          footerReserve={fixedMarketActions ? liveChatFooterReserve(combosOn) : 0}
          positionNames={["Panthers", "Cardinals", "CAR", "ARI"]}
          rules={<MarketRulesSection subject="Panthers vs. Cardinals" />}
          positions={({ tabbed }) => (
            <MatchPositionsSection
              names={["Panthers", "Cardinals", "CAR", "ARI"]}
              marketTitle="Panthers vs. Cardinals"
              returnTo="/game-detail"
              hideHeading={tabbed}
              showEmpty={tabbed}
            />
          )}
          predict={
            <>
        <MatchComboPicksCarousel names={["Panthers", "Cardinals"]} sport="americanFootball" league="NFL" />
        <View style={styles.groupRow}>
          {["Games", "Props"].map((g) => (
            <FilterButton
              key={g}
              label={g === "Games" ? "Game lines" : g}
              active={g === pill}
              onPress={() => setPill(g)}
            />
          ))}
        </View>

        {/* Game markets (Games tab). */}
        {pill === "Games" && (
          <View style={{ paddingHorizontal: 16, marginTop: 16, gap: 14 }}>
            {comboMode
              ? MARKETS.filter((m) => m.id === "ml").map((m) => {
                  const selectedId = comboPicks.find((p) => p.id.startsWith(`${m.id}:`))?.id;
                  return <MarketCard key={m.id} market={m} selectedId={selectedId} onToggle={toggleComboPick} />;
                })
              : null}
            {MARKETS.filter((m) => m.id !== "ml").map((m) => {
              const selectedId = (comboMode ? comboPicks : picks).find((p) => p.id.startsWith(`${m.id}:`))?.id;
              const onToggle = (pick: ComboPick) => {
                if (!comboMode) {
                  openBetSlip({ title: pick.label, market: m.title, oddsCents: pick.cents, color: pick.color, side: "yes", returnTo: "/game-detail" });
                  return;
                }
                toggleComboPick(pick);
              };
              return m.id === "spread" ? (
                spreadVariant === "rows" ? (
                  <SpreadRowsCard key={m.id} selectedId={selectedId} onToggle={onToggle} />
                ) : (
                  <SpreadCard key={m.id} selectedId={selectedId} onToggle={onToggle} />
                )
              ) : m.id === "total" ? (
                spreadVariant === "rows" ? (
                  <TotalRowsCard key={m.id} selectedId={selectedId} onToggle={onToggle} />
                ) : (
                  <TotalSentenceCard key={m.id} selectedId={selectedId} onToggle={onToggle} />
                )
              ) : (
                <MarketCard key={m.id} market={m} selectedId={selectedId} onToggle={onToggle} />
              );
            })}
          </View>
        )}

        {/* Player prop markets (Props tab). */}
        {pill === "Props" && (
          <View style={{ paddingHorizontal: 16, marginTop: 16, gap: 14 }}>
            {PROP_MARKETS.map((m) => {
              const selectedId = (comboMode ? comboPicks : picks).find((p) => p.id.startsWith(`${m.id}:`))?.id;
              const onToggle = (pick: ComboPick) => {
                if (!comboMode) {
                  openBetSlip({ title: pick.label, market: m.title, oddsCents: pick.cents, color: pick.color, side: "yes", returnTo: "/game-detail" });
                  return;
                }
                toggleComboPick(pick);
              };
              return <MarketCard key={m.id} market={m} selectedId={selectedId} onToggle={onToggle} />;
            })}
            <TdScorerCard
              selectedId={(comboMode ? comboPicks : picks).find((p) => p.id.startsWith("td:"))?.id}
              onToggle={(pick) => {
                if (!comboMode) {
                  openBetSlip({ title: pick.label, market: "Anytime Touchdown Scorer", oddsCents: pick.cents, color: pick.color, side: "yes", returnTo: "/game-detail" });
                  return;
                }
                toggleComboPick(pick);
              }}
            />
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
        onBack={() => router.back()}
        expandedContent={
          variant === 1 ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              {comboMode ? <HeaderComboMark /> : null}
              <Text style={{ fontFamily: geist.semibold, fontSize: 16, lineHeight: 21, color: colors.textPrimary }} numberOfLines={1}>
                {`${CAR.name} vs. ${ARI.name}`}
              </Text>
            </View>
          ) : (
            <LiveClockRow />
          )
        }
        collapsedContent={
          <MatchTitleScoreHeader
            leftName={CAR.name}
            rightName={ARI.name}
            leftScore={CAR.score}
            rightScore={ARI.score}
            clock={CLOCK}
            live
          />
        }
      />

      {/* One sheet at a time: the docked ticket only lives on the Predict tab
          (the Positions tab mounts its own buy-more sheet). */}
      {comboMode ? (
        <ComboSheet
          picks={comboPicks}
          onRemove={removeComboPick}
          onReplace={replaceComboPick}
          onClear={clearComboPicks}
          docked
          maxTop={topInset + MARKET_DETAIL_NAV_H}
          returnTo="/combination"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  liveRow: { flexDirection: "row", alignItems: "center", gap: LIVE_DOT_TEXT_GAP },
  liveText: { color: colors.green, fontFamily: geist.semibold },
  clockText: { fontFamily: geist.medium },

  scoreStrip1: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginTop: 14,
  },
  bigScore: { fontFamily: geist.medium, fontSize: 32, lineHeight: 40 },
  centerClock: { alignItems: "center" },
  avatarCol: { alignItems: "center", gap: 4 },
  avatarAbbr: { fontFamily: geist.semibold, fontSize: 12, lineHeight: 15 },

  scoreStrip2: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 40,
    marginTop: 18,
  },
  teamCol: { alignItems: "center", gap: 8 },
  teamName: { fontFamily: geist.semibold, fontSize: 14, lineHeight: 18 },
  bigScoreCenter: { fontFamily: geist.medium, fontSize: 40, lineHeight: 46 },

  periodRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, marginTop: 10 },
  watermark: {
    color: "rgba(255,255,255,0.22)",
    fontFamily: geist.bold,
    fontSize: 13,
    lineHeight: 14,
    marginRight: 6,
  },
  periodBtn: { flex: 1, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  periodText: { fontFamily: geist.medium, fontSize: 14 },

  priceRow: { flexDirection: "row", gap: 12, paddingHorizontal: 16, marginTop: 18 },
  pricePill: { flex: 1, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center" },
  priceText: { fontFamily: geist.semibold, fontSize: 16 },

  sectionHeading: { fontFamily: geist.semibold, fontSize: 20, lineHeight: 26, paddingHorizontal: 16, marginTop: 26 },

  groupRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginTop: 16 },
});
