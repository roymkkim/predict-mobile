import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";

import { PageHeader } from "@/components/PageHeader";
import { FeedSettingsProvider, type FeedSettings } from "@/lib/sim/FeedSettingsContext";
import { LiveTickProvider } from "@/lib/sim/LiveTickContext";
import { LiveCueColorProvider } from "@/lib/sim/LiveCueColorContext";
import { colors } from "@/lib/sim/colors";
import { useThemeMode } from "@/lib/sim/dsModeStore";
import { useUxrMode } from "@/lib/sim/uxrModeStore";
import { useMatchLayout } from "@/lib/sim/matchLayoutStore";
import { useVersusMode } from "@/lib/sim/versusModeStore";
import { useAccentControls } from "@/lib/sim/accentControlsStore";
import { useVersusHeaderAlign } from "@/lib/sim/versusHeaderAlignStore";
import { TOPICS, MatchCard, BinaryCard } from "@/lib/sim/topicMarkets";
import { geist } from "@/lib/sim/geistFonts";

// Standalone feed display settings — mirrors the home feed so the shared cards
// render identically here.
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

export default function TopicScreen() {
  const insets = useSafeAreaInsets();
  const matchLayout = useMatchLayout();
  const versusMode = useVersusMode();
  const accentControls = useAccentControls();
  const versusHeaderAlign = useVersusHeaderAlign();
  // The palette is mutable so it can track Predict/MetaMask, dark/light, and
  // UXR surface modes. These subscriptions ensure the standalone topic route
  // repaints when one of those settings changes while it is already open.
  const uxrMode = useUxrMode();
  const themeMode = useThemeMode();
  const { id } = useLocalSearchParams<{ id: string }>();

  const topic = id ? TOPICS[id] : undefined;

  const settings = React.useMemo<FeedSettings>(
    () => ({ ...FEED_SETTINGS, matchLayout, versusMode, ...accentControls, versusHeaderAlign }),
    [matchLayout, versusMode, accentControls, versusHeaderAlign, uxrMode, themeMode],
  );

  if (!topic) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        <PageHeader title="Markets" showSearch />
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No markets found for this topic.</Text>
        </View>
      </View>
    );
  }

  const body =
    topic.kind === "binary"
      ? topic.data.map((b, i) => (
          <View key={`${topic.slug}-${i}`} style={styles.cardWrap}>
            <BinaryCard item={b} />
          </View>
        ))
      : topic.data.map((m, i) => (
          <View key={`${topic.slug}-${i}`} style={styles.cardWrap}>
            <MatchCard m={m} layout={matchLayout} />
          </View>
        ));

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <PageHeader title={topic.label} showSearch />

      <FeedSettingsProvider value={settings}>
        <LiveTickProvider>
          <LiveCueColorProvider cue="green">
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}
            >
              <View style={{ gap: 12 }}>{body}</View>
            </ScrollView>
          </LiveCueColorProvider>
        </LiveTickProvider>
      </FeedSettingsProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  cardWrap: { paddingHorizontal: 16 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  emptyText: { fontFamily: geist.medium, fontSize: 16, textAlign: "center" },
});
