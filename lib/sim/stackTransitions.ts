import type { StackCardInterpolationProps, StackCardInterpolatedStyle } from "@react-navigation/stack";
import { Easing } from "react-native";

/** Incoming card only — no outgoing -30% peek (that reads as left-then-right on web). */
export function forPushFromRight({
  current,
  layouts: { screen },
}: StackCardInterpolationProps): StackCardInterpolatedStyle {
  return {
    cardStyle: {
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [screen.width, 0],
            extrapolate: "clamp",
          }),
        },
      ],
    },
  };
}

export function forPushFromLeft({
  current,
  layouts: { screen },
}: StackCardInterpolationProps): StackCardInterpolatedStyle {
  return {
    cardStyle: {
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [-screen.width, 0],
            extrapolate: "clamp",
          }),
        },
      ],
    },
  };
}

/** CSS ease — monotonic, no reverse or overshoot. */
export const stackSlideTransitionSpec = {
  open: {
    animation: "timing" as const,
    config: { duration: 350, easing: Easing.bezier(0.25, 0.1, 0.25, 1) },
  },
  close: {
    animation: "timing" as const,
    config: { duration: 280, easing: Easing.bezier(0.25, 0.1, 0.25, 1) },
  },
};
