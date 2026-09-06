import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { ComboMark } from "@/components/sim/ComboMark";
import { ExploreCategoryTile, EXPLORE_TILE_ICON } from "@/components/sim/ExploreCategoryTile";
import { colors } from "@/lib/sim/colors";
import { enterComboFlow } from "@/lib/sim/comboFlowStore";
import { geist } from "@/lib/sim/geistFonts";

export function CombinationsCategoryTile({
  variant,
  width,
}: {
  variant: "card" | "icon" | "feed";
  width: number;
}) {
  const router = useRouter();
  const open = () => {
    enterComboFlow();
    router.push("/combination" as never);
  };

  const comboIcon = (
    <ComboMark size={EXPLORE_TILE_ICON} gradient padded={false} />
  );

  if (variant === "icon" || variant === "card") {
    return (
      <ExploreCategoryTile
        width={width}
        label="Combos"
        onPress={open}
        icon={comboIcon}
      />
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Combos"
      onPress={open}
      style={{
        width,
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.04)",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        paddingVertical: 16,
        overflow: "hidden",
      }}
    >
      <View style={{ width: EXPLORE_TILE_ICON, height: EXPLORE_TILE_ICON, overflow: "hidden" }}>
        {comboIcon}
      </View>
      <Text style={{ fontFamily: geist.medium, fontSize: 14, color: colors.textPrimary }} numberOfLines={1}>
        Combos
      </Text>
    </Pressable>
  );
}
