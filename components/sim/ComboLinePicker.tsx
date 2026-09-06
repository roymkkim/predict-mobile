import { Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  Icon,
  IconColor,
  IconName,
  IconSize,
} from "@metamask/design-system-react-native";

import { colors, ON_SURFACE_BUTTON_BG } from "@/lib/sim/colors";
import { geist } from "@/lib/sim/geistFonts";
import { METAMASK_BUTTON_RADIUS } from "@/lib/sim/buttonStyle";
import { SPREAD_LINES } from "@/lib/sim/spreadLines";

export { SPREAD_LINES };
const MMDS_MD_HEIGHT = 40;

export function formatComboLine(n: number): string {
  return String(n);
}

/** Compact line-value pill (sentence chrome). The swipe strip itself is `LinePicker`. */
export function ComboLinePicker({
  value,
  open,
  onToggle,
  compact = false,
}: {
  value: number;
  open: boolean;
  onToggle: () => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <Pressable
        onPress={onToggle}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel={`Line ${formatComboLine(value)}`}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          height: 28,
          paddingHorizontal: 8,
          borderRadius: METAMASK_BUTTON_RADIUS,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.18)",
          backgroundColor: "rgba(255,255,255,0.04)",
        }}
      >
        <Text style={{ fontFamily: geist.medium, fontSize: 14, lineHeight: 20, color: colors.textPrimary }}>
          {formatComboLine(value)}
        </Text>
        <Feather name={open ? "chevron-up" : "chevron-down"} size={12} color={colors.textMuted} />
      </Pressable>
    );
  }

  return (
    <View style={{ flexShrink: 0, height: MMDS_MD_HEIGHT, justifyContent: "center" }}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`Line ${formatComboLine(value)}`}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          height: MMDS_MD_HEIGHT,
          paddingHorizontal: 16,
          borderRadius: METAMASK_BUTTON_RADIUS,
          backgroundColor: ON_SURFACE_BUTTON_BG,
        }}
      >
        <Text style={{ fontFamily: geist.medium, fontSize: 14, lineHeight: 20, color: colors.textPrimary }}>
          {formatComboLine(value)}
        </Text>
        <Icon
          name={open ? IconName.ArrowUp : IconName.ArrowDown}
          size={IconSize.Sm}
          color={IconColor.IconAlternative}
        />
      </Pressable>
    </View>
  );
}
