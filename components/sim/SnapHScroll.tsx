import { Children, type ReactNode } from "react";
import { Platform, ScrollView, View, type StyleProp, type ViewStyle } from "react-native";

const WEB_TRACK = {
  scrollSnapType: "x mandatory",
} as ViewStyle;

const WEB_ITEM = {
  scrollSnapAlign: "start",
  scrollSnapStop: "always",
  flexShrink: 0,
} as ViewStyle;

const WEB_ITEM_END = {
  ...WEB_ITEM,
  scrollSnapAlign: "end",
} as ViewStyle;

/** Horizontal card rail: native snapToInterval, CSS scroll-snap on web. */
export function SnapHScroll({
  gutter,
  interval,
  gap = 8,
  style,
  contentContainerStyle,
  nestedScrollEnabled,
  scrollEnabled = true,
  snapToOffsets,
  lastItemSnapEnd,
  children,
}: {
  gutter: number;
  interval: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  nestedScrollEnabled?: boolean;
  scrollEnabled?: boolean;
  snapToOffsets?: number[];
  lastItemSnapEnd?: boolean;
  children: ReactNode;
}) {
  const web = Platform.OS === "web";
  const items = Children.toArray(children);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToAlignment="start"
      disableIntervalMomentum
      nestedScrollEnabled={nestedScrollEnabled}
      scrollEnabled={scrollEnabled}
      {...(snapToOffsets ? { snapToOffsets } : { snapToInterval: interval })}
      style={[
        web ? { ...WEB_TRACK, scrollPaddingLeft: gutter, scrollPaddingRight: gutter } : null,
        style,
      ]}
      contentContainerStyle={[{ flexDirection: "row", paddingHorizontal: gutter, gap }, contentContainerStyle]}
    >
      {items.map((child, i) => (
        <View
          key={i}
          collapsable={false}
          style={web ? (lastItemSnapEnd && i === items.length - 1 ? WEB_ITEM_END : WEB_ITEM) : { flexShrink: 0 }}
        >
          {child}
        </View>
      ))}
    </ScrollView>
  );
}
