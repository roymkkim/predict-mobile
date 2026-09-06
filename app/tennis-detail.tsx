import React, { useMemo, useState } from "react";
import { Image, Pressable, Text, View, useWindowDimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BackIcon } from "@/components/PageHeader";

import { colors, marketAccentColor } from "@/lib/sim/colors";
import { outcomeButtonVisual } from "@/lib/sim/buttonStyle";
import { screenTopInset } from "@/lib/sim/layout";
import { openBetSlip } from "@/lib/sim/betSlipStore";
import { useBetRadius } from "@/lib/sim/pillButtonsStore";
import { MatchPositionsSection } from "@/components/sim/MatchPositionsSection";
import { LIVE_CHAT_FOOTER_RESERVE } from "@/components/sim/MarketLiveChat";
import { MarketPageBody } from "@/components/sim/MarketPageTabs";
import { StickyDetailScroll } from "@/components/sim/StickyDetailScroll";
import { MarketRulesSection } from "@/components/sim/MarketRulesSection";
import { MarketActionFooter, MARKET_ACTION_FOOTER_SPACE } from "@/components/sim/MarketActionFooter";
import { FilterButton } from "@/components/sim/FilterButton";
import { MatchComboPicksCarousel } from "@/components/sim/CombinationsSection";
import { ChartWithPeriods } from "@/components/sim/ScoreChartUnit";
import { ScoreUnit } from "@/components/sim/StandardCard";
import { LiveTimestamp } from "@/components/sim/LiveTimestamp";
import { useFixedMarketActions } from "@/lib/sim/marketDetailActionsStore";
import { geist } from "@/lib/sim/geistFonts";
import { VolumeText } from "@/components/sim/VolumeText";

// Tennis match detail page — per approved reference:
// centered "A vs. B" title with a "● Live · 1st set" subheader, two player
// rows (flag · name · per-set scores with tiebreak superscripts · point pill),
// a stepped odds chart with glowing live end dots, and Live/6H/1D/Max pills.

const BLUE = marketAccentColor("#1e58cd");
const RED = marketAccentColor("#cf102c");

type SetScore = { games: number; tiebreak?: number };
type Player = {
  name: string;
  flag: string; // flagcdn code
  sets: SetScore[];
  point: string; // current-game point ("AD", "40", …)
  color: string;
};

const P1: Player = {
  name: "Jakub Mensik",
  flag: "cz",
  sets: [{ games: 7 }, { games: 3 }, { games: 3 }, { games: 3 }, { games: 6, tiebreak: 7 }],
  point: "AD",
  color: BLUE,
};
const P2: Player = {
  name: "Toby Samuel",
  flag: "gb",
  sets: [{ games: 5 }, { games: 6 }, { games: 6 }, { games: 6 }, { games: 7, tiebreak: 9 }],
  point: "40",
  color: RED,
};

const MATCH_NAMES = [P1.name, P2.name];

// Deterministic stepped series (staircase odds): values HOLD for a few ticks
// then jump, so the chart reads as discrete odds moves rather than noise.
// Late-match swing makes the pair converge and cross near the end (reference).
function mkSteps(seed: number): number[] {
  const N = 56;
  const out: number[] = [];
  let v = 0.72;
  let hold = 0;
  for (let i = 0; i < N; i++) {
    if (hold <= 0) {
      const r = Math.sin(seed * 12.9898 + i * 78.233);
      v += r * 0.08;
      hold = 2 + Math.round(Math.abs(Math.sin(seed * 7 + i)) * 2); // hold 2-4 ticks
    }
    hold--;
    // Converge toward the middle late in the match, then dip below.
    if (i > N * 0.7) v -= 0.02;
    v = Math.max(0.18, Math.min(0.85, v));
    out.push(v);
  }
  return out;
}

function PlayerRow({ p }: { p: Player }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <Image
        source={{ uri: `https://flagcdn.com/w80/${p.flag}.png` }}
        resizeMode="cover"
        style={{ width: 40, height: 40, borderRadius: 10 }}
      />
      <Text style={{ flex: 1, fontFamily: geist.semibold, fontSize: 14, lineHeight: 22, color: colors.textPrimary }}>
        {p.name}
      </Text>
      {/* Card scoring unit (StandardCard's ScoreUnit) — matches the feed cards. */}
      <ScoreUnit
        value={p.point}
        sets={p.sets.map((s) => ({ games: s.games, tiebreak: s.tiebreak }))}
        activeSetIdx={p.sets.length - 1}
      />
    </View>
  );
}

