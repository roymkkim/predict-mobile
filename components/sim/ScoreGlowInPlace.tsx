import { useEffect, useRef, useState } from "react";
import { Animated, Easing, type LayoutChangeEvent } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { SCORE_CUE_MS, SCORE_FADE_MS, SCORE_FLOURISH_MS } from "@/lib/sim/scoreCue";
import type { BorderCuePlacement } from "@/lib/sim/types";

// "Score glow — in place" cue: instead of lighting a side/edge of the ring, this
// recolors the card's NORMAL border accent (its resting placement: left for
// stacked-row cards, center for versus cards) to the scoring team's color.
// One-shot: fades up fast, holds, then eases away. Remount it (changing key) to
// retrigger, exactly like ScoreGlowBorder.
//
// The two placements are isolated into their own components so they can never
// interfere. They differ in BOTH anchor and whether they move:
//   - center (versus cards): the accent sits centered on the top edge and does a
//     celebratory left/right shimmy (the accent + bloom layer nudges sideways via
//     translateX while the neutral hairline stays put).
//   - left (stacked-row cards): the accent sits at the top-left corner and is
//     STATIONARY — it only fades in/holds/out, the corner border does NOT move
//     sideways (at the user's explicit request).
const RADIUS = 12;
const INSET = 0.5; // keep the 1px stroke fully inside the card bounds
// Vertical reach of the accent gradient (mirrors LiveBorder's GLOW_RY).
const GLOW_RY = 90;
// Seat the left-placement peak on the rounded-corner arc, like LiveBorder.
const CORNER_ANCHOR = RADIUS * 0.55;
// How far the accent shimmies sideways at the peak of the celebration (px) —
// used by CenterGlow only (CornerGlow is stationary).
const WIGGLE = 12;

// The animation clock runs over the full shared cue (SCORE_CUE_MS) so the glow
// holds lit and reverts in lockstep with the callout/accent. These fractions map
// absolute moments within that window:
//   - opacity fades in over the first SCORE_FADE_MS and out over the last one,
//     holding fully lit in between.
//   - the celebratory shimmy/sweep plays only over the first SCORE_FLOURISH_MS,
//     then sits still (0) for the remaining hold.
const FADE_F = SCORE_FADE_MS / SCORE_CUE_MS;
const FLOURISH_F = SCORE_FLOURISH_MS / SCORE_CUE_MS;
const OPACITY_IN = [0, FADE_F, 1 - FADE_F, 1];
const OPACITY_OUT = [0, 1, 1, 0];
// Base 0..1 keyframes of the original 1400ms flourish, compressed into the early
// SCORE_FLOURISH_MS slice and then held at rest (final 0 at t=1).
const FLOURISH_BASE = [0, 0.12, 0.24, 0.36, 0.48, 0.6, 0.72, 1];
const FLOURISH_IN = [...FLOURISH_BASE.map((f) => f * FLOURISH_F), 1];

let GID_SEQ = 0;

// Shared static frame + presentational body. The animated values (opacity on the
// outer view, translateX on the accent layer, the gradient anchors) are computed
// by each placement component and passed in, so this stays purely declarative.
function GlowBody({
  gid,
  color,
  w,
  h,
  r,
  cx,
  cy,
  bloomCy,
  bloomRx,
  rx,
  translateX,
}: {
  gid: string;
  color: string;
  w: number;
  h: number;
  r: number;
  cx: number;
  cy: number;
  bloomCy: number;
  bloomRx: number;
  rx: number;
  translateX: Animated.AnimatedInterpolation<number> | number;
}) {
  return (
    <>
      {/* neutral hairline around the whole card — always stays put */}
      <Svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
        <Rect
          x={INSET}
          y={INSET}
          width={w - INSET * 2}
          height={h - INSET * 2}
          rx={r}
          ry={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />
      </Svg>
      {/* team-colored accent + inward bloom */}
      <Animated.View style={{ position: "absolute", left: 0, top: 0, width: w, height: h, transform: [{ translateX }] }}>
        {/* inward bloom in the team color, anchored at the accent placement */}
        <Svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
          <Defs>
            <RadialGradient
              id={`${gid}-glow`}
              cx={cx}
              cy={bloomCy}
              rx={bloomRx}
              ry={h * 0.5}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor={color} stopOpacity={0.12} />
              <Stop offset="0.55" stopColor={color} stopOpacity={0.036} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={w} height={h} fill={`url(#${gid}-glow)`} />
        </Svg>
        {/* team-color accent ring, summed over the neutral hairline */}
        <Svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
          <Defs>
            <RadialGradient id={gid} cx={cx} cy={cy} rx={rx} ry={GLOW_RY} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={color} stopOpacity={1} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect
            x={INSET}
            y={INSET}
            width={w - INSET * 2}
            height={h - INSET * 2}
            rx={r}
            ry={r}
            fill="none"
            stroke={`url(#${gid})`}
            strokeWidth={0.6}
          />
        </Svg>
      </Animated.View>
    </>
  );
}

function useGlowSize() {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) => (prev && prev.w === width && prev.h === height ? prev : { w: width, h: height }));
  };
  return { size, onLayout };
}

// center (versus cards): celebratory left/right shimmy on a single native clock.
function CenterGlow({ color, radius }: { color: string; radius: number }) {
  const gid = useRef(`sgi${GID_SEQ++}`).current;
  const t = useRef(new Animated.Value(0)).current;
  const { size, onLayout } = useGlowSize();

  useEffect(() => {
    t.setValue(0);
    const anim = Animated.timing(t, {
      toValue: 1,
      duration: SCORE_CUE_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [t]);

  const w = size?.w ?? 0;
  const h = size?.h ?? 0;
  const r = Math.max(0, radius - INSET);

  const opacity = t.interpolate({ inputRange: OPACITY_IN, outputRange: OPACITY_OUT });
  const translateX = t.interpolate({
    inputRange: FLOURISH_IN,
    outputRange: [0, WIGGLE, -WIGGLE, WIGGLE * 0.6, -WIGGLE * 0.4, WIGGLE * 0.2, -WIGGLE * 0.1, 0, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      onLayout={onLayout}
      style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, zIndex: 3, opacity }}
    >
      {size && w > 0 && h > 0 && (
        <GlowBody
          gid={gid}
          color={color}
          w={w}
          h={h}
          r={r}
          cx={w / 2}
          cy={0}
          bloomCy={0}
          bloomRx={w * 0.52}
          rx={Math.max(0, w / 2 - radius)}
          translateX={translateX}
        />
      )}
    </Animated.View>
  );
}

// left (stacked-row cards): a STATIONARY corner glow anchored at the top-left
// corner. It fades in, holds lit, and fades out — but the border does NOT move
// sideways (no shimmy). The user explicitly does not want the corner border to
// move; only the center placement keeps its celebratory shimmy.
function CornerGlow({ color, radius }: { color: string; radius: number }) {
  const gid = useRef(`sgi${GID_SEQ++}`).current;
  const t = useRef(new Animated.Value(0)).current;
  const { size, onLayout } = useGlowSize();

  useEffect(() => {
    t.setValue(0);
    const anim = Animated.timing(t, {
      toValue: 1,
      duration: SCORE_CUE_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [t]);

  const w = size?.w ?? 0;
  const h = size?.h ?? 0;
  const r = Math.max(0, radius - INSET);

  const opacity = t.interpolate({ inputRange: OPACITY_IN, outputRange: OPACITY_OUT });

  return (
    <Animated.View
      pointerEvents="none"
      onLayout={onLayout}
      style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, zIndex: 3, opacity }}
    >
      {size && w > 0 && h > 0 && (
        <GlowBody
          gid={gid}
          color={color}
          w={w}
          h={h}
          r={r}
          cx={CORNER_ANCHOR}
          cy={CORNER_ANCHOR}
          bloomCy={0}
          bloomRx={w * 0.62}
          rx={w}
          translateX={0}
        />
      )}
    </Animated.View>
  );
}

export function ScoreGlowInPlace({
  color,
  placement,
  radius = RADIUS,
}: {
  color: string;
  placement: BorderCuePlacement;
  radius?: number;
}) {
  return placement === "center" ? (
    <CenterGlow color={color} radius={radius} />
  ) : (
    <CornerGlow color={color} radius={radius} />
  );
}
