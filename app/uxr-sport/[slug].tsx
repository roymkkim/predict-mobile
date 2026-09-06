import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Redirect, useLocalSearchParams, useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { PageHeader } from "@/components/PageHeader";
import {
  SOCCER_COUNTRY_SECTIONS,
  UXR_SPORTS,
  type UxrSport,
  leagueGames,
  leagueProps,
  sportBySlug,
  sportLeagueSections,
  LeagueAvatar,
  UxrCardProviders,
  UxrGameGroups,
  UxrLeagueList,
  UxrLeagueSections,
  UxrPageScroll,
  UxrPropsList,
  UxrRow,
  UxrTabs,
} from "@/components/sim/UxrBrowse";
import { LeaguePickerSheet } from "@/components/sim/LeaguePickerSheet";
import { LiveDot } from "@/components/sim/Crest";
import { colors, filterChipBackground, FILTER_CHIP_INACTIVE_TEXT } from "@/lib/sim/colors";
import { useNavMode } from "@/lib/sim/navModeStore";
import { useSportPagesNavOrder } from "@/lib/sim/sportPagesNavOrderStore";
import { useSportsIa } from "@/lib/sim/sportsIaStore";
import { SportPage } from "@/components/mm-proposal/SportPage";
import { ComboTray } from "@/components/sim/ComboTray";
import { consumeSportLeagueSelection } from "@/lib/sim/sportLeagueSelectStore";
import { useComboMode } from "@/lib/sim/comboFlowStore";
import { comboListPaddingBottom, useComboSheetHeight } from "@/lib/sim/comboSheetHeightStore";
import { useBrowseLeagues } from "@/lib/sim/browseLeaguesStore";
import { useKalshiMvp } from "@/lib/sim/kalshiFlavorStore";
import { geist } from "@/lib/sim/geistFonts";

type Tab = "games" | "props" | "leagues";

function headerPickerPill(selected: boolean) {
  return {
    height: 40,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: filterChipBackground(selected),
  };
}

function sportPagesFilterPill(selected: boolean) {
  return {
    height: 40,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: filterChipBackground(selected),
  };
}

function SportPagesFilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        sportPagesFilterPill(active),
        pressed ? { opacity: 0.72 } : null,
      ]}
    >
      <Text
        style={{
          fontFamily: geist.medium,
          fontSize: 16,
          color: active ? colors.textPrimary : FILTER_CHIP_INACTIVE_TEXT,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SportPagesGamePropsTabs({
  active,
  onChange,
  bottomSpacing = 16,
}: {
  active: "games" | "props";
  onChange: (tab: "games" | "props") => void;
  bottomSpacing?: number;
}) {
  const tabs: { key: "games" | "props"; label: string }[] = [
    { key: "games", label: "Games" },
    { key: "props", label: "Props" },
  ];

  return (
    <View style={{ flexDirection: "row", gap: 32, paddingHorizontal: 16, height: 40, marginBottom: bottomSpacing }}>
      {tabs.map((tab) => {
        const selected = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(tab.key)}
            style={({ pressed }) => [
              {
                height: 40,
                alignItems: "center",
                justifyContent: "center",
                borderBottomWidth: 2,
                borderBottomColor: selected ? colors.textPrimary : "transparent",
              },
              pressed ? { opacity: 0.72 } : null,
            ]}
          >
            <Text
              style={{
                fontFamily: selected ? geist.semibold : geist.medium,
                fontSize: 16,
                color: selected ? colors.textPrimary : colors.textMuted,
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SportPagesGamePropsChips({
  active,
  onChange,
}: {
  active: "games" | "props";
  onChange: (tab: "games" | "props") => void;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 16 }}>
      <SportPagesFilterChip label="Games" active={active === "games"} onPress={() => onChange("games")} />
      <SportPagesFilterChip label="Props" active={active === "props"} onPress={() => onChange("props")} />
    </View>
  );
}

function SportPagesPrimaryTabs({
  sport,
  active,
  league,
  onLeagues,
  onLive,
  onLeague,
}: {
  sport: UxrSport;
  active: SportPagesTab;
  league: string;
  onLeagues: () => void;
  onLive: () => void;
  onLeague: (name: string) => void;
}) {
  const tabs = [
    { key: "leagues", label: "Leagues", onPress: onLeagues },
    { key: "live", label: "Games", onPress: onLive },
    ...sport.leagues.map((item) => ({
      key: item.name,
      label: item.name,
      onPress: () => onLeague(item.name),
    })),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 24, paddingLeft: 16, paddingRight: 16 }}
    >
      {tabs.map((item) => {
        const selected =
          item.key === "leagues"
            ? active === "leagues"
            : item.key === "live"
              ? active === "live"
              : active !== "leagues" && active !== "live" && league === item.key;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={item.onPress}
            style={{
              minHeight: 33,
              flexDirection: item.key === "live" ? "row" : "column",
              gap: item.key === "live" ? 6 : 0,
              alignItems: "center",
              justifyContent: "center",
              borderBottomWidth: 2,
              borderBottomColor: selected ? colors.textPrimary : "transparent",
            }}
          >
            {item.key === "live" && <LiveDot color={colors.green} />}
            <Text
              style={{
                fontFamily: selected ? geist.semibold : geist.medium,
                fontSize: 16,
                lineHeight: 24,
                color: selected ? colors.textPrimary : colors.textMuted,
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function SportPagesMoreArrow() {
  return (
    <Svg width={12} height={12} viewBox="0 0 16 16" fill="none">
      <Path d="M5.92486 14.4038L4.74153 13.2205L10.2249 7.73713L4.74153 2.2538L5.92486 1.07047L12.5915 7.73713L5.92486 14.4038Z" fill="#9B9B9B" />
    </Svg>
  );
}

function HeaderPickerSportScreen({ sport }: { sport: UxrSport }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const comboMode = useComboMode();
  const comboSheetH = useComboSheetHeight();
  const [tab, setTab] = React.useState<"games" | "props">("games");
  const [league, setLeague] = React.useState(sport.leagues[0]?.name ?? "All");
  const [leaguePickerOpen, setLeaguePickerOpen] = React.useState(false);
  const [sportPickerOpen, setSportPickerOpen] = React.useState(false);

  React.useEffect(() => {
    setLeague(sport.leagues[0]?.name ?? "All");
    setTab("games");
  }, [sport.slug]);

  const groups = React.useMemo(
    () => (league === "All" ? sport.games : leagueGames(league)),
    [league, sport],
  );
  const props = React.useMemo(
    () => (league === "All" ? sport.props : leagueProps(league)),
    [league, sport],
  );
  const totalMarkets = sport.leagues.reduce((sum, item) => sum + item.count, 0);
  const leaguePickerRows =
    sport.slug === "soccer"
      ? [{ name: "All", count: totalMarkets }]
      : [{ name: "All", count: totalMarkets }, ...sport.leagues];
  const sportPickerRows = UXR_SPORTS.map((item) => ({
    name: item.label,
    count: item.leagues.reduce((sum, entry) => sum + entry.count, 0),
  }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <PageHeader
        title={sport.label}
        titleAction={{
          onPress: () => setSportPickerOpen(true),
          accessibilityLabel: "Switch sport",
        }}
      />
      <UxrPageScroll contentBottomPadding={comboListPaddingBottom(comboMode, comboSheetH, insets.bottom, 48)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
        >
          {sport.leagues.slice(0, 2).map((item) => (
            <Pressable
              key={item.name}
              onPress={() => setLeague(item.name)}
              style={headerPickerPill(item.name === league)}
            >
              <Text
                style={{
                  fontFamily: geist.medium,
                  fontSize: 16,
                  color: item.name === league ? colors.textPrimary : FILTER_CHIP_INACTIVE_TEXT,
                }}
                numberOfLines={1}
              >
                {item.name}
              </Text>
            </Pressable>
          ))}
          <Pressable onPress={() => setLeaguePickerOpen(true)} style={headerPickerPill(false)}>
            <Text style={{ fontFamily: geist.medium, fontSize: 16, color: colors.textPrimary }}>More</Text>
          </Pressable>
        </ScrollView>

        <UxrTabs<"games" | "props">
          tabs={[
            { key: "games", label: "Games" },
            { key: "props", label: "Props" },
          ]}
          active={tab}
          onChange={setTab}
        />
        <UxrCardProviders>
          {tab === "games" ? <UxrGameGroups groups={groups} combo={comboMode} /> : <UxrPropsList props={props} combo={comboMode} />}
        </UxrCardProviders>
      </UxrPageScroll>

      <LeaguePickerSheet
        visible={leaguePickerOpen}
        title={sport.label}
        leagues={leaguePickerRows}
        sections={sport.slug === "soccer" ? SOCCER_COUNTRY_SECTIONS : undefined}
        selected={league}
        onSelect={setLeague}
        onClose={() => setLeaguePickerOpen(false)}
      />
      <LeaguePickerSheet
        visible={sportPickerOpen}
        title="Sports"
        leagues={sportPickerRows}
        selected={sport.label}
        onSelect={(name) => {
          const next = UXR_SPORTS.find((item) => item.label === name);
          if (next && next.slug !== sport.slug) {
            router.replace(`/uxr-sport/${next.slug}` as never);
          }
        }}
        onClose={() => setSportPickerOpen(false)}
      />
      {comboMode ? <ComboTray returnTo="/combination" dismissible /> : null}
    </View>
  );
}

type SportPagesTab = "live" | "games" | "props" | "leagues";

// Inline leagues list used by the "Tabs first" navigation's Leagues tab —
// mirrors the All-leagues page styling (16px rows, 12px vertical padding,
// muted inset dividers between sections) but selects in place.
function SportPagesLeaguesList({
  sport,
  onSelect,
}: {
  sport: UxrSport;
  onSelect: (name: string) => void;
}) {
  const sections = React.useMemo(() => {
    if (sport.slug !== "soccer") return [{ country: null as string | null, leagues: sport.leagues }];
    const seen = new Set<string>();
    return SOCCER_COUNTRY_SECTIONS.map((section) => ({
      country: section.country as string | null,
      leagues: section.leagues.filter((item) => {
        if (seen.has(item.name)) return false;
        seen.add(item.name);
        return true;
      }),
    })).filter((section) => section.leagues.length > 0);
  }, [sport]);

  return (
    <View>
      {sections.map((section, idx) => (
        <View key={section.country ?? "all"}>
          {idx > 0 && (
            <View style={{ marginHorizontal: 16, marginVertical: 12, height: 1, backgroundColor: "rgba(133,139,154,0.2)" }} />
          )}
          {section.country != null && (
            <Text
              style={{
                fontFamily: geist.medium,
                fontSize: 15,
                color: colors.textMuted,
                paddingHorizontal: 16,
                paddingVertical: 16,
              }}
            >
              {section.country}
            </Text>
          )}
          {section.leagues.map((item) => (
            <Pressable
              key={item.name}
              onPress={() => onSelect(item.name)}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}
            >
              <LeagueAvatar uri={item.avatar} />
              <Text style={{ fontFamily: geist.medium, fontSize: 16, color: colors.textPrimary }}>
                {item.name}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

function SportPagesScreen({ sport }: { sport: UxrSport }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const comboMode = useComboMode();
  const comboSheetH = useComboSheetHeight();
  const [tab, setTab] = React.useState<SportPagesTab>("live");
  const [league, setLeague] = React.useState(sport.leagues[0]?.name ?? "All");
  const [selectedExtraLeague, setSelectedExtraLeague] = React.useState<string | null>(null);
  const navOrder = useSportPagesNavOrder();
  const tabsFirst = navOrder === "tabsFirst";
  const compactLeagueRail = sport.slug === "soccer";
  const leagueRailRef = React.useRef<ScrollView>(null);
  const leagueChipOffsets = React.useRef<Record<string, number>>({});
  const pendingLeagueScroll = React.useRef<string | null>(null);

  React.useEffect(() => {
    setLeague(sport.leagues[0]?.name ?? "All");
    setTab("live");
    setSelectedExtraLeague(null);
  }, [sport.slug]);

  const featuredLeagues = React.useMemo(
    () => (compactLeagueRail ? sport.leagues.slice(0, 4) : sport.leagues),
    [compactLeagueRail, sport.leagues],
  );
  const chipLeagues = React.useMemo(() => {
    if (!selectedExtraLeague) return featuredLeagues;
    const selected =
      sport.leagues.find((item) => item.name === selectedExtraLeague) ?? {
        name: selectedExtraLeague,
        count: 0,
      };
    const rest = featuredLeagues.filter((item) => item.name !== selectedExtraLeague);
    return [selected, ...rest];
  }, [featuredLeagues, selectedExtraLeague, sport.leagues]);
  const moreCount = Math.max(0, sport.leagues.length - chipLeagues.length);

  const scrollToLeague = React.useCallback((name: string): boolean => {
    const offset = leagueChipOffsets.current[name];
    if (offset == null || leagueRailRef.current == null) return false;
    leagueRailRef.current.scrollTo({ x: Math.max(0, offset - 16), animated: true });
    return true;
  }, []);

  const queueLeagueScroll = React.useCallback(
    (name: string) => {
      pendingLeagueScroll.current = name;
      requestAnimationFrame(() => {
        if (pendingLeagueScroll.current === name && scrollToLeague(name)) {
          pendingLeagueScroll.current = null;
        }
      });
    },
    [scrollToLeague],
  );

  const groups = React.useMemo(
    () => (league === "All" ? sport.games : leagueGames(league)),
    [league, sport],
  );
  const props = React.useMemo(
    () => (league === "All" ? sport.props : leagueProps(league)),
    [league, sport],
  );
  // Live tab: break live games down by league ("MLB games", "NPB games", …) —
  // an undated "Today" heading was redundant since live cards are, by
  // definition, happening now. Sections follow the sport's league order.
  const liveGroups = React.useMemo(() => {
    const liveMatches = sport.games.flatMap((group) => group.matches.filter((match) => !!match.live));
    const leagueOrder = [
      ...sport.leagues.map((l) => l.name),
      ...liveMatches.map((m) => m.league).filter((lg) => !sport.leagues.some((l) => l.name === lg)),
    ];
    return leagueOrder
      .filter((lg, i, arr) => arr.indexOf(lg) === i)
      .map((lg) => ({ title: `${lg} games`, matches: liveMatches.filter((m) => m.league === lg) }))
      .filter((group) => group.matches.length > 0);
  }, [sport]);

  useFocusEffect(
    React.useCallback(() => {
      const name = consumeSportLeagueSelection(sport.slug);
      if (!name) return;
      setLeague(name);
      setSelectedExtraLeague(name);
      setTab("games");
      queueLeagueScroll(name);
    }, [queueLeagueScroll, sport.slug]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <PageHeader title={sport.label} />
      <UxrPageScroll contentGap={tab === "live" ? 32 : 16} contentBottomPadding={comboListPaddingBottom(comboMode, comboSheetH, insets.bottom, 48)}>
        <View style={{ gap: 12 }}>
          {tabsFirst && (
            <SportPagesPrimaryTabs
              sport={sport}
              active={tab}
              league={league}
              onLeagues={() => setTab("leagues")}
              onLive={() => setTab("live")}
              onLeague={(name) => {
                setLeague(name);
                setTab("games");
              }}
            />
          )}
          {tabsFirst ? (
            tab === "leagues" || tab === "live" ? null : (
              <SportPagesGamePropsChips
                active={tab === "props" ? "props" : "games"}
                onChange={setTab}
              />
            )
          ) : (
            <>
              <ScrollView
                ref={leagueRailRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
              >
                <Pressable
                  onPress={() => setTab("live")}
                  style={{
                    ...sportPagesFilterPill(tab === "live"),
                    flexDirection: "row",
                    gap: 6,
                  }}
                >
                  <LiveDot color={colors.green} />
                  <Text
                    style={{
                      fontFamily: geist.medium,
                      fontSize: 16,
                      color: tab === "live" ? "#FFFFFF" : "#9B9B9B",
                    }}
                  >
                    Games
                  </Text>
                </Pressable>
                {chipLeagues.map((item) => (
                  <Pressable
                    key={item.name}
                    onPress={() => {
                      setLeague(item.name);
                      setTab("games");
                    }}
                    onLayout={({ nativeEvent }) => {
                      leagueChipOffsets.current[item.name] = nativeEvent.layout.x;
                      if (pendingLeagueScroll.current === item.name) {
                        requestAnimationFrame(() => {
                          if (pendingLeagueScroll.current === item.name && scrollToLeague(item.name)) {
                            pendingLeagueScroll.current = null;
                          }
                        });
                      }
                    }}
                    style={sportPagesFilterPill(tab !== "live" && item.name === league)}
                  >
                    <Text
                      style={{
                        fontFamily: geist.medium,
                        fontSize: 16,
                        color: tab !== "live" && item.name === league ? colors.textPrimary : FILTER_CHIP_INACTIVE_TEXT,
                      }}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                  </Pressable>
                ))}
                {compactLeagueRail && (
                  <Pressable
                    onPress={() => router.push(`/uxr-leagues?slug=${encodeURIComponent(sport.slug)}` as never)}
                    style={[sportPagesFilterPill(false), { flexDirection: "row", gap: 4 }]}
                  >
                    <Text style={{ fontFamily: geist.medium, fontSize: 16, color: "#9B9B9B" }}>
                      +{moreCount} more
                    </Text>
                    <SportPagesMoreArrow />
                  </Pressable>
                )}
              </ScrollView>
              {tab === "live" ? null : (
                <SportPagesGamePropsTabs
                  active={tab === "props" ? "props" : "games"}
                  onChange={setTab}
                  bottomSpacing={16}
                />
              )}
            </>
          )}
        </View>
        <UxrCardProviders>
          {tab === "live" ? (
            <UxrGameGroups groups={liveGroups} combo={comboMode} />
          ) : tab === "leagues" ? (
            <SportPagesLeaguesList
              sport={sport}
              onSelect={(name) => {
                setLeague(name);
                setSelectedExtraLeague(featuredLeagues.some((item) => item.name === name) ? null : name);
                queueLeagueScroll(name);
                setTab("games");
              }}
            />
          ) : tab === "games" ? (
            <UxrGameGroups groups={groups} combo={comboMode} />
          ) : (
            <UxrPropsList props={props} combo={comboMode} />
          )}
        </UxrCardProviders>
      </UxrPageScroll>
      {comboMode ? <ComboTray returnTo="/combination" dismissible /> : null}
    </View>
  );
}

// UXR-only sport page: Games / Props / Leagues tabs. The Leagues tab carries
// the browse weight (per the UXR direction) — each league row drills into
// /uxr-league/[id].
export default function UxrSportScreen() {
  const { slug, league: leagueParam } = useLocalSearchParams<{ slug: string; league?: string }>();
  const navMode = useNavMode();
  const sportsIa = useSportsIa();
  const browseLeagues = useBrowseLeagues();
  const kalshiMvp = useKalshiMvp();
  const comboMode = useComboMode();
  const comboSheetH = useComboSheetHeight();
  const insets = useSafeAreaInsets();
  const sport = sportBySlug(typeof slug === "string" ? slug : "");
  const [tab, setTab] = React.useState<Tab>("games");
  const initialLeague = typeof leagueParam === "string" ? leagueParam : undefined;

  if (!sport) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <PageHeader title="Sport" />
      </View>
    );
  }

  if (sportsIa === "polymarket-sport-pages") {
    if (browseLeagues && !initialLeague && !(kalshiMvp && sport.slug === "football")) {
      return <Redirect href={"/uxr-categories?sports=1" as never} />;
    }
    return <SportPage sport={sport} initialLeague={initialLeague} />;
  }

  if (navMode === "picker") {
    return <HeaderPickerSportScreen sport={sport} />;
  }

  const title = sport.slug === "motorsports" ? "Nascar" : sport.label;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <PageHeader title={title} />
      <UxrPageScroll contentBottomPadding={comboListPaddingBottom(comboMode, comboSheetH, insets.bottom, 48)}>
        <UxrTabs<Tab>
          tabs={[
            { key: "games", label: "Games" },
            { key: "props", label: "Props" },
            { key: "leagues", label: "Leagues" },
          ]}
          active={tab}
          onChange={setTab}
        />
        {tab === "games" && (
          <UxrCardProviders>
            <UxrLeagueSections sections={sportLeagueSections(sport)} combo={comboMode} />
          </UxrCardProviders>
        )}
        {tab === "props" && (
          <UxrCardProviders>
            <UxrPropsList props={sport.props} combo={comboMode} />
          </UxrCardProviders>
        )}
        {tab === "leagues" && <UxrLeagueList leagues={sport.leagues} />}
      </UxrPageScroll>
      {comboMode ? <ComboTray returnTo="/combination" dismissible /> : null}
    </View>
  );
}
