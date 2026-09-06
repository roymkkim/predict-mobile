import type { CSSProperties, ReactNode } from "react";
import { createElement, useEffect, useId, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Rect, Stop } from "react-native-svg";

import { AmbientBrandGradient, AMBIENT_BRAND_CYCLE_MS, BRAND_BLUE, BRAND_LIME } from "@/components/sim/AmbientBrandGradient";
import { SlotNumber } from "@/components/sim/SlotNumber";
import { comboOutcomeVisual, METAMASK_BUTTON_RADIUS } from "@/lib/sim/buttonStyle";
import { useBetRadius } from "@/lib/sim/pillButtonsStore";
import { COMBO_BRAND_FLAT, useComboBrandStyle } from "@/lib/sim/comboBrandStore";
import { colors, ON_SURFACE_BUTTON_BG } from "@/lib/sim/colors";
import { geist } from "@/lib/sim/geistFonts";

// Blue → lime: #73A6FF bottom-left to #B9F302 top-right.
export const COMBO_GRADIENT_COLORS = [BRAND_BLUE, BRAND_LIME] as const;
export const COMBO_GRADIENT_START = { x: 0, y: 1 };
export const COMBO_GRADIENT_END = { x: 1, y: 0 };
export const COMBO_GRADIENT_BORDER = 0.5;
export const COMBO_SHEET_GRADIENT_BORDER = 0.5;
export const COMBO_GRADIENT_CYCLE_MS = 2800;

const [BLUE, LIME] = COMBO_GRADIENT_COLORS;
/** Selected combo label wash — #73A6FF → #B9F302, bottom-left to top-right. */
export const COMBO_TEXT_WASH = `linear-gradient(to top right, ${BLUE}, ${LIME})`;
const GRADIENT_ORIGIN = Date.now();

function comboShiftNow(): number {
  return ((Date.now() - GRADIENT_ORIGIN) % COMBO_GRADIENT_CYCLE_MS) / COMBO_GRADIENT_CYCLE_MS;
}

