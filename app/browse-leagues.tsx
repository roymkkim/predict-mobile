import React, { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PageHeader } from "@/components/PageHeader";
import { ChevronIcon } from "@/components/sim/FeedChrome";
import { colors } from "@/lib/sim/colors";
import { geist } from "@/lib/sim/geistFonts";

type Glyph = { mi: keyof typeof MaterialIcons.glyphMap } | { flag: string };
type League = { label: string; glyph: Glyph };
type Sport = { title: string; leagues: League[] };

const SPORTS: Sport[] = [
  {
    title: "Soccer",
    leagues: [
      { label: "World Cup", glyph: { mi: "sports-soccer" } },
      { label: "Serie A", glyph: { flag: "it" } },
      { label: "Premier League", glyph: { flag: "gb-eng" } },
      { label: "Argentina Serie A", glyph: { flag: "ar" } },
      { label: "Ligue 1", glyph: { flag: "fr" } },
    ],
  },
  {
    title: "Basketball",
    leagues: [
      { label: "NBA", glyph: { mi: "sports-basketball" } },
      { label: "Euroleague", glyph: { mi: "sports-basketball" } },
      { label: "CBA", glyph: { flag: "cn" } },
      { label: "Japan B League", glyph: { flag: "jp" } },
      { label: "LNB", glyph: { flag: "ar" } },
      { label: "Greek Basketball", glyph: { flag: "gr" } },
    ],
  },
  {
    title: "Hockey",
    leagues: [
      { label: "NHL", glyph: { mi: "sports-hockey" } },
      { label: "KHL", glyph: { flag: "ru" } },
      { label: "SHL", glyph: { flag: "se" } },
    ],
  },
];

function LeagueIcon({ glyph }: { glyph: Glyph }) {
  if ("flag" in glyph) {
    return (
      <Image
        source={{ uri: `https://flagcdn.com/w80/${glyph.flag}.png` }}
        style={{ width: 28, height: 28, borderRadius: 6 }}
        resizeMode="cover"
      />
    );
  }
  return <MaterialIcons name={glyph.mi} size={22} color="#fff" />;
}

export default function BrowseLeaguesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (title: string) =>
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <PageHeader title="Browse leagues" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 32 }}
      >
        {SPORTS.map((sport) => {
          const isCollapsed = collapsed[sport.title];
          return (
            <View key={sport.title} style={{ marginBottom: 24 }}>
              <Pressable
                onPress={() => toggle(sport.title)}
                hitSlop={8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontFamily: geist.semibold, fontSize: 20, lineHeight: 26, color: "#fff" }}>
                  {sport.title}
                </Text>
                <View style={{ transform: [{ rotate: isCollapsed ? "0deg" : "90deg" }] }}>
                  <ChevronIcon size={20} color={colors.textMuted} />
                </View>
              </Pressable>
              {!isCollapsed && (
                <View style={{ gap: 16 }}>
                  {sport.leagues.map((league) => (
                    <Pressable
                      key={league.label}
                      onPress={() =>
                        router.push(
                          (league.label === "World Cup"
                            ? "/worldcup"
                            : `/league/${encodeURIComponent(league.label)}`) as never,
                        )
                      }
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 14,
                      }}
                    >
                      <View style={{ width: 26, alignItems: "center" }}>
                        <LeagueIcon glyph={league.glyph} />
                      </View>
                      <Text style={{ flex: 1, fontFamily: geist.medium, fontSize: 16, color: "#fff" }}>
                        {league.label}
                      </Text>
                      <ChevronIcon size={20} color={colors.textMuted} />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
