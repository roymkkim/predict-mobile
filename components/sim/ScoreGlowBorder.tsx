import { useEffect, useRef, useState } from "react";
import { Animated, Easing, type LayoutChangeEvent } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { SCORE_CUE_MS, SCORE_FADE_MS } from "@/lib/sim/scoreCue";

// "Score glow" cue: a one-shot border glow in the scoring team's color, anchored
// to the side/half of the ring nearest the scorer — top/bottom for stacked-row
// cards (the scoring row) and left/right for versus cards (the scoring team).
// Faithful RN port of the web's score-glow: an SVG rounded-rect stroke painted
// by a radial (ellipse) gradient seated on the scoring edge, summed over the same
// neutral white hairline the live border uses. Fades up fast, holds lit, then
// eases away — its lifetime matches the callout (SCORE_CUE_MS) so the glow,
// accent, and "<team> scored" text revert together. Remount (changing key) to
// retrigger.
const RADIUS = 12;
const INSET = 0.5; // keep the 1px stroke fully inside the card bounds
// How far the colored glow reaches inward from the scoring edge (short axis of
// the ellipse). The long axis overshoots the card so the whole edge lights up.
const GLOW_SPAN = 90;
const OVERSHOOT = 1.2;

let GID_SEQ = 0;

export function ScoreGlowBorder({
  color,
  edge,
  radius = RADIUS,
}: {
  color: string;
  edge: "top" | "bottom" | "left" | "right";
  radius?: number;
}) {
  const gid = useRef(`sgb${GID_SEQ++}`).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  // Fade up fast, hold lit for the bulk of the cue, then ease away over the final
  // fade — so the glow leaves at the same moment as the callout/accent. Runs once
  // on mount; the parent remounts (via key) to retrigger.
  useEffect(() => {
    opacity.setValue(0);
    const anim = Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: SCORE_FADE_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.delay(SCORE_CUE_MS - 2 * SCORE_FADE_MS),
      Animated.timing(opacity, { toValue: 0, duration: SCORE_FADE_MS, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!size || size.w !== width || size.h !== height) setSize({ w: width, h: height });
  };

  const w = size?.w ?? 0;
  const h = size?.h ?? 0;
  // Corner radius of the stroke, clamped so a square (list-mode) card doesn't
  // pass a negative rx/ry to the SVG Rect.
  const r = Math.max(0, radius - INSET);

  // Seat the gradient peak on the scoring edge; the long axis overshoots the card
  // so the entire edge glows, the short axis (GLOW_SPAN) fades inward.
  let cx = w / 2;
  let cy = 0;
  let rx = w * OVERSHOOT;
  let ry = GLOW_SPAN;
  if (edge === "bottom") {
    cy = h;
  } else if (edge === "left") {
    cx = 0;
    cy = h / 2;
    rx = GLOW_SPAN;
    ry = h * OVERSHOOT;
  } else if (edge === "right") {
    cx = w;
    cy = h / 2;
    rx = GLOW_SPAN;
    ry = h * OVERSHOOT;
  }

  return (
    <Animated.View
      pointerEvents="none"
      onLayout={onLayout}
      style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, zIndex: 3, opacity }}
    >
      {size && w > 0 && h > 0 && (
        <>
          {/* neutral hairline around the whole card */}
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
          {/* scoring-team color glow, summed over the neutral hairline */}
          <Svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
            <Defs>
              <RadialGradient id={gid} cx={cx} cy={cy} rx={rx} ry={ry} gradientUnits="userSpaceOnUse">
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
              strokeWidth={1}
            />
          </Svg>
        </>
      )}
    </Animated.View>
  );
}