/** Same diagonal sweep as the header combo mark — shared clock so every combo gradient stays in phase. */
export function useComboGradientShift(enabled: boolean): number {
  const [shift, setShift] = useState(() => (enabled ? comboShiftNow() : 0));
  useEffect(() => {
    if (!enabled) {
      setShift(0);
      return;
    }
    let raf = 0;
    const tick = () => {
      setShift(comboShiftNow());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);
  return shift;
}

const COMBO_WASH = {
  position: "absolute" as const,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

export function ComboGradientFill({
  style,
  children,
  animate = false,
}: {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  animate?: boolean;
}) {
  const flat = useComboBrandStyle() === "flat";
  if (flat) {
    return <View style={[{ backgroundColor: COMBO_BRAND_FLAT, overflow: "hidden" }, style]}>{children}</View>;
  }
  if (!animate) {
    return (
      <LinearGradient colors={[...COMBO_GRADIENT_COLORS]} start={COMBO_GRADIENT_START} end={COMBO_GRADIENT_END} style={style}>
        {children}
      </LinearGradient>
    );
  }
  return (
    <View style={[{ overflow: "hidden" }, style]}>
      <AmbientBrandGradient from={BLUE} to={LIME} style={COMBO_WASH} />
      {children}
    </View>
  );
}

export function ComboGradientRing({
  children,
  radius,
  width = COMBO_GRADIENT_BORDER,
  sides = "all",
  style,
  innerStyle,
  animate = false,
}: {
  children?: ReactNode;
  radius: number | { topLeft?: number; topRight?: number; bottomLeft?: number; bottomRight?: number };
  width?: number;
  sides?: "all" | "top";
  style?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
  animate?: boolean;
}) {
  const outerRadius = typeof radius === "number"
    ? { borderRadius: radius }
    : {
        borderTopLeftRadius: radius.topLeft,
        borderTopRightRadius: radius.topRight,
        borderBottomLeftRadius: radius.bottomLeft,
        borderBottomRightRadius: radius.bottomRight,
      };
  const innerRadius = typeof radius === "number"
    ? { borderRadius: Math.max(0, radius - width) }
    : {
        borderTopLeftRadius: radius.topLeft != null ? Math.max(0, radius.topLeft - width) : undefined,
        borderTopRightRadius: radius.topRight != null ? Math.max(0, radius.topRight - width) : undefined,
        borderBottomLeftRadius: radius.bottomLeft != null ? Math.max(0, radius.bottomLeft - width) : undefined,
        borderBottomRightRadius: radius.bottomRight != null ? Math.max(0, radius.bottomRight - width) : undefined,
      };
  const topOnly = sides === "top";
  const flat = useComboBrandStyle() === "flat";
  return (
    <View style={[outerRadius, { overflow: "hidden", position: "relative" }, style]}>
      {flat ? (
        <View pointerEvents="none" style={[COMBO_WASH, { backgroundColor: COMBO_BRAND_FLAT }]} />
      ) : (
      <LinearGradient
        pointerEvents="none"
        colors={[...COMBO_GRADIENT_COLORS]}
        start={COMBO_GRADIENT_START}
        end={COMBO_GRADIENT_END}
        style={COMBO_WASH}
      />
      )}
      {/* Absolute inset plate — fills the capsule so only a hairline of gradient shows. */}
      <View
        style={[
          innerRadius,
          {
            position: "absolute",
            top: width,
            left: width,
            right: width,
            bottom: topOnly ? 0 : width,
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            backgroundColor: MUTED_OPAQUE,
            zIndex: 1,
          },
          innerStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const AMBIENT_TEXT_KEYFRAMES = "comboAmbientTextWash";
const AMBIENT_TEXT_STYLE_ID = "combo-ambient-text-wash-v4";
// Two identical cycles. Each cycle is 4× the glyph row (background-size 800%),
// so the clip shows one hue plateau — never blue and lime bands at once.
const AMBIENT_TEXT_SIZE = "800% 100%";
// 0%→50% of the image = one cycle. Shift by one cycle using the % position
// formula: travel = p × (sizeRatio − 1). p = 4/7 so travel = 4× text = one tile.
const AMBIENT_TEXT_SHIFT_TO = "57.142857%";
const AMBIENT_MID = "#8ECB80";
const AMBIENT_TEXT_TILE =
  `${BLUE} 0%, ${BLUE} 8%, ${AMBIENT_MID} 16%, ${LIME} 25%, ${LIME} 33%, ${AMBIENT_MID} 41%, ${BLUE} 50%, ` +
  `${BLUE} 50%, ${BLUE} 58%, ${AMBIENT_MID} 66%, ${LIME} 75%, ${LIME} 83%, ${AMBIENT_MID} 91%, ${BLUE} 100%`;

function ensureAmbientTextKeyframes() {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  if (document.getElementById(AMBIENT_TEXT_STYLE_ID)) return;
  document.getElementById("combo-ambient-text-wash")?.remove();
  document.getElementById("combo-ambient-text-wash-v2")?.remove();
  document.getElementById("combo-ambient-text-wash-v3")?.remove();
  const el = document.createElement("style");
  el.id = AMBIENT_TEXT_STYLE_ID;
  // Image moves right → wash reads left-to-right (blue enters left). Horizontal only.
  el.textContent = `@keyframes ${AMBIENT_TEXT_KEYFRAMES} {
    from { background-position: ${AMBIENT_TEXT_SHIFT_TO} 50%; }
    to { background-position: 0% 50%; }
  }`;
  document.head.appendChild(el);
}

export function ComboGradientText({
  children,
  style,
  animate = false,
  numberOfLines,
}: {
  children: string;
  style?: StyleProp<TextStyle>;
  animate?: boolean;
  numberOfLines?: number;
}) {
  const brandFlat = useComboBrandStyle() === "flat";
  if (Platform.OS === "web") {
    if (animate) ensureAmbientTextKeyframes();
    const flat = StyleSheet.flatten(style) as CSSProperties | undefined;
    const clip = numberOfLines === 1;
    const lh = flat?.lineHeight;
    const fs = flat?.fontSize;
    return createElement("span", {
      style: {
        ...flat,
        display: "inline-block",
        maxWidth: "100%",
        flexGrow: 0,
        flexShrink: clip ? 1 : 0,
        height: typeof flat?.height === "number" ? `${flat.height}px` : flat?.height ?? "auto",
        fontSize: typeof fs === "number" ? `${fs}px` : fs,
        lineHeight: typeof lh === "number" ? `${lh}px` : typeof lh === "string" ? lh : "20px",
        transform: "none",
        ...(brandFlat
          ? {
              backgroundImage: "none",
              color: COMBO_BRAND_FLAT,
              WebkitTextFillColor: COMBO_BRAND_FLAT,
            }
          : {
              backgroundImage: animate
                ? `linear-gradient(90deg, ${AMBIENT_TEXT_TILE})`
                : COMBO_TEXT_WASH,
              backgroundSize: animate ? AMBIENT_TEXT_SIZE : "100% 100%",
              backgroundRepeat: "repeat-x",
              backgroundPosition: animate ? `${AMBIENT_TEXT_SHIFT_TO} 50%` : "0% 100%",
              animation: animate
                ? `${AMBIENT_TEXT_KEYFRAMES} ${AMBIENT_BRAND_CYCLE_MS}ms linear infinite`
                : "none",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
            }),
        ...(clip
          ? { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }
          : null),
      } satisfies CSSProperties,
    }, children);
  }
  return (
    <Text numberOfLines={numberOfLines} style={[style, { color: brandFlat ? COMBO_BRAND_FLAT : animate ? LIME : BLUE }]}>
      {children}
    </Text>
  );
}

export const COMBO_OUTLINE_WIDTH = 1;

/**
 * 1px blue→lime ring as the outermost edge. Fill lives inside the stroke so
 * the surface color never paints a halo outside the gradient.
 */
export function ComboOuterGradientStroke({
  radius,
  width = COMBO_OUTLINE_WIDTH,
  matchParentRadius = false,
}: {
  radius: number;
  width?: number;
  /** Follow the morphing sheet's corner radii (close: ring on the shrinking surface). */
  matchParentRadius?: boolean;
}) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const id = `combo-outer${useId().replace(/:/g, "")}`;
  const inset = width / 2;
  const flat = useComboBrandStyle() === "flat";
  if (Platform.OS === "web") {
    return createElement("div", {
      "aria-hidden": true,
      style: {
        position: "absolute",
        inset: 0,
        zIndex: 3,
        borderRadius: matchParentRadius ? "inherit" : radius,
        pointerEvents: "none",
        boxSizing: "border-box",
        overflow: "visible",
        padding: width,
        backgroundImage: flat ? "none" : `linear-gradient(to top right, ${BLUE}, ${LIME})`,
        backgroundColor: flat ? COMBO_BRAND_FLAT : "transparent",
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        maskComposite: "exclude",
      } satisfies CSSProperties,
    });
  }
  return (
    <View
      pointerEvents="none"
      onLayout={(e) => {
        const { width: w, height: h } = e.nativeEvent.layout;
        setBox({ w, h });
      }}
      style={[StyleSheet.absoluteFillObject, { zIndex: 3, overflow: "visible" }]}
    >
      {box.w > 0 && box.h > 0 ? (
        <Svg width={box.w} height={box.h} style={{ overflow: "visible" }}>
          <Defs>
            <SvgLinearGradient id={id} x1="0" y1="1" x2="1" y2="0">
              <Stop offset="0" stopColor={BLUE} />
              <Stop offset="1" stopColor={LIME} />
            </SvgLinearGradient>
          </Defs>
          <Rect
            x={inset}
            y={inset}
            width={Math.max(0, box.w - width)}
            height={Math.max(0, box.h - width)}
            rx={Math.max(0, radius - inset)}
            ry={Math.max(0, radius - inset)}
            fill="none"
            stroke={flat ? COMBO_BRAND_FLAT : `url(#${id})`}
            strokeWidth={width}
          />
        </Svg>
      ) : null}
    </View>
  );
}
/** Opaque stand-in for ON_SURFACE_BUTTON_BG over page black — a translucent
 *  plate over the ring wash would let the gradient read as a filled pill. */
const MUTED_OPAQUE = colors.surface2;

/** Soft outer halo for the Build a Combo CTA — not a 1px promotional stroke.
 *  `bloom` is HeaderComboMark only; CTA values stay off that oval. */
export function ComboGradientGlow({
  radius = 0,
  bloom = false,
  children,
}: {
  radius?: number;
  /** Drop-shadow of the glyph (header ComboMark). Never a filled rounded plate. */
  bloom?: boolean;
  children?: ReactNode;
}) {
  if (Platform.OS === "web") {
    if (bloom) {
      // Halo around the 20px glyph only. A filled 40×40 radial sits in the ¢ hole.
      return createElement("div", {
        "aria-hidden": true,
        style: {
          position: "absolute",
          top: "25%",
          left: "25%",
          width: "50%",
          height: "50%",
          zIndex: 0,
          pointerEvents: "none",
          overflow: "visible",
          background: "none",
          backgroundColor: "transparent",
          backgroundImage: "none",
          border: "none",
          borderRadius: "50%",
          boxShadow:
            "-2px 2px 10px rgba(115,166,255,0.5), 2px -2px 10px rgba(185,243,2,0.45)",
        } satisfies CSSProperties,
      });
    }
    return createElement("div", {
      "aria-hidden": true,
      style: {
        position: "absolute",
        inset: 0,
        zIndex: 0,
        borderRadius: radius,
        pointerEvents: "none",
        backgroundColor: "transparent",
        // Tight ambient wash: blue around the pill, lime as a top-right whisper.
        // Opacity ~35% above the faint pass — still soft, not a wide neon aura.
        boxShadow:
          "0 2px 8px rgba(115, 166, 255, 0.19), 0 -1px 6px rgba(185, 243, 2, 0.14), -2px -1px 5px rgba(115, 166, 255, 0.08)",
      } satisfies CSSProperties,
    });
  }
  if (bloom) {
    return (
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "visible",
          backgroundColor: "transparent",
          borderRadius: 20,
          shadowColor: BLUE,
          shadowOpacity: 0.38,
          shadowRadius: 8,
          shadowOffset: { width: -2, height: 2 },
        }}
      >
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "transparent",
            borderRadius: 20,
            shadowColor: LIME,
            shadowOpacity: 0.34,
            shadowRadius: 8,
            shadowOffset: { width: 2, height: -2 },
          }}
        />
      </View>
    );
  }
  return (
    <>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          borderRadius: radius,
          backgroundColor: "transparent",
          shadowColor: BLUE,
          shadowOpacity: 0.22,
          shadowRadius: 7,
          shadowOffset: { width: 0, height: 2 },
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          borderRadius: radius,
          backgroundColor: "transparent",
          shadowColor: LIME,
          shadowOpacity: 0.16,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: -1 },
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          borderRadius: radius,
          backgroundColor: "transparent",
          shadowColor: BLUE,
          shadowOpacity: 0.07,
          shadowRadius: 5,
          shadowOffset: { width: -2, height: -1 },
        }}
      />
    </>
  );
}

/** 1px diagonal outline only — transparent body so the card shows through. */
export function ComboGradientOutline({
  radius,
  width = COMBO_OUTLINE_WIDTH,
  fill = "transparent",
  matchParentRadius = false,
}: {
  radius: number;
  width?: number;
  /** Punch-out plate. Transparent so the card shows through; never a muted fill. */
  fill?: string;
  /** Follow the parent's animated corner radii (combo sheet morph). */
  matchParentRadius?: boolean;
}) {
  const flat = useComboBrandStyle() === "flat";
  // Native punch-out fills the interior; only the web mask is safe over sheet content.
  if (matchParentRadius && Platform.OS !== "web") {
    return null;
  }
  // CSS mask-XOR reads as a solid first-stop (#73A6FF) stroke on compact ¢
  // pills inside overflow:hidden market cards. SVG keeps the blue→lime ring.
  if (fill === "transparent" && !matchParentRadius) {
    return <NativeTransparentGradientRing radius={radius} width={width} />;
  }
  if (Platform.OS === "web") {
    const corners = matchParentRadius
      ? {
          borderTopLeftRadius: "inherit",
          borderTopRightRadius: "inherit",
          borderBottomLeftRadius: "inherit",
          borderBottomRightRadius: "inherit",
        }
      : { borderRadius: radius };
    // Dual-layer `padding-box transparent + border-box gradient` does NOT punch
    // out: the border-box layer still paints the whole rect. Mask XOR leaves
    // only the `width` px ring; the card shows through the hole.
    return createElement("div", {
      "aria-hidden": true,
      style: {
        position: "absolute",
        inset: 0,
        zIndex: matchParentRadius ? 4 : 1,
        ...corners,
        boxSizing: "border-box",
        padding: width,
        backgroundImage: flat ? "none" : `linear-gradient(to top right, ${BLUE}, ${LIME})`,
        backgroundColor: flat ? COMBO_BRAND_FLAT : "transparent",
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        maskComposite: "exclude",
        pointerEvents: "none",
      } satisfies CSSProperties,
    });
  }
  if (fill === "transparent") {
    return <NativeTransparentGradientRing radius={radius} width={width} />;
  }
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { borderRadius: radius, overflow: "hidden", zIndex: 1 }]}>
      <LinearGradient
        colors={[...COMBO_GRADIENT_COLORS]}
        start={COMBO_GRADIENT_START}
        end={COMBO_GRADIENT_END}
        style={COMBO_WASH}
      />
      <View
        style={{
          position: "absolute",
          top: width,
          left: width,
          right: width,
          bottom: width,
          borderRadius: Math.max(0, radius - width),
          backgroundColor: fill,
        }}
      />
    </View>
  );
}

