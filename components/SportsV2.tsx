import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "@/lib/sim/haptics";

import colors from "@/constants/colors";
import { PageHeader } from "@/components/PageHeader";
import { MarketListCard } from "@/components/MarketListCard";
import { useLiveOdds } from "@/hooks/useLiveOdds";
import { colors as simColors } from "@/lib/sim/colors";
import { useThemeMode } from "@/lib/sim/dsModeStore";
import { geist } from "@/lib/sim/geistFonts";

const c = simColors;

const flagUri = (cc: string) => ({ uri: `https://flagcdn.com/w80/${cc}.png` });
const tapHaptic = () => { Haptics.selectionAsync().catch(() => {}); };

type Cat =
  | { label: string; kind: "ionicon"; name: React.ComponentProps<typeof Ionicons>["name"]; slug: string }
  | { label: string; kind: "mcicon"; name: React.ComponentProps<typeof MaterialCommunityIcons>["name"]; slug: string }
  | { label: string; kind: "flag"; cc: string; slug: string };

export const SPORTS_CATEGORIES: Cat[] = [
  { label: "All sports", kind: "ionicon", name: "apps", slug: "__all__" },
  { label: "Serie A", kind: "flag", cc: "it", slug: "serie-a" },
  { label: "NBA", kind: "ionicon", name: "basketball", slug: "nba" },
  { label: "NHL", kind: "mcicon", name: "hockey-sticks", slug: "nhl" },
  { label: "Euroleague", kind: "ionicon", name: "basketball", slug: "euroleague" },
  { label: "Premier", kind: "flag", cc: "gb-eng", slug: "premier-league" },
  { label: "World Cup", kind: "ionicon", name: "football", slug: "world-cup" },
];

function CategoryTile({ cat, onPress }: { cat: Cat; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, alignItems: "center", gap: 6 })}>
      <View style={[styles.tile, { backgroundColor: c.surface }]}>
        {cat.kind === "flag" ? (
          <Image source={flagUri(cat.cc)} style={styles.tileFlag} resizeMode="cover" />
        ) : cat.kind === "ionicon" ? (
          <Ionicons name={cat.name} size={28} color={c.textPrimary} />
        ) : (
          <MaterialCommunityIcons name={cat.name} size={28} color={c.textPrimary} />
        )}
      </View>
      <Text style={[styles.tileLabel, { color: c.textPrimary }]} numberOfLines={1}>{cat.label}</Text>
    </Pressable>
  );
}

function HorizontalCards({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={CARD_W + 12}
      snapToAlignment="start"
      disableIntervalMomentum
      contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
    >
      {children}
    </ScrollView>
  );
}

function SectionHeader({ title, onPress }: { title: string; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 16 }}
    >
      <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>{title}</Text>
      <Feather name="chevron-right" size={20} color={c.textPrimary} />
    </Pressable>
  );
}

const CARD_W = 320;
const horizontalCardStyle = { marginHorizontal: 0, width: CARD_W } as const;

function LiveGames() {
  const nba = useLiveOdds([72, 28]);
  const aba = useLiveOdds([63, 37]);
  const fifa = useLiveOdds([55, 31, 14]);
  return (
    <HorizontalCards>
      <MarketListCard
        style={horizontalCardStyle}
        header={{ kind: "league", live: { time: "3'" }, league: "NBA", leagueDotColor: c.nbaOrange }}
        rows={[
          { name: "Cavaliers", img: null /* team logos not allowed — empty square placeholder */, anim: nba[0], barColor: c.nbaBlue ?? "#4d8cff" },
          { name: "Pistons", img: null, anim: nba[1], barColor: c.nbaOrange ?? "#ff7a3d" },
        ]}
        footer={{ volume: "$1.5m Vol.", date: "9 May 2026" }}
      />
      <MarketListCard
        style={horizontalCardStyle}
        header={{ kind: "league", live: { time: "15'" }, league: "ABA", leagueDotColor: "#4d8cff" }}
        rows={[
          { name: "Dubai", img: null, anim: aba[0], barColor: "#1d3a8a" },
          { name: "Spartak", img: null, anim: aba[1], barColor: "#4d8cff" },
        ]}
        footer={{ volume: "$1.5m Vol.", date: "9 May 2026" }}
      />
      <MarketListCard
        style={horizontalCardStyle}
        header={{ kind: "league", live: { time: "67'" }, league: "FIFA World Cup", leagueDotColor: c.spainRed ?? "#cf102c" }}
        rows={[
          { name: "Brazil", img: flagUri("br"), anim: fifa[0], barColor: "#0c8a5b" },
          { name: "Argentina", img: flagUri("ar"), anim: fifa[1], barColor: "#74acdf" },
          { name: "Draw", img: null, anim: fifa[2], barColor: "#9b9b9b" },
        ]}
        footer={{ volume: "$4.2m Vol.", date: "9 May 2026" }}
      />
    </HorizontalCards>
  );
}

