import type { ComponentType, ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Animated, Easing, Text, type StyleProp, type TextStyle, View } from "react-native";
import { geist } from "@/lib/sim/geistFonts";

// Casino slot-reel rendering of a live percentage. Each digit is its own
// vertical reel (a 0-9 strip clipped to a one-line window); when the value
// changes the reel rolls to the new digit with a slight overshoot. RN port of
// the web SlotNumber (em reels -> px-height Animated.translateY reels).
const ROLL_MS = 540;
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export type SlotTextComponent = ComponentType<{
  children: string;
  style?: StyleProp<TextStyle>;
}>;

function SlotChar({
  children,
  style,
  TextComponent,
}: {
  children: string;
  style: TextStyle;
  TextComponent?: SlotTextComponent;
}): ReactNode {
  if (TextComponent) return <TextComponent style={style}>{children}</TextComponent>;
  return <Text style={style}>{children}</Text>;
}

function Reel({
  digit,
  delayMs,
  h,
  textStyle,
  TextComponent,
}: {
  digit: number;
  delayMs: number;
  h: number;
  textStyle: TextStyle;
  TextComponent?: SlotTextComponent;
}) {
  const anim = useRef(new Animated.Value(digit)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: digit,
      duration: ROLL_MS,
      delay: delayMs,
      easing: Easing.bezier(0.18, 0.89, 0.32, 1.13),
      useNativeDriver: true,
    }).start();
  }, [digit, delayMs, anim]);
  const translateY = anim.interpolate({ inputRange: [0, 9], outputRange: [0, -9 * h] });
  return (
    <View style={{ height: h, overflow: "hidden" }}>
      <Animated.View style={{ transform: [{ translateY }] }}>
        {DIGITS.map((n) => (
          <SlotChar key={n} style={{ ...textStyle, height: h, lineHeight: h, textAlign: "center" }} TextComponent={TextComponent}>
            {String(n)}
          </SlotChar>
        ))}
      </Animated.View>
    </View>
  );
}

export function SlotNumber({
  value,
  prefix,
  suffix = "%",
  color,
  fontSize = 14,
  fontFamily = geist.medium,
  decimals = 0,
  lineHeight,
  TextComponent,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  /** Tenths (1) for payout multiples like `1337.4`. Integer path stays rounded. */
  decimals?: number;
  lineHeight?: number;
  /** Selected combo labels paint through ComboGradientText instead of a solid fill. */
  TextComponent?: SlotTextComponent;
}) {
  const chars =
    decimals > 0
      ? Math.max(0, value).toFixed(decimals).split("")
      : String(Math.max(0, Math.round(value))).split("");
  const h = lineHeight ?? Math.ceil(fontSize * 1.25);
  const textStyle: TextStyle = { color, fontSize, fontFamily, includeFontPadding: false };
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {prefix ? (
        <SlotChar style={textStyle} TextComponent={TextComponent}>
          {prefix}
        </SlotChar>
      ) : null}
      {chars.map((ch, i) =>
        ch === "." ? (
          <SlotChar key="dot" style={{ ...textStyle, height: h, lineHeight: h }} TextComponent={TextComponent}>
            .
          </SlotChar>
        ) : (
          <Reel
            key={`${chars.length - i}`}
            digit={Number(ch)}
            delayMs={i * 70}
            h={h}
            textStyle={textStyle}
            TextComponent={TextComponent}
          />
        ),
      )}
      {suffix ? (
        <SlotChar style={textStyle} TextComponent={TextComponent}>
          {suffix}
        </SlotChar>
      ) : null}
    </View>
  );
}