function NativeTransparentGradientRing({ radius, width }: { radius: number; width: number }) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const id = `combo-stroke${useId().replace(/:/g, "")}`;
  const flat = useComboBrandStyle() === "flat";
  return (
    <View
      pointerEvents="none"
      onLayout={(e) => {
        const { width: w, height: h } = e.nativeEvent.layout;
        setBox({ w, h });
      }}
      style={[StyleSheet.absoluteFillObject, { zIndex: 1, overflow: "visible" }]}
    >
      {box.w > 0 && box.h > 0 ? (
        <Svg width={box.w} height={box.h}>
          <Defs>
            <SvgLinearGradient id={id} x1="0" y1="1" x2="1" y2="0">
              <Stop offset="0" stopColor={BLUE} />
              <Stop offset="1" stopColor={LIME} />
            </SvgLinearGradient>
          </Defs>
          <Rect
            x={width / 2}
            y={width / 2}
            width={Math.max(0, box.w - width)}
            height={Math.max(0, box.h - width)}
            rx={Math.max(0, radius - width / 2)}
            ry={Math.max(0, radius - width / 2)}
            fill="none"
            stroke={flat ? COMBO_BRAND_FLAT : `url(#${id})`}
            strokeWidth={width}
          />
        </Svg>
      ) : null}
    </View>
  );
}

