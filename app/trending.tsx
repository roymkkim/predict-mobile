import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { PageHeader } from "@/components/PageHeader";
import {
  POPULAR_TOPIC_SLUGS,
  PopularPillsRow,
  popularContentKey,
  popularLabelForSlug,
  resolvePopularTopicSlug,
} from "@/components/sim/FeedChrome";
import { PoliticsCard } from "@/components/sim/PoliticsCard";
import { FeedSettingsProvider, type FeedSettings } from "@/lib/sim/FeedSettingsContext";
import { LiveTickProvider } from "@/lib/sim/LiveTickContext";
import { LiveCueColorProvider } from "@/lib/sim/LiveCueColorContext";
import { useMatchLayout } from "@/lib/sim/matchLayoutStore";
import { useVersusMode } from "@/lib/sim/versusModeStore";
import { useAccentControls } from "@/lib/sim/accentControlsStore";
import { useVersusHeaderAlign } from "@/lib/sim/versusHeaderAlignStore";
import {
  TOPICS,
  MatchCard,
  BinaryCard,
} from "@/lib/sim/topicMarkets";
import { PRESS_SECRETARY_FEED, PRESS_SECRETARY_MARKET } from "@/lib/sim/data";
import { allEsportsGames } from "@/app/esports";

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

export default function TrendingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const matchLayout = useMatchLayout();
  const versusMode = useVersusMode();
  const accentControls = useAccentControls();
  const versusHeaderAlign = useVersusHeaderAlign();
  const { topic } = useLocalSearchParams<{ topic?: string | string[] }>();

  const slug = resolvePopularTopicSlug(topic);
  const selectedLabel = popularLabelForSlug(slug) ?? "Trump";
  const contentKey = popularContentKey(slug) ?? "iran";

  const settings = React.useMemo<FeedSettings>(
    () => ({ ...FEED_SETTINGS, matchLayout, versusMode, ...accentControls, versusHeaderAlign, cardBg: "rgba(255,255,255,0.08)" }),
    [matchLayout, versusMode, accentControls, versusHeaderAlign],
  );

  const esportsCards =
    contentKey === "esports"
      ? allEsportsGames().map((m, i) => (
          <View key={`esports-${i}`} style={styles.cardWrap}>
            <MatchCard m={m} layout="global" />
          </View>
        ))
      : null;
  const def = TOPICS[contentKey];
  const pressSecretaryCard =
    selectedLabel === "Trump" ? (
      <Pressable
        key="press-secretary"
        style={styles.cardWrap}
        onPress={() =>
          router.push({ pathname: "/prediction-detail", params: { pm: PRESS_SECRETARY_MARKET.question } })
        }
      >
        <PoliticsCard
          market={PRESS_SECRETARY_FEED}
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
    ) : null;
  const topicCards = esportsCards ?? (def
    ? def.kind === "binary"
      ? def.data.map((b, i) => (
          <View key={`${def.slug}-${i}`} style={styles.cardWrap}>
            <BinaryCard item={b} />
          </View>
        ))
      : def.data.map((m, i) => (
          <View key={`${def.slug}-${i}`} style={styles.cardWrap}>
            <MatchCard m={m} layout={matchLayout} />
          </View>
        ))
    : null);

  return (
    <View style={styles.root}>
      <PageHeader title="Trending" showSearch />

      <FeedSettingsProvider value={settings}>
        <LiveTickProvider>
          <LiveCueColorProvider cue="green">
            <ScrollView
              style={{ flex: 1, minHeight: 0 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
            >
              <PopularPillsRow
                rows={1}
                select={{
                  selected: selectedLabel,
                  onSelect: (label) => {
                    if (!label) return;
                    router.setParams({ topic: POPULAR_TOPIC_SLUGS[label] });
                  },
                }}
              />
              <View style={{ gap: 12, paddingTop: 16 }}>
                {pressSecretaryCard}
                {topicCards}
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
