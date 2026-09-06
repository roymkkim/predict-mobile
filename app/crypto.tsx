import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "@/lib/sim/haptics";

import colors from "@/constants/colors";
import { PageHeader } from "@/components/PageHeader";
import { PoliticsCard } from "@/components/sim/PoliticsCard";
import { colors as simColors } from "@/lib/sim/colors";
import type { PoliticsMarket } from "@/lib/sim/types";
import { Image } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { BtcDailyCard } from "@/components/sim/BtcDailyCard";
import { BTC_DAILY } from "@/lib/sim/data";
import { FeedSettingsProvider, type FeedSettings } from "@/lib/sim/FeedSettingsContext";
import { useAccentControls } from "@/lib/sim/accentControlsStore";
import { useVersusHeaderAlign } from "@/lib/sim/versusHeaderAlignStore";
import { BtcCardsCard, CryptoLiveCardsCarousel, EthCardsCard } from "@/components/sim/LiveCardsCarousel";
import { LiveDot } from "@/components/sim/Crest";
import { FILTER_CHIP_ACTIVE_BG, FILTER_CHIP_INACTIVE_TEXT } from "@/lib/sim/colors";
import { geist } from "@/lib/sim/geistFonts";

const c = colors.light;
const FILTERS = ["Live", "Bitcoin", "Ethereum"] as const;
type CryptoTab = (typeof FILTERS)[number];
const tapHaptic = () => { Haptics.selectionAsync().catch(() => {}); };

// BtcDailyCard reads density + footerDetail from FeedSettings; provide the
// same fixed preset the home feed uses so the card matches it 1:1.
const FEED_SETTINGS: FeedSettings = {
  density: "comfort",
  showFooter: true,
  footerDetail: { metadata: true, volume: true, endDate: false, outcomes: true },
  versusLayout: "sides",
  versusMode: "new",
  versusAccent: "corner",
  versusHeaderAlign: "center",
  versusVersion: "a",
  versusUpcoming: true,
  standardAccent: "corner",
  centerAccentWidth: "default",
  accentOpacity: 0.54,
  oddsUnit: "cents",
  matchLayout: "standard",
  scoreGlow: false,
  scoreGlowMode: "inPlace",
  scorerCallout: false,
  innerGlow: true,
  whiteBars: false,
  barTrack: false,
  heroSection: "none",
  sections: {
    trending: { enabled: true, count: 5 },
    sports: { enabled: true, count: 4 },
    crypto: { enabled: true, count: 4 },
    politics: { enabled: true, count: 4 },
  },
  popularPlacement: "inTrending",
  popularRows: 1,
  cardStyle: "card",
  showClaim: false,
  showPositionBanner: false,
  positionBannerPlacement: "carousel",
  showLiveGames: false,
  showActivePositions: false,
  showBtcUpDown: false,
  showTeamAvatars: true,
  standardDateInFooter: true,
  teamAvatars: "logo",
  possessionScope: "none",
  openSettings: () => {},
};

function UpDownLink({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <Pressable onPress={() => { tapHaptic(); router.push("/btc-updown" as never); }}>
      {children}
    </Pressable>
  );
}

// The $150k date-ladder rendered as a proper market card (same family as the
// other market cards), not a banner row. Tapping the card opens the detail
// page; the outcome buttons still open the bet slip directly.
const BTC_150K_MARKET: PoliticsMarket = {
  category: "Crypto",
  date: "Dec 31",
  question: "When will Bitcoin hit $150k?",
  vol: "$4.1M Vol.",
  markets: 5,
  avatar: require("@/assets/figmaAssets/btc-logo-orange.png"),
  outcomes: [
    { label: "Before December 2026", pct: "49%", multiplier: "2.0x", color: simColors.teal },
    { label: "Before October 2026", pct: "9%", multiplier: "11.1x", color: simColors.green },
    { label: "Before November 2026", pct: "5%", multiplier: "20.0x", color: simColors.red },
  ],
};

export function Btc150kEntryCard() {
  const router = useRouter();
  return (
    <Pressable onPress={() => { tapHaptic(); router.push("/btc-150k" as never); }}>
      <PoliticsCard
        market={BTC_150K_MARKET}
        cardPadding="12"
        metaStyle="filled"
        metaPlacement="bottom"
        buttonText="gray-colored"
        buttonSize="md"
        buttonStyle="default"
        buttonAnim="slot"
        showAvatar
      />
    </Pressable>
  );
}

export default function CryptoScreen() {
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState<CryptoTab>("Live");
  const { width: windowWidth } = useWindowDimensions();
  const accentControls = useAccentControls();
  const versusHeaderAlign = useVersusHeaderAlign();
  const settings = React.useMemo<FeedSettings>(() => ({ ...FEED_SETTINGS, ...accentControls, versusHeaderAlign }), [accentControls, versusHeaderAlign]);
  const fullCardWidth = Math.max(0, windowWidth - 32);
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <PageHeader title="Crypto" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.filterScroll}
      >
        {FILTERS.map((f) => {
          const isActive = f === active;
          return (
            <Pressable
              key={f}
              onPress={() => { tapHaptic(); setActive(f); }}
              style={[styles.chip, isActive && styles.chipActive]}
            >
              {f === "Live" && <LiveDot color={simColors.green} />}
               <Text style={[styles.chipText, isActive && { color: simColors.textPrimary }]}>{f}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24, gap: 16, paddingTop: 8 }}
      >
        {active === "Live" ? (
          <CryptoLiveCardsCarousel gutter={0} />
        ) : active === "Bitcoin" ? (
          <FeedSettingsProvider value={settings}>
            <BtcCardsCard width={fullCardWidth} />
            {/* Date-ladder market: our version of Polymarket's "hit $150k". */}
            <Btc150kEntryCard />
            {/* Cards open the BTC Up or Down detail page; inner buttons still bet. */}
            <UpDownLink><BtcDailyCard market={BTC_DAILY} variant="seek" /></UpDownLink>
            <UpDownLink><BtcDailyCard market={BTC_DAILY} variant="seek-left" /></UpDownLink>
            <UpDownLink><BtcDailyCard market={BTC_DAILY} /></UpDownLink>
            <UpDownLink><BtcDailyCard market={BTC_DAILY} /></UpDownLink>
            <UpDownLink><BtcDailyCard market={BTC_DAILY} /></UpDownLink>
            <UpDownLink><BtcDailyCard market={BTC_DAILY} /></UpDownLink>
          </FeedSettingsProvider>
        ) : (
          <EthCardsCard width={fullCardWidth} odds={[61, 39]} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  filterScroll: { paddingHorizontal: 16, paddingVertical: 6, gap: 8, alignItems: "center" },
  chip: {
    height: 40, paddingHorizontal: 12, borderRadius: 12,
     backgroundColor: "transparent",
    alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: 6,
  },
   chipActive: { backgroundColor: FILTER_CHIP_ACTIVE_BG },
   chipText: { color: FILTER_CHIP_INACTIVE_TEXT, fontFamily: geist.medium, fontSize: 14, lineHeight: 22 },
});
