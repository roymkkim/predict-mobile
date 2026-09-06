import React from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { Feather } from "@expo/vector-icons";

import colors from "@/constants/colors";
import { formatVol } from "@/lib/formatVol";
import { PulsingDot } from "@/components/PulsingDot";
import { AnimatedPct } from "@/components/AnimatedPct";
import { geist } from "@/lib/sim/geistFonts";
import { VolumeText } from "@/components/sim/VolumeText";

const c = colors.light;

export type ImgSrc = ImageSourcePropType | { uri: string } | null;

export type MarketRow = { name: string; img?: ImgSrc; anim: Animated.Value; barColor: string };

export type MarketHeader =
  | { kind: "league"; live?: { time: string }; league: string; stage?: string; leagueDotColor?: string; leagueLogo?: ImgSrc }
  | { kind: "title"; title: string; thumb: ImageSourcePropType };

const pctToWidth = (a: Animated.Value) =>
  a.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });

function HashIcon() {
  return (
    <View style={styles.hashIcon}>
      <Text style={{ color: c.textMuted, fontFamily: geist.medium, fontSize: 18, lineHeight: 18 }}>−</Text>
    </View>
  );
}

function LiveOddsMultiplier({ anim, style }: { anim: Animated.Value; style?: any }) {
  const startVal = (anim as unknown as { _value?: number })._value ?? 0;
  const toLabel = (v: number) => (v <= 0 ? "—" : `${(100 / v).toFixed(2)}x`);
  const [label, setLabel] = React.useState<string>(toLabel(startVal));
  React.useEffect(() => {
    let last = label;
    const id = anim.addListener(({ value }) => {
      const next = toLabel(value);
      if (next !== last) {
        last = next;
        setLabel(next);
      }
    });
    return () => anim.removeListener(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anim]);
  return <Text style={style}>{label}</Text>;
}

function CardFooter({ volume, date, outcomes }: { volume?: string; date: string; outcomes?: string }) {
  return (
    <View style={styles.footer}>
      <View style={styles.footerLeft}>
        {volume ? (
          <View style={styles.footerItem}>
            <Feather name="briefcase" size={12} color={c.textMuted} />
            <VolumeText style={styles.footerText}>{formatVol(volume)}</VolumeText>
          </View>
        ) : null}
        <View style={styles.footerItem}>
          <Feather name="clock" size={12} color={c.textMuted} />
          <Text style={styles.footerText}>{date}</Text>
        </View>
      </View>
      {outcomes ? <Text style={styles.footerText}>{outcomes}</Text> : null}
    </View>
  );
}

export function MarketListCard({
  header, rows, footer, onPress, style,
}: {
  header: MarketHeader;
  rows: MarketRow[];
  footer: { volume?: string; date: string; outcomes?: string };
  onPress?: () => void;
  style?: ViewStyle;
}) {
  const body = (
    <View style={[styles.card, style]}>
      <View style={{ padding: 12, gap: 12 }}>
        {header.kind === "league" ? (
          <View style={styles.leagueHeaderRow}>
            {header.live ? (
              <View style={styles.liveChip}>
                <PulsingDot size={6} color={c.green} />
                <Text style={styles.liveChipText} numberOfLines={1}>Live · {header.live.time}</Text>
              </View>
            ) : null}
            <View style={styles.leagueChip}>
              {header.leagueLogo ? (
                <Image source={header.leagueLogo as ImageSourcePropType} style={styles.leagueLogo} resizeMode="contain" />
              ) : (
                <View style={[styles.leagueDot, { backgroundColor: header.leagueDotColor ?? c.accent }]} />
              )}
              <Text style={styles.leagueChipText} numberOfLines={1}>{header.league}</Text>
            </View>
            {header.stage ? <Text style={styles.leagueStageText} numberOfLines={1}>{header.stage}</Text> : null}
          </View>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Image source={header.thumb} style={styles.thumb} />
            <Text style={[styles.title16, { flex: 1 }]}>{header.title}</Text>
          </View>
        )}
        {rows.map((row) => (
          <View key={row.name} style={styles.listRow}>
            {row.img ? <Image source={row.img as ImageSourcePropType} style={styles.smallThumb} resizeMode="cover" /> : null}
            <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
              <Text style={styles.rowName} numberOfLines={1}>{row.name}</Text>
              <View style={styles.rowBarTrack}>
                <Animated.View
                  style={[styles.rowBarFill, { width: pctToWidth(row.anim), backgroundColor: row.barColor }]}
                />
              </View>
            </View>
            <LiveOddsMultiplier anim={row.anim} style={styles.mult} />
            <View style={styles.pctPill}>
              <AnimatedPct anim={row.anim} style={styles.pctPillText} />
            </View>
          </View>
        ))}
      </View>
      <CardFooter {...footer} />
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}>
        {body}
      </Pressable>
    );
  }
  return body;
}

const styles = StyleSheet.create({
  card: { backgroundColor: c.surface, borderRadius: 12, overflow: "hidden", marginHorizontal: 16 },
  footer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 12 },
  footerLeft: { flexDirection: "row", gap: 12, flex: 1 },
  footerItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  footerText: { color: c.textMuted, fontFamily: geist.medium, fontSize: 12 },
  pctPill: {
    minWidth: 56, paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: c.surface2, borderRadius: 8, alignItems: "center",
  },
  pctPillText: { color: "#fff", fontFamily: geist.medium, fontSize: 14 },
  mult: { color: c.textMuted, fontFamily: geist.medium, fontSize: 13 },
  hashIcon: {
    width: 24, height: 24, borderRadius: 4, backgroundColor: c.surface2,
    alignItems: "center", justifyContent: "center",
  },
  thumb: { width: 40, height: 40, borderRadius: 6 },
  smallThumb: { width: 24, height: 24, borderRadius: 6 },
  title16: { color: "#fff", fontFamily: geist.medium, fontSize: 16 },
  listRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowName: { color: "#fff", fontFamily: geist.medium, fontSize: 14 },
  rowBarTrack: { height: 2, borderRadius: 1, backgroundColor: c.surface2, overflow: "hidden" },
  rowBarFill: { height: 2, borderRadius: 1 },
  leagueHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  liveChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: c.greenSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  liveChipText: { color: c.green, fontFamily: geist.medium, fontSize: 11 },
  leagueChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: c.tagSurface, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  leagueDot: { width: 10, height: 10, borderRadius: 2 },
  leagueLogo: { width: 14, height: 14, borderRadius: 2 },
  leagueChipText: { color: c.textMuted, fontFamily: geist.medium, fontSize: 11 },
  leagueStageText: { color: c.textMuted, fontFamily: geist.medium, fontSize: 12 },
});
