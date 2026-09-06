import React, { useEffect, useMemo, useRef, useState } from "react";

// Per-instance SVG def ids: web SVG ids are document-global.
let svgUidCounter = 0;
import { Animated, Easing, Pressable, StyleSheet, Text, View, Image } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop } from "react-native-svg";

import colors from "@/constants/colors";
import { apiUrl } from "@/lib/api";
import { useChartGradient } from "@/lib/sim/chartGradientStore";
import { geist } from "@/lib/sim/geistFonts";

const MAX_POINTS = 60;
const POLL_MS = 1000;
const VIEW_W = 360;
const VIEW_H = 220;
const RIGHT_PAD = 16; // reserve room so the live dot isn't clipped at the card edge
const PADDING_Y = 18;
const PADDING_BOTTOM = 60;
const CHART_H = 140;
const PILL_GROUP_H = 58;

type PricePoint = { t: number; price: number };

const buildPath = (
  points: PricePoint[],
): { line: string; area: string; lastY: number; lastX: number; min: number; max: number } => {
  if (points.length < 2)
    return { line: "", area: "", lastY: VIEW_H / 2, lastX: VIEW_W - RIGHT_PAD, min: 0, max: 0 };
  const prices = points.map((p) => p.price);
  let min = Math.min(...prices);
  let max = Math.max(...prices);
  if (max - min < 0.0001) {
    min -= 1;
    max += 1;
  }
  const range = max - min;
  const usableH = VIEW_H - PADDING_Y - PADDING_BOTTOM;
  const stepX = (VIEW_W - RIGHT_PAD) / (MAX_POINTS - 1);
  const startIndex = MAX_POINTS - points.length;
  const coords = points.map((p, i) => {
    const x = (startIndex + i) * stepX;
    const y = PADDING_Y + (1 - (p.price - min) / range) * usableH;
    return [x, y] as const;
  });
  let line = `M ${coords[0][0]} ${coords[0][1]}`;
  for (let i = 1; i < coords.length; i++) {
    const [px, py] = coords[i - 1];
    const [cx, cy] = coords[i];
    const midX = (px + cx) / 2;
    line += ` Q ${px} ${py} ${midX} ${(py + cy) / 2}`;
  }
  line += ` T ${coords[coords.length - 1][0]} ${coords[coords.length - 1][1]}`;
  const first = coords[0];
  const last = coords[coords.length - 1];
  const areaY = VIEW_H - PADDING_BOTTOM;
  const area = `${line} L ${last[0]} ${areaY} L ${first[0]} ${areaY} Z`;
  return { line, area, lastY: last[1], lastX: last[0], min, max };
};

const formatUsd = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const DIGIT_FONT_SIZE = 16;
const DIGIT_LINE_HEIGHT = 22;
const DIGIT_REEL_LENGTH = 400;

