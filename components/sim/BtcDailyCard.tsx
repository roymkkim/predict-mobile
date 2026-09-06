import { useEffect, useMemo, useRef, useState } from "react";

// Per-instance SVG def ids: web SVG ids are document-global.
let svgUidCounter = 0;
import { Animated, Pressable, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Line, Path, Polyline, Stop } from "react-native-svg";
import { colors } from "@/lib/sim/colors";
import { useChartGradient } from "@/lib/sim/chartGradientStore";
import { openBetSlip } from "@/lib/sim/betSlipStore";
import { buttonMetrics, outcomeButtonVisual } from "@/lib/sim/buttonStyle";
import { useUxrMode } from "@/lib/sim/uxrModeStore";
import { usePillButtons } from "@/lib/sim/pillButtonsStore";
import { useOutcomeButtonColorMode } from "@/lib/sim/outcomeButtonColorStore";
import { useFeedSettings } from "@/lib/sim/FeedSettingsContext";
import type { BtcDailyMarket } from "@/lib/sim/types";
import { LiveBorder } from "./LiveBorder";
import { LiveDot } from "./Crest";
import { geist } from "@/lib/sim/geistFonts";

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Native port of predict-simulator-2's "BTC Up or Down Daily" live-center card.
// A live random-walk price area chart (terminating at a pulsing current-price
// dot), a target line + tag, a centered Bitcoin coin mark wrapped in a radial
// countdown ring, a live mm:ss timer, two Up/Down probability buttons, and a
// vol / reset-cadence footer. The price walk + countdown are ephemeral
// interaction state, exactly like the web original.

const VIEW_W = 320;
const VIEW_H = 112;
const POINTS = 44; // samples drawn across the chart width
const LAST_X = 300; // x of the final point/dot (leaves room on the right)
const SEEK_MARK_GAP = 32; // px gap from the card's right edge to the seek BTC marker
const Y_TOP = 20; // y for the top of the price band (+2%)
const Y_BOT = 74; // y for the bottom of the price band (-2%)
const TARGET_Y = 96; // y of the solid target line
const CYCLE_SECONDS = 300; // "Resets every 5 minutes"

// Linear-interpolate between two #rrggbb hex colors (t clamped 0..1).
function mixHex(a: string, b: string, t: number): string {
  const k = Math.max(0, Math.min(1, t));
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  const ch = (i: number) => Math.round(pa[i] + (pb[i] - pa[i]) * k).toString(16).padStart(2, "0");
  return `#${ch(0)}${ch(1)}${ch(2)}`;
}

// Seek-variant chart geometry: a shorter 64px chart with the target line
// bottom-aligned and the price band sitting above it.
const SEEK_VIEW_H = 64;
const SEEK_TARGET_Y = 62;
const SEEK_TOP_Y = 8;

// Inline canonical Bitcoin logo (orange disc + white ₿ glyph) as a vector so it
// stays crisp at any size with no external asset dependency.
export function BitcoinLogo({ size, fill }: { size: number; fill: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Circle cx={16} cy={16} r={16} fill={fill} />
      <Path
        fill="#ffffff"
        d="M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.92-.22-1.385-.326l.695-2.783L15.596 6l-.708 2.839c-.376-.086-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.183-.045-1.13 4.532c-.086.212-.303.531-.793.41.018.025-1.256-.313-1.256-.313l-.858 1.978 2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538zm-3.95 5.538c-.533 2.147-4.148.986-5.32.695l.95-3.805c1.172.293 4.929.872 4.37 3.11zm.535-5.569c-.487 1.953-3.495.96-4.47.717l.86-3.45c.975.243 4.118.696 3.61 2.733z"
      />
    </Svg>
  );
}

