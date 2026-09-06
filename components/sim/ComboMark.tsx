import { createElement, useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { Animated, Easing, Platform, View } from "react-native";
import Svg, { Defs, G, LinearGradient, Path, Stop } from "react-native-svg";

import {
  COMBO_GRADIENT_COLORS,
  COMBO_GRADIENT_CYCLE_MS,
  ComboGradientGlow,
  useComboGradientShift,
} from "@/components/sim/ComboGradient";
import { COMBO_BRAND_FLAT, useComboBrandStyle } from "@/lib/sim/comboBrandStore";
import { useComboChromeExiting, useComboMode } from "@/lib/sim/comboFlowStore";

const [BLUE, LIME] = COMBO_GRADIENT_COLORS;

/**
 * User silhouette from assets/images/centcombo.svg (skip the #1B1B1B board).
 * Two separate tile fills + ¢ knockout. fill-rule nonzero so the overlap stays
 * solid (evenodd would punch a hole). ¢ ink is opposite winding; counter is not.
 */
const COMBO_MARK_VB = 34;
const COMBO_MARK_PATH =
  "M4.81974 21.667C4.81974 23.5002 5.47233 25.0695 6.77775 26.375C8.08321 27.6805 9.6526 28.3339 11.4858 28.334H26.9858C26.8191 29.0005 26.4857 29.5765 25.9858 30.0625C25.4858 30.5486 24.8749 30.8337 24.1527 30.917L5.98576 33.125C5.06929 33.2638 4.24322 33.0488 3.50724 32.4795C2.77113 31.91 2.34687 31.1667 2.23576 30.25L0.0277475 12.042C-0.083356 11.1254 0.139235 10.3062 0.69474 9.58398C1.25027 8.86179 1.98614 8.44512 2.90275 8.33398L4.81974 8.08398V21.667ZM29.8197 0C30.7362 5.71064e-05 31.5206 0.326908 32.1733 0.979492C32.826 1.63227 33.1527 2.41732 33.1527 3.33398V21.667C33.1527 22.5837 32.826 23.3687 32.1733 24.0215C31.5206 24.674 30.7361 24.9999 29.8197 25H11.4858C10.5694 24.9999 9.78486 24.674 9.13224 24.0215C8.47946 23.3687 8.15275 22.5837 8.15275 21.667V3.33398C8.15275 2.41732 8.47946 1.63227 9.13224 0.979492C9.7849 0.326892 10.5693 9.693e-05 11.4858 0H29.8197ZM20.4506 3.45312L20.266 5.60449C19.1309 5.65609 18.1296 5.93007 17.2621 6.42773C16.2942 6.96721 15.5399 7.73672 15.0004 8.73633C14.461 9.73589 14.1919 10.9102 14.1918 12.2588C14.1918 13.5916 14.461 14.7582 15.0004 15.7578C15.5399 16.7575 16.2942 17.5355 17.2621 18.0908C17.831 18.4171 18.4581 18.6438 19.142 18.7783L18.9516 21.0176H20.7602L20.9389 18.917C21.9854 18.8868 22.9178 18.6844 23.7358 18.3047C24.6402 17.8763 25.3623 17.2811 25.9018 16.5195C26.457 15.7421 26.7897 14.8218 26.9008 13.7588L23.2123 13.6162C23.1171 14.4887 22.8394 15.1315 22.3793 15.5439C22.0396 15.8485 21.6389 16.0394 21.1781 16.1191L21.8197 8.60547C22.014 8.70113 22.1925 8.82382 22.3549 8.97461C22.8151 9.37129 23.1012 9.9664 23.2123 10.7598L26.9008 10.5693C26.7739 9.52209 26.4327 8.63322 25.8774 7.90332C25.322 7.1577 24.5922 6.58608 23.6879 6.18945C23.1857 5.96528 22.6451 5.80645 22.0668 5.70898L22.2602 3.45312H20.4506ZM19.391 15.8584C19.0845 15.6892 18.8183 15.4496 18.5942 15.1387C18.1025 14.4564 17.8568 13.4962 17.8568 12.2588C17.8569 11.0213 18.1023 10.0611 18.5942 9.37891C18.9609 8.87014 19.4384 8.55127 20.0258 8.42188L19.391 15.8584Z";

const COMBO_MARK_MASK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${COMBO_MARK_VB} ${COMBO_MARK_VB}"><path fill="#fff" fill-rule="nonzero" d="${COMBO_MARK_PATH}"/></svg>`,
)}")`;

