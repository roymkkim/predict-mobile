import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

// Monotonic counter for per-instance SVG def ids (web SVG ids are global).
let svgUidCounter = 0;
import { Animated, Easing, Image, Pressable, Text, View, useWindowDimensions } from "react-native";
import type { LayoutChangeEvent } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient as LinearGradientRN } from "expo-linear-gradient";
import Svg, { Circle, G, ClipPath, Defs, Line, LinearGradient, Path, Rect, Stop } from "react-native-svg";

import { useBtcLiveCarouselCard } from "@/lib/sim/btcLiveCarouselCardStore";
import { useChartLiveCardHeader } from "@/lib/sim/chartLiveCardHeaderStore";
import { useChartLiveCardStack } from "@/lib/sim/chartLiveCardStackStore";
import { useTeamAbbrUnderLogos } from "@/lib/sim/teamAbbrUnderLogosStore";
import { backgroundMuted, chartGridColor, chartGridOpacity, colors, marketAccentColor, uxrPaletteColor } from "@/lib/sim/colors";
import { useThemeMode } from "@/lib/sim/dsModeStore";
import { FeedSettingsProvider, useFeedSettings } from "@/lib/sim/FeedSettingsContext";
import { useChartGradient } from "@/lib/sim/chartGradientStore";
import { openBetSlip } from "@/lib/sim/betSlipStore";
import { useLiveCueColors } from "@/lib/sim/LiveCueColorContext";
import { useLiveClock } from "@/lib/sim/useLiveClock";
import { useLiveOdds } from "@/lib/sim/useLiveOdds";
import { useLatestPlay } from "@/lib/sim/latestPlayStore";
import { outcomeButtonVisual } from "@/lib/sim/buttonStyle";
import { useBetRadius } from "@/lib/sim/pillButtonsStore";
import { useOutcomeButtonColorMode } from "@/lib/sim/outcomeButtonColorStore";
import { useFixedMarketActions } from "@/lib/sim/marketDetailActionsStore";
import { LIVE_DOT_TEXT_GAP, LiveDot } from "./Crest";
import { DOT, RippleDot } from "./RippleDot";
import {
  CAROUSEL_HEADER_GAP,
  CAROUSEL_HEADER_H,
  CAROUSEL_STATUS_H,
  LIVE_CARD_HEADER_H,
  MatchTitleScoreHeader,
  SCORE_SQUARE_SIZE,
} from "./MatchTitleScoreHeader";
import { BitcoinLogo } from "./BtcDailyCard";
import { SectionHeader } from "./FeedChrome";
import { SnapHScroll } from "./SnapHScroll";
import { SlotNumber } from "./SlotNumber";
import { matchDetailHref } from "@/lib/sim/marketRoutes";
import { smoothPath } from "@/lib/sim/chartPath";
import { MatchCard, vsMatch } from "@/lib/sim/topicMarkets";
import { soccerDrawCents } from "@/lib/sim/soccerMoneyline";
import type { Match } from "@/lib/sim/types";
import { geist } from "@/lib/sim/geistFonts";
import { formatVol } from "@/lib/formatVol";
import { useDisplayFont, useOswaldDataSet } from "@/lib/sim/typefaceStore";
import { useKalshiVenue } from "@/lib/sim/kalshiMarkets";
import { ScoreUnit } from "./StandardCard";
import { TeamAvatar } from "./SportScoreHeader";
import { ScoreStrip } from "./ScoreChartUnit";
import { MetaChip, MetaTag, MetaViewMore, TradedMeta } from "./MetaHeader";

// "Standard" variant of the live carousel (Settings → Live carousel →
// Standard). Rich live-market cards; crypto markets use the BTC/ETH 5-minute pattern:
// timestamp/status above a left-aligned title, a 140px live price chart (three
// gridlines with dollar labels, an animated price line whose end dot + price
// pill ride the current price), and Up/Down outcome buttons.

const CHART_H = 154;
// Gridline inset from the chart's top/bottom edge; lines are evenly spaced.
const GRID_PAD = 14;
// Y-axis labels and the live price pill share the exact same box (width,
// height, radius, 6px horizontal padding) so the pill sits precisely on top
// of the axis number it overlays.
const LABEL_W = 92;
const LABEL_H = 26;
const LABEL_PAD = 6;
// Fixed width of the "TARGET" text label (static copy at 12px caps).
const TARGET_LABEL_W = 52;
// Width reserved for the centered "Target" label on the detail-page chart.
const CENTER_LABEL_W = 52;
const N_POINTS = 90;
const SPORTS_TEAM_ROW_H = 32;
const SPORTS_LATEST_PLAY_ROW_H = 32;
// Match the feed's 12px rhythm between each stacked team score row.
const SPORTS_SCORE_GAP = 12;
const SPORTS_SCORE_GAP_WITHOUT_LATEST_PLAY = 12;
// The fixed action layer is 20px top padding + 48px buttons + 16px bottom
// padding. The card reserves exactly that height; an additional outer
// padding-bottom would bias the score unit upward.
const SPORTS_FIXED_ACTION_LAYER_H = 20 + 48 + 16;
const SPORTS_FIXED_CARD_PADDING_BOTTOM = SPORTS_FIXED_ACTION_LAYER_H;
const SPORTS_SCORE_CENTER_INSET = 24;
// Crypto buttons stay in normal flow (16px gap + 48px buttons + 14px bottom
// padding), so the chart absorbs the sports card's fixed-action layout delta.
const FIXED_ACTION_CARD_HEIGHT_DELTA =
  SPORTS_FIXED_CARD_PADDING_BOTTOM +
  SPORTS_SCORE_CENTER_INSET * 2 -
  (16 + 48 + 14);

const LIVE_CAROUSEL_HEADER_H = CAROUSEL_HEADER_H;
const SPORTS_CHART_H = 168;
const SPORTS_CHART_LABEL_W = 96;
const SPORTS_CHART_RIGHT_PAD = 16;
const SPORTS_CHART_LABEL_NAME_LH = 16;
const SPORTS_CHART_LABEL_PCT_LH = 20;
const SPORTS_CHART_LABEL_H = SPORTS_CHART_LABEL_NAME_LH + SPORTS_CHART_LABEL_PCT_LH;
const SPORTS_CHART_LABEL_GAP = 8;
const SPORTS_CHART_MIN_GAP = 0.18;
const CHART_LEFT_FADE_W = 56;
const TENNIS_FLAG = 20;
const TENNIS_HEADER_GAP = 4;
const TENNIS_ROW_GAP = 8;
type LiveCarouselHeaderVariant = "centered" | "statusAboveLeft" | "statusAboveCentered";
const DEFAULT_LIVE_CAROUSEL_HEADER: LiveCarouselHeaderVariant = "statusAboveLeft";

function LiveCarouselCardHeader({
  title,
  titleNode,
  status,
  cueColor,
  statusLabel = "LIVE",
  variant = DEFAULT_LIVE_CAROUSEL_HEADER,
  gap = CAROUSEL_HEADER_GAP,
}: {
  title?: string;
  titleNode?: ReactNode;
  status: string;
  cueColor: string;
  statusLabel?: string;
  variant?: LiveCarouselHeaderVariant;
  gap?: number;
}) {
  const statusRow = (
    <View
      style={{
        height: CAROUSEL_STATUS_H,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: variant === "statusAboveLeft" ? "flex-start" : "center",
        gap: LIVE_DOT_TEXT_GAP,
      }}
    >
      <LiveDot color={cueColor} />
      <Text style={{ fontFamily: geist.semibold, fontSize: 12, lineHeight: 18, letterSpacing: 0.4, color: cueColor }}>
        {statusLabel}
      </Text>
      <Text style={{ fontFamily: geist.semibold, fontSize: 12, lineHeight: 18, letterSpacing: 0.4, color: colors.textMuted }}>
        {status}
      </Text>
    </View>
  );

  return (
    <View
      style={{
        gap,
        width: "100%",
        alignItems: variant === "statusAboveLeft" ? "flex-start" : "center",
      }}
    >
      {(variant === "statusAboveLeft" || variant === "statusAboveCentered") && statusRow}
      {titleNode ??
        (title ? (
          <View
            style={{
              minHeight: SCORE_SQUARE_SIZE,
              width: "100%",
              justifyContent: "center",
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                textAlign: variant === "statusAboveLeft" ? "left" : "center",
                fontFamily: geist.semibold,
                fontSize: 16,
                lineHeight: 22,
                color: colors.textPrimary,
              }}
            >
              {title}
            </Text>
          </View>
        ) : null)}
      {variant === "centered" && statusRow}
    </View>
  );
}

function LiveSportsHeaderSlot({
  children,
  justifyContent = "center",
}: {
  children: ReactNode;
  justifyContent?: "center" | "flex-start";
}) {
  return (
    <View style={{ height: LIVE_CARD_HEADER_H, width: "100%", justifyContent, alignItems: "center" }}>
      {children}
    </View>
  );
}

function sportsScoreUnitHeight(showLatestPlay: boolean): number {
  if (showLatestPlay) {
    return SPORTS_TEAM_ROW_H * 2 + SPORTS_LATEST_PLAY_ROW_H + SPORTS_SCORE_GAP * 2;
  }
  return SPORTS_TEAM_ROW_H * 2 + SPORTS_SCORE_GAP_WITHOUT_LATEST_PLAY;
}

