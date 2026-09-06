import { Image, type StyleProp, type ImageStyle } from "react-native";

const GEAR = require("@/assets/images/settings-gear.png");

/** User-provided 24×24 settings gear (white glyph, transparent ground). */
export function SettingsGear({
  size = 24,
  color = "#ffffff",
  style,
}: {
  size?: number;
  color?: string;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={GEAR}
      accessibilityIgnoresInvertColors
      style={[{ width: size, height: size, tintColor: color }, style]}
    />
  );
}
