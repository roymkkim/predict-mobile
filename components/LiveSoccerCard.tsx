import React from "react";
import { Animated, Image, ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import colors from "@/constants/colors";
import { PulsingDot } from "@/components/PulsingDot";
import { SlotPct } from "@/components/SlotPct";
import { useLiveOdds } from "@/hooks/useLiveOdds";
import { useLiveScore } from "@/hooks/useLiveScore";
import { periodLabel } from "@/lib/periodLabel";
import { geist } from "@/lib/sim/geistFonts";
import { VolumeText } from "@/components/sim/VolumeText";

const c = colors.light;

const ASSETS = {
  bg: require("../assets/figmaAssets/soccer-field.png"),
  fifa: require("../assets/figmaAssets/rectangle-38.png"),
  spain: require("../assets/figmaAssets/spain-flag.png"),
  england: require("../assets/figmaAssets/england-flag.png"),
};

export function LiveSoccerCard() {
  const router = useRouter();
  const [spainAnim, drawAnim, englandAnim] = useLiveOdds([30, 15, 55]);
  const spainScore = useLiveScore(0, { intervalMs: 25000, chance: 0.18 });
  const englandScore = useLiveScore(1, { intervalMs: 25000, chance: 0.18 });
  const pctToWidth = (a: Animated.Value) =>
    a.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });
  const goToMatch = () => {
    router.push({
      pathname: "/match",
      params: {
        home: "Spain",
        away: "England",
        homeInitial: "SPA",
        awayInitial: "ENG",
        homeFlag: "https://flagcdn.com/w80/es.png",
        awayFlag: "https://flagcdn.com/w80/gb-eng.png",
        homeColor: c.bitcoin,
        awayColor: "#ff5c6c",
        homePct: "30",
        awayPct: "55",
        league: "FIFA World Cup",
        mins: "75'",
        vol: "$1.5m Vol",
      },
    });
  };
  return (
    <Pressable onPress={goToMatch} style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}>
    <View style={styles.card}>
      <ImageBackground
        source={ASSETS.bg}
        style={styles.hero}
        imageStyle={{ width: "100%", height: "100%", resizeMode: "cover", borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
      >
        <View style={styles.overlay} />
        <View style={styles.heroContent}>
          <View style={{ alignItems: "center", gap: 6 }}>
            <Image source={ASSETS.fifa} style={{ width: 28, height: 28, borderRadius: 6 }} />
            <Text style={styles.league}>FIFA World Cup 2026</Text>
          </View>
          <View style={styles.scoreRow}>
            <View style={styles.side}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Image source={ASSETS.spain} style={styles.flag} resizeMode="cover" />
                <Text style={styles.score}>{spainScore}</Text>
              </View>
              <Text style={styles.team}>Spain</Text>
            </View>
            <View style={styles.center}>
              <Text style={[styles.live, { color: c.liveYellow }]}>Live</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <PulsingDot size={6} />
                <Text style={[styles.live, { color: c.liveYellow }]}>
                  {`75' · ${periodLabel("FIFA World Cup", "75") ?? ""}`.trim()}
                </Text>
              </View>
            </View>
            <View style={[styles.side, { alignItems: "flex-end" }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text style={styles.score}>{englandScore}</Text>
                <Image source={ASSETS.england} style={styles.flag} resizeMode="cover" />
              </View>
              <Text style={styles.team}>England</Text>
            </View>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.bottom}>
        <View style={styles.barBlock}>
          <View style={styles.barOuter}>
            <Animated.View style={[styles.barSeg, { width: pctToWidth(spainAnim), backgroundColor: c.spainRed }]} />
            <Animated.View style={[styles.barSeg, { width: pctToWidth(drawAnim), backgroundColor: c.surface2 }]} />
            <Animated.View style={[styles.barSeg, { width: pctToWidth(englandAnim), backgroundColor: "#fff" }]} />
          </View>
          <View style={styles.labelRow}>
            <SlotPct anim={spainAnim} prefix="Spain " style={[styles.label, { color: c.spainRed }]} />
            <SlotPct anim={drawAnim} prefix="Draw " style={[styles.label, { color: "#e8eaee" }]} />
            <SlotPct anim={englandAnim} prefix="England " style={[styles.label, { color: "#fff" }]} />
          </View>
        </View>

        <View style={styles.btnRow}>
          <Pressable style={[styles.btn, { backgroundColor: c.spainRed }]}>
            <Text style={[styles.btnText, { color: c.spainYellow }]}>Spain</Text>
          </Pressable>
          <Pressable style={[styles.btn, { backgroundColor: c.surface2 }]}>
            <Text style={[styles.btnText, { color: "#fff" }]}>Draw</Text>
          </Pressable>
          <Pressable style={[styles.btn, { backgroundColor: "#fff" }]}>
            <Text style={[styles.btnText, { color: c.spainRed }]}>England</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <View style={styles.footerItem}>
              <Feather name="briefcase" size={12} color={c.textMuted} />
              <VolumeText style={styles.footerText}>$1.5m Vol.</VolumeText>
            </View>
            <View style={styles.footerItem}>
              <Feather name="clock" size={12} color={c.textMuted} />
              <Text style={styles.footerText}>3:30 EST, 11 June 2026</Text>
            </View>
          </View>
          <Text style={styles.footerText}>+40 outcomes</Text>
        </View>
      </View>
    </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    height: 360,
    backgroundColor: c.surface,
    borderRadius: 16,
    overflow: "hidden",
  },
  hero: { height: 196, justifyContent: "center" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.30)" },
  heroContent: { paddingHorizontal: 16, paddingVertical: 16, gap: 14, alignItems: "stretch" },
  bottom: { flex: 1, paddingTop: 14, paddingBottom: 14, justifyContent: "space-between" },
  barBlock: { paddingHorizontal: 12 },
  league: { color: "#fff", fontFamily: geist.medium, fontSize: 16, textAlign: "center" },
  scoreRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  side: { gap: 8, alignItems: "flex-start" },
  center: { alignItems: "center", gap: 4, paddingHorizontal: 8 },
  score: { color: "#fff", fontFamily: geist.semibold, fontSize: 32 },
  live: { fontFamily: geist.medium, fontSize: 14 },
  flag: { width: 40, height: 40, borderRadius: 8 },
  team: { color: "#fff", fontFamily: geist.medium, fontSize: 14 },
  barOuter: {
    flexDirection: "row",
    height: 8,
    backgroundColor: c.surface2,
    borderRadius: 12,
    overflow: "hidden",
    gap: 2,
  },
  barSeg: { height: 8 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 6 },
  label: { fontFamily: geist.medium, fontSize: 13 },
  btnRow: { flexDirection: "row", gap: 8, paddingHorizontal: 12 },
  btn: { flex: 1, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  btnText: { fontFamily: geist.semibold, fontSize: 16 },
  footer: { flexDirection: "row", paddingHorizontal: 12, alignItems: "center", justifyContent: "space-between" },
  footerLeft: { flexDirection: "row", gap: 16 },
  footerItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  footerText: { color: c.textMuted, fontFamily: geist.medium, fontSize: 12 },
});