const fmt = (v: number) =>
  `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Compact axis copy so `$90,000.00` never wraps onto the next tick. */
function fmtAxis(v: number) {
  if (Math.abs(v) >= 1000) {
    const k = v / 1000;
    const rounded = Math.abs(k - Math.round(k)) < 0.05 ? Math.round(k) : Number(k.toFixed(1));
    return `$${rounded}k`;
  }
  return `$${Math.round(v)}`;
}

type CryptoAsset = "BTC" | "ETH";
const CRYPTO_CONFIG: Record<CryptoAsset, { spotUrl: string; initialPrice: number; targetStep: number }> = {
  BTC: {
    spotUrl: "https://api.coinbase.com/v2/prices/BTC-USD/spot",
    initialPrice: 64650,
    targetStep: 10,
  },
  ETH: {
    spotUrl: "https://api.coinbase.com/v2/prices/ETH-USD/spot",
    initialPrice: 3450,
    targetStep: 5,
  },
};
// Real crypto spot prices (Coinbase public endpoint, no key needed), polled
// every few seconds. Between polls the displayed price eases toward the latest
// real quote with a little jitter so the line stays fluid.
const POLL_MS = 4000;
// One new price point per second; between commits the whole line eases from
// its previous shape to the new one (ease-in-out over TRANS_MS).
const STEP_MS = 1000;
const TRANS_MS = 600;
const TRANS_FRAME_MS = 33;

// Tick steps for the adaptive y-axis (in dollars). The tightest step that
// still yields a handful of lines wins — so when the price trades close to
// the target, the window shrinks and MORE (finer) axis lines appear.
const TICK_STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500, 1000, 2000, 2500, 5000, 10000];
const MAX_TICKS = 4;

function axisMaxTicks(chartHeight: number): number {
  const plotH = Math.max(1, chartHeight - GRID_PAD * 2);
  return Math.max(2, Math.min(MAX_TICKS, Math.floor(plotH / (LABEL_H + 8))));
}

// Live end-dot: solid core with a soft halo that pulses outward on a loop.
function PulseDot({ x, y, color }: { x: number; y: number; color: string }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const R = 15; // halo radius at full spread
  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", left: x - R, top: y - R, width: R * 2, height: R * 2, alignItems: "center", justifyContent: "center" }}
    >
      <Animated.View
        style={{
          position: "absolute",
          width: R * 2,
          height: R * 2,
          borderRadius: R,
          backgroundColor: color,
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] }),
          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }) }],
        }}
      />
      <View style={{ width: 13, height: 13, borderRadius: 6.5, backgroundColor: color }} />
    </View>
  );
}

export function BtcLiveChart({
  width,
  height = CHART_H,
  asset = "BTC",
  centerTarget = false,
  fadeBg = colors.surface,
  onQuote,
  scrub = false,
  onScrub,
}: {
  width: number;
  // Taller variant for the detail page.
  height?: number;
  // The crypto market whose spot price drives the chart.
  asset?: CryptoAsset;
  // Detail page: centered muted "Target" label on the dotted line instead of
  // the left-aligned "TARGET PRICE" caption.
  centerTarget?: boolean;
  // Left-edge wash color so the line/grid fade into the page, not a card.
  fadeBg?: string;
  // Lift the live quote + locked target so the page header can show them.
  onQuote?: (price: number, target: number) => void;
  // Detail page: touch-drag across the chart to inspect a historical point.
  scrub?: boolean;
  // Fires with the scrubbed price while the finger is down, null on release.
  onScrub?: (price: number | null) => void;
}) {
  const crypto = CRYPTO_CONFIG[asset];
  const showChartGradient = useChartGradient();
  const chartW = width - LABEL_W;
  const [series, setSeries] = useState<number[]>([]);
  // Index into `series` while the user is scrubbing, else null.
  const [scrubIdx, setScrubIdx] = useState<number | null>(null);
  const [target, setTarget] = useState<number | null>(null);
  // Marquee phase for the dotted target line (dash pattern period = 3 + 4).
  const [dashPhase, setDashPhase] = useState(0);
  const liveRef = useRef<number | null>(null);
  // Simulated fallback anchor so the card still moves if the fetch fails.
  const simRef = useRef(crypto.initialPrice);
  // Displayed y-window, eased toward the freshly computed target window each
  // frame so axis rescales glide instead of snapping.
  const winRef = useRef<{ lo: number; hi: number } | null>(null);

  // Poll the real crypto spot price.
  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const res = await fetch(crypto.spotUrl);
        const json = await res.json();
        const p = parseFloat(json?.data?.amount);
        if (alive && Number.isFinite(p)) liveRef.current = p;
      } catch {
        // Keep the simulated anchor; the card must never freeze.
      }
    };
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [crypto.spotUrl]);

  // Step tick (1/s): commit one new price point toward the latest real quote
  // (or the simulated anchor) with momentum. Between commits a 30fps ticker
  // eases the DISPLAYED line from its previous shape to the new one
  // (ease-in-out cubic over TRANS_MS), so each movement glides instead of
  // jumping — and the card rests for the remainder of the second.
  useEffect(() => {
    let velocity = 0;
    let noise = 0;
    let prev: number[] = [];
    let cur: number[] = [];
    let elapsed = TRANS_MS; // transition progress (ms); starts settled
    const step = () => {
      simRef.current += (Math.random() - 0.5) * 4;
      const anchor = liveRef.current ?? simRef.current;
      // The market's target price locks in from the first quote we see:
      // a round-ish $10 level, keeping the quote's real cents so it reads
      // like a genuine strike (e.g. $64,650.37) rather than a flat .00.
      setTarget((t) => {
        if (t != null) return t;
        // Guarantee visible cents: if the quote's cents would display as
        // .00 (or round to it), substitute a fixed non-zero value.
        const cents = anchor - Math.floor(anchor);
        return Math.round(anchor / crypto.targetStep) * crypto.targetStep + (cents >= 0.05 && cents <= 0.95 ? cents : 0.37);
      });
      // Smoothed (low-pass) noise: mostly small, occasionally builds a swell.
      noise = noise * 0.82 + (Math.random() - 0.5) * 0.9;
      const last = cur.length ? cur[cur.length - 1] : anchor;
      velocity = velocity * 0.72 + (anchor - last) * 0.05 + noise * 0.35;
      prev = cur;
      cur = [...cur, last + velocity];
      if (cur.length > N_POINTS) cur = cur.slice(cur.length - N_POINTS);
      elapsed = 0; // restart the eased transition
    };
    step();
    step(); // need two points for a line
    const stepId = setInterval(step, STEP_MS);
    const frameId = setInterval(() => {
      if (elapsed >= TRANS_MS + TRANS_FRAME_MS) return; // settled — skip renders
      elapsed += TRANS_FRAME_MS;
      const t = Math.min(1, elapsed / TRANS_MS);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // ease-in-out cubic
      if (!prev.length || t >= 1) {
        setSeries(cur);
        return;
      }
      // Element-wise blend, aligned from the front: at capacity the arrays
      // are the same length (the line scrolls left smoothly); while growing,
      // the appended point eases out of the previous last value.
      setSeries(cur.map((v, i) => {
        const pv = prev[Math.min(i, prev.length - 1)];
        return pv + (v - pv) * e;
      }));
    }, TRANS_FRAME_MS);
    return () => {
      clearInterval(stepId);
      clearInterval(frameId);
    };
  }, []);

  // Marquee: walk the dash offset so the dotted line drifts left → right.
  useEffect(() => {
    const id = setInterval(() => setDashPhase((p) => (p + 1) % 7), 120);
    return () => clearInterval(id);
  }, []);

  // Lift the latest quote/target to the caller outside of render.
  const lastQuote = series.length ? series[series.length - 1] : null;
  useEffect(() => {
    if (lastQuote != null && target != null) onQuote?.(lastQuote, target);
  }, [lastQuote, target]);

  const greenLine = uxrPaletteColor(colors.green);
  const redLine = uxrPaletteColor(colors.red);
  const themeMode = useThemeMode();
  const chartGridStroke = chartGridColor(themeMode);
  const chartGridStrokeOpacity = chartGridOpacity(themeMode);
  const targetLineColor = themeMode === "light" ? "#000000" : "#ffffff";
  // SVG ids are document-global on web: multiple mounted charts sharing the
  // same gradient/clip ids resolve to ONE instance's defs, whose geometry can
  // degenerate another chart's stroke (line "sometimes disappears").
  const uid = useRef(`btcspark${++svgUidCounter}`).current;

  if (series.length < 2 || target == null) {
    return <View style={{ width, height: height }} />;
  }

  const price = series[series.length - 1];
  const up = price >= target;
  const lineColor = up ? greenLine : redLine;

  // Adaptive window: fit the traded range plus the target line, padded. As
  // the price hugs the target the window tightens, the tick step drops, and
  // the axis shows finer-grained prices.
  let lo = Math.min(...series, target);
  let hi = Math.max(...series, target);
  const pad = Math.max((hi - lo) * 0.18, 1.5);
  lo -= pad;
  hi += pad;
  let tickStep = TICK_STEPS.find((s) => (hi - lo) / s <= axisMaxTicks(height)) ?? 10000;
  // Ease the displayed window toward the computed one (the series ticks every
  // FRAME_MS, so a ~15% blend per frame reads as a soft glide, ~0.9s settle).
  // The very first frame snaps so the chart doesn't animate in from nothing.
  {
    const w = winRef.current;
    if (w) {
      // Renders now come at ~30fps during a transition, so a smaller blend
      // per render keeps the axis glide in step with the 0.6s line ease.
      const K = 0.08;
      lo = w.lo + (lo - w.lo) * K;
      hi = w.hi + (hi - w.hi) * K;
    }
    // Hard floor on the ease: the window must always contain every drawn
    // point (and the target). After a sharp quote jump the eased window can
    // otherwise lag behind the data, pushing the whole line off-canvas —
    // the clamped dot/pill stay visible while the line "disappears".
    const dataLo = Math.min(...series, target);
    const dataHi = Math.max(...series, target);
    if (lo > dataLo) lo = dataLo;
    if (hi < dataHi) hi = dataHi;
    // Degenerate-window guard: a perfectly flat series would divide by zero.
    if (hi - lo < 1) {
      lo -= 0.5;
      hi += 0.5;
    }
    winRef.current = { lo, hi };
    // Recompute the tick step against the eased span so gridlines stay in
    // sync with what's actually drawn.
    tickStep = TICK_STEPS.find((s) => (hi - lo) / s <= axisMaxTicks(height)) ?? 10000;
  }
  const priceToY = (p: number) => GRID_PAD + ((hi - p) / (hi - lo)) * (height - GRID_PAD * 2);
  const ticks: number[] = [];
  for (let t = Math.ceil(lo / tickStep) * tickStep; t <= hi; t += tickStep) ticks.push(t);

  const targetY = priceToY(target);
  // The line ends short of the label column: 12px clear between the dot
  // (including its halo) and the pill's left edge.
  const endX = chartW - 12 - 13;
  // Space points off the actual series length (not the constant) so the last
  // point always lands exactly on the dot — no gap even if the length changes.
  const step = endX / (series.length - 1);
  const d = series
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)} ${priceToY(p).toFixed(1)}`)
    .join(" ");
  const dotY = priceToY(price);
  // Keep every gridline. Skip a tick's label when it would sit on the live
  // pill, TARGET, or another axis label.
  const pillCenterY = Math.min(Math.max(dotY, LABEL_H / 2), height - LABEL_H / 2);
  const occupied = [targetY, pillCenterY];
  const labeledTicks = ticks.filter((t) => {
    const y = priceToY(t);
    if (occupied.some((o) => Math.abs(y - o) < LABEL_H)) return false;
    occupied.push(y);
    return true;
  });
  const gridYs = ticks.map(priceToY);

  return (
    <View style={{ width, height: height }}>
      <Svg width={width} height={height}>
        <Defs>
          {/* Left-edge fade: line, grid, and TARGET dashes emerge from the
              card/page background instead of cutting off. userSpaceOnUse so a
              flat series (zero-height bbox) doesn't make the stroke vanish. */}
          <LinearGradient
            id={`btcLineFadeGreen-${uid}`}
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={0}
            x2={showChartGradient ? endX : CHART_LEFT_FADE_W}
            y2={0}
          >
            <Stop offset="0" stopColor={greenLine} stopOpacity={0} />
            <Stop offset={showChartGradient ? "0.35" : "1"} stopColor={greenLine} stopOpacity={1} />
            <Stop offset="1" stopColor={greenLine} stopOpacity={1} />
          </LinearGradient>
          <LinearGradient
            id={`btcLineFadeRed-${uid}`}
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={0}
            x2={showChartGradient ? endX : CHART_LEFT_FADE_W}
            y2={0}
          >
            <Stop offset="0" stopColor={redLine} stopOpacity={0} />
            <Stop offset={showChartGradient ? "0.35" : "1"} stopColor={redLine} stopOpacity={1} />
            <Stop offset="1" stopColor={redLine} stopOpacity={1} />
          </LinearGradient>
          <LinearGradient id={`btcGridFade-${uid}`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={CHART_LEFT_FADE_W} y2={0}>
            <Stop offset="0" stopColor={chartGridStroke} stopOpacity={0} />
            <Stop offset="1" stopColor={chartGridStroke} stopOpacity={chartGridStrokeOpacity} />
          </LinearGradient>
          <LinearGradient id={`btcTargetFade-${uid}`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={CHART_LEFT_FADE_W} y2={0}>
            <Stop offset="0" stopColor={targetLineColor} stopOpacity={0} />
            <Stop offset="1" stopColor={targetLineColor} stopOpacity={1} />
          </LinearGradient>
          {/* Split the price line at the target: green above, red below.
              Exclusive clips (plus drawing green last) so a line riding the
              target doesn't show a second-color underbelly from stroke width. */}
          <ClipPath id={`btcAboveTarget-${uid}`}>
            <Rect x={0} y={-10} width={width} height={targetY + 11.25} />
          </ClipPath>
          <ClipPath id={`btcBelowTarget-${uid}`}>
            <Rect x={0} y={targetY + 1.25} width={width} height={Math.max(0, height - targetY + 10)} />
          </ClipPath>
          {/* Scrub split: left/right of the finger position. */}
          <ClipPath id={`btcScrubLeft-${uid}`}>
            <Rect x={0} y={-10} width={scrubIdx != null ? scrubIdx * step : 0} height={height + 20} />
          </ClipPath>
          <ClipPath id={`btcScrubRight-${uid}`}>
            <Rect x={scrubIdx != null ? scrubIdx * step : 0} y={-10} width={width} height={height + 20} />
          </ClipPath>
          {/* userSpaceOnUse: a horizontal <Line> has a zero-height bounding
              box, so a default (objectBoundingBox) gradient renders nothing. */}
        </Defs>
        {gridYs.map((y, i) => (
          <Line key={i} x1={0} y1={y} x2={width - LABEL_W - 8} y2={y} stroke={`url(#btcGridFade-${uid})`} strokeWidth={1} />
        ))}
        {/* Target price: white dotted line, broken around the "Target price"
            label (16px left pad + label width) instead of masking it. */}
        <Line
          x1={0}
          y1={targetY}
          x2={centerTarget ? (chartW - CENTER_LABEL_W) / 2 - 8 : 10}
          y2={targetY}
          stroke={`url(#btcTargetFade-${uid})`}
          strokeWidth={1}
          strokeDasharray="3 4"
          strokeDashoffset={-dashPhase}
          strokeLinecap="round"
        />
        <Line
          x1={centerTarget ? (chartW + CENTER_LABEL_W) / 2 + 8 : 16 + TARGET_LABEL_W + 6}
          y1={targetY}
          x2={width - LABEL_W - 4}
          y2={targetY}
          stroke={`url(#btcTargetFade-${uid})`}
          strokeWidth={1}
          strokeDasharray="3 4"
          strokeDashoffset={-dashPhase}
          strokeLinecap="round"
        />
        {scrubIdx == null ? (
          <>
            <Path d={d} stroke={`url(#btcLineFadeRed-${uid})`} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" clipPath={`url(#btcBelowTarget-${uid})`} />
            <Path d={d} stroke={`url(#btcLineFadeGreen-${uid})`} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" clipPath={`url(#btcAboveTarget-${uid})`} />
          </>
        ) : (
          <>
            {/* Scrubbing: full strength left of the finger, faded to the right. */}
            <G clipPath={`url(#btcScrubLeft-${uid})`}>
              <Path d={d} stroke={`url(#btcLineFadeRed-${uid})`} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" clipPath={`url(#btcBelowTarget-${uid})`} />
              <Path d={d} stroke={`url(#btcLineFadeGreen-${uid})`} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" clipPath={`url(#btcAboveTarget-${uid})`} />
            </G>
            <G clipPath={`url(#btcScrubRight-${uid})`} opacity={0.3}>
              <Path d={d} stroke={`url(#btcLineFadeRed-${uid})`} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" clipPath={`url(#btcBelowTarget-${uid})`} />
              <Path d={d} stroke={`url(#btcLineFadeGreen-${uid})`} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" clipPath={`url(#btcAboveTarget-${uid})`} />
            </G>
          </>
        )}
      </Svg>
      <LinearGradientRN
        pointerEvents="none"
        colors={[fadeBg, "transparent"]}
        locations={[0, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: CHART_LEFT_FADE_W }}
      />
      {/* End dot: solid core + pulsing halo (1.6s breathe loop). Hidden while
          scrubbing — the primary dot follows the finger instead. */}
      {scrubIdx == null && <PulseDot x={endX} y={dotY} color={lineColor} />}
      {/* Gridline dollar labels: same box as the price pill so it overlays
          exactly. Collision-prone ticks are already filtered out above. */}
      {labeledTicks.map((t) => (
        <View
          key={t}
          style={{
            position: "absolute",
            right: 0,
            top: priceToY(t) - LABEL_H / 2,
            width: LABEL_W,
            height: LABEL_H,
            borderRadius: LABEL_H / 2,
            paddingHorizontal: LABEL_PAD,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text numberOfLines={1} style={{ fontFamily: geist.medium, fontSize: 13, lineHeight: 17, color: colors.textMuted }}>
            {fmtAxis(t)}
          </Text>
        </View>
      ))}
      {/* Target label riding the dotted line: centered muted "Target" on the
          detail page, left-aligned "TARGET PRICE" caption on cards. */}
      {centerTarget ? (
        <View
          style={{
            position: "absolute",
            left: (chartW - CENTER_LABEL_W) / 2,
            top: targetY - LABEL_H / 2,
            width: CENTER_LABEL_W,
            height: LABEL_H,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontFamily: geist.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.4, color: colors.textPrimary }}>
            TARGET
          </Text>
        </View>
      ) : (
      <View
        style={{
          position: "absolute",
          left: 16,
          top: targetY - LABEL_H / 2,
          width: TARGET_LABEL_W,
          height: LABEL_H,
          justifyContent: "center",
        }}
      >
        <Text style={{ fontFamily: geist.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.5, color: colors.textPrimary }}>
          TARGET
        </Text>
      </View>
      )}
      {/* Target price: white text on the dotted line, no background */}
      <View
        style={{
          position: "absolute",
          right: 0,
          top: targetY - LABEL_H / 2,
          width: LABEL_W,
          height: LABEL_H,
          borderRadius: LABEL_H / 2,
          paddingHorizontal: LABEL_PAD,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontFamily: geist.medium, fontSize: 12, lineHeight: 16, color: colors.textPrimary }}>
          {fmt(target)}
        </Text>
      </View>
      {/* Live price pill rides the price, sitting exactly on the axis column.
          Hidden while scrubbing. */}
      {scrubIdx == null && (
      <View
        style={{
          position: "absolute",
          right: 0,
          top: Math.min(Math.max(dotY - LABEL_H / 2, 0), height - LABEL_H),
          width: LABEL_W,
          height: LABEL_H,
          borderRadius: LABEL_H / 2,
          paddingHorizontal: LABEL_PAD,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: up ? colors.greenSoft : colors.redSoft,
        }}
      >
        <Text style={{ fontFamily: geist.semibold, fontSize: 13, lineHeight: 17, color: lineColor }}>
          {fmt(price)}
        </Text>
      </View>
      )}
      {/* Scrub overlay: drag to inspect any point on the line. Points arrive
          once per second, so index i is (len-1-i) seconds in the past. */}
      {scrub && scrubIdx != null && series[scrubIdx] != null && (() => {
        const sx = scrubIdx * step;
        const sy = priceToY(series[scrubIdx]);
        const secsAgo = series.length - 1 - scrubIdx;
        const t = new Date(Date.now() - secsAgo * 1000);
        const hh = t.getHours() % 12 || 12;
        const label = `${hh}:${String(t.getMinutes()).padStart(2, "0")}:${String(t.getSeconds()).padStart(2, "0")} ${t.getHours() >= 12 ? "PM" : "AM"}`;
        const scrubUp = series[scrubIdx] >= target;
        const scrubColor = scrubUp ? greenLine : redLine;
        const TS_W = 110;
        return (
          <>
            <View pointerEvents="none" style={{ position: "absolute", left: sx, top: 0, bottom: 0, width: 1, backgroundColor: "rgba(255,255,255,0.35)" }} />
            <View pointerEvents="none" style={{ position: "absolute", left: sx - 6.5, top: sy - 6.5, width: 13, height: 13, borderRadius: 6.5, backgroundColor: scrubColor }} />
            {/* Timestamp pinned UNDER the chart — same treatment as the
                sports detail charts (ScrubTimeLabel). */}
            <Text
              pointerEvents="none"
              style={{
                position: "absolute",
                bottom: -20,
                left: Math.min(Math.max(sx - TS_W / 2, 0), chartW - TS_W),
                width: TS_W,
                textAlign: "center",
                fontFamily: geist.semibold,
                fontSize: 13,
                color: colors.textMuted,
              }}
            >
              {label}
            </Text>
          </>
        );
      })()}
      {scrub && (
        <View
          style={{ position: "absolute", left: 0, top: 0, width: chartW, height }}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(e) => {
            const i = Math.round(Math.min(Math.max(e.nativeEvent.locationX / step, 0), series.length - 1));
            setScrubIdx(i);
            onScrub?.(series[i] ?? null);
          }}
          onResponderMove={(e) => {
            const i = Math.round(Math.min(Math.max(e.nativeEvent.locationX / step, 0), series.length - 1));
            setScrubIdx(i);
            onScrub?.(series[i] ?? null);
          }}
          onResponderRelease={() => {
            setScrubIdx(null);
            onScrub?.(null);
          }}
          onResponderTerminate={() => {
            setScrubIdx(null);
            onScrub?.(null);
          }}
        />
      )}
    </View>
  );
}

function CardOutcomeButton({
  label,
  cents,
  color,
  drawIcon,
  market,
}: {
  label: string;
  cents: number;
  color: string;
  drawIcon?: boolean;
  // Parent market title for the bet slip header (e.g. "Panthers vs. Cardinals").
  market: string;
}) {
  const betR = useBetRadius();
  const themeMode = useThemeMode();
  const mode = useOutcomeButtonColorMode();
  const visual = drawIcon
    ? { container: { backgroundColor: backgroundMuted(themeMode) }, text: { color: colors.controlActiveText } }
    : outcomeButtonVisual("default", "gray-colored", color, { mode: mode === "fill" ? "fill" : mode, label, pill: betR === 999 });
  const labelColor = (visual.text.color as string) ?? colors.textPrimary;
  return (
    <Pressable
      onPress={() =>
        openBetSlip({
          title: drawIcon ? "Draw" : label,
          market,
          oddsCents: cents,
          color: drawIcon ? colors.slate : marketAccentColor(color),
        })
      }
      style={[
        visual.container,
        {
          flex: 1,
          height: 48,
          borderRadius: betR,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        },
      ]}
    >
      {drawIcon ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="contrast" size={18} color={labelColor} />
          <SlotNumber value={cents} suffix="¢" color={labelColor} fontSize={16} fontFamily={geist.medium} />
        </View>
      ) : (
        <SlotNumber
          value={cents}
          prefix={/^(up|down)$/i.test(label) ? `${label} ` : `${label} · `}
          suffix="¢"
          color={labelColor}
          fontSize={16}
          fontFamily={geist.medium}
        />
      )}
    </Pressable>
  );
}

// BTC Up or Down market card. Reused full-width on the Crypto hub's BTC tab
// (with per-duration title/clock); the carousel renders the 5 Min default.
type CryptoCardsCardProps = {
  width: number;
  duration?: string;
  clock?: string;
  odds?: [number, number];
  headerVariant?: LiveCarouselHeaderVariant;
  headerStatusLabel?: string;
  hideHeaderTitle?: boolean;
  // Fixed card height on the live carousel rail; unset elsewhere (Crypto hub,
  // standalone crypto carousel), where the card sizes naturally.
  height?: number;
};

function CryptoCardsCard({
  asset,
  width,
  duration = "5 Min",
  clock = "3:12",
  odds = [73, 27] as [number, number],
  headerVariant = DEFAULT_LIVE_CAROUSEL_HEADER,
  headerStatusLabel = "LIVE",
  hideHeaderTitle = false,
  height,
}: {
  asset: CryptoAsset;
} & CryptoCardsCardProps) {
  const cue = useLiveCueColors();
  const liveLabel = useLiveClock(clock, true);
  const { displayVals } = useLiveOdds(odds, true, 0);
  const showLatestPlay = useLatestPlay();
  const fixedMarketActions = useFixedMarketActions();
  const stack = useChartLiveCardStack();
  const title = `${asset} Up or Down · ${duration}`;
  const scoreUnitHeight = sportsScoreUnitHeight(showLatestPlay) + (fixedMarketActions ? FIXED_ACTION_CARD_HEIGHT_DELTA : 0);
  // The fixed carousel rail already reserves the sports action-layer delta in
  // its outer height. Do not add that delta to the BTC chart itself or the
  // chart will push the in-flow outcome buttons below the card edge.
  const CHART_CARD_CHROME = 16 + LIVE_CAROUSEL_HEADER_H + 16 + 16 + 48 + 16;
  const chartHeight = height != null ? Math.max(80, height - CHART_CARD_CHROME) : scoreUnitHeight;

  const header = (
      <LiveCarouselCardHeader
        title={hideHeaderTitle ? undefined : title}
        status={liveLabel}
        statusLabel={headerStatusLabel}
        cueColor={cue.color}
        variant={headerVariant}
      />
  );
  const chart = (
      <View style={{ marginLeft: -16, flexGrow: 1, justifyContent: "center" }}>
        <BtcLiveChart asset={asset} width={width - 16} height={chartHeight} />
      </View>
  );
  const actions = (
      <View style={{ flexDirection: "row", gap: 10 }}>
        <CardOutcomeButton label="Up" cents={displayVals[0]} color={colors.green} market={title} />
        <CardOutcomeButton label="Down" cents={displayVals[1]} color={colors.red} market={title} />
      </View>
  );

  return (
    <View
      style={{
        width,
        height,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        backgroundColor: colors.surface,
        padding: 16,
        gap: 16,
      }}
    >
      {stack === "chart" ? (
        <>
          {chart}
          {header}
          {actions}
        </>
      ) : (
        <>
          {header}
          {chart}
          {actions}
        </>
      )}
    </View>
  );
}

export function BtcCardsCard(props: CryptoCardsCardProps) {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push("/btc-updown" as never)}>
      <CryptoCardsCard asset="BTC" {...props} />
    </Pressable>
  );
}

