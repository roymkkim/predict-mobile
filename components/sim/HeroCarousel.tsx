import { useState, type ReactNode } from "react";
import { Image, Pressable, ScrollView, Text, View, type ImageSourcePropType } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { colors } from "@/lib/sim/colors";
import { useFeedSettings } from "@/lib/sim/FeedSettingsContext";
import { useTennisHidden } from "@/lib/sim/tennisHiddenStore";
import { HeroChartBanner } from "./HeroChartBanner";
import { geist } from "@/lib/sim/geistFonts";

// Native port of predict-simulator-2's BannerCarousel: a horizontally swipeable
// row of banner-style hero items — a Wimbledon and a World Cup 2026 promo (plus
// the dismissible position notice). Each promo renders either as a row "card"
// (square art + text) or, per the `heroBannerStyle` setting, as a full-bleed
// "image" banner with the title overlaid bottom-left. Presentational.

const worldCupImg = require("@/assets/figmaAssets/sim-worldcup-hero.png");
const wimbledonImg = require("@/assets/figmaAssets/sim-wimbledon-hero.png");
const worldCupBanner = require("@/assets/figmaAssets/worldcup-banner.jpg");
const wimbledonBanner = require("@/assets/figmaAssets/wimbledon-banner.jpg");

type Banner = {
  id: string;
  title: string;
  subtitle: string;
  markets: number;
  image?: ImageSourcePropType;
  heroImage?: ImageSourcePropType;
  logo?: { num: string; word: string; colors: [string, string] };
};

const PROMO: Record<string, Banner> = {
  wimbledon: {
    id: "wimbledon",
    title: "Wimbledon 2026",
    subtitle: "Every match, every set.",
    markets: 6,
    image: wimbledonImg,
    heroImage: wimbledonBanner,
  },
  "world-cup": {
    id: "world-cup",
    title: "World Cup 2026",
    subtitle: "Trade every match, every moment.",
    markets: 16,
    image: worldCupImg,
    heroImage: worldCupBanner,
  },
};

// The BTC chart banner that rides in the carousel alongside the Wimbledon /
// World Cup hero banners: an animated chart card (HeroChartBanner) themed in
// Bitcoin orange with a live 24-hour reset countdown.
const BTC_BANNER = {
  title: "BTC daily: above or below target price",
  detail: "Resets every 24 hours",
  accent: colors.bitcoin,
  countdownSeconds: 86400,
};

// Square 78px banner art: the supplied image, or a gradient num/word logo tile.
function BannerLogo({ banner }: { banner: Banner }) {
  if (banner.image) {
    return <Image source={banner.image} style={{ width: 78, height: 78, borderRadius: 12 }} resizeMode="cover" />;
  }
  const logo = banner.logo!;
  return (
    <LinearGradient
      colors={logo.colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: 78, height: 78, borderRadius: 12, alignItems: "center", justifyContent: "center" }}
    >
      <Text style={{ fontFamily: geist.bold, fontSize: 24, color: "#fff", letterSpacing: -0.5 }}>{logo.num}</Text>
      <Text style={{ fontFamily: geist.semibold, fontSize: 9, color: "#fff", letterSpacing: 1.6, marginTop: 4 }}>{logo.word}</Text>
    </LinearGradient>
  );
}

function BannerCard({ width, minHeight, children }: { width: number; minHeight?: number; children: ReactNode }) {
  return (
    <View
      style={{
        width,
        minHeight,
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        padding: 16,
        backgroundColor: colors.surface,
      }}
    >
      {children}
    </View>
  );
}

function PromoBanner({ banner, width, onPress }: { banner: Banner; width: number; onPress?: () => void }) {
  const inner = (
    <BannerCard width={width}>
      <BannerLogo banner={banner} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontFamily: geist.medium, fontSize: 16, lineHeight: 24, color: "#fff" }} numberOfLines={1}>
          {banner.title}
        </Text>
        <Text style={{ fontFamily: geist.regular, fontSize: 14, lineHeight: 18, color: colors.textMuted, marginTop: 2 }} numberOfLines={2}>
          {banner.subtitle}
        </Text>
      </View>
    </BannerCard>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}>
        {inner}
      </Pressable>
    );
  }
  return inner;
}