const MARK_SWEEP_KF = "comboMarkSweep";
const MARK_SWEEP_STYLE_ID = "combo-mark-sweep-v7";
/** Resting mix so the glyph isn’t a hard candy-cane fill. Slightly blue-weighted. */
const MARK_BASE = `color-mix(in srgb, ${BLUE} 64%, ${LIME})`;
/**
 * Two periods on a 200% tile so `to top right` loops without a snap.
 * Opaque-enough blue plateaus + shorter lime hits — edge wash, not stripes.
 * Keyframes travel BL→TR (image shifts right+up). Opposite of 100% 0% ← 0% 100%.
 */
const MARK_SWEEP_IMAGE = `linear-gradient(to top right, ${BLUE}F0 0%, ${BLUE}E8 8%, ${LIME}E6 16%, ${LIME}E0 20%, ${BLUE}66 30%, ${BLUE}55 42%, ${BLUE}F0 50%, ${BLUE}E8 58%, ${LIME}E6 66%, ${LIME}E0 70%, ${BLUE}66 80%, ${BLUE}55 92%, ${BLUE}F0 100%)`;

const MARK_MASK: CSSProperties = {
  WebkitMaskImage: COMBO_MARK_MASK,
  maskImage: COMBO_MARK_MASK,
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskSize: "contain",
  maskSize: "contain",
  WebkitMaskPosition: "center",
  maskPosition: "center",
  WebkitMaskMode: "alpha",
  maskMode: "alpha",
};

function ensureMarkSweepKeyframes() {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  if (document.getElementById(MARK_SWEEP_STYLE_ID)) return;
  document.getElementById("combo-mark-sweep-v1")?.remove();
  document.getElementById("combo-mark-sweep-v2")?.remove();
  document.getElementById("combo-mark-sweep-v3")?.remove();
  document.getElementById("combo-mark-sweep-v4")?.remove();
  document.getElementById("combo-mark-sweep-v5")?.remove();
  document.getElementById("combo-mark-sweep-v6")?.remove();
  const el = document.createElement("style");
  el.id = MARK_SWEEP_STYLE_ID;
  // 200% tile, two periods. 100% 0% → 0% 100% is one period BL→TR; wrap = start.
  el.textContent = `@keyframes ${MARK_SWEEP_KF} {
    from { background-position: 100% 0%; }
    to { background-position: 0% 100%; }
  }`;
  document.head.appendChild(el);
}

const GLYPH = 16;
const PADDED_INSET = 4;

export const COMBO_HEADER_MARK_SIZE = 20;

/** 40×40 oval behind the 20×20 glyph — unclipped, unfilled. */
const HEADER_GLOW_SIZE = 40;
const HEADER_GLOW_PAD = (HEADER_GLOW_SIZE - COMBO_HEADER_MARK_SIZE) / 2;
const HEADER_GLOW_IN_MS = 260;
const HEADER_GLOW_PEAK_MS = 200;
const HEADER_GLOW_OUT_MS = 500;
const HEADER_EXIT_MS = 280;
/** Wrapper peak; ComboGradientGlow bloom paints a supporting oval, not a wash. */
const HEADER_GLOW_PEAK_OPACITY = 0.72;
const nativeDriver = Platform.OS !== "web";