export function EthCardsCard(props: CryptoCardsCardProps) {
  return <CryptoCardsCard asset="ETH" {...props} />;
}

export function CryptoLiveCardsCarousel({ gutter = 16 }: { gutter?: number }) {
  const router = useRouter();
  const { width: winW } = useWindowDimensions();
  const btcCardVariant = useBtcLiveCarouselCard();
  const cardW = winW - gutter * 2 - 28;
  const cardH = btcCardVariant === "chart" ? cardW : PRODUCTION_CARD_H;

  return (
    <View>
      <SectionHeader title="Live" onPress={() => router.push("/live" as never)} />
      <SnapHScroll gutter={gutter} interval={cardW + 10} gap={10}>
        {btcCardVariant === "chart" ? (
          <BtcCardsCard width={cardW} height={cardH} />
        ) : (
          <ProductionBtcCard width={cardW} height={cardH} />
        )}
        <EthCardsCard width={cardW} odds={[61, 39]} />
      </SnapHScroll>
    </View>
  );
}

// Sports card ("Cards" variant, per mock): built INTO the carousel card
// format — LIVE stamp on top, centered title, then a center unit (matches the
// BTC chart height so cards sit even) with one row per team: helmet avatar,
// big name over an underline probability bar, and the live score in a
// bordered chip — then two pill outcome buttons in team colors.
type CardsTeam = {
  name: string;
  abbr: string;
  color: string;
  pct: number;
  score: number;
  hasBall?: boolean;
  flag?: string;
  logo?: string;
  scoreText?: string;
  setScores?: number[];
};
// latestPlay: the most recent in-game event, shown as "timestamp — text" in
// its own row under the team rows (Settings → Latest play; on by default).
// drawPct: soccer three-way market — adds a Draw outcome button (no Draw row).
type CardsGame = {
  title: string;
  league: string;
  leagueColor?: string;
  sport: string;
  vol: string;
  markets: number;
  date: string;
  clock: string;
  teams: [CardsTeam, CardsTeam];
  latestPlay: { time: string; text: string };
  drawPct?: number;
};