function Digit({ value, color }: { value: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  const indexRef = useRef(0);

  useEffect(() => {
    const current = indexRef.current % 10;
    let delta = (value - current + 10) % 10;
    if (delta === 0) return; // no spin if landing on the same digit
    if (indexRef.current + delta >= DIGIT_REEL_LENGTH) {
      // wrap quietly without animating to keep within reel bounds
      indexRef.current = current;
      anim.setValue(-current * DIGIT_LINE_HEIGHT);
    }
    indexRef.current += delta;
    Animated.timing(anim, {
      toValue: -indexRef.current * DIGIT_LINE_HEIGHT,
      duration: 350,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [value, anim]);

  return (
    <View style={styles.digitWindow}>
      <Animated.View style={{ transform: [{ translateY: anim }] }}>
        {Array.from({ length: DIGIT_REEL_LENGTH }).map((_, i) => (
          <Text
            key={i}
            style={[styles.digitText, { color }]}
          >
            {i % 10}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

function CentsValue({ value, color }: { value: number; color: string }) {
  const clamped = Math.max(0, Math.min(99, Math.round(value)));
  const tens = Math.floor(clamped / 10);
  const ones = clamped % 10;
  return (
    <View style={styles.centsRow}>
      <Digit value={tens} color={color} />
      <Digit value={ones} color={color} />
      <Text style={[styles.digitText, { color, marginLeft: 1 }]}>¢</Text>
    </View>
  );
}

function ArrowUp({ fill }: { fill: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Path
        d="M9.16659 16.6673V6.52148L4.49992 11.1882L3.33325 10.0007L9.99992 3.33398L16.6666 10.0007L15.4999 11.1882L10.8333 6.52148V16.6673H9.16659Z"
        fill={fill}
      />
    </Svg>
  );
}

function ArrowDown({ fill }: { fill: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Path
        d="M10.8334 3.33268L10.8334 13.4785L15.5001 8.81185L16.6667 9.99935L10.0001 16.666L3.33342 9.99935L4.50008 8.81185L9.16675 13.4785L9.16675 3.33268L10.8334 3.33268Z"
        fill={fill}
      />
    </Svg>
  );
}

const RESET_SECONDS = 5 * 60;
const ARC_RADIUS = 22;
const ARC_CIRCUMFERENCE = 2 * Math.PI * ARC_RADIUS;

function useCountdownProgress() {
  const [remainingMs, setRemainingMs] = useState(RESET_SECONDS * 1000);
  useEffect(() => {
    const totalMs = RESET_SECONDS * 1000;
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = (Date.now() - start) % totalMs;
      setRemainingMs(totalMs - elapsed);
    }, 50);
    return () => clearInterval(id);
  }, []);
  return remainingMs;
}

function CountdownArc({ color }: { color: string }) {
  const remainingMs = useCountdownProgress();
  const fraction = Math.max(0, Math.min(1, remainingMs / (RESET_SECONDS * 1000)));
  const dash = ARC_CIRCUMFERENCE * fraction;
  return (
    <Svg width={56} height={56} viewBox="0 0 56 56">
      <Circle
        cx={28}
        cy={28}
        r={ARC_RADIUS}
        stroke={color}
        strokeOpacity={0.25}
        strokeWidth={2}
        fill="none"
      />
      <Circle
        cx={28}
        cy={28}
        r={ARC_RADIUS}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeDasharray={`${dash} ${ARC_CIRCUMFERENCE}`}
        strokeLinecap="round"
        transform="rotate(-90 28 28)"
      />
    </Svg>
  );
}

function CountdownTimer({ color }: { color: string }) {
  const remainingMs = useCountdownProgress();
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  const text = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  return (
    <View style={styles.timerRow}>
      <View style={[styles.timerDot, { backgroundColor: color }]} />
      <Text style={[styles.timer, { color }]}>{text}</Text>
    </View>
  );
}

export function LiveBtcCard() {
  const uid = useRef(`livebtc${++svgUidCounter}`).current;
  const showChartGradient = useChartGradient();
  const [points, setPoints] = useState<PricePoint[]>([]);
  const [latest, setLatest] = useState<number | null>(null);
  const seedRef = useRef(false);
  const [centsTick, setCentsTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const seed = async () => {
      try {
        const res = await fetch(apiUrl("/api/btc/history"));
        if (!res.ok) return;
        const data = (await res.json()) as { points?: PricePoint[] };
        const seeded = Array.isArray(data.points) ? data.points : [];
        if (!cancelled && seeded.length > 0) {
          setPoints(seeded.slice(-MAX_POINTS));
          setLatest(seeded[seeded.length - 1].price);
        }
      } catch {}
    };

    const tick = async () => {
      // Always advance the cents tick so the reels keep moving even if the
      // network call fails or returns a cached/empty body.
      if (!cancelled) setCentsTick((n) => n + 1);
      try {
        const res = await fetch(apiUrl(`/api/btc/price?t=${Date.now()}`), {
          cache: "no-store",
          headers: { "cache-control": "no-cache" },
        });
        if (!res.ok) throw new Error("tick");
        const data = (await res.json()) as { price?: number };
        if (cancelled || data?.price === undefined) return;
        const price = Number(data.price);
        if (Number.isFinite(price)) {
          setLatest(price);
          setPoints((prev) => {
            const next = [...prev, { t: Date.now(), price }];
            return next.length > MAX_POINTS ? next.slice(next.length - MAX_POINTS) : next;
          });
        }
      } catch {}
      finally {
        if (!cancelled) timer = setTimeout(tick, POLL_MS);
      }
    };

    if (!seedRef.current) {
      seedRef.current = true;
      seed().finally(() => { if (!cancelled) tick(); });
    }
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, []);

  const { line, area, lastY, lastX } = useMemo(() => buildPath(points), [points]);
  const orange = colors.light.bitcoin;

  const upCents = useMemo(() => {
    if (points.length < 2 || latest === null) return 13;
    const prices = points.map((p) => p.price);
    const min = Math.min(...prices, latest);
    const max = Math.max(...prices, latest);
    if (max - min < 0.01) return 50;
    const ratio = (latest - min) / (max - min);
    // Add a small per-tick jitter so the value drifts naturally each second
    const jitter = (Math.random() - 0.5) * 4;
    return Math.max(3, Math.min(97, Math.round(ratio * 100 + jitter)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest, centsTick, points]);
  const downCents = 100 - upCents;

  const pillTop = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    if (!line) return;
    const pixelY = (lastY / VIEW_H) * CHART_H;
    const target = Math.max(8, Math.min(CHART_H - PILL_GROUP_H - 8, pixelY - PILL_GROUP_H / 2));
    Animated.timing(pillTop, {
      toValue: target,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [lastY, line, pillTop]);

  return (
    <View style={styles.card}>
      <View style={styles.chartArea}>
        <Svg
          style={StyleSheet.absoluteFill}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="none"
        >
          {showChartGradient ? (
            <Defs>
              <LinearGradient id={`btcArea-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={orange} stopOpacity="0.45" />
                <Stop offset="100%" stopColor={orange} stopOpacity="0" />
              </LinearGradient>
              <LinearGradient
                id={`btcLineFade-${uid}`}
                gradientUnits="userSpaceOnUse"
                x1={0} y1={0} x2={VIEW_W} y2={0}
              >
                <Stop offset="0%" stopColor={orange} stopOpacity="0" />
                <Stop offset="50%" stopColor={orange} stopOpacity="0.6" />
                <Stop offset="100%" stopColor={orange} stopOpacity="1" />
              </LinearGradient>
              <LinearGradient
                id={`btcTargetFade-${uid}`}
                gradientUnits="userSpaceOnUse"
                x1={VIEW_W * 0.4} y1={0} x2={VIEW_W} y2={0}
              >
                <Stop offset="0%" stopColor="#cfcfcf" stopOpacity="0" />
                <Stop offset="50%" stopColor="#cfcfcf" stopOpacity="0.6" />
                <Stop offset="100%" stopColor="#cfcfcf" stopOpacity="1" />
              </LinearGradient>
            </Defs>
          ) : null}
          {area && showChartGradient ? <Path d={area} fill={`url(#btcArea-${uid})`} /> : null}
          {line ? (
            <>
              {/* Target horizontal dashed line (above current price) - gray, fades from left */}
              <Line
                x1={VIEW_W * 0.4}
                y1={Math.max(PADDING_Y, lastY - 34)}
                x2={VIEW_W - RIGHT_PAD}
                y2={Math.max(PADDING_Y, lastY - 34)}
                stroke={showChartGradient ? `url(#btcTargetFade-${uid})` : "#cfcfcf"}
                strokeWidth={2}
                strokeDasharray="6,5"
              />
              {/* Current price dashed line - orange, fades from left */}
              <Line
                x1={0}
                y1={lastY}
                x2={lastX}
                y2={lastY}
                stroke={showChartGradient ? `url(#btcLineFade-${uid})` : orange}
                strokeWidth={2}
                strokeDasharray="6,5"
              />
              <Path
                d={line}
                fill="none"
                stroke={orange}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Circle cx={lastX} cy={lastY} r={5} fill={orange} />
              <Circle cx={lastX} cy={lastY} r={3} fill={colors.light.surface} />
            </>
          ) : null}
        </Svg>

        <Animated.View style={[styles.targetGroup, { top: pillTop, pointerEvents: "none" }]}>
          <View style={styles.targetPill}>
            <Text style={styles.targetText}>Target</Text>
            <Text style={styles.targetChevron}>⌃</Text>
          </View>
          <View style={styles.pricePill}>
            <Text style={[styles.priceText, { color: orange }]}>
              ${latest !== null ? formatUsd(latest) : "—"}
            </Text>
          </View>
        </Animated.View>

      </View>

      <View style={styles.bottom}>
        <View style={styles.marketInfo}>
          <View style={styles.btcLogoWrap}>
            <CountdownArc color={orange} />
            <Image
              source={require("../assets/figmaAssets/jeromepowellglasses1-1-1.png")}
              style={styles.btcLogo}
            />
          </View>
          <CountdownTimer color={orange} />
          <Text style={styles.title}>Bitcoin Up or Down</Text>
        </View>

        <View style={styles.btnRow}>
          <Pressable style={styles.btn}>
            <View style={styles.btnInner}>
              <ArrowUp fill={colors.light.green} />
              <CentsValue value={upCents} color={colors.light.green} />
            </View>
          </Pressable>
          <Pressable style={styles.btn}>
            <View style={styles.btnInner}>
              <ArrowDown fill={colors.light.red} />
              <CentsValue value={downCents} color={colors.light.red} />
            </View>
          </Pressable>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Resets every 5 mins</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    height: 360,
    backgroundColor: colors.light.surface,
    borderRadius: 16,
    overflow: "hidden",
  },
  chartArea: {
    height: CHART_H,
    position: "relative",
  },
  targetGroup: {
    position: "absolute",
    right: 12,
    alignItems: "flex-end",
    gap: 6,
  },
  targetPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.light.surface2,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  targetText: {
    color: colors.light.textPrimary,
    fontFamily: geist.medium,
    fontSize: 13,
  },
  targetChevron: {
    color: colors.light.textPrimary,
    fontSize: 14,
    marginLeft: 2,
    transform: [{ translateY: 2 }],
  },
  pricePill: {
    backgroundColor: colors.light.surface2,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  priceText: {
    fontFamily: geist.semibold,
    fontSize: 13,
  },
  btcLogoWrap: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  btcLogo: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  bottom: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    alignItems: "center",
    justifyContent: "space-between",
  },
  marketInfo: {
    alignItems: "center",
    gap: 6,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timer: { fontFamily: geist.medium, fontSize: 14 },
  title: {
    color: colors.light.textPrimary,
    fontFamily: geist.semibold,
    fontSize: 18,
  },
  btnRow: { flexDirection: "row", gap: 10, width: "100%", paddingTop: 2 },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.light.surface2,
  },
  btnText: { fontFamily: geist.semibold, fontSize: 16, lineHeight: DIGIT_LINE_HEIGHT },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 6 },
  centsRow: { flexDirection: "row", alignItems: "center" },
  digitWindow: {
    height: DIGIT_LINE_HEIGHT,
    width: 11,
    overflow: "hidden",
  },
  digitText: {
    fontFamily: geist.semibold,
    fontSize: DIGIT_FONT_SIZE,
    lineHeight: DIGIT_LINE_HEIGHT,
    height: DIGIT_LINE_HEIGHT,
    textAlign: "center",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerIcon: { color: colors.light.textMuted, fontSize: 12 },
  footerText: { color: colors.light.textMuted, fontFamily: geist.regular, fontSize: 13 },
});
