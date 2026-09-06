import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { darkTheme } from "@metamask/design-tokens";
import { Button, ButtonSize, ButtonVariant } from "@metamask/design-system-react-native";
import { setOrderTypes, setYesNoMarket, useBetSlipSettings } from "@/lib/sim/betSlipSettingsStore";
import { setOnboardingEnabled, useOnboarding } from "@/lib/sim/onboardingStore";
import { setSocialUx, useSocialUx } from "@/lib/sim/socialUxStore";
import { setHomeSocialStyle, useHomeSocialStyle } from "@/lib/sim/homeSocialStyleStore";
import { startSocialTour, stopSocialTour, useSocialTour } from "@/lib/sim/socialTourStore";
import { setMatchLayout, useMatchLayout } from "@/lib/sim/matchLayoutStore";
import { setDsMode, setThemeMode, useDsMode, useThemeMode, type DsMode, type ThemeMode } from "@/lib/sim/dsModeStore";
import { useUxrMode } from "@/lib/sim/uxrModeStore";
import { setPillButtons, usePillButtons } from "@/lib/sim/pillButtonsStore";
import { setMarketRulesStyle, useMarketRulesStyle, type MarketRulesStyle } from "@/lib/sim/marketRulesStore";
import { SPORTS_IA_LABELS, SPORTS_IA_OPTIONS, setSportsIa, useSportsIa, type SportsIa } from "@/lib/sim/sportsIaStore";
import {
  SPORTS_PAGE_LAYOUT_LABELS,
  setSportsPageLayout,
  useSportsPageLayout,
  type SportsPageLayout,
} from "@/lib/sim/sportsPageLayoutStore";
import {
  setPolymarketMetaMaskSportsNav,
  usePolymarketMetaMaskSportsNav,
  type PolymarketMetaMaskSportsNav,
} from "@/lib/sim/polymarketMetaMaskSportsNavStore";
import {
  setSportPagesNavOrder,
  useSportPagesNavOrder,
  type SportPagesNavOrder,
} from "@/lib/sim/sportPagesNavOrderStore";
import { setLeaguePageVariant, useLeaguePageVariant, type LeaguePageVariant } from "@/lib/sim/leaguePageVariantStore";
import {
  setCombinationsEntry,
  setCombinationsMode,
  setCombinationsVisible,
  useCombinationsEntry,
  useCombinationsMode,
  useCombinationsVisible,
  type CombinationsMode,
} from "@/lib/sim/combinationsStore";
import { setComboPageIa, useComboPageIa } from "@/lib/sim/comboPageIaStore";
import { setComboTemplates, useComboTemplates } from "@/lib/sim/comboTemplatesStore";
import { setComboAffordance, useComboAffordance } from "@/lib/sim/comboAffordanceStore";
import { setComboBrandStyle, useComboBrandStyle } from "@/lib/sim/comboBrandStore";
import { setComboCartStyle, useComboCartStyle } from "@/lib/sim/comboCartStyleStore";
import { setComboCartDrop, useComboCartDrop } from "@/lib/sim/comboCartDropStore";
import { setComboSheetBorder, useComboSheetBorder } from "@/lib/sim/comboSheetBorderStore";
import { setComboLineSlider, useComboLineSlider } from "@/lib/sim/comboLineSliderStore";
import { setBtcLiveCarouselCard, useBtcLiveCarouselCard } from "@/lib/sim/btcLiveCarouselCardStore";
import { setChartLiveCardHeader, useChartLiveCardHeader } from "@/lib/sim/chartLiveCardHeaderStore";
import { setChartLiveCardStack, useChartLiveCardStack } from "@/lib/sim/chartLiveCardStackStore";
import { setTeamAbbrUnderLogos, useTeamAbbrUnderLogos } from "@/lib/sim/teamAbbrUnderLogosStore";
import { setVenueSwitcher, useVenueSwitcher } from "@/lib/sim/venueSwitcherStore";
import { setSwipeToBuy, useSwipeToBuy } from "@/lib/sim/swipeToBuyStore";
import { setSuccessScreenStyle, useSuccessScreenStyle } from "@/lib/sim/successScreenStore";
import { setTradeCardLayout, useTradeCardLayout } from "@/lib/sim/tradeCardLayoutStore";
import { setOutcomeButtonColorMode, useOutcomeButtonColorMode, type OutcomeButtonColorMode } from "@/lib/sim/outcomeButtonColorStore";
import { exitComboFlow } from "@/lib/sim/comboFlowStore";
import { clearComboPicks } from "@/lib/sim/comboPicksStore";
import { setSpreadVariant, useSpreadVariant, type SpreadVariant } from "@/lib/sim/spreadVariantStore";
import { setLatestPlay, useLatestPlay } from "@/lib/sim/latestPlayStore";
import { setMmLogo, useMmLogo } from "@/lib/sim/mmLogoStore";
import { setChartGradient, useChartGradient } from "@/lib/sim/chartGradientStore";
import { setMarketDetailActions, useMarketDetailActions } from "@/lib/sim/marketDetailActionsStore";
import { setBaseballHeaderVariant, useBaseballHeaderVariant, type BaseballHeaderVariant } from "@/lib/sim/baseballHeaderStore";
import { setScoreUnitPadding, useScoreUnitPadding, type ScoreUnitPadding } from "@/lib/sim/scoreUnitPaddingStore";
import { consumeSettingsReturnPath, getSettingsReturnPath } from "@/lib/sim/settingsFabStore";
import { resetTryTheseDefaults } from "@/lib/sim/tryTheseDefaults";
import {
  setCategoryTileCount,
  setCategoryTileStyle,
  setSportsRailStyle,
  setSportsRailVariant,
  useCategoryTileCount,
  useCategoryTileStyle,
  useSportsRailStyle,
  useSportsRailVariant,
  type CategoryTileCount,
  type CategoryTileStyle,
  type SportsRailStyle,
  type SportsRailVariant,
} from "@/lib/sim/categoryTileStore";
import { sheetEnter, sheetExit, backdropIn, backdropOut } from "@/lib/sim/sheetMotion";
import { setHomeLayout, useHomeLayout, type HomeLayout } from "@/lib/sim/homeLayoutStore";
import { setTrendingFilterMode, useTrendingFilterMode, type TrendingFilterMode } from "@/lib/sim/trendingInlineStore";
import {
  FEED_SECTION_COUNTS,
  FEED_SECTION_ORDER,
  FEED_SECTION_TITLES,
  type FeedSectionConfig,
  type FeedSectionKey,
  type FeedSections,
} from "@/lib/sim/FeedSettingsContext";
import type { BodyAvatarSize, BtcLiveCarouselCard, CardStyle, CenterAccentWidth, Density, DetailTags, FooterDetail, FooterPosition, HeroBannerStyle, HeroBtcChart, HeroSectionOption, LiveCueColor, LiveFormat, OddsUnit, PopularPlacement, PopularRows, PositionBannerPlacement, PossessionScope, RevealMode, ScoreGlowMode, StandardAccent, TeamAvatarStyle, VersusAccent, VersusCenterLive, VersusHeaderAlign, VersusLayout, VersusMode, VersusScoreSize, VersusVersion } from "@/lib/sim/types";
import type { WorldCupHeaderVariant } from "@/lib/sim/worldCupHeaderStore";
import type { WorldCupMode } from "@/lib/sim/worldCupModeStore";
import type { PositionsLayout } from "@/lib/sim/positionsLayoutStore";
import { geist } from "@/lib/sim/geistFonts";
import { setTypeface, useDisplayFont, useOswaldDataSet, useTypeface, type TypefaceMode } from "@/lib/sim/typefaceStore";

type IconName = keyof typeof Ionicons.glyphMap;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// The display-settings sheet is intentionally dark in both app theme modes.
// Keep this palette local so switching the content theme cannot turn the
// settings controls into a light panel or reduce their dark-mode contrast.
const colors = {
  bg: "#000000",
  surface: "#18181B",
  surface2: "#222226",
  surfaceTransparent: "#18181B",
  cardBorder: darkTheme.colors.border.muted,
  textPrimary: darkTheme.colors.text.default,
  textMuted: darkTheme.colors.text.alternative,
  accent: darkTheme.colors.primary.default,
  green: darkTheme.colors.success.default,
  greenOutline: darkTheme.colors.success.default,
  greenSoft: darkTheme.colors.success.muted,
  red: darkTheme.colors.error.default,
  redSoft: darkTheme.colors.error.muted,
} as const;

// The settings sheet exposes the core theme and Sports IA controls, plus the
// MetaMask-only sports navigation choice. Flip this to restore every
// experimental control; all underlying stores stay active either way.
const ADVANCED_SETTINGS = false;

function sportsIaRoute(next: SportsIa, returnPath: string): string | null {
  const path = returnPath.split("?")[0];
  const kalshiSport = path.match(/^\/kalshi-sport\/([^/]+)/)?.[1];
  const polySport = path.match(/^\/poly-sport\/([^/]+)/)?.[1];
  const uxrSport = path.match(/^\/uxr-sport\/([^/]+)/)?.[1];
  const sub = returnPath.match(/[?&]sub=([^&]+)/)?.[1];

  if (next === "polymarket-metamask") {
    if (kalshiSport || polySport || uxrSport || path === "/uxr-hub/sports" || path === "/uxr-categories" || path === "/sports-leagues") {
      return "/uxr-hub/sports";
    }
    return null;
  }

  if (next === "polymarket") {
    if (kalshiSport) return `/poly-sport/${kalshiSport}`;
    if (path === "/kalshi-sports" || path.startsWith("/kalshi-league/")) return "/uxr-hub/sports";
    return null;
  }

  if (polySport) return `/kalshi-sport/${polySport}`;
  if (uxrSport) return `/kalshi-sport/${uxrSport}`;
  if (path === "/uxr-hub/sports" && sub) return `/kalshi-sport/${decodeURIComponent(sub)}`;
  if (path === "/uxr-hub/sports" || path === "/uxr-categories" || path === "/sports-leagues") return "/kalshi-sports";
  return null;
}