function StartingSoon() {
  const csgo = useLiveOdds([72, 28]);
  const aba = useLiveOdds([55, 45]);
  return (
    <HorizontalCards>
      <MarketListCard
        style={horizontalCardStyle}
        header={{ kind: "league", league: "CS:GO", leagueDotColor: "#facc15" }}
        rows={[
          { name: "FaZe", img: null, anim: csgo[0], barColor: c.nbaBlue ?? "#4d8cff" },
          { name: "Fnatics", img: null, anim: csgo[1], barColor: "#ff5c6c" },
        ]}
        footer={{ volume: "$1.5m Vol.", date: "9 May 2026" }}
      />
      <MarketListCard
        style={horizontalCardStyle}
        header={{ kind: "league", league: "ABA", leagueDotColor: "#4d8cff" }}
        rows={[
          { name: "Dubai", img: null, anim: aba[0], barColor: "#1d3a8a" },
          { name: "Spartak", img: null, anim: aba[1], barColor: "#4d8cff" },
        ]}
        footer={{ volume: "$1.5m Vol.", date: "9 May 2026" }}
      />
    </HorizontalCards>
  );
}

function WorldCupSection() {
  const fifa1 = useLiveOdds([45, 36, 19]);
  const fifa2 = useLiveOdds([34, 55, 11], { preserveSum: true });
  return (
    <HorizontalCards>
      <MarketListCard
        style={horizontalCardStyle}
        header={{ kind: "league", league: "FIFA World Cup", stage: "Semi Finals", leagueDotColor: c.spainRed ?? "#cf102c" }}
        rows={[
          { name: "Spain", img: flagUri("es"), anim: fifa1[0], barColor: "#ff5c6c" },
          { name: "England", img: flagUri("gb-eng"), anim: fifa1[1], barColor: "#4d8cff" },
          { name: "Draw", img: null, anim: fifa1[2], barColor: "#9b9b9b" },
        ]}
        footer={{ volume: "$1.5m Vol.", date: "29 April 2026" }}
      />
      <MarketListCard
        style={horizontalCardStyle}
        header={{ kind: "league", league: "FIFA World Cup", stage: "Quarter Finals", leagueDotColor: c.spainRed ?? "#cf102c" }}
        rows={[
          { name: "Mexico", img: flagUri("mx"), anim: fifa2[0], barColor: "#0c8a5b" },
          { name: "USA", img: flagUri("us"), anim: fifa2[1], barColor: "#4d8cff" },
          { name: "Draw", img: null, anim: fifa2[2], barColor: "#9b9b9b" },
        ]}
        footer={{ volume: "$1.8m Vol.", date: "10 May 2026" }}
      />
    </HorizontalCards>
  );
}

export default function SportsV2() {
  const router = useRouter();
  useThemeMode();
  const insets = useSafeAreaInsets();
  const onCategoryPress = (cat: Cat) => {
    tapHaptic();
    if (cat.slug === "__all__") {
      router.push("/all-sports");
    } else {
      router.push({ pathname: "/sport/[slug]", params: { slug: cat.slug, label: cat.label } });
    }
  };
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <PageHeader title="Sports" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24, gap: 18 }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={64 + 6}
          snapToAlignment="start"
          disableIntervalMomentum
          contentContainerStyle={{ paddingHorizontal: 16, gap: 14, paddingTop: 8 }}
        >
          {SPORTS_CATEGORIES.map((cat) => (
            <CategoryTile key={cat.slug} cat={cat} onPress={() => onCategoryPress(cat)} />
          ))}
        </ScrollView>

        <View style={{ gap: 12 }}>
          <SectionHeader title="Live games" />
          <LiveGames />
        </View>

        <View style={{ gap: 12 }}>
          <SectionHeader title="Starting soon" />
          <StartingSoon />
        </View>

        <View style={{ gap: 12 }}>
          <SectionHeader title="World Cup" />
          <WorldCupSection />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 64, height: 64, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },
  tileFlag: { width: 36, height: 36, borderRadius: 4 },
  tileLabel: { fontFamily: geist.medium, fontSize: 12, maxWidth: 72, textAlign: "center" },
  sectionTitle: { fontFamily: geist.semibold, fontSize: 20 },
});
