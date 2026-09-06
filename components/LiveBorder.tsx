import React from "react";
import { View } from "react-native";

import colors from "@/constants/colors";

const c = colors.light;

export function LiveBorder({
  children,
  radius = 15.5,
  thickness = 1.5,
}: {
  children: React.ReactNode;
  radius?: number;
  thickness?: number;
}) {
  return (
    <View
      style={{
        borderRadius: radius,
        borderWidth: thickness,
        borderColor: c.liveYellow,
        overflow: "hidden",
      }}
    >
      {children}
    </View>
  );
}
