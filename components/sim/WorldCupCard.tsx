import { useState } from "react";
import { Image, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "@/lib/sim/colors";
import { geist } from "@/lib/sim/geistFonts";

// "World Cup 2026" promo card: full-width hero image on top, then a dark info
// row with title, subtitle, and a plain chevron on the right.
const heroImg = require("@/assets/figmaAssets/sim-worldcup-hero.png");

export function WorldCupCard() {
  // Measure the card width and drive BOTH the hero width and height from it.
  // RN/Yoga doesn't reliably resolve `aspectRatio`/`stretch` against an Image
  // with an intrinsic size: it left the hero at its 360px natural width (a gap
  // on the right) and the wrong height (cropping the player's legs). Explicit
  // pixel width + height from the measured card width fixes both — the image
  // fills edge-to-edge and `cover` crops only if needed.
  const [cardW, setCardW] = useState(0);
  const heroH = cardW ? (cardW * 177) / 360 : undefined;
  return (
    <View
      onLayout={(e) => setCardW(e.nativeEvent.layout.width)}
      style={{ width: "100%", borderRadius: 16, overflow: "hidden", backgroundColor: colors.surfaceTransparent }}
    >
      <Image
        source={heroImg}
        style={{ width: cardW || "100%", height: heroH, aspectRatio: cardW ? undefined : 360 / 177 }}
        resizeMode="cover"
      />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: geist.semibold, fontSize: 16, lineHeight: 24, color: colors.textPrimary }}>World Cup 2026</Text>
          <Text style={{ fontFamily: geist.regular, fontSize: 14, lineHeight: 20, color: colors.textMuted, marginTop: 2 }}>
            Trade every match, every moment.
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={26} color="#9b9b9b" />
      </View>
    </View>
  );
}