// Full-bleed hero image banner: the art fills the card and the title sits
// bottom-left (16px left+bottom padding) directly over the image (no scrim).
// Height is derived from the known card width and the source art's
// 320x200 (1.6:1) ratio so the Image is never stretched.
function HeroImageBanner({ banner, width, onPress }: { banner: Banner; width: number; onPress?: () => void }) {
  const height = Math.round(width * (200 / 320));
  const inner = (
    <View
      style={{
        width,
        height,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: colors.surface,
        justifyContent: "flex-end",
      }}
    >
      <Image
        source={banner.heroImage ?? banner.image!}
        style={{ position: "absolute", top: 0, left: 0, width, height }}
        resizeMode="cover"
      />
      <View style={{ paddingLeft: 16, paddingBottom: 16 }}>
        <Text style={{ fontFamily: geist.semibold, fontSize: 16, lineHeight: 20, color: "#fff" }} numberOfLines={2}>
          {banner.title}
        </Text>
        <Text
          style={{ fontFamily: geist.regular, fontSize: 14, lineHeight: 18, color: "rgba(255,255,255,0.85)", marginTop: 2 }}
          numberOfLines={1}
        >
          {banner.markets} {banner.markets === 1 ? "market" : "markets"}
        </Text>
      </View>
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}>
        {inner}
      </Pressable>
    );
  }
  return inner;
}

// Outlined info "i" glyph (from the supplied icon asset), shown on its own (no
// tile) on the dismissible "Position confirmed" banner.
function InfoIcon({ size = 20, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 22" fill="none">
      <Path
        d="M9.16669 16.1667H10.8334V11.1667H9.16669V16.1667ZM10 9.5C10.2361 9.5 10.434 9.42014 10.5938 9.26042C10.7535 9.1007 10.8334 8.90278 10.8334 8.66667C10.8334 8.43056 10.7535 8.23264 10.5938 8.07292C10.434 7.9132 10.2361 7.83334 10 7.83334C9.76391 7.83334 9.56599 7.9132 9.40627 8.07292C9.24655 8.23264 9.16669 8.43056 9.16669 8.66667C9.16669 8.90278 9.24655 9.1007 9.40627 9.26042C9.56599 9.42014 9.76391 9.5 10 9.5ZM10 20.3333C8.84724 20.3333 7.76391 20.1146 6.75002 19.6771C5.73613 19.2396 4.85419 18.6458 4.10419 17.8958C3.35419 17.1458 2.76044 16.2639 2.32294 15.25C1.88544 14.2361 1.66669 13.1528 1.66669 12C1.66669 10.8472 1.88544 9.76389 2.32294 8.75C2.76044 7.73612 3.35419 6.85417 4.10419 6.10417C4.85419 5.35417 5.73613 4.76042 6.75002 4.32292C7.76391 3.88542 8.84724 3.66667 10 3.66667C11.1528 3.66667 12.2361 3.88542 13.25 4.32292C14.2639 4.76042 15.1459 5.35417 15.8959 6.10417C16.6459 6.85417 17.2396 7.73612 17.6771 8.75C18.1146 9.76389 18.3334 10.8472 18.3334 12C18.3334 13.1528 18.1146 14.2361 17.6771 15.25C17.2396 16.2639 16.6459 17.1458 15.8959 17.8958C15.1459 18.6458 14.2639 19.2396 13.25 19.6771C12.2361 20.1146 11.1528 20.3333 10 20.3333ZM10 18.6667C11.8611 18.6667 13.4375 18.0208 14.7292 16.7292C16.0209 15.4375 16.6667 13.8611 16.6667 12C16.6667 10.1389 16.0209 8.56251 14.7292 7.27084C13.4375 5.97917 11.8611 5.33334 10 5.33334C8.13891 5.33334 6.56252 5.97917 5.27085 7.27084C3.97919 8.56251 3.33335 10.1389 3.33335 12C3.33335 13.8611 3.97919 15.4375 5.27085 16.7292C6.56252 18.0208 8.13891 18.6667 10 18.6667Z"
        fill={color}
      />
    </Svg>
  );
}

// Dismissible "Active positions…" notice: a standalone 24x24 icon (no image
// art, no tile) plus a copy column, with a close button in the top-right corner.
// Shared between the hero carousel (fixed width, minHeight=102 to match the
// 78px-art banners) and the inline portfolio-card variant (full width). When
// no `width` is passed it stretches to its parent.
export function PositionNotice({ width, minHeight, onClose }: { width?: number; minHeight?: number; onClose: () => void }) {
  return (
    <View
      style={{
        width,
        minHeight,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: colors.surface,
      }}
    >
      <InfoIcon size={24} color="#fff" />
      <View style={{ flex: 1, minWidth: 0, paddingRight: 20 }}>
        <Text style={{ fontFamily: geist.regular, fontSize: 14, lineHeight: 18, color: colors.textMuted }} numberOfLines={2}>
          Active positions and winnings may take a few moments to update.
        </Text>
      </View>
      <Pressable
        onPress={onClose}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        style={{ position: "absolute", top: 8, right: 8, width: 24, height: 24, alignItems: "center", justifyContent: "center", zIndex: 10 }}
      >
        <Feather name="x" size={18} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

function PositionBanner({ width, onClose }: { width: number; onClose: () => void }) {
  return <PositionNotice width={width} minHeight={102} onClose={onClose} />;
}

// Banner order: the BTC chart banner first, then the Wimbledon hero, then the
// dismissible "Position confirmed" notice, then the World Cup hero.
const BANNERS = ["btc", "wimbledon", "position-confirmed", "world-cup"] as const;

const ROUTES: Record<string, string> = {
  btc: "/crypto",
  wimbledon: "/wimbledon",
  "world-cup": "/worldcup",
};

export function HeroCarousel() {
  const router = useRouter();
  const { density, showPositionBanner, positionBannerPlacement, heroBannerStyle = "image", heroBtcChart = "chevron", heroBtcOrange = false } = useFeedSettings();
  const tennisHidden = useTennisHidden();
  const showPositionInCarousel = showPositionBanner && positionBannerPlacement === "carousel";
  const [vw, setVw] = useState(0);
  const [showPosition, setShowPosition] = useState(true);
  // Match the feed's card gutter (16 comfort / 12 compact), then shrink each
  // banner by `peek` so a slice of the next banner shows past the right edge.
  const gutter = density === "comfort" ? 16 : 12;
  const gap = 8;

  const items = BANNERS.filter(
    (id) =>
      (id !== "position-confirmed" || (showPositionInCarousel && showPosition)) &&
      !(id === "wimbledon" && tennisHidden) &&
      !(id === "btc" && heroBannerStyle === "card"),
  );
  // Only narrow the banners by `peek` (to reveal a slice of the next one) when
  // there is actually a next banner; a lone banner fills the width with just the
  // 16px gutter on each side.
  const peek = items.length > 1 ? 28 : 0;
  const itemW = vw ? vw - gutter * 2 - peek : 0;
  // Snap each banner left-aligned (16px gutter + a peek of the next one), but pin
  // the LAST banner flush-right so it rests with only the gutter (16px) trailing
  // instead of the empty peek gap a uniform interval would leave at the end.
  const contentWidth = gutter * 2 + items.length * itemW + (items.length - 1) * gap;
  const maxScroll = Math.max(0, contentWidth - vw);
  const offsets = items.map((_, i) =>
    i === items.length - 1 ? maxScroll : Math.min(i * (itemW + gap), maxScroll),
  );

  return (
    <View onLayout={(e) => setVw(e.nativeEvent.layout.width)}>
      {itemW > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToOffsets={offsets}
          snapToAlignment="start"
          disableIntervalMomentum
          contentContainerStyle={{ paddingLeft: gutter, paddingRight: gutter, gap }}
        >
          {items.map((id) =>
            id === "position-confirmed" ? (
              <PositionBanner key={id} width={itemW} onClose={() => setShowPosition(false)} />
            ) : id === "btc" ? (
              <HeroChartBanner
                key={id}
                title={BTC_BANNER.title}
                detail={BTC_BANNER.detail}
                countdownSeconds={BTC_BANNER.countdownSeconds}
                accent={BTC_BANNER.accent}
                chartStyle={heroBtcChart}
                orange={heroBtcOrange}
                width={itemW}
                onPress={ROUTES[id] ? () => router.push(ROUTES[id] as never) : undefined}
              />
            ) : heroBannerStyle === "image" ? (
              <HeroImageBanner
                key={id}
                banner={PROMO[id]}
                width={itemW}
                onPress={ROUTES[id] ? () => router.push(ROUTES[id] as never) : undefined}
              />
            ) : (
              <PromoBanner
                key={id}
                banner={PROMO[id]}
                width={itemW}
                onPress={ROUTES[id] ? () => router.push(ROUTES[id] as never) : undefined}
              />
            ),
          )}
        </ScrollView>
      )}
    </View>
  );
}
