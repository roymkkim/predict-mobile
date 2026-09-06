import React, { type ReactNode } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { BackIcon } from "@/components/PageHeader";
import { colors } from "@/lib/sim/colors";
import { useThemeMode } from "@/lib/sim/dsModeStore";

export const MARKET_DETAIL_NAV_H = 64;
export const MARKET_DETAIL_COLLAPSE_RANGE = 64;

type MarketDetailHeaderProps = {
  scrollY: Animated.Value;
  topInset: number;
  expandedContent: ReactNode;
  collapsedContent: ReactNode;
  onBack: () => void;
  navHeight?: number;
};

/**
 * Shared detail-page chrome: the back/share row stays fixed while the
 * expanded title/status fades into a compact, scroll-state-specific header.
 * Sport pages provide the center content so their score vocabulary stays
 * independent from the navigation behavior.
 */
export function MarketDetailHeader({
  scrollY,
  topInset,
  expandedContent,
  collapsedContent,
  onBack,
  navHeight = MARKET_DETAIL_NAV_H,
}: MarketDetailHeaderProps) {
  useThemeMode();
  const expandedOpacity = scrollY.interpolate({
    inputRange: [0, MARKET_DETAIL_COLLAPSE_RANGE * 0.55],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const collapsedOpacity = scrollY.interpolate({
    inputRange: [MARKET_DETAIL_COLLAPSE_RANGE * 0.5, MARKET_DETAIL_COLLAPSE_RANGE],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={[styles.header, { paddingTop: topInset, height: topInset + navHeight, backgroundColor: colors.bg }]}>
      <Pressable onPress={onBack} hitSlop={12} style={styles.iconBtn}>
        <BackIcon />
      </Pressable>

      <Animated.View style={[styles.headerCenter, { top: topInset, height: navHeight, opacity: expandedOpacity }]} pointerEvents="none">
        {expandedContent}
      </Animated.View>

      <Animated.View style={[styles.headerCenter, { top: topInset, height: navHeight, opacity: collapsedOpacity }]} pointerEvents="none">
        {collapsedContent}
      </Animated.View>

      <Pressable hitSlop={12} style={styles.iconBtn}>
        <MaterialIcons name="ios-share" size={20} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  iconBtn: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  headerCenter: {
    position: "absolute",
    left: 56,
    right: 56,
    alignItems: "center",
    justifyContent: "center",
  },
});