import { useMemo, useState, type ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { colors } from "@/lib/sim/colors";
import { matchDetailHref } from "@/lib/sim/marketRoutes";
import type { Match } from "@/lib/sim/types";
import { UXR_MATERIAL_ICONS } from "@/lib/sim/uxrIcons";
import { UXR_SPORTS, leagueGames, UxrCardProviders, UxrGameGroups, UxrPageScroll } from "@/components/sim/UxrBrowse";
import { FilterButton } from "@/components/sim/FilterButton";
import { MatchCard } from "@/lib/sim/topicMarkets";
import { usePolymarketMetaMaskSportsNav } from "@/lib/sim/polymarketMetaMaskSportsNavStore";
import { geist } from "@/lib/sim/geistFonts";

const SPORTS_HEADER_TO_CONTENT_GAP = 32;

function MetaMaskContent({ embedded, children }: { embedded?: boolean; children: ReactNode }) {
  return embedded ? (
    <ScrollView
      style={{ flex: 1, minHeight: 0 }}
      contentContainerStyle={{ paddingTop: 16, paddingBottom: 48, gap: 0 }}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      {children}
    </ScrollView>
  ) : (
    <UxrPageScroll contentGap={0}>{children}</UxrPageScroll>
  );
}

type Filter = "games" | "leagues" | `league:${string}`;

function FilterRow({
  filters,
  active,
  onChange,
}: {
  filters: { key: Filter; label: string }[];
  active: Filter;
  onChange: (filter: Filter) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={{ flexDirection: "row", gap: 8, paddingHorizontal: 16 }}
    >
      {filters.map((filter) => (
        <FilterButton
          key={filter.key}
          label={filter.label}
          active={filter.key === active}
          onPress={() => onChange(filter.key)}
        />
      ))}
    </ScrollView>
  );
}

function InlineLeaguesList({
  leagues,
  onSelect,
}: {
  leagues: { name: string; count: number }[];
  onSelect: (name: string) => void;
}) {
  return (
    <View style={{ gap: 16, paddingHorizontal: 16 }}>
      {leagues.map((league) => (
        <Pressable
          key={league.name}
          onPress={() => onSelect(league.name)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 12,
          }}
        >
          <Text style={{ fontFamily: geist.medium, fontSize: 16, color: colors.textPrimary }}>
            {league.name}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ fontFamily: geist.regular, fontSize: 14, color: colors.textMuted }}>
              {league.count}
            </Text>
            <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function SportCarousel({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (slug: string) => void;
}) {
  const navigation = usePolymarketMetaMaskSportsNav();
  const tileMode = navigation === "tiles";

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexDirection: "row",
          gap: tileMode ? 4 : 8,
          paddingLeft: 16,
          paddingRight: 16,
        }}
      >
        <FilterButton
          variant={tileMode ? "tile" : "tab"}
          label="Live"
          active={selected === "live"}
          icon={
            <MaterialIcons
              name="sensors"
              size={tileMode ? 24 : 16}
              color={
                selected === "live"
                  ? colors.textPrimary
                  : tileMode
                    ? colors.textMuted
                    : colors.textAlternative
              }
            />
          }
          onPress={() => onSelect("live")}
        />
        {UXR_SPORTS.map((sport) => {
          const active = sport.slug === selected;
          return (
            <FilterButton
              key={sport.slug}
              variant={tileMode ? "tile" : "tab"}
              label={sport.label}
              active={active}
              icon={
                <MaterialIcons
                  name={UXR_MATERIAL_ICONS[sport.slug]}
                  size={tileMode ? 24 : 16}
                  color={
                    active
                      ? colors.textPrimary
                      : tileMode
                        ? colors.textMuted
                        : colors.textAlternative
                  }
                />
              }
              onPress={() => onSelect(sport.slug)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

export function PolymarketMetaMaskSports({
  initialSport,
  embedded,
}: {
  initialSport?: string;
  embedded?: boolean;
}) {
  const router = useRouter();
  const navigation = usePolymarketMetaMaskSportsNav();
  const tileMode = navigation === "tiles";
  const validInitial = initialSport && UXR_SPORTS.some((sport) => sport.slug === initialSport) ? initialSport : "live";
  const [selected, setSelected] = useState(validInitial);
  const [activeFilter, setActiveFilter] = useState<Filter>("games");

  const sport = selected === "live" ? undefined : UXR_SPORTS.find((item) => item.slug === selected);
  const liveSections = useMemo(
    () => {
      const byLeague = new Map<string, { league: string; matches: Match[] }>();
      for (const item of UXR_SPORTS) {
        for (const group of item.games) {
          for (const match of group.matches) {
            if (!match.live) continue;
            const section = byLeague.get(match.league) ?? { league: match.league, matches: [] };
            if (section.matches.length < 3) section.matches.push(match);
            byLeague.set(match.league, section);
          }
        }
      }
      return Array.from(byLeague.values());
    },
    [],
  );
  const filters = sport
    ? [
        { key: "games" as const, label: "Games" },
        { key: "leagues" as const, label: "Leagues" },
        ...sport.leagues.map((league) => ({ key: `league:${league.name}` as const, label: league.name })),
      ]
    : [];
  return (
    <>
      <MetaMaskContent embedded={embedded}>
        <View style={{ gap: 12, paddingBottom: SPORTS_HEADER_TO_CONTENT_GAP }}>
          <SportCarousel
            selected={selected}
            onSelect={(slug) => { setSelected(slug); setActiveFilter("games"); }}
          />
          {tileMode ? (
            <Text
              style={{
                fontFamily: geist.semibold,
                fontSize: 24,
                lineHeight: 32,
                color: colors.textPrimary,
                paddingHorizontal: 16,
                paddingTop: 16,
              }}
            >
              {sport?.label ?? "Live"}
            </Text>
          ) : null}
          {selected !== "live" ? (
            <FilterRow
              filters={filters}
              active={activeFilter}
              onChange={setActiveFilter}
            />
          ) : null}
        </View>
        <UxrCardProviders>
          {activeFilter === "leagues" ? (
            <InlineLeaguesList
              leagues={sport?.leagues ?? []}
              onSelect={(name) => {
                const parent = UXR_SPORTS.find((item) => item.leagues.some((league) => league.name === name));
                if (parent) {
                  setSelected(parent.slug);
                  setActiveFilter(`league:${name}`);
                }
              }}
            />
          ) : selected === "live" ? (
            <View style={{ gap: 24 }}>
              {liveSections.map((section) => (
                <View key={section.league} style={{ gap: 12 }}>
                  <Pressable
                    onPress={() => {
                      const parent = UXR_SPORTS.find((item) =>
                        item.leagues.some((league) => league.name === section.league),
                      );
                      if (parent) {
                        setSelected(parent.slug);
                        setActiveFilter(`league:${section.league}`);
                      }
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingHorizontal: 16,
                    }}
                  >
                    <Text style={{ fontFamily: geist.semibold, fontSize: 18, lineHeight: 24, color: colors.textPrimary }}>
                      {section.league}
                    </Text>
                    <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
                  </Pressable>
                    <View style={{ gap: 12, paddingHorizontal: 16 }}>
                    {section.matches.map((match, index) => (
                      <Pressable key={`${section.league}-${index}`} onPress={() => router.push(matchDetailHref(match) as never)}>
                        <MatchCard m={match} layout="global" />
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {activeFilter.startsWith("league:") ? (
                <UxrGameGroups groups={leagueGames(activeFilter.slice(7))} horizontalPadding={16} />
              ) : (
                <UxrGameGroups groups={sport?.games ?? []} horizontalPadding={16} />
              )}
            </View>
          )}
        </UxrCardProviders>
      </MetaMaskContent>
    </>
  );
}