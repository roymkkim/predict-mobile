import { Pressable, Text, View } from "react-native";
import { colors } from "@/lib/sim/colors";
import { buttonInteractionStyle, METAMASK_BUTTON_LABEL } from "@/lib/sim/buttonStyle";
import { geist } from "@/lib/sim/geistFonts";

// Old-mode outcome control: a muted percentage label followed by a green "Yes"
// and red "No" pill. Shared by StandardCard (match rows) and OutcomeRows
// (market rows) so the old card style is consistent across card types.
export function YesNoControls({ pctLabel, onYes, onNo }: { pctLabel: string; onYes?: () => void; onNo?: () => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 12, gap: 12 }}>
      <Text style={{ fontFamily: geist.medium, fontSize: 14, color: colors.textMuted }}>{pctLabel}</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable onPress={onYes} style={({ pressed }) => [{ width: 60, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.greenSoft }, buttonInteractionStyle(pressed)]}>
          <Text style={[METAMASK_BUTTON_LABEL, { color: colors.greenOutline }]}>Yes</Text>
        </Pressable>
        <Pressable onPress={onNo} style={({ pressed }) => [{ width: 60, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.redSoft }, buttonInteractionStyle(pressed)]}>
          <Text style={[METAMASK_BUTTON_LABEL, { color: colors.red }]}>No</Text>
        </Pressable>
      </View>
    </View>
  );
}