function parsePrice(label: string): number {
  const n = Number(label.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 61201;
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

// Deterministic 0..1 pseudo-noise for the jagged seek line; keyed on a sample
// index so the jitter scrolls coherently with the window instead of flickering.
function noise01(n: number): number {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

// Map a price to a y-coord on a FIXED ±2% band so small moves read as gentle
// wiggles instead of the whole line rescaling each tick.
function yForPrice(p: number, base: number): number {
  const lo = base * 0.98;
  const hi = base * 1.02;
  const t = clamp((p - lo) / (hi - lo), 0, 1);
  return Y_BOT - t * (Y_BOT - Y_TOP);
}

// Build an initial gently-rising series so the first paint already looks like a
// plausible chart before the live walk kicks in.
function seedSeries(base: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < POINTS; i++) {
    const t = i / (POINTS - 1);
    const drift = (t - 0.5) * 0.01;
    const wobble = Math.sin(i * 0.9) * 0.0018;
    out.push(base * (1 + drift + wobble));
  }
  return out;
}

function fmtPrice(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

function fmtClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function BtcDailyCard({
  market,
  variant = "default",
}: {
  market: BtcDailyMarket;
  variant?: "default" | "seek" | "seek-left";
}) {
  const uid = useRef(`btcdaily${++svgUidCounter}`).current;
  const showChartGradient = useChartGradient();
  const { density, showLiveAccent = true } = useFeedSettings();
  const comfort = density === "comfort";
  const tintBtc = colors.bitcoin;
  // Both seek variants share the same chart treatment (64px band, BTC end
  // marker, target line). "seek-left" additionally moves the header above the
  // chart, left-aligns it, and pins the target label to the right edge.
  const SEEK = variant === "seek" || variant === "seek-left";
  const LEFT = variant === "seek-left";

  // Subscribe to the UXR mode so the mounted card re-renders (and re-runs
  // outcomeButtonVisual's non-reactive getUxrMode() read) when the toggle flips.
  useUxrMode();
  const pill = usePillButtons();
  const betR = pill ? 999 : 12;
  const mode = useOutcomeButtonColorMode();
  // Up = success green, Down = error red (same scheme as Yes/No outcomes).
  const upVisual = outcomeButtonVisual("default", "gray-colored", colors.greenOutline, { mode, label: "Up", pill });
  const downVisual = outcomeButtonVisual("default", "gray-colored", colors.red, { mode, label: "Down", pill });
  const { btnH, fontSize: btnFontSize } = buttonMetrics(density, "lg");

  const base = useMemo(() => parsePrice(market.price), [market.price]);
  const [series, setSeries] = useState<number[]>(() => seedSeries(base));
  const [remaining, setRemaining] = useState(CYCLE_SECONDS);
  const [cardW, setCardW] = useState(0);
  const [seekLabelW, setSeekLabelW] = useState(0);

  // Re-seed if the configured base price changes.
  useEffect(() => {
    setSeries(seedSeries(base));
  }, [base]);

  // Seek-variant oscillation band + an in-reach target the price repeatedly
  // drifts down toward. The price swings between seekHighP (top) and seekLowP
  // (bottom, just above the target) so it visibly "approaches" the target line
  // at the bottom of each cycle.
  const seekHighP = base * 1.01;
  const seekLowP = base * 0.992;
  const seekTargetPrice = base * 0.9905;
  const chartH = SEEK ? SEEK_VIEW_H : VIEW_H;

  // Live price walk: scroll the window left and append a new random-walk sample.
  // (Disabled for the seek variant, which drives a smooth deterministic wave.)
  useEffect(() => {
    if (SEEK) return;
    const id = setInterval(() => {
      setSeries((prev) => {
        const last = prev[prev.length - 1] ?? base;
        const step = (Math.random() - 0.5) * base * 0.0042;
        let next = last + step;
        const lo = base * 0.98;
        const hi = base * 1.02;
        if (next < lo) next = lo + Math.random() * base * 0.0015;
        if (next > hi) next = hi - Math.random() * base * 0.0015;
        return [...prev.slice(1), next];
      });
    }, 650);
    return () => clearInterval(id);
  }, [base, SEEK]);

  // Seek variant: smoothly glide the whole price window from a continuous wave
  // so the terminating mark eases up and down and dwells near the target at the
  // bottom of each cycle (cosine dwells at its extremes). Sampled at ~16fps for
  // smooth motion; a small second harmonic keeps each dip from looking robotic.
  useEffect(() => {
    if (!SEEK) return;
    const STEP_MS = 210; // time spacing between adjacent chart points
    const PERIOD = 8800; // one up/down cycle
    const w = (2 * Math.PI) / PERIOD;
    const mid = (seekHighP + seekLowP) / 2;
    const amp = (seekHighP - seekLowP) / 2;
    const start = Date.now();
    const id = setInterval(() => {
      const now = Date.now() - start;
      setSeries(() => {
        const out: number[] = [];
        for (let i = 0; i < POINTS; i++) {
          const ms = now - (POINTS - 1 - i) * STEP_MS;
          const primary = Math.cos(w * ms);
          const secondary = 0.14 * Math.cos(w * 2.7 * ms + 1);
          // Jagged minute-tick jitter: interpolate between adjacent integer
          // noise samples so the rough shape scrolls smoothly without flicker.
          const f = ms / STEP_MS;
          const k = Math.floor(f);
          const frac = f - k;
          const jag = (noise01(k) + (noise01(k + 1) - noise01(k)) * frac) * 2 - 1;
          const u = clamp(primary + secondary + jag * 0.22, -1, 1);
          out.push(mid + amp * u);
        }
        return out;
      });
    }, 40);
    return () => clearInterval(id);
  }, [SEEK, seekHighP, seekLowP]);

  // Countdown that drives the radial ring; refills when it hits zero.
  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((r) => (r <= 1 ? CYCLE_SECONDS : r - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Outward ring pulse for the current-price dot: a 500ms expansion that
  // fades as it grows, then a 3000ms rest before the next pulse. The 0ms reset
  // snaps the (now-invisible) ring back to the dot before looping.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (SEEK) return; // seek mode hides the pulse ring — don't run the loop
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.delay(3000),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, SEEK]);
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  // Gentle "breathing" of the under-line glow, mirroring the resting border-glow
  // feel: a slow ~4s in/out envelope that scales the fill's opacity so the glow
  // softly intensifies and recedes instead of sitting static. (fillOpacity is an
  // SVG prop, so this animation can't use the native driver.)
  const glowBreath = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowBreath, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(glowBreath, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glowBreath]);
  const glowOpacity = glowBreath.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });

  const ys = useMemo(() => {
    if (SEEK) {
      const span = SEEK_TARGET_Y - SEEK_TOP_Y;
      const denom = seekHighP - seekTargetPrice;
      return series.map((p) => SEEK_TARGET_Y - ((p - seekTargetPrice) / denom) * span);
    }
    return series.map((p) => yForPrice(p, base));
  }, [series, base, SEEK, seekHighP, seekTargetPrice]);
  // Seek: end the line (and its BTC marker) a fixed SEEK_MARK_GAP px from the
  // card's right edge. The marker is centered on the line end (20px wide → 10px
  // half), so the line end maps to px `cardW - SEEK_MARK_GAP - 10`; convert that
  // back to viewBox units. Capped at LAST_X so it never extends past the default.
  const lastX =
    SEEK && cardW > 0
      ? Math.min(LAST_X, (VIEW_W * (cardW - SEEK_MARK_GAP - 10)) / cardW)
      : LAST_X;
  const linePts = useMemo(
    () => ys.map((y, i) => `${((i / (POINTS - 1)) * lastX).toFixed(1)},${y.toFixed(1)}`).join(" "),
    [ys, lastX],
  );
  // Closed area under the line (line points, then down to the chart bottom and
  // back) so we can paint a soft movement-colored glow that fades downward.
  const areaPath = useMemo(() => {
    if (ys.length === 0) return "";
    const pts = ys.map((y, i) => `${((i / (POINTS - 1)) * lastX).toFixed(1)},${y.toFixed(1)}`);
    return `M${pts[0]} L${pts.slice(1).join(" L")} L${lastX},${chartH} L0,${chartH} Z`;
  }, [ys, chartH, lastX]);
  const livePrice = series[series.length - 1] ?? base;
  // A live move below the starting price is an error/red state; a move above
  // it is a success/green state. BTC orange remains reserved for the coin
  // mark and countdown ring.
  const movementColor = livePrice < base ? colors.red : colors.greenOutline;
  const lastY = ys[ys.length - 1] ?? Y_TOP;
  const dotLeft = cardW ? (lastX / VIEW_W) * cardW : 0;
  // Seek: keep the 20px BTC marker's bottom edge 4px above the target line
  // (center 10px tall half + 4px gap = SEEK_TARGET_Y - 14).
  const dotTop = SEEK ? clamp(lastY, 10, SEEK_TARGET_Y - 14) : clamp(lastY, 14, VIEW_H - 14);
  // Price label: corner-align the value's bottom-right corner to the marker's
  // top-left corner (coin in seek, dot in default) with a 0px box gap. The 12/20
  // line-height leading supplies the visual breathing room from the marker.
  const markerHalf = SEEK ? 10 : 6.5;
  const priceRight = Math.max(8, cardW - (dotLeft - markerHalf));
  const priceTop = clamp(dotTop - markerHalf - 20, 0, chartH - 20);

  // Seek variant: how close the live price sits to the target (1 = at the dip,
  // hard against the target). Normalized over the oscillation band so the value
  // reaches a true 1.0 at the bottom dwell. Drives the line + mark opacity so the
  // color saturates to full as it nears the target and fades as it drifts away.
  const seekCloseness = SEEK
    ? 1 - clamp((livePrice - seekLowP) / (seekHighP - seekLowP), 0, 1)
    : 1;
  const seekLineOpacity = SEEK ? 0.4 + 0.6 * seekCloseness : 1;
  const seekMarkOpacity = SEEK ? 0.45 + 0.55 * seekCloseness : 1;
  // The target line + label fade from neutral toward BTC orange as the price
  // approaches the target (seekCloseness 0 -> 1).
  const seekTargetColor = SEEK ? mixHex(colors.textMuted, tintBtc, seekCloseness) : colors.textMuted;
  const seekTargetLineOpacity = SEEK ? 0.3 + 0.7 * seekCloseness : 1;
  const seekTargetY = SEEK ? SEEK_TARGET_Y : TARGET_Y;
  // Default-variant target price: invert the ±2% band y-mapping at TARGET_Y so
  // the pill's price reads as the level where the target line visually sits.
  const defaultTargetPrice = base * (0.98 + ((Y_BOT - TARGET_Y) / (Y_BOT - Y_TOP)) * 0.04);

  // Seek target line: full width to the card edges, broken by a gap around the
  // "$X target" label (measured in px, converted into viewBox units). The
  // centered ("seek") layout breaks symmetrically around the middle; the
  // right-aligned ("seek-left") layout runs a full-width left line, then the
  // label, then a fixed 12px line to the right edge (4px gap around the text).
  const pxToVB = cardW > 0 ? VIEW_W / cardW : 1;
  const seekLabelHalfVB = (seekLabelW / 2) * pxToVB;
  const seekLabelVB = seekLabelW * pxToVB;
  const seekGapVB = 4 * pxToVB; // 4px gap on each side of the "$X target" label
  const seekRightDashVB = 12 * pxToVB; // "seek-left": fixed 12px final dash
  const seekLineLeftEnd = LEFT
    ? Math.max(0, VIEW_W - seekRightDashVB - 2 * seekGapVB - seekLabelVB)
    : Math.max(0, VIEW_W / 2 - seekLabelHalfVB - seekGapVB);
  const seekLineRightStart = LEFT
    ? Math.max(0, VIEW_W - seekRightDashVB)
    : Math.min(VIEW_W, VIEW_W / 2 + seekLabelHalfVB + seekGapVB);

  // Radial countdown ring geometry.
  const RING = 70;
  const R = 25.5;
  const C = 2 * Math.PI * R;
  const fraction = remaining / CYCLE_SECONDS;

  return (
    <View
      onLayout={(e) => setCardW(e.nativeEvent.layout.width)}
      style={{
        position: "relative",
        width: "100%",
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: colors.surfaceTransparent,
        paddingTop: 12,
      }}
    >
      {/* "seek-left" gets the standard-card corner accent + breathing inner
          glow, in success green. LiveBorder also paints the neutral hairline (so
          the card drops its own border above), and reveals on scroll where a
          ScrollRevealProvider is present (home feed); elsewhere it rests lit. */}
      {LEFT && showLiveAccent && <LiveBorder placement="left" color={colors.green} live radius={16} />}

      {/* "seek-left" header: timestamp, then title, then reset cadence — all
          left-aligned above the chart. */}
      {LEFT && (
        <View style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <LiveDot color={colors.green} pulse />
            <Text style={{ fontFamily: geist.medium, fontSize: comfort ? 14 : 13, color: colors.green }}>
              {fmtClock(remaining)}
            </Text>
          </View>
          <Text style={{ marginTop: 6, fontFamily: geist.semibold, fontSize: 16, lineHeight: 24, color: colors.textPrimary }}>
            {market.title}
          </Text>
          <Text style={{ marginTop: 2, fontFamily: geist.medium, fontSize: 14, lineHeight: 20, color: colors.textMuted }}>
            {market.resets}
          </Text>
        </View>
      )}

      {/* Live price area chart: success green above the base, error red below. */}
      <View style={{ height: chartH, width: "100%" }}>
        {cardW > 0 && (
          <Svg
            width={cardW}
            height={chartH}
            viewBox={`0 0 ${VIEW_W} ${chartH}`}
            preserveAspectRatio="none"
          >
            {showChartGradient ? (
              <Defs>
                <LinearGradient id={`btcLineFade-${uid}`} x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0%" stopColor={movementColor} stopOpacity={0} />
                  <Stop offset="35%" stopColor={movementColor} stopOpacity={1} />
                  <Stop offset="100%" stopColor={movementColor} stopOpacity={1} />
                </LinearGradient>
                {/* Vertical BTC glow that hugs the line and fades downward. */}
                <LinearGradient id={`btcGlowFill-${uid}`} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={movementColor} stopOpacity={0.14} />
                  <Stop offset="100%" stopColor={movementColor} stopOpacity={0} />
                </LinearGradient>
              </Defs>
            ) : null}
            {showChartGradient ? (
              <AnimatedPath
                d={areaPath}
                fill={`url(#btcGlowFill-${uid})`}
                fillOpacity={SEEK ? seekLineOpacity : glowOpacity}
              />
            ) : null}
            <Polyline
              points={linePts}
              fill="none"
              stroke={showChartGradient ? `url(#btcLineFade-${uid})` : movementColor}
              strokeWidth={2}
              strokeOpacity={seekLineOpacity}
              strokeLinejoin={SEEK ? "miter" : "round"}
              strokeLinecap={SEEK ? "butt" : "round"}
            />
            {SEEK && (
              <>
                {/* Target line. Both seek variants render it SOLID; the dashed
                    cue lives on the orange line at the BTC marker level below. */}
                <Line
                  x1={0}
                  y1={seekTargetY}
                  x2={seekLineLeftEnd}
                  y2={seekTargetY}
                  stroke={seekTargetColor}
                  strokeOpacity={seekTargetLineOpacity}
                  strokeWidth={1}
                />
                <Line
                  x1={seekLineRightStart}
                  y1={seekTargetY}
                  x2={VIEW_W}
                  y2={seekTargetY}
                  stroke={seekTargetColor}
                  strokeOpacity={seekTargetLineOpacity}
                  strokeWidth={1}
                />
              </>
            )}
            {/* Movement-colored dashed line in line with the live marker,
                running the full width of the card. Shown on every variant. */}
            <Line
              x1={0}
              y1={dotTop}
              x2={VIEW_W}
              y2={dotTop}
              stroke={movementColor}
              strokeWidth={1}
              strokeDasharray="4,4"
              strokeOpacity={SEEK ? seekLineOpacity : 1}
            />
          </Svg>
        )}

        {/* Target line + tag */}
        {SEEK ? (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: seekTargetY - 8,
              alignItems: LEFT ? "flex-end" : "center",
              paddingRight: LEFT ? 16 : 0,
            }}
          >
            <Text
              onLayout={(e) => setSeekLabelW(e.nativeEvent.layout.width)}
              style={{
                fontFamily: geist.medium,
                fontSize: 14,
                color: seekTargetColor,
              }}
            >
              {fmtPrice(seekTargetPrice)} target
            </Text>
          </View>
        ) : (
          <>
            <View
              style={{ position: "absolute", left: 0, right: 0, top: TARGET_Y, height: 1, backgroundColor: colors.cardBorder }}
            />
            <View
              style={{
                position: "absolute",
                right: 12,
                top: TARGET_Y - 11,
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 2,
                backgroundColor: "rgba(37,38,40,0.72)",
              }}
            >
              <Text style={{ fontFamily: geist.medium, fontSize: 12, color: colors.textMuted }}>{fmtPrice(defaultTargetPrice)} target</Text>
            </View>
          </>
        )}

        {/* Current-price marker: BTC logo (seek) or pulsing dot at the line's end */}
        {cardW > 0 && (
          <>
            {SEEK ? (
              <>
                {/* Opaque card-colored disc so the chart line never shows
                    through the BTC logo (full opacity, doesn't fade). */}
                <View
                  style={{
                    position: "absolute",
                    left: dotLeft - 10,
                    top: dotTop - 10,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: colors.surface,
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    left: dotLeft - 10,
                    top: dotTop - 10,
                    width: 20,
                    height: 20,
                    opacity: seekMarkOpacity,
                  }}
                >
                  <BitcoinLogo size={20} fill={tintBtc} />
                </View>
              </>
            ) : (
              <>
                <Animated.View
                  style={{
                    position: "absolute",
                    left: dotLeft - 6.5,
                    top: dotTop - 6.5,
                    width: 13,
                    height: 13,
                    borderRadius: 6.5,
                    borderWidth: 1.5,
                    borderColor: movementColor,
                    backgroundColor: "transparent",
                    opacity: pulseOpacity,
                    transform: [{ scale: pulseScale }],
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    left: dotLeft - 6.5,
                    top: dotTop - 6.5,
                    width: 13,
                    height: 13,
                    borderRadius: 6.5,
                    backgroundColor: movementColor,
                  }}
                />
              </>
            )}
            <Text
              style={{
                position: "absolute",
                right: priceRight,
                top: priceTop,
                paddingHorizontal: 10,
                paddingVertical: 2,
                borderRadius: 18,
                backgroundColor: livePrice < base ? colors.redSoft : colors.greenSoft,
                fontFamily: geist.regular,
                fontSize: 14,
                lineHeight: 20,
                color: movementColor,
              }}
            >
              {fmtPrice(livePrice)}
            </Text>
          </>
        )}
      </View>

      <View style={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: LEFT ? 16 : SEEK ? 14 : 0, alignItems: "center" }}>
        {/* Bitcoin coin mark wrapped in a radial countdown ring. Pulled up with a
            negative top margin so it sits 16px tighter to the chart; rather than
            cropping the chart (which would slice the under-line gradient with a
            hard edge), the coin overlaps the chart's bottom so the glow's faded
            tail bleeds smoothly behind the icon instead of being cut off.
            Hidden in seek mode (the chart's BTC mark already reads as the brand). */}
        {!SEEK && (
          <View style={{ width: RING, height: RING, marginTop: -4, alignItems: "center", justifyContent: "center" }}>
            <Svg width={RING} height={RING} style={{ position: "absolute" }}>
              <Circle cx={RING / 2} cy={RING / 2} r={R} fill="none" stroke={colors.cardBorder} strokeWidth={3} />
              <Circle
                cx={RING / 2}
                cy={RING / 2}
                r={R}
                fill="none"
                stroke={tintBtc}
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - fraction)}
                transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
              />
            </Svg>
            <BitcoinLogo size={40} fill={tintBtc} />
          </View>
        )}

        {/* Live timestamp (countdown that drives the ring above), placed ABOVE
            the title with an 8px gap above its dot. */}
        {!LEFT && (
          <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green }} />
            <Text style={{ fontFamily: geist.medium, fontSize: comfort ? 14 : 13, color: colors.green }}>
              {fmtClock(remaining)}
            </Text>
          </View>
        )}

        {!LEFT && (
          <Text style={{ marginTop: 4, fontFamily: geist.semibold, fontSize: 16, lineHeight: 24, color: colors.textPrimary, textAlign: "center" }}>
            {market.title}
          </Text>
        )}

        {/* Up / Down buttons */}
        <View style={{ marginTop: LEFT ? 8 : 22, flexDirection: "row", gap: 10, width: "100%" }}>
          <Pressable
            onPress={() => openBetSlip({ market: market.title, title: "Up", oddsCents: parseInt(String(market.up.pct), 10) || 0, color: colors.greenOutline, side: "yes" })}
            style={[{ flex: 1, height: btnH, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }, upVisual.container, { borderRadius: betR }]}
          >
            <Text style={[{ fontFamily: geist.medium, fontSize: btnFontSize }, upVisual.text]}>Up</Text>
            <Text style={[{ fontFamily: geist.medium, fontSize: btnFontSize }, upVisual.text]}>{market.up.pct}</Text>
          </Pressable>
          <Pressable
            onPress={() => openBetSlip({ market: market.title, title: "Down", oddsCents: parseInt(String(market.down.pct), 10) || 0, color: colors.red, side: "no" })}
            style={[{ flex: 1, height: btnH, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }, downVisual.container, { borderRadius: betR }]}
          >
            <Text style={[{ fontFamily: geist.medium, fontSize: btnFontSize }, downVisual.text]}>Down</Text>
            <Text style={[{ fontFamily: geist.medium, fontSize: btnFontSize }, downVisual.text]}>{market.down.pct}</Text>
          </Pressable>
        </View>

        {/* Footer: reset cadence only, centered to the card (moved into the
            header for the left-aligned variant). */}
        {!LEFT && (
          <View style={{ marginTop: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", width: "100%" }}>
            <Text style={{ fontFamily: geist.medium, fontSize: 12, lineHeight: 20, color: colors.textMuted }}>
              {market.resets}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