export function HeaderComboMark({ pop = true }: { pop?: boolean }) {
  const comboMode = useComboMode();
  const chromeExiting = useComboChromeExiting();
  const active = pop ? comboMode && !chromeExiting : true;
  const [mounted, setMounted] = useState(active);
  const enter = useRef(new Animated.Value(pop && active ? 0 : 1)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const shown = useRef(active);

  useEffect(() => {
    if (!pop) {
      setMounted(true);
      enter.setValue(1);
      glow.setValue(0);
      return;
    }
    if (active) {
      shown.current = true;
      setMounted(true);
      enter.setValue(0);
      glow.setValue(0);
      Animated.timing(enter, {
        toValue: 1,
        duration: HEADER_GLOW_IN_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: nativeDriver,
      }).start();
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: HEADER_GLOW_IN_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: nativeDriver,
        }),
        Animated.delay(HEADER_GLOW_PEAK_MS),
        Animated.timing(glow, {
          toValue: 0,
          duration: HEADER_GLOW_OUT_MS,
          easing: Easing.in(Easing.quad),
          useNativeDriver: nativeDriver,
        }),
      ]).start();
      return;
    }
    if (!shown.current) {
      setMounted(false);
      return;
    }
    glow.stopAnimation();
    Animated.parallel([
      Animated.timing(enter, {
        toValue: 0,
        duration: HEADER_EXIT_MS,
        easing: Easing.bezier(0.32, 0.72, 0, 1),
        useNativeDriver: nativeDriver,
      }),
      Animated.timing(glow, {
        toValue: 0,
        duration: HEADER_EXIT_MS,
        easing: Easing.bezier(0.32, 0.72, 0, 1),
        useNativeDriver: nativeDriver,
      }),
    ]).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [active, pop, enter, glow]);

  if (!mounted) return null;

  const glowBox = HEADER_GLOW_SIZE;

  return (
    <View
      style={{
        width: COMBO_HEADER_MARK_SIZE,
        height: COMBO_HEADER_MARK_SIZE,
        overflow: "visible",
        position: "relative",
        backgroundColor: "transparent",
      }}
    >
      {pop ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: -HEADER_GLOW_PAD,
            left: -HEADER_GLOW_PAD,
            width: glowBox,
            height: glowBox,
            overflow: "visible",
            backgroundColor: "transparent",
            opacity: glow.interpolate({
              inputRange: [0, 1],
              outputRange: [0, HEADER_GLOW_PEAK_OPACITY],
            }),
          }}
        >
          <ComboGradientGlow bloom />
        </Animated.View>
      ) : null}
      <Animated.View
        style={{
          width: COMBO_HEADER_MARK_SIZE,
          height: COMBO_HEADER_MARK_SIZE,
          overflow: "visible",
          backgroundColor: "transparent",
          zIndex: 1,
          transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
          opacity: enter,
        }}
      >
        <ComboMark size={COMBO_HEADER_MARK_SIZE} gradient animate padded={false} />
      </Animated.View>
    </View>
  );
}

/** Exact CSS pixels. Do not snap 32 or 40 down to 24. */
const COMBO_SIZES = [16, 20, 24, 26, 32, 40] as const;

function comboSize(size: number): number {
  for (const allowed of COMBO_SIZES) {
    if (size === allowed) return allowed;
  }
  return size;
}