// Display-settings bottom sheet opened by tapping the "Predictions" title.
// Tile-based picker: every setting is a labelled group of compact tappable
// tiles (icon + label inline). Selection reads as a quiet white outline rather
// than a colored fill — minimal chrome keeps the sheet short.
export function SettingsSheet({
  visible,
  onClose,
  density,
  onDensityChange,
  liveCue,
  onLiveCueChange,
  showFooter,
  onShowFooterChange,
  footerDetail,
  onFooterDetailChange,
  detailTags,
  onDetailTagsChange,
  revealMode,
  onRevealModeChange,
  versusLayout,
  onVersusLayoutChange,
  scoreGlow,
  onScoreGlowChange,
  scoreGlowMode,
  onScoreGlowModeChange,
  scorerCallout,
  onScorerCalloutChange,
  innerGlow,
  onInnerGlowChange,
  whiteBars,
  onWhiteBarsChange,
  barTrack,
  onBarTrackChange,
  heroSection,
  onHeroSectionChange,
  heroBannerStyle,
  onHeroBannerStyleChange,
  heroBtcChart,
  onHeroBtcChartChange,
  heroBtcOrange,
  onHeroBtcOrangeChange,
  sections,
  onSectionChange,
  popularPlacement,
  onPopularPlacementChange,
  popularRows,
  onPopularRowsChange,
  cardStyle,
  onCardStyleChange,
  possessionScope,
  onPossessionScopeChange,
  versusMode,
  onVersusModeChange,
  versusAccent,
  onVersusAccentChange,
  versusHeaderAlign,
  onVersusHeaderAlignChange,
  versusCenterLive,
  onVersusCenterLiveChange,
  footerPosition,
  onFooterPositionChange,
  versusVersion,
  onVersusVersionChange,
  versusUpcoming,
  onVersusUpcomingChange,
  standardAccent,
  onStandardAccentChange,
  centerAccentWidth,
  onCenterAccentWidthChange,
  accentOpacity,
  onAccentOpacityChange,
  oddsUnit,
  onOddsUnitChange,
  showClaim,
  onShowClaimChange,
  showPositionBanner,
  onShowPositionBannerChange,
  positionBannerPlacement,
  onPositionBannerPlacementChange,
  versusScoreSize,
  onVersusScoreSizeChange,
  bodyAvatarSize,
  onBodyAvatarSizeChange,
  sportsMarketAvatar,
  onSportsMarketAvatarChange,
  stickyFooter,
  onStickyFooterChange,
  regionControl,
  onRegionControlChange,
  liveFormat,
  onLiveFormatChange,
  hideVersusAccent,
  onHideVersusAccentChange,
  tennisHidden,
  onTennisHiddenChange,
  sportsExamples,
  onSportsExamplesChange,
  athletePhotos,
  onAthletePhotosChange,
  showLiveAccent,
  onShowLiveAccentChange,
  showLiveGames,
  onShowLiveGamesChange,
  liveGamesCard,
  onLiveGamesCardChange,
  onBtcLiveCarouselCardChange,
  showActivePositions,
  onShowActivePositionsChange,
  showBtcUpDown,
  onShowBtcUpDownChange,
  showTeamAvatars,
  onShowTeamAvatarsChange,
  standardDateInFooter,
  onStandardDateInFooterChange,
  teamAvatars,
  onTeamAvatarsChange,
  worldCupBracket,
  onWorldCupBracketChange,
  worldCupHeader,
  onWorldCupHeaderChange,
  worldCupMode,
  onWorldCupModeChange,
  positionsLayout,
  onPositionsLayoutChange,
  headerBalance,
  onHeaderBalanceChange,
  balancePillStyle,
  onBalancePillStyleChange,
  largeHeader,
  onLargeHeaderChange,
}: {
  visible: boolean;
  onClose: () => void;
  density: Density;
  onDensityChange: (d: Density) => void;
  liveCue: LiveCueColor;
  onLiveCueChange: (c: LiveCueColor) => void;
  showFooter: boolean;
  onShowFooterChange: (b: boolean) => void;
  footerDetail: FooterDetail;
  onFooterDetailChange: (v: FooterDetail) => void;
  detailTags: DetailTags;
  onDetailTagsChange: (v: DetailTags) => void;
  revealMode: RevealMode;
  onRevealModeChange: (m: RevealMode) => void;
  versusLayout: VersusLayout;
  onVersusLayoutChange: (l: VersusLayout) => void;
  scoreGlow: boolean;
  onScoreGlowChange: (b: boolean) => void;
  scoreGlowMode: ScoreGlowMode;
  onScoreGlowModeChange: (m: ScoreGlowMode) => void;
  scorerCallout: boolean;
  onScorerCalloutChange: (b: boolean) => void;
  innerGlow: boolean;
  onInnerGlowChange: (b: boolean) => void;
  whiteBars: boolean;
  onWhiteBarsChange: (b: boolean) => void;
  barTrack: boolean;
  onBarTrackChange: (b: boolean) => void;
  heroSection: HeroSectionOption;
  onHeroSectionChange: (v: HeroSectionOption) => void;
  heroBannerStyle: HeroBannerStyle;
  onHeroBannerStyleChange: (v: HeroBannerStyle) => void;
  heroBtcChart: HeroBtcChart;
  onHeroBtcChartChange: (v: HeroBtcChart) => void;
  heroBtcOrange: boolean;
  onHeroBtcOrangeChange: (v: boolean) => void;
  sections: FeedSections;
  onSectionChange: (key: FeedSectionKey, next: FeedSectionConfig) => void;
  popularPlacement: PopularPlacement;
  onPopularPlacementChange: (v: PopularPlacement) => void;
  popularRows: PopularRows;
  onPopularRowsChange: (v: PopularRows) => void;
  cardStyle: CardStyle;
  onCardStyleChange: (s: CardStyle) => void;
  possessionScope: PossessionScope;
  onPossessionScopeChange: (s: PossessionScope) => void;
  versusMode: VersusMode;
  onVersusModeChange: (m: VersusMode) => void;
  versusAccent: VersusAccent;
  onVersusAccentChange: (m: VersusAccent) => void;
  versusHeaderAlign: VersusHeaderAlign;
  onVersusHeaderAlignChange: (a: VersusHeaderAlign) => void;
  versusCenterLive: VersusCenterLive;
  onVersusCenterLiveChange: (v: VersusCenterLive) => void;
  footerPosition: FooterPosition;
  onFooterPositionChange: (p: FooterPosition) => void;
  versusVersion: VersusVersion;
  onVersusVersionChange: (v: VersusVersion) => void;
  versusUpcoming: boolean;
  onVersusUpcomingChange: (b: boolean) => void;
  standardAccent: StandardAccent;
  onStandardAccentChange: (m: StandardAccent) => void;
  centerAccentWidth: CenterAccentWidth;
  onCenterAccentWidthChange: (w: CenterAccentWidth) => void;
  accentOpacity: number;
  onAccentOpacityChange: (v: number) => void;
  oddsUnit: OddsUnit;
  onOddsUnitChange: (u: OddsUnit) => void;
  showClaim: boolean;
  onShowClaimChange: (b: boolean) => void;
  showPositionBanner: boolean;
  onShowPositionBannerChange: (b: boolean) => void;
  positionBannerPlacement: PositionBannerPlacement;
  onPositionBannerPlacementChange: (v: PositionBannerPlacement) => void;
  versusScoreSize: VersusScoreSize;
  onVersusScoreSizeChange: (v: VersusScoreSize) => void;
  bodyAvatarSize: BodyAvatarSize;
  onBodyAvatarSizeChange: (v: BodyAvatarSize) => void;
  sportsMarketAvatar: boolean;
  onSportsMarketAvatarChange: (v: boolean) => void;
  stickyFooter: boolean;
  onStickyFooterChange: (b: boolean) => void;
  regionControl: "banner" | "header";
  onRegionControlChange: (v: "banner" | "header") => void;
  liveFormat: LiveFormat;
  onLiveFormatChange: (v: LiveFormat) => void;
  hideVersusAccent: boolean;
  onHideVersusAccentChange: (b: boolean) => void;
  tennisHidden: boolean;
  onTennisHiddenChange: (b: boolean) => void;
  sportsExamples: boolean;
  onSportsExamplesChange: (b: boolean) => void;
  athletePhotos: boolean;
  onAthletePhotosChange: (b: boolean) => void;
  showLiveAccent: boolean;
  onShowLiveAccentChange: (b: boolean) => void;
  showLiveGames: boolean;
  onShowLiveGamesChange: (b: boolean) => void;
  btcLiveCarouselCard: BtcLiveCarouselCard;
  onBtcLiveCarouselCardChange: (v: BtcLiveCarouselCard) => void;
  liveGamesCard: "compact" | "full";
  onLiveGamesCardChange: (v: "compact" | "full") => void;
  showActivePositions: boolean;
  onShowActivePositionsChange: (b: boolean) => void;
  showBtcUpDown: boolean;
  onShowBtcUpDownChange: (b: boolean) => void;
  showTeamAvatars: boolean;
  onShowTeamAvatarsChange: (b: boolean) => void;
  standardDateInFooter: boolean;
  onStandardDateInFooterChange: (b: boolean) => void;
  teamAvatars: TeamAvatarStyle;
  onTeamAvatarsChange: (s: TeamAvatarStyle) => void;
  worldCupBracket: boolean;
  onWorldCupBracketChange: (b: boolean) => void;
  worldCupHeader: WorldCupHeaderVariant;
  onWorldCupHeaderChange: (v: WorldCupHeaderVariant) => void;
  worldCupMode: WorldCupMode;
  onWorldCupModeChange: (v: WorldCupMode) => void;
  positionsLayout: PositionsLayout;
  onPositionsLayoutChange: (v: PositionsLayout) => void;
  headerBalance: boolean;
  onHeaderBalanceChange: (b: boolean) => void;
  balancePillStyle: "soft" | "solid" | "badge";
  onBalancePillStyleChange: (v: "soft" | "solid" | "badge") => void;
  largeHeader: boolean;
  onLargeHeaderChange: (b: boolean) => void;
}) {
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const router = useRouter();
  // Drive open/close manually so the sheet SLIDES in first and the dark backdrop
  // FADES in afterwards (RN's animationType="slide" would slide both together).
  const [render, setRender] = useState(visible);
  const [sheetHeight, setSheetHeight] = useState(0);
  // Collapse everything below the top "Card" controls behind a "More" toggle.
  const [showMore, setShowMore] = useState(false);
  const dsMode = useDsMode();
  const themeMode = useThemeMode();
  const uxrMode = useUxrMode();
  const sportsIa = useSportsIa();
  const sportsPageLayout = useSportsPageLayout();
  const polymarketMetaMaskSportsNav = usePolymarketMetaMaskSportsNav();
  const sportPagesNavOrder = useSportPagesNavOrder();
  const leaguePageVariant = useLeaguePageVariant();
  const combinationsVisible = useCombinationsVisible();
  const combinationsEntry = useCombinationsEntry();
  const combinationsMode = useCombinationsMode();
  const comboPageIa = useComboPageIa();
  const comboTemplates = useComboTemplates();
  const comboSheetBorder = useComboSheetBorder();
  const comboLineSlider = useComboLineSlider();
  const comboAffordance = useComboAffordance();
  const comboCartStyle = useComboCartStyle();
  const comboBrand = useComboBrandStyle();
  const comboCartDrop = useComboCartDrop();
  const storedBtcLiveCarouselCard = useBtcLiveCarouselCard();
  const chartLiveCardHeader = useChartLiveCardHeader();
  const chartLiveCardStack = useChartLiveCardStack();
  const showTeamAbbrUnderLogos = useTeamAbbrUnderLogos();
  const venueSwitcher = useVenueSwitcher();
  const swipeToBuy = useSwipeToBuy();
  const successScreenStyle = useSuccessScreenStyle();
  const tradeCardLayout = useTradeCardLayout();
  const outcomeButtonColor = useOutcomeButtonColorMode();
  const spreadVariant = useSpreadVariant();
  const latestPlay = useLatestPlay();
  const mmLogo = useMmLogo();
  const chartGradient = useChartGradient();
  const marketDetailActions = useMarketDetailActions();
  const categoryTileStyle = useCategoryTileStyle();
  const categoryTileCount = useCategoryTileCount();
  const sportsRailStyle = useSportsRailStyle();
  const sportsRailVariant = useSportsRailVariant();
  const homeLayout = useHomeLayout();
  const trendingFilterMode = useTrendingFilterMode();
  // Bet-slip feature toggles live in their own module store (the slip is mounted
  // at the app root, not under this sheet's props), so read/write them directly.
  const { orderTypes, yesNoMarket } = useBetSlipSettings();
  // Onboarding (verification flow) toggle lives in its own module store — the
  // flow is mounted at the app root, so read/write it directly.
  const { enabled: onboardingEnabled } = useOnboarding();
  const socialUx = useSocialUx();
  const homeSocialStyle = useHomeSocialStyle();
  const socialTour = useSocialTour();
  // Game-card layout toggle (moved here from the home header). Shared store so the
  // home feed + standalone pages stay in sync.
  const matchLayout = useMatchLayout();
  const displayFont = useDisplayFont();
  const oswald = useOswaldDataSet();
  const baseballHeaderVariant = useBaseballHeaderVariant();
  const scoreUnitPadding = useScoreUnitPadding();
  const onBaseballHeaderChange = (next: BaseballHeaderVariant) => {
    setBaseballHeaderVariant(next);
    const returnPath = consumeSettingsReturnPath();
    if (returnPath?.startsWith("/match-detail")) {
      onClose();
      router.replace(returnPath as never);
    }
  };
  const onSportsIaChange = (next: SportsIa) => {
    setSportsIa(next);
    const returnPath = getSettingsReturnPath();
    const target = returnPath ? sportsIaRoute(next, returnPath) : null;
    if (!target) return;
    consumeSettingsReturnPath();
    onClose();
    // Let the sheet begin dismissing before replacing the home route. This
    // keeps the route switch from being hidden behind the sheet's last frame.
    requestAnimationFrame(() => router.replace(target as never));
  };
  const slide = useRef(new Animated.Value(0)).current; // 0 = hidden (down), 1 = shown
  const fade = useRef(new Animated.Value(0)).current; // backdrop opacity 0..1

  useEffect(() => {
    if (visible) {
      setRender(true);
    } else {
      Animated.parallel([backdropOut(fade), sheetExit(slide)]).start(({ finished }) => {
        if (finished) setRender(false);
      });
    }
  }, [visible, fade, slide]);

  useEffect(() => {
    if (render && visible) {
      slide.setValue(0);
      fade.setValue(0);
      // Backdrop fades in parallel with the rising sheet (0.2s), per the iOS
      // motion vocabulary — content never waits for a sequenced fade.
      Animated.parallel([sheetEnter(slide), backdropIn(fade)]).start();
    }
  }, [render, visible, fade, slide]);

  const translateY = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetHeight || 800, 0],
  });

  return (
    <Modal visible={render} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <AnimatedPressable
          style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.6)", opacity: fade }]}
          onPress={onClose}
        />
        {/* Inner Pressable swallows taps so they don't close the sheet. */}
        <Animated.View style={{ transform: [{ translateY }] }}>
        <Pressable
          onPress={() => {}}
          onLayout={(e) => setSheetHeight(e.nativeEvent.layout.height)}
          style={{
            // Section layer above the pure-black app background.
            backgroundColor: colors.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: insets.bottom + 16,
            maxHeight: winH * 0.88,
            minHeight: 0,
          }}
        >
          <View style={{ alignItems: "center", marginBottom: 12 }}>
            <View style={{ width: 36, height: 5, borderRadius: 3, backgroundColor: colors.surface2 }} />
          </View>

          <Text {...oswald} style={{ fontFamily: displayFont, fontSize: 16, lineHeight: 20, color: colors.textPrimary, marginBottom: 10 }}>
            Display
          </Text>

          <ScrollView
            style={{ flexShrink: 1 }}
            contentContainerStyle={{ gap: 16, paddingBottom: 2 }}
            showsVerticalScrollIndicator={false}
          >
            <SettingsSection title="Try these">
              <Button
                variant={ButtonVariant.Secondary}
                size={ButtonSize.Md}
                onPress={() => {
                  resetTryTheseDefaults();
                  onBtcLiveCarouselCardChange("simple");
                }}
              >
                Reset
              </Button>
              <View
                style={{
                  gap: 14,
                  backgroundColor: "#000000",
                  borderRadius: 16,
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                }}
              >
                <View style={{ gap: 4 }}>
                  <TileGroup<"on" | "off">
                    label="Social UX"
                    icon="chatbubbles-outline"
                    value={socialUx ? "on" : "off"}
                    onChange={(v) => setSocialUx(v === "on")}
                    emphasis
                    prominent
                    options={[
                      { value: "off", label: "Off", icon: "close-circle-outline" },
                      { value: "on", label: "On", icon: "chatbubbles-outline" },
                    ]}
                  />
                  <Text style={{ fontFamily: geist.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted, paddingLeft: 26 }}>
                    Trade success becomes a shareable post. Market pages gain Markets, Positions, Social feed, and Live trade tabs.
                  </Text>
                </View>
                {socialUx ? (
                <View style={{ gap: 4 }}>
                  <TileGroup<"ticker" | "carousel">
                    label="What people are saying"
                    icon="people-outline"
                    value={homeSocialStyle}
                    onChange={setHomeSocialStyle}
                    emphasis
                    prominent
                    options={[
                      { value: "ticker", label: "Ticker", icon: "swap-vertical-outline" },
                      { value: "carousel", label: "Carousel", icon: "albums-outline" },
                    ]}
                  />
                  <Text style={{ fontFamily: geist.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted, paddingLeft: 26 }}>
                    Ticker rotates posts in place. Carousel swipes through share cards with the position ticket inside.
                  </Text>
                </View>
                ) : null}
                <View style={{ gap: 4 }}>
                  <TileGroup<"on" | "off">
                    label="Social UX walkthrough"
                    icon="map-outline"
                    value={socialTour.active ? "on" : "off"}
                    onChange={(v) => {
                      if (v === "on") {
                        setSocialUx(true);
                        startSocialTour();
                        onClose();
                      } else {
                        stopSocialTour();
                      }
                    }}
                    emphasis
                    prominent
                    options={[
                      { value: "off", label: "Off", icon: "close-circle-outline" },
                      { value: "on", label: "Tour", icon: "map-outline" },
                    ]}
                  />
                  <Text style={{ fontFamily: geist.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted, paddingLeft: 26 }}>
                    Turns Social UX on if needed, then tours the new tabs with callout tooltips. Off cancels the tour.
                  </Text>
                </View>
                <View style={{ gap: 4 }}>
                  <TileGroup<"on" | "off">
                    label="Onboarding flow"
                    icon="id-card-outline"
                    value={onboardingEnabled ? "on" : "off"}
                    onChange={(v) => {
                      setOnboardingEnabled(v === "on");
                      if (v === "on") onClose();
                    }}
                    emphasis
                    prominent
                    options={[
                      { value: "off", label: "Off", icon: "close-circle-outline" },
                      { value: "on", label: "On", icon: "id-card-outline" },
                    ]}
                  />
                  <Text style={{ fontFamily: geist.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted, paddingLeft: 26 }}>
                    Starts the Kalshi-style splash and verification flow. Off skips it.
                  </Text>
                </View>
                <View style={{ gap: 4 }}>
                  <TileGroup<"on" | "off">
                    label="Combos"
                    icon="git-merge-outline"
                    value={combinationsVisible ? "on" : "off"}
                    onChange={(v) => {
                      const on = v === "on";
                      setCombinationsVisible(on);
                      if (!on) {
                        exitComboFlow();
                        clearComboPicks();
                      }
                    }}
                    emphasis
                    prominent
                    options={[
                      { value: "off", label: "Off", icon: "close-circle-outline" },
                      { value: "on", label: "On", icon: "git-merge-outline" },
                    ]}
                  />
                  <Text style={{ fontFamily: geist.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted, paddingLeft: 26 }}>
                    Stack moneyline legs across games. On by default; persists like Social UX.
                  </Text>
                </View>
                {combinationsVisible ? (
                <>
                <View style={{ gap: 4 }}>
                  <TileGroup<"tile" | "banner" | "fab">
                    label="Combos entry"
                    icon="layers-outline"
                    value={combinationsEntry}
                    onChange={setCombinationsEntry}
                    emphasis
                    prominent
                    options={[
                      { value: "tile", label: "Tile", icon: "color-palette-outline" },
                      { value: "banner", label: "Banner", icon: "albums-outline" },
                      { value: "fab", label: "Button", icon: "add-circle-outline" },
                    ]}
                  />
                  <Text style={{ fontFamily: geist.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted, paddingLeft: 26 }}>
                    Tile is first in Explore. Banner sits on home. Floating button sits at the bottom of the screen.
                  </Text>
                </View>
                <View style={{ gap: 4 }}>
                  <TileGroup<"tabs" | "browse">
                    label="Combos page"
                    icon="albums-outline"
                    value={comboPageIa}
                    onChange={setComboPageIa}
                    emphasis
                    prominent
                    options={[
                      { value: "tabs", label: "Tabs", icon: "list-outline" },
                      { value: "browse", label: "Browse", icon: "open-outline" },
                    ]}
                  />
                  <Text style={{ fontFamily: geist.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted, paddingLeft: 26 }}>
                    Tabs keep sports on this page with league chips. Browse opens a sport page.
                  </Text>
                </View>
                <View style={{ gap: 4 }}>
                  <TileGroup<"on" | "off">
                    label="Templates"
                    icon="copy-outline"
                    value={comboTemplates ? "on" : "off"}
                    onChange={(v) => setComboTemplates(v === "on")}
                    emphasis
                    prominent
                    options={[
                      { value: "off", label: "Off", icon: "close-circle-outline" },
                      { value: "on", label: "On", icon: "copy-outline" },
                    ]}
                  />
                  <Text style={{ fontFamily: geist.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted, paddingLeft: 26 }}>
                    Home carousel of ready-made combos. Combos page starts on a Templates tab.
                  </Text>
                </View>
                <View style={{ gap: 4 }}>
                  <TileGroup<"muted" | "gradient">
                    label="Combo sheet border"
                    icon="ellipse-outline"
                    value={comboSheetBorder}
                    onChange={setComboSheetBorder}
                    emphasis
                    prominent
                    options={[
                      { value: "muted", label: "Muted", icon: "remove-outline" },
                      { value: "gradient", label: "Gradient", icon: "color-palette-outline" },
                    ]}
                  />
                  <Text style={{ fontFamily: geist.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted, paddingLeft: 26 }}>
                    Ticket chrome. Muted is a hairline; Gradient is the combo ring.
                  </Text>
                </View>
                <View style={{ gap: 4 }}>
                  <TileGroup<"on" | "off">
                    label="Combo line slider"
                    icon="options-outline"
                    value={comboLineSlider ? "on" : "off"}
                    onChange={(v) => setComboLineSlider(v === "on")}
                    emphasis
                    prominent
                    options={[
                      { value: "on", label: "On", icon: "swap-horizontal-outline" },
                      { value: "off", label: "Off", icon: "remove-outline" },
                    ]}
                  />
                  <Text style={{ fontFamily: geist.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted, paddingLeft: 26 }}>
                    Spread, totals, and win-by picker on the ticket. Off also hides the swap on those markets.
                  </Text>
                </View>
                <View style={{ gap: 4 }}>
                  <TileGroup<"gradient" | "flat">
                    label="Combo brand"
                    icon="color-palette-outline"
                    value={comboBrand}
                    onChange={setComboBrandStyle}
                    emphasis
                    prominent
                    options={[
                      { value: "gradient", label: "Gradient", icon: "color-palette-outline" },
                      { value: "flat", label: "Flat", icon: "square-outline" },
                    ]}
                  />
                  <Text style={{ fontFamily: geist.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted, paddingLeft: 26 }}>
                    Gradient is blue to lime. Flat is white on the combo mark, selected legs, cart, and swipe thumb.
                  </Text>
                </View>
                <View style={{ gap: 4 }}>
                  <TileGroup<"sheet" | "cart">
                    label="Combo affordance"
                    icon="cart-outline"
                    value={comboAffordance}
                    onChange={setComboAffordance}
                    emphasis
                    prominent
                    options={[
                      { value: "sheet", label: "Sheet", icon: "remove-outline" },
                      { value: "cart", label: "Cart", icon: "cart-outline" },
                    ]}
                  />
                  <Text style={{ fontFamily: geist.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted, paddingLeft: 26 }}>
                    Sheet keeps the empty Build your combo tray. Cart morphs into a bottom-right shopping cart.
                  </Text>
                </View>
                {comboAffordance === "cart" ? (
                <>
                <View style={{ gap: 4 }}>
                  <TileGroup<"outline" | "fill">
                    label="Combo cart"
                    icon="bag-handle-outline"
                    value={comboCartStyle}
                    onChange={setComboCartStyle}
                    emphasis
                    prominent
                    options={[
                      { value: "outline", label: "Outline", icon: "ellipse-outline" },
                      { value: "fill", label: "Fill", icon: "color-fill-outline" },
                    ]}
                  />
                  <Text style={{ fontFamily: geist.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted, paddingLeft: 26 }}>
                    Outline is the gradient ring and lime count. Fill is a gradient disc with a black mark and a card-colored badge with a white numeral.
                  </Text>
                </View>
                <View style={{ gap: 4 }}>
                  <TileGroup<"on" | "off">
                    label="Cart drop"
                    icon="arrow-down-outline"
                    value={comboCartDrop ? "on" : "off"}
                    onChange={(v) => setComboCartDrop(v === "on")}
                    emphasis
                    prominent
                    options={[
                      { value: "off", label: "Off", icon: "close-circle-outline" },
                      { value: "on", label: "On", icon: "arrow-down-outline" },
                    ]}
                  />
                  <Text style={{ fontFamily: geist.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted, paddingLeft: 26 }}>
                    When you add a market, it flies into the cart before the count updates.
                  </Text>
                </View>
                </>
                ) : null}
                </>
                ) : null}
                <View style={{ gap: 4 }}>
                  <TileGroup<"simple" | "chart">
                    label="Live cards"
                    icon="logo-bitcoin"
                    value={storedBtcLiveCarouselCard}
                    onChange={(v) => {
                      setBtcLiveCarouselCard(v);
                      onBtcLiveCarouselCardChange(v);
                    }}
                    emphasis
                    prominent
                    options={[
                      { value: "simple", label: "Simple", icon: "radio-button-on-outline" },
                      { value: "chart", label: "Chart", icon: "analytics-outline" },
                    ]}
                  />
                  {storedBtcLiveCarouselCard === "chart" ? (
                    <>
                    <TileGroup<"avatar" | "score" | "minimized">
                      label="Live chart header"
                      icon="shirt-outline"
                      value={chartLiveCardHeader}
                      onChange={setChartLiveCardHeader}
                      emphasis
                      prominent
                      options={[
                        { value: "avatar", label: "Sandwich", icon: "people-outline" },
                        { value: "score", label: "Score", icon: "remove-outline" },
                        { value: "minimized", label: "Names", icon: "text-outline" },
                      ]}
                    />
                    <TileGroup<"header" | "chart">
                      label="Stack"
                      icon="layers-outline"
                      value={chartLiveCardStack}
                      onChange={setChartLiveCardStack}
                      emphasis
                      prominent
                      options={[
                        { value: "header", label: "Header" },
                        { value: "chart", label: "Chart" },
                      ]}
                    />
                    </>
                  ) : null}
                  <Text style={{ fontFamily: geist.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted, paddingLeft: 26 }}>
                    {storedBtcLiveCarouselCard === "chart"
                      ? "Sandwich is logos with LIVE between scores. Score puts LIVE on top and 21 – 0 in the middle. Names is team names and score chips. Tennis always uses the detail score unit. Stack Chart puts the sparkline above the scoreboard."
                      : "Simple is the compact BTC dial. Chart is the sparkline card on the Live rail."}
                  </Text>
                  <TileGroup<"on" | "off">
                    label="Team abbreviations"
                    icon="text-outline"
                    value={showTeamAbbrUnderLogos ? "on" : "off"}
                    onChange={(v) => setTeamAbbrUnderLogos(v === "on")}
                    emphasis
                    prominent
                    options={[
                      { value: "off", label: "Hide", icon: "eye-off-outline" },
                      { value: "on", label: "Show", icon: "eye-outline" },
                    ]}
                  />
                  <Text style={{ fontFamily: geist.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted, paddingLeft: 26 }}>
                    ARS / LIV under crests on feed versus and live carousel Sandwich/Score. Hide aligns logos with the scores. Detail pages keep abbreviations. Tennis names stay.
                  </Text>
                </View>
                <View style={{ gap: 4 }}>
                  <TileGroup<"on" | "off">
                    label="Buy confirm"
                    icon="swap-horizontal-outline"
                    value={swipeToBuy ? "on" : "off"}
                    onChange={(v) => setSwipeToBuy(v === "on")}
                    emphasis
                    prominent
                    options={[
                      { value: "on", label: "Swipe", icon: "swap-horizontal-outline" },
                      { value: "off", label: "Button", icon: "square-outline" },
                    ]}
                  />
                  <Text style={{ fontFamily: geist.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted, paddingLeft: 26 }}>
                    Swipe is swipe-to-buy on the slip. Button is the standard MetaMask primary button.
                  </Text>
                </View>
                <View style={{ gap: 4 }}>
                  <TileGroup<"gradient" | "flat">
                    label="Success screen"
                    icon="checkmark-circle-outline"
                    value={successScreenStyle}
                    onChange={setSuccessScreenStyle}
                    emphasis
                    prominent
                    options={[
                      { value: "gradient", label: "Gradient", icon: "color-palette-outline" },
                      { value: "flat", label: "Flat", icon: "square-outline" },
                    ]}
                  />
                  <Text style={{ fontFamily: geist.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted, paddingLeft: 26 }}>
                    After a buy, wash the page with the swipe gradient. Inverse buttons stay readable on color.
                  </Text>
                </View>
                <View style={{ gap: 4 }}>
                  <TileGroup<"ticket" | "compact">
                    label="Trade card"
                    icon="ticket-outline"
                    value={tradeCardLayout}
                    onChange={setTradeCardLayout}
                    emphasis
                    prominent
                    options={[
                      { value: "ticket", label: "Detailed", icon: "albums-outline" },
                      { value: "compact", label: "Compact", icon: "list-outline" },
                    ]}
                  />
                  <Text style={{ fontFamily: geist.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted, paddingLeft: 26 }}>
                    Detailed ticket is the default. Compact is ticker + outcome tag + $ / %.
                  </Text>
                </View>
              </View>
            </SettingsSection>

            <SettingsSection title="Appearance">
            {/* Theme: dark (default) or MetaMask's official light design
                tokens. Store: lib/sim/dsModeStore.ts (theme dimension). */}
            <TileGroup<ThemeMode>
              label="Theme"
              value={themeMode}
              onChange={setThemeMode}
              emphasis
              options={[
                { value: "dark", label: "Dark", icon: "moon-outline" },
                { value: "light", label: "Light", icon: "sunny-outline" },
              ]}
            />
            </SettingsSection>

            <SettingsSection title="Sports">
            <TileGroup<SportsPageLayout>
              label="Sports page"
              value={sportsPageLayout}
              onChange={setSportsPageLayout}
              emphasis
              options={[
                { value: "list", label: SPORTS_PAGE_LAYOUT_LABELS.list, icon: "list-outline" },
                { value: "page", label: SPORTS_PAGE_LAYOUT_LABELS.page, icon: "grid-outline" },
              ]}
            />
            <TileGroup<"rounded" | "pill">
              label="Button shape"
              value={usePillButtons() ? "pill" : "rounded"}
              onChange={(v) => setPillButtons(v === "pill")}
              emphasis
              options={[
                { value: "rounded", label: "Rounded", icon: "square-outline" },
                { value: "pill", label: "Pill", icon: "ellipse-outline" },
              ]}
            />
            <TileGroup<TypefaceMode>
              label="Type"
              value={useTypeface()}
              onChange={setTypeface}
              emphasis
              options={[
                { value: "current", label: "Current type", icon: "text-outline" },
                { value: "future", label: "Future type", icon: "color-wand-outline" },
              ]}
            />
            {/* Sports IA: which information architecture the sports experience
                uses. Store: lib/sim/sportsIaStore.ts */}
            <View style={{ gap: 8 }}>
              <Text style={{ fontFamily: geist.semibold, fontSize: 12, lineHeight: 16, color: colors.textPrimary }}>
                Sports IA
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {SPORTS_IA_OPTIONS.map((m) => {
                  const active = sportsIa === m;
                  return (
                    <Pressable
                      key={m}
                      onPress={() => onSportsIaChange(m)}
                      style={{
                        flexBasis: "48%",
                        flexGrow: 1,
                        flexShrink: 0,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        height: 48,
                        borderRadius: 12,
                        paddingHorizontal: 14,
                        backgroundColor: active ? colors.accent : "rgba(255,255,255,0.07)",
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: active ? geist.semibold : geist.medium,
                          fontSize: 14,
                          color: active ? "#ffffff" : colors.textPrimary,
                        }}
                        numberOfLines={1}
                      >
                        {SPORTS_IA_LABELS[m]}
                      </Text>
                      {active ? <Ionicons name="checkmark" size={18} color="#ffffff" /> : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <TileGroup<"versus" | "standard" | "mixed">
              label="Sports card variant"
              icon="albums-outline"
              value={matchLayout}
              onChange={setMatchLayout}
              emphasis
              options={[
                { value: "versus", label: "Versus", icon: "git-merge-outline" },
                { value: "standard", label: "Standard", icon: "list-outline" },
                { value: "mixed", label: "Mixed", icon: "git-compare-outline" },
              ]}
            />
            </SettingsSection>

            {sportsIa === "polymarket-metamask" && (
              <SettingsSection title="Sports navigation">
              <TileGroup<PolymarketMetaMaskSportsNav>
                label="Layout"
                icon="swap-horizontal-outline"
                value={polymarketMetaMaskSportsNav}
                onChange={setPolymarketMetaMaskSportsNav}
                emphasis
                options={[
                  { value: "tabs", label: "Tabs", icon: "list-outline" },
                  { value: "tiles", label: "Tiles", icon: "grid-outline" },
                ]}
              />
              </SettingsSection>
            )}

            {sportsIa === "polymarket-sport-pages" && (
              <SettingsSection title="Sport pages">
              <TileGroup<SportPagesNavOrder>
                label="Order"
                icon="reorder-three-outline"
                value={sportPagesNavOrder}
                onChange={setSportPagesNavOrder}
                emphasis
                options={[
                  { value: "chipsFirst", label: "Chips first", icon: "options-outline" },
                  { value: "tabsFirst", label: "Tabs first", icon: "list-outline" },
                ]}
              />
              </SettingsSection>
            )}

            {/* Everything below the core controls is hidden for now. Flip
                ADVANCED_SETTINGS to restore the full experimental control set
                — the stores all remain live. */}
            {ADVANCED_SETTINGS && (
            <>
            {/* UXR mode starts with a clean slate — every legacy control below is
                classic-only. New UXR-specific settings mount here. */}
            {uxrMode === "uxr" && (
              <TileGroup<HomeLayout>
                label="Home layout"
                icon="grid-outline"
                value={homeLayout}
                onChange={setHomeLayout}
                emphasis
                options={[
                  { value: "feed", label: "Feed", icon: "list-outline" },
                  { value: "pills", label: "Tabs", icon: "ellipse-outline" },
                ]}
              />
            )}
            {uxrMode === "uxr" && (
              <TileGroup<BaseballHeaderVariant>
                label="Baseball detail header"
                icon="baseball-outline"
                value={baseballHeaderVariant}
                onChange={onBaseballHeaderChange}
                emphasis
                options={[
                  { value: "original", label: "Simple", icon: "grid-outline" },
                  { value: "bases", label: "Bases", icon: "baseball-outline" },
                ]}
              />
            )}
            {uxrMode === "uxr" && (
              <TileGroup<TrendingFilterMode>
                label="Trending filters"
                icon="filter-outline"
                value={trendingFilterMode}
                onChange={setTrendingFilterMode}
                emphasis
                options={[
                  { value: "navigate", label: "Navigate", icon: "open-outline" },
                  { value: "inline", label: "In place", icon: "filter-outline" },
                ]}
              />
            )}
            {uxrMode === "uxr" && (
              <TileGroup<"on" | "off">
                label="Onboarding flow"
                icon="id-card-outline"
                value={onboardingEnabled ? "on" : "off"}
                onChange={(v) => setOnboardingEnabled(v === "on")}
                emphasis
                options={[
                  { value: "off", label: "Off", icon: "close-circle-outline" },
                  { value: "on", label: "On", icon: "id-card-outline" },
                ]}
              />
            )}
            {uxrMode === "uxr" && (
              <TileGroup<CombinationsMode>
                label="Combos"
                icon="git-merge-outline"
                value={combinationsMode}
                onChange={(v) => {
                  setCombinationsMode(v);
                  if (v === "off") {
                    exitComboFlow();
                    clearComboPicks();
                  }
                }}
                emphasis
                options={[
                  { value: "off", label: "Off", icon: "close-circle-outline" },
                  { value: "banner", label: "Banner", icon: "albums-outline" },
                  { value: "fab", label: "Button", icon: "add-circle-outline" },
                ]}
              />
            )}
            {uxrMode === "uxr" && (
              <TileGroup<LeaguePageVariant>
                label="League page"
                icon="trophy-outline"
                value={leaguePageVariant}
                onChange={setLeaguePageVariant}
                emphasis
                options={[
                  { value: "combined", label: "Combined", icon: "git-merge-outline" },
                  { value: "switcher", label: "Switcher", icon: "swap-horizontal-outline" },
                ]}
              />
            )}
            {uxrMode === "uxr" && (
              <TileGroup<SpreadVariant>
                label="Spread card"
                icon="reorder-two-outline"
                value={spreadVariant}
                onChange={setSpreadVariant}
                emphasis
                options={[
                  { value: "rows", label: "Team rows", icon: "reorder-two-outline" },
                  { value: "sentence", label: "Sentence", icon: "text-outline" },
                ]}
              />
            )}
            {uxrMode === "uxr" && (
              <TileGroup<CategoryTileStyle>
                label="Category visualization"
                icon="shapes-outline"
                value={categoryTileStyle}
                onChange={setCategoryTileStyle}
                emphasis
                options={[
                  { value: "material", label: "Icons", icon: "shapes-outline" },
                  { value: "illustration", label: "Illustrations", icon: "image-outline" },
                ]}
              />
            )}
            {uxrMode === "uxr" && (
              <TileGroup<CategoryTileCount>
                label="Category tiles"
                icon="apps-outline"
                value={categoryTileCount}
                onChange={setCategoryTileCount}
                emphasis
                options={[
                  { value: "many", label: ">3", icon: "albums-outline" },
                  { value: "three", label: "3", icon: "apps-outline" },
                ]}
              />
            )}
            {uxrMode === "uxr" && (
              <TileGroup<SportsRailVariant>
                label="Sports carousel"
                icon="basketball-outline"
                value={sportsRailVariant}
                onChange={setSportsRailVariant}
                emphasis
                options={[
                  { value: "sports", label: "Sports", icon: "basketball-outline" },
                  { value: "leagues", label: "Leagues", icon: "trophy-outline" },
                  { value: "mix", label: "Mix", icon: "shuffle-outline" },
                ]}
              />
            )}
            {uxrMode === "uxr" && (
              <TileGroup<SportsRailStyle>
                label="Sports tab style"
                icon="remove-outline"
                value={sportsRailStyle}
                onChange={setSportsRailStyle}
                emphasis
                options={[
                  { value: "pill", label: "Pill", icon: "ellipse-outline" },
                  { value: "tabs", label: "Tabs", icon: "remove-outline" },
                  { value: "horizontal", label: "Horizontal", icon: "swap-horizontal-outline" },
                ]}
              />
            )}

            <TileGroup<"16" | "hug">
              label="Sports detail header padding"
              icon="resize-outline"
              value={scoreUnitPadding === "hug" ? "hug" : "16"}
              onChange={(v) => setScoreUnitPadding(v === "hug" ? "hug" : 16)}
              emphasis
              options={[
                { value: "16", label: "16px sides", icon: "contract-outline" },
                { value: "hug", label: "Hug live", icon: "resize-outline" },
              ]}
            />

            <TileGroup<"show" | "hide">
              label="Chart gradients"
              value={chartGradient ? "show" : "hide"}
              onChange={(v) => setChartGradient(v === "show")}
              emphasis
              options={[
                { value: "show", label: "Show", icon: "color-fill-outline" },
                { value: "hide", label: "Hide", icon: "remove-outline" },
              ]}
            />

            <TileGroup<"fixed" | "inline">
              label="Market detail actions"
              value={marketDetailActions}
              onChange={setMarketDetailActions}
              emphasis
              options={[
                { value: "fixed", label: "Fixed bottom", icon: "arrow-down-circle-outline" },
                { value: "inline", label: "Inline", icon: "remove-outline" },
              ]}
            />

            {uxrMode === "classic" && (
            <>
            <Text style={{ fontFamily: geist.semibold, fontSize: 12, lineHeight: 16, color: colors.textPrimary }}>
              Card
            </Text>

            <TileGroup<DsMode>
              label="Design system"
              value={dsMode}
              onChange={setDsMode}
              emphasis
              options={[
                { value: "predict", label: "Predict", icon: "color-palette-outline" },
                { value: "metamask", label: "MetaMask", icon: "cube-outline" },
              ]}
            />

            <TileGroup<HeroSectionOption>
              label="Hero section"
              value={heroSection}
              onChange={onHeroSectionChange}
              emphasis
              options={[
                { value: "world-cup", label: "World Cup", icon: "football-outline" },
                { value: "btc", label: "BTC", icon: "logo-bitcoin" },
                { value: "carousel", label: "Carousel", icon: "images-outline" },
                { value: "none", label: "None", icon: "remove-outline" },
              ]}
            />

            {heroSection === "carousel" && (
              <TileGroup<HeroBannerStyle>
                label="Banner style"
                value={heroBannerStyle}
                onChange={onHeroBannerStyleChange}
                emphasis
                options={[
                  { value: "card", label: "Card", icon: "albums-outline" },
                  { value: "image", label: "Hero image", icon: "image-outline" },
                ]}
              />
            )}

            <TileGroup<VersusCenterLive>
              label="Centered layout"
              value={versusCenterLive}
              onChange={onVersusCenterLiveChange}
              emphasis
              options={[
                { value: "centered", label: "Live centered", icon: "git-commit-outline" },
                { value: "left", label: "Live left", icon: "swap-horizontal-outline" },
              ]}
            />

            {heroSection === "carousel" && (
              <TileGroup<"off" | "on">
                label="BTC orange theme"
                value={heroBtcOrange ? "on" : "off"}
                onChange={(v) => onHeroBtcOrangeChange(v === "on")}
                emphasis
                options={[
                  { value: "off", label: "Off", icon: "remove-circle-outline" },
                  { value: "on", label: "Orange", icon: "logo-bitcoin" },
                ]}
              />
            )}

            {heroSection === "carousel" && (
              <TileGroup<HeroBtcChart>
                label="BTC chart"
                value={heroBtcChart}
                onChange={onHeroBtcChartChange}
                emphasis
                options={[
                  { value: "target", label: "Target line", icon: "trending-up-outline" },
                  { value: "chevron", label: "Chevrons", icon: "chevron-down-outline" },
                ]}
              />
            )}

            <TileGroup<"show" | "hide">
              label="Live games carousel"
              value={showLiveGames ? "show" : "hide"}
              onChange={(v) => onShowLiveGamesChange(v === "show")}
              emphasis
              options={[
                { value: "hide", label: "Hide", icon: "eye-off-outline" },
                { value: "show", label: "Show", icon: "flash-outline" },
              ]}
            />

            {showLiveGames && (
              <TileGroup<"compact" | "full">
                label="Live games card"
                value={liveGamesCard}
                onChange={onLiveGamesCardChange}
                emphasis
                options={[
                  { value: "compact", label: "Compact", icon: "remove-outline" },
                  { value: "full", label: "Full", icon: "albums-outline" },
                ]}
              />
            )}

            {showLiveGames && (
              <TileGroup<"show" | "hide">
                label="Latest play row"
                value={latestPlay ? "show" : "hide"}
                onChange={(v) => setLatestPlay(v === "show")}
                emphasis
                options={[
                  { value: "hide", label: "Hide", icon: "eye-off-outline" },
                  { value: "show", label: "Show", icon: "football-outline" },
                ]}
              />
            )}

            <TileGroup<"show" | "hide">
              label="MetaMask logo"
              value={mmLogo ? "show" : "hide"}
              onChange={(v) => setMmLogo(v === "show")}
              options={[
                { value: "hide", label: "Hide", icon: "eye-off-outline" },
                { value: "show", label: "Show", icon: "cube-outline" },
              ]}
            />

            <TileGroup<"show" | "hide">
              label="Large header"
              value={largeHeader ? "show" : "hide"}
              onChange={(v) => onLargeHeaderChange(v === "show")}
              emphasis
              options={[
                { value: "hide", label: "Compact", icon: "remove-outline" },
                { value: "show", label: "Large", icon: "text-outline" },
              ]}
            />

            <TileGroup<"show" | "hide">
              label="Balance in header"
              value={headerBalance ? "show" : "hide"}
              onChange={(v) => onHeaderBalanceChange(v === "show")}
              emphasis
              options={[
                { value: "hide", label: "Card", icon: "card-outline" },
                { value: "show", label: "Header", icon: "wallet-outline" },
              ]}
            />

            {headerBalance && (
              <TileGroup<"soft" | "solid" | "badge">
                label="Balance pill style"
                value={balancePillStyle}
                onChange={onBalancePillStyleChange}
                emphasis
                options={[
                  { value: "badge", label: "Badge", icon: "notifications-outline" },
                  { value: "soft", label: "Soft", icon: "ellipse-outline" },
                  { value: "solid", label: "Solid", icon: "ellipse" },
                ]}
              />
            )}

            <TileGroup<TeamAvatarStyle>
              label="Team avatar style"
              value={teamAvatars}
              onChange={onTeamAvatarsChange}
              emphasis
              options={[
                { value: "logo", label: "Team logos", icon: "shield-outline" },
                { value: "icon", label: "Helmet / mitt", icon: "basketball-outline" },
                { value: "acronym", label: "Acronyms", icon: "text-outline" },
              ]}
            />

            <TileGroup<"show" | "hide">
              label="Footer"
              value={showFooter ? "show" : "hide"}
              onChange={(v) => onShowFooterChange(v === "show")}
              emphasis
              options={[
                { value: "hide", label: "Hide", icon: "square-outline" },
                { value: "show", label: "Show", icon: "reader-outline" },
              ]}
            />

            {showFooter && (
              <TileGroup<FooterPosition>
                label="Footer position"
                value={footerPosition}
                onChange={onFooterPositionChange}
                emphasis
                options={[
                  { value: "bottom", label: "Bottom", icon: "arrow-down-outline" },
                  { value: "topRight", label: "Top-right", icon: "arrow-up-outline" },
                ]}
              />
            )}

            {showFooter && footerPosition === "topRight" && (
              <MultiToggleGroup<keyof FooterDetail>
                label="Top-right detail"
                value={footerDetail}
                onChange={onFooterDetailChange}
                options={[
                  { key: "metadata", label: "Category", icon: "pricetag-outline" },
                  { key: "volume", label: "Volume", icon: "stats-chart-outline" },
                  { key: "outcomes", label: "Outcomes", icon: "list-outline" },
                ]}
              />
            )}

            {showFooter && footerPosition === "topRight" && footerDetail.metadata && (
              <TileGroup<"tag" | "text">
                label="Category style"
                value={detailTags.metadata ? "tag" : "text"}
                onChange={(v) => onDetailTagsChange({ ...detailTags, metadata: v === "tag" })}
                options={[
                  { value: "text", label: "Text", icon: "text-outline" },
                  { value: "tag", label: "Tag", icon: "pricetag-outline" },
                ]}
              />
            )}
            {showFooter && footerPosition === "topRight" && footerDetail.volume && (
              <TileGroup<"tag" | "text">
                label="Volume style"
                value={detailTags.volume ? "tag" : "text"}
                onChange={(v) => onDetailTagsChange({ ...detailTags, volume: v === "tag" })}
                options={[
                  { value: "text", label: "Text", icon: "text-outline" },
                  { value: "tag", label: "Tag", icon: "pricetag-outline" },
                ]}
              />
            )}
            {showFooter && footerPosition === "topRight" && footerDetail.outcomes && (
              <TileGroup<"tag" | "text">
                label="Outcomes style"
                value={detailTags.outcomes ? "tag" : "text"}
                onChange={(v) => onDetailTagsChange({ ...detailTags, outcomes: v === "tag" })}
                options={[
                  { value: "text", label: "Text", icon: "text-outline" },
                  { value: "tag", label: "Tag", icon: "pricetag-outline" },
                ]}
              />
            )}

            <TileGroup<"hide" | "footer" | "header">
              label="Region control"
              value={regionControl === "header" ? "header" : stickyFooter ? "footer" : "hide"}
              onChange={(v) => {
                if (v === "header") {
                  onRegionControlChange("header");
                } else if (v === "footer") {
                  onRegionControlChange("banner");
                  onStickyFooterChange(true);
                } else {
                  onRegionControlChange("banner");
                  onStickyFooterChange(false);
                }
              }}
              emphasis
              options={[
                { value: "hide", label: "Hide", icon: "eye-off-outline" },
                { value: "footer", label: "Footer", icon: "remove-outline" },
                { value: "header", label: "Header", icon: "chevron-down-outline" },
              ]}
            />

            <TileGroup<"badge" | "icon">
              label="Venue switcher"
              value={venueSwitcher}
              onChange={setVenueSwitcher}
              emphasis
              options={[
                { value: "badge", label: "Badge", icon: "pricetag-outline" },
                { value: "icon", label: "Icon", icon: "options-outline" },
              ]}
            />

            <TileGroup<VersusVersion>
              label="VS card header"
              value={versusVersion}
              onChange={onVersusVersionChange}
              emphasis
              options={[
                { value: "a", label: "Center", icon: "ellipse-outline" },
                { value: "b", label: "Left", icon: "return-up-back-outline" },
              ]}
            />

            <TileGroup<VersusLayout>
              label="Versus score"
              value={versusLayout}
              onChange={onVersusLayoutChange}
              emphasis
              options={[
                { value: "center", label: "Center", icon: "git-commit-outline" },
                { value: "sides", label: "Sides", icon: "swap-horizontal-outline" },
              ]}
            />

            <TileGroup<"24" | "28" | "32">
              label="Versus score size"
              value={String(versusScoreSize) as "24" | "28" | "32"}
              onChange={(v) => onVersusScoreSizeChange(Number(v) as VersusScoreSize)}
              emphasis
              options={[
                { value: "24", label: "24px", icon: "text-outline" },
                { value: "28", label: "28px", icon: "text-outline" },
                { value: "32", label: "32px", icon: "text-outline" },
              ]}
            />

            <TileGroup<"24" | "32" | "40">
              label="Card body avatar size"
              value={String(bodyAvatarSize) as "24" | "32" | "40"}
              onChange={(v) => onBodyAvatarSizeChange(Number(v) as BodyAvatarSize)}
              emphasis
              options={[
                { value: "24", label: "24px", icon: "person-outline" },
                { value: "32", label: "32px", icon: "person-outline" },
                { value: "40", label: "40px", icon: "person-outline" },
              ]}
            />

            <TileGroup<"on" | "off">
              label="Sports market avatar"
              value={sportsMarketAvatar ? "on" : "off"}
              onChange={(v) => onSportsMarketAvatarChange(v === "on")}
              emphasis
              options={[
                { value: "off", label: "Hide", icon: "eye-off-outline" },
                { value: "on", label: "Show", icon: "eye-outline" },
              ]}
            />

            <TileGroup<"on" | "off">
              label="Versus for upcoming games"
              value={versusUpcoming ? "on" : "off"}
              onChange={(v) => onVersusUpcomingChange(v === "on")}
              emphasis
              options={[
                { value: "off", label: "Off", icon: "list-outline" },
                { value: "on", label: "On", icon: "git-compare-outline" },
              ]}
            />

            <TileGroup<LiveFormat>
              label="LIVE format"
              value={liveFormat}
              onChange={onLiveFormatChange}
              emphasis
              options={[
                { value: "inline", label: "Truncated", icon: "remove-outline" },
                { value: "stacked", label: "LIVE included", icon: "reorder-two-outline" },
              ]}
            />

            {versusLayout === "center" && (
              <TileGroup<"show" | "hide">
                label="Versus accent + bloom (center)"
                value={hideVersusAccent ? "hide" : "show"}
                onChange={(v) => onHideVersusAccentChange(v === "hide")}
                emphasis
                options={[
                  { value: "hide", label: "Hide", icon: "eye-off-outline" },
                  { value: "show", label: "Show", icon: "sparkles-outline" },
                ]}
              />
            )}

            <TileGroup<"show" | "hide">
              label="Live border accent + glow"
              value={showLiveAccent ? "show" : "hide"}
              onChange={(v) => onShowLiveAccentChange(v === "show")}
              emphasis
              options={[
                { value: "hide", label: "Hide", icon: "eye-off-outline" },
                { value: "show", label: "Show", icon: "sparkles-outline" },
              ]}
            />

            <TileGroup<"on" | "off">
              label="Onboarding flow"
              value={onboardingEnabled ? "on" : "off"}
              onChange={(v) => setOnboardingEnabled(v === "on")}
              emphasis
              options={[
                { value: "off", label: "Off", icon: "close-circle-outline" },
                { value: "on", label: "On", icon: "id-card-outline" },
              ]}
            />


            <TileGroup<"show" | "hide">
              label="Tennis markets"
              value={tennisHidden ? "hide" : "show"}
              onChange={(v) => onTennisHiddenChange(v === "hide")}
              emphasis
              options={[
                { value: "hide", label: "Hide", icon: "eye-off-outline" },
                { value: "show", label: "Show", icon: "tennisball-outline" },
              ]}
            />

            <TileGroup<"show" | "hide">
              label="Sport examples"
              value={sportsExamples ? "show" : "hide"}
              onChange={(v) => onSportsExamplesChange(v === "show")}
              emphasis
              options={[
                { value: "hide", label: "Hide", icon: "eye-off-outline" },
                { value: "show", label: "Show", icon: "trophy-outline" },
              ]}
            />

            <TileGroup<"show" | "hide">
              label="Athlete photos"
              value={athletePhotos ? "show" : "hide"}
              onChange={(v) => onAthletePhotosChange(v === "show")}
              emphasis
              options={[
                { value: "hide", label: "Off", icon: "person-outline" },
                { value: "show", label: "On", icon: "person-circle-outline" },
              ]}
            />

            <TileGroup<"on" | "off">
              label="Market and limit order"
              value={orderTypes ? "on" : "off"}
              onChange={(v) => setOrderTypes(v === "on")}
              emphasis
              options={[
                { value: "off", label: "Off", icon: "remove-circle-outline" },
                { value: "on", label: "On", icon: "swap-vertical-outline" },
              ]}
            />

            <TileGroup<"on" | "off">
              label="Yes/No on orders"
              value={yesNoMarket ? "on" : "off"}
              onChange={(v) => setYesNoMarket(v === "on")}
              emphasis
              options={[
                { value: "off", label: "Hide", icon: "remove-circle-outline" },
                { value: "on", label: "Show", icon: "checkmark-circle-outline" },
              ]}
            />

            <Pressable
              onPress={() => setShowMore((s) => !s)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 12,
                marginTop: 2,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                backgroundColor: colors.surface2,
              }}
            >
              <Text style={{ fontFamily: geist.semibold, fontSize: 13, color: colors.textPrimary }}>
                {showMore ? "Less" : "More"}
              </Text>
              <Ionicons name={showMore ? "chevron-up" : "chevron-down"} size={16} color={colors.textMuted} />
            </Pressable>

            {showMore && (
            <>
            <View style={{ height: 1, backgroundColor: colors.surface2, marginVertical: 2 }} />

            <View style={{ gap: 8 }}>
              <Text style={{ fontFamily: geist.semibold, fontSize: 12, lineHeight: 16, color: colors.textPrimary }}>
                Sections
              </Text>
              {FEED_SECTION_ORDER.map((key) => (
                <SectionControl
                  key={key}
                  label={FEED_SECTION_TITLES[key]}
                  config={sections[key]}
                  onChange={(next) => onSectionChange(key, next)}
                />
              ))}
            </View>

            <TileGroup<"show" | "hide">
              label="Active positions"
              value={showActivePositions ? "show" : "hide"}
              onChange={(v) => onShowActivePositionsChange(v === "show")}
              options={[
                { value: "hide", label: "Hide", icon: "eye-off-outline" },
                { value: "show", label: "Show", icon: "briefcase-outline" },
              ]}
            />

            <TileGroup<"show" | "hide">
              label="BTC Up or Down"
              value={showBtcUpDown ? "show" : "hide"}
              onChange={(v) => onShowBtcUpDownChange(v === "show")}
              options={[
                { value: "hide", label: "Hide", icon: "eye-off-outline" },
                { value: "show", label: "Show", icon: "logo-bitcoin" },
              ]}
            />

            <TileGroup<"on" | "off">
              label="World Cup bracket"
              value={worldCupBracket ? "on" : "off"}
              onChange={(v) => onWorldCupBracketChange(v === "on")}
              options={[
                { value: "off", label: "Off", icon: "git-network-outline" },
                { value: "on", label: "On", icon: "git-network" },
              ]}
            />

            <TileGroup<WorldCupHeaderVariant>
              label="World Cup header"
              value={worldCupHeader}
              onChange={onWorldCupHeaderChange}
              options={[
                { value: "compact", label: "Compact", icon: "remove-outline" },
                { value: "lg", label: "Text", icon: "text-outline" },
                { value: "banner", label: "Banner", icon: "image-outline" },
                { value: "hero", label: "Hero", icon: "sparkles-outline" },
              ]}
            />

            <TileGroup<WorldCupMode>
              label="World Cup layout"
              value={worldCupMode}
              onChange={onWorldCupModeChange}
              options={[
                { value: "simple", label: "Simple", icon: "list-outline" },
                { value: "full", label: "Full", icon: "albums-outline" },
              ]}
            />

            <TileGroup<PositionsLayout>
              label="Positions header"
              value={positionsLayout}
              onChange={onPositionsLayoutChange}
              options={[
                { value: "default", label: "Default", icon: "card-outline" },
                { value: "stats", label: "Stats", icon: "stats-chart-outline" },
              ]}
            />

            <TileGroup<PopularPlacement>
              label="Popular today"
              value={popularPlacement}
              onChange={onPopularPlacementChange}
              options={[
                { value: "section", label: "Section", icon: "albums-outline" },
                { value: "inTrending", label: "In Trending", icon: "flame-outline" },
              ]}
            />

            <TileGroup<"1" | "2">
              label="Popular chip rows"
              value={popularRows === 1 ? "1" : "2"}
              onChange={(v) => onPopularRowsChange(v === "1" ? 1 : 2)}
              options={[
                { value: "1", label: "One row", icon: "remove-outline" },
                { value: "2", label: "Two rows", icon: "reorder-two-outline" },
              ]}
            />

            <View style={{ height: 1, backgroundColor: colors.surface2, marginVertical: 2 }} />

            <TileGroup<Density>
              label="Layout"
              value={density}
              onChange={onDensityChange}
              options={[
                { value: "compact", label: "Compact", icon: "contract-outline" },
                { value: "comfort", label: "Comfort", icon: "expand-outline" },
              ]}
            />

            <TileGroup<LiveCueColor>
              label="Live accent"
              value={liveCue}
              onChange={onLiveCueChange}
              options={[
                { value: "red", label: "Red", icon: "ellipse", iconColor: colors.red },
                { value: "green", label: "Green", icon: "ellipse", iconColor: colors.greenOutline },
              ]}
            />

            <TileGroup<RevealMode>
              label="Reveal on scroll"
              value={revealMode}
              onChange={onRevealModeChange}
              options={[
                { value: "off", label: "Off", icon: "eye-off-outline" },
                { value: "live", label: "Live", icon: "pulse-outline" },
                { value: "all", label: "All", icon: "eye-outline" },
              ]}
            />

            <TileGroup<"on" | "off">
              label="Score glow"
              value={scoreGlow ? "on" : "off"}
              onChange={(v) => onScoreGlowChange(v === "on")}
              options={[
                { value: "off", label: "Off", icon: "flash-off-outline" },
                { value: "on", label: "On", icon: "flash-outline" },
              ]}
            />

            {scoreGlow && (
              <TileGroup<ScoreGlowMode>
                label="Score glow style"
                value={scoreGlowMode}
                onChange={onScoreGlowModeChange}
                options={[
                  { value: "sides", label: "On sides", icon: "git-compare-outline" },
                  { value: "inPlace", label: "In place", icon: "swap-horizontal-outline" },
                ]}
              />
            )}

            {scoreGlow && (
              <TileGroup<"on" | "off">
                label="Scorer callout"
                value={scorerCallout ? "on" : "off"}
                onChange={(v) => onScorerCalloutChange(v === "on")}
                options={[
                  { value: "off", label: "Off", icon: "megaphone-outline" },
                  { value: "on", label: "On", icon: "megaphone-outline" },
                ]}
              />
            )}

            <TileGroup<"on" | "off">
              label="Border glow"
              value={innerGlow ? "on" : "off"}
              onChange={(v) => onInnerGlowChange(v === "on")}
              options={[
                { value: "off", label: "Off", icon: "sparkles-outline" },
                { value: "on", label: "On", icon: "sparkles" },
              ]}
            />

            <TileGroup<VersusMode>
              label="Card version"
              value={versusMode}
              onChange={onVersusModeChange}
              options={[
                { value: "new", label: "New", icon: "sparkles-outline" },
                { value: "old", label: "Old", icon: "albums-outline" },
              ]}
            />

            <TileGroup<VersusHeaderAlign>
              label="Versus header"
              value={versusHeaderAlign}
              onChange={onVersusHeaderAlignChange}
              options={[
                { value: "center", label: "Centered", icon: "ellipse-outline" },
                { value: "left", label: "Left", icon: "return-up-back-outline" },
              ]}
            />

            <TileGroup<VersusAccent>
              label="Versus accent"
              value={versusAccent}
              onChange={onVersusAccentChange}
              options={[
                { value: "corner", label: "Corner", icon: "return-up-back-outline" },
                { value: "center", label: "Centered", icon: "ellipse-outline" },
              ]}
            />

            <TileGroup<StandardAccent>
              label="Standard accent"
              value={standardAccent}
              onChange={onStandardAccentChange}
              options={[
                { value: "corner", label: "Corner", icon: "return-up-back-outline" },
                { value: "center", label: "Centered", icon: "ellipse-outline" },
              ]}
            />

            {(standardAccent === "center" || versusAccent === "center") && (
              <TileGroup<CenterAccentWidth>
                label="Centered glow width"
                value={centerAccentWidth}
                onChange={onCenterAccentWidthChange}
                options={[
                  { value: "default", label: "Default", icon: "remove-outline" },
                  { value: "full", label: "Full top", icon: "reorder-two-outline" },
                ]}
              />
            )}

            <SliderRow
              label="Accent opacity"
              value={accentOpacity}
              onChange={onAccentOpacityChange}
            />

            <TileGroup<OddsUnit>
              label="Odds unit"
              value={oddsUnit}
              onChange={onOddsUnitChange}
              options={[
                { value: "cents", label: "Cents", icon: "cash-outline" },
                { value: "percent", label: "Percent", icon: "stats-chart-outline" },
              ]}
            />

            <TileGroup<CardStyle>
              label="Card style"
              value={cardStyle}
              onChange={onCardStyleChange}
              options={[
                { value: "card", label: "Card", icon: "square-outline" },
                { value: "plain", label: "No background", icon: "scan-outline" },
                { value: "list", label: "List", icon: "list-outline" },
              ]}
            />

            <TileGroup<"show" | "hide">
              label="Team avatars"
              value={showTeamAvatars ? "show" : "hide"}
              onChange={(v) => onShowTeamAvatarsChange(v === "show")}
              options={[
                { value: "hide", label: "Hide", icon: "eye-off-outline" },
                { value: "show", label: "Show", icon: "people-outline" },
              ]}
            />

            <TileGroup<OutcomeButtonColorMode>
              label="Button color"
              value={outcomeButtonColor}
              onChange={setOutcomeButtonColorMode}
              options={[
                { value: "fill", label: "Color", icon: "color-palette-outline" },
                { value: "muted-color", label: "Color text", icon: "text-outline" },
                { value: "muted-white", label: "White text", icon: "contrast-outline" },
              ]}
            />

            <TileGroup<MarketRulesStyle>
              label="Event page"
              value={useMarketRulesStyle()}
              onChange={(v) => {
                setMarketRulesStyle(v);
              }}
              options={[
                { value: "banner", label: "Banner", icon: "card-outline" },
                { value: "section", label: "Section", icon: "list-outline" },
                { value: "about", label: "About tab", icon: "information-circle-outline" },
              ]}
            />
            <Text style={{ fontFamily: geist.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted, paddingLeft: 26, marginTop: -8 }}>
              Banner sits on Markets. About tab adds volume, end date, resolver, and rules. Section stacks rules, positions, and markets — social follows only when Social UX is on.
            </Text>


            <View style={{ height: 1, backgroundColor: colors.surface2, marginVertical: 2 }} />

            <Text style={{ fontFamily: geist.semibold, fontSize: 12, lineHeight: 16, color: colors.textPrimary }}>
              Card metadata
            </Text>

            <MultiToggleGroup
              label="Footer detail"
              value={footerDetail}
              onChange={onFooterDetailChange}
              options={[
                { key: "metadata", label: "Metadata", icon: "pricetag-outline" },
                { key: "volume", label: "Volume", icon: "stats-chart-outline" },
                { key: "endDate", label: "End date", icon: "calendar-outline" },
                { key: "outcomes", label: "Outcomes", icon: "list-outline" },
              ]}
            />

            {footerDetail.metadata && (
              <TileGroup<"tag" | "text">
                label="Category style"
                value={detailTags.metadata ? "tag" : "text"}
                onChange={(v) => onDetailTagsChange({ ...detailTags, metadata: v === "tag" })}
                options={[
                  { value: "text", label: "Text", icon: "text-outline" },
                  { value: "tag", label: "Tag", icon: "pricetag-outline" },
                ]}
              />
            )}
            {footerDetail.volume && (
              <TileGroup<"tag" | "text">
                label="Volume style"
                value={detailTags.volume ? "tag" : "text"}
                onChange={(v) => onDetailTagsChange({ ...detailTags, volume: v === "tag" })}
                options={[
                  { value: "text", label: "Text", icon: "text-outline" },
                  { value: "tag", label: "Tag", icon: "pricetag-outline" },
                ]}
              />
            )}
            {footerDetail.outcomes && (
              <TileGroup<"tag" | "text">
                label="Outcomes style"
                value={detailTags.outcomes ? "tag" : "text"}
                onChange={(v) => onDetailTagsChange({ ...detailTags, outcomes: v === "tag" })}
                options={[
                  { value: "text", label: "Text", icon: "text-outline" },
                  { value: "tag", label: "Tag", icon: "pricetag-outline" },
                ]}
              />
            )}

            <TileGroup<"show" | "hide">
              label="Date placement"
              value={standardDateInFooter ? "show" : "hide"}
              onChange={(v) => onStandardDateInFooterChange(v === "show")}
              options={[
                { value: "hide", label: "Header", icon: "arrow-up-outline" },
                { value: "show", label: "Footer", icon: "arrow-down-outline" },
              ]}
            />

            <View style={{ height: 1, backgroundColor: colors.surface2, marginVertical: 2 }} />

            <TileGroup<"white" | "team">
              label="Standard market color"
              value={whiteBars ? "white" : "team"}
              onChange={(v) => onWhiteBarsChange(v === "white")}
              options={[
                { value: "team", label: "Color", icon: "color-palette-outline" },
                { value: "white", label: "White", icon: "ellipse-outline" },
              ]}
            />

            <TileGroup<"show" | "hide">
              label="Bar background"
              value={barTrack ? "show" : "hide"}
              onChange={(v) => onBarTrackChange(v === "show")}
              options={[
                { value: "hide", label: "Hide", icon: "remove-outline" },
                { value: "show", label: "Show", icon: "reorder-two-outline" },
              ]}
            />

            <TileGroup<"show" | "hide">
              label="Claim button"
              value={showClaim ? "show" : "hide"}
              onChange={(v) => onShowClaimChange(v === "show")}
              options={[
                { value: "hide", label: "Hide", icon: "eye-off-outline" },
                { value: "show", label: "Show", icon: "gift-outline" },
              ]}
            />

            <TileGroup<"show" | "hide">
              label="Position confirmed banner"
              value={showPositionBanner ? "show" : "hide"}
              onChange={(v) => onShowPositionBannerChange(v === "show")}
              options={[
                { value: "hide", label: "Hide", icon: "eye-off-outline" },
                { value: "show", label: "Show", icon: "information-circle-outline" },
              ]}
            />

            {showPositionBanner && (
              <TileGroup<PositionBannerPlacement>
                label="Banner placement"
                value={positionBannerPlacement}
                onChange={onPositionBannerPlacementChange}
                options={[
                  { value: "carousel", label: "Carousel", icon: "albums-outline" },
                  { value: "inline", label: "Inline", icon: "remove-outline" },
                ]}
              />
            )}
            </>
            )}
            </>
            )}
            </>
            )}
          </ScrollView>
        </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

// A single section's control: one segmented row combining the on/off toggle and
// the card count. "Off" disables the section; picking a number (3-5) enables it
// at that count.
function SectionControl({
  label,
  config,
  onChange,
}: {
  label: string;
  config: FeedSectionConfig;
  onChange: (next: FeedSectionConfig) => void;
}) {
  const value = config.enabled ? String(config.count) : "off";
  const options: TileOption<string>[] = [
    { value: "off", label: "Off", icon: "remove-outline" },
    ...FEED_SECTION_COUNTS.map((n) => ({ value: String(n), label: String(n) })),
  ];
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Text style={{ flex: 1, fontFamily: geist.medium, fontSize: 13, color: colors.textPrimary }}>{label}</Text>
      <View style={{ flexDirection: "row", gap: 6, width: 196 }}>
        {options.map((opt) => (
          <Tile
            key={opt.value}
            option={opt}
            selected={opt.value === value}
            onPress={() => onChange(opt.value === "off" ? { ...config, enabled: false } : { enabled: true, count: Number(opt.value) })}
          />
        ))}
      </View>
    </View>
  );
}

type TileOption<T> = { value: T; label: string; icon?: IconName; iconColor?: string };

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View
      style={{
        gap: 8,
        paddingTop: 2,
        paddingBottom: 2,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.08)",
      }}
    >
      <Text style={{ fontFamily: geist.semibold, fontSize: 11, lineHeight: 14, color: colors.textMuted, letterSpacing: 0.3, textTransform: "uppercase" }}>
        {title}
      </Text>
      <View style={{ gap: 10, paddingBottom: 10 }}>{children}</View>
    </View>
  );
}

