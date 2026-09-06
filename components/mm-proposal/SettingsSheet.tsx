import { Modal, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  FilterButton,
  FontWeight,
  HeaderStandard,
  SectionHeader,
  SegmentedControl,
  Switch,
  Text,
  TextColor,
  TextVariant,
} from "@metamask/design-system-react-native";

import { setBrowseLeagues, useBrowseLeagues } from "@/lib/sim/browseLeaguesStore";
import { setBaseballHeaderVariant, useBaseballHeaderVariant, type BaseballHeaderVariant } from "@/lib/sim/baseballHeaderStore";
import { setThemeMode, useThemeMode, type ThemeMode } from "@/lib/sim/dsModeStore";
import {
  KALSHI_FLAVOR_LABELS,
  KALSHI_FLAVOR_OPTIONS,
  setKalshiFlavor,
  useKalshiFlavor,
} from "@/lib/sim/kalshiFlavorStore";
import {
  VENUE_SWITCHER_LABELS,
  VENUE_SWITCHER_OPTIONS,
  setVenueSwitcher,
  useVenueSwitcher,
} from "@/lib/sim/venueSwitcherStore";
import { setMatchLayout, useMatchLayout } from "@/lib/sim/matchLayoutStore";
import { setOnboardingEnabled, useOnboarding } from "@/lib/sim/onboardingStore";
import { setSocialUx, useSocialUx } from "@/lib/sim/socialUxStore";
import { setHomeSocialStyle, useHomeSocialStyle } from "@/lib/sim/homeSocialStyleStore";
import { setCombinationsEntry, setCombinationsVisible, useCombinationsEntry, useCombinationsVisible } from "@/lib/sim/combinationsStore";
import { setComboPageIa, useComboPageIa } from "@/lib/sim/comboPageIaStore";
import { setComboTemplates, useComboTemplates } from "@/lib/sim/comboTemplatesStore";
import { setComboAffordance, useComboAffordance } from "@/lib/sim/comboAffordanceStore";
import { setComboBrandStyle, useComboBrandStyle } from "@/lib/sim/comboBrandStore";
import { setComboCartStyle, useComboCartStyle } from "@/lib/sim/comboCartStyleStore";
import { setComboSheetBorder, useComboSheetBorder } from "@/lib/sim/comboSheetBorderStore";
import { setComboLineSlider, useComboLineSlider } from "@/lib/sim/comboLineSliderStore";
import { setBtcLiveCarouselCard, useBtcLiveCarouselCard } from "@/lib/sim/btcLiveCarouselCardStore";
import { setChartLiveCardHeader, useChartLiveCardHeader } from "@/lib/sim/chartLiveCardHeaderStore";
import { setChartLiveCardStack, useChartLiveCardStack } from "@/lib/sim/chartLiveCardStackStore";
import { setTeamAbbrUnderLogos, useTeamAbbrUnderLogos } from "@/lib/sim/teamAbbrUnderLogosStore";
import { setShowFooter, useTopControls } from "@/lib/sim/feedTopControlsStore";
import { setSwipeToBuy, useSwipeToBuy } from "@/lib/sim/swipeToBuyStore";
import { setSuccessScreenStyle, useSuccessScreenStyle } from "@/lib/sim/successScreenStore";
import { setTradeCardLayout, useTradeCardLayout } from "@/lib/sim/tradeCardLayoutStore";
import { setMarketRulesStyle, useMarketRulesStyle } from "@/lib/sim/marketRulesStore";
import { setOutcomeButtonColorMode, useOutcomeButtonColorMode } from "@/lib/sim/outcomeButtonColorStore";
import { setPillButtons, usePillButtons } from "@/lib/sim/pillButtonsStore";
import { clearComboPicks } from "@/lib/sim/comboPicksStore";
import { exitComboFlow } from "@/lib/sim/comboFlowStore";
import { startSocialTour, stopSocialTour, useSocialTour } from "@/lib/sim/socialTourStore";
import { resetTryTheseDefaults } from "@/lib/sim/tryTheseDefaults";
import {
  SPORTS_NAV_VARIANT_LABELS,
  SPORTS_NAV_VARIANT_OPTIONS,
  setSportsNavEnabled,
  setSportsNavVariant,
  useSportsNavExperiment,
  type SportsNavVariant,
} from "@/lib/sim/sportsNavExperimentStore";
import {
  SPORTS_IA_LABELS,
  SPORTS_IA_OPTIONS,
  setSportsIa,
  useSportsIa,
  type SportsIa,
} from "@/lib/sim/sportsIaStore";
import {
  SPORTS_PAGE_LAYOUT_LABELS,
  SPORTS_PAGE_LAYOUT_OPTIONS,
  setSportsPageLayout,
  useSportsPageLayout,
  type SportsPageLayout,
} from "@/lib/sim/sportsPageLayoutStore";
import { setTypeface, useDisplayFont, useOswaldDataSet, useTypeface, type TypefaceMode } from "@/lib/sim/typefaceStore";
import type { MatchLayout } from "@/lib/sim/types";

