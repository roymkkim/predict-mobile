import React from "react";
import { Animated, Pressable, StatusBar, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, usePathname } from "expo-router";

import { colors } from "@/lib/sim/colors";
import { screenTopInset } from "@/lib/sim/layout";
import { Feed } from "@/components/sim/Feed";
import { PillHome, TabsHomeRow, type PillKey } from "@/components/sim/PillHome";
import { FeedTabs } from "@/components/sim/FeedChrome";
import { SimpleHub, SportsHub } from "@/app/uxr-hub/[category]";
import { PolymarketMetaMaskSports } from "@/components/sim/PolymarketMetaMaskSports";
import { useHomeLayout } from "@/lib/sim/homeLayoutStore";
import { ComboSheet, type ComboPick } from "@/components/sim/ComboSheet";
import { ComboTray } from "@/components/sim/ComboTray";
import { replacePickInList } from "@/lib/sim/comboPicksStore";
import { NavHeader } from "@/components/sim/FeedChrome";
import { PageHeader } from "@/components/PageHeader";
import { SettingsSheet } from "@/components/sim/SettingsSheet";
import { MmProposalSettingsSheet } from "@/components/mm-proposal/SettingsSheet";
import { useSettingsOpenRequest } from "@/lib/sim/settingsFabStore";
import { SearchOverlay } from "@/components/mm-proposal/SearchOverlay";
import { RegionSheet } from "@/components/sim/RegionSheet";
import { setRegion, useRegion } from "@/lib/sim/regionStore";
import { useSportsIa } from "@/lib/sim/sportsIaStore";
import { LiveTickProvider } from "@/lib/sim/LiveTickContext";
import { LiveCueColorProvider } from "@/lib/sim/LiveCueColorContext";
import { FeedSettingsProvider } from "@/lib/sim/FeedSettingsContext";
import { useMatchLayout } from "@/lib/sim/matchLayoutStore";
import { useVersusMode, setVersusMode } from "@/lib/sim/versusModeStore";
import { useTopControls, setShowFooter, setVersusLayout, setVersusVersion, setVersusUpcoming } from "@/lib/sim/feedTopControlsStore";
import { useDsMode, useThemeMode } from "@/lib/sim/dsModeStore";
import { useUxrMode } from "@/lib/sim/uxrModeStore";
import { useTennisHidden, setTennisHidden } from "@/lib/sim/tennisHiddenStore";
import { useSportsExamples, setSportsExamples } from "@/lib/sim/sportsExamplesStore";
import { useAthletePhotos, setAthletePhotos } from "@/lib/sim/athletePhotosStore";
import { useAccentControls, setShowLiveAccent, setHideVersusAccent, setVersusAccent, setStandardAccent, setCenterAccentWidth, setAccentOpacity } from "@/lib/sim/accentControlsStore";
import { useVersusHeaderAlign, setVersusHeaderAlign } from "@/lib/sim/versusHeaderAlignStore";
import { useWorldCupBracket, setWorldCupBracket } from "@/lib/sim/worldCupBracketStore";
import { useWorldCupHeader, setWorldCupHeader } from "@/lib/sim/worldCupHeaderStore";
import { useWorldCupMode, setWorldCupMode } from "@/lib/sim/worldCupModeStore";
import { usePositionsLayout, setPositionsLayout } from "@/lib/sim/positionsLayoutStore";
import { ScrollRevealProvider, type CenterHighlightMode, type ReflectTarget } from "@/lib/sim/ScrollRevealContext";
import type { FeedSectionConfig, FeedSectionKey, FeedSections } from "@/lib/sim/FeedSettingsContext";
import { getBtcLiveCarouselCard } from "@/lib/sim/btcLiveCarouselCardStore";
import type { BodyAvatarSize, BtcLiveCarouselCard, CardStyle, Density, DetailTags, FooterDetail, FooterPosition, HeroBannerStyle, HeroBtcChart, HeroSectionOption, LiveCueColor, LiveFormat, OddsUnit, PopularPlacement, PopularRows, PositionBannerPlacement, PossessionScope, RevealMode, ScoreGlowMode, TeamAvatarStyle, VersusCenterLive, VersusScoreSize } from "@/lib/sim/types";
import { geist } from "@/lib/sim/geistFonts";

