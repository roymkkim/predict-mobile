import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export const BRAND_BLUE = "#73A6FF";
export const BRAND_LIME = "#B9F302";
export const BRAND_ON_GRADIENT = "#131416";
// Wide plateaus of each hue, short blends. The tile is several viewports
// wide so the clip only ever shows a soft wash, not a full stripe cycle.
const LOCS = [0, 0.34, 0.5, 0.84, 1] as const;
const TILE_SCALE = 3.2;
export const AMBIENT_BRAND_CYCLE_MS = 5600;
const CYCLE_MS = AMBIENT_BRAND_CYCLE_MS;

const fill = {
  position: "absolute" as const,
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
};

function blurPxFor(w: number, h: number) {
  const span = Math.min(Math.max(w, 1), Math.max(h, 1));
  return Math.round(Math.max(28, Math.min(span * 0.55, 96)));
}

/** Slow two-hue wash. A static base layer covers the clip so the loop never flashes black. */
export function AmbientBrandGradient({
  style,
  from = BRAND_BLUE,
  to = BRAND_LIME,
}: {
  style?: StyleProp<ViewStyle>;
  from?: string;
  to?: string;
}) {
  const shift = useRef(new Animated.Value(0)).current;
  const [w, setW] = useState(0);
  const [h, setH] = useState(0);
  const tileColors = [from, from, to, to, from] as const;

  useEffect(() => {
    shift.setValue(0);
    const loop = Animated.loop(
      Animated.timing(shift, {
        toValue: 1,
        duration: CYCLE_MS,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [shift]);

  const tile = Math.max(1, w) * TILE_SCALE;
  const blur = blurPxFor(w, h);
  const pad = blur * 2;
  const shiftX = shift.interpolate({
    inputRange: [0, 1],
    outputRange: [-tile, 0],
  });

  return (
    <View
      pointerEvents="none"
      onLayout={(e) => {
        setW(e.nativeEvent.layout.width);
        setH(e.nativeEvent.layout.height);
      }}
      style={[{ overflow: "hidden" }, style]}
    >
      <LinearGradient colors={[from, to]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={fill} />
      {w > 0 && h > 0 ? (
        <Animated.View
          style={{
            position: "absolute",
            top: -pad,
            left: -pad,
            width: tile * 2 + pad * 2,
            height: h + pad * 2,
            transform: [{ translateX: shiftX }],
            ...(Platform.OS === "web" ? ({ filter: `blur(${blur}px)` } as ViewStyle) : null),
          }}
        >
          <LinearGradient
            colors={[...tileColors]}
            locations={[...LOCS]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ position: "absolute", left: pad, top: 0, width: tile, height: h + pad * 2 }}
          />
          <LinearGradient
            colors={[...tileColors]}
            locations={[...LOCS]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ position: "absolute", left: pad + tile, top: 0, width: tile, height: h + pad * 2 }}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}
