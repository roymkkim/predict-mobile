import { Animated, Image, Text, View } from "react-native";
import type { ImageSourcePropType } from "react-native";
import Svg, { Path, Polygon } from "react-native-svg";
import { bgForWhiteText, colors, marketAccentColor } from "@/lib/sim/colors";
import { getBreathOpacity } from "@/lib/sim/breath";
import type { Team } from "@/lib/sim/types";
import { geist } from "@/lib/sim/geistFonts";

// Shared live-indicator size used by cards and detail headers.
export const LIVE_DOT_SIZE = 8;
export const LIVE_DOT_TEXT_GAP = 6;

const BASEBALL_MITT = require("@/assets/figmaAssets/baseball-mitt.png");
const MITT_TINT_OPACITY = 0.88;
const MITT_DETAIL_OPACITY = 0.28;

// Sports that get a dedicated avatar under the "Icons" team-avatar style.
// Football uses the custom helmet mark; basketball uses a sneaker glyph and
// baseball uses the provided white mitt. Other sports fall back to the normal
// acronym tile.
export const ICON_AVATAR_SPORTS = new Set(["americanFootball", "basketball", "baseball"]);

function flagSource(flag: string) {
  return { uri: flag.startsWith("http") ? flag : `https://flagcdn.com/w80/${flag}.png` };
}

// Team-colored baseball mitt that keeps the source asset's stitching, shading,
// and cutouts visible: a colorized silhouette sits under a low-opacity original
// detail pass instead of replacing the image with a flat tint.
export function BaseballMitt({
  team,
  size,
  flip = false,
}: {
  team: Team;
  size: number;
  flip?: boolean;
}) {
  const color = marketAccentColor(team.color);
  const imageStyle = { width: size, height: size } as const;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        // The source mitt opens to the left, so the left/home avatar is
        // flipped inward while the right/away avatar keeps source orientation.
        transform: flip ? undefined : [{ scaleX: -1 }],
      }}
    >
      <Image
        source={BASEBALL_MITT}
        resizeMode="contain"
        tintColor={color}
        style={[imageStyle, { opacity: MITT_TINT_OPACITY }]}
      />
      <Image
        source={BASEBALL_MITT}
        resizeMode="contain"
        style={[imageStyle, { position: "absolute", opacity: MITT_DETAIL_OPACITY }]}
      />
    </View>
  );
}