const INFO_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M7.33334 11.3333H8.66668V7.33333H7.33334V11.3333ZM8.00001 6C8.1889 6 8.34723 5.93611 8.47501 5.80833C8.60279 5.68056 8.66668 5.52222 8.66668 5.33333C8.66668 5.14444 8.60279 4.98611 8.47501 4.85833C8.34723 4.73056 8.1889 4.66667 8.00001 4.66667C7.81112 4.66667 7.65279 4.73056 7.52501 4.85833C7.39723 4.98611 7.33334 5.14444 7.33334 5.33333C7.33334 5.52222 7.39723 5.68056 7.52501 5.80833C7.65279 5.93611 7.81112 6 8.00001 6ZM8.00001 14.6667C7.07779 14.6667 6.21112 14.4917 5.40001 14.1417C4.5889 13.7917 3.88334 13.3167 3.28334 12.7167C2.68334 12.1167 2.20834 11.4111 1.85834 10.6C1.50834 9.78889 1.33334 8.92222 1.33334 8C1.33334 7.07778 1.50834 6.21111 1.85834 5.4C2.20834 4.58889 2.68334 3.88333 3.28334 3.28333C3.88334 2.68333 4.5889 2.20833 5.40001 1.85833C6.21112 1.50833 7.07779 1.33333 8.00001 1.33333C8.92223 1.33333 9.7889 1.50833 10.6 1.85833C11.4111 2.20833 12.1167 2.68333 12.7167 3.28333C13.3167 3.88333 13.7917 4.58889 14.1417 5.4C14.4917 6.21111 14.6667 7.07778 14.6667 8C14.6667 8.92222 14.4917 9.78889 14.1417 10.6C13.7917 11.4111 13.3167 12.1167 12.7167 12.7167C12.1167 13.3167 11.4111 13.7917 10.6 14.1417C9.7889 14.4917 8.92223 14.6667 8.00001 14.6667ZM8.00001 13.3333C9.4889 13.3333 10.75 12.8167 11.7833 11.7833C12.8167 10.75 13.3333 9.48889 13.3333 8C13.3333 6.51111 12.8167 5.25 11.7833 4.21667C10.75 3.18333 9.4889 2.66667 8.00001 2.66667C6.51112 2.66667 5.25001 3.18333 4.21668 4.21667C3.18334 5.25 2.66668 6.51111 2.66668 8C2.66668 9.48889 3.18334 10.75 4.21668 11.7833C5.25001 12.8167 6.51112 13.3333 8.00001 13.3333Z" fill="#9B9B9B"/></svg>`;