/** Shared Add / Added label metrics so combo template CTAs match. */
export const COMBO_CTA_TYPE = {
  fontFamily: geist.medium,
  fontSize: 15,
  fontWeight: "500" as const,
  lineHeight: 21,
  letterSpacing: 0,
};
const COMBO_CTA_CHECK_CAP = 16;

/** Selected combo pick: transparent body + 1px gradient in the same border slot as unselected. */
export function ComboSelectedButton({
  selected,
  onPress,
  label,
  radius: radiusProp = METAMASK_BUTTON_RADIUS,
  height = 48,
  flex,
  width,
  minWidth,
  paddingHorizontal = 10,
  fontSize = COMBO_CTA_TYPE.fontSize,
  fontFamily = COMBO_CTA_TYPE.fontFamily,
  lineHeight,
  unselectedColor = colors.textAlternative,
  unselectedChrome = "outline",
  labelForInk,
  disabled,
  accessibilityLabel,
  fullWidth,
  children,
  slotValue,
  slotPrefix,
  slotSuffix,
}: {
  selected: boolean;
  onPress: () => void;
  label?: string;
  radius?: number;
  height?: number;
  flex?: number;
  width?: number;
  minWidth?: number;
  paddingHorizontal?: number;
  fontSize?: number;
  fontFamily?: string;
  lineHeight?: number;
  unselectedBg?: string;
  unselectedColor?: string;
  /** In-card ¢: route chrome from `useComboPageUnselectedChrome`. Default outline. */
  unselectedChrome?: "muted" | "outline";
  /** Yes/No labels keep green/red ink on muted unselected cards. */
  labelForInk?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
  fullWidth?: boolean;
  children?: ReactNode;
  /** Live cents/% — same slot-reel Home uses on outcome buttons. */
  slotValue?: number;
  slotPrefix?: string;
  slotSuffix?: string;
}) {
  const storeR = useBetRadius();
  const radius = storeR === 999 ? 999 : radiusProp;
  const lh = lineHeight ?? fontSize + 6;
  const labelType = {
    fontFamily,
    fontSize,
    fontWeight: COMBO_CTA_TYPE.fontWeight,
    lineHeight: lh,
    letterSpacing: COMBO_CTA_TYPE.letterSpacing,
  } as const;
  const mutedUnselected = !selected && unselectedChrome === "muted";
  const unselectedVisual = comboOutcomeVisual(false, unselectedColor, radius, {
    unselectedChrome,
    label: labelForInk ?? label,
  });
  const unselectedInk = (unselectedVisual.text.color as string) ?? unselectedColor;
  const ringRadius = radius >= height / 2 ? height / 2 : radius;
  const webChrome: Record<string, string> | null =
    Platform.OS === "web"
      ? {
          boxSizing: "border-box",
          cursor: disabled ? "default" : "pointer",
          backgroundColor: mutedUnselected ? ON_SURFACE_BUTTON_BG : "transparent",
          backgroundImage: "none",
        }
      : null;
  const chromeKey = selected ? "selected" : mutedUnselected ? "muted" : "unselected";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled}
      onPress={onPress}
      {...(Platform.OS === "web"
        ? { dataSet: { comboChrome: chromeKey } }
        : null)}
      style={({ pressed }) => ({
        height,
        width,
        minWidth,
        flex,
        flexShrink: 0,
        alignSelf: fullWidth ? "stretch" : undefined,
        borderRadius: radius,
        overflow: "visible",
        position: "relative" as const,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        paddingHorizontal,
        backgroundColor: selected ? "transparent" : unselectedVisual.container.backgroundColor,
        borderWidth: selected ? 1 : unselectedVisual.container.borderWidth,
        borderStyle: "solid",
        borderColor: selected ? "transparent" : unselectedVisual.container.borderColor,
        opacity: disabled ? 0.45 : pressed ? 0.82 : 1,
        ...webChrome,
      })}
    >
      {selected ? <ComboGradientOutline radius={ringRadius} width={COMBO_OUTLINE_WIDTH} fill="transparent" /> : null}
      <View style={{ zIndex: 2, alignItems: "center", justifyContent: "center" }}>
        {children ??
          (slotValue != null ? (
            <SlotNumber
              prefix={slotPrefix}
              suffix={slotSuffix}
              value={Math.round(slotValue)}
              color={selected ? undefined : unselectedInk}
              fontSize={fontSize}
              fontFamily={fontFamily}
              lineHeight={lh}
              TextComponent={selected ? ComboGradientText : undefined}
            />
          ) : selected && label != null ? (
            <ComboGradientText style={labelType}>
              {label}
            </ComboGradientText>
          ) : (
            <Text numberOfLines={1} style={{ ...labelType, color: unselectedInk }}>
              {label}
            </Text>
          ))}
      </View>
    </Pressable>
  );
}

const ADDED_CHECK_PATH =
  "M6.173 12.414L2.293 8.535l1.414-1.414 2.466 2.466 6.22-6.22 1.414 1.414-7.634 7.633z";
const ADDED_CHECK_MASK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="#fff" d="${ADDED_CHECK_PATH}"/></svg>`,
)}")`;

/** MMDS ArrowRight — same wash as ComboGradientText (blue → lime, bottom-left to top-right). */
const ARROW_RIGHT_PATH = "m8.8873 22-1.775-1.775 8.225-8.225-8.225-8.225 1.775-1.775 10 10z";
const ARROW_RIGHT_MASK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="${ARROW_RIGHT_PATH}"/></svg>`,
)}")`;

export function ComboGradientArrow({ size = 16 }: { size?: number }) {
  const id = useId().replace(/:/g, "");
  const flat = useComboBrandStyle() === "flat";
  if (Platform.OS === "web") {
    return createElement("span", {
      "aria-hidden": true,
      style: {
        width: size,
        height: size,
        flexShrink: 0,
        display: "inline-block",
        backgroundImage: flat ? "none" : COMBO_TEXT_WASH,
        backgroundColor: flat ? COMBO_BRAND_FLAT : "transparent",
        WebkitMaskImage: ARROW_RIGHT_MASK,
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskImage: ARROW_RIGHT_MASK,
        maskRepeat: "no-repeat",
        maskSize: "contain",
      } satisfies CSSProperties,
    });
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <SvgLinearGradient id={id} x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0" stopColor={BLUE} />
          <Stop offset="1" stopColor={LIME} />
        </SvgLinearGradient>
      </Defs>
      <Path d={ARROW_RIGHT_PATH} fill={flat ? COMBO_BRAND_FLAT : `url(#${id})`} />
    </Svg>
  );
}

