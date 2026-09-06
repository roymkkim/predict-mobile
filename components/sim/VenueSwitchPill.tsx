import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { colors } from "@/lib/sim/colors";
import { geist } from "@/lib/sim/geistFonts";
import { useRegion, type Region } from "@/lib/sim/regionStore";

// Port of MetaMask Mobile PerpsModeSwitchPill (Lite ⇄ Pro header badge).
// Tap opens the switch sheet. After Switch, the line sweeps in the destination
// venue color (Kalshi #00DD94 / Polymarket #2E5CFF).

export const GLOW_TOTAL_MS = 750;
const GLOW_SWEEP_MS = 700;
const GLOW_FADE_MS = 120;
const GLOW_HOLD_MS = GLOW_TOTAL_MS - GLOW_FADE_MS * 2;
const BORDER_WIDTH = 1.5;
const BORDER_RADIUS = 8;

const SHIMMER_START = { x: 0, y: 0.37 };
const SHIMMER_END = { x: 1, y: 0.63 };

const KALSHI_LABEL_COLOR = "#00DD94";
const POLYMARKET_LABEL_COLOR = "#2E5CFF";
const POLYMARKET_PILL_BG = "#090E17";
const BORDER_COLOR = "#858b9a33";

const VENUE_LABEL: Record<Region, string> = {
  kalshi: "Kalshi",
  polymarket: "Polymarket",
};

export function VenueSwitchPill({
  onSwitchRequest,
}: {
  onSwitchRequest: () => void;
}) {
  const region = useRegion();
  const label = VENUE_LABEL[region];
  const labelColor = region === "polymarket" ? POLYMARKET_LABEL_COLOR : KALSHI_LABEL_COLOR;
  const pillBg = region === "polymarket" ? POLYMARKET_PILL_BG : colors.bg;
  const [width, setWidth] = useState(0);
  const [isShimmering, setIsShimmering] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevRegion = useRef<Region | null>(null);
  const sweepProgress = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);

  const playShimmer = useCallback(() => {
    if (timerRef.current) return;
    setIsShimmering(true);
    sweepProgress.value = 0;
    overlayOpacity.value = 0;
    sweepProgress.value = withTiming(1, {
      duration: GLOW_SWEEP_MS,
      easing: Easing.inOut(Easing.ease),
    });
    overlayOpacity.value = withSequence(
      withTiming(1, { duration: GLOW_FADE_MS }),
      withDelay(GLOW_HOLD_MS, withTiming(0, { duration: GLOW_FADE_MS })),
    );
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setIsShimmering(false);
    }, GLOW_TOTAL_MS);
  }, [overlayOpacity, sweepProgress]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  // Shimmer after Switch confirms a venue change, in the destination color —
  // not on the opening tap. Skip the first mount so Kalshi doesn't flash on load.
  useEffect(() => {
    const prev = prevRegion.current;
    prevRegion.current = region;
    if (prev != null && prev !== region) playShimmer();
  }, [playShimmer, region]);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(sweepProgress.value, [0, 1], [-2 * width, 0]) }],
  }));
  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));

  const labelStyle = [styles.label, { color: labelColor }];

  return (
    <View
      style={styles.wrap}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <Pressable
        onPress={onSwitchRequest}
        disabled={isShimmering}
        accessibilityRole="button"
        accessibilityLabel={`Currently ${label}`}
        accessibilityHint={`Switches to ${region === "kalshi" ? "Polymarket" : "Kalshi"}`}
        style={({ pressed }) => [
          styles.pill,
          { backgroundColor: pillBg },
          pressed && !isShimmering ? styles.pressed : null,
        ]}
      >
        <Text style={labelStyle}>{label}</Text>
      </Pressable>

      {isShimmering && width > 0 ? (
        <Animated.View pointerEvents="none" style={[styles.overlay, overlayStyle]}>
          <Animated.View style={[styles.sweep, { width: width * 3 }, sweepStyle]}>
            <LinearGradient
              colors={["transparent", labelColor, labelColor, "transparent"]}
              locations={[0.3, 0.45, 0.55, 0.7]}
              start={SHIMMER_START}
              end={SHIMMER_END}
              style={{ flex: 1 }}
            />
          </Animated.View>
          <View
            style={{
              position: "absolute",
              top: BORDER_WIDTH,
              right: BORDER_WIDTH,
              bottom: BORDER_WIDTH,
              left: BORDER_WIDTH,
              borderRadius: BORDER_RADIUS - BORDER_WIDTH,
              backgroundColor: pillBg,
            }}
          />
          <View style={styles.labelOverlay}>
            <Text style={labelStyle}>{label}</Text>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    height: 32,
  },
  pill: {
    height: 32,
    borderRadius: BORDER_RADIUS,
    borderWidth: BORDER_WIDTH,
    borderColor: BORDER_COLOR,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    borderRadius: BORDER_RADIUS,
  },
  sweep: {
    position: "absolute",
    top: 0,
    bottom: 0,
  },
  labelOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: geist.medium,
    fontSize: 14,
    lineHeight: 22,
  },
});