// Home screen — a native React Native 1:1 rebuild of predict-simulator-2's
// "Version A" mobile feed. Wrapped in the live-tick + live-cue providers that
// drive the animated odds/scores and the live cue color. Tapping the
// "Predictions" title opens a bottom sheet to toggle layout density and the
// live accent color.
export default function HomeScreen() {
  const pathname = usePathname();
  const path = pathname.split("?")[0].replace(/\/$/, "") || "/";
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = screenTopInset(insets.top);
  const [density, setDensity] = React.useState<Density>("comfort");
  const [liveCue, setLiveCue] = React.useState<LiveCueColor>("green");
  const [footerDetail, setFooterDetail] = React.useState<FooterDetail>({ metadata: true, volume: true, endDate: false, outcomes: true });
  const [detailTags, setDetailTags] = React.useState<DetailTags>({ metadata: true, volume: true, outcomes: true });
  const [revealMode, setRevealMode] = React.useState<RevealMode>("live");
  // Center highlight was retired from the settings UI; the feed runs with it off.
  const centerHighlight: CenterHighlightMode = "off";
  const reflectTarget: ReflectTarget = "both";
  const [scoreGlow, setScoreGlow] = React.useState(false);
  const [scoreGlowMode, setScoreGlowMode] = React.useState<ScoreGlowMode>("inPlace");
  const [scorerCallout, setScorerCallout] = React.useState(false);
  const [innerGlow, setInnerGlow] = React.useState(true);
  const [whiteBars, setWhiteBars] = React.useState(false);
  const [barTrack, setBarTrack] = React.useState(false);
  // Combinations rail "Buy" → bet slip picks (empty = slip hidden).
  const [slipPicks, setSlipPicks] = React.useState<ComboPick[]>([]);
  // Card-body taps open the slip fully expanded; Buy opens the amount screen.
  const [slipExpanded, setSlipExpanded] = React.useState(false);
  const [sections, setSections] = React.useState<FeedSections>({
    trending: { enabled: true, count: 5 },
    sports: { enabled: false, count: 4 },
    crypto: { enabled: false, count: 4 },
    politics: { enabled: false, count: 4 },
  });
  const setSection = React.useCallback(
    (key: FeedSectionKey, next: FeedSectionConfig) => setSections((s) => ({ ...s, [key]: next })),
    [],
  );
  const [heroSection, setHeroSection] = React.useState<HeroSectionOption>("carousel");
  const [heroBannerStyle, setHeroBannerStyle] = React.useState<HeroBannerStyle>("card");
  const [heroBtcChart, setHeroBtcChart] = React.useState<HeroBtcChart>("chevron");
  const [heroBtcOrange, setHeroBtcOrange] = React.useState<boolean>(false);
  const [popularPlacement, setPopularPlacement] = React.useState<PopularPlacement>("section");
  const [popularRows, setPopularRows] = React.useState<PopularRows>(2);
  const [cardStyle, setCardStyle] = React.useState<CardStyle>("card");
  // Centered VersusCard sub-layout + footer metadata position (home feed only).
  const [versusCenterLive, setVersusCenterLive] = React.useState<VersusCenterLive>("left");
  const [footerPosition, setFooterPosition] = React.useState<FooterPosition>("topRight");
  // Shared across screens (e.g. the World Cup page) via a module-level store so
  // the standard-layout toggle reflects everywhere, not just the home feed.
  const matchLayout = useMatchLayout();
  // Versus card format (new/old), shared with the standalone World Cup pages via
  // a module-level store so the toggle reflects everywhere.
  const versusMode = useVersusMode();
  // Top "Card" controls (footer + the three versus toggles) are shared via a
  // module store so standalone pages (e.g. World Cup) inherit the home choices.
  const { showFooter, versusVersion, versusLayout, versusUpcoming } = useTopControls();
  const dsMode = useDsMode();
  const themeMode = useThemeMode();
  const uxrMode = useUxrMode();
  // Pills home variant (UXR): sticky category pill row instead of the feed.
  const homeLayout = useHomeLayout();
  const pillsHome = uxrMode === "uxr" && homeLayout === "pills";
  const [homeTab, setHomeTab] = React.useState<PillKey>("home");
  // In-place home category (task: category tiles switch content without
  // navigating). null = Trending (the mixed feed); "crypto" | "politics" |
  // "sport:<slug>" render that hub's content below the tile row.
  const [homeCat, setHomeCat] = React.useState<string | null>(null);
  const categorySelect = React.useMemo(
    () => ({ selected: homeCat, onSelect: setHomeCat }),
    [homeCat],
  );
  React.useEffect(() => {
    // Leaving UXR mode drops back to the plain feed.
    if (uxrMode !== "uxr") setHomeCat(null);
  }, [uxrMode]);
  const tennisHidden = useTennisHidden();
  const sportsExamples = useSportsExamples();
  const athletePhotos = useAthletePhotos();
  // Accent + bloom display controls are shared via a module-level store so
  // standalone pages (Sports, World Cup, category/topic pages) inherit the home
  // choices instead of falling back to hardcoded "corner" literals.
  const { showLiveAccent, hideVersusAccent, versusAccent, standardAccent, centerAccentWidth, accentOpacity } = useAccentControls();
  // Versus header alignment is shared via a module-level store so standalone
  // pages (Sports, World Cup, category/topic pages) inherit the home choice.
  const versusHeaderAlign = useVersusHeaderAlign();
  const [oddsUnit, setOddsUnit] = React.useState<OddsUnit>("cents");
  // Shared with the standalone World Cup page (which has its own local settings)
  // via a module-level store, so this display toggle reflects there.
  const worldCupBracket = useWorldCupBracket();
  const worldCupHeader = useWorldCupHeader();
  const worldCupMode = useWorldCupMode();
  const positionsLayout = usePositionsLayout();
  const [showClaim, setShowClaim] = React.useState(false);
  const [showPositionBanner, setShowPositionBanner] = React.useState(false);
  const [positionBannerPlacement, setPositionBannerPlacement] = React.useState<PositionBannerPlacement>("carousel");
  const [versusScoreSize, setVersusScoreSize] = React.useState<VersusScoreSize>(32);
  const [bodyAvatarSize, setBodyAvatarSize] = React.useState<BodyAvatarSize>(32);
  const [sportsMarketAvatar, setSportsMarketAvatar] = React.useState(false);
  const [liveFormat, setLiveFormat] = React.useState<LiveFormat>("inline");
  // Sticky region-disclaimer footer pinned below the feed. Chrome outside the
  // feed, so it stays a local toggle here (not part of FeedSettings).
  const [stickyFooter, setStickyFooter] = React.useState(true);
  const [regionSheetOpen, setRegionSheetOpen] = React.useState(false);
  const region = useRegion();
  const sportsIa = useSportsIa();
  // Where the region market-source control lives: the sticky bottom banner
  // ("banner", default) or a brand dropdown pill in the nav header ("header").
  const [regionControl, setRegionControl] = React.useState<"banner" | "header">("banner");
  const [showLiveGames, setShowLiveGames] = React.useState(true);
  // UXR defaults to the compact live cards (full stays available as a toggle);
  // classic keeps the full card default. Re-applies whenever the mode flips.
  const [liveGamesCard, setLiveGamesCard] = React.useState<"compact" | "full">(uxrMode === "uxr" ? "compact" : "full");
  const [btcLiveCarouselCard, setBtcLiveCarouselCard] = React.useState<BtcLiveCarouselCard>(getBtcLiveCarouselCard);
  React.useEffect(() => {
    setLiveGamesCard(uxrMode === "uxr" ? "compact" : "full");
  }, [uxrMode]);
  const [showActivePositions, setShowActivePositions] = React.useState(false);
  const [headerBalance, setHeaderBalance] = React.useState(false);
  const [balancePillStyle, setBalancePillStyle] = React.useState<"soft" | "solid" | "badge">("badge");
  const [largeHeader, setLargeHeader] = React.useState(true);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [showBtcUpDown, setShowBtcUpDown] = React.useState(false);
  const [showTeamAvatars, setShowTeamAvatars] = React.useState(true);
  const [standardDateInFooter, setStandardDateInFooter] = React.useState(true);
  const [teamAvatars, setTeamAvatars] = React.useState<TeamAvatarStyle>("logo");
  const [possessionScope, setPossessionScope] = React.useState<PossessionScope>("none");
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  // Global retro FAB (mounted in the root layout) asks us to open the sheet
  // via this counter — it bumps on every press from any page.
  const settingsRequest = useSettingsOpenRequest();
  const firstSettingsRun = React.useRef(true);
  React.useEffect(() => {
    if (firstSettingsRun.current) {
      firstSettingsRun.current = false;
      return;
    }
    setSettingsOpen(true);
  }, [settingsRequest]);

  const scrollY = React.useRef(new Animated.Value(0)).current;
  const contentRef = React.useRef<View>(null);
  const [viewportH, setViewportH] = React.useState(0);
  const [contentH, setContentH] = React.useState(0);

  // Registry of measured card boxes for the center-highlight one-at-a-time logic.
  const cards = React.useRef<Map<string, { y: number; h: number }>>(new Map());
  const lastHaptic = React.useRef(0);
  const [cardsVersion, setCardsVersion] = React.useState(0);
  // Bumped whenever the Mixed/All-standard layout toggle flips so every card
  // replays its probability-bar grow-in. Skip the initial mount run.
  const [barResetKey, setBarResetKey] = React.useState(0);
  const firstLayoutRun = React.useRef(true);
  React.useEffect(() => {
    if (firstLayoutRun.current) {
      firstLayoutRun.current = false;
      return;
    }
    setBarResetKey((k) => k + 1);
  }, [matchLayout]);
  const registerCard = React.useCallback((id: string, box: { y: number; h: number }) => {
    const prev = cards.current.get(id);
    if (prev && prev.y === box.y && prev.h === box.h) return;
    cards.current.set(id, box);
    setCardsVersion((v) => v + 1);
  }, []);

  const feedSettings = React.useMemo(
    () => ({ density, showFooter, footerDetail, detailTags, versusLayout, versusMode, versusAccent, versusHeaderAlign, versusCenterLive, footerPosition, versusVersion, versusUpcoming, versusScoreSize, bodyAvatarSize, sportsMarketAvatar, liveFormat, hideVersusAccent, standardAccent, centerAccentWidth, accentOpacity, showLiveAccent, oddsUnit, matchLayout, scoreGlow, scoreGlowMode, scorerCallout, innerGlow, whiteBars, barTrack, heroSection, heroBannerStyle, heroBtcChart, heroBtcOrange, sections, popularPlacement, popularRows, cardStyle, showClaim, showPositionBanner, positionBannerPlacement, showLiveGames, liveGamesCard, btcLiveCarouselCard, showActivePositions, showBtcUpDown, showTeamAvatars, standardDateInFooter, teamAvatars, possessionScope, regionControl, region, headerBalance, balancePillStyle, largeHeader, openMoney: () => router.push("/add-funds" as never), openSearch: () => setSearchOpen(true), openRegion: () => setRegionSheetOpen(true), openSettings: () => setSettingsOpen(true) }),
    [density, showFooter, footerDetail, detailTags, versusLayout, versusMode, versusAccent, versusHeaderAlign, versusCenterLive, footerPosition, versusVersion, versusUpcoming, versusScoreSize, bodyAvatarSize, sportsMarketAvatar, liveFormat, hideVersusAccent, standardAccent, centerAccentWidth, accentOpacity, showLiveAccent, oddsUnit, matchLayout, scoreGlow, scoreGlowMode, scorerCallout, innerGlow, whiteBars, barTrack, heroSection, heroBannerStyle, heroBtcChart, heroBtcOrange, sections, popularPlacement, popularRows, cardStyle, showClaim, showPositionBanner, positionBannerPlacement, showLiveGames, liveGamesCard, btcLiveCarouselCard, showActivePositions, showBtcUpDown, showTeamAvatars, standardDateInFooter, teamAvatars, possessionScope, regionControl, region, headerBalance, balancePillStyle, largeHeader, router],
  );

  const scrollReveal = React.useMemo(
    () => ({ mode: revealMode, centerHighlight, reflectTarget, present: true, scrollY, viewportH, contentH, topPad: 0, contentRef, cards, cardsVersion, barResetKey, registerCard, lastHaptic }),
    [revealMode, centerHighlight, reflectTarget, scrollY, viewportH, contentH, cardsVersion, barResetKey, registerCard],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" />
      <FeedSettingsProvider key={`${dsMode}-${uxrMode}-${themeMode}`} value={feedSettings}>
        {/* Fixed header: the nav row + "Predictions" title stay pinned at the top
            while the feed scrolls beneath them. */}
        {!(uxrMode === "uxr" && homeCat && !pillsHome) && (
          <View style={{ paddingTop: topInset, backgroundColor: colors.bg }}>
            <NavHeader tabs={pillsHome ? <TabsHomeRow active={homeTab} onChange={setHomeTab} /> : undefined} />
          </View>
        )}
        <LiveTickProvider>
          <LiveCueColorProvider cue={liveCue}>
            <ScrollRevealProvider value={scrollReveal}>
              {pillsHome ? (
                <PillHome activeTab={homeTab} onTabChange={setHomeTab} />
              ) : uxrMode === "uxr" && homeCat ? (
                // In-place category view: header + tile row stay put; the
                // selected hub content scrolls below (its own ScrollView, so
                // scroll resets on every switch via the key).
                // Presented like the nested hub pages: its own back header,
                // no Predictions title or category tiles. Back clears the
                // selection and returns to the home feed.
                <View style={{ flex: 1 }}>
                  <PageHeader
                    title={homeCat === "crypto" ? "Crypto" : homeCat === "politics" ? "Politics" : "Sports"}
                    onBack={() => setHomeCat(null)}
                  />
                  <View key={homeCat} style={{ flex: 1 }}>
                    {homeCat === "crypto" ? (
                      <SimpleHub category="crypto" />
                    ) : homeCat === "politics" ? (
                      <SimpleHub category="politics" />
                    ) : sportsIa === "polymarket-metamask" ? (
                      <PolymarketMetaMaskSports
                        initialSport={homeCat.startsWith("sport:") ? homeCat.slice(6) : undefined}
                        embedded
                      />
                    ) : (
                      <SportsHub
                        initialSport={homeCat.startsWith("sport:") ? homeCat.slice(6) : undefined}
                      />
                    )}
                  </View>
                </View>
              ) : (
              <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                style={{ flex: 1 }}
                scrollEventThrottle={16}
                onLayout={(e) => setViewportH(e.nativeEvent.layout.height)}
                onContentSizeChange={(_w, h) => setContentH(h)}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                  { useNativeDriver: true },
                )}
              >
                <View ref={contentRef}>
                  <Feed
                    categorySelect={uxrMode === "uxr" ? categorySelect : undefined}
                    onComboBuy={(picks, opts) => {
                      setSlipExpanded(!!opts?.expanded);
                      setSlipPicks(picks);
                    }}
                  />
                </View>
              </Animated.ScrollView>
              )}
            </ScrollRevealProvider>
          </LiveCueColorProvider>
        </LiveTickProvider>

        {/* Bet slip for the Combinations rail's "Buy": opens directly on the
            amount screen with the bundle's markets pre-selected. */}
        <ComboSheet
          picks={slipPicks}
          initialScreen={slipExpanded ? 0 : 1}
          initialExpanded={slipExpanded}
          onRemove={(id) => setSlipPicks((p) => p.filter((x) => x.id !== id))}
          onReplace={(id, next) => setSlipPicks((p) => replacePickInList(p, id, next))}
          onClear={() => setSlipPicks([])}
          onClose={() => setSlipPicks([])}
        />
        {path === "/" ? <ComboTray returnTo="/" /> : null}
      </FeedSettingsProvider>

      {stickyFooter && regionControl === "banner" && uxrMode !== "uxr" && (
        <Pressable
          onPress={() => setRegionSheetOpen(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            backgroundColor: colors.bg,
            borderTopWidth: 1,
            borderTopColor: "rgba(133,139,154,0.2)",
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 40,
          }}
        >
          <Text style={{ fontFamily: geist.medium, fontSize: 13, color: colors.textMuted, textAlign: "center" }}>
            Displaying local markets
          </Text>
          <SvgXml xml={INFO_ICON_SVG} width={16} height={16} />
        </Pressable>
      )}

      {/* Retro-Mac floating settings button — visible by default; ⌘S hides it. */}

      {sportsIa === "polymarket-sport-pages" ? (
        <MmProposalSettingsSheet
          visible={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      ) : (
      <SettingsSheet
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        density={density}
        onDensityChange={setDensity}
        liveCue={liveCue}
        onLiveCueChange={setLiveCue}
        showFooter={showFooter}
        onShowFooterChange={setShowFooter}
        footerDetail={footerDetail}
        onFooterDetailChange={setFooterDetail}
        detailTags={detailTags}
        onDetailTagsChange={setDetailTags}
        revealMode={revealMode}
        onRevealModeChange={setRevealMode}
        versusLayout={versusLayout}
        onVersusLayoutChange={setVersusLayout}
        scoreGlow={scoreGlow}
        onScoreGlowChange={setScoreGlow}
        scoreGlowMode={scoreGlowMode}
        onScoreGlowModeChange={setScoreGlowMode}
        scorerCallout={scorerCallout}
        onScorerCalloutChange={setScorerCallout}
        innerGlow={innerGlow}
        onInnerGlowChange={setInnerGlow}
        whiteBars={whiteBars}
        onWhiteBarsChange={setWhiteBars}
        barTrack={barTrack}
        onBarTrackChange={setBarTrack}
        heroSection={heroSection}
        onHeroSectionChange={setHeroSection}
        heroBannerStyle={heroBannerStyle}
        onHeroBannerStyleChange={setHeroBannerStyle}
        heroBtcChart={heroBtcChart}
        onHeroBtcChartChange={setHeroBtcChart}
        heroBtcOrange={heroBtcOrange}
        onHeroBtcOrangeChange={setHeroBtcOrange}
        sections={sections}
        onSectionChange={setSection}
        popularPlacement={popularPlacement}
        onPopularPlacementChange={setPopularPlacement}
        popularRows={popularRows}
        onPopularRowsChange={setPopularRows}
        cardStyle={cardStyle}
        onCardStyleChange={setCardStyle}
        versusMode={versusMode}
        onVersusModeChange={setVersusMode}
        versusAccent={versusAccent}
        onVersusAccentChange={setVersusAccent}
        versusHeaderAlign={versusHeaderAlign}
        onVersusHeaderAlignChange={setVersusHeaderAlign}
        versusCenterLive={versusCenterLive}
        onVersusCenterLiveChange={setVersusCenterLive}
        footerPosition={footerPosition}
        onFooterPositionChange={setFooterPosition}
        versusVersion={versusVersion}
        onVersusVersionChange={setVersusVersion}
        versusUpcoming={versusUpcoming}
        onVersusUpcomingChange={setVersusUpcoming}
        standardAccent={standardAccent}
        onStandardAccentChange={setStandardAccent}
        centerAccentWidth={centerAccentWidth}
        onCenterAccentWidthChange={setCenterAccentWidth}
        accentOpacity={accentOpacity}
        onAccentOpacityChange={setAccentOpacity}
        oddsUnit={oddsUnit}
        onOddsUnitChange={setOddsUnit}
        showClaim={showClaim}
        onShowClaimChange={setShowClaim}
        showPositionBanner={showPositionBanner}
        onShowPositionBannerChange={setShowPositionBanner}
        positionBannerPlacement={positionBannerPlacement}
        onPositionBannerPlacementChange={setPositionBannerPlacement}
        versusScoreSize={versusScoreSize}
        onVersusScoreSizeChange={setVersusScoreSize}
        bodyAvatarSize={bodyAvatarSize}
        onBodyAvatarSizeChange={setBodyAvatarSize}
        sportsMarketAvatar={sportsMarketAvatar}
        onSportsMarketAvatarChange={setSportsMarketAvatar}
        stickyFooter={stickyFooter}
        onStickyFooterChange={setStickyFooter}
        regionControl={regionControl}
        onRegionControlChange={setRegionControl}
        liveFormat={liveFormat}
        onLiveFormatChange={setLiveFormat}
        hideVersusAccent={hideVersusAccent}
        onHideVersusAccentChange={setHideVersusAccent}
        tennisHidden={tennisHidden}
        onTennisHiddenChange={setTennisHidden}
        sportsExamples={sportsExamples}
        onSportsExamplesChange={setSportsExamples}
        athletePhotos={athletePhotos}
        onAthletePhotosChange={setAthletePhotos}
        showLiveAccent={showLiveAccent}
        onShowLiveAccentChange={setShowLiveAccent}
        showLiveGames={showLiveGames}
        onShowLiveGamesChange={setShowLiveGames}
        liveGamesCard={liveGamesCard}
        btcLiveCarouselCard={btcLiveCarouselCard}
        onBtcLiveCarouselCardChange={setBtcLiveCarouselCard}
        onLiveGamesCardChange={setLiveGamesCard}
        showActivePositions={showActivePositions}
        onShowActivePositionsChange={setShowActivePositions}
        headerBalance={headerBalance}
        onHeaderBalanceChange={setHeaderBalance}
        balancePillStyle={balancePillStyle}
        onBalancePillStyleChange={setBalancePillStyle}
        largeHeader={largeHeader}
        onLargeHeaderChange={setLargeHeader}
        showBtcUpDown={showBtcUpDown}
        onShowBtcUpDownChange={setShowBtcUpDown}
        showTeamAvatars={showTeamAvatars}
        onShowTeamAvatarsChange={setShowTeamAvatars}
        standardDateInFooter={standardDateInFooter}
        onStandardDateInFooterChange={setStandardDateInFooter}
        teamAvatars={teamAvatars}
        onTeamAvatarsChange={setTeamAvatars}
        possessionScope={possessionScope}
        onPossessionScopeChange={setPossessionScope}
        worldCupBracket={worldCupBracket}
        onWorldCupBracketChange={setWorldCupBracket}
        worldCupHeader={worldCupHeader}
        onWorldCupHeaderChange={setWorldCupHeader}
        worldCupMode={worldCupMode}
        onWorldCupModeChange={setWorldCupMode}
        positionsLayout={positionsLayout}
        onPositionsLayoutChange={setPositionsLayout}
      />
      )}

      <RegionSheet
        visible={regionSheetOpen}
        onClose={() => setRegionSheetOpen(false)}
        region={region}
        onRegionChange={(next) => {
          setRegion(next);
          setRegionSheetOpen(false);
        }}
      />
      <SearchOverlay visible={searchOpen} onClose={() => setSearchOpen(false)} />
    </View>
  );
}
