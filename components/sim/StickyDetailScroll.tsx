import type { ReactNode } from "react";
import { Platform, ScrollView, View, type ScrollViewProps, type ViewStyle } from "react-native";

import { colors } from "@/lib/sim/colors";
import { useThemeMode } from "@/lib/sim/dsModeStore";


export function stickyChromeStyle(top = 0): ViewStyle {
  return {
    backgroundColor: colors.bg,
    zIndex: 20,
    ...(Platform.OS === "web" ? { position: "sticky" as unknown as ViewStyle["position"], top } : null),
  };
}

/** Title + filters/tabs that stay put while the page body scrolls. */
export function StickyPageChrome({
  children,
  paddingBottom,
}: {
  children: ReactNode;
  paddingBottom: number;
}) {
  return <View style={[stickyChromeStyle(0), { paddingBottom }]}>{children}</View>;
}

export function StickyDetailScroll({
  header,
  topInset,
  paddingBottom,
  children,
  ...scrollProps
}: {
  header: ReactNode;
  topInset: number;
  paddingBottom: number;
  children: ReactNode;
} & Omit<ScrollViewProps, "contentContainerStyle">) {
  useThemeMode();
  return (
    <>
      <View
        style={{
          paddingTop: topInset + 8,
          paddingBottom: 12,
          backgroundColor: colors.bg,
          zIndex: 30,
        }}
      >
        {header}
      </View>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom }}
        {...scrollProps}
      >
        {children}
      </ScrollView>
    </>
  );
}