function TileGroup<T extends string>({
  label,
  icon,
  value,
  onChange,
  options,
  prominent,
}: {
  label: string;
  icon?: IconName;
  value: T;
  onChange: (v: T) => void;
  options: TileOption<T>[];
  // Accepted for call-site compatibility; the compact inline layout no longer
  // distinguishes emphasized controls.
  emphasis?: boolean;
  prominent?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, minHeight: prominent ? 36 : 32 }}>
      <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 8 }}>
        {icon ? <Ionicons name={icon} size={prominent ? 18 : 16} color={prominent ? colors.textPrimary : colors.textMuted} /> : null}
        <Text style={{ flex: 1, fontFamily: prominent ? geist.semibold : geist.medium, fontSize: prominent ? 15 : 13, lineHeight: prominent ? 20 : 17, color: colors.textPrimary }}>
          {label}
        </Text>
      </View>
      <View style={{ flexDirection: "row", flexShrink: 0, backgroundColor: colors.surface2, borderRadius: 9, padding: 2 }}>
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={{
                paddingHorizontal: 11,
                paddingVertical: 6,
                borderRadius: 7,
                backgroundColor: selected ? colors.accent : "transparent",
              }}
            >
              <Text
                style={{
                  fontFamily: selected ? geist.semibold : geist.medium,
                  fontSize: 12,
                  color: selected ? "#fff" : colors.textMuted,
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// Like TileGroup, but each tile toggles a boolean field independently (more than
// one can be active at once). Used for the composable "Footer detail" controls.
function MultiToggleGroup<K extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: Record<K, boolean>;
  onChange: (v: Record<K, boolean>) => void;
  options: { key: K; label: string; icon?: IconName }[];
}) {
  return (
    <View style={{ gap: 5 }}>
      <Text style={{ fontFamily: geist.medium, fontSize: 11, lineHeight: 14, color: colors.textMuted, letterSpacing: 0.2 }}>
        {label}
      </Text>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {options.map((opt) => (
          <Tile
            key={opt.key}
            option={{ value: opt.key, label: opt.label, icon: opt.icon }}
            selected={value[opt.key]}
            onPress={() => onChange({ ...value, [opt.key]: !value[opt.key] })}
          />
        ))}
      </View>
    </View>
  );
}

