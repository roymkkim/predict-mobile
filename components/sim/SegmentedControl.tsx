import { Pressable, Text, View } from "react-native";

import { colors, FILTER_CHIP_INACTIVE_TEXT } from "@/lib/sim/colors";
import { geist } from "@/lib/sim/geistFonts";

// Radius tokens for other compact toggles (layout / bet-mode) that copy this
// geometry without using the capsule market-period control.
export const SEGMENTED_TRACK_RADIUS = 12;
export const SEGMENTED_THUMB_RADIUS = 8;

const CAPSULE_RADIUS = 999;
/** Track sits on `surface` cards: charcoal, slightly lighter than the card. */
const TRACK_BG = colors.surface2;
const TRACK_BORDER = "rgba(226,226,255,0.14)";
/** Active segment: lighter gray pill inside the track. */
const THUMB_BG = "rgba(226,226,255,0.16)";

// Capsule segmented control: charcoal track, lighter-gray selected pill.
export function SegmentedControl({
  options,
  index,
  onIndex,
}: {
  options: string[];
  index: number;
  onIndex: (i: number) => void;
}) {
  return (
    <View
      accessibilityRole="tablist"
      style={{
        alignSelf: "flex-start",
        flexDirection: "row",
        padding: 3,
        borderRadius: CAPSULE_RADIUS,
        backgroundColor: TRACK_BG,
        borderWidth: 1,
        borderColor: TRACK_BORDER,
      }}
    >
      {options.map((label, i) => {
        const active = i === index;
        return (
          <Pressable
            key={label}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onIndex(i)}
            style={{
              height: 32,
              paddingHorizontal: 14,
              borderRadius: CAPSULE_RADIUS,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: active ? THUMB_BG : "transparent",
            }}
          >
            <Text
              style={{
                fontFamily: active ? geist.semibold : geist.medium,
                fontSize: 14,
                lineHeight: 20,
                color: active ? colors.textPrimary : FILTER_CHIP_INACTIVE_TEXT,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