export default function TennisDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: winW } = useWindowDimensions();
  // Stacked sections (game-detail structure): Games/Props pills + selected outcome.
  const [pill, setPill] = useState<"Games" | "Props">("Games");
  const betR = useBetRadius();
  const fixedMarketActions = useFixedMarketActions();
  const primaryActions = [
    { key: "men", label: "MEN · 54¢", color: BLUE, onPress: () => openBetSlip({ title: "MEN", market: "Match winner", oddsCents: 54, color: BLUE, side: "yes", returnTo: "/tennis-detail" }) },
    { key: "sam", label: "SAM · 46¢", color: RED, onPress: () => openBetSlip({ title: "SAM", market: "Match winner", oddsCents: 46, color: RED, side: "yes", returnTo: "/tennis-detail" }) },
  ];

  const { s1, s2 } = useMemo(() => {
    const a = mkSteps(3);
    // Mirror so the pair reads as complementary odds.
    const b = a.map((v) => Math.max(0.12, Math.min(0.88, 1 - v)));
    // Keep the live end dots visibly separated (same rule as game-detail).
    const MIN_GAP = 0.16;
    const la = a[a.length - 1];
    const lb = b[b.length - 1];
    if (Math.abs(la - lb) < MIN_GAP) {
      const mid = (la + lb) / 2;
      const dir = la >= lb ? 1 : -1;
      a[a.length - 1] = Math.max(0.08, Math.min(0.92, mid + (dir * MIN_GAP) / 2));
      b[b.length - 1] = Math.max(0.08, Math.min(0.92, mid - (dir * MIN_GAP) / 2));
    }
    return { s1: a, s2: b };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StickyDetailScroll
        topInset={screenTopInset(insets.top)}
        paddingBottom={insets.bottom + (fixedMarketActions ? MARKET_ACTION_FOOTER_SPACE : 40)}
        header={
        /* Nav row: back · centered title + live stamp · share */
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16 }}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <BackIcon />
          </Pressable>
          <View style={{ flex: 1, alignItems: "center", paddingHorizontal: 8 }}>
            <Text
              numberOfLines={1}
              style={{ textAlign: "center", fontFamily: geist.semibold, fontSize: 16, lineHeight: 21, color: colors.textPrimary }}
            >
              {`${P1.name} vs. ${P2.name}`}
            </Text>
            <View style={{ marginTop: 2 }}>
              <LiveTimestamp
                descriptor="1st set"
                variant="linear"
                align="center"
                fontSize={12}
                uppercaseDescriptor
                liveColor={colors.greenOutline}
                descriptorColor={colors.textMuted}
              />
            </View>
          </View>
          <Pressable hitSlop={10}>
            <MaterialIcons name="ios-share" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>
        }
      >

        {/* Player rows */}
        <View style={{ paddingHorizontal: 16, marginTop: 22, gap: 18 }}>
          <PlayerRow p={P1} />
          <PlayerRow p={P2} />
        </View>

        {/* Shared MetaMask chart component (watermark + period pills + scrub
            timestamp), same as the other detail pages. */}
        <ChartWithPeriods
          series={[
            { color: BLUE, points: s1 },
            { color: RED, points: s2 },
          ]}
          live
          showGrid={false}
          scrubNames={[P1.name, P2.name]}
        />

        <MarketPageBody
          marketTitle={`${P1.name} vs. ${P2.name}`}
          footerReserve={fixedMarketActions ? LIVE_CHAT_FOOTER_RESERVE : 0}
          positionNames={MATCH_NAMES}
          rules={<MarketRulesSection subject={`${P1.name} vs. ${P2.name}`} />}
          positions={({ tabbed }) => (
            <MatchPositionsSection names={MATCH_NAMES} marketTitle={`${P1.name} vs. ${P2.name}`} returnTo="/tennis-detail" hideHeading={tabbed} showEmpty={tabbed} />
          )}
          predict={
            <>
        <MatchComboPicksCarousel names={MATCH_NAMES} sport="tennis" />
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

        <View style={{ paddingHorizontal: 16, marginTop: 16, gap: 14 }}>
          {(pill === "Games"
            ? [{ title: "Match winner", vol: "$96K Vol.", outcomes: [{ label: "MEN", pct: 54, color: BLUE }, { label: "SAM", pct: 46, color: RED }] }]
            : [
                { title: "Match goes to a deciding set?", vol: "$31K Vol.", outcomes: [{ label: "Yes", pct: 58, color: colors.green }, { label: "No", pct: 42, color: colors.red }] },
                { title: "Any set decided by tiebreak?", vol: "$18K Vol.", outcomes: [{ label: "Yes", pct: 64, color: colors.green }, { label: "No", pct: 36, color: colors.red }] },
              ]
          ).map((mkt) => (
            <View key={mkt.title} style={{ borderRadius: 16, backgroundColor: "rgba(255,255,255,0.08)", padding: 16 }}>
              <Text style={{ fontFamily: geist.semibold, fontSize: 16, color: colors.textPrimary }}>{mkt.title}</Text>
              <VolumeText style={{ fontSize: 13, marginTop: 4 }}>{mkt.vol}</VolumeText>
              {(!fixedMarketActions || mkt.title !== "Match winner") && (
                <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                  {mkt.outcomes.map((o) => {
                    const visual = outcomeButtonVisual("default", "gray-colored", o.color, {
                      mode: "muted-color",
                      label: o.label,
                    });
                    return (
                    <Pressable
                      key={o.label}
                      onPress={() => openBetSlip({ title: o.label, market: mkt.title, oddsCents: o.pct, color: o.color, side: "yes", returnTo: "/tennis-detail" })}
                      style={{
                        flex: 1,
                        height: 48,
                        borderRadius: betR,
                        alignItems: "center",
                        justifyContent: "center",
                        ...visual.container,
                      }}
                    >
                      <Text style={[{ fontFamily: geist.semibold, fontSize: 15 }, visual.text]}>
                        {`${o.label} \u00b7 ${o.pct}\u00a2`}
                      </Text>
                    </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          ))}
        </View>
            </>
          }
        />
      </StickyDetailScroll>
      {fixedMarketActions && <MarketActionFooter actions={primaryActions} bottomInset={insets.bottom} />}
    </View>
  );
}
