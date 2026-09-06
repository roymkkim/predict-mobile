import React, { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { screenTopInset } from "@/lib/sim/layout";
import { BackIcon } from "@/components/PageHeader";
import Svg, { Path } from "react-native-svg";

import colors from "@/constants/colors";
import { backgroundMuted } from "@/lib/sim/colors";
import { useThemeMode } from "@/lib/sim/dsModeStore";
import { formatVol } from "@/lib/formatVol";
import { geist } from "@/lib/sim/geistFonts";

const c = colors.light;

const SCREEN_W = 393;
const MARKER_W = 64;
const GRAPH_RIGHT_PAD = 16;
const LINE_W = SCREEN_W - MARKER_W - GRAPH_RIGHT_PAD - 8;
const LINE_H = 80;

const COLOR_SPA = "#d99422";
const COLOR_ENG = "#e0556a";
const COLOR_HOME_BG = "#a66e0d";
const COLOR_AWAY_BG = "#c60b1e";
const COLOR_BORDER = "rgba(133,139,154,0.2)";
const COLOR_MUTED_TEXT = "#9b9b9b";

const TOP_TABS = ["Positions", "Outcomes"];
const FILTER_TABS = ["Game lines", "Assists", "Red cards", "Fouls", "Goals"];
const PERIOD_TABS = ["Live", "6H", "1D", "Max"];

type Params = {
  home?: string;
  away?: string;
  homeInitial?: string;
  awayInitial?: string;
  homeFlag?: string;
  awayFlag?: string;
  homePct?: string;
  awayPct?: string;
  league?: string;
  mins?: string;
  vol?: string;
};

function HomeLine({ width, height, color }: { width: number; height: number; color: string }) {
  // starts mid-left, flat for ~60%, ramps up to indicator at top-right
  const yStart = height * 0.62;
  const yEnd = height * 0.18;
  const xKnee1 = width * 0.55;
  const xKnee2 = width * 0.78;
  const d = `M 0 ${yStart} L ${xKnee1} ${yStart} C ${xKnee2 - 30} ${yStart} ${xKnee2 - 20} ${yEnd} ${xKnee2} ${yEnd} L ${width} ${yEnd}`;
  return (
    <Svg width={width} height={height}>
      <Path d={d} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AwayLine({ width, height, color }: { width: number; height: number; color: string }) {
  // starts mid-left, flat, then ramps DOWN to indicator at lower-right
  const yStart = height * 0.38;
  const yEnd = height * 0.82;
  const xKnee1 = width * 0.55;
  const xKnee2 = width * 0.78;
  const d = `M 0 ${yStart} L ${xKnee1} ${yStart} C ${xKnee2 - 30} ${yStart} ${xKnee2 - 20} ${yEnd} ${xKnee2} ${yEnd} L ${width} ${yEnd}`;
  return (
    <Svg width={width} height={height}>
      <Path d={d} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function Indicator({ color, x, y }: { color: string; x: number; y: number }) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.indicatorOuter,
        {
          left: x - 16,
          top: y - 16,
          backgroundColor: color + "1F",
          borderColor: color + "55",
        },
      ]}
    >
      <View style={[styles.indicatorInner, { backgroundColor: color }]} />
    </View>
  );
}

function PickButton({
  bg,
  label,
  cents,
}: {
  bg: string;
  label: string;
  cents: number;
}) {
  return (
    <Pressable style={[styles.pickBtn, { backgroundColor: bg }]}>
      <Text style={styles.pickBtnLabel} numberOfLines={1}>{label}</Text>
      <Text style={styles.pickBtnPrice}>{cents}¢</Text>
    </Pressable>
  );
}

function PickButtonRow({
  homeInitial,
  awayInitial,
  homeCents,
  drawCents,
  awayCents,
}: {
  homeInitial: string;
  awayInitial: string;
  homeCents: number;
  drawCents: number;
  awayCents: number;
}) {
  const themeMode = useThemeMode();
  return (
    <View style={styles.pickBtnRow}>
      <PickButton bg={COLOR_HOME_BG} label={homeInitial} cents={homeCents} />
      <PickButton bg={backgroundMuted(themeMode)} label="DRAW" cents={drawCents} />
      <PickButton bg={COLOR_AWAY_BG} label={awayInitial} cents={awayCents} />
    </View>
  );
}

export default function MatchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<Params>();

  const home = (params.home as string) || "Spain";
  const away = (params.away as string) || "England";
  const homeInitial = ((params.homeInitial as string) || "SPA").toUpperCase();
  const awayInitial = ((params.awayInitial as string) || "ENG").toUpperCase();
  const homeFlag = (params.homeFlag as string) || "https://flagcdn.com/w80/es.png";
  const awayFlag = (params.awayFlag as string) || "https://flagcdn.com/w80/gb-eng.png";
  const homePct = parseInt((params.homePct as string) || "70", 10);
  const awayPct = parseInt((params.awayPct as string) || "30", 10);
  const drawPct = Math.max(0, 100 - homePct - awayPct);
  const mins = (params.mins as string) || "75'";
  const moneyVol = formatVol((params.vol as string) || "$845.21k Vol");

  const [activeTopTab, setActiveTopTab] = useState("Outcomes");
  const [activeFilter, setActiveFilter] = useState("Game lines");
  const [activePeriod, setActivePeriod] = useState("Live");

  const homeCents = Math.max(1, Math.min(99, Math.round(homePct * 0.86)));
  const awayCents = Math.max(1, Math.min(99, Math.round(awayPct * 2.07)));
  const drawCents = Math.max(1, Math.min(99, drawPct || 15));

  // Indicator end positions for the two graph lines
  const homeIndY = useMemo(() => LINE_H * 0.18, []);
  const awayIndY = useMemo(() => LINE_H * 0.82, []);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: Math.max(screenTopInset(insets.top), 50) }}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.iconBtn}>
          <BackIcon />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{`${home} vs ${away}`}</Text>
        <Pressable hitSlop={12} style={styles.iconBtn}>
          <MaterialIcons name="ios-share" size={20} color="#fff" />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 220 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Scoreboard */}
        <View style={styles.gameInfo}>
          <View style={styles.scoreRow}>
            <Image source={{ uri: homeFlag }} style={styles.teamLogo} resizeMode="cover" />
            <View style={styles.gameClock}>
              <View style={styles.liveRow}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Live</Text>
              </View>
              <Text style={styles.minsText}>{mins}</Text>
            </View>
            <Image source={{ uri: awayFlag }} style={styles.teamLogo} resizeMode="cover" />
          </View>
          <View style={styles.codeRow}>
            <Text style={styles.teamCode}>{homeInitial}</Text>
            <Text style={styles.teamCode}>{awayInitial}</Text>
          </View>
        </View>

        {/* Graph */}
        <View style={styles.graphBlock}>
          {/* Home (rises to top-right) */}
          <View style={styles.lineAxisRow}>
            <View style={[styles.lineWrap, { width: LINE_W, height: LINE_H }]}>
              <HomeLine width={LINE_W} height={LINE_H} color={COLOR_SPA} />
              <Indicator color={COLOR_SPA} x={LINE_W} y={homeIndY} />
            </View>
            <View style={styles.markerCol}>
              <Text style={styles.markerLabel}>{homeInitial}</Text>
              <Text style={styles.markerPct}>{homePct}%</Text>
            </View>
          </View>
          {/* Away (drops to lower-right) */}
          <View style={styles.lineAxisRow}>
            <View style={[styles.lineWrap, { width: LINE_W, height: LINE_H }]}>
              <AwayLine width={LINE_W} height={LINE_H} color={COLOR_ENG} />
              <Indicator color={COLOR_ENG} x={LINE_W} y={awayIndY} />
            </View>
            <View style={styles.markerCol}>
              <Text style={styles.markerLabel}>{awayInitial}</Text>
              <Text style={styles.markerPct}>{awayPct}%</Text>
            </View>
          </View>
        </View>

        {/* Period selector (above tabs, directly under chart) */}
        <View style={styles.periodRow}>
          {PERIOD_TABS.map((p) => {
            const active = p === activePeriod;
            return (
              <Pressable
                key={p}
                onPress={() => setActivePeriod(p)}
                style={[styles.periodBtn, active && styles.periodBtnActive]}
              >
                <Text style={[styles.periodBtnText, active && { color: "#fff" }]}>{p}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Top tabs */}
        <View style={styles.topTabRow}>
          {TOP_TABS.map((t) => {
            const active = t === activeTopTab;
            return (
              <Pressable key={t} onPress={() => setActiveTopTab(t)} style={styles.topTab}>
                <Text style={[styles.topTabText, active && styles.topTabTextActive]}>{t}</Text>
                {active ? <View style={styles.topTabUnderline} /> : null}
              </Pressable>
            );
          })}
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={styles.filterRow}
        >
          {FILTER_TABS.map((f) => {
            const active = f === activeFilter;
            return (
              <Pressable
                key={f}
                onPress={() => setActiveFilter(f)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, active && { color: "#000" }]} numberOfLines={1}>
                  {f}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Money line outcome card */}
        <View style={styles.moneyCard}>
          <View style={styles.moneyHeaderRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.moneyTitle}>Money line</Text>
              <Text style={styles.moneyVol}>{moneyVol}</Text>
            </View>
            <Text style={styles.moneyChance}>Chance</Text>
          </View>
          <PickButtonRow
            homeInitial={homeInitial}
            awayInitial={awayInitial}
            homeCents={homeCents}
            drawCents={drawCents}
            awayCents={awayCents}
          />
        </View>

      </ScrollView>

      {/* Sticky CTA */}
      <View style={[styles.cta, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.pickInfoRow}>
          <Text style={styles.pickWinner}>Pick a winner</Text>
          <Feather name="info" size={14} color={COLOR_MUTED_TEXT} />
          <Text style={styles.totalVol}>{formatVol("$130,490 Vol")}</Text>
        </View>
        <PickButtonRow
          homeInitial={homeInitial}
          awayInitial={awayInitial}
          homeCents={homeCents}
          drawCents={drawCents}
          awayCents={awayCents}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  iconBtn: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  title: {
    flex: 1,
    color: "#fff",
    fontFamily: geist.bold,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },

  gameInfo: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  teamLogo: { width: 32, height: 32, borderRadius: 8, backgroundColor: c.surface },
  gameClock: { flex: 1, alignItems: "center", justifyContent: "center", height: 40, position: "relative" },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: c.green,
  },
  liveText: { color: c.green, fontFamily: geist.medium, fontSize: 14, lineHeight: 22 },
  minsText: { color: COLOR_MUTED_TEXT, fontFamily: geist.medium, fontSize: 14, lineHeight: 22 },
  codeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  teamCode: { width: 40, color: COLOR_MUTED_TEXT, fontFamily: geist.medium, fontSize: 14, lineHeight: 22, textAlign: "center" },

  graphBlock: {
    height: 353,
    paddingRight: GRAPH_RIGHT_PAD,
    paddingVertical: 16,
    justifyContent: "center",
    gap: 40,
  },
  lineAxisRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  lineWrap: { position: "relative" },
  markerCol: { width: MARKER_W, justifyContent: "flex-end" },
  markerLabel: { color: "#fff", fontFamily: geist.medium, fontSize: 14, lineHeight: 22 },
  markerPct: { color: "#fff", fontFamily: geist.semibold, fontSize: 24, lineHeight: 32 },

  indicatorOuter: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  indicatorInner: { width: 12, height: 12, borderRadius: 6 },

  topTabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLOR_BORDER,
  },
  topTab: { flex: 1, paddingVertical: 8, alignItems: "center", justifyContent: "center" },
  topTabText: { color: COLOR_MUTED_TEXT, fontFamily: geist.regular, fontSize: 16, lineHeight: 24 },
  topTabTextActive: { color: "#fff" },
  topTabUnderline: {
    position: "absolute",
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#fff",
  },

  filterRow: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: c.surface,
  },
  filterChipActive: { backgroundColor: "#fff" },
  filterChipText: { color: "#fff", fontFamily: geist.medium, fontSize: 16 },

  moneyCard: {
    marginHorizontal: 16,
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 16,
    gap: 16,
    marginTop: 4,
  },
  moneyHeaderRow: { flexDirection: "row", alignItems: "flex-end" },
  moneyTitle: { color: "#fff", fontFamily: geist.semibold, fontSize: 16, lineHeight: 22 },
  moneyVol: { color: COLOR_MUTED_TEXT, fontFamily: geist.medium, fontWeight: "500", fontSize: 13, marginTop: 2 },
  moneyChance: { color: COLOR_MUTED_TEXT, fontFamily: geist.medium, fontSize: 13 },

  periodRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  periodBtn: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  periodBtnActive: { backgroundColor: "rgba(255,255,255,0.06)" },
  periodBtnText: { color: COLOR_MUTED_TEXT, fontFamily: geist.medium, fontSize: 14 },

  cta: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: c.bg,
    borderTopWidth: 1,
    borderTopColor: COLOR_BORDER,
    paddingTop: 16,
    paddingHorizontal: 16,
    gap: 16,
  },
  pickInfoRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  pickWinner: { color: COLOR_MUTED_TEXT, fontFamily: geist.medium, fontSize: 14 },
  totalVol: { flex: 1, color: COLOR_MUTED_TEXT, fontFamily: geist.medium, fontWeight: "500", fontSize: 14, textAlign: "right" },

  pickBtnRow: { flexDirection: "row", gap: 8 },
  pickBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 8,
  },
  pickBtnLabel: { color: "#fff", fontFamily: geist.medium, fontSize: 16, lineHeight: 24 },
  pickBtnPrice: { color: "#fff", fontFamily: geist.medium, fontSize: 16, lineHeight: 24 },
});
