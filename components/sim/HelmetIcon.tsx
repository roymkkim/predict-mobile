import { Image, View } from "react-native";

// Tintable football helmet from the uploaded white 3D render
// (assets/images/uxr/helmet.png, transparent background). A flat tintColor
// pass would lose the render's shading, so we stack the white base under a
// tinted copy at partial opacity — the color reads solid while the highlights
// and shadows of the render still show through. `flip` mirrors it so the two
// helmets on a live card can face outward.
const HELMET = require("@/assets/images/uxr/helmet.png");
// White 3D sneaker render for basketball teams — same tinting technique.
const SHOE = require("@/assets/images/uxr/shoe.png");

function TintedIcon({ source, color, size, flip }: { source: number; color: string; size: number; flip: boolean }) {
  return (
    <View style={{ width: size, height: size, transform: [{ scaleX: flip ? -1 : 1 }] }}>
      <Image source={source} style={{ width: size, height: size }} resizeMode="contain" />
      <Image
        source={source}
        tintColor={color}
        style={{ position: "absolute", width: size, height: size, opacity: 0.82 }}
        resizeMode="contain"
      />
    </View>
  );
}

export function HelmetIcon({ color, size = 40, flip = false }: { color: string; size?: number; flip?: boolean }) {
  return <TintedIcon source={HELMET} color={color} size={size} flip={flip} />;
}

export function ShoeIcon({ color, size = 40, flip = false }: { color: string; size?: number; flip?: boolean }) {
  return <TintedIcon source={SHOE} color={color} size={size} flip={flip} />;
}
