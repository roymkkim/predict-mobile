import React, { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BackIcon } from "@/components/PageHeader";

import { ChartWithPeriods } from "@/components/sim/ScoreChartUnit";
import { MarketRulesSection } from "@/components/sim/MarketRulesSection";
import { useBetRadius } from "@/lib/sim/pillButtonsStore";
import { openBetSlip } from "@/lib/sim/betSlipStore";
import { colors, UXR } from "@/lib/sim/colors";
import { screenTopInset } from "@/lib/sim/layout";
import { geist } from "@/lib/sim/geistFonts";
import { VolumeText } from "@/components/sim/VolumeText";

// "When will Bitcoin hit $150k?" — our take on the Polymarket date-ladder
// market. Structure matches the standard detail pages (legend → shared chart
// unit → Market rules → Predict rows); prices stay in cents per product rule.

const TITLE = "When will Bitcoin hit $150k?";

type Rung = { label: string; short: string; pct: number; color: string; vol: string; points: number[]; settle: string };

function wob(seed: number, i: number): number {
  return Math.sin(seed * 12.9898 + i * 78.233) * 0.015;
}

function mkSeries(seed: number, anchors: number[]): number[] {
  const N = 48;
  const out: number[] = [];
  for (let i = 0; i < N; i++) {
    const t = (i / (N - 1)) * (anchors.length - 1);
    const a = Math.floor(t);
    const b = Math.min(anchors.length - 1, a + 1);
    const f = t - a;
    const v = anchors[a] * (1 - f) + anchors[b] * f + wob(seed, i);
    out.push(Math.max(0.005, Math.min(0.95, v)));
  }
  return out;
}

// Sorted by probability, like the reference. Each rung settles Yes if BTC
// trades above $149,999.99 before its date.
// Date rungs already passed: all settled No (BTC never crossed $150k in time).
const RESOLVED: { label: string; vol: string }[] = [
  { label: "by September 30, 2025", vol: "$778.9k Vol." },
  { label: "by December 31, 2025", vol: "$1.56M Vol." },
  { label: "by March 31, 2026", vol: "$0 Vol." },
  { label: "by June 30, 2026", vol: "$22.07M Vol." },
];

const RUNGS: Rung[] = [
  {
    label: "Before December 2026",
    short: "Before December 2026",
    pct: 49,
    color: UXR.blue,
    vol: "$2.1M Vol.",
    settle: "12:00 AM ET on December 1, 2026",
    points: mkSeries(1, [0.1, 0.12, 0.09, 0.1, 0.11, 0.1, 0.12, 0.18, 0.49]),
  },
  {
    label: "Before October 2026",
    short: "Before October 2026",
    pct: 9,
    color: UXR.green,
    vol: "$840K Vol.",
    settle: "12:00 AM ET on October 1, 2026",
    points: mkSeries(2, [0.08, 0.1, 0.07, 0.08, 0.09, 0.08, 0.08, 0.09, 0.09]),
  },
  {
    label: "Before November 2026",
    short: "Before November 2026",
    pct: 5,
    color: UXR.red,
    vol: "$510K Vol.",
    settle: "12:00 AM ET on November 1, 2026",
    points: mkSeries(3, [0.06, 0.2, 0.07, 0.06, 0.07, 0.06, 0.06, 0.05, 0.05]),
  },
  {
    label: "Before January 2027",
    short: "Before January 2027",
    pct: 5,
    color: UXR.indigo,
    vol: "$460K Vol.",
    settle: "12:00 AM ET on January 1, 2027",
    points: mkSeries(4, [0.05, 0.06, 0.05, 0.06, 0.05, 0.06, 0.05, 0.05, 0.05]),
  },
  {
    label: "Before September 2026",
    short: "Before September 2026",
    pct: 1,
    color: UXR.yellow,
    vol: "$190K Vol.",
    settle: "12:00 AM ET on September 1, 2026",
    points: mkSeries(5, [0.02, 0.02, 0.02, 0.01, 0.02, 0.01, 0.01, 0.01, 0.01]),
  },
];