// Exported for scripts/check-market-links (broken-card-link validation).
export const SPORTS_GAMES: CardsGame[] = [
  {
    title: "Panthers vs. Cardinals",
    league: "NFL",
    leagueColor: "#013369",
    sport: "americanFootball",
    vol: "$1.4M Vol.",
    markets: 3,
    date: "Aug 6",
    clock: "Q4 · 12:22",
    teams: [
      { name: "Panthers", abbr: "CAR", color: "#0085ca", pct: 53, score: 21, hasBall: true, logo: "https://a.espncdn.com/i/teamlogos/nfl/500/car.png" },
      { name: "Cardinals", abbr: "ARI", color: "#97233f", pct: 47, score: 0, logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ari.png" },
    ],
    latestPlay: { time: "12:38", text: "Young sacked for a 7-yard loss on 3rd & 4" },
  },
  {
    title: "Chiefs vs. Ravens",
    league: "NFL",
    leagueColor: "#013369",
    sport: "americanFootball",
    vol: "$1.2M Vol.",
    markets: 3,
    date: "Aug 7",
    clock: "Q3 · 5:42",
    teams: [
      { name: "Chiefs", abbr: "KC", color: "#e31837", pct: 62, score: 21, hasBall: true, logo: "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png" },
      { name: "Ravens", abbr: "BAL", color: "#241773", pct: 38, score: 17, logo: "https://a.espncdn.com/i/teamlogos/nfl/500/bal.png" },
    ],
    latestPlay: { time: "5:58", text: "Henry rushes up the middle for 12 yards" },
  },
  {
    title: "Brazil vs. Argentina",
    league: "International",
    leagueColor: "#009c3b",
    sport: "soccer",
    vol: "$980K Vol.",
    markets: 3,
    date: "Aug 8",
    clock: "2H · 72:44",
    teams: [
      { name: "Brazil", abbr: "BRA", color: "#009c3b", pct: 54, score: 2, hasBall: true, flag: "br" },
      { name: "Argentina", abbr: "ARG", color: "#75aadb", pct: 27, score: 1, flag: "ar" },
    ],
    latestPlay: { time: "68'", text: "Vinícius curls one just wide from the edge of the box" },
    drawPct: 19,
  },
  {
    title: "Swiatek vs. Gauff",
    league: "WTA",
    leagueColor: "#5b2a86",
    sport: "tennis",
    vol: "$910K Vol.",
    markets: 8,
    date: "Jun 8",
    clock: "3rd set",
    teams: [
      { name: "Swiatek", abbr: "SWI", color: colors.green, pct: 58, score: 0, hasBall: true, flag: "https://flagcdn.com/w80/pl.png", scoreText: "40", setScores: [6, 4, 3] },
      { name: "Gauff", abbr: "GAU", color: colors.red, pct: 42, score: 0, flag: "https://flagcdn.com/w80/us.png", scoreText: "30", setScores: [4, 6, 2] },
    ],
    latestPlay: { time: "Ad", text: "Swiatek holds serve after a long deuce" },
  },
];

const KALSHI_SPORTS_GAMES: CardsGame[] = [
  ...SPORTS_GAMES.filter((g) => g.league === "NFL"),
  {
    title: "Georgia vs. Alabama",
    league: "NCAAF",
    leagueColor: "#9e1b32",
    sport: "americanFootball",
    vol: "$860K Vol.",
    markets: 2,
    date: "Aug 6",
    clock: "Q2 · 4:18",
    teams: [
      { name: "Georgia", abbr: "UGA", color: "#ba0c2f", pct: 56, score: 14, hasBall: true, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/61.png" },
      { name: "Alabama", abbr: "ALA", color: "#9e1b32", pct: 44, score: 10, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/333.png" },
    ],
    latestPlay: { time: "4:26", text: "Beck completes a 22-yard strike on 2nd & 8" },
  },
];

function cardsGameToMatch(game: CardsGame): Match {
  const match = vsMatch({
    league: game.league,
    leagueColor: game.leagueColor,
    sport: game.sport,
    home: game.teams[0],
    away: game.teams[1],
    pct: [game.teams[0].pct, game.teams[1].pct],
    vol: game.vol,
    markets: game.markets,
    date: game.date,
    live: { mins: game.clock, score: [game.teams[0].score, game.teams[1].score] },
  });
  match.teams[0].hasBall = game.teams[0].hasBall;
  match.teams[1].hasBall = game.teams[1].hasBall;
  match.teams[0].scoreText = game.teams[0].scoreText;
  match.teams[1].scoreText = game.teams[1].scoreText;
  match.teams[0].setScores = game.teams[0].setScores;
  match.teams[1].setScores = game.teams[1].setScores;
  if (game.drawPct !== undefined) {
    match.draw = { pct: `${game.drawPct}%` };
  }
  return match;
}

// One-line ticker row: timestamp on the left, latest play text after it.
// Fixed to the same 32px height as a team-row unit so cards stay even.
function LatestPlayRow({ play }: { play: { time: string; text: string } }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
      <Text style={{ width: 32, textAlign: "center", paddingTop: 1, fontFamily: geist.semibold, fontSize: 12, lineHeight: 16, color: colors.textMuted }}>
        {play.time}
      </Text>
      <Text
        numberOfLines={2}
        style={{ flex: 1, fontFamily: geist.regular, fontSize: 14, lineHeight: 18, color: colors.textPrimary }}
      >
        {play.text}
      </Text>
    </View>
  );
}

function SportsTeamRow({ team, maxPct }: { team: CardsTeam; maxPct: number }) {
  const [logoFailed, setLogoFailed] = useState(false);
  // Same brightened palette shade as the outcome buttons so the helmet, bar,
  // and button all read as one team color (raw NFL colors like Ravens purple
  // are too dark against the card).
  const color = marketAccentColor(team.color);
  // Line lengths are relative to each other, with the leader's line reaching
  // the full track (which ends 12px from the score square).
  const lineWidth = Math.round((team.pct / maxPct) * 100);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      {team.flag ? (
        <View style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}>
          <Image
            source={{ uri: teamFlagUri(team.flag) }}
            style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.06)" }}
            resizeMode="cover"
          />
        </View>
      ) : team.logo && !logoFailed ? (
        <View
          style={{
            width: 32,
            height: 32,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            source={{ uri: team.logo }}
            style={{ width: 32, height: 32 }}
            resizeMode="contain"
            onError={() => setLogoFailed(true)}
          />
        </View>
      ) : (
        <View style={{ width: 32, height: 32 }} />
      )}
      <View style={{ flex: 1, gap: 7 }}>
        <Text style={{ fontFamily: geist.semibold, fontSize: 16, lineHeight: 20, color: colors.textPrimary }}>
          {team.name}
        </Text>
        {/* Track is invisible and runs the full column (ending 12px from the
            score square); the team-colored line's length is relative to it. */}
        <View style={{ height: 2 }}>
          <View style={{ width: `${lineWidth}%`, height: 2, borderRadius: 1, backgroundColor: color }} />
        </View>
      </View>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          alignSelf: "center",
          borderWidth: 1,
          borderColor: "rgba(133,139,154,0.32)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontFamily: geist.semibold, fontSize: 14, lineHeight: 18, color: colors.textPrimary }}>
          {team.score}
        </Text>
      </View>
    </View>
  );
}

export function SportsCardsCard({ game, width, height, liveBaseDelayMs = 0 }: { game: CardsGame; width: number; height?: number; liveBaseDelayMs?: number }) {
  const router = useRouter();
  const cue = useLiveCueColors();
  const fixedMarketActions = useFixedMarketActions();
  const clockParts = splitLiveClock(game.clock);
  const clock = useLiveClock(clockParts.token, true);
  const status = clockParts.token === clockParts.quarter ? clock : `${clockParts.quarter} · ${clock}`;
  const tennis = game.sport === "tennis";
  // Three-way (soccer) games carry the draw as a third live-odds slot so all
  // three buttons tick together; two-way games keep the two team slots.
  const { displayVals } = useLiveOdds(
    game.drawPct !== undefined
      ? [game.teams[0].pct, game.teams[1].pct, game.drawPct]
      : [game.teams[0].pct, game.teams[1].pct],
    true,
    liveBaseDelayMs,
  );
  const showLatestPlay = useLatestPlay() && !tennis;
  return (
    <Pressable
      onPress={() => router.push(matchDetailHref(cardsGameToMatch(game)) as never)}
      style={{
        width,
        height,
        position: "relative",
        overflow: "hidden",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        backgroundColor: colors.surface,
        padding: 16,
        paddingBottom: fixedMarketActions ? SPORTS_FIXED_CARD_PADDING_BOTTOM : 16,
        gap: 16,
        justifyContent: height != null ? "space-between" : undefined,
      }}
    >
      {tennis ? (
        <LiveCarouselCardHeader
          status={status.toUpperCase()}
          cueColor={cue.color}
          variant="statusAboveCentered"
          gap={TENNIS_HEADER_GAP}
        />
      ) : (
        <LiveCarouselCardHeader
          title={game.title}
          status={status}
          cueColor={cue.color}
          variant={DEFAULT_LIVE_CAROUSEL_HEADER}
        />
      )}
      {tennis ? (
        <View style={{ flexGrow: 1, width: "100%", justifyContent: "center" }}>
          <CarouselTennisScoreUnit game={game} />
        </View>
      ) : (
      <View
        style={{
          flexGrow: 1,
          justifyContent: "center",
          gap: showLatestPlay ? SPORTS_SCORE_GAP : SPORTS_SCORE_GAP_WITHOUT_LATEST_PLAY,
          paddingVertical: fixedMarketActions ? SPORTS_SCORE_CENTER_INSET : 0,
          paddingHorizontal: 2,
        }}
      >
        <SportsTeamRow team={game.teams[0]} maxPct={Math.max(game.teams[0].pct, game.teams[1].pct)} />
        <SportsTeamRow team={game.teams[1]} maxPct={Math.max(game.teams[0].pct, game.teams[1].pct)} />
        {showLatestPlay && <LatestPlayRow play={game.latestPlay} />}
      </View>
      )}
      {fixedMarketActions ? (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 16,
            paddingTop: 20,
            paddingBottom: 16,
            zIndex: 2,
          }}
          testID="sports-card-fixed-actions"
        >
          <LinearGradientRN
            pointerEvents="none"
            colors={["transparent", colors.surface, colors.surface]}
            locations={[0, 0.42, 1]}
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
          />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <CardOutcomeButton label={game.teams[0].abbr} cents={displayVals[0]} color={game.teams[0].color} market={game.title} />
            {game.drawPct !== undefined && <CardOutcomeButton label="Draw" cents={displayVals[2]} color={colors.slate} drawIcon market={game.title} />}
            <CardOutcomeButton label={game.teams[1].abbr} cents={displayVals[1]} color={game.teams[1].color} market={game.title} />
          </View>
        </View>
      ) : (
        <View style={{ gap: LIVE_META_FOOTER_GAP }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <CardOutcomeButton label={game.teams[0].abbr} cents={displayVals[0]} color={game.teams[0].color} market={game.title} />
            {game.drawPct !== undefined && <CardOutcomeButton label="Draw" cents={displayVals[2]} color={colors.slate} drawIcon market={game.title} />}
            <CardOutcomeButton label={game.teams[1].abbr} cents={displayVals[1]} color={game.teams[1].color} market={game.title} />
          </View>
          <LiveCardMetaFooter category={game.league} vol={game.vol} moreCount={game.markets} />
        </View>
      )}
    </Pressable>
  );
}

