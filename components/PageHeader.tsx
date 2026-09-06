import React from "react";
import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import {
  FontWeight,
  HeaderStandard,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text as MmText,
  TextVariant,
} from "@metamask/design-system-react-native";

import { colors as simColors } from "@/lib/sim/colors";
import { isComboCapablePath } from "@/lib/sim/comboAffordance";
import { useThemeMode } from "@/lib/sim/dsModeStore";
import { screenTopInset } from "@/lib/sim/layout";
import { geist } from "@/lib/sim/geistFonts";
import { useComboMode } from "@/lib/sim/comboFlowStore";
import { HeaderComboMark } from "@/components/sim/ComboMark";
import { useDisplayFont, useOswaldDataSet } from "@/lib/sim/typefaceStore";

const c = simColors;

function allowComboHeader(pathname: string, sports?: string): boolean {
  return isComboCapablePath(pathname, sports);
}

// Canonical page-back glyph: design-system ArrowLeft at 24×24 (IconSize.Lg).
export function BackIcon({ color }: { size?: number; color?: string } = {}) {
  return (
    <Icon
      name={IconName.ArrowLeft}
      size={IconSize.Lg}
      color={IconColor.IconDefault}
      style={color ? { color } : undefined}
    />
  );
}

export function SearchIcon({ size = 24, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19.6 21L13.3 14.7C12.8 15.1 12.225 15.4167 11.575 15.65C10.925 15.8833 10.2333 16 9.5 16C7.68333 16 6.14583 15.3708 4.8875 14.1125C3.62917 12.8542 3 11.3167 3 9.5C3 7.68333 3.62917 6.14583 4.8875 4.8875C6.14583 3.62917 7.68333 3 9.5 3C11.3167 3 12.8542 3.62917 14.1125 4.8875C15.3708 6.14583 16 7.68333 16 9.5C16 10.2333 15.8833 10.925 15.65 11.575C15.4167 12.225 15.1 12.8 14.7 13.3L21 19.6L19.6 21ZM9.5 14C10.75 14 11.8125 13.5625 12.6875 12.6875C13.5625 11.8125 14 10.75 14 9.5C14 8.25 13.5625 7.1875 12.6875 6.3125C11.8125 5.4375 10.75 5 9.5 5C8.25 5 7.1875 5.4375 6.3125 6.3125C5.4375 7.1875 5 8.25 5 9.5C5 10.75 5.4375 11.8125 6.3125 12.6875C7.1875 13.5625 8.25 14 9.5 14Z"
        fill={color}
      />
    </Svg>
  );
}

export function SlidersIcon({ size = 24, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.75 20.25C16.7 20.25 15.8125 19.8875 15.0875 19.1625C14.3625 18.4375 14 17.55 14 16.5C14 15.45 14.3625 14.5625 15.0875 13.8375C15.8125 13.1125 16.7 12.75 17.75 12.75C18.8 12.75 19.6875 13.1125 20.4125 13.8375C21.1375 14.5625 21.5 15.45 21.5 16.5C21.5 17.55 21.1375 18.4375 20.4125 19.1625C19.6875 19.8875 18.8 20.25 17.75 20.25ZM17.75 18.25C18.2333 18.25 18.6458 18.0792 18.9875 17.7375C19.3292 17.3958 19.5 16.9833 19.5 16.5C19.5 16.0167 19.3292 15.6042 18.9875 15.2625C18.6458 14.9208 18.2333 14.75 17.75 14.75C17.2667 14.75 16.8542 14.9208 16.5125 15.2625C16.1708 15.6042 16 16.0167 16 16.5C16 16.9833 16.1708 17.3958 16.5125 17.7375C16.8542 18.0792 17.2667 18.25 17.75 18.25ZM4 17.5V15.5H12V17.5H4ZM6.25 11.25C5.2 11.25 4.3125 10.8875 3.5875 10.1625C2.8625 9.4375 2.5 8.55 2.5 7.5C2.5 6.45 2.8625 5.5625 3.5875 4.8375C4.3125 4.1125 5.2 3.75 6.25 3.75C7.3 3.75 8.1875 4.1125 8.9125 4.8375C9.6375 5.5625 10 6.45 10 7.5C10 8.55 9.6375 9.4375 8.9125 10.1625C8.1875 10.8875 7.3 11.25 6.25 11.25ZM6.25 9.25C6.73333 9.25 7.14583 9.07917 7.4875 8.7375C7.82917 8.39583 8 7.98333 8 7.5C8 7.01667 7.82917 6.60417 7.4875 6.2625C7.14583 5.92083 6.73333 5.75 6.25 5.75C5.76667 5.75 5.35417 5.92083 5.0125 6.2625C4.67083 6.60417 4.5 7.01667 4.5 7.5C4.5 7.98333 4.67083 8.39583 5.0125 8.7375C5.35417 9.07917 5.76667 9.25 6.25 9.25ZM12 8.5V6.5H20V8.5H12Z"
        fill={color}
      />
    </Svg>
  );
}

