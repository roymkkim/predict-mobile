import { type ReactNode, useEffect, useRef } from "react";
import { Image, Platform, Pressable, ScrollView, Text, useWindowDimensions, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import Svg, { Path, SvgXml } from "react-native-svg";
import { Icon, IconColor, IconName, IconSize } from "@metamask/design-system-react-native";
import { BackIcon } from "@/components/PageHeader";
import { colors, FILTER_CHIP_ACTIVE_BG, FILTER_CHIP_INACTIVE_TEXT } from "@/lib/sim/colors";
import { useDisplayFont, useOswaldDataSet, usePredictionsTitleFont } from "@/lib/sim/typefaceStore";
import { useFeedSettings } from "@/lib/sim/FeedSettingsContext";
import { useTennisHidden } from "@/lib/sim/tennisHiddenStore";
import { useCategoryTileCount, useCategoryTileStyle } from "@/lib/sim/categoryTileStore";
import { useNavMode, type NavMode } from "@/lib/sim/navModeStore";
import { useSportsIa, type SportsIa } from "@/lib/sim/sportsIaStore";
import { useUxrMode } from "@/lib/sim/uxrModeStore";
import { UXR_ICONS, UXR_MATERIAL_ICONS, UXR_MCI_ICONS } from "@/lib/sim/uxrIcons";
import { ExploreCategoryTile, EXPLORE_TILE_ICON } from "@/components/sim/ExploreCategoryTile";
import { MaterialOutlinedSportIcon, outlinedSportId } from "@/components/sim/MaterialSportsOutline";
import { BALANCE } from "./MoneySheet";
import { POPULAR_TOPIC_ROUTES, POPULAR_TOPICS } from "@/lib/sim/popularTopics";

export {
  POPULAR_TOPIC_CONTENT,
  POPULAR_TOPIC_ROUTES,
  POPULAR_TOPIC_SLUGS,
  POPULAR_TOPICS,
  popularContentKey,
  popularLabelForSlug,
  resolvePopularTopicSlug,
} from "@/lib/sim/popularTopics";

// Mobile feed chrome for the native "Version A" rebuild — the large-title nav
// header, the stacked category tiles section, and the "Popular today" pills.
// Presentational only (no live state), mirroring the web reference.

// Header glyphs (user-provided, tight 24x24 viewBox so they fill the box —
// MaterialIcons' chevron/search left a lot of internal padding and read small).
const VENUE_SWITCHER_ICON = require("@/assets/images/settings.png");

// Kalshi / Polymarket switcher — user PNG at 24×24 (no SVG, no tint).
function VenueSwitcherIcon({ size = 24 }: { size?: number }) {
  return (
    <Image
      source={VENUE_SWITCHER_ICON}
      accessibilityIgnoresInvertColors
      style={{ width: size, height: size }}
    />
  );
}

export function ChevronIcon({ size = 20, color = colors.textMuted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path d="M6.07747 16.0775L12.1549 10L6.07747 3.92253L7.25586 2.74414L14.5117 10L7.25586 17.2559L6.07747 16.0775Z" fill={color} />
    </Svg>
  );
}

function SearchIcon({ size = 24, color = colors.textPrimary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19.6 21L13.3 14.7C12.8 15.1 12.225 15.4167 11.575 15.65C10.925 15.8833 10.2333 16 9.5 16C7.68333 16 6.14583 15.3708 4.8875 14.1125C3.62917 12.8542 3 11.3167 3 9.5C3 7.68333 3.62917 6.14583 4.8875 4.8875C6.14583 3.62917 7.68333 3 9.5 3C11.3167 3 12.8542 3.62917 14.1125 4.8875C15.3708 6.14583 16 7.68333 16 9.5C16 10.2333 15.8833 10.925 15.65 11.575C15.4167 12.225 15.1 12.8 14.7 13.3L21 19.6L19.6 21ZM9.5 14C10.75 14 11.8125 13.5625 12.6875 12.6875C13.5625 11.8125 14 10.75 14 9.5C14 8.25 13.5625 7.1875 12.6875 6.3125C11.8125 5.4375 10.75 5 9.5 5C8.25 5 7.1875 5.4375 6.3125 6.3125C5.4375 7.1875 5 8.25 5 9.5C5 10.75 5.4375 11.8125 6.3125 12.6875C7.1875 13.5625 8.25 14 9.5 14Z"
        fill={color}
      />
    </Svg>
  );
}

// Brand "region dropdown" pills (user-provided): a rounded surface chip with the
// Polymarket / Kalshi wordmark + a chevron-down, shown in the nav header when the
// region control is set to "header" instead of the sticky bottom banner.
const POLY_TOGGLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="54" height="32" viewBox="0 0 54 32" fill="none">
<rect width="54" height="32" rx="16" fill="white" fill-opacity="0.04"/>
<path d="M21.8117 21.8372C21.8117 22.4563 21.8117 22.7658 21.6093 22.9192C21.4068 23.0727 21.1088 22.9891 20.5128 22.8218L10.9346 20.1341C10.5755 20.0333 10.3959 19.9829 10.2921 19.8459C10.1883 19.709 10.1883 19.5225 10.1883 19.1495V12.8505C10.1883 12.4776 10.1883 12.2911 10.2921 12.1541C10.3959 12.0171 10.5755 11.9667 10.9346 11.8659L20.5128 9.17815C21.1088 9.01092 21.4068 8.92729 21.6093 9.08074C21.8117 9.23419 21.8117 9.54373 21.8117 10.1628V21.8372ZM12.577 19.2578L20.5078 21.4835V17.0323L12.577 19.2578ZM11.4921 18.2252L19.4213 16L11.4921 13.7748V18.2252ZM12.5769 12.7422L20.5078 14.9678V10.5165L12.5769 12.7422Z" fill="white"/>
<path d="M33.138 13.293L38 18.155L42.862 13.293L43.8047 14.2357L38 20.0404L32.1953 14.2357L33.138 13.293Z" fill="white"/>
</svg>`;
const KALSHI_TOGGLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="32" viewBox="0 0 80 32" fill="none">
<rect width="80" height="32" rx="16" fill="white" fill-opacity="0.04"/>
<g clip-path="url(#clip0_19659_741)">
<path d="M23.9099 13.0898C21.462 13.0898 19.9767 14.1687 19.8584 16.049H22.4075C22.5088 15.3296 22.9814 14.9535 23.8085 14.9535C24.6357 14.9535 25.0915 15.3131 25.0747 15.8854C25.0577 16.3269 24.7708 16.5231 24.045 16.6212L22.9984 16.7521C20.6351 17.03 19.5208 17.8965 19.5208 19.4496C19.5208 21.0027 20.6349 22 22.4918 22C23.6734 22 24.5681 21.5913 25.1253 20.8065V21.82H27.7587V16.2615C27.7587 14.1687 26.459 13.0898 23.9099 13.0898ZM23.353 20.2179C22.5934 20.2179 22.1713 19.891 22.1713 19.286C22.1713 18.7138 22.5426 18.4358 23.5724 18.2888L24.045 18.2233C24.4631 18.1664 24.8072 18.0853 25.0915 17.9716V18.8283C25.0915 19.6458 24.3827 20.2179 23.353 20.2179ZM28.6872 10.1798H31.3882V21.82H28.6872V10.1798ZM15.7249 15.6086L19.7742 21.82H16.2629L12.9542 16.4744V21.82H10V10.1798H12.9542V15.2621L16.4993 10.1798H19.6561L15.7249 15.6086ZM48.9613 11.3896C48.9613 10.6375 49.6365 10 50.4807 10C51.3247 10 52 10.6375 52 11.3896C52 12.1417 51.3247 12.7792 50.4807 12.7792C49.6365 12.7792 48.9613 12.1579 48.9613 11.3896ZM39.6431 19.1552C39.6431 21.0679 38.2082 21.9998 35.828 21.9998C33.4477 21.9998 31.9791 20.9863 31.8948 19.1387H34.3931C34.4945 19.8416 34.832 20.2341 35.8112 20.2341C36.6553 20.2341 37.0603 19.9073 37.0603 19.4167C37.0603 18.926 36.5708 18.6808 35.3386 18.5013C32.9921 18.1906 32.0468 17.5202 32.0468 15.8038C32.0468 13.9892 33.7519 13.0898 35.6593 13.0898C37.7018 13.0898 39.1874 13.7927 39.3901 15.771H36.9423C36.8242 15.1498 36.4527 14.8392 35.6761 14.8392C34.9503 14.8392 34.545 15.166 34.545 15.6075C34.545 16.0979 34.9503 16.2777 36.1487 16.4412C38.4614 16.7519 39.6431 17.3239 39.6431 19.1552ZM49.1301 13.2696H51.8311V21.82H49.1301V13.2696ZM48.2017 16.1471V21.82H45.5007V16.6048C45.5007 15.6892 45.1124 15.2152 44.2683 15.2152C43.4242 15.2152 42.8334 15.7383 42.8334 16.7683V21.82H40.1324V10.1798H42.8334V14.5431C43.2583 13.726 44.1528 13.0898 45.4499 13.0898C47.0706 13.0898 48.2014 14.0871 48.2014 16.1469L48.2017 16.1471Z" fill="white"/>
</g>
<path d="M59.138 13.293L64 18.155L68.862 13.293L69.8047 14.2357L64 20.0404L58.1953 14.2357L59.138 13.293Z" fill="white"/>
<defs>
<clipPath id="clip0_19659_741">
<rect width="42" height="12" fill="white" transform="translate(10 10)"/>
</clipPath>
</defs>
</svg>`;

// Top navigation bar. Two arrangements gated by `largeHeader` (default on):
// LARGE = a slim 56px nav row (back chevron + balance pill + search, no inline
// title) with a big "Predictions" title on a second row below it; COMPACT = a
// single 56px row with the 16px title inline on the left. Tapping the title in
// either arrangement opens the display-settings sheet.
export function NavHeader({ tabs }: { tabs?: ReactNode } = {}) {
  const { openSettings, regionControl = "banner", region = "polymarket", openRegion, headerBalance = true, balancePillStyle = "badge", largeHeader = true, openMoney, openSearch } = useFeedSettings();
  const titleFont = usePredictionsTitleFont();
  // "soft" = muted success background + green text; "solid" = lime bg + dark text.
  const pillBg = balancePillStyle === "soft" ? colors.greenSoft : colors.greenOutline;
  const pillText = balancePillStyle === "soft" ? colors.greenOutline : colors.bg;
  const router = useRouter();
  return (
    <View style={{ backgroundColor: colors.bg }}>
      <View style={{ height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", flexShrink: 1 }}>
          {/* Back exits the Predictions app to the product (wallet) home. */}
          <Pressable onPress={() => router.push("/wallet-home")} hitSlop={8} style={{ height: 36, width: 36, alignItems: "center", justifyContent: "center" }}>
            <BackIcon />
          </Pressable>
          {/* Compact arrangement: the title sits inline in the nav row. In the
              large arrangement it moves to a bigger second row below. Tapping the
              title (either place) opens the display-settings sheet. */}
          {!largeHeader && (
            <Pressable onPress={openSettings} hitSlop={8} style={{ flexShrink: 1, paddingLeft: 4 }}>
              <Text
                numberOfLines={1}
                {...(Platform.OS === "web" ? { dataSet: { predictionsTitle: "true" } } : null)}
                style={{ fontFamily: titleFont, fontSize: 16, color: colors.textPrimary }}
              >
                Predictions
              </Text>
            </Pressable>
          )}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {/* The gear was removed — the display-settings sheet now opens by
              tapping the "Predictions" title to the left. */}
          {/* Header balance version. "badge" (default): one dark surface pill
              with white balance text + an inline red count badge sitting inside
              the pill at the right; tapping routes to /positions (funds live on
              that page). The "soft"/"solid" variants instead open the money sheet
              and show a separate count badge linking to /positions. */}
          {headerBalance && (balancePillStyle === "badge" ? (
            <Pressable
              onPress={() => router.push("/positions")}
              hitSlop={6}
              style={{ height: 32, borderRadius: 16, paddingLeft: 14, paddingRight: 6, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.surface2 }}
            >
              <Text style={{ fontFamily: "Geist_600SemiBold", fontSize: 14, color: colors.textPrimary }}>{BALANCE}</Text>
              <View style={{ minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 5, alignItems: "center", justifyContent: "center", backgroundColor: colors.red }}>
                <Text style={{ fontFamily: "Geist_600SemiBold", fontSize: 12, color: colors.bg }}>3</Text>
              </View>
            </Pressable>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              <Pressable
                onPress={openMoney}
                hitSlop={6}
                style={{ height: 30, borderRadius: 15, paddingHorizontal: 12, alignItems: "center", justifyContent: "center", backgroundColor: pillBg }}
              >
                <Text style={{ fontFamily: "Geist_600SemiBold", fontSize: 14, color: pillText }}>{BALANCE}</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push("/positions")}
                hitSlop={6}
                style={{ height: 30, minWidth: 30, borderRadius: 9, paddingHorizontal: 8, alignItems: "center", justifyContent: "center", backgroundColor: colors.red }}
              >
                <Text style={{ fontFamily: "Geist_600SemiBold", fontSize: 14, color: colors.bg }}>3</Text>
              </Pressable>
            </View>
          ))}
          {/* Header region dropdown — only when regionControl === "header". Opens
              the same RegionSheet the bottom banner uses. */}
          {regionControl === "header" && (
            <Pressable onPress={openRegion} hitSlop={8} style={{ height: 32, alignItems: "center", justifyContent: "center" }}>
              <SvgXml
                xml={region === "kalshi" ? KALSHI_TOGGLE_SVG : POLY_TOGGLE_SVG}
                width={region === "kalshi" ? 80 : 54}
                height={32}
              />
            </Pressable>
          )}
          <Pressable
            onPress={() => openRegion?.()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Switch Polymarket or Kalshi"
            style={{ height: 36, width: 36, alignItems: "center", justifyContent: "center" }}
          >
            <VenueSwitcherIcon size={24} />
          </Pressable>
          <Pressable
            onPress={openSearch}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Search"
            style={{ height: 36, width: 36, alignItems: "center", justifyContent: "center" }}
          >
            <SearchIcon size={24} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>
      {/* Large arrangement: a big "Predictions" title sits below the nav row
          (mirrors the lg PageHeader). Tapping it opens the display settings. */}
      {largeHeader && (
        <Pressable onPress={openSettings} hitSlop={8} style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <Text
            numberOfLines={1}
            {...(Platform.OS === "web" ? { dataSet: { predictionsTitle: "true" } } : null)}
            style={{ fontFamily: titleFont, fontSize: 24, lineHeight: 32, color: colors.textPrimary }}
          >
            Predictions
          </Text>
        </Pressable>
      )}
      {tabs}
    </View>
  );
}

// Reusable feed section title: 20/26 medium white + optional muted right chevron.
const SECTION_HEADER_ROW = {
  flexDirection: "row" as const,
  alignItems: "center" as const,
  gap: 4,
  paddingHorizontal: 16,
  paddingBottom: 12,
};

export function SectionHeader({
  title,
  showChevron = true,
  titleStyle,
  onPress,
  leading,
  gap = 4,
}: {
  title: string;
  showChevron?: boolean;
  titleStyle?: StyleProp<TextStyle>;
  onPress?: () => void;
  leading?: ReactNode;
  gap?: number;
}) {
  const headingFont = useDisplayFont("Geist_500Medium");
  const oswald = useOswaldDataSet();
  // `gap` is leading→title only. Title→chevron always uses SECTION_HEADER_ROW.gap (4)
  // so Combos matches Explore even when ComboMark needs a wider icon-to-text gap.
  const content = (
    <>
      <View style={{ flexDirection: "row", alignItems: "center", gap: leading ? gap : 0 }}>
        {leading}
        <Text {...oswald} style={[{ fontFamily: headingFont, fontSize: 20, lineHeight: 26, color: colors.textPrimary }, titleStyle]}>{title}</Text>
      </View>
      {showChevron ? (
        <Icon name={IconName.ArrowRight} size={IconSize.Sm} color={IconColor.IconAlternative} />
      ) : null}
    </>
  );
  const rowStyle = SECTION_HEADER_ROW;
  if (onPress) {
    return (
      <Pressable onPress={onPress} hitSlop={8} style={rowStyle}>
        {content}
      </Pressable>
    );
  }
  return <View style={rowStyle}>{content}</View>;
}

// Category tiles: the six primary categories, icon stacked above label, in a
// horizontally-swipeable carousel. Tiles are sized so ~2.67 fit on screen (the
// third tile is cut ~1/3 off the right edge) to hint that the row is swipable.
const CATEGORY_TILES: { label: string; icon: keyof typeof MaterialIcons.glyphMap; route: string }[] = [
  { label: "Politics", icon: "account-balance", route: "/politics" },
  { label: "BTC Up or Down", icon: "currency-bitcoin", route: "/crypto" },
  { label: "Sports", icon: "stadium", route: "/sports-leagues" },
  { label: "Basketball", icon: "sports-basketball", route: "/basketball" },
  { label: "E-sports", icon: "sports-esports", route: "/trending?topic=esports" },
  { label: "Tennis", icon: "sports-tennis", route: "/tennis" },
];

const TILE_GAP = 8;
const TILE_SIDE_PAD = 12;

// UXR categories: final 3D icon render (user-provided, lib/sim/uxrIcons.ts)
// inside a dark rounded-square tile, label below the tile (per the UXR mock).
// Route per navigation mode (Settings → Navigation): nested drill-down pages
// or the single category hub.
type UxrTileRoutes = Record<"nested" | "single", string>;
type UxrTile = { label: string; icon: keyof typeof UXR_ICONS; routes: UxrTileRoutes };

// In Single category mode, sport subcategories open the carousel-based Sports
// hub. Nested mode keeps the original dedicated sport-page destinations.
function uxrTileRoute(tile: UxrTile, navMode: NavMode): string {
  if (navMode === "picker") return tile.routes.nested;
  return navMode === "single" && tile.routes.single.startsWith("/uxr-hub/sports")
    ? tile.routes.single
    : tile.routes[navMode];
}
// Kalshi IA (Settings → Sports IA): sports tiles bypass the Polymarket routes
// and land on the Kalshi replication surfaces (hub / sport / league pages).
// Non-sport tiles (Crypto, Politics, Culture, ...) keep their normal routes.
const KALSHI_TILE_ROUTES: Record<string, string> = {
  Sports: "/kalshi-sports",
  Basketball: "/kalshi-sport/basketball",
  Football: "/kalshi-sport/football",
  NFL: "/kalshi-league/NFL?sport=football",
  Tennis: "/kalshi-sport/tennis",
  Golf: "/kalshi-sport/golf",
  Soccer: "/kalshi-sport/soccer",
  "E-sports": "/kalshi-sport/esports",
};
const kalshiTileRoute = (ia: SportsIa, label: string): string | null =>
  ia === "kalshi" ? (KALSHI_TILE_ROUTES[label] ?? null) : null;

const uxrTile = (label: string, icon: keyof typeof UXR_ICONS, nested: string, single: string): UxrTile => ({
  label,
  icon,
  routes: { nested, single },
});
const UXR_CATEGORY_TILES: UxrTile[] = [
  uxrTile("Crypto", "crypto", "/crypto", "/uxr-hub/crypto"),
  uxrTile("Politics", "politics", "/politics", "/uxr-hub/politics"),
  uxrTile("Basketball", "basketball", "/uxr-sport/basketball", "/uxr-hub/sports?sub=basketball"),
  uxrTile("Football", "football", "/uxr-sport/football", "/uxr-hub/sports?sub=football"),
  uxrTile("NFL", "nfl", "/uxr-league/NFL", "/uxr-hub/sports?sub=football"),
  uxrTile("Tennis", "tennis", "/uxr-sport/tennis", "/uxr-hub/sports?sub=tennis"),
  uxrTile("Golf", "golf", "/uxr-sport/golf", "/uxr-hub/sports?sub=golf"),
  uxrTile("Soccer", "soccer", "/uxr-sport/soccer", "/uxr-hub/sports?sub=soccer"),
];
const UXR_CATEGORY_HUB_TILES: UxrTile[] = [
  UXR_CATEGORY_TILES[0],
  UXR_CATEGORY_TILES[1],
  uxrTile("Sports", "football", "/sports-leagues", "/uxr-hub/sports"),
  ...UXR_CATEGORY_TILES.slice(2),
];

const SPORTS_PAGE_CATEGORY_TILES: UxrTile[] = [
  UXR_CATEGORY_TILES[0],
  UXR_CATEGORY_TILES[1],
  uxrTile("MLB", "baseball", "/uxr-sport/baseball", "/uxr-sport/baseball"),
  uxrTile("NFL", "nfl", "/uxr-sport/football", "/uxr-sport/football"),
  ...UXR_CATEGORY_TILES.filter((tile) => ["Basketball", "Soccer", "Tennis", "Golf"].includes(tile.label)).map((tile) =>
    tile.label === "Soccer" ? { ...tile, label: "EPL" } : tile,
  ),
];

// UXR tile geometry: square icon tile, label OUTSIDE below the tile. Matches
// the balance quick-action tiles' height (12 pad + 24 icon + 4 gap + ~17.5
// label + 16 pad ≈ 74) so the two rows read as one system.
const UXR_TILE = 74;

// "Three button" category variant: just Crypto / Politics / Sports as three
// equal-width buttons (no carousel).
// Now a scrollable carousel: the three primary tiles plus E-sports / Culture /
// Finance / Tech. Tiles without an in-place feed category (navOnly) always
// navigate, even in select mode.
const UXR_THREE_TILES: {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  uxrIcon?: keyof typeof UXR_ICONS;
  routes: UxrTileRoutes;
  navOnly?: boolean;
}[] = [
  { label: "Crypto", icon: "currency-bitcoin", uxrIcon: "crypto", routes: { nested: "/crypto", single: "/uxr-hub/crypto" } },
  { label: "Politics", icon: "account-balance", uxrIcon: "politics", routes: { nested: "/politics", single: "/uxr-hub/politics" } },
  { label: "Sports", icon: "sports-football", uxrIcon: "football", routes: { nested: "/sports-leagues", single: "/uxr-hub/sports" } },
  { label: "Basketball", icon: "sports-basketball", uxrIcon: "basketball", routes: { nested: "/uxr-sport/basketball", single: "/uxr-hub/sports?sub=basketball" } },
  { label: "Football", icon: "sports-football", uxrIcon: "football", routes: { nested: "/uxr-sport/football", single: "/uxr-hub/sports?sub=football" } },
  { label: "Soccer", icon: "sports-soccer", uxrIcon: "soccer", routes: { nested: "/uxr-sport/soccer", single: "/uxr-hub/sports?sub=soccer" } },
  { label: "E-sports", icon: "sports-esports", routes: { nested: "/esports", single: "/uxr-hub/sports?sub=esports" }, navOnly: true },
  { label: "Culture", icon: "theater-comedy", routes: { nested: "/topic/culture", single: "/topic/culture" }, navOnly: true },
  { label: "Finance", icon: "show-chart", routes: { nested: "/topic/finance", single: "/topic/finance" }, navOnly: true },
  { label: "Tech", icon: "memory", routes: { nested: "/topic/tech", single: "/topic/tech" }, navOnly: true },
];

const SPORTS_PAGE_THREE_TILES = [
  UXR_THREE_TILES[0],
  UXR_THREE_TILES[1],
  {
    label: "MLB",
    icon: "sports-baseball" as keyof typeof MaterialIcons.glyphMap,
    uxrIcon: "baseball" as keyof typeof UXR_ICONS,
    routes: { nested: "/uxr-sport/baseball", single: "/uxr-sport/baseball" },
  },
  {
    label: "NFL",
    icon: "sports-football" as keyof typeof MaterialIcons.glyphMap,
    uxrIcon: "nfl" as keyof typeof UXR_ICONS,
    routes: { nested: "/uxr-sport/football", single: "/uxr-sport/football" },
  },
  ...UXR_THREE_TILES.filter((tile) => ["Basketball", "Soccer"].includes(tile.label)).map((tile) =>
    tile.label === "Soccer" ? { ...tile, label: "EPL" } : tile,
  ),
];

const SPORTS_PAGE_TILE_ROUTES: Record<string, string> = {
  MLB: "/uxr-sport/baseball",
  NFL: "/uxr-sport/football",
  Basketball: "/uxr-sport/basketball",
  Soccer: "/uxr-sport/soccer",
  EPL: "/uxr-sport/soccer",
  Tennis: "/uxr-sport/tennis",
  Golf: "/uxr-sport/golf",
};

// Carousel tile width: three fully visible + a sliver of the fourth peeking
// to hint that the row scrolls (per the standard rail pattern).
const THREE_TILE_W = 104;

// In-place selection (home): when `onSelect` is provided the tiles select a
// category instead of navigating — a leading "Trending" tile restores the
// mixed feed, and the selected tile re-tapped also returns to Trending.
export type HomeCategorySelect = { selected: string | null; onSelect: (key: string | null) => void };

// Map each UXR tile to its in-place category key (NFL folds into football).
const UXR_TILE_KEYS: Record<string, string> = {
  Crypto: "crypto",
  Politics: "politics",
  Sports: "sport:live",
  Football: "sport:football",
  NFL: "sport:football",
  Basketball: "sport:basketball",
  Tennis: "sport:tennis",
  Golf: "sport:golf",
  Soccer: "sport:soccer",
  EPL: "sport:soccer",
};

function UxrFeedTabs({ select }: { select?: HomeCategorySelect }) {
  const router = useRouter();
  const tennisHidden = useTennisHidden();
  const tileStyle = useCategoryTileStyle();
  const tileCount = useCategoryTileCount();
  const navMode = useNavMode();
  const sportsIa = useSportsIa();
  const categoryTiles =
    sportsIa === "polymarket-sport-pages"
      ? SPORTS_PAGE_CATEGORY_TILES
      : navMode === "single"
        ? UXR_CATEGORY_HUB_TILES
        : UXR_CATEGORY_TILES;
  const tiles = tennisHidden ? categoryTiles.filter((t) => t.label !== "Tennis") : categoryTiles;
  if (tileCount === "three") {
    const baseThreeTiles = sportsIa === "polymarket-sport-pages" ? SPORTS_PAGE_THREE_TILES : UXR_THREE_TILES;
    const threeTiles =
      navMode === "nested" || navMode === "picker"
        ? baseThreeTiles.filter((t) => t.label !== "Sports")
        : baseThreeTiles;
    const moreTile = {
      label: "More",
      icon: "arrow-forward" as keyof typeof MaterialIcons.glyphMap,
      uxrIcon: undefined,
      routes: { nested: "/uxr-categories", single: "/uxr-categories" },
      navOnly: true,
    };
    return (
      <View style={{ gap: 0, backgroundColor: colors.bg }}>
        {!select?.selected && <SectionHeader title="Categories" onPress={() => router.push("/uxr-categories" as never)} />}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={THREE_TILE_W + TILE_GAP}
          snapToAlignment="start"
          disableIntervalMomentum
          contentContainerStyle={{ flexDirection: "row", gap: TILE_GAP, paddingHorizontal: TILE_SIDE_PAD }}
        >
          {[...threeTiles, moreTile].map((t) => {
            const key =
              t.label === "Sports"
                ? "sport:live"
                : t.label === "Basketball" || t.label === "Football" || t.label === "Soccer" || t.label === "EPL"
                  ? `sport:${t.label.toLowerCase()}`
                  : t.label.toLowerCase();
            const kalshiRoute = kalshiTileRoute(sportsIa, t.label);
            const sportPagesRoute = sportsIa === "polymarket-sport-pages" ? SPORTS_PAGE_TILE_ROUTES[t.label] ?? null : null;
            const canSelectInPlace = !kalshiRoute && !sportPagesRoute && navMode === "single" && !!select && !t.navOnly;
            const on = canSelectInPlace ? select.selected === key : false;
            return (
              <Pressable
                key={t.label}
                onPress={
                  kalshiRoute
                    ? () => router.push(kalshiRoute as never)
                    : sportPagesRoute
                      ? () => router.push(sportPagesRoute as never)
                    : canSelectInPlace
                      ? () => select.onSelect(on ? null : key)
                      : () => router.push(uxrTileRoute(t, navMode) as never)
                }
                style={({ pressed }) => ({
                  width: THREE_TILE_W,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: on ? "rgba(255,255,255,0.35)" : "transparent",
                  backgroundColor: on ? "rgba(255,255,255,0.14)" : colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  paddingVertical: 16,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                {tileStyle === "material" || !t.uxrIcon ? (
                  t.label !== "Sports" && (outlinedSportId(t.icon) || t.label === "MLB") ? (
                    <MaterialOutlinedSportIcon
                      name={t.label === "MLB" ? "baseball" : t.icon}
                      size={24}
                      color={colors.textPrimary}
                    />
                  ) : (
                    <MaterialIcons name={t.icon} size={24} color={colors.textPrimary} />
                  )
                ) : (
                  <Image source={UXR_ICONS[t.uxrIcon]} style={{ width: 36, height: 36 }} resizeMode="contain" />
                )}
                <Text style={{ fontFamily: "Geist_500Medium", fontSize: 13, color: colors.textPrimary }} numberOfLines={1}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  }
  // Carousel variant: optional leading Trending tile in select mode.
  const moreTile = {
    label: "More",
    icon: "arrow-forward" as keyof typeof UXR_ICONS,
    routes: { nested: "/uxr-categories", single: "/uxr-categories" },
  };
  const railTiles = select
    ? ([{ label: "Trending", icon: "crypto" as const, routes: { nested: "", single: "" } }, ...tiles, moreTile])
    : [...tiles, moreTile];
  return (
    <View style={{ backgroundColor: colors.bg }}>
      {!select?.selected && (
        <SectionHeader title="Categories" onPress={() => router.push("/uxr-categories" as never)} />
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={UXR_TILE + 10}
        snapToAlignment="start"
        disableIntervalMomentum
        contentContainerStyle={{ flexDirection: "row", gap: 10, paddingHorizontal: TILE_SIDE_PAD }}
      >
          {railTiles.map((t) => {
          const isTrending = t.label === "Trending";
            const isMore = t.label === "More";
          const key = isTrending ? null : (UXR_TILE_KEYS[t.label] ?? t.label.toLowerCase());
          const kalshiRoute = isTrending ? null : kalshiTileRoute(sportsIa, t.label);
            const sportPagesRoute = isTrending || isMore || sportsIa !== "polymarket-sport-pages" ? null : SPORTS_PAGE_TILE_ROUTES[t.label] ?? null;
            const canSelectInPlace = !isMore && !kalshiRoute && !sportPagesRoute && navMode === "single" && !!select;
          const on = canSelectInPlace ? select.selected === key : false;
          return (
          <ExploreCategoryTile
            key={t.label}
            width={UXR_TILE}
            label={t.label}
            selected={on}
            onPress={
                isTrending
                ? undefined
                  : isMore
                    ? () => router.push("/uxr-categories" as never)
                : kalshiRoute
                  ? () => router.push(kalshiRoute as never)
                  : sportPagesRoute
                    ? () => router.push(sportPagesRoute as never)
                  : canSelectInPlace
                    ? () => select.onSelect(on ? null : key)
                    : () => router.push(uxrTileRoute(t, navMode) as never)
            }
            icon={
              isTrending ? (
                <MaterialIcons name="local-fire-department" size={EXPLORE_TILE_ICON} color={colors.textPrimary} />
              ) : isMore ? (
                <MaterialIcons name="arrow-forward" size={EXPLORE_TILE_ICON} color={colors.textPrimary} />
              ) : tileStyle === "material" ? (
                t.label !== "Sports" && outlinedSportId(t.icon) ? (
                  <MaterialOutlinedSportIcon name={t.icon} size={24} color={colors.textPrimary} />
                ) : UXR_MCI_ICONS[t.icon] ? (
                  <MaterialCommunityIcons
                    name={UXR_MCI_ICONS[t.icon]}
                    size={24}
                    color={colors.textPrimary}
                  />
                ) : (
                  <MaterialIcons name={UXR_MATERIAL_ICONS[t.icon]} size={EXPLORE_TILE_ICON} color={colors.textPrimary} />
                )
              ) : (
                <Image source={UXR_ICONS[t.icon]} style={{ width: EXPLORE_TILE_ICON, height: EXPLORE_TILE_ICON }} resizeMode="contain" />
              )
            }
          />
          );
        })}
      </ScrollView>
    </View>
  );
}

export function FeedTabs({ select }: { select?: HomeCategorySelect } = {}) {
  const router = useRouter();
  const uxrMode = useUxrMode();
  const tennisHidden = useTennisHidden();
  const { width: screenW } = useWindowDimensions();
  const tiles = tennisHidden ? CATEGORY_TILES.filter((t) => t.route !== "/tennis") : CATEGORY_TILES;
  if (uxrMode === "uxr") return <UxrFeedTabs select={select} />;
  // Width such that 2 full tiles + ~2/3 of the third are visible (third cut
  // ~1/3). At scroll offset 0 only the left content padding is in view, so the
  // visible budget is screenW minus one side pad and the two inter-tile gaps.
  const tileWidth = (screenW - TILE_SIDE_PAD - TILE_GAP * 2) / 2.67;
  return (
    <View style={{ backgroundColor: colors.bg }}>
      <SectionHeader title="Categories" onPress={() => router.push("/categories")} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={tileWidth + TILE_GAP}
        snapToAlignment="start"
        disableIntervalMomentum
        contentContainerStyle={{ flexDirection: "row", gap: TILE_GAP, paddingHorizontal: TILE_SIDE_PAD }}
      >
        {[
          ...tiles,
          { label: "More", icon: "arrow-forward" as keyof typeof MaterialIcons.glyphMap, route: "/categories" },
        ].map((t) => (
          <Pressable
            key={t.label}
            onPress={() => router.push(t.route as never)}
            style={{
              width: tileWidth,
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.04)",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              paddingVertical: 16,
            }}
          >
            <MaterialIcons name={t.icon} size={24} color={colors.textPrimary} />
            <Text style={{ fontFamily: "Geist_500Medium", fontSize: 14, color: colors.textPrimary }} numberOfLines={1}>{t.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function splitBalancedRows(labels: string[]): string[][] {
  const rows: string[][] = [[], []];
  const widths = [0, 0];
  const chipWidth = (label: string) => 24 + label.length * 8 + 8;
  for (const label of labels) {
    const row = widths[0] <= widths[1] ? 0 : 1;
    rows[row].push(label);
    widths[row] += chipWidth(label);
  }
  return rows;
}

// Just the two rows of horizontally-scrolling pills (no header). Reused by the
// standalone PopularPills section and inline at the top of the Trending section.
export function PopularPillsRow({
  style,
  rows = 2,
  select,
}: {
  style?: StyleProp<ViewStyle>;
  rows?: 1 | 2;
  // In-place mode (Settings → Trending filters → In place): chips toggle a
  // topic selection instead of navigating; re-tapping clears back to the feed.
  select?: { selected: string | null; onSelect: (topic: string | null) => void };
}) {
  const router = useRouter();
  const grouped = rows === 1 ? [POPULAR_TOPICS] : splitBalancedRows(POPULAR_TOPICS);
  const scrollRef = useRef<ScrollView>(null);
  const chipNodes = useRef<Record<string, View | null>>({});
  const chipX = useRef<Record<string, number>>({});
  const selected = select?.selected ?? null;

  useEffect(() => {
    if (!selected) return;
    const scrollSelected = () => {
      const node = chipNodes.current[selected] as unknown as {
        scrollIntoView?: (opts: { inline?: string; block?: string; behavior?: string }) => void;
      } | null;
      if (node?.scrollIntoView) {
        node.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
        return;
      }
      const x = chipX.current[selected];
      if (x != null) {
        scrollRef.current?.scrollTo({ x: Math.max(0, x - 16), animated: true });
      }
    };
    const id = requestAnimationFrame(scrollSelected);
    const t = setTimeout(scrollSelected, 80);
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(t);
    };
  }, [selected]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={style}
      contentContainerStyle={{ paddingHorizontal: 16 }}
    >
      <View style={{ flexDirection: "column", gap: 8 }}>
        {grouped.map((row, r) => (
          <View key={`row-${r}`} style={{ flexDirection: "row", gap: 8 }}>
            {row.map((t) => (
              <View
                key={t}
                ref={(el) => {
                  chipNodes.current[t] = el;
                }}
                collapsable={false}
                onLayout={(e) => {
                  chipX.current[t] = e.nativeEvent.layout.x;
                }}
              >
                <Pressable
                  onPress={
                    select
                      ? () => select.onSelect(select.selected === t ? null : t)
                      : () => router.push((POPULAR_TOPIC_ROUTES[t] ?? "/trending") as never)
                  }
                  style={{
                    height: 40,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: select
                      ? select.selected === t
                        ? FILTER_CHIP_ACTIVE_BG
                        : "transparent"
                      : colors.surface,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Geist_500Medium",
                      fontSize: 14,
                      lineHeight: 22,
                      color: select
                        ? select.selected === t
                          ? colors.textPrimary
                          : FILTER_CHIP_INACTIVE_TEXT
                        : colors.textPrimary,
                    }}
                  >
                    {t}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// One or two rows of pills (per `rows`) that scroll horizontally together as one
// unit, with the "Popular today" section header.
export function PopularPills({ rows = 2 }: { rows?: 1 | 2 }) {
  const router = useRouter();
  return (
    <View style={{ backgroundColor: colors.bg }}>
      <SectionHeader title="Popular today" onPress={() => router.push("/trending")} />
      <PopularPillsRow rows={rows} />
    </View>
  );
}