export default function Btc150kScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const betR = useBetRadius();
  const [scrubVals, setScrubVals] = useState<number[] | null>(null);
  // "Resolved outcomes" bucket is collapsed by default.
  const [resolvedOpen, setResolvedOpen] = useState(false);

  // Keep every plotted date rung discoverable while using a compact two-column
  // layout. The fifth outcome naturally occupies the first cell of the last row.
  const legend = RUNGS;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: screenTopInset(insets.top) + 8, paddingBottom: insets.bottom + 40 }}
      >
        {/* Nav row: back · share. Avatar + title sit on their own line below. */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 }}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <BackIcon />
          </Pressable>
          <Pressable hitSlop={10}>
            <MaterialIcons name="ios-share" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        {/* Market identity line: avatar · title + date. */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 12, marginTop: 18 }}>
          <View style={{ width: 40, height: 40, borderRadius: 10, overflow: "hidden", backgroundColor: colors.surface2 }}>
            <Image
              source={require("@/assets/figmaAssets/btc-logo-orange.png")}
              style={{ width: 40, height: 40 }}
              resizeMode="cover"
            />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              numberOfLines={2}
              style={{ fontFamily: geist.semibold, fontSize: 16, lineHeight: 22, color: colors.textPrimary }}
            >
              {TITLE}
            </Text>
            <Text style={{ fontFamily: geist.regular, fontSize: 13, lineHeight: 18, color: colors.textMuted, marginTop: 2 }}>
              Dec 31, 2026
            </Text>
          </View>
        </View>

        {/* Legend: every rung in a compact two-column grid. */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, marginTop: 24, rowGap: 12 }}>
          {legend.map((o) => (
            <View key={o.label} style={{ width: "50%", paddingRight: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: o.color }} />
              <Text numberOfLines={1} style={{ flex: 1, fontFamily: geist.medium, fontSize: 14, color: colors.textPrimary }}>
                {o.short.replace("Before ", "")}
              </Text>
              <Text style={{ fontFamily: geist.semibold, fontSize: 14, color: colors.textPrimary }}>
                {scrubVals ? Math.round((scrubVals[RUNGS.indexOf(o)] ?? 0) * 100) : o.pct}%
              </Text>
            </View>
          ))}
        </View>

        {/* Shared chart unit: all five date rungs. */}
        <ChartWithPeriods
          series={RUNGS.map((o) => ({ color: o.color, points: o.points }))}
          live
          fitTop
          onScrub={setScrubVals}
        />

        <MarketRulesSection
          subject={TITLE}
          paragraphs={[
            "This market will settle to Yes if the price of Bitcoin is above $149,999.99 at any point before the listed date.",
            "Outcome sourced from CF Benchmarks' Bitcoin Reference Rate (BRR).",
          ]}
        />

        {/* Predict: one row per date rung — name + vol, price button right. */}
        <Text style={{ color: colors.textPrimary, fontFamily: geist.semibold, fontSize: 20, lineHeight: 26, paddingHorizontal: 16, marginTop: 32 }}>
          Predict
        </Text>
        <View style={{ paddingHorizontal: 16, marginTop: 14, gap: 14 }}>
          {RUNGS.map((o) => (
            <View key={o.label} style={{ borderRadius: 16, backgroundColor: "rgba(255,255,255,0.08)", padding: 16, flexDirection: "row", alignItems: "center" }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ fontFamily: geist.semibold, fontSize: 16, color: colors.textPrimary }}>
                  {o.label}
                </Text>
                <VolumeText style={{ fontSize: 13, marginTop: 4 }}>
                  {o.vol}
                </VolumeText>
              </View>
              <Pressable
                onPress={() => openBetSlip({ title: o.label, market: TITLE, oddsCents: o.pct, color: o.color, side: "yes", returnTo: "/btc-150k" })}
                style={{
                  minWidth: 88,
                  height: 40,
                  borderRadius: betR,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 14,
                  marginLeft: 12,
                }}
              >
                <Text style={{ fontFamily: geist.semibold, fontSize: 15, color: colors.greenOutline }}>
                  Yes · {o.pct}{"\u00A2"}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>

        {/* Resolved bucket: dates already passed, all settled No. */}
        <View style={{ marginHorizontal: 16, marginTop: 24, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.08)", padding: 16 }}>
          <Pressable
            onPress={() => setResolvedOpen((v) => !v)}
            style={{ flexDirection: "row", alignItems: "center" }}
          >
            <Text style={{ fontFamily: geist.semibold, fontSize: 18, color: colors.textPrimary }}>
              Resolved outcomes
            </Text>
            <View style={{ marginLeft: 10, minWidth: 26, height: 26, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center", paddingHorizontal: 6 }}>
              <Text style={{ fontFamily: geist.medium, fontSize: 14, color: colors.textMuted }}>
                {RESOLVED.length}
              </Text>
            </View>
            <View style={{ flex: 1 }} />
            <Feather name={resolvedOpen ? "chevron-up" : "chevron-down"} size={22} color={colors.textMuted} />
          </Pressable>
          {resolvedOpen &&
            RESOLVED.map((r) => (
              <View key={r.label} style={{ flexDirection: "row", alignItems: "center", marginTop: 18 }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ fontFamily: geist.semibold, fontSize: 16, color: colors.textPrimary }}>
                    {r.label}
                  </Text>
                  <VolumeText style={{ fontSize: 13, marginTop: 4 }}>
                    {r.vol}
                  </VolumeText>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 12 }}>
                  <Text style={{ fontFamily: geist.semibold, fontSize: 16, color: colors.textPrimary }}>No</Text>
                  <MaterialIcons name="check-circle" size={20} color={colors.greenOutline} />
                </View>
              </View>
            ))}
        </View>
      </ScrollView>
    </View>
  );
}