export function MmProposalSettingsSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const sportsIa = useSportsIa();
  const sportsPageLayout = useSportsPageLayout();
  const themeMode = useThemeMode();
  const matchLayout = useMatchLayout();
  const kalshiFlavor = useKalshiFlavor();
  const venueSwitcher = useVenueSwitcher();
  const browseLeagues = useBrowseLeagues();
  const baseballHeaderVariant = useBaseballHeaderVariant();
  const { enabled: onboardingEnabled } = useOnboarding();
  const socialUx = useSocialUx();
  const homeSocialStyle = useHomeSocialStyle();
  const combinationsVisible = useCombinationsVisible();
  const combinationsEntry = useCombinationsEntry();
  const comboPageIa = useComboPageIa();
  const comboTemplates = useComboTemplates();
  const comboSheetBorder = useComboSheetBorder();
  const comboLineSlider = useComboLineSlider();
  const comboBrand = useComboBrandStyle();
  const comboAffordance = useComboAffordance();
  const comboCartStyle = useComboCartStyle();
  const btcLiveCarouselCard = useBtcLiveCarouselCard();
  const chartLiveCardHeader = useChartLiveCardHeader();
  const chartLiveCardStack = useChartLiveCardStack();
  const showTeamAbbrUnderLogos = useTeamAbbrUnderLogos();
  const { showFooter } = useTopControls();
  const swipeToBuy = useSwipeToBuy();
  const successScreenStyle = useSuccessScreenStyle();
  const tradeCardLayout = useTradeCardLayout();
  const marketRulesStyle = useMarketRulesStyle();
  const outcomeButtonColor = useOutcomeButtonColorMode();
  const pillButtons = usePillButtons();
  const typeface = useTypeface();
  const displayFont = useDisplayFont();
  const oswald = useOswaldDataSet();
  const socialTour = useSocialTour();
  const { enabled: sportsNavEnabled, variant: sportsNavVariant } = useSportsNavExperiment();

  const onSportsIaChange = (next: SportsIa) => {
    setSportsIa(next);
    onClose();
    if (next !== "polymarket-sport-pages") {
      router.replace("/" as never);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Box twClassName="flex-1 justify-end bg-overlay-default">
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <Box twClassName="max-h-[88%] rounded-t-2xl bg-background-default">
          <HeaderStandard
            title="Display"
            onClose={onClose}
            titleProps={{ ...oswald, style: { fontFamily: displayFont } }}
          />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Box twClassName="gap-6 px-4 pb-10">
          <Box twClassName="gap-3">
            <SectionHeader title="Sports page" twClassName="px-0" />
            <SegmentedControl
              value={sportsPageLayout}
              onChange={(value) => {
                if (value === "list" || value === "page") setSportsPageLayout(value as SportsPageLayout);
              }}
              isFullWidth
            >
              {SPORTS_PAGE_LAYOUT_OPTIONS.map((option) => (
                <FilterButton key={option} value={option}>
                  {SPORTS_PAGE_LAYOUT_LABELS[option]}
                </FilterButton>
              ))}
            </SegmentedControl>
            <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
              List is the sport directory. Sports page is a Politics-style feed with category pills.
            </Text>
            <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium} color={TextColor.TextAlternative}>
              Button shape
            </Text>
            <SegmentedControl
              value={pillButtons ? "pill" : "rounded"}
              onChange={(value) => setPillButtons(value === "pill")}
              isFullWidth
            >
              <FilterButton value="rounded">Rounded</FilterButton>
              <FilterButton value="pill">Pill</FilterButton>
            </SegmentedControl>
            <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
              Rounded is 12px corners. Pill turns every buy and outcome button into a capsule.
            </Text>
            <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium} color={TextColor.TextAlternative}>
              Type
            </Text>
            <SegmentedControl
              value={typeface}
              onChange={(value) => {
                if (value === "current" || value === "future") setTypeface(value as TypefaceMode);
              }}
              isFullWidth
            >
              <FilterButton value="current">Current type</FilterButton>
              <FilterButton value="future">Future type</FilterButton>
            </SegmentedControl>
            <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
              Current is Geist. Future is Oswald on titles and large numbers, Inter everywhere else.
            </Text>
          </Box>

          <Box twClassName="gap-3">
            <SectionHeader title="Try these" twClassName="px-0" />
            <Button variant={ButtonVariant.Secondary} size={ButtonSize.Md} onPress={resetTryTheseDefaults}>
              Reset
            </Button>
            <Box twClassName="gap-4 rounded-2xl bg-[#18181B] px-4 py-4">
              <Box twClassName="gap-1.5">
                <Switch
                  isOn={socialUx}
                  label="💬 Social UX"
                  onValueChange={setSocialUx}
                />
                <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
                  Trade success becomes a shareable post. Market pages gain Markets, Positions, Social feed, and Live trade tabs.
                </Text>
              </Box>
              {socialUx ? (
                <Box twClassName="gap-1.5">
                  <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium} color={TextColor.TextAlternative}>
                    What people are saying
                  </Text>
                  <SegmentedControl
                    value={homeSocialStyle}
                    onChange={(value) => setHomeSocialStyle(value === "carousel" ? "carousel" : "ticker")}
                    isFullWidth
                  >
                    <FilterButton value="ticker">Ticker</FilterButton>
                    <FilterButton value="carousel">Carousel</FilterButton>
                  </SegmentedControl>
                  <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
                    Ticker rotates posts in place. Carousel swipes through share cards with the position ticket inside.
                  </Text>
                </Box>
              ) : null}
              <Box twClassName="gap-1.5">
                <Switch
                  isOn={combinationsVisible}
                  label="Combos"
                  onValueChange={(value) => {
                    setCombinationsVisible(value);
                    if (!value) {
                      exitComboFlow();
                      clearComboPicks();
                    }
                  }}
                />
                <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
                  Stack moneyline legs across games.
                </Text>
              </Box>
              {combinationsVisible ? (
                <>
                <Box twClassName="gap-1.5">
                  <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium} color={TextColor.TextAlternative}>
                    Home entry
                  </Text>
                  <SegmentedControl
                    value={combinationsEntry}
                    onChange={(value) => {
                      if (value === "fab" || value === "banner" || value === "tile") setCombinationsEntry(value);
                    }}
                    isFullWidth
                  >
                    <FilterButton value="tile">Tile</FilterButton>
                    <FilterButton value="banner">Banner</FilterButton>
                    <FilterButton value="fab">Button</FilterButton>
                  </SegmentedControl>
                  <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
                    Tile is first in Explore. Banner sits on home. Floating button sits at the bottom of the screen.
                  </Text>
                </Box>
                <Box twClassName="gap-1.5">
                  <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium} color={TextColor.TextAlternative}>
                    Combos page
                  </Text>
                  <SegmentedControl
                    value={comboPageIa}
                    onChange={(value) => setComboPageIa(value === "browse" ? "browse" : "tabs")}
                    isFullWidth
                  >
                    <FilterButton value="tabs">Tabs</FilterButton>
                    <FilterButton value="browse">Browse</FilterButton>
                  </SegmentedControl>
                  <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
                    Tabs keep sports on this page with league chips. Browse opens a sport page.
                  </Text>
                </Box>
                <Box twClassName="gap-1.5">
                  <Switch
                    isOn={comboTemplates}
                    label="Templates"
                    onValueChange={setComboTemplates}
                  />
                  <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
                    Home carousel of ready-made combos. Combos page starts on a Templates tab.
                  </Text>
                </Box>
                <Box twClassName="gap-1.5">
                  <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium} color={TextColor.TextAlternative}>
                    Combo sheet border
                  </Text>
                  <SegmentedControl
                    value={comboSheetBorder}
                    onChange={(value) => setComboSheetBorder(value === "gradient" ? "gradient" : "muted")}
                    isFullWidth
                  >
                    <FilterButton value="muted">Muted</FilterButton>
                    <FilterButton value="gradient">Gradient</FilterButton>
                  </SegmentedControl>
                  <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
                    Ticket chrome. Muted is a hairline; Gradient is the combo ring.
                  </Text>
                </Box>
                <Box twClassName="gap-1.5">
                  <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium} color={TextColor.TextAlternative}>
                    Combo line slider
                  </Text>
                  <SegmentedControl
                    value={comboLineSlider ? "on" : "off"}
                    onChange={(value) => setComboLineSlider(value !== "off")}
                    isFullWidth
                  >
                    <FilterButton value="on">On</FilterButton>
                    <FilterButton value="off">Off</FilterButton>
                  </SegmentedControl>
                  <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
                    Spread, totals, and win-by picker on the ticket. Off also hides the swap on those markets.
                  </Text>
                </Box>
                <Box twClassName="gap-1.5">
                  <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium} color={TextColor.TextAlternative}>
                    Combo brand
                  </Text>
                  <SegmentedControl
                    value={comboBrand}
                    onChange={(value) => setComboBrandStyle(value === "flat" ? "flat" : "gradient")}
                    isFullWidth
                  >
                    <FilterButton value="gradient">Gradient</FilterButton>
                    <FilterButton value="flat">Flat</FilterButton>
                  </SegmentedControl>
                  <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
                    Gradient is blue to lime. Flat is white on the combo mark, selected legs, cart, and swipe thumb.
                  </Text>
                </Box>
                <Box twClassName="gap-1.5">
                  <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium} color={TextColor.TextAlternative}>
                    Combo affordance
                  </Text>
                  <SegmentedControl
                    value={comboAffordance}
                    onChange={(value) => setComboAffordance(value === "cart" ? "cart" : "sheet")}
                    isFullWidth
                  >
                    <FilterButton value="sheet">Sheet</FilterButton>
                    <FilterButton value="cart">Cart</FilterButton>
                  </SegmentedControl>
                  <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
                    Sheet keeps the empty Build your combo tray. Cart morphs into a bottom-right shopping cart.
                  </Text>
                </Box>
                {comboAffordance === "cart" ? (
                <Box twClassName="gap-1.5">
                  <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium} color={TextColor.TextAlternative}>
                    Combo cart
                  </Text>
                  <SegmentedControl
                    value={comboCartStyle}
                    onChange={(value) => setComboCartStyle(value === "fill" ? "fill" : "outline")}
                    isFullWidth
                  >
                    <FilterButton value="outline">Outline</FilterButton>
                    <FilterButton value="fill">Fill</FilterButton>
                  </SegmentedControl>
                  <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
                    Outline is the gradient ring and lime count. Fill is a gradient disc with a black mark and a card-colored badge with a white numeral.
                  </Text>
                </Box>
                ) : null}
                </>
              ) : null}
              <Box twClassName="gap-1.5">
                <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium} color={TextColor.TextAlternative}>
                  Live cards
                </Text>
                <SegmentedControl
                  value={btcLiveCarouselCard}
                  onChange={(value) => setBtcLiveCarouselCard(value === "chart" ? "chart" : "simple")}
                  isFullWidth
                >
                  <FilterButton value="simple">Simple</FilterButton>
                  <FilterButton value="chart">Chart</FilterButton>
                </SegmentedControl>
                {btcLiveCarouselCard === "chart" ? (
                  <>
                  <SegmentedControl
                    value={chartLiveCardHeader}
                    onChange={(value) =>
                      setChartLiveCardHeader(value === "score" ? "score" : value === "minimized" ? "minimized" : "avatar")
                    }
                    isFullWidth
                  >
                    <FilterButton value="avatar">Sandwich</FilterButton>
                    <FilterButton value="score">Score</FilterButton>
                    <FilterButton value="minimized">Names</FilterButton>
                  </SegmentedControl>
                  <SegmentedControl
                    value={chartLiveCardStack}
                    onChange={(value) => setChartLiveCardStack(value === "chart" ? "chart" : "header")}
                    isFullWidth
                  >
                    <FilterButton value="header">Header</FilterButton>
                    <FilterButton value="chart">Chart</FilterButton>
                  </SegmentedControl>
                  </>
                ) : null}
                <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
                  {btcLiveCarouselCard === "chart"
                    ? "Sandwich is logos with LIVE between scores. Score puts LIVE on top and 21 – 0 in the middle. Names is team names and score chips. Tennis always uses the detail score unit. Stack Chart puts the sparkline above the scoreboard."
                    : "Simple is the compact BTC dial. Chart is the sparkline card on the Live rail."}
                </Text>
              </Box>
              <Box twClassName="gap-1.5">
                <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium} color={TextColor.TextAlternative}>
                  Team abbreviations
                </Text>
                <SegmentedControl
                  value={showTeamAbbrUnderLogos ? "show" : "hide"}
                  onChange={(value) => setTeamAbbrUnderLogos(value === "show")}
                  isFullWidth
                >
                  <FilterButton value="hide">Hide</FilterButton>
                  <FilterButton value="show">Show</FilterButton>
                </SegmentedControl>
                <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
                  ARS / LIV under crests on feed versus and live carousel Sandwich/Score. Hide aligns logos with the scores. Detail pages keep abbreviations. Tennis names stay.
                </Text>
              </Box>
              <Box twClassName="gap-1.5">
                <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium} color={TextColor.TextAlternative}>
                  Buy confirm
                </Text>
                <SegmentedControl
                  value={swipeToBuy ? "swipe" : "button"}
                  onChange={(value) => setSwipeToBuy(value === "swipe")}
                  isFullWidth
                >
                  <FilterButton value="swipe">Swipe</FilterButton>
                  <FilterButton value="button">Button</FilterButton>
                </SegmentedControl>
                <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
                  Swipe is swipe-to-buy on the slip. Button is the standard MetaMask primary button.
                </Text>
              </Box>
              <Box twClassName="gap-1.5">
                <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium} color={TextColor.TextAlternative}>
                  Success screen
                </Text>
                <SegmentedControl
                  value={successScreenStyle}
                  onChange={(value) => setSuccessScreenStyle(value === "flat" ? "flat" : "gradient")}
                  isFullWidth
                >
                  <FilterButton value="gradient">Gradient</FilterButton>
                  <FilterButton value="flat">Flat</FilterButton>
                </SegmentedControl>
                <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
                  After a buy, wash the page with the swipe gradient. Inverse buttons stay readable on color.
                </Text>
              </Box>
              <Box twClassName="gap-1.5">
                <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium} color={TextColor.TextAlternative}>
                  Trade card
                </Text>
                <SegmentedControl
                  value={tradeCardLayout}
                  onChange={(value) => setTradeCardLayout(value === "compact" ? "compact" : "ticket")}
                  isFullWidth
                >
                  <FilterButton value="ticket">Detailed</FilterButton>
                  <FilterButton value="compact">Compact</FilterButton>
                </SegmentedControl>
                <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
                  Detailed ticket is the default. Compact is ticker + outcome tag + $ / %.
                </Text>
              </Box>
              <Box twClassName="gap-1.5">
                <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium} color={TextColor.TextAlternative}>
                  Button color
                </Text>
                <SegmentedControl
                  value={outcomeButtonColor}
                  onChange={(value) => {
                    if (value === "muted-color" || value === "muted-white" || value === "fill") {
                      setOutcomeButtonColorMode(value);
                    }
                  }}
                  isFullWidth
                >
                  <FilterButton value="fill">Color</FilterButton>
                  <FilterButton value="muted-color">Color text</FilterButton>
                  <FilterButton value="muted-white">White text</FilterButton>
                </SegmentedControl>
                <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
                  Color fills the chip. Color text and White text sit on the muted surface. Yes/No stay green and red.
                </Text>
              </Box>
              <Box twClassName="gap-1.5">
                <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium} color={TextColor.TextAlternative}>
                  Event page
                </Text>
                <SegmentedControl
                  value={marketRulesStyle}
                  onChange={(value) => {
                    const next = value === "about" ? "about" : value === "section" ? "section" : "banner";
                    setMarketRulesStyle(next);
                  }}
                  isFullWidth
                >
                  <FilterButton value="banner">Banner</FilterButton>
                  <FilterButton value="about">About tab</FilterButton>
                  <FilterButton value="section">Section</FilterButton>
                </SegmentedControl>
                <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
                  Banner sits on Markets. About tab adds volume, end date, resolver, and rules. Section stacks rules, positions, and markets — social follows only when Social UX is on.
                </Text>
              </Box>
              <Box twClassName="gap-1.5">
                <Switch
                  isOn={showFooter}
                  label="Card metadata"
                  onValueChange={setShowFooter}
                />
                <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
                  League, volume, and +N more on the bottom of cards. Off hides the footer.
                </Text>
              </Box>
              <Box twClassName="gap-1.5">
                <Switch
                  isOn={socialTour.active}
                  label="Social UX walkthrough"
                  onValueChange={(value) => {
                    if (value) {
                      setSocialUx(true);
                      startSocialTour();
                      onClose();
                    } else {
                      stopSocialTour();
                    }
                  }}
                />
                <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
                  Turns Social UX on if needed, then tours the new tabs with callout tooltips. Off cancels the tour.
                </Text>
              </Box>
              <Box twClassName="gap-1.5">
                <Switch
                  isOn={onboardingEnabled}
                  label="Onboarding flow"
                  onValueChange={(value) => {
                    setOnboardingEnabled(value);
                    if (value) onClose();
                  }}
                />
                <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
                  Starts the Kalshi-style splash and verification flow. Off skips it.
                </Text>
              </Box>
            </Box>
          </Box>

          <Box twClassName="gap-3">
            <SectionHeader title="Experience" twClassName="px-0" />
            <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
              MM Proposal is the dedicated sport-page IA rebuilt with MetaMask components.
            </Text>
            <Box twClassName="gap-2">
              {SPORTS_IA_OPTIONS.map((option) => {
                const active = sportsIa === option;
                return (
                  <FilterButton
                    key={option}
                    isSelected={active}
                    isFullWidth
                    onPress={() => onSportsIaChange(option)}
                  >
                    {SPORTS_IA_LABELS[option]}
                  </FilterButton>
                );
              })}
            </Box>
          </Box>

          <Box twClassName="gap-3">
            <SectionHeader title="Kalshi" twClassName="px-0" />
            <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
              Home header switcher. Badge is the Kalshi/Polymarket pill. Settings icon is the Material gear.
            </Text>
            <SegmentedControl
              value={venueSwitcher}
              onChange={(value) => {
                if (value === "badge" || value === "icon") setVenueSwitcher(value);
              }}
              isFullWidth
            >
              {VENUE_SWITCHER_OPTIONS.map((option) => (
                <FilterButton key={option} value={option}>
                  {VENUE_SWITCHER_LABELS[option]}
                </FilterButton>
              ))}
            </SegmentedControl>
            <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
              Used when the home venue is set to Kalshi. MVP is NFL and NCAAF only. V2 is the regular MM Proposal content.
            </Text>
            <Box twClassName="gap-2">
              {KALSHI_FLAVOR_OPTIONS.map((option) => {
                const active = kalshiFlavor === option;
                return (
                  <FilterButton
                    key={option}
                    isSelected={active}
                    isFullWidth
                    onPress={() => setKalshiFlavor(option)}
                  >
                    {KALSHI_FLAVOR_LABELS[option]}
                  </FilterButton>
                );
              })}
            </Box>
          </Box>

          <Box twClassName="gap-3">
            <SectionHeader title="Theme" twClassName="px-0" />
            <SegmentedControl
              value={themeMode}
              onChange={(value) => setThemeMode(value as ThemeMode)}
              isFullWidth
            >
              <FilterButton value="dark">Dark</FilterButton>
              <FilterButton value="light">Light</FilterButton>
            </SegmentedControl>
          </Box>

          <Box twClassName="gap-3">
            <SectionHeader title="Sport pages" twClassName="px-0" />
            <Text
              variant={TextVariant.BodySm}
              fontWeight={FontWeight.Medium}
              color={TextColor.TextAlternative}
            >
              Sports card
            </Text>
            <SegmentedControl
              value={matchLayout}
              onChange={(value) => setMatchLayout(value as MatchLayout)}
              isFullWidth
            >
              <FilterButton value="versus">Versus</FilterButton>
              <FilterButton value="standard">Standard</FilterButton>
              <FilterButton value="mixed">Mixed</FilterButton>
            </SegmentedControl>
            <Switch
              isOn={sportsNavEnabled}
              label="Sports navigation"
              onValueChange={setSportsNavEnabled}
            />
            {sportsNavEnabled ? (
              <>
                <Text
                  variant={TextVariant.BodySm}
                  fontWeight={FontWeight.Medium}
                  color={TextColor.TextAlternative}
                >
                  After a league
                </Text>
                <SegmentedControl
                  value={sportsNavVariant}
                  onChange={(value) => setSportsNavVariant(value as SportsNavVariant)}
                  isFullWidth
                >
                  {SPORTS_NAV_VARIANT_OPTIONS.map((option) => (
                    <FilterButton key={option} value={option}>
                      {SPORTS_NAV_VARIANT_LABELS[option]}
                    </FilterButton>
                  ))}
                </SegmentedControl>
              </>
            ) : null}
            <Switch
              isOn={browseLeagues}
              label="League directory"
              onValueChange={setBrowseLeagues}
            />
            <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
              Categories and Sports list leagues under each sport. There is no sport page — tapping a league opens Games and Props.
            </Text>
            <Text
              variant={TextVariant.BodySm}
              fontWeight={FontWeight.Medium}
              color={TextColor.TextAlternative}
            >
              Baseball header
            </Text>
            <SegmentedControl
              value={baseballHeaderVariant}
              onChange={(value) => setBaseballHeaderVariant(value as BaseballHeaderVariant)}
              isFullWidth
            >
              <FilterButton value="bases">Bases</FilterButton>
              <FilterButton value="original">Simple</FilterButton>
            </SegmentedControl>
            <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
              Bases keeps the diamond and count. Simple matches the football scoreboard.
            </Text>
          </Box>

        </Box>
      </ScrollView>
        </Box>
      </Box>
    </Modal>
  );
}
