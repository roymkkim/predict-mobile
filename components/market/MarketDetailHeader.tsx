import React from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { colors } from "@/lib/sim/colors";
import { useThemeMode } from "@/lib/sim/dsModeStore";
import { LIVE_DOT_SIZE, LIVE_DOT_TEXT_GAP, LiveDot } from "@/components/sim/Crest";
import { steppedPath, type ChartSeries } from "./MarketGraph";
import { geist } from "@/lib/sim/geistFonts";

export type MarketTeam = { code: string; name: string; flag: string };

// Header heights (excluding the top safe-area inset) for the two scroll states.
export const HEADER_EXPANDED = 210;
export const HEADER_COLLAPSED = 100;
const NAV_H = 48;

// Tiny two-line preview drawn between the scores in the collapsed state.
function MiniChart({ series }: { series: ChartSeries[] }) {
  const w = 56;
  const h = 20;
  return (
    <Svg width={w} height={h}>
      {series.map((s, i) => (
        <Path key={i} d={steppedPath(s.points, w, h)} stroke={s.color} strokeWidth={2} fill="none" strokeLinejoin="round" />
      ))}
    </Svg>
  );
}

// Collapsing detail-page header. Expanded: LIVE chip + big title + big centered
// score with flags. Collapsed (on scroll): compact title in the nav row + an
// inline flag/score row with a mini chart. The two layouts cross-fade while the
// container height shrinks, driven by the parent ScrollView's `scrollY`.
export function MarketDetailHeader({
  title,
  home,
  away,
  scoreHome,
  scoreAway,
  live = false,
  clock,
  series,
  scrollY,
  topInset = 0,
  onBack,
}: {
  title: string;
  home: MarketTeam;
  away: MarketTeam;
  scoreHome: number;
  scoreAway: number;
  live?: boolean;
  clock?: string;
  series: ChartSeries[];
  scrollY: Animated.Value;
  topInset?: number;
  onBack?: () => void;
}) {
  useThemeMode();
  const T = HEADER_EXPANDED - HEADER_COLLAPSED;
  const height = scrollY.interpolate({
    inputRange: [0, T],
    outputRange: [HEADER_EXPANDED + topInset, HEADER_COLLAPSED + topInset],
    extrapolate: "clamp",
  });
  const expandedOpacity = scrollY.interpolate({ inputRange: [0, T * 0.55], outputRange: [1, 0], extrapolate: "clamp" });
  const collapsedOpacity = scrollY.interpolate({ inputRange: [T * 0.5, T], outputRange: [0, 1], extrapolate: "clamp" });

  return (
    <Animated.View style={[styles.container, { height, paddingTop: topInset, backgroundColor: colors.bg, borderBottomColor: colors.cardBorder }]}>
      {/* Nav row — always present; collapsed title fades in at center. */}
      <View style={styles.navRow}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.iconBtn}>
          <Feather name="chevron-left" size={24} color={colors.textPrimary} />
        </Pressable>
        <Animated.View style={[styles.navTitle, { opacity: collapsedOpacity }]} pointerEvents="none">
          <Text style={[styles.navTitleText, { color: colors.textPrimary }]} numberOfLines={1}>{title}</Text>
          {live ? (
            <View style={styles.navLiveRow}>
              <LiveDot color={colors.green} size={LIVE_DOT_SIZE} />
              <Text style={styles.navLiveText}>{clock ?? ""}</Text>
            </View>
          ) : null}
        </Animated.View>
        <Pressable hitSlop={12} style={styles.iconBtn}>
          <Feather name="message-square" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* Expanded body. */}
      <Animated.View style={[styles.body, { opacity: expandedOpacity }]} pointerEvents="none">
        {live ? (
          <View style={styles.liveRow}>
            <LiveDot color={colors.green} size={LIVE_DOT_SIZE} />
            <Text style={styles.liveText}>{`LIVE ${clock ?? ""}`.trim()}</Text>
          </View>
        ) : null}
        <Text style={[styles.bigTitle, { color: colors.textPrimary }]} numberOfLines={1}>{title}</Text>
        <View style={styles.scoreRow}>
          <View style={styles.teamCol}>
            <Image source={{ uri: home.flag }} style={styles.flag} resizeMode="cover" />
            <Text style={styles.code}>{home.code}</Text>
          </View>
          <View style={styles.centerCol}>
            <Text style={[styles.score, { color: colors.textPrimary }]}>{`${scoreHome} - ${scoreAway}`}</Text>
          </View>
          <View style={styles.teamCol}>
            <Image source={{ uri: away.flag }} style={styles.flag} resizeMode="cover" />
            <Text style={styles.code}>{away.code}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Collapsed inline score row. */}
      <Animated.View style={[styles.collapsedRow, { opacity: collapsedOpacity }]} pointerEvents="none">
        <View style={styles.collapsedSide}>
          <Image source={{ uri: home.flag }} style={styles.flagSm} resizeMode="cover" />
          <Text style={[styles.scoreSm, { color: colors.textPrimary }]}>{scoreHome}</Text>
        </View>
        <MiniChart series={series} />
        <View style={styles.collapsedSide}>
          <Text style={[styles.scoreSm, { color: colors.textPrimary }]}>{scoreAway}</Text>
          <Image source={{ uri: away.flag }} style={styles.flagSm} resizeMode="cover" />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: "hidden",
    borderBottomWidth: 1,
  },

  navRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: NAV_H },
  iconBtn: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  navTitle: { position: "absolute", left: 56, right: 56, alignItems: "center", justifyContent: "center" },
  navTitleText: { fontFamily: geist.semibold, fontSize: 16, lineHeight: 20 },
  navLiveRow: { flexDirection: "row", alignItems: "center", gap: LIVE_DOT_TEXT_GAP, marginTop: 2 },
  navLiveText: { color: colors.green, fontFamily: geist.medium, fontSize: 13, lineHeight: 16 },

  body: { position: "absolute", left: 16, right: 16, top: NAV_H },
  liveRow: { flexDirection: "row", alignItems: "center", gap: LIVE_DOT_TEXT_GAP },
  liveText: { color: colors.green, fontFamily: geist.medium, fontSize: 14, lineHeight: 18 },
  bigTitle: { fontFamily: geist.semibold, fontSize: 26, lineHeight: 32, marginTop: 6 },
  scoreRow: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  teamCol: { width: 64, alignItems: "center", gap: 8 },
  flag: { width: 48, height: 48, borderRadius: 8, backgroundColor: colors.surface },
  code: { color: colors.textMuted, fontFamily: geist.medium, fontSize: 14, lineHeight: 18 },
  centerCol: { flex: 1, alignItems: "center", justifyContent: "center" },
  score: { fontFamily: geist.semibold, fontSize: 36, lineHeight: 40 },

  collapsedRow: {
    position: "absolute",
    left: 16,
    right: 16,
    top: NAV_H,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  collapsedSide: { flexDirection: "row", alignItems: "center", gap: 10 },
  flagSm: { width: 28, height: 28, borderRadius: 6, backgroundColor: colors.surface },
  scoreSm: { fontFamily: geist.semibold, fontSize: 26, lineHeight: 30 },
});
