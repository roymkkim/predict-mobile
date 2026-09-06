import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { HeaderStandard } from "@metamask/design-system-react-native";
import { detentEnter, sheetExit, backdropIn, backdropOut } from "@/lib/sim/sheetMotion";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { colors, MUTED_OUTLINE } from "@/lib/sim/colors";
import type { BetSlipPick } from "@/lib/sim/betSlipStore";
import { geist } from "@/lib/sim/geistFonts";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// How many price levels per side to attempt; clamped to the room left between
// the mid price and the 1¢ / 99¢ bounds so prices never duplicate or wrap.
const LEVELS = 16;
const CHART_H = 116;

type Level = { price: number; size: number };
type Book = { bids: Level[]; asks: Level[] };

function clampCents(c: number) {
  return Math.max(1, Math.min(99, c));
}

function fmtCents(c: number) {
  return `${Number.isInteger(c) ? c : c.toFixed(1)}¢`;
}

function fmtUsd(n: number) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${Math.round(n / 1e3)}K`;
  return `$${Math.round(n)}`;
}

// Seed a plausible two-sided book around the mid price. Per-level size grows
// with depth so the cumulative totals form the classic pyramid silhouette.
function buildBook(mid: number): Book {
  const bestBid = clampCents(Math.floor(mid));
  const bestAsk = clampCents(Math.floor(mid) + 1);
  const rows = Math.max(1, Math.min(LEVELS, bestBid, 99 - bestAsk + 1));
  const bids: Level[] = [];
  const asks: Level[] = [];
  for (let i = 0; i < rows; i++) {
    const base = 220_000 + i * 240_000;
    bids.push({ price: bestBid - i, size: base * (0.7 + Math.random() * 0.6) });
    asks.push({ price: bestAsk + i, size: base * (0.7 + Math.random() * 0.6) });
  }
  return { bids, asks };
}

function nudge(b: Book): Book {
  // Top of book is noisier; deeper levels drift slower. Occasional bursts
  // mimic a fill or a stacked bid/ask landing on one price.
  const walk = (l: Level, i: number): Level => {
    const vol = 0.035 + Math.random() * 0.05;
    const drift = (Math.random() - 0.48) * vol;
    const spike = Math.random() < 0.1 ? (Math.random() - 0.35) * 0.22 : 0;
    const depthDamp = Math.max(0.35, 1 - i * 0.04);
    return { ...l, size: Math.max(40_000, l.size * (1 + (drift + spike) * depthDamp)) };
  };
  const bids = b.bids.map(walk);
  const asks = b.asks.map(walk);
  if (Math.random() < 0.14) {
    const side = Math.random() < 0.5 ? bids : asks;
    const i = Math.floor(Math.random() * Math.min(4, side.length));
    side[i] = { ...side[i], size: side[i].size * (0.45 + Math.random() * 1.35) };
  }
  return { bids, asks };
}

function lerpLevels(from: Level[], to: Level[], t: number): Level[] {
  return from.map((l, i) => ({
    price: to[i]?.price ?? l.price,
    size: l.size + ((to[i]?.size ?? l.size) - l.size) * t,
  }));
}

function cumulative(levels: Level[]): number[] {
  const out: number[] = [];
  let run = 0;
  for (const l of levels) {
    run += l.size;
    out.push(run);
  }
  return out;
}

function areaPath(pts: { x: number; y: number }[], h: number): string {
  if (pts.length === 0) return "";
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const first = pts[0];
  const last = pts[pts.length - 1];
  return `${line} L${last.x.toFixed(2)},${h} L${first.x.toFixed(2)},${h} Z`;
}

function linePath(pts: { x: number; y: number }[]): string {
  return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
}

// A scrollable, live-ticking order book bottom sheet. Opened from the bet slip's
// order-book icon. Mirrors the BetSlipSheet slide-up modal so it layers on top.
export function OrderBookSheet({ visible, pick, onClose }: { visible: boolean; pick: BetSlipPick | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { height: winH, width: winW } = useWindowDimensions();

  const [render, setRender] = useState(visible);
  const slide = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current; // backdrop opacity 0..1

  const mid = pick ? clampCents(pick.oddsCents) : 50;
  const displayRef = useRef<Book>(buildBook(mid));
  const targetRef = useRef<Book>(displayRef.current);
  const [book, setBook] = useState<Book>(displayRef.current);

  // Re-seed whenever a fresh pick raises the sheet.
  useEffect(() => {
    if (!visible || !pick) return;
    const next = buildBook(clampCents(pick.oddsCents));
    displayRef.current = next;
    targetRef.current = next;
    setBook(next);
  }, [visible, pick]);

  // Live book: jump the target, ease the displayed sizes toward it so the
  // depth chart and row bars breathe like a real bid/ask tape.
  useEffect(() => {
    if (!visible) return;
    const pulse = setInterval(() => {
      targetRef.current = nudge(targetRef.current);
    }, 650);
    let raf = 0;
    const tick = () => {
      const from = displayRef.current;
      const to = targetRef.current;
      const next: Book = {
        bids: lerpLevels(from.bids, to.bids, 0.1),
        asks: lerpLevels(from.asks, to.asks, 0.1),
      };
      displayRef.current = next;
      setBook(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      clearInterval(pulse);
      cancelAnimationFrame(raf);
    };
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setRender(true);
      // Child sheet stacked over the bet slip → detent-sheet enter tween;
      // backdrop fades 0.2s in parallel.
      Animated.parallel([detentEnter(slide, false), backdropIn(fade, false)]).start();
    } else {
      Animated.parallel([sheetExit(slide, false), backdropOut(fade, false)]).start(({ finished }) => {
        if (finished) setRender(false);
      });
    }
  }, [visible, slide, fade]);

  const rows = Math.min(book.bids.length, book.asks.length);
  const cumBid = useMemo(() => cumulative(book.bids), [book]);
  const cumAsk = useMemo(() => cumulative(book.asks), [book]);
  const maxCum = Math.max(cumBid[rows - 1] ?? 1, cumAsk[rows - 1] ?? 1, 1);

  if (!render || !pick) return null;

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [winH, 0] });

  // Depth chart geometry. Two half-width area charts meeting at the center: the
  // bid area peaks on the far left (deepest cumulative), the ask area on the far
  // right, so together they form a valley around the spread.
  const chartGap = 14;
  const halfW = Math.max(40, (winW - 40 - chartGap) / 2);
  const denom = Math.max(1, rows - 1);
  const bidPts = Array.from({ length: rows }, (_, i) => ({
    x: halfW * (1 - i / denom),
    y: CHART_H - (cumBid[i] / maxCum) * CHART_H,
  })).sort((a, b) => a.x - b.x);
  const askPts = Array.from({ length: rows }, (_, i) => ({
    x: halfW * (i / denom),
    y: CHART_H - (cumAsk[i] / maxCum) * CHART_H,
  }));

  const farBid = book.bids[rows - 1]?.price ?? mid;
  const farAsk = book.asks[rows - 1]?.price ?? mid;

  return (
    <Modal visible={render} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <AnimatedPressable style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.6)", opacity: fade }]} onPress={onClose} />
        <Animated.View style={{ transform: [{ translateY }] }}>
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: colors.bg,
              borderTopWidth: 1,
              borderLeftWidth: 1,
              borderRightWidth: 1,
              borderColor: MUTED_OUTLINE,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: 20,
              paddingTop: 10,
              paddingBottom: insets.bottom + 16,
              maxHeight: winH * 0.85,
              minHeight: 0,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 4 }}>
              <View style={{ width: 36, height: 5, borderRadius: 3, backgroundColor: colors.surface2 }} />
            </View>

            <HeaderStandard title="Order book" onClose={onClose} />

            {/* Legend */}
            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 24, marginBottom: 12 }}>
              <Legend color={colors.greenOutline} label="Bids" />
              <Legend color={colors.red} label="Asks" />
            </View>

            {/* Depth chart */}
            <View style={{ flexDirection: "row", gap: chartGap }}>
              <Svg width={halfW} height={CHART_H}>
                <Defs>
                  <LinearGradient id="bidFill" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={colors.greenOutline} stopOpacity={0.5} />
                    <Stop offset="1" stopColor={colors.greenOutline} stopOpacity={0.02} />
                  </LinearGradient>
                </Defs>
                <Path d={areaPath(bidPts, CHART_H)} fill="url(#bidFill)" />
                <Path d={linePath(bidPts)} stroke={colors.greenOutline} strokeWidth={2} fill="none" />
              </Svg>
              <Svg width={halfW} height={CHART_H}>
                <Defs>
                  <LinearGradient id="askFill" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={colors.red} stopOpacity={0.5} />
                    <Stop offset="1" stopColor={colors.red} stopOpacity={0.02} />
                  </LinearGradient>
                </Defs>
                <Path d={areaPath(askPts, CHART_H)} fill="url(#askFill)" />
                <Path d={linePath(askPts)} stroke={colors.red} strokeWidth={2} fill="none" />
              </Svg>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8, marginBottom: 4 }}>
              <Text style={{ fontFamily: geist.medium, fontSize: 14, color: colors.textMuted }}>{fmtCents(farBid)}</Text>
              <Text style={{ fontFamily: geist.medium, fontSize: 14, color: colors.textMuted }}>{fmtCents(farAsk)}</Text>
            </View>

            {/* Table header */}
            <View style={{ flexDirection: "row", paddingVertical: 10 }}>
              <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 }}>
                <Text style={hdr}>Total (USD)</Text>
                <Text style={hdr}>Price</Text>
              </View>
              <View style={{ width: 1 }} />
              <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 }}>
                <Text style={hdr}>Price</Text>
                <Text style={hdr}>Total (USD)</Text>
              </View>
            </View>

            {/* Rows */}
            <ScrollView style={{ flexShrink: 1 }} showsVerticalScrollIndicator={false}>
              {Array.from({ length: rows }, (_, i) => {
                const bidPct = (cumBid[i] / maxCum) * 100;
                const askPct = (cumAsk[i] / maxCum) * 100;
                return (
                  <View key={i} style={{ flexDirection: "row", height: 38 }}>
                    {/* Bid side — depth bar anchored to the center, growing left */}
                    <View style={{ flex: 1, justifyContent: "center", overflow: "hidden" }}>
                      <View style={{ position: "absolute", right: 0, top: 3, bottom: 3, width: `${bidPct}%`, backgroundColor: colors.greenSoft, borderRadius: 4 }} />
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4 }}>
                        <Text style={muted}>{fmtUsd(cumBid[i])}</Text>
                        <Text style={[priceCell, { color: colors.greenOutline }]}>{fmtCents(book.bids[i].price)}</Text>
                      </View>
                    </View>
                    <View style={{ width: 1, backgroundColor: colors.cardBorder }} />
                    {/* Ask side — depth bar anchored to the center, growing right */}
                    <View style={{ flex: 1, justifyContent: "center", overflow: "hidden" }}>
                      <View style={{ position: "absolute", left: 0, top: 3, bottom: 3, width: `${askPct}%`, backgroundColor: colors.redSoft, borderRadius: 4 }} />
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4 }}>
                        <Text style={[priceCell, { color: colors.red }]}>{fmtCents(book.asks[i].price)}</Text>
                        <Text style={muted}>{fmtUsd(cumAsk[i])}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <Text style={{ fontFamily: geist.medium, fontSize: 15, color: colors.textPrimary }}>{label}</Text>
    </View>
  );
}

const hdr = { fontFamily: geist.regular, fontSize: 13, color: colors.textMuted } as const;
const muted = { fontFamily: geist.medium, fontSize: 13, color: colors.textMuted } as const;
const priceCell = { fontFamily: geist.semibold, fontSize: 14 } as const;