// A simple horizontal slider (0..1) built on PanResponder so it works on web
// and native without an extra dependency. The track's absolute x/width is
// measured via measureInWindow on layout, and drags map pageX → value.
function SliderRow({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const trackRef = useRef<View>(null);
  const geo = useRef({ x: 0, w: 0 });
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  const pct = max > min ? (clamp(value) - min) / (max - min) : 0;

  const measure = () => {
    trackRef.current?.measureInWindow((x, _y, w) => {
      geo.current = { x, w };
    });
  };

  const update = (pageX: number) => {
    const { x, w } = geo.current;
    if (w <= 0) return;
    const next = clamp(min + ((pageX - x) / w) * (max - min));
    onChange(Math.round(next * 100) / 100);
  };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => update(e.nativeEvent.pageX),
      onPanResponderMove: (e) => update(e.nativeEvent.pageX),
    }),
  ).current;

  return (
    <View style={{ gap: 5 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontFamily: geist.medium, fontSize: 11, lineHeight: 14, color: colors.textMuted, letterSpacing: 0.2 }}>
          {label}
        </Text>
        <Text style={{ fontFamily: geist.semibold, fontSize: 11, lineHeight: 14, color: colors.textPrimary }}>
          {Math.round(pct * 100)}%
        </Text>
      </View>
      <View
        ref={trackRef}
        onLayout={measure}
        {...responder.panHandlers}
        style={{ height: 36, justifyContent: "center" }}
      >
        <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.surface2, overflow: "hidden" }}>
          <View style={{ width: `${pct * 100}%`, height: "100%", backgroundColor: colors.accent }} />
        </View>
        <View
          style={{
            position: "absolute",
            left: `${pct * 100}%`,
            marginLeft: -9,
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: "#fff",
            borderWidth: 1,
            borderColor: colors.cardBorder,
          }}
        />
      </View>
    </View>
  );
}

