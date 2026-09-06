import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Defs, Line, LinearGradient, Path, Polyline, Stop } from "react-native-svg";
import { colors } from "@/lib/sim/colors";
import { useChartGradient } from "@/lib/sim/chartGradientStore";
import type { HeroBtcChart } from "@/lib/sim/types";
import { BitcoinLogo } from "./BtcDailyCard";
import { LiveDot } from "./Crest";
import { geist } from "@/lib/sim/geistFonts";

// A "BTC Up or Down" chart banner for the carousel, shown alongside the
// Wimbledon / World Cup hero image banners. An animated random-walk area chart
// with a live current-price marker + a target price indicator, over a title +
// detail text block (timestamp above). When `countdownSeconds` is supplied the
// timestamp ticks a live hh:mm:ss reset countdown (the BTC signature). The card
// height matches the image banners (width * 200/320), with the chart flexing to
// fill whatever space the text block leaves.
//
// The `chartStyle` prop swaps the chart treatment:
//  - "target" (default): the pre-existing BtcDailyCard look — a dashed accent
//    line at the live price level, a SOLID "$X target" line (broken around its
//    right-pinned label) at the target level, and a Bitcoin coin marker at the
//    line's end with the live "$X" price to its left.
//  - "chevron": no lines; an accent "Target: $X" tag RESTS at the chart Y of the
//    target price level (pinned 16px from the right edge) carrying looping
//    cascading chevrons that flow toward the target — DOWN when the live price
//    is above it, UP when below. The tag only moves when the live line surpasses
//    it (shoved to the opposite side of the dot, then snapping back). The price
//    label tracks the dot on the side away from the target. The target's opacity
//    ramps toward 1.0 as the price nears the target price.

const VIEW_W = 320; // chart viewBox width (x is stretched to the card width)
const CHART_VB_H = 92; // chart viewBox height (stretched to the measured px height)
const POINTS = 44; // samples drawn across the chart width
const LAST_X = 300; // x of the final point/dot (leaves room on the right)
const Y_TOP = 12; // viewBox y for the top of the price band
const Y_BOT = 82; // viewBox y for the bottom of the price band (deeper band)
const TARGET_V = 0.18; // normalized level the target price sits at (0 bottom .. 1 top)
// The live walk is confined to an upper band kept well above TARGET_V so the BTC
// coin (which sits at the live price level) barely ever descends to the target text.
const LIVE_MIN = 0.46;
const LIVE_MAX = 0.9;
const BAND = 0.012; // ±1.2% price band the normalized series maps onto
const AnimatedPath = Animated.createAnimatedComponent(Path);

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

// Jagged seed series (normalized 0..1) so the first paint already reads as a
// choppy price line before the live walk kicks in.
function seedSeries(): number[] {
  const out: number[] = [];
  let v = (LIVE_MIN + LIVE_MAX) / 2;
  for (let i = 0; i < POINTS; i++) {
    v = clamp(v + (Math.random() - 0.5) * 0.24, LIVE_MIN, LIVE_MAX);
    out.push(v);
  }
  return out;
}

function fmtClock(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtPrice(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

function fmtPriceCents(n: number): string {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Animated chevrons that "flow" toward the target. Each chevron repeatedly
// drifts in the target's direction (down for "down", up for "up") while fading
// out, then resets to the top of its travel. Two chevrons run half a cycle out
// of phase so the motion reads as a continuous cascade.
const ARROW_TRAVEL = 7; // px each chevron drifts before resetting
function FlowChevron({ dir, color, delay }: { dir: "up" | "down"; color: string; delay: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, { toValue: 1, duration: 1100, easing: Easing.linear, useNativeDriver: true }),
    );
    const id = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(id);
      loop.stop();
    };
  }, [t, delay]);
  const sign = dir === "down" ? 1 : -1;
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, sign * ARROW_TRAVEL] });
  const opacity = t.interpolate({ inputRange: [0, 0.2, 0.75, 1], outputRange: [0, 1, 1, 0] });
  return (
    <Animated.View style={{ position: "absolute", left: 1, top: dir === "down" ? 0 : ARROW_TRAVEL, transform: [{ translateY }], opacity }}>
      <Ionicons name={dir === "down" ? "chevron-down" : "chevron-up"} size={12} color={color} />
    </Animated.View>
  );
}
function TargetArrows({ dir, color }: { dir: "up" | "down"; color: string }) {
  return (
    <View style={{ width: 14, height: 12 + ARROW_TRAVEL }}>
      <FlowChevron dir={dir} color={color} delay={0} />
      <FlowChevron dir={dir} color={color} delay={550} />
    </View>
  );
}

