import React, { useMemo, useState } from "react";
import { Text, TextInput, View } from "react-native";

import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";

import { PageHeader } from "@/components/PageHeader";
import {
  sportBySlug,
  leagueGames,
  UxrCardProviders,
  UxrGameGroups,
  UxrPropsList,
  UxrPageScroll,
} from "@/components/sim/UxrBrowse";
import {
  PolyPillTabs,
  buildPolySport,
  polySportPills,
  pmLiveFirst,
} from "@/app/uxr-hub/[category]";
import { colors } from "@/lib/sim/colors";
import { useThemeMode } from "@/lib/sim/dsModeStore";
import { geist } from "@/lib/sim/geistFonts";

// ── Polymarket nested sport page ─────────────────────────────────────────────
// Pushed from the Live feed's category headers (per the user's ATP screenshot,
// Aug 17 2026): back header with the category title, a search field, the
// Polymarket pill tabs (Games / leagues / Futures / Awards), then the standard
// home-feed cards grouped Live-first.
export default function PolySportScreen() {
  useThemeMode();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const sport = sportBySlug(String(slug ?? ""));
  const [tab, setTab] = useState("games");
  const [query, setQuery] = useState("");
  const data = useMemo(() => (sport ? buildPolySport(sport) : null), [sport]);

  if (!sport || !data) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <PageHeader title="Sports" />
        <Text style={{ fontFamily: geist.medium, fontSize: 14, color: colors.textMuted, textAlign: "center", paddingTop: 32 }}>
          Nothing here yet
        </Text>
      </View>
    );
  }

  const groups = tab.startsWith("league:") ? pmLiveFirst(leagueGames(tab.slice(7))) : pmLiveFirst(data.all);
  const q = query.trim().toLowerCase();
  const filtered = q
    ? groups
        .map((g) => ({
          ...g,
          matches: g.matches.filter((m) =>
            `${m.teams[0].name} ${m.teams[1].name} ${m.league}`.toLowerCase().includes(q),
          ),
        }))
        .filter((g) => g.matches.length > 0)
    : groups;
  // Search also applies to the Futures/Awards pills, matching market titles.
  const filterProps = (list: typeof data.futures) =>
    q ? list.filter((p) => p.title.toLowerCase().includes(q)) : list;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <PageHeader title={sport.label} />
      <UxrPageScroll>
        {/* Search field */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginHorizontal: 16,
            height: 48,
            borderRadius: 12,
            paddingHorizontal: 14,
            backgroundColor: colors.surface2,
          }}
        >
          <Feather name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search"
            placeholderTextColor={colors.textMuted}
            style={{
              flex: 1,
              fontFamily: geist.medium,
              fontSize: 15,
              color: colors.textPrimary,
              paddingVertical: 0,
            }}
          />
        </View>
        <PolyPillTabs active={tab} onChange={setTab} pills={polySportPills(sport, data)} />
        <UxrCardProviders>
          {tab === "futures" ? (
            <UxrPropsList props={filterProps(data.futures)} />
          ) : tab === "awards" ? (
            <UxrPropsList props={filterProps(data.awards)} />
          ) : (
            <UxrGameGroups groups={filtered} />
          )}
        </UxrCardProviders>
      </UxrPageScroll>
    </View>
  );
}