function sportsProbSeries(seed: number, endV: number): number[] {
  const n = 13;
  const out: number[] = [];
  let v = Math.max(0.2, Math.min(0.8, endV + 0.1));
  for (let i = 0; i < n; i++) {
    const r = Math.sin(seed * 12.9898 + i * 78.233);
    v += r * 0.12;
    v += (endV - v) * (i / n) * 0.35;
    v = Math.max(0.06, Math.min(0.9, v));
    out.push(v);
  }
  out[n - 1] = Math.max(0.05, Math.min(0.95, endV));
  return out;
}

/** Spread label centers so boxes of `size` never overlap. If they don't fit, keep the gap and overflow the chart equally. */
function packLabelCenters(ys: number[], height: number, size: number, gap: number): number[] {
  const n = ys.length;
  if (n === 0) return [];
  const stride = size + gap;
  const order = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  const placed = order.map((row) => row.y);
  for (let k = 1; k < n; k++) {
    placed[k] = Math.max(placed[k], placed[k - 1] + stride);
  }
  const cluster = placed[n - 1]! - placed[0]!;
  const minY = size / 2;
  const maxY = Math.max(minY, height - size / 2);
  if (placed[n - 1]! > maxY || placed[0]! < minY) {
    const start = cluster > maxY - minY ? (height - cluster) / 2 : Math.min(Math.max(placed[0]!, minY), maxY - cluster);
    const origin = placed[0]!;
    for (let k = 0; k < n; k++) placed[k] = start + (placed[k]! - origin);
  }
  const out = ys.slice();
  for (let k = 0; k < n; k++) out[order[k]!.i] = placed[k]!;
  return out;
}

