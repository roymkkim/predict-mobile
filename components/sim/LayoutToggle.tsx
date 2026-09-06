import { Pressable, Text, View } from "react-native";
import { colors } from "@/lib/sim/colors";
import type { MatchLayout } from "@/lib/sim/types";
import { geist } from "@/lib/sim/geistFonts";
import { SEGMENTED_THUMB_RADIUS, SEGMENTED_TRACK_RADIUS } from "@/components/sim/SegmentedControl";

// Compact segmented toggle pinned above the nav header. Keeps the same three
// card-variant semantics as Settings.
const OPTIONS: { value: MatchLayout; label: string }[] = [
  { value: "versus", label: "Versus" },
  { value: "standard", label: "Standard" },
  { value: "mixed", label: "Mixed" },
];

export function LayoutToggle({
  value,
  onChange,
}: {
  value: MatchLayout;
  onChange: (m: MatchLayout) => void;
}) {
  return (
    <View style={{ alignItems: "center", paddingTop: 8, paddingBottom: 4, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: "row", backgroundColor: colors.surface, borderRadius: SEGMENTED_TRACK_RADIUS, padding: 3 }}>
        {OPTIONS.map((opt) => {
          const selected = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: SEGMENTED_THUMB_RADIUS,
                backgroundColor: selected ? colors.surface2 : "transparent",
              }}
            >
              <Text
                style={{
                  fontFamily: selected ? geist.semibold : geist.medium,
                  fontSize: 12,
                  color: selected ? colors.textPrimary : colors.textMuted,
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