function Tile<T extends string>({
  option,
  selected,
  onPress,
  emphasis = false,
}: {
  option: TileOption<T>;
  selected: boolean;
  onPress: () => void;
  emphasis?: boolean;
}) {
  const iconColor = option.iconColor ?? (emphasis && selected ? colors.accent : selected ? colors.textPrimary : colors.textMuted);
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: emphasis ? 7 : 5,
        paddingVertical: emphasis ? 13 : 7,
        paddingHorizontal: 6,
        borderRadius: emphasis ? 12 : 9,
        borderWidth: emphasis ? 1.5 : 1,
        borderColor: emphasis
          ? selected
            ? colors.accent
            : colors.cardBorder
          : selected
          ? "rgba(255,255,255,0.85)"
          : "transparent",
        backgroundColor: emphasis
          ? selected
            ? "rgba(68,89,255,0.18)"
            : colors.surface2
          : selected
          ? "rgba(255,255,255,0.08)"
          : colors.surface2,
      }}
    >
      {option.icon && <Ionicons name={option.icon} size={emphasis ? 18 : 14} color={iconColor} />}
      <Text
        style={{
          fontFamily: selected ? geist.semibold : geist.medium,
          fontSize: emphasis ? 14 : 12,
          color: selected ? colors.textPrimary : colors.textMuted,
        }}
      >
        {option.label}
      </Text>
    </Pressable>
  );
}
