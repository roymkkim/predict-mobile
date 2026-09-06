import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { WorldCupBracketBrowser } from "@/components/sim/WorldCupBracketBrowser";
import colors from "@/constants/colors";
import { screenTopInset } from "@/lib/sim/layout";
import { geist } from "@/lib/sim/geistFonts";

const c = colors.light;

/**
 * Full-screen World Cup knockout bracket browser. A thin wrapper that adds the
 * close / trophy / title header and a full-height pager; the swipeable bracket
 * itself lives in `WorldCupBracketBrowser` (shared with the inline page
 * section). Dark app palette to match the rest of Predict.
 */
export default function WorldCupBracket() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const topInset = screenTopInset(insets.top);

  // Header (close row + title) + the browser's own labels/control sit above the
  // pager; give the pager the remaining screen height.
  const pagerHeight = Math.max(320, winH - topInset - insets.bottom - 232);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Header */}
      <View style={{ paddingTop: topInset + 8, paddingHorizontal: 14 }}>
        <View style={styles.topRow}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/worldcup"))}
            style={styles.closeBtn}
            hitSlop={10}
          >
            <Feather name="x" size={20} color="#ffffff" />
          </Pressable>
          <MaterialCommunityIcons name="trophy" size={26} color="#f7c948" />
          <View style={{ width: 36 }} />
        </View>
        <Text style={styles.title}>FIFA World Cup 2026</Text>
      </View>

      <View style={{ paddingHorizontal: 14 }}>
        <WorldCupBracketBrowser pagerHeight={pagerHeight} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  title: {
    fontFamily: geist.bold,
    fontSize: 20,
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 14,
  },
});