export function HeroChartBanner({
  width,
  title,
  detail,
  timestamp,
  countdownSeconds,
  accent,
  basePrice = 67000,
  chartStyle = "target",
  orange = false,
  onPress,
}: {
  width: number;
  title: string;
  detail: string;
  timestamp?: string;
  countdownSeconds?: number;
  accent: string;
  basePrice?: number;
  chartStyle?: HeroBtcChart;
  orange?: boolean;
  onPress?: () => void;
}) {
  const isTarget = chartStyle === "target";
  const showChartGradient = useChartGradient();
  // Orange theme: #BA6600 card with every element (lines/labels/dot/glow) in BTC
  // orange; only the title + detail text stay white, and the coin is a white disc.
  const el = orange ? colors.bitcoin : accent;
  const [series, setSeries] = useState<number[]>(() => seedSeries());
  const [remaining, setRemaining] = useState(countdownSeconds ?? 0);
  const [chartPxH, setChartPxH] = useState(0);
  const [priceH, setPriceH] = useState(0);
  const [targetH, setTargetH] = useState(0);
  // Measured size of the "$X target" label, used to break the solid target line
  // around it + center it on the target level (target style only).
  const [tgtLabelW, setTgtLabelW] = useState(0);
  const [tgtLabelH, setTgtLabelH] = useState(0);

  // Match the image banners' height; the chart flexes into the leftover space.
  const bannerH = Math.round(width * (200 / 320));

  // Live reset countdown (BTC). Refills when it hits zero.
  useEffect(() => {
    if (countdownSeconds == null) return;
    setRemaining(countdownSeconds);
    const id = setInterval(() => {
      setRemaining((r) => (r <= 1 ? countdownSeconds : r - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [countdownSeconds]);
  const stamp = countdownSeconds != null ? fmtClock(remaining) : (timestamp ?? "");

  // Live random walk: scroll the window left and append a new clamped sample.
  useEffect(() => {
    const id = setInterval(() => {
      setSeries((prev) => {
        const last = prev[prev.length - 1] ?? (LIVE_MIN + LIVE_MAX) / 2;
        // Big, un-eased steps so the line stays jagged (no momentum smoothing).
        let next = last + (Math.random() - 0.5) * 0.26;
        if (next < LIVE_MIN) next = LIVE_MIN + Math.random() * 0.1;
        if (next > LIVE_MAX) next = LIVE_MAX - Math.random() * 0.1;
        return [...prev.slice(1), next];
      });
    }, 650);
    return () => clearInterval(id);
  }, []);

  // Outward ring pulse for the current-value dot.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.delay(3000),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  // Slow ~4s breathing of the under-line glow opacity (SVG prop, JS-driven).
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

  const ys = useMemo(
    () => series.map((v) => Y_BOT - clamp(v, 0, 1) * (Y_BOT - Y_TOP)),
    [series],
  );
  const linePts = useMemo(
    () => ys.map((y, i) => `${((i / (POINTS - 1)) * LAST_X).toFixed(1)},${y.toFixed(1)}`).join(" "),
    [ys],
  );
  const areaPath = useMemo(() => {
    if (ys.length === 0) return "";
    const pts = ys.map((y, i) => `${((i / (POINTS - 1)) * LAST_X).toFixed(1)},${y.toFixed(1)}`);
    return `M${pts[0]} L${pts.slice(1).join(" L")} L${LAST_X},${CHART_VB_H} L0,${CHART_VB_H} Z`;
  }, [ys]);

  // Current + target prices, mapped from the normalized series onto a ±BAND band.
  const lastV = series[series.length - 1] ?? 0.5;
  const currentPrice = basePrice * (1 + (lastV - 0.5) * BAND);
  const targetPrice = basePrice * (1 + (TARGET_V - 0.5) * BAND);
  const targetDir: "up" | "down" = currentPrice >= targetPrice ? "down" : "up";

  // Pixel geometry (viewBox y -> measured px height).
  const lastY = ys[ys.length - 1] ?? Y_TOP;
  const dotLeft = (LAST_X / VIEW_W) * width;
  const toPxY = (vy: number) => (chartPxH > 0 ? (vy / CHART_VB_H) * chartPxH : vy);
  const dotTop = clamp(toPxY(lastY), 8, Math.max(8, chartPxH - 8));
  const ARROW_ROW_H = 12 + ARROW_TRAVEL;

  // The target tag RESTS at a FIXED point — the chart Y of the target price level
  // (TARGET_V) — instead of trailing the dot. It only moves when the live line
  // surpasses it: if the dot would overlap the tag, the tag is shoved to the
  // opposite side of the dot (below it when the price is at/above target, above it
  // when below), then snaps back to its fixed level once the line pulls away. The
  // current-price label keeps tracking the dot on the side away from the target.
  const GAP_PRICE = 8; // px gap between the dot and the current-price label
  const DOT_R = 6.5; // dot radius
  const CLEAR = DOT_R + 6; // min gap kept between the dot and a shoved target tag
  const targetAbove = targetDir === "up"; // price below target -> tag rests above the dot
  const targetRowH = targetH || ARROW_ROW_H;
  const targetYvb = Y_BOT - TARGET_V * (Y_BOT - Y_TOP); // viewBox y of the target level
  const targetLevelTop = toPxY(targetYvb) - targetRowH / 2; // fixed rest position (centered on level)
  const targetTop = clamp(
    targetAbove
      ? Math.min(targetLevelTop, dotTop - CLEAR - targetRowH) // shove clear ABOVE the dot
      : Math.max(targetLevelTop, dotTop + CLEAR), // shove clear BELOW the dot
    4,
    Math.max(4, chartPxH - targetRowH - 4),
  );
  const priceTop = clamp(
    targetAbove ? dotTop + GAP_PRICE : dotTop - priceH - GAP_PRICE,
    4,
    Math.max(4, chartPxH - priceH - 4),
  );

  // Live price stays in [LIVE_MIN, LIVE_MAX], always above TARGET_V; ramp the
  // target's opacity from 0.5 (price near the top) to 1.0 (price near its floor,
  // i.e. as close as it gets to the target).
  const targetCloseness = clamp((LIVE_MAX - lastV) / (LIVE_MAX - LIVE_MIN), 0, 1);
  const targetOpacity = 0.5 + targetCloseness * 0.5;

  // ---- Target style ("target") geometry ----------------------------------
  // Bitcoin coin marker sits at the line's end (clamped so its 20px disc fits).
  const COIN = 20;
  const coinTop = clamp(toPxY(lastY), COIN / 2, Math.max(COIN / 2, chartPxH - COIN / 2));
  const pxToVBx = width > 0 ? VIEW_W / width : 1;
  // Dashed live-price line ends at the coin center (hidden under the disc) so it
  // never extends past the BTC icon.
  const liveLineEndVB = LAST_X;
  // Both the "$X target" label and the current-price label right-align to the BTC
  // icon's right edge.
  const tgtPriceRight = Math.max(8, width - (dotLeft + COIN / 2));
  // Solid target line is a SINGLE left segment that stops short of the "$X
  // target" label (no dash past the text). The label right edge aligns to the
  // coin's right edge; the line ends 4px before the label's left edge.
  const tgtLineLeftEnd = Math.max(0, (width - tgtPriceRight - tgtLabelW - 4) * pxToVBx);
  const tgtLabelTop = clamp(
    toPxY(targetYvb) - tgtLabelH / 2,
    2,
    Math.max(2, chartPxH - tgtLabelH - 2),
  );
  const tgtPriceTop = clamp(coinTop - COIN / 2 - priceH, 2, Math.max(2, chartPxH - priceH - 2));

  const inner = (
    <View
      style={{
        width,
        height: bannerH,
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: orange ? "rgba(255,255,255,0.3)" : colors.cardBorder,
        backgroundColor: orange ? "#BA6600" : colors.surface,
      }}
    >
      {/* Animated area chart — the main piece of content, flexes to fill. */}
      <View
        style={{ flex: 1, width: "100%" }}
        onLayout={(e) => setChartPxH(e.nativeEvent.layout.height)}
      >
        {chartPxH > 0 && (
          <>
            <Svg width={width} height={chartPxH} viewBox={`0 0 ${VIEW_W} ${CHART_VB_H}`} preserveAspectRatio="none">
              {showChartGradient ? (
                <Defs>
                  <LinearGradient id="hcbLineFade" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0%" stopColor={el} stopOpacity={0} />
                    <Stop offset="35%" stopColor={el} stopOpacity={1} />
                    <Stop offset="100%" stopColor={el} stopOpacity={1} />
                  </LinearGradient>
                  <LinearGradient id="hcbGlowFill" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor={el} stopOpacity={orange ? 0.35 : 0.18} />
                    <Stop offset="100%" stopColor={el} stopOpacity={0} />
                  </LinearGradient>
                </Defs>
              ) : null}
              {showChartGradient ? <AnimatedPath d={areaPath} fill="url(#hcbGlowFill)" fillOpacity={glowOpacity} /> : null}
              <Polyline
                points={linePts}
                fill="none"
                stroke={showChartGradient ? "url(#hcbLineFade)" : el}
                strokeWidth={2}
                strokeLinejoin="miter"
                strokeLinecap="butt"
              />
              {isTarget && (
                <>
                  {/* Dashed line at the live price level, ending at the coin. */}
                  <Line
                    x1={0}
                    y1={lastY}
                    x2={liveLineEndVB}
                    y2={lastY}
                    stroke={el}
                    strokeWidth={1}
                    strokeDasharray="4,4"
                    opacity={0.85}
                  />
                  {/* Solid target line — a single left segment up to the label. */}
                  <Line
                    x1={0}
                    y1={targetYvb}
                    x2={tgtLineLeftEnd}
                    y2={targetYvb}
                    stroke={el}
                    strokeWidth={1}
                    opacity={targetOpacity}
                  />
                </>
              )}
            </Svg>

            {/* Target tag (accent) with looping cascading chevrons (no line).
                Rests at the fixed target price level (pinned 16px from the right
                edge); shoves off the dot only when the line surpasses it. Opacity
                ramps to 1.0 as the price nears the target. */}
            {!isTarget && (
              <>
                <View
                  pointerEvents="none"
                  onLayout={(e) => setTargetH(e.nativeEvent.layout.height)}
                  style={{
                    position: "absolute",
                    right: 16,
                    top: targetTop,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    opacity: targetOpacity,
                  }}
                >
                  <Text style={{ fontFamily: geist.medium, fontSize: 14, color: el }}>
                    Target: {fmtPriceCents(targetPrice)}
                  </Text>
                  <TargetArrows dir={targetDir} color={el} />
                </View>

                {/* Current price label — tracks the dot 8px off, on the side away
                    from the target, clamped within the (overflow-hidden) card. */}
                <View
                  pointerEvents="none"
                  style={{ position: "absolute", top: priceTop, right: 16 }}
                  onLayout={(e) => setPriceH(e.nativeEvent.layout.height)}
                >
                  <Text style={{ fontFamily: geist.semibold, fontSize: 14, color: el }}>
                    {fmtPrice(currentPrice)}
                  </Text>
                </View>

                {/* Current-value pulsing dot at the line's end. */}
                <Animated.View
                  style={{
                    position: "absolute",
                    left: dotLeft - 6.5,
                    top: dotTop - 6.5,
                    width: 13,
                    height: 13,
                    borderRadius: 6.5,
                    borderWidth: 1.5,
                    borderColor: el,
                    backgroundColor: "transparent",
                    opacity: pulseOpacity,
                    transform: [{ scale: pulseScale }],
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    left: dotLeft - 4,
                    top: dotTop - 4,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: el,
                  }}
                />
              </>
            )}

            {/* Target style: "$X target" label centered on the target line (its
                right edge aligned to the coin's right edge), the current "$X" price
                to the LEFT of the coin marker, and the Bitcoin coin at the line's end. */}
            {isTarget && (
              <>
                <View
                  pointerEvents="none"
                  onLayout={(e) => {
                    setTgtLabelW(e.nativeEvent.layout.width);
                    setTgtLabelH(e.nativeEvent.layout.height);
                  }}
                  style={{ position: "absolute", right: tgtPriceRight, top: tgtLabelTop, opacity: targetOpacity }}
                >
                  <Text style={{ fontFamily: geist.medium, fontSize: 14, color: el }}>
                    {fmtPrice(targetPrice)} target
                  </Text>
                </View>

                <View
                  pointerEvents="none"
                  style={{ position: "absolute", top: tgtPriceTop, right: tgtPriceRight }}
                  onLayout={(e) => setPriceH(e.nativeEvent.layout.height)}
                >
                  <Text style={{ fontFamily: geist.semibold, fontSize: 14, color: el }}>
                    {fmtPrice(currentPrice)}
                  </Text>
                </View>

                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: dotLeft - COIN / 2,
                    top: coinTop - COIN / 2,
                    width: COIN,
                    height: COIN,
                    borderRadius: COIN / 2,
                    backgroundColor: orange ? "#fff" : colors.surface,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BitcoinLogo size={COIN} fill={orange ? "#fff" : colors.bitcoin} />
                </View>
              </>
            )}
          </>
        )}
      </View>

      {/* Timestamp (above), then title + detail line. */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <LiveDot color={el} pulse />
          <Text style={{ fontFamily: geist.medium, fontSize: 13, color: el }}>{stamp}</Text>
        </View>
        <Text
          style={{ marginTop: 6, fontFamily: geist.semibold, fontSize: 16, lineHeight: 24, color: colors.textPrimary }}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          style={{ marginTop: 2, fontFamily: geist.regular, fontSize: 14, lineHeight: 20, color: orange ? "rgba(255,255,255,0.85)" : colors.textMuted }}
          numberOfLines={1}
        >
          {detail}
        </Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}>
        {inner}
      </Pressable>
    );
  }
  return inner;
}
