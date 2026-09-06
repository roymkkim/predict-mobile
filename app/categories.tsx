import React from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PageHeader } from "@/components/PageHeader";
import { ChevronIcon } from "@/components/sim/FeedChrome";
import { colors } from "@/lib/sim/colors";
import { geist } from "@/lib/sim/geistFonts";

type Glyph =
  | { mi: keyof typeof MaterialIcons.glyphMap }
  | { mc: keyof typeof MaterialCommunityIcons.glyphMap }
  | { flag: string };

type Row = { label: string; glyph: Glyph; route?: string };
type Section = { title: string; rows: Row[] };

const SECTIONS: Section[] = [
  {
    title: "Popular",
    rows: [
      { label: "Politics", glyph: { mi: "account-balance" }, route: "/politics" },
      { label: "Crypto", glyph: { mi: "currency-bitcoin" }, route: "/crypto" },
      { label: "NBA", glyph: { mi: "sports-basketball" } },
      { label: "World Cup", glyph: { mi: "sports-soccer" }, route: "/worldcup" },
      { label: "NHL", glyph: { mi: "sports-hockey" } },
    ],
  },
  {
    title: "Politics",
    rows: [
      { label: "All Politics", glyph: { mi: "account-balance" }, route: "/politics" },
      { label: "US Elections", glyph: { mi: "how-to-vote" } },
      { label: "World Leaders", glyph: { mi: "public" } },
    ],
  },
  {
    title: "Crypto",
    rows: [
      { label: "Bitcoin", glyph: { mi: "currency-bitcoin" } },
      { label: "Ethereum", glyph: { mc: "ethereum" } },
      { label: "All Crypto", glyph: { mi: "attach-money" }, route: "/crypto" },
    ],
  },
  {
    title: "Sports",
    rows: [
      { label: "All sports", glyph: { mi: "apps" }, route: "/sports-leagues" },
      { label: "NBA", glyph: { mi: "sports-basketball" } },
      { label: "Euroleague", glyph: { mi: "sports-basketball" } },
      { label: "NHL", glyph: { mi: "sports-hockey" } },
      { label: "World Cup", glyph: { mi: "sports-soccer" }, route: "/worldcup" },
      { label: "Premier League", glyph: { flag: "gb-eng" } },
      { label: "Serie A", glyph: { flag: "it" } },
    ],
  },
];

function RowIcon({ glyph }: { glyph: Glyph }) {
  if ("flag" in glyph) {
    return (
      <Image
        source={{ uri: `https://flagcdn.com/w80/${glyph.flag}.png` }}
        style={{ width: 28, height: 28, borderRadius: 6 }}
        resizeMode="cover"
      />
    );
  }
  if ("mc" in glyph) {
    return <MaterialCommunityIcons name={glyph.mc} size={22} color="#fff" />;
  }
  return <MaterialIcons name={glyph.mi} size={22} color="#fff" />;
}

export default function CategoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const open = (row: Row) => {
    if (row.route) router.push(row.route as never);
    else router.push(`/league/${encodeURIComponent(row.label)}` as never);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <PageHeader title="All categories" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 32 }}
      >
        {SECTIONS.map((section) => (
          <View key={section.title} style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontFamily: geist.semibold,
                fontSize: 20,
                lineHeight: 26,
                color: "#fff",
                marginBottom: 12,
              }}
            >
              {section.title}
            </Text>
            <View style={{ gap: 16 }}>
              {section.rows.map((row) => (
                <Pressable
                  key={row.label}
                  onPress={() => open(row)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <View style={{ width: 26, alignItems: "center" }}>
                    <RowIcon glyph={row.glyph} />
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontFamily: geist.medium,
                      fontSize: 16,
                      color: "#fff",
                    }}
                  >
                    {row.label}
                  </Text>
                  <ChevronIcon size={20} color={colors.textMuted} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