function SportsLiveChart({
  width,
  height,
  series,
}: {
  width: number;
  height: number;
  series: { color: string; points: number[]; label: string }[];
}) {
  const padY = 16;
  const plotH = Math.max(8, height - padY * 2);
  const plotW = Math.max(8, width - SPORTS_CHART_LABEL_W - SPORTS_CHART_RIGHT_PAD);
  const yOf = (v: number) => padY + (1 - Math.max(0, Math.min(1, v))) * plotH;
  const uid = useRef(`sportsspark${++svgUidCounter}`).current;

  const visual = useMemo(() => {
    const copy = series.map((s) => ({ ...s, points: s.points.map((v) => Math.max(0.04, Math.min(0.96, v))) }));
    const ends = copy.map((s) => s.points[s.points.length - 1] ?? 0.5);
    const mid = (Math.min(...ends) + Math.max(...ends)) / 2;
    const shift = 0.5 - mid;
    for (const s of copy) {
      s.points = s.points.map((v) => Math.max(0.08, Math.min(0.92, v + shift)));
    }
    if (copy.length >= 2) {
      const ranked = [...copy].sort(
        (a, b) => (b.points[b.points.length - 1] ?? 0) - (a.points[a.points.length - 1] ?? 0),
      );
      const hi = ranked[0].points;
      const lo = ranked[ranked.length - 1].points;
      const gap = Math.abs((hi[hi.length - 1] ?? 0) - (lo[lo.length - 1] ?? 0));
      if (gap < SPORTS_CHART_MIN_GAP && hi !== lo) {
        const push = (SPORTS_CHART_MIN_GAP - gap) / 2;
        hi[hi.length - 1] = Math.min(0.92, (hi[hi.length - 1] ?? 0) + push);
        lo[lo.length - 1] = Math.max(0.08, (lo[lo.length - 1] ?? 0) - push);
      }
    }
    return copy;
  }, [series]);

  const labels = useMemo(() => {
    const raw = visual.map((s, i) => ({
      i,
      y: yOf(s.points[s.points.length - 1] ?? 0),
      v: Math.round((series[i]?.points[series[i].points.length - 1] ?? 0) * 100),
      color: s.color,
      name: s.label,
    }));
    const packed = packLabelCenters(
      raw.map((row) => row.y),
      height,
      SPORTS_CHART_LABEL_H,
      SPORTS_CHART_LABEL_GAP,
    );
    return raw.map((row, i) => ({ ...row, y: packed[i]! }));
  }, [height, series, visual]);

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          {visual.map((s, i) => (
            <LinearGradient
              key={`edge${i}`}
              id={`${uid}-edge${i}`}
              gradientUnits="userSpaceOnUse"
              x1={0}
              y1={0}
              x2={CHART_LEFT_FADE_W}
              y2={0}
            >
              <Stop offset="0" stopColor={s.color} stopOpacity={0} />
              <Stop offset="1" stopColor={s.color} stopOpacity={1} />
            </LinearGradient>
          ))}
        </Defs>
        {visual.map((s, i) => (
          <Path
            key={i}
            d={smoothPath(s.points, plotW, plotH)}
            stroke={`url(#${uid}-edge${i})`}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            transform={`translate(0 ${padY})`}
          />
        ))}
      </Svg>
      <LinearGradientRN
        pointerEvents="none"
        colors={[colors.surface, "transparent"]}
        locations={[0, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: CHART_LEFT_FADE_W }}
      />
      {visual.map((s, i) => {
        const v = s.points[s.points.length - 1] ?? 0;
        return (
          <View
            key={`dot-${i}`}
            pointerEvents="none"
            style={{ position: "absolute", left: plotW - DOT / 2, top: yOf(v) - DOT / 2 }}
          >
            <RippleDot color={s.color} size={DOT} active />
          </View>
        );
      })}
      {labels.map((row) => (
        <View
          key={`label-${row.i}`}
          pointerEvents="none"
          style={{
            position: "absolute",
            left: plotW + DOT / 2 + 12,
            top: row.y - SPORTS_CHART_LABEL_H / 2,
            width: SPORTS_CHART_LABEL_W - DOT / 2 - 12,
            height: SPORTS_CHART_LABEL_H,
          }}
        >
          <Text
            style={{
              fontFamily: geist.medium,
              fontSize: 12,
              lineHeight: SPORTS_CHART_LABEL_NAME_LH,
              letterSpacing: 0.4,
              color: row.color,
              textTransform: "uppercase",
            }}
            numberOfLines={1}
          >
            {row.name}
          </Text>
          <Text style={{ fontFamily: geist.medium, fontSize: 16, lineHeight: SPORTS_CHART_LABEL_PCT_LH, color: row.color }}>{row.v}%</Text>
        </View>
      ))}
    </View>
  );
}

function formatLiveClock(mins?: string, fallback = ""): string {
  const raw = (mins ?? fallback).trim();
  if (!raw) return fallback;
  if (raw.includes("·")) return raw;
  // "Q4 12:22" / "2H 72:44" → insert a middle dot. Leave "3rd set" alone.
  if (/^\S+\s+\d/.test(raw)) return raw.replace(/^(\S+)\s+/, "$1 · ");
  return raw;
}

function teamFlagUri(flag?: string): string | undefined {
  if (!flag) return undefined;
  return flag.startsWith("http") ? flag : `https://flagcdn.com/w80/${flag}.png`;
}

function splitLiveClock(clock: string): { quarter: string; token: string; combined: string } {
  const hasSplit = clock.includes(" · ");
  const quarter = hasSplit ? clock.split(" · ")[0] : clock;
  const token = hasSplit ? clock.split(" · ")[1] ?? clock : clock;
  return { quarter, token, combined: hasSplit ? `${quarter} · ${token}` : token };
}

