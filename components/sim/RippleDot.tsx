import React from "react";
import { Animated, View } from "react-native";

// Live end-of-line chart dot with an expanding ripple ring (Panthers
// game-detail standard). Shared by game-detail and match-detail charts.
export const DOT = 12;

export function RippleDot({ color, size, active }: { color: string; size: number; active: boolean }) {
  const t = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 1600, useNativeDriver: false }),
        Animated.timing(t, { toValue: 0, duration: 0, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, t]);
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {active && (
        <Animated.View
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 1.5,
            borderColor: color,
            opacity: t.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.55, 0] }),
            transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 3.2] }) }],
          }}
        />
      )}
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </View>
  );
}
