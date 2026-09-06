// Final UXR category icon assets (user-provided 3D-style renders). Kept in a
// leaf module so both FeedChrome (home carousel) and UxrBrowse (categories
// page) can import them without a cycle. Nascar and E-sports have no asset yet
// and keep their emoji fallback.
import type { ImageSourcePropType } from "react-native";
import type { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { outlinedSportId } from "@/components/sim/MaterialSportsOutline";

export type MaterialIconName = keyof typeof MaterialIcons.glyphMap;
export type MaterialCommunityIconName = keyof typeof MaterialCommunityIcons.glyphMap;

// Sports missing from the classic MaterialIcons set use MaterialCommunityIcons
// instead (checked after the classic map in the rail).
export const UXR_MCI_ICONS: Record<string, MaterialCommunityIconName> = {
  chess: "chess-pawn",
};

/** MLB / baseball tiles: Material outlined sports_baseball, not MCI baseball-outline (globe-like). */
export function isMaterialBaseballIconKey(key: string | undefined): boolean {
  return outlinedSportId(key) === "baseball";
}

// Material-icon equivalents for the same category keys ("Category tiles"
// setting, default). Includes nascar/esports which have no image asset.
export const UXR_MATERIAL_ICONS: Record<string, MaterialIconName> = {
  crypto: "currency-bitcoin",
  politics: "account-balance",
  football: "sports-football",
  nfl: "sports-football",
  basketball: "sports-basketball",
  tennis: "sports-tennis",
  golf: "sports-golf",
  soccer: "sports-soccer",
  nascar: "sports-motorsports",
  motorsports: "sports-motorsports",
  esports: "sports-esports",
  baseball: "sports-baseball",
  combat: "sports-mma",
  cricket: "sports-cricket",
  hockey: "sports-hockey",
  rugby: "sports-rugby",
  tabletennis: "sports-tennis",
  pickleball: "sports-tennis",
  cycling: "directions-bike",
  poker: "casino",
};

export const UXR_ICONS: Record<string, ImageSourcePropType> = {
  crypto: require("@/assets/images/uxr/crypto.png"),
  politics: require("@/assets/images/uxr/politics.png"),
  football: require("@/assets/images/uxr/football.png"),
  nfl: require("@/assets/images/uxr/nfl.png"),
  basketball: require("@/assets/images/uxr/basketball.png"),
  tennis: require("@/assets/images/uxr/tennis.png"),
  golf: require("@/assets/images/uxr/golf.png"),
  soccer: require("@/assets/images/uxr/soccer.png"),
};
