import { Animated, StyleSheet } from "react-native";

// The white "highlight face" backdrop for the center-highlight effect. Absolutely
// fills the (overflow-hidden, rounded) button and cross-fades in via the scroll-
// driven opacity, painting an opaque white bg BEHIND the button's content. Render
// this as the first child of the button so the colored label stays on top and
// keeps its color. Renders nothing when opacity is null (effect off / not
// measurable yet).
export function HighlightFace({
  opacity,
}: {
  opacity: Animated.AnimatedInterpolation<number> | null;
}) {
  if (!opacity) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, { backgroundColor: "#fff", opacity }]}
    />
  );
}
