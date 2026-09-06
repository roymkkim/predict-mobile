import { Image, View, type ImageSourcePropType } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "@/lib/sim/colors";
import { comboHeadlineName, resolveComboAvatar } from "@/lib/sim/comboTeamMark";

export const COMBO_LEG_AVATAR = 32;
const AVATAR_RADIUS = 6;

function sourceUri(source: ImageSourcePropType): string {
  if (typeof source === "object" && source != null && !Array.isArray(source) && "uri" in source) {
    return String(source.uri ?? "");
  }
  return "";
}

function avatarFit(source: ImageSourcePropType): {
  mode: "cover" | "contain";
  scale: number;
  backgroundColor: string;
} {
  const uri = sourceUri(source);
  // Official marks: show the full glyph, white chip so transparent PNG padding isn't black.
  if (uri.includes("/teamlogos/")) {
    return { mode: "contain", scale: 1, backgroundColor: "transparent" };
  }
  if (uri.includes("polymarket") || uri.includes("polymarket-upload")) {
    return { mode: "contain", scale: 1, backgroundColor: "transparent" };
  }
  // Flags are landscape — cover fills the square without letterboxing.
  if (uri.includes("flagcdn.com")) {
    return { mode: "cover", scale: 1, backgroundColor: "transparent" };
  }
  // Headshots: slight overscan so baked-in bars don't show.
  return { mode: "cover", scale: 1.18, backgroundColor: "transparent" };
}

export function ComboLegAvatar({
  source,
  pick,
  size = COMBO_LEG_AVATAR,
}: {
  source?: ImageSourcePropType;
  pick: string;
  size?: number;
}) {
  const resolved = resolveComboAvatar(pick, source);
  if (/^draw$/i.test(comboHeadlineName(pick))) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: AVATAR_RADIUS,
          overflow: "hidden",
          backgroundColor: "rgba(255,255,255,0.12)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="contrast" size={Math.round(size * 0.72)} color={colors.textPrimary} />
      </View>
    );
  }
  if (!resolved) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: AVATAR_RADIUS,
          backgroundColor: "rgba(255,255,255,0.08)",
        }}
      />
    );
  }
  const fit = avatarFit(resolved);
  const img = size * fit.scale;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: AVATAR_RADIUS,
        overflow: "hidden",
        backgroundColor: fit.backgroundColor,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Image
        source={resolved}
        style={{
          width: img,
          height: img,
        }}
        resizeMode={fit.mode}
      />
    </View>
  );
}
