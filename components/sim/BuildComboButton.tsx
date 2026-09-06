import { useRef } from "react";
import { Dimensions, Platform, Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { useRouter } from "expo-router";

import { ComboGradientText, ComboOuterGradientStroke } from "@/components/sim/ComboGradient";
import { ComboMark } from "@/components/sim/ComboMark";
import { colors } from "@/lib/sim/colors";
import { enterComboFlow, useComboFlow } from "@/lib/sim/comboFlowStore";
import { openComboCartSlip } from "@/lib/sim/comboAffordanceStore";
import { useCombinationsVisible } from "@/lib/sim/combinationsStore";
import { setComboMorphOrigin } from "@/lib/sim/comboMorphStore";
import { geist } from "@/lib/sim/geistFonts";

export const BUILD_COMBO_BUTTON_HEIGHT = 48;
export const BUILD_COMBO_LABEL = "Build a Combo";
/** Vertical space between primary outcome buttons and the Build a Combo CTA. */
export const BUILD_COMBO_STACK_GAP = 12;

export function enterComboModeFromView(view: View | null, enter: () => void, radius = 12): void {
  if (!view) {
    enter();
    return;
  }
  view.measureInWindow((x, y, width, height) => {
    const win = Dimensions.get("window");
    if (width > 0 && height > 0) {
      setComboMorphOrigin(
        {
          x,
          y,
          width,
          height,
          windowWidth: win.width,
          windowHeight: win.height,
          radius,
        },
        { rememberReturn: true },
      );
    }
    enter();
  });
}

export function BuildComboButton({
  label = BUILD_COMBO_LABEL,
  radius = 12,
  fullWidth = true,
  style,
  onPress,
}: {
  label?: string;
  radius?: number;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const router = useRouter();
  const wrapRef = useRef<View>(null);
  const comboFlow = useComboFlow();
  if (comboFlow) return null;

  return (
    <View
      ref={wrapRef}
      collapsable={false}
      style={[{ alignSelf: fullWidth ? "stretch" : "center", position: "relative", overflow: "visible" }, style]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => {
          enterComboModeFromView(wrapRef.current, () => {
            enterComboFlow();
            openComboCartSlip();
            if (onPress) {
              onPress();
              return;
            }
            router.setParams({ combo: "1" });
          }, radius);
        }}
        style={{
          height: BUILD_COMBO_BUTTON_HEIGHT,
          borderRadius: radius,
          overflow: "hidden",
          position: "relative",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingHorizontal: 18,
          backgroundColor: colors.surface,
          borderWidth: 0,
          zIndex: 1,
          ...(Platform.OS === "web"
            ? ({
                cursor: "pointer",
                boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
              } as Record<string, string>)
            : null),
        }}
      >
        <View
          style={{
            zIndex: 2,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <ComboMark size={16} gradient padded={false} />
          <ComboGradientText style={{ fontFamily: geist.medium, fontSize: 15, lineHeight: 20 }}>
            {label}
          </ComboGradientText>
        </View>
      </Pressable>
      <ComboOuterGradientStroke radius={radius} />
    </View>
  );
}

/** Outcome-row + Build a Combo stack for combo game cards (not home/feed). */
export function CardBuildComboButton({
  radius = 12,
  showBuildCombo = false,
}: {
  radius?: number;
  showBuildCombo?: boolean;
}) {
  const combosOn = useCombinationsVisible();
  const comboFlow = useComboFlow();
  if (!showBuildCombo || !combosOn || comboFlow) return null;
  return <BuildComboButton radius={radius} style={{ marginTop: BUILD_COMBO_STACK_GAP }} />;
}
