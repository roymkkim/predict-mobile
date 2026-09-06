import { useRef } from "react";
import { Dimensions, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { BuildComboButton, BUILD_COMBO_BUTTON_HEIGHT, BUILD_COMBO_STACK_GAP } from "@/components/sim/BuildComboButton";
import { colors } from "@/lib/sim/colors";
import { outcomeButtonVisual } from "@/lib/sim/buttonStyle";
import { useBetRadius } from "@/lib/sim/pillButtonsStore";
import { useCombinationsVisible } from "@/lib/sim/combinationsStore";
import { useComboFlow } from "@/lib/sim/comboFlowStore";
import { setComboMorphReturnTarget } from "@/lib/sim/comboMorphStore";
import { geist } from "@/lib/sim/geistFonts";

export type MarketAction = {
  key: string;
  label: string;
  color: string;
  textColor?: string;
  onPress: () => void;
};

export const MARKET_ACTION_BUTTON_HEIGHT = 48;
export const MARKET_ACTION_FOOTER_BOTTOM_EXTRA = 40;
export const BUILD_COMBO_FOOTER_GAP = BUILD_COMBO_STACK_GAP;

// Height reserved in a detail ScrollView when this bar is fixed:
// 20px top fade + 48px button + 40px requested bottom breathing room + 12px
// separation so the last scrollable content never tucks under the bar.
export const MARKET_ACTION_FOOTER_SPACE = 120;
export const MARKET_ACTION_FOOTER_SPACE_WITH_COMBO =
  MARKET_ACTION_FOOTER_SPACE + BUILD_COMBO_FOOTER_GAP + BUILD_COMBO_BUTTON_HEIGHT;

export function marketActionFooterSpace(withCombo: boolean): number {
  return withCombo ? MARKET_ACTION_FOOTER_SPACE_WITH_COMBO : MARKET_ACTION_FOOTER_SPACE;
}

export { BUILD_COMBO_BUTTON_HEIGHT };

export const MARKET_ACTION_FOOTER_PAD_H = 16;

/** Window frame of the footer Build a Combo row (padding 16, 40px below). */
export function marketActionComboButtonFrame(
  windowWidth: number,
  windowHeight: number,
  bottomInset: number,
  radius = 12,
): {
  x: number;
  y: number;
  width: number;
  height: number;
  windowWidth: number;
  windowHeight: number;
  radius: number;
} {
  const padBottom = bottomInset + MARKET_ACTION_FOOTER_BOTTOM_EXTRA;
  return {
    x: MARKET_ACTION_FOOTER_PAD_H,
    y: windowHeight - padBottom - BUILD_COMBO_BUTTON_HEIGHT,
    width: windowWidth - MARKET_ACTION_FOOTER_PAD_H * 2,
    height: BUILD_COMBO_BUTTON_HEIGHT,
    windowWidth,
    windowHeight,
    radius,
  };
}

function ComboReturnSlot({ radius }: { radius: number }) {
  const wrapRef = useRef<View>(null);
  const publish = () => {
    wrapRef.current?.measureInWindow((x, y, width, height) => {
      if (width <= 0 || height <= 0) return;
      const win = Dimensions.get("window");
      if (x + width < 0 || y + height < 0) return;
      if (x > win.width || y > win.height) return;
      setComboMorphReturnTarget({
        x,
        y,
        width,
        height,
        windowWidth: win.width,
        windowHeight: win.height,
        radius,
      });
    });
  };

  return (
    <View
      ref={wrapRef}
      collapsable={false}
      onLayout={publish}
      pointerEvents="none"
      style={{ height: BUILD_COMBO_BUTTON_HEIGHT, alignSelf: "stretch" }}
    />
  );
}

export function MarketActionFooter({
  actions,
  bottomInset = 0,
  showBuildCombo = false,
}: {
  actions: MarketAction[];
  bottomInset?: number;
  showBuildCombo?: boolean;
}) {
  const betRadius = useBetRadius();
  const combosOn = useCombinationsVisible();
  const comboFlow = useComboFlow();
  const comboTrigger = showBuildCombo && combosOn;
  const actionRadius = betRadius === 999 ? 999 : 12;
  const comboRadius = actionRadius === 999 ? 24 : 12;
  // Combo mode: moneyline CTAs live in the Moneyline card. Keep this footer
  // mounted as the cart morph return slot — do not render the filled pair.
  const hidePrimaryCtas = comboFlow;

  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 20,
        gap: comboTrigger && !hidePrimaryCtas ? BUILD_COMBO_FOOTER_GAP : 0,
        paddingHorizontal: MARKET_ACTION_FOOTER_PAD_H,
        paddingTop: hidePrimaryCtas ? 0 : 20,
        paddingBottom: bottomInset + MARKET_ACTION_FOOTER_BOTTOM_EXTRA,
        overflow: "visible",
      }}
      testID="market-action-footer"
    >
      {hidePrimaryCtas ? null : (
        <LinearGradient
          pointerEvents="none"
          colors={["transparent", colors.bg, colors.bg]}
          locations={[0, 0.42, 1]}
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        />
      )}
      {hidePrimaryCtas ? null : (
        <View style={{ flexDirection: "row", gap: 10 }}>
          {actions.map((action) => {
            const visual = outcomeButtonVisual("default", "gray-colored", action.color, { mode: "fill", label: action.label });
            return (
              <Pressable
                key={action.key}
                onPress={action.onPress}
                accessibilityRole="button"
                style={{
                  flex: 1,
                  height: MARKET_ACTION_BUTTON_HEIGHT,
                  borderRadius: actionRadius,
                  alignItems: "center",
                  justifyContent: "center",
                  ...visual.container,
                }}
                testID={`market-action-${action.key}`}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: geist.semibold,
                    fontSize: 15,
                    ...visual.text,
                  }}
                >
                  {action.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
      {comboTrigger ? (
        comboFlow ? <ComboReturnSlot radius={comboRadius} /> : <BuildComboButton radius={comboRadius} />
      ) : null}
    </View>
  );
}
