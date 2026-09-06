import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleProp, StyleSheet, Text, TextStyle, View } from "react-native";

const REEL_LENGTH = 200;

function Digit({
  value,
  color,
  fontSize,
  lineHeight,
  fontFamily,
}: {
  value: number;
  color?: string;
  fontSize: number;
  lineHeight: number;
  fontFamily?: string;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const indexRef = useRef(0);

  useEffect(() => {
    const current = indexRef.current % 10;
    const delta = (value - current + 10) % 10;
    if (delta === 0) return;
    if (indexRef.current + delta >= REEL_LENGTH) {
      indexRef.current = current;
      anim.setValue(-current * lineHeight);
    }
    indexRef.current += delta;
    Animated.timing(anim, {
      toValue: -indexRef.current * lineHeight,
      duration: 350,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [value, anim, lineHeight]);

  const width = Math.ceil(fontSize * 0.7);
  return (
    <View style={{ height: lineHeight, width, overflow: "hidden" }}>
      <Animated.View style={{ transform: [{ translateY: anim }] }}>
        {Array.from({ length: REEL_LENGTH }).map((_, i) => (
          <Text
            key={i}
            style={{
              color,
              fontFamily,
              fontSize,
              lineHeight,
              height: lineHeight,
              textAlign: "center",
            }}
          >
            {i % 10}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

export function SlotPct({
  anim,
  prefix,
  suffix = "%",
  style,
}: {
  anim: Animated.Value;
  prefix?: string;
  suffix?: string;
  style?: StyleProp<TextStyle>;
}) {
  const flat = (StyleSheet.flatten(style) || {}) as TextStyle;
  const color = flat.color as string | undefined;
  const fontFamily = flat.fontFamily as string | undefined;
  const fontSize = (flat.fontSize as number | undefined) ?? 14;
  const lineHeight = (flat.lineHeight as number | undefined) ?? Math.round(fontSize * 1.4);

  const initial = (anim as unknown as { _value?: number })._value ?? 0;
  const [n, setN] = useState<number>(Math.round(initial));
  useEffect(() => {
    const id = anim.addListener(({ value }) => setN(Math.round(value)));
    return () => anim.removeListener(id);
  }, [anim]);
  const clamped = Math.max(0, Math.min(99, n));
  const tens = Math.floor(clamped / 10);
  const ones = clamped % 10;

  const textStyle: TextStyle = { color, fontFamily, fontSize, lineHeight };
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {prefix ? <Text style={textStyle}>{prefix}</Text> : null}
      <Digit value={tens} color={color} fontSize={fontSize} lineHeight={lineHeight} fontFamily={fontFamily} />
      <Digit value={ones} color={color} fontSize={fontSize} lineHeight={lineHeight} fontFamily={fontFamily} />
      <Text style={textStyle}>{suffix}</Text>
    </View>
  );
}
