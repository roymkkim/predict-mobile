import React from "react";
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PageHeader } from "@/components/PageHeader";
import { BtcCardsCard, ProductionBtcCard, SportsCardsCard, matchToCardsGame } from "@/components/sim/LiveCardsCarousel";
import { matchDetailHref } from "@/lib/sim/marketRoutes";
import { FeedSettingsProvider, type FeedSettings } from "@/lib/sim/FeedSettingsContext";
import { LiveTickProvider } from "@/lib/sim/LiveTickContext";
import { LiveCueColorProvider } from "@/lib/sim/LiveCueColorContext";
import { useVersusMode } from "@/lib/sim/versusModeStore";
import { useAccentControls } from "@/lib/sim/accentControlsStore";
import { useVersusHeaderAlign } from "@/lib/sim/versusHeaderAlignStore";
import { useBtcLiveCarouselCard } from "@/lib/sim/btcLiveCarouselCardStore";
import { MatchCard } from "@/lib/sim/topicMarkets";
import {
  SOCCER,
  SOCCER_BRA_ARG,
  SOCCER_POR_NED,
  TENNIS,
  TENNIS_DECIDER,
  NBA,
  SPURS_KNICKS,
  NHL,
  NFL,
  NFL_GB_PIT,
  NFL_CAR_ARI,
  NCAAF_UGA_BAMA,
  GOLF,
  F1_RACE,
} from "@/lib/sim/data";
import { isKalshiLeague, useKalshiVenue } from "@/lib/sim/kalshiMarkets";
import type { Match } from "@/lib/sim/types";

// Every live fixture across the demo, big team sports first. All entries MUST
// be live (the page promises "live markets"); upcoming fixtures don't belong.
// Exported for check-market-links validation.
export const LIVE_MATCHES: Match[] = [
  NFL_CAR_ARI,
  NBA,
  NFL,
  SOCCER,
  TENNIS,
  NHL,
  SPURS_KNICKS,
  SOCCER_BRA_ARG,
  NFL_GB_PIT,
  TENNIS_DECIDER,
  NCAAF_UGA_BAMA,
  SOCCER_POR_NED,
  GOLF,
  F1_RACE,
].filter((m) => !!m.live);

// Standalone feed display settings — mirrors trending.tsx so the shared cards
// render identically to the home feed.
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
  liveFormat: "stacked",
  matchLayout: "mixed",
  scoreGlow: false,
  scoreGlowMode: "inPlace",
  scorerCallout: false,
  innerGlow: true,
  whiteBars: false,
  barTrack: false,
  heroSection: "carousel",
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

export default function LiveScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const versusMode = useVersusMode();
  const accentControls = useAccentControls();
  const versusHeaderAlign = useVersusHeaderAlign();
  const liveCards = useBtcLiveCarouselCard();
  const kalshi = useKalshiVenue();
  const matches = kalshi ? LIVE_MATCHES.filter((m) => isKalshiLeague(m.league)) : LIVE_MATCHES;
  const btcCardWidth = Math.max(0, windowWidth - 32);
  const chartCardH = btcCardWidth;

  const settings = React.useMemo<FeedSettings>(
    () => ({ ...FEED_SETTINGS, matchLayout: "mixed", versusMode, ...accentControls, versusHeaderAlign, cardBg: "rgba(255,255,255,0.08)" }),
    [versusMode, accentControls, versusHeaderAlign],
  );

  return (
    <View style={styles.root}>
      <PageHeader title="Live" showSearch comboHeader={false} />

      <FeedSettingsProvider value={settings}>
        <LiveTickProvider>
          <LiveCueColorProvider cue="green">
            <ScrollView
              style={{ flex: 1, minHeight: 0 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
            >
              <View style={{ gap: 12, paddingTop: 8 }}>
                {!kalshi ? (
                <View style={styles.cardWrap}>
                  {liveCards === "chart" ? (
                    <BtcCardsCard width={btcCardWidth} height={chartCardH} headerVariant="statusAboveCentered" />
                  ) : (
                    <ProductionBtcCard width={btcCardWidth} />
                  )}
                </View>
                ) : null}
                {matches.map((m, i) => (
                  <View key={`${m.teams[0].abbr ?? m.teams[0].name}-${i}`} style={styles.cardWrap}>
                    <Pressable onPress={() => router.push(matchDetailHref(m) as never)}>
                      {m.sport === "tennis" ? (
                        <SportsCardsCard game={matchToCardsGame(m)} width={btcCardWidth} />
                      ) : (
                        <MatchCard m={m} layout="global" combo={false} />
                      )}
                    </Pressable>
                  </View>
                ))}
              </View>
            </ScrollView>
          </LiveCueColorProvider>
        </LiveTickProvider>
      </FeedSettingsProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000000" },
  cardWrap: { paddingHorizontal: 16 },
});
