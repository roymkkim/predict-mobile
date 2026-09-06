import { Pressable, Text, View } from "react-native";
import type { ReactNode } from "react";

import { colors, filterChipBackground, FILTER_CHIP_INACTIVE_TEXT } from "@/lib/sim/colors";
import { METAMASK_BUTTON_LABEL, METAMASK_BUTTON_RADIUS, buttonInteractionStyle } from "@/lib/sim/buttonStyle";
import { geist } from "@/lib/sim/geistFonts";

export function FilterButton({
  label,
  count,
  active = false,
  onPress,
  variant = "pill",
  icon,
}: {
  label: string;
  count?: number;
  active?: boolean;
  onPress: () => void;
  variant?: "pill" | "tab" | "segment" | "tile";
  icon?: ReactNode;
}) {
  if (variant === "tab") {
    return (
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        onPress={onPress}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          height: 44,
          paddingHorizontal: 12,
          borderBottomWidth: 2,
          borderBottomColor: active ? "#FFFFFF" : "transparent",
          ...buttonInteractionStyle(pressed),
        })}
      >
        {icon}
        <Text
          style={[
            METAMASK_BUTTON_LABEL,
            { color: active ? colors.textPrimary : colors.textAlternative },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Pressable>
    );
  }

  if (variant === "segment") {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        onPress={onPress}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          height: 40,
          paddingHorizontal: 16,
          borderRadius: METAMASK_BUTTON_RADIUS,
          backgroundColor: active ? "#FFFFFF" : colors.surface2,
          ...buttonInteractionStyle(pressed),
        })}
      >
        {icon}
        <Text
          style={[
            METAMASK_BUTTON_LABEL,
            { color: active ? colors.controlActiveText : colors.textPrimary },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Pressable>
    );
  }

  if (variant === "tile") {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        onPress={onPress}
        style={({ pressed }) => ({
          width: 60,
          alignItems: "center",
          gap: 6,
          ...buttonInteractionStyle(pressed),
        })}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: METAMASK_BUTTON_RADIUS,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: active ? colors.surface : "transparent",
          }}
        >
          {icon}
        </View>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: active ? geist.semibold : geist.regular,
            fontSize: 12,
            lineHeight: 16,
            color: active ? colors.textPrimary : colors.textMuted,
          }}
        >
          {label}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        height: 40,
        paddingHorizontal: 16,
        borderRadius: METAMASK_BUTTON_RADIUS,
         backgroundColor: filterChipBackground(active),
        ...buttonInteractionStyle(pressed),
      })}
    >
      <Text
        style={[
          METAMASK_BUTTON_LABEL,
           { color: active ? colors.textPrimary : FILTER_CHIP_INACTIVE_TEXT },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {count !== undefined ? (
        <Text
          style={{
            fontFamily: geist.medium,
            fontSize: 16,
            color: active ? colors.textPrimary : FILTER_CHIP_INACTIVE_TEXT,
          }}
        >
          {count}
        </Text>
      ) : null}
    </Pressable>
  );
}