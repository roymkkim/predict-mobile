import { Image, Pressable, Text, View, type ImageSourcePropType } from "react-native";

import { isCented, isSelfAuthor, openSocialProfile, profileFor } from "@/lib/sim/socialProfiles";
import { toggleFollow, useFollowing } from "@/lib/sim/socialFollowStore";
import { geist } from "@/lib/sim/geistFonts";
import { TourAnchor } from "@/components/sim/TourAnchor";

export type SocialAvatarSize = "sm" | "md" | "lg";

const SIZE_PX: Record<SocialAvatarSize, number> = {
  sm: 24,
  md: 40,
  lg: 88,
};

const CHARACTERS: ImageSourcePropType[] = [
  require("@/assets/images/social-avatars/characters/frozen.png"),
  require("@/assets/images/social-avatars/characters/vr.png"),
  require("@/assets/images/social-avatars/characters/royal.png"),
  require("@/assets/images/social-avatars/characters/agent.png"),
  require("@/assets/images/social-avatars/characters/cannibal.png"),
  require("@/assets/images/social-avatars/characters/astro.png"),
  require("@/assets/images/social-avatars/characters/zombie.png"),
  require("@/assets/images/social-avatars/characters/superhero.png"),
  require("@/assets/images/social-avatars/characters/fox.png"),
  require("@/assets/images/social-avatars/characters/duck.png"),
  require("@/assets/images/social-avatars/characters/frog.png"),
];

const FOX = require("@/assets/images/social-avatars/characters/fox.png") as ImageSourcePropType;
const FOX_BG = "#CCE7FF";

// Sampled from the circular Property_1_* swatches.
const BACKGROUNDS = [
  "#BAF24A",
  "#FFFFFF",
  "#D075FF",
  "#89B0FF",
  "#FFD2D5",
  "#CCE7FF",
  "#C8CEDA",
  "#E5FFC3",
  "#EAC2FF",
  "#FFD957",
  "#FFF5D5",
  "#FFA1AA",
] as const;

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

function plusSize(px: number): number {
  if (px >= 72) return 22;
  if (px >= 36) return 16;
  return 12;
}

export function SocialAvatar({
  seed,
  size = "md",
  showPlus,
  tappable = false,
  tourAnchor = false,
}: {
  seed: string;
  size?: SocialAvatarSize;
  showPlus?: boolean;
  tappable?: boolean;
  tourAnchor?: boolean;
}) {
  const h = hashSeed(seed);
  const pinFox = isCented(seed);
  const character = pinFox ? FOX : CHARACTERS[h % CHARACTERS.length];
  const background = pinFox ? FOX_BG : BACKGROUNDS[(Math.floor(h / CHARACTERS.length) + h * 5) % BACKGROUNDS.length];
  const px = SIZE_PX[size];
  const profileId = profileFor(seed).id;
  const following = useFollowing(profileId);
  const plus = showPlus ?? (size === "md" && tappable && !isSelfAuthor(seed) && !following);
  const badge = plusSize(px);

  const openProfile = () => openSocialProfile(seed);
  const onPlus = () => {
    toggleFollow(profileId);
  };

  const face = (
    <View
      style={{
        width: px,
        height: px,
        borderRadius: px / 2,
        overflow: "hidden",
        backgroundColor: background,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Image source={character} style={{ width: px, height: px }} resizeMode="contain" />
    </View>
  );

  const shell = (
    <View style={{ width: px, height: px }}>
      {tappable ? (
        <Pressable onPress={openProfile} accessibilityRole="button" accessibilityLabel={`${seed} profile`}>
          {face}
        </Pressable>
      ) : (
        face
      )}
      {plus ? (
        <Pressable
          onPress={tappable ? onPlus : openProfile}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel={`Follow ${seed}`}
          style={{
            position: "absolute",
            right: -2,
            bottom: -2,
            width: badge,
            height: badge,
            borderRadius: badge / 2,
            backgroundColor: "#1A1A1E",
            borderWidth: 1.5,
            borderColor: "#0A0A0C",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontFamily: geist.bold, fontSize: badge * 0.7, lineHeight: badge, marginTop: -1 }}>
            +
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
  if (tourAnchor) {
    return <TourAnchor id="tour-avatar">{shell}</TourAnchor>;
  }
  return shell;
}