// Team identity mark. `avatar` variant keeps the neutral placeholder (or a flag
// when preferFlag is set and the team has one). `logo` renders the actual team
// logo contained inside the fixed avatar frame. Every avatar keeps its caller's
// exact size so 32px and 40px card variants do not grow or crop unexpectedly.
export function Crest({
  team,
  size,
  radius,
  variant = "logo",
  preferFlag = false,
  iconSport,
  flip = false,
}: {
  team: Team;
  size: number;
  radius: number;
  variant?: "logo" | "avatar";
  preferFlag?: boolean;
  iconSport?: string;
  flip?: boolean;
}) {
  const box = { width: size, height: size, borderRadius: radius } as const;
  const backing = {
    ...box,
    backgroundColor: colors.surface2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  } as const;

  const imageMark = (source: { uri: string }) => (
    <View style={backing}>
      <Image source={source} style={{ width: size, height: size }} resizeMode="cover" />
    </View>
  );
  const logoMark = (source: { uri: string }) => (
    <View
      style={{
        ...box,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Image source={source} style={{ width: size, height: size }} resizeMode="contain" />
    </View>
  );

  if (preferFlag && team.flag) return imageMark(flagSource(team.flag));
  if (team.logo) return logoMark({ uri: team.logo });
  if (team.flag) return imageMark(flagSource(team.flag));

  if (variant === "avatar") {
    return <View style={backing} />;
  }

  return (
    <View style={[box, { backgroundColor: bgForWhiteText(team.color), alignItems: "center", justifyContent: "center" }]}>
      <Text style={{ fontFamily: geist.bold, fontSize: 12, color: colors.textPrimary }}>
        {team.initial}
      </Text>
    </View>
  );
}

// American-football helmet mark: a rounded-square avatar (matching the other
// crests) holding a helmet glyph whose shell is tinted to the team color, with a
// white facemask for contrast. Used for football matches when the "Icons" team
// avatar style is selected.
export function HelmetMark({
  size,
  color,
  flip = false,
}: {
  size: number;
  color: string;
  flip?: boolean;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        transform: flip ? [{ scaleX: -1 }] : undefined,
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M27.2678 23.3477H36.9074C38.6148 23.3478 39.9991 24.7321 39.9992 26.4395V34.3408C39.9991 36.0482 38.6148 37.4325 36.9074 37.4326H34.5705C33.4493 37.4324 32.4161 36.8251 31.8703 35.8457L28.5207 29.832H21.7063V27.7705H27.3723L21.7668 17.708L23.5686 16.7061L27.2678 23.3477ZM30.8801 29.832L33.6711 34.8418C33.8529 35.1682 34.1969 35.3709 34.5705 35.3711H36.9074C37.4765 35.371 37.9386 34.9099 37.9387 34.3408V29.832H30.8801ZM29.7316 27.7705H37.9387V26.4395C37.9385 25.8705 37.4764 25.4083 36.9074 25.4082H28.4162L29.7316 27.7705Z"
          fill="#fff"
        />
        <Path
          d="M2.66583 11.1403C9.80542 -0.512264 26.7901 -0.346492 33.7008 11.4432L34.3731 12.5886C34.8426 13.3899 34.438 14.4198 33.5488 14.688L24.6789 17.3642C21.8122 18.2292 20.456 21.5024 21.8709 24.1416L26.2993 32.4025C27.4932 34.6294 25.8802 37.3249 23.3535 37.325H6.71177C5.91748 37.325 5.20157 36.845 4.90015 36.1102L1.3514 27.4538C-0.835889 22.1174 -0.347139 16.058 2.66583 11.1403ZM14.9375 23.0969C13.4949 23.0969 12.325 24.2661 12.3247 25.7086C12.3247 27.1513 13.4948 28.3213 14.9375 28.3213C16.3802 28.3213 17.5492 27.1513 17.5492 25.7086C17.549 24.2661 16.3801 23.0969 14.9375 23.0969Z"
          fill={color}
        />
      </Svg>
    </View>
  );
}

// Real athlete headshot avatar. The source is a portrait (taller than wide), so
// to keep the face we render the image at the avatar's full width with its
// natural height (size * aspect) pinned to the TOP of a square clip window — the
// bottom (torso) is cropped off rather than the head. Same rounded-square shape
// as the team crests for visual consistency.
export function PhotoAvatar({
  source,
  aspect,
  size,
  radius,
}: {
  source: ImageSourcePropType;
  aspect: number;
  size: number;
  radius: number;
}) {
  return (
    <View style={{ width: size, height: size, borderRadius: radius, overflow: "hidden", backgroundColor: colors.surface2 }}>
      <Image
        source={source}
        style={{ position: "absolute", top: 0, left: 0, width: size, height: size * Math.max(aspect, 1) }}
        resizeMode="cover"
      />
    </View>
  );
}

// Draw outcome mark: a rounded square split diagonally from top-right to
// bottom-left, so one half carries the first team's color and the other half the
// second team's. Used in StandardCard's draw row in place of a single team crest.
export function DrawCrest({
  colorA,
  colorB,
  size,
  radius,
}: {
  colorA: string;
  colorB: string;
  size: number;
  radius: number;
}) {
  return (
    <View style={{ width: size, height: size, borderRadius: radius, overflow: "hidden" }}>
      <Svg width={size} height={size}>
        {/* diagonal runs top-right (size,0) -> bottom-left (0,size) */}
        <Polygon points={`0,0 ${size},0 0,${size}`} fill={colorA} />
        <Polygon points={`${size},0 ${size},${size} 0,${size}`} fill={colorB} />
      </Svg>
    </View>
  );
}

// Live dot: a solid dot that, when `pulse` is on, slowly blinks (fades down and
// back up) like a "recording" indicator. One timing cycle drives a full
// bright -> dim -> bright blink via a triangular opacity interpolation.
export function LiveDot({
  color,
  size = LIVE_DOT_SIZE,
  pulse = true,
}: {
  color: string;
  size?: number;
  pulse?: boolean;
}) {
  // Breathe on the shared 4s envelope (fade in 1s / hold 1s / fade out 1s / hold
  // out 1s). The dot LEADS — the border glow breathes on the same envelope but
  // trails this by GLOW_LAG_MS (see breath.ts).
  const opacity = pulse ? getBreathOpacity() : 1;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity,
        }}
      />
    </View>
  );
}

// Shared two-line live status used by score strips and live-game cards.
// Keeping the detail in the same centered column as the badge prevents the
// dot + LIVE row from visually drifting when the detail has a different width.
export function LiveStatusStamp({
  detail,
  color = colors.green,
  detailColor = colors.textMuted,
}: {
  detail: string;
  color?: string;
  detailColor?: string;
}) {
  return (
    <View style={{ alignSelf: "center", alignItems: "center", justifyContent: "center" }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            position: "absolute",
            left: -(LIVE_DOT_SIZE + LIVE_DOT_TEXT_GAP),
            width: LIVE_DOT_SIZE,
            height: 16,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LiveDot color={color} size={LIVE_DOT_SIZE} />
        </View>
        <Text
          style={{
            fontFamily: geist.semibold,
            fontSize: 12,
            lineHeight: 16,
            letterSpacing: 0.4,
            color,
            textAlign: "center",
          }}
        >
          LIVE
        </Text>
      </View>
      <Text
        numberOfLines={1}
        style={{
          marginTop: 1,
          textAlign: "center",
          fontFamily: geist.regular,
          fontSize: 12,
          lineHeight: 16,
          color: detailColor,
        }}
      >
        {detail}
      </Text>
    </View>
  );
}
