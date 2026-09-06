import React, { useEffect, useState } from "react";
import { Animated, StyleProp, Text, TextStyle } from "react-native";

export function AnimatedPct({
  anim,
  prefix = "",
  suffix = "%",
  style,
  numberOfLines,
}: {
  anim: Animated.Value;
  prefix?: string;
  suffix?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const initial = Math.round(
    (anim as unknown as { _value?: number })._value ?? 0,
  );
  const [n, setN] = useState<number>(initial);
  useEffect(() => {
    let last = initial;
    const id = anim.addListener(({ value }) => {
      const rounded = Math.round(value);
      if (rounded !== last) {
        last = rounded;
        setN(rounded);
      }
    });
    return () => anim.removeListener(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anim]);
  return (
    <Text style={style} numberOfLines={numberOfLines}>{`${prefix}${n}${suffix}`}</Text>
  );
}