// Stacked tiles + ¢. `padded` insets the glyph in compact icon boxes.
// Explore tiles use size={26} padded={false} so the mark fills 26×26 like Material 26.
export function ComboMark({
  size = 24,
  color = "#ffffff",
  gradient = false,
  animate = true,
  padded = false,
}: {
  size?: number;
  color?: string;
  gradient?: boolean;
  animate?: boolean;
  padded?: boolean;
}) {
  const brand = useComboBrandStyle();
  const wash = gradient && brand === "gradient";
  const solid = wash ? undefined : gradient ? COMBO_BRAND_FLAT : color;
  const rawId = useId().replace(/:/g, "");
  const box = comboSize(size);
  const fill = wash ? `url(#${rawId})` : solid;
  const sweep = wash && animate;
  const shift = useComboGradientShift(sweep && Platform.OS !== "web");
  const inset = padded ? (box <= 20 ? 2 : PADDED_INSET) : 0;
  const inner = box - inset * 2;
  const diag = box;

  if (Platform.OS === "web") {
    if (sweep) ensureMarkSweepKeyframes();
    const washAnim: CSSProperties = wash
      ? {
          backgroundImage: MARK_SWEEP_IMAGE,
          backgroundSize: "200% 200%",
          backgroundRepeat: "repeat",
          backgroundPosition: "100% 0%",
          animation: sweep ? `${MARK_SWEEP_KF} ${COMBO_GRADIENT_CYCLE_MS}ms linear infinite` : "none",
        }
      : {};
    return createElement(
      "div",
      {
        "aria-hidden": true,
        style: {
          width: box,
          height: box,
          padding: inset,
          boxSizing: "border-box",
          backgroundColor: "transparent",
          background: "none",
          boxShadow: "none",
          overflow: "visible",
          flexShrink: 0,
        } satisfies CSSProperties,
      },
      createElement(
        "div",
        {
          style: {
            width: inner,
            height: inner,
            position: "relative",
            overflow: "hidden",
            backgroundColor: wash ? MARK_BASE : solid,
            ...MARK_MASK,
          } satisfies CSSProperties,
        },
        wash
          ? createElement("div", {
              style: {
                position: "absolute",
                inset: "-50%",
                filter: "blur(5px)",
                opacity: 0.62,
                pointerEvents: "none",
                ...washAnim,
              } satisfies CSSProperties,
            })
          : null,
        wash
          ? createElement("div", {
              style: {
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                ...washAnim,
              } satisfies CSSProperties,
            })
          : null,
      ),
    );
  }

  return (
    <Svg
      width={box}
      height={box}
      viewBox={`0 0 ${box} ${box}`}
      fill="none"
      style={{ backgroundColor: "transparent", overflow: "visible" }}
    >
      <Defs>
        {wash ? (
          <LinearGradient
            id={rawId}
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={diag}
            x2={diag * 2}
            y2={-diag}
            spreadMethod="repeat"
            gradientTransform={`translate(${-shift * diag} ${shift * diag})`}
          >
            <Stop offset="0" stopColor={BLUE} stopOpacity="0.94" />
            <Stop offset="0.08" stopColor={BLUE} stopOpacity="0.91" />
            <Stop offset="0.16" stopColor={LIME} stopOpacity="0.9" />
            <Stop offset="0.2" stopColor={LIME} stopOpacity="0.88" />
            <Stop offset="0.3" stopColor={BLUE} stopOpacity="0.4" />
            <Stop offset="0.42" stopColor={BLUE} stopOpacity="0.33" />
            <Stop offset="0.5" stopColor={BLUE} stopOpacity="0.94" />
            <Stop offset="0.58" stopColor={BLUE} stopOpacity="0.91" />
            <Stop offset="0.66" stopColor={LIME} stopOpacity="0.9" />
            <Stop offset="0.7" stopColor={LIME} stopOpacity="0.88" />
            <Stop offset="0.8" stopColor={BLUE} stopOpacity="0.4" />
            <Stop offset="0.92" stopColor={BLUE} stopOpacity="0.33" />
            <Stop offset="1" stopColor={BLUE} stopOpacity="0.94" />
          </LinearGradient>
        ) : null}
      </Defs>
      <G transform={`translate(${inset} ${inset}) scale(${inner / COMBO_MARK_VB})`}>
        <Path d={COMBO_MARK_PATH} fill={fill} fillRule="nonzero" />
      </G>
    </Svg>
  );
}

/** Check mark using the same diagonal sweep as `ComboMark`. */
export function ComboGradientCheck({ size = 16 }: { size?: number }) {
  const rawId = useId().replace(/:/g, "");
  const box = comboSize(size);
  const shift = useComboGradientShift(true);
  const inset = box <= 20 ? 2 : PADDED_INSET;
  const diag = box;
  return (
    <Svg width={box} height={box} viewBox={`0 0 ${box} ${box}`} fill="none">
      <Defs>
        <LinearGradient
          id={rawId}
          gradientUnits="userSpaceOnUse"
          x1={0}
          y1={diag}
          x2={diag * 2}
          y2={-diag}
          spreadMethod="repeat"
          gradientTransform={`translate(${shift * diag * 2} ${-shift * diag * 2})`}
        >
          <Stop offset="0" stopColor={BLUE} />
          <Stop offset="0.5" stopColor={LIME} />
          <Stop offset="1" stopColor={BLUE} />
        </LinearGradient>
      </Defs>
      <G transform={`translate(${inset} ${inset}) scale(${(box - inset * 2) / GLYPH})`}>
        <Path
          d="M6.173 12.414L2.293 8.535l1.414-1.414 2.466 2.466 6.22-6.22 1.414 1.414-7.634 7.633z"
          fill={`url(#${rawId})`}
        />
      </G>
    </Svg>
  );
}
