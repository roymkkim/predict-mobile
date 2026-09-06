import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "@/lib/sim/colors";
import type { Match } from "@/lib/sim/types";
import { PageHeader } from "@/components/PageHeader";
import { UXR_SPORTS, UxrCardProviders, UxrPageScroll } from "@/components/sim/UxrBrowse";
import { MatchCard } from "@/lib/sim/topicMarkets";
import { matchDetailHref } from "@/lib/sim/marketRoutes";
import { KalshiSportRail } from "@/components/sim/KalshiIA";
import { geist } from "@/lib/sim/geistFonts";

// ── Kalshi IA: sports hub ────────────────────────────────────────────────────
// Entry for the "Sports" tile on the Categories Carousel when Sports IA =
// Kalshi. Kalshi's hub structure (sport icon rail, "See all upcoming games",
// featured live series sections with a bold heading + chevron) rendered with
// the app's own visual system: shared dynamic PageHeader + home-feed cards.

export default function KalshiSportsHub() {
  const router = useRouter();

  const liveMatches = useMemo(() => {
    const seen = new Set<string>();
    const out: { m: Match; sport: string }[] = [];
    for (const s of UXR_SPORTS) {
      for (const g of s.games) {
        for (const m of g.matches) {
          const key = `${m.teams[0].name}-${m.teams[1].name}`;
          if (m.live && !seen.has(key)) {
            seen.add(key);
            out.push({ m, sport: s.slug });
          }
        }
      }
    }
    return out.slice(0, 5);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <PageHeader title="Sports" />
      <UxrPageScroll>
        <View style={{ gap: 20 }}>
          <KalshiSportRail
            sports={UXR_SPORTS.map((s) => ({ slug: s.slug, label: s.label, emoji: s.emoji }))}
            onPress={(slug) => router.push(`/kalshi-sport/${slug}` as never)}
          />

          <UxrCardProviders>
            {liveMatches.map(({ m }, i) => (
              <View key={i} style={{ gap: 12 }}>
                <Pressable
                  onPress={() => router.push(matchDetailHref(m) as never)}
                  style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 }}
                >
                  <Text
                    style={{ fontFamily: geist.bold, fontSize: 22, color: colors.textPrimary, flex: 1 }}
                    numberOfLines={1}
                  >
                    {m.league} {m.teams[0].name} vs. {m.teams[1].name}
                  </Text>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: "#26272a",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="chevron-forward" size={16} color={colors.textPrimary} />
                  </View>
                </Pressable>
                <Pressable style={{ paddingHorizontal: 16 }} onPress={() => router.push(matchDetailHref(m) as never)}>
                  <MatchCard m={m} layout="global" />
                </Pressable>
              </View>
            ))}
          </UxrCardProviders>
        </View>
      </UxrPageScroll>
    </View>
  );
}
