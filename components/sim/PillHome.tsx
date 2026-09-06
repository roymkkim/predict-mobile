import React, { useMemo } from "react";
import { Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";

import { colors } from "@/lib/sim/colors";
import { UXR_SPORTS, UxrCardProviders, UxrGameGroups } from "@/components/sim/UxrBrowse";
import { ProdBalanceCard } from "@/components/sim/ProdBalanceCard";
import { SectionHeader } from "@/components/sim/FeedChrome";
import { UxrPropsList } from "@/components/sim/UxrBrowse";
import { CRYPTO_MARKETS, POLITICS_MARKETS } from "@/lib/sim/hubMarkets";
import { useRouter } from "expo-router";
import { MatchCard } from "@/lib/sim/topicMarkets";
import { matchDetailHref } from "@/lib/sim/marketRoutes";
import { BtcCardsCard } from "@/components/sim/LiveCardsCarousel";
import { SimpleHub, SportsHub, TopicList } from "@/app/uxr-hub/[category]";
import { PolymarketMetaMaskSports } from "@/components/sim/PolymarketMetaMaskSports";
import { useSportsIa } from "@/lib/sim/sportsIaStore";
import { geist } from "@/lib/sim/geistFonts";

// Home variant (Settings → Home layout → Pills): instead of the mixed
// scrolling feed, a pill filter row (Live / Crypto / Politics / Sports)
// selects one category of content. The balance section rides above the pills
// and scrolls away; the pill row sticks to the top while the content scrolls.
// Each category brings its page's secondary filter: Crypto gets the
// Top/Bitcoin/Ethereum tabs, Sports gets the sport/league carousel.

const PILLS = [
  { key: "home", label: "Home" },
  { key: "trending", label: "Trending" },
  { key: "live", label: "Live" },
  { key: "crypto", label: "Crypto" },
  { key: "politics", label: "Politics" },
  { key: "sports", label: "Sports" },
] as const;

export type PillKey = (typeof PILLS)[number]["key"];

type GameGroups = (typeof UXR_SPORTS)[number]["games"];

// Merge day-titled groups across sports, deduping matches by identity (leagues
// without dedicated fixtures fall back to their parent sport's games).
function mergeGroups(lists: GameGroups[]): GameGroups {
  const byTitle = new Map<string, GameGroups[number]>();
  const seen = new Set<unknown>();
  for (const list of lists)
    for (const g of list) {
      const fresh = g.matches.filter((m) => !seen.has(m));
      fresh.forEach((m) => seen.add(m));
      if (fresh.length === 0) continue;
      const existing = byTitle.get(g.title);
      if (existing) existing.matches.push(...fresh);
      else byTitle.set(g.title, { title: g.title, matches: fresh });
    }
  return [...byTitle.values()];
}

export function TabsHomeRow({ active, onChange }: { active: PillKey; onChange: (k: PillKey) => void }) {
  return (
    // This row is rendered inside NavHeader, so it remains one opaque header
    // surface while the home content scrolls beneath it.
    <View style={{ backgroundColor: colors.bg, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {PILLS.map((p) => {
            const on = p.key === active;
            return (
              <Pressable
                key={p.key}
                onPress={() => onChange(p.key)}
                hitSlop={6}
                style={{
                  minWidth: 68,
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  paddingHorizontal: 8,
                }}
              >
                <Text style={{ fontFamily: geist.semibold, fontSize: 15, lineHeight: 20, color: on ? colors.textPrimary : colors.textMuted }}>
                  {p.label}
                </Text>
                {on && <View style={{ position: "absolute", left: 0, right: 0, bottom: -1, height: 2, backgroundColor: "#FFFFFF" }} />}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export function PillHome({ activeTab, onTabChange }: { activeTab: PillKey; onTabChange: (key: PillKey) => void }) {
  const router = useRouter();
  const sportsIa = useSportsIa();
  const { width: winW } = useWindowDimensions();

  const liveGroups = useMemo(
    () =>
      mergeGroups(UXR_SPORTS.map((s) => s.games))
        .map((g) => ({ ...g, matches: g.matches.filter((m) => m.live) }))
        .filter((g) => g.matches.length > 0),
    [],
  );
  const sportsGroups = useMemo(() => mergeGroups(UXR_SPORTS.map((s) => s.games)), []);

  // Home pill: balance section + a short assorted stack per category, each
  // led by a "Live >"-style header that switches to that category's pill.
  const homeContent = (
    <View style={{ gap: 24, paddingTop: 16 }}>
      <View style={{ paddingHorizontal: 12 }}>
        <ProdBalanceCard />
      </View>
      <UxrCardProviders>
        <View>
           <SectionHeader title="Trending" onPress={() => onTabChange("trending")} />
          <TopicList topicKey="nba" limit={2} />
        </View>
        <View style={{ marginTop: 24 }}>
           <SectionHeader title="Live" onPress={() => onTabChange("live")} />
          <View style={{ paddingHorizontal: 12 }}>
            <BtcCardsCard width={winW - 24} />
          </View>
          <UxrGameGroups groups={liveGroups.slice(0, 1).map((g) => ({ ...g, matches: g.matches.slice(0, 2) }))} />
        </View>
        <View style={{ marginTop: 24 }}>
           <SectionHeader title="Crypto" onPress={() => onTabChange("crypto")} />
          <UxrPropsList props={CRYPTO_MARKETS.slice(0, 2)} />
        </View>
        <View style={{ marginTop: 24 }}>
           <SectionHeader title="Politics" onPress={() => onTabChange("politics")} />
          <UxrPropsList props={POLITICS_MARKETS.slice(0, 2)} />
        </View>
        <View style={{ marginTop: 24 }}>
           <SectionHeader title="Sports" onPress={() => onTabChange("sports")} />
          <UxrGameGroups groups={sportsGroups.slice(0, 1).map((g) => ({ ...g, matches: g.matches.slice(0, 2) }))} />
        </View>
      </UxrCardProviders>
    </View>
  );

  const content = () => {
    if (activeTab === "home") return homeContent;
    if (activeTab === "trending") return <SimpleHub key="trending" category="trending" embedded />;
    if (activeTab === "live") {
      // The day header ("Today") leads, then the BTC chart card, then that
      // day's live games; later day groups follow as usual.
      const [first, ...rest] = liveGroups;
      return (
        <View style={{ paddingTop: 16, gap: 16 }}>
          <UxrCardProviders>
            {first && (
              <View style={{ gap: 12, paddingHorizontal: 12 }}>
                <Text style={{ fontFamily: geist.semibold, fontSize: 15, color: "#9B9B9B", paddingHorizontal: 4 }}>
                  {first.title}
                </Text>
                <BtcCardsCard width={winW - 24} />
                <View style={{ gap: 12 }}>
                  {first.matches.map((m, i) => (
                    <Pressable key={`live-first-${i}`} onPress={() => router.push(matchDetailHref(m) as never)}>
                      <MatchCard m={m} layout="global" />
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
            {rest.length > 0 && <UxrGameGroups groups={rest} />}
          </UxrCardProviders>
        </View>
      );
    }
    // Hubs render embedded (no own ScrollView) and bring their secondary
    // filters: Crypto = Top/Bitcoin/Ethereum tabs, Sports = sport/league rail.
    if (activeTab === "crypto") return <SimpleHub key="crypto" category="crypto" embedded />;
    if (activeTab === "politics") return <SimpleHub key="politics" category="politics" embedded />;
    return sportsIa === "polymarket-metamask" ? (
      <PolymarketMetaMaskSports key="sports" embedded />
    ) : (
      <SportsHub key="sports" embedded />
    );
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      {content()}
    </ScrollView>
  );
}