export function ChevronDownIcon({ size = 20, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9L12 15L18 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Full-bleed banner header. The width is measured via onLayout and the height
// derived from the artwork's aspect ratio — setting aspectRatio alone mis-sizes
// the image against a 100%-width box on Expo web (see the hero-image gotcha).
function BannerHeader({
  banner,
  aspect,
  showSearch,
  onSearch,
  onBack,
  topInset,
  title,
  subtitle,
}: {
  banner: ImageSourcePropType;
  aspect: number;
  showSearch: boolean;
  onSearch?: () => void;
  onBack: () => void;
  topInset: number;
  title: string;
  subtitle?: string;
}) {
  const [w, setW] = React.useState(0);
  const displayFont = useDisplayFont();
  const oswald = useOswaldDataSet();
  // Full-bleed: the image starts at y=0 and fills the width edge-to-edge, so on
  // iOS the status bar (and the overlaid back/search controls) sit on top of the
  // artwork. The root view drops its top inset for this variant so the image can
  // reach the very top of the screen. The title is overlaid bottom-left (the
  // artwork itself carries no baked-in text).
  return (
    <View
      style={{ width: "100%" }}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
    >
      {w > 0 ? (
        <Image
          source={banner}
          style={{ width: w, height: w / aspect }}
          resizeMode="cover"
        />
      ) : null}
      <Pressable
        style={[styles.bannerBack, { top: topInset + 8 }]}
        onPress={onBack}
        hitSlop={8}
      >
        <BackIcon color="#fff" />
      </Pressable>
      {showSearch && (
        <Pressable
          style={[styles.bannerSearch, { top: topInset + 8 }]}
          onPress={onSearch}
          hitSlop={8}
        >
          <SearchIcon size={24} color="#fff" />
        </Pressable>
      )}
      <View style={styles.bannerTitleWrap} pointerEvents="none">
        <Text {...oswald} style={[styles.bannerTitle, { fontFamily: displayFont }]}>{title}</Text>
        {subtitle ? <Text {...oswald} style={[styles.bannerTitle, { fontFamily: displayFont }]}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

// Hero card header. Same artwork as the full-bleed banner, but presented as a
// rounded card with side margins and an overlaid back button in a translucent
// circle. Width is measured via onLayout (see the hero-image gotcha) so the
// rounded image keeps the artwork's aspect ratio.
function HeroHeader({
  banner,
  aspect,
  showSearch,
  onSearch,
  onBack,
  title,
  subtitle,
}: {
  banner: ImageSourcePropType;
  aspect: number;
  showSearch: boolean;
  onSearch?: () => void;
  onBack: () => void;
  title: string;
  subtitle?: string;
}) {
  const [w, setW] = React.useState(0);
  const displayFont = useDisplayFont();
  const oswald = useOswaldDataSet();
  const insets = useSafeAreaInsets();
  const topInset = screenTopInset(insets.top);
  return (
    <View style={[styles.heroWrap, { paddingTop: topInset + 12 }]}>
      <View
        style={styles.heroCard}
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
      >
        {w > 0 ? (
          <Image
            source={banner}
            style={{ width: w, height: w / aspect }}
            resizeMode="cover"
          />
        ) : null}
        <Pressable style={styles.heroBack} onPress={onBack} hitSlop={8}>
          <BackIcon color="#fff" />
        </Pressable>
        {showSearch && (
          <Pressable style={styles.heroSearch} onPress={onSearch} hitSlop={8} accessibilityRole="button" accessibilityLabel="Search">
            <SearchIcon size={24} color="#fff" />
          </Pressable>
        )}
        <View style={styles.heroTitleWrap} pointerEvents="none">
          <Text {...oswald} style={[styles.bannerTitle, { fontFamily: displayFont }]}>{title}</Text>
          {subtitle ? <Text {...oswald} style={[styles.bannerTitle, { fontFamily: displayFont }]}>{subtitle}</Text> : null}
        </View>
      </View>
    </View>
  );
}

export function PageHeader({
  title,
  subtitle,
  onSearch,
  showSearch = true,
  rightAction,
  variant = "default",
  banner,
  bannerAspectRatio,
  onBack,
  onFilter,
  titleAction,
  comboHeader,
}: {
  title: string;
  subtitle?: string;
  onSearch?: () => void;
  showSearch?: boolean;
  rightAction?: {
    icon: React.ReactNode;
    onPress: () => void;
    accessibilityLabel: string;
  };
  variant?: "default" | "lg" | "banner" | "hero";
  banner?: ImageSourcePropType;
  bannerAspectRatio?: number;
  // Overrides the default router.back() — used by the in-place home category
  // view, where "back" clears the selection instead of popping a route.
  onBack?: () => void;
  onFilter?: () => void;
  titleAction?: {
    onPress: () => void;
    accessibilityLabel: string;
  };
  /** Override combo title chrome. Directories default off via pathname. */
  comboHeader?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { sports } = useLocalSearchParams<{ sports?: string }>();
  const sportsFlag = Array.isArray(sports) ? sports[0] : sports;
  // Subscribe here because the header is shared by every route and its
  // typography/icons need to update when the theme selector changes.
  useThemeMode();
  const displayFont = useDisplayFont();
  const oswald = useOswaldDataSet();
  const comboMode = useComboMode() && (comboHeader ?? allowComboHeader(pathname, sportsFlag));
  const insets = useSafeAreaInsets();
  // On native the real status-bar inset; on Expo web there's no OS status bar so
  // we mimic its height (matching the 56px web offset used by the other headers).
  const topInset = screenTopInset(insets.top);

  // Hero format: the same artwork as the banner, but as a rounded hero card with
  // side margins and an overlaid back button + title. Falls back to the "lg"
  // text header if no banner image is provided.
  if (variant === "hero" && banner) {
    return (
      <HeroHeader
        banner={banner}
        aspect={bannerAspectRatio ?? 393 / 277}
        showSearch={showSearch}
        onSearch={onSearch}
        onBack={onBack ?? (() => router.back())}
        title={title}
        subtitle={subtitle}
      />
    );
  }

  if (variant === "banner" && banner) {
    return (
      <BannerHeader
        banner={banner}
        aspect={bannerAspectRatio ?? 393 / 277}
        showSearch={showSearch}
        onSearch={onSearch}
        onBack={onBack ?? (() => router.back())}
        topInset={topInset}
        title={title}
        subtitle={subtitle}
      />
    );
  }

  // Large format: a back row on top, then a big left-aligned title (and an
  // optional second line) — used for landing-style headers like the World Cup page.
  if (variant === "lg" || variant === "banner" || variant === "hero") {
    return (
      <View style={[styles.lgWrap, { paddingTop: topInset + 12 }]}>
        <View style={styles.lgTopRow}>
          <Pressable style={styles.iconBtn} onPress={onBack ?? (() => router.back())} hitSlop={8}>
            <BackIcon />
          </Pressable>
          {showSearch && (
            <Pressable style={styles.iconBtn} onPress={onSearch} hitSlop={8}>
              <SearchIcon size={24} color={c.textPrimary} />
            </Pressable>
          )}
        </View>
        <View>
          <Text {...oswald} style={[styles.lgTitle, { fontFamily: displayFont, color: c.textPrimary }]}>{title}</Text>
          {subtitle ? <Text {...oswald} style={[styles.lgTitle, { fontFamily: displayFont, color: c.textPrimary }]}>{subtitle}</Text> : null}
        </View>
      </View>
    );
  }

  const handleBack = onBack ?? (() => router.back());
  const endButtonIconProps = [
    ...(onFilter
      ? [
          {
            iconName: IconName.Filter,
            onPress: onFilter,
            accessibilityLabel: "Customize sports tabs",
          },
        ]
      : []),
    ...(showSearch
      ? [
          {
            iconName: IconName.Search,
            onPress: onSearch,
            accessibilityLabel: "Search",
          },
        ]
      : []),
  ];

  // Classic bar keeps the title (and combo mark) centered. HeaderStandard's
  // children wrapper start-aligns, which pulled "Sports" next to back.
  if (!titleAction) {
    return (
      <View style={{ paddingTop: topInset, backgroundColor: c.bg, overflow: comboMode ? "visible" : undefined }}>
        <View style={[styles.bar, comboMode ? { overflow: "visible" as const } : null]}>
          <Pressable
            style={styles.iconBtn}
            onPress={handleBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <BackIcon />
          </Pressable>
          <View style={[styles.titleCenter, comboMode ? { overflow: "visible" as const } : null]} pointerEvents="none">
            {comboMode ? (
              <View style={styles.titleAction}>
                <HeaderComboMark />
                <Text {...oswald} style={[styles.title, { fontFamily: displayFont, color: c.textPrimary, width: "auto" }]} numberOfLines={1}>
                  {title}
                </Text>
              </View>
            ) : (
              <>
                <Text {...oswald} style={[styles.title, { fontFamily: displayFont, color: c.textPrimary }]} numberOfLines={1}>
                  {title}
                </Text>
                {subtitle ? (
                  <Text style={[styles.subtitle, { color: c.textPrimary }]} numberOfLines={1}>
                    {subtitle}
                  </Text>
                ) : null}
              </>
            )}
          </View>
          <View style={styles.actionGroup}>
            {onFilter ? (
              <Pressable
                style={styles.iconBtn}
                onPress={onFilter}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Customize sports tabs"
              >
                <Icon name={IconName.Filter} size={IconSize.Lg} color={IconColor.IconDefault} />
              </Pressable>
            ) : null}
            {showSearch ? (
              <Pressable
                style={styles.iconBtn}
                onPress={onSearch}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Search"
              >
                <SearchIcon size={24} color={c.textPrimary} />
              </Pressable>
            ) : (
              <View style={styles.leftSlot} />
            )}
            {rightAction ? (
              <Pressable
                style={styles.iconBtn}
                onPress={rightAction.onPress}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={rightAction.accessibilityLabel}
              >
                {rightAction.icon}
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ paddingTop: topInset, backgroundColor: c.bg, overflow: "visible" }}>
      <HeaderStandard
        style={{ overflow: "visible", backgroundColor: "transparent" }}
        childrenWrapperProps={{ style: { overflow: "visible", backgroundColor: "transparent" } }}
        title={undefined}
        subtitle={titleAction ? undefined : subtitle}
        onBack={handleBack}
        endButtonIconProps={endButtonIconProps.length > 0 ? endButtonIconProps : undefined}
        endAccessory={
          rightAction ? (
            <Pressable
              onPress={rightAction.onPress}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={rightAction.accessibilityLabel}
            >
              {rightAction.icon}
            </Pressable>
          ) : undefined
        }
      >
        {titleAction ? (
          <Pressable
            onPress={titleAction.onPress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={titleAction.accessibilityLabel}
            style={styles.titleAction}
          >
            {comboMode ? <HeaderComboMark /> : null}
            <MmText {...oswald} variant={TextVariant.BodyMd} fontWeight={FontWeight.Bold} numberOfLines={1} style={{ fontFamily: displayFont }}>
              {title}
            </MmText>
            <Icon name={IconName.ArrowDown} size={IconSize.Sm} />
          </Pressable>
        ) : (
          <View style={styles.titleAction}>
            <HeaderComboMark />
            <MmText {...oswald} variant={TextVariant.BodyMd} fontWeight={FontWeight.Bold} numberOfLines={1} style={{ fontFamily: displayFont }}>
              {title}
            </MmText>
          </View>
        )}
      </HeaderStandard>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    minHeight: 44,
    // Tightened: content (filters etc.) sits 16px closer beneath the header.
    paddingBottom: 0,
  },
  titleCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 48,
  },
  titleAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    overflow: "visible",
    backgroundColor: "transparent",
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  leftSlot: {
    width: 32,
  },
  title: {
    textAlign: "center",
    fontFamily: geist.semibold,
    fontSize: 17,
    width: "100%",
  },
  subtitle: {
    textAlign: "center",
    fontFamily: geist.regular,
    fontSize: 13,
    width: "100%",
    opacity: 0.7,
  },
  actionGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  lgWrap: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  bannerBack: {
    position: "absolute",
    left: 12,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerSearch: {
    position: "absolute",
    right: 12,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTitleWrap: {
    position: "absolute",
    left: 20,
    bottom: 18,
  },
  bannerTitle: {
    fontFamily: geist.semibold,
    fontSize: 24,
    lineHeight: 32,
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  heroTitleWrap: {
    position: "absolute",
    left: 20,
    bottom: 18,
  },
  heroWrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  heroCard: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: c.surface,
  },
  heroBack: {
    position: "absolute",
    top: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  heroSearch: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  lgTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lgTitle: {
    fontFamily: geist.semibold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
});
