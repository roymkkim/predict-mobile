import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, View, type LayoutChangeEvent } from "react-native";
import type { ReactNode } from "react";
import Reanimated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useTailwind } from "@metamask/design-system-twrnc-preset";

import { Tab } from "./Tab";

export type TabItem = {
  key: string;
  label: string;
  isDisabled?: boolean;
  leading?: ReactNode;
  tourId?: string;
};

export function TabsBar({
  tabs,
  activeIndex,
  onTabPress,
  scrollable = false,
}: {
  tabs: TabItem[];
  activeIndex: number;
  onTabPress: (index: number) => void;
  scrollable?: boolean;
}) {
  const tw = useTailwind();
  const underlineX = useSharedValue(0);
  const underlineW = useSharedValue(0);
  const layouts = useRef<{ x: number; width: number }[]>([]);
  const [ready, setReady] = useState(false);

  const placeUnderline = useCallback(
    (index: number, animate: boolean) => {
      const layout = layouts.current[index];
      if (!layout || layout.width <= 0) return;
      if (animate) {
        underlineX.value = withTiming(layout.x, { duration: 200 });
        underlineW.value = withTiming(layout.width, { duration: 200 });
      } else {
        underlineX.value = layout.x;
        underlineW.value = layout.width;
      }
    },
    [underlineW, underlineX],
  );

  useEffect(() => {
    if (ready) placeUnderline(activeIndex, true);
  }, [activeIndex, placeUnderline, ready]);

  const handleTabLayout = (index: number, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    if (width <= 0) return;
    layouts.current[index] = { x, width };
    if (layouts.current.filter((item) => item?.width > 0).length === tabs.length) {
      setReady(true);
      placeUnderline(activeIndex, false);
    }
  };

  const underlineStyle = useAnimatedStyle(() => ({
    width: underlineW.value,
    transform: [{ translateX: underlineX.value }],
  }));

  const tabRow = (
    <View style={{ position: "relative", flexDirection: "row", alignItems: "center", gap: 24 }}>
      {tabs.map((tab, index) => (
        <Tab
          key={tab.key}
          label={tab.label}
          isActive={index === activeIndex}
          isDisabled={tab.isDisabled}
          leading={tab.leading}
          tourId={tab.tourId}
          onPress={() => onTabPress(index)}
          onLayout={(event) => handleTabLayout(index, event)}
        />
      ))}
      {ready ? (
        <Reanimated.View style={[tw.style("absolute bottom-0 h-0.5 bg-icon-default"), underlineStyle]} />
      ) : null}
    </View>
  );

  if (!scrollable) {
    return <View style={{ paddingHorizontal: 16, flexGrow: 0 }}>{tabRow}</View>;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={{
        paddingLeft: 16,
        paddingRight: 28,
        paddingBottom: 0,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      {tabRow}
    </ScrollView>
  );
}
