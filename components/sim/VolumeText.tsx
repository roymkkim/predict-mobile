import { type ReactNode } from "react";
import { Text, type StyleProp, type TextStyle } from "react-native";

import { colors } from "@/lib/sim/colors";
import { geist } from "@/lib/sim/geistFonts";

/** Market volume labels (`$1.8M Vol.`) — medium weight only; size/color via `style`. */
export function VolumeText({
  children,
  style,
  numberOfLines = 1,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ fontFamily: geist.medium, fontWeight: "500", color: colors.textMuted }, style]}
    >
      {children}
    </Text>
  );
}
