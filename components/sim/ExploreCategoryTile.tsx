import { type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { colors } from "@/lib/sim/colors";
import { geist } from "@/lib/sim/geistFonts";

/** Optical icon box — matches MaterialIcons size={26} in the Politics tile. */
export const EXPLORE_TILE_ICON = 26;

export function ExploreCategoryTile({
  width,
  label,
  icon,
  onPress,
  selected = false,
  accessibilityLabel,
}: {
  width: number;
  label: string;
  icon: ReactNode;
  onPress?: () => void;
  selected?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={{
        width,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: selected ? "rgba(255,255,255,0.35)" : "transparent",
        backgroundColor: selected ? "rgba(255,255,255,0.14)" : colors.surface,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 16,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: EXPLORE_TILE_ICON,
          height: EXPLORE_TILE_ICON,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>
      <Text
        style={{
          fontFamily: selected ? geist.semibold : geist.medium,
          fontSize: 13,
          color: colors.textPrimary,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}