function compactChartClock(clock: string, sport: string): string {
  if (sport === "soccer") {
    const mmss = clock.match(/(\d{1,3}):\d{2}\s*$/);
    if (mmss) return `${parseInt(mmss[1], 10)}'`;
    const min = clock.match(/(\d{1,3})'\s*$/);
    if (min) return `${min[1]}'`;
  }
  return clock;
}

function cardsTeamAsMatchTeam(team: CardsTeam): Match["teams"][number] {
  return {
    name: team.name,
    pct: `${team.pct}%`,
    color: team.color,
    initial: team.abbr[0] ?? team.name[0] ?? "?",
    abbr: team.abbr,
    flag: team.flag,
    logo: team.logo,
    score: team.score,
    hasBall: team.hasBall,
    scoreText: team.scoreText,
    setScores: team.setScores,
  };
}

function ChartAvatarScoreHeader({ game, clock }: { game: CardsGame; clock: string }) {
  const left = cardsTeamAsMatchTeam(game.teams[0]);
  const right = cardsTeamAsMatchTeam(game.teams[1]);
  return (
    <ScoreStrip
      embedded
      left={{ icon: <TeamAvatar t={left} size={32} sport={game.sport} />, score: game.teams[0].score, abbr: game.teams[0].abbr }}
      right={{ icon: <TeamAvatar t={right} size={32} sport={game.sport} flip />, score: game.teams[1].score, abbr: game.teams[1].abbr }}
      clock={compactChartClock(clock, game.sport)}
      live
    />
  );
}

function ChartScoreMiddleHeader({ game, clock, cueColor }: { game: CardsGame; clock: string; cueColor: string }) {
  const left = cardsTeamAsMatchTeam(game.teams[0]);
  const right = cardsTeamAsMatchTeam(game.teams[1]);
  const showAbbr = useTeamAbbrUnderLogos();
  const displayFont = useDisplayFont();
  const oswald = useOswaldDataSet();
  return (
    <LiveCarouselCardHeader
      status={compactChartClock(clock, game.sport).toUpperCase()}
      cueColor={cueColor}
      variant="statusAboveCentered"
      gap={12}
      titleNode={
        <View
          style={{
            minHeight: SCORE_SQUARE_SIZE,
            flexDirection: "row",
            alignItems: showAbbr ? "flex-start" : "center",
            width: "100%",
          }}
        >
          <View style={{ flex: 1, alignItems: "center", gap: showAbbr ? 8 : 0 }}>
            <TeamAvatar t={left} size={32} sport={game.sport} />
            {showAbbr ? (
              <Text style={{ fontFamily: geist.medium, fontSize: 12, lineHeight: 16, color: colors.textAlternative }}>
                {game.teams[0].abbr.toUpperCase()}
              </Text>
            ) : null}
          </View>
          <Text
            {...oswald}
            style={{
              flexShrink: 0,
              fontFamily: displayFont,
              fontSize: 32,
              lineHeight: 32,
              color: colors.textPrimary,
              letterSpacing: -0.4,
            }}
          >
            {game.teams[0].score} – {game.teams[1].score}
          </Text>
          <View style={{ flex: 1, alignItems: "center", gap: showAbbr ? 8 : 0 }}>
            <TeamAvatar t={right} size={32} sport={game.sport} flip />
            {showAbbr ? (
              <Text style={{ fontFamily: geist.medium, fontSize: 12, lineHeight: 16, color: colors.textAlternative }}>
                {game.teams[1].abbr.toUpperCase()}
              </Text>
            ) : null}
          </View>
        </View>
      }
    />
  );
}

function CarouselTennisScoreUnit({ game }: { game: CardsGame }) {
  return (
    <View style={{ flexGrow: 1, justifyContent: "center", gap: TENNIS_ROW_GAP, width: "100%" }}>
      {game.teams.map((team) => (
        <View key={team.abbr} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {team.flag ? (
            <Image
              source={{ uri: teamFlagUri(team.flag) }}
              resizeMode="cover"
              style={{ width: TENNIS_FLAG, height: TENNIS_FLAG, borderRadius: 6 }}
            />
          ) : (
            <TeamAvatar t={cardsTeamAsMatchTeam(team)} size={TENNIS_FLAG} />
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              numberOfLines={1}
              style={{ fontFamily: geist.semibold, fontSize: 14, lineHeight: 22, color: colors.textPrimary }}
            >
              {team.name}
            </Text>
          </View>
          <ScoreUnit value={team.scoreText ?? ""} sets={team.setScores ?? []} activeSetIdx={(team.setScores ?? []).length - 1} />
        </View>
      ))}
    </View>
  );
}

export function matchToCardsGame(m: Match): CardsGame {
  const [home, away] = m.teams;
  const p0 = parseInt(home.pct, 10) || 50;
  const p1 = parseInt(away.pct, 10) || 50;
  const drawPct = soccerDrawCents(m) ?? (m.draw ? parseInt(m.draw.pct, 10) : undefined);
  return {
    title: `${home.name} vs. ${away.name}`,
    league: m.league,
    leagueColor: m.leagueColor,
    sport: m.sport ?? "sports",
    vol: m.vol,
    markets: m.markets,
    date: m.date,
    clock: formatLiveClock(m.live?.mins, m.time ?? m.date),
    teams: [
      {
        name: home.name,
        abbr: home.abbr ?? home.initial,
        color: home.color,
        pct: p0,
        score: home.score ?? 0,
        hasBall: home.hasBall,
        flag: teamFlagUri(home.flag),
        logo: home.logo,
        scoreText: home.scoreText,
        setScores: home.setScores,
      },
      {
        name: away.name,
        abbr: away.abbr ?? away.initial,
        color: away.color,
        pct: p1,
        score: away.score ?? 0,
        hasBall: away.hasBall,
        flag: teamFlagUri(away.flag),
        logo: away.logo,
        scoreText: away.scoreText,
        setScores: away.setScores,
      },
    ],
    latestPlay: { time: "", text: "" },
    drawPct,
  };
}

export function SportsChartCarouselCard({
  game,
  width,
  height,
  liveBaseDelayMs = 0,
}: {
  game: CardsGame;
  width: number;
  height?: number;
  liveBaseDelayMs?: number;
}) {
  const router = useRouter();
  const cue = useLiveCueColors();
  const headerVariant = useChartLiveCardHeader();
  const stack = useChartLiveCardStack();
  const clockParts = splitLiveClock(game.clock);
  const clock = useLiveClock(clockParts.token, true);
  const status = clockParts.token === clockParts.quarter ? clock : `${clockParts.quarter} · ${clock}`;
  const { displayVals } = useLiveOdds(
    game.drawPct !== undefined
      ? [game.teams[0].pct, game.teams[1].pct, game.drawPct]
      : [game.teams[0].pct, game.teams[1].pct],
    true,
    liveBaseDelayMs,
  );
  const themeMode = useThemeMode();
  const drawColor = backgroundMuted(themeMode);
  const headerH = LIVE_CARD_HEADER_H;
  const CHART_CARD_CHROME = 16 + headerH + 16 + 16 + 48 + 16;
  const chartHeight = height != null ? Math.max(80, height - CHART_CARD_CHROME) : SPORTS_CHART_H;
  const series = useMemo(() => {
    const lines = [
      {
        color: marketAccentColor(game.teams[0].color),
        points: sportsProbSeries(3 + liveBaseDelayMs, game.teams[0].pct / 100),
        label: game.teams[0].name,
      },
      {
        color: marketAccentColor(game.teams[1].color),
        points: sportsProbSeries(5 + liveBaseDelayMs, game.teams[1].pct / 100),
        label: game.teams[1].name,
      },
    ];
    if (game.drawPct !== undefined) {
      lines.splice(1, 0, {
        color: drawColor,
        points: sportsProbSeries(7 + liveBaseDelayMs, game.drawPct / 100),
        label: "Draw",
      });
    }
    return lines;
  }, [drawColor, game, liveBaseDelayMs]);

  const tennis = game.sport === "tennis";
  const headerInner = tennis ? (
    <LiveCarouselCardHeader
      status={status.toUpperCase()}
      cueColor={cue.color}
      titleNode={<CarouselTennisScoreUnit game={game} />}
      variant="statusAboveCentered"
      gap={TENNIS_HEADER_GAP}
    />
  ) : headerVariant === "avatar" ? (
    <ChartAvatarScoreHeader game={game} clock={status} />
  ) : headerVariant === "score" ? (
    <ChartScoreMiddleHeader game={game} clock={status} cueColor={cue.color} />
  ) : (
    <MatchTitleScoreHeader
      leftName={game.teams[0].name}
      rightName={game.teams[1].name}
      leftScore={game.teams[0].score}
      rightScore={game.teams[1].score}
      clock={status}
      live
      liveColor={cue.color}
    />
  );
  const header = (
    <LiveSportsHeaderSlot justifyContent={!tennis && headerVariant === "score" ? "flex-start" : "center"}>
      {headerInner}
    </LiveSportsHeaderSlot>
  );

  const chart = (
      <View style={{ marginHorizontal: -16, flexGrow: 1, justifyContent: "center" }}>
        <SportsLiveChart width={width} height={chartHeight} series={series} />
      </View>
  );
  const actions = (
      <View style={{ flexDirection: "row", gap: 10 }}>
        <CardOutcomeButton label={game.teams[0].abbr} cents={displayVals[0]} color={game.teams[0].color} market={game.title} />
        {game.drawPct !== undefined ? (
          <CardOutcomeButton label="Draw" cents={displayVals[2]} color={colors.slate} drawIcon market={game.title} />
        ) : null}
        <CardOutcomeButton label={game.teams[1].abbr} cents={displayVals[1]} color={game.teams[1].color} market={game.title} />
      </View>
  );

  return (
    <Pressable
      onPress={() => router.push(matchDetailHref(cardsGameToMatch(game)) as never)}
      style={{
        width,
        height,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        backgroundColor: colors.surface,
        padding: 16,
        gap: 16,
      }}
    >
      {stack === "chart" ? (
        <>
          {chart}
          {header}
          {actions}
        </>
      ) : (
        <>
          {header}
          {chart}
          {actions}
        </>
      )}
    </Pressable>
  );
}

function SportsVersusCarouselCard({ game, height, width }: { game: CardsGame; height?: number; width?: number }) {
  const router = useRouter();
  const feedSettings = useFeedSettings();
  if (game.sport === "tennis" && width != null) {
    return <SportsCardsCard game={game} width={width} height={height} />;
  }
  const match = cardsGameToMatch(game);
  // Reuse the same MatchCard/VersusCard path as sports pages, but isolate it
  // from home-only "Live left" settings so the carousel stays sides-shaped.
  const sportsSettings = {
    ...feedSettings,
    showFooter: true,
    footerDetail: { metadata: true, volume: true, endDate: false, outcomes: true },
    matchLayout: "versus" as const,
    versusLayout: "sides" as const,
    versusCenterLive: "centered" as const,
    liveFormat: "stacked" as const,
  };
  return (
    <Pressable onPress={() => router.push(matchDetailHref(match) as never)} style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <FeedSettingsProvider value={sportsSettings}>
        <MatchCard m={match} layout="versus" cardRadius={16} fillHeight={height != null} combo={false} />
      </FeedSettingsProvider>
    </Pressable>
  );
}

// Production BTC card: compact design — centered BTC coin wrapped in an
// orange radial countdown dial, orange "● LIVE · m:ss" line, bold title,
// muted reset cadence, and tinted Up/Down price buttons. Shares the fixed
// carousel card height so the rail stays even.
const BTC_CYCLE_SECONDS = 300; // "Resets every 5 min"

const BTC_PRODUCTION_VOL = "$2.4M Vol.";
const LIVE_META_FOOTER_GAP = 12;
const LIVE_META_FOOTER_H = 20;
const LIVE_META_FOOTER_BLOCK = LIVE_META_FOOTER_GAP + LIVE_META_FOOTER_H;

function LiveCardMetaFooter({ category, vol, moreCount = 0 }: { category: string; vol: string; moreCount?: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <MetaTag>{category}</MetaTag>
      <TradedMeta vol={vol} />
      <MetaChip volume tag={false}>{formatVol(vol)}</MetaChip>
      <MetaViewMore count={moreCount} />
    </View>
  );
}

// Compact production card height: 16px card padding all around, dial (52) +
// 10 + LIVE line (18) + 4 + title (24) + 2 + subtitle (18), a 16px gap to the
// 48px buttons, then 12px + 20px meta footer. Every production-rail card shares
// this height.
const PRODUCTION_CARD_H = 16 + 52 + 10 + 18 + 4 + 24 + 2 + 18 + 16 + 48 + LIVE_META_FOOTER_BLOCK + 16;

export function ProductionBtcCard({ width, height }: { width: number; height?: number }) {
  const router = useRouter();
  const { displayVals } = useLiveOdds([73, 27], true, 0);
  const [remaining, setRemaining] = useState(BTC_CYCLE_SECONDS - 1);
  useEffect(() => {
    const id = setInterval(() => setRemaining((r) => (r <= 1 ? BTC_CYCLE_SECONDS : r - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  // Radial countdown dial geometry (mirrors BtcDailyCard's ring).
  // Tight dial: 32px coin (16px radius) + ~5px gap to the 3px ring stroke.
  const RING = 52;
  const R = 21;
  const C = 2 * Math.PI * R;
  const fraction = remaining / BTC_CYCLE_SECONDS;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const clock = `${mins}:${String(secs).padStart(2, "0")}`;
  const orange = colors.bitcoin;

  return (
    <Pressable
      onPress={() => router.push("/btc-updown" as never)}
      style={{
        width,
        height,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        backgroundColor: colors.surface,
        padding: 16,
        alignItems: "stretch",
      }}
    >
      <View style={{ alignItems: "center" }}>
        <View style={{ width: RING, height: RING, alignItems: "center", justifyContent: "center" }}>
          <Svg width={RING} height={RING} style={{ position: "absolute" }}>
            <Circle cx={RING / 2} cy={RING / 2} r={R} fill="none" stroke={colors.cardBorder} strokeWidth={3} />
            <Circle
              cx={RING / 2}
              cy={RING / 2}
              r={R}
              fill="none"
              stroke={orange}
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - fraction)}
              transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
            />
          </Svg>
          <BitcoinLogo size={32} fill={orange} />
        </View>
        <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center", gap: LIVE_DOT_TEXT_GAP }}>
          <LiveDot color={orange} pulse />
          <Text style={{ fontFamily: geist.medium, fontSize: 13, lineHeight: 18, color: orange }}>
            LIVE · {clock}
          </Text>
        </View>
        <Text style={{ marginTop: 4, fontFamily: geist.semibold, fontSize: 16, lineHeight: 24, color: colors.textPrimary, textAlign: "center" }}>
          BTC Up or Down 5m
        </Text>
        <Text style={{ marginTop: 2, fontFamily: geist.regular, fontSize: 13, lineHeight: 18, color: colors.textMuted, textAlign: "center" }}>
          Resets every 5 min
        </Text>
      </View>
      <View style={{ flexGrow: 1, minHeight: 16 }} />
      <View style={{ gap: LIVE_META_FOOTER_GAP, width: "100%" }}>
        <View style={{ flexDirection: "row", gap: 10, width: "100%" }}>
          <CardOutcomeButton label="Up" cents={displayVals[0]} color={colors.green} market="BTC Up or Down 5m" />
          <CardOutcomeButton label="Down" cents={displayVals[1]} color={colors.red} market="BTC Up or Down 5m" />
        </View>
        <LiveCardMetaFooter category="Crypto" vol={BTC_PRODUCTION_VOL} moreCount={0} />
      </View>
    </Pressable>
  );
}

export function LiveCardsCarousel({
  gutter = 16,
  sportsVariant = "standard",
}: {
  gutter?: number;
  sportsVariant?: "standard" | "versus" | "production";
}) {
  const router = useRouter();
  const kalshi = useKalshiVenue();
  const { width: winW } = useWindowDimensions();
  const showLatestPlay = useLatestPlay();
  const fixedMarketActions = useFixedMarketActions();
  const btcCardVariant = useBtcLiveCarouselCard();
  const sportsGames = kalshi ? KALSHI_SPORTS_GAMES : SPORTS_GAMES;
  // One feed-card wide minus a peek of the next card.
  const cardW = winW - gutter * 2 - 28;
  // Every card on the rail (BTC, Standard sports, Versus sports) shares one
  // fixed design height so the carousel reads as a single even row.
  const cardH =
    btcCardVariant === "chart"
      ? cardW
      : sportsVariant === "production"
        ? PRODUCTION_CARD_H
        : liveCarouselCardHeight(showLatestPlay, fixedMarketActions);
  return (
    <View>
      <SectionHeader title="Live" onPress={() => router.push("/live" as never)} />
      <SnapHScroll gutter={gutter} interval={cardW + 10} gap={10}>
        {/* BTC card is always first on Polymarket; Kalshi live is NFL + NCAAF only. */}
        {!kalshi && sportsVariant === "production" ? (
          btcCardVariant === "chart" ? (
            <BtcCardsCard width={cardW} height={cardH} headerVariant="statusAboveCentered" />
          ) : (
            <ProductionBtcCard width={cardW} height={cardH} />
          )
        ) : !kalshi ? (
          <BtcCardsCard
            width={cardW}
            height={cardH}
            headerVariant={sportsVariant === "versus" ? "statusAboveCentered" : DEFAULT_LIVE_CAROUSEL_HEADER}
            headerStatusLabel={sportsVariant === "versus" ? "BTC LIVE" : "LIVE"}
            hideHeaderTitle={sportsVariant === "versus"}
          />
        ) : null}
        {sportsGames.map((g, i) =>
          btcCardVariant === "chart" ? (
            <SportsChartCarouselCard
              key={g.title}
              game={g}
              width={cardW}
              height={cardH}
              liveBaseDelayMs={(i + 1) * 600}
            />
          ) : sportsVariant === "versus" || sportsVariant === "production" ? (
            <View key={g.title} style={{ width: cardW, height: cardH, overflow: "hidden" }}>
              <SportsVersusCarouselCard game={g} height={cardH} width={cardW} />
            </View>
          ) : (
            <SportsCardsCard key={g.title} game={g} width={cardW} height={cardH} liveBaseDelayMs={(i + 1) * 600} />
          ),
        )}
      </SnapHScroll>
    </View>
  );
}

function liveCarouselCardHeight(showLatestPlay: boolean, fixedMarketActions: boolean): number {
  const scoreUnit = sportsScoreUnitHeight(showLatestPlay);
  if (fixedMarketActions) {
    // Body gains the vertical centering inset; the fixed action layer replaces
    // the in-flow button row + bottom padding.
    return 14 + LIVE_CAROUSEL_HEADER_H + 16 + scoreUnit + SPORTS_SCORE_CENTER_INSET * 2 + SPORTS_FIXED_ACTION_LAYER_H;
  }
  return 14 + LIVE_CAROUSEL_HEADER_H + 16 + scoreUnit + 16 + 48 + LIVE_META_FOOTER_BLOCK + 14;
}
