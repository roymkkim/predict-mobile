import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Icon, IconColor, IconName, IconSize } from "@metamask/design-system-react-native";

import { ComboGradientFill } from "@/components/sim/ComboGradient";
import { ComboMark } from "@/components/sim/ComboMark";
import { colors } from "@/lib/sim/colors";
import { enterComboFlow } from "@/lib/sim/comboFlowStore";
import { geist } from "@/lib/sim/geistFonts";

export function CombinationsBanner() {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open Combos"
      onPress={() => {
        enterComboFlow();
        router.push("/combination");
      }}
      style={{
        minHeight: 56,
        borderRadius: 12,
        backgroundColor: colors.surface,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <ComboGradientFill
        style={{
          width: 56,
          height: 56,
          borderRadius: 12,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ComboMark size={24} color="#ffffff" />
      </ComboGradientFill>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text style={{ fontFamily: geist.medium, fontSize: 16, lineHeight: 20, color: colors.textPrimary }}>
          Combos
        </Text>
        <Text numberOfLines={1} style={{ fontFamily: geist.regular, fontSize: 14, lineHeight: 22, color: colors.textMuted }}>
          Stack picks into one ticket
        </Text>
      </View>
      <Icon name={IconName.ArrowRight} size={IconSize.Sm} color={IconColor.IconAlternative} />
    </Pressable>
  );
}
