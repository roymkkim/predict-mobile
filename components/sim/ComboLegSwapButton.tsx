import React from "react";
import { Pressable } from "react-native";
import { Icon, IconColor, IconName, IconSize } from "@metamask/design-system-react-native";

/** Exclusive-outcome cycle: MMDS SwapHorizontal at Sm (16px), 20×20 hit target. */
export function ComboLegSwapButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Cycle exclusive outcome"
      onPress={onPress}
      hitSlop={8}
      style={{ width: 20, height: 20, alignItems: "center", justifyContent: "center", flexShrink: 0 }}
    >
      <Icon name={IconName.SwapHorizontal} size={IconSize.Sm} color={IconColor.IconAlternative} />
    </Pressable>
  );
}
