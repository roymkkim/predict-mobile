import React, { useRef, useState } from "react";
import { Animated, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/lib/sim/colors";
import { screenTopInset } from "@/lib/sim/layout";
import { MarketDetailHeader, HEADER_EXPANDED } from "@/components/market/MarketDetailHeader";
import { MarketGraph, type ChartSeries } from "@/components/market/MarketGraph";
import { MarketsSection, type MarketTab } from "@/components/market/MarketsSection";
import { MarketFooter } from "@/components/market/MarketFooter";
import { useFixedMarketActions } from "@/lib/sim/marketDetailActionsStore";

const GOLD = "#e0a423";
const DRAW = colors.slate;
const RED = colors.red;

const HOME = { code: "ESP", name: "Spain", flag: "https://flagcdn.com/w80/es.png" };
const AWAY = { code: "ENG", name: "England", flag: "https://flagcdn.com/w80/gb-eng.png" };

const SERIES: ChartSeries[] = [
  { label: "Spain", pct: "90%", color: GOLD, points: [0.6, 0.6, 0.64, 0.64, 0.68, 0.71, 0.78, 0.82, 0.9] },
  { label: "England", pct: "16%", color: RED, points: [0.42, 0.42, 0.4, 0.38, 0.34, 0.3, 0.24, 0.2, 0.16] },
];

const PERIODS = ["LIVE", "1D", "1W", "1M", "1Y"];

const threeWay = [
  { label: "ESP", value: "50¢", color: GOLD },
  { label: "DRAW", value: "34¢", color: DRAW },
  { label: "ENG", value: "16%", color: RED },
];

const TABS: MarketTab[] = [
  {
    key: "games",
    title: "Games",
    markets: [
      { kind: "buttons", id: "advance", title: "Team to advance", vol: "$1.7M Vol.", outcomes: threeWay },
      { kind: "buttons", id: "reg-winner", title: "Regulation time winner", vol: "$1.7M Vol.", outcomes: threeWay },
      {
        kind: "spread",
        id: "spread",
        title: "Spread",
        subject: "Spain",
        line: "0.5",
        ticks: ["1.5", "0.5", "0.5", "1.5"],
        activeTick: 2,
        yesPct: "53%",
        noPct: "47%",
      },
    ],
  },
  {
    key: "props",
    title: "Props",
    markets: [
      {
        kind: "buttons",
        id: "first-goal",
        title: "First goal scorer",
        vol: "$420k Vol.",
        outcomes: [
          { label: "ESP", value: "44¢", color: GOLD },
          { label: "ENG", value: "31¢", color: RED },
          { label: "None", value: "25¢", color: DRAW },
        ],
      },
      {
        kind: "spread",
        id: "totals",
        title: "Total goals",
        subject: "Match",
        line: "2.5",
        ticks: ["1.5", "2.5", "3.5", "4.5"],
        activeTick: 1,
        yesPct: "61%",
        noPct: "39%",
      },
    ],
  },
];

export default function MarketScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState("LIVE");
  const fixedMarketActions = useFixedMarketActions();
  const scrollY = useRef(new Animated.Value(0)).current;

  const topInset = Math.max(screenTopInset(insets.top), 12);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Animated.ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        contentContainerStyle={{ paddingTop: HEADER_EXPANDED + topInset, paddingBottom: insets.bottom + (fixedMarketActions ? 120 : 40) }}
      >
        <MarketGraph series={SERIES} periods={PERIODS} activePeriod={period} onPeriod={setPeriod} />

        <View style={{ height: 1, backgroundColor: colors.cardBorder, marginTop: 12 }} />

        <MarketsSection tabs={TABS} />
      </Animated.ScrollView>

      <MarketDetailHeader
        title="Spain vs. England"
        home={HOME}
        away={AWAY}
        scoreHome={1}
        scoreAway={1}
        live
        clock="32'"
        series={SERIES}
        scrollY={scrollY}
        topInset={topInset}
        onBack={() => router.back()}
      />

      {fixedMarketActions && (
        <MarketFooter
          buttons={[
            { label: "Buy No", tone: "no" },
            { label: "Buy Yes", tone: "yes" },
          ]}
          bottomInset={insets.bottom}
        />
      )}
    </View>
  );
}