/** Check + label: diagonal gradient ink only — never a filled button body. */
export function ComboGradientAdded({
  label = "Added",
  iconSize = COMBO_CTA_CHECK_CAP,
  fontSize = COMBO_CTA_TYPE.fontSize,
}: {
  label?: string;
  iconSize?: number;
  fontSize?: number;
}) {
  const gap = 6;
  const lh = COMBO_CTA_TYPE.lineHeight;
  const flat = useComboBrandStyle() === "flat";
  const image = flat ? "none" : COMBO_TEXT_WASH;
  const type = {
    fontFamily: COMBO_CTA_TYPE.fontFamily,
    fontSize,
    fontWeight: COMBO_CTA_TYPE.fontWeight,
    lineHeight: lh,
    letterSpacing: COMBO_CTA_TYPE.letterSpacing,
  } as const;

  if (Platform.OS !== "web") {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap, height: lh }}>
        <View style={{ width: iconSize, height: iconSize, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: iconSize, lineHeight: iconSize, color: flat ? COMBO_BRAND_FLAT : LIME, includeFontPadding: false }}>{"✓"}</Text>
        </View>
        <ComboGradientText style={type}>{label}</ComboGradientText>
      </View>
    );
  }

  return createElement("div", {
    style: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap,
      height: lh,
    } satisfies CSSProperties,
  }, [
    createElement("span", {
      key: "check",
      "aria-hidden": true,
      style: {
        width: iconSize,
        height: iconSize,
        flexShrink: 0,
        alignSelf: "center",
        backgroundImage: image,
        backgroundColor: flat ? COMBO_BRAND_FLAT : "transparent",
        WebkitMaskImage: ADDED_CHECK_MASK,
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskImage: ADDED_CHECK_MASK,
        maskRepeat: "no-repeat",
        maskSize: "contain",
      } satisfies CSSProperties,
    }),
    createElement("span", {
      key: "label",
      style: {
        ...type,
        fontSize,
        lineHeight: `${lh}px`,
        letterSpacing: `${COMBO_CTA_TYPE.letterSpacing}px`,
        backgroundImage: image,
        WebkitBackgroundClip: flat ? "unset" : "text",
        backgroundClip: flat ? "unset" : "text",
        WebkitTextFillColor: flat ? COMBO_BRAND_FLAT : "transparent",
        color: flat ? COMBO_BRAND_FLAT : "transparent",
      } satisfies CSSProperties,
    }, label),
  ]);
}
