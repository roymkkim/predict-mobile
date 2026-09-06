import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "@/lib/sim/haptics";

import colors from "@/constants/colors";
import { PageHeader } from "@/components/PageHeader";
import { geist } from "@/lib/sim/geistFonts";

const c = colors.light;
const flagUri = (cc: string) => ({ uri: `https://flagcdn.com/w80/${cc}.png` });
const tapHaptic = () => { Haptics.selectionAsync().catch(() => {}); };

type LeagueItem =
  | { label: string; slug: string; kind: "ionicon"; name: React.ComponentProps<typeof Ionicons>["name"] }
  | { label: string; slug: string; kind: "mcicon"; name: React.ComponentProps<typeof MaterialCommunityIcons>["name"] }
  | { label: string; slug: string; kind: "flag"; cc: string };

const SECTIONS: { title: string; items: LeagueItem[] }[] = [
  {
    title: "Popular",
    items: [
      { label: "World Cup", slug: "world-cup", kind: "ionicon", name: "football" },
      { label: "Serie A", slug: "serie-a", kind: "flag", cc: "it" },
      { label: "Premier League", slug: "premier-league", kind: "flag", cc: "gb-eng" },
      { label: "NBA", slug: "nba", kind: "ionicon", name: "basketball" },
      { label: "NHL", slug: "nhl", kind: "mcicon", name: "hockey-sticks" },
      { label: "Euroleague", slug: "euroleague", kind: "ionicon", name: "basketball" },
    ],
  },
  {
    title: "Basketball",
    items: [
      { label: "NBA", slug: "nba", kind: "ionicon", name: "basketball" },
      { label: "Euroleague", slug: "euroleague", kind: "ionicon", name: "basketball" },
      { label: "CBA", slug: "cba", kind: "flag", cc: "cn" },
      { label: "Japan B League", slug: "japan-b-league", kind: "flag", cc: "jp" },
      { label: "LNB", slug: "lnb", kind: "flag", cc: "ar" },
      { label: "Greek Basketball", slug: "greek-basketball", kind: "flag", cc: "gr" },
    ],
  },
  {
    title: "Soccer",
    items: [
      { label: "World Cup", slug: "world-cup", kind: "ionicon", name: "football" },
      { label: "Serie A", slug: "serie-a", kind: "flag", cc: "it" },
      { label: "Premier League", slug: "premier-league", kind: "flag", cc: "gb-eng" },
      { label: "Argentina Serie A", slug: "argentina-serie-a", kind: "flag", cc: "ar" },
      { label: "Ligue 1", slug: "ligue-1", kind: "flag", cc: "fr" },
    ],
  },
  {
    title: "Hockey",
    items: [
      { label: "NHL", slug: "nhl", kind: "mcicon", name: "hockey-sticks" },
      { label: "KHL", slug: "khl", kind: "flag", cc: "ru" },
      { label: "SHL", slug: "shl", kind: "flag", cc: "se" },
    ],
  },
];

function LeagueIcon({ item }: { item: LeagueItem }) {
  if (item.kind === "flag") {
    return <Image source={flagUri(item.cc)} style={styles.iconFlag} resizeMode="cover" />;
  }
  if (item.kind === "ionicon") {
    return <Ionicons name={item.name} size={22} color="#fff" />;
  }
  return <MaterialCommunityIcons name={item.name} size={22} color="#fff" />;
}

export default function AllSportsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <PageHeader title="All sports" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24, gap: 20, paddingTop: 8 }}
      >
        {SECTIONS.map((sec) => (
          <View key={sec.title} style={{ gap: 10 }}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>
            <View style={styles.groupCard}>
              {sec.items.map((item, idx) => (
                <Pressable
                  key={`${sec.title}-${item.slug}-${idx}`}
                  onPress={() => {
                    tapHaptic();
                    if (item.slug === "world-cup") {
                      router.push("/worldcup");
                      return;
                    }
                    router.push({ pathname: "/sport/[slug]", params: { slug: item.slug, label: item.label } });
                  }}
                  style={({ pressed }) => [
                    styles.row,
                    idx !== sec.items.length - 1 ? styles.rowDivider : null,
                    pressed ? { opacity: 0.7 } : null,
                  ]}
                >
                  <View style={styles.iconWrap}>
                    <LeagueIcon item={item} />
                  </View>
                  <Text style={styles.rowLabel} numberOfLines={1}>{item.label}</Text>
                  <Feather name="chevron-right" size={20} color={c.textMuted} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { color: "#fff", fontFamily: geist.semibold, fontSize: 20 },
  groupCard: { backgroundColor: c.surface, borderRadius: 12, overflow: "hidden" },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: c.bg },
  iconWrap: { width: 28, alignItems: "center", justifyContent: "center" },
  iconFlag: { width: 28, height: 28, borderRadius: 6 },
  rowLabel: { color: "#fff", fontFamily: geist.medium, fontSize: 16, flex: 1 },
});
