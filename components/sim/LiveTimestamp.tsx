import { Text, View } from "react-native";

import { colors } from "@/lib/sim/colors";
import { useThemeMode } from "@/lib/sim/dsModeStore";
import { LIVE_DOT_SIZE, LIVE_DOT_TEXT_GAP, LiveDot } from "./Crest";
import { geist } from "@/lib/sim/geistFonts";

export type LiveTimestampVariant = "linear" | "stacked";

export function LiveTimestamp({
  descriptor,
  variant = "linear",
  liveColor = colors.greenOutline,
  descriptorColor = colors.textMuted,
  fontSize = 12,
  align = "left",
  // Normal LIVE timestamps should breathe by default. Scorer callouts pass
  // pulse={false} explicitly so their separate callout lifecycle stays stable.
  pulse = true,
  uppercaseDescriptor = false,
  showLiveLabel = true,
}: {
  descriptor: string;
  variant?: LiveTimestampVariant;
  liveColor?: string;
  descriptorColor?: string;
  fontSize?: number;
  align?: "left" | "center";
  pulse?: boolean;
  uppercaseDescriptor?: boolean;
  showLiveLabel?: boolean;
}) {
  // The palette is mutable; subscribe here so the text/alternative descriptor
  // follows the active dark/light design-token value even when this component
  // is rendered outside a feed card.
  useThemeMode();
  const descriptorText = uppercaseDescriptor ? descriptor.toUpperCase() : descriptor;
  const lineHeight = variant === "stacked" ? fontSize + 4 : Math.max(fontSize + 6, 20);
  const centered = align === "center";

  if (variant === "stacked") {
    const textAlign = centered ? "center" : "left";
    return (
      <View style={{ alignItems: centered ? "center" : "flex-start", justifyContent: "center" }}>
        <View style={{ alignItems: centered ? "center" : "flex-start" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {showLiveLabel ? (
              <View
                style={{
                  position: "absolute",
                  left: -(LIVE_DOT_SIZE + LIVE_DOT_TEXT_GAP),
                  width: LIVE_DOT_SIZE,
                  height: lineHeight,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <LiveDot color={liveColor} size={LIVE_DOT_SIZE} pulse={pulse} />
              </View>
            ) : null}
            {showLiveLabel ? (
              <Text
                style={{ fontFamily: geist.semibold, fontSize, lineHeight, color: liveColor, textAlign }}
                numberOfLines={1}
              >
                LIVE
              </Text>
            ) : null}
          </View>
          <Text
            style={{ marginTop: 1, fontFamily: geist.medium, fontSize, lineHeight, color: descriptorColor, textAlign }}
            numberOfLines={1}
          >
            {descriptorText}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: LIVE_DOT_TEXT_GAP, justifyContent: centered ? "center" : "flex-start" }}>
      <LiveDot color={liveColor} size={LIVE_DOT_SIZE} pulse={pulse} />
      {showLiveLabel ? (
        <Text style={{ fontFamily: geist.semibold, fontSize, lineHeight, color: liveColor }} numberOfLines={1}>
          LIVE
        </Text>
      ) : null}
      <Text style={{ fontFamily: geist.medium, fontSize, lineHeight, color: descriptorColor }} numberOfLines={1}>
        {descriptorText}
      </Text>
    </View>
  );
}