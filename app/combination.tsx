import React, { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ContentVariant,
  FilterButton,
  FilterButtonGroup,
  FilterButtonSize,
  FilterButtonVariant,
  FontWeight,
  HeaderStandard,
  Icon,
  IconColor,
  IconName,
  IconSize,
  ListItem,
  Text as HeaderTitle,
  TextColor,
  TextVariant,
} from "@metamask/design-system-react-native";
import { HeaderComboMark } from "@/components/sim/ComboMark";
import { colors, ON_SURFACE_BUTTON_BG } from "@/lib/sim/colors";
import { screenTopInset } from "@/lib/sim/layout";
import { matchToComboGame, type ComboGame } from "@/lib/sim/comboData";
import { ComboTray } from "@/components/sim/ComboTray";
import { useCombinationsVisible } from "@/lib/sim/combinationsStore";
import { enterComboFlow, exitComboFlow, withComboQuery } from "@/lib/sim/comboFlowStore";
import { comboOutcomeOn } from "@/lib/sim/comboPickEdit";
import { clearComboPicks, toggleComboPick, useComboPicks } from "@/lib/sim/comboPicksStore";
import { comboSportHref } from "@/lib/sim/comboNav";
import {
  comboNavChipsForVenue,
  comboSportTabsForVenue,
  isKalshiLeague,
  popularComboLeaguesForVenue,
  useKalshiVenue,
} from "@/lib/sim/kalshiMarkets";
import { useComboPageIa } from "@/lib/sim/comboPageIaStore";
import { useComboTemplates } from "@/lib/sim/comboTemplatesStore";
import {
  gamesForSelectedLeague,
  LeagueAvatar,
  leagueGames,
  leagueProps,
  SOCCER_COUNTRY_SECTIONS,
  sportBySlug,
} from "@/components/sim/UxrBrowse";
import { ComboGameCard, ComboPropCard } from "@/components/sim/ComboGameCard";
import { ComboTemplatesFeed } from "@/components/sim/CombinationsSection";
import { matchDetailHref } from "@/lib/sim/marketRoutes";
import { binary, type Binary } from "@/lib/sim/topicMarkets";
import { SectionHeader } from "@/components/sim/FeedChrome";
import { TabsBar } from "@/components/mm-proposal/tabs";
import { FILTER_CHIP_STYLE } from "@/components/mm-proposal/SportsNavChrome";
import { geist } from "@/lib/sim/geistFonts";
import type { Match } from "@/lib/sim/types";
import { LiveTickProvider } from "@/lib/sim/LiveTickContext";
import { useDisplayFont, useOswaldDataSet } from "@/lib/sim/typefaceStore";

const FEATURED_LEAGUE_COUNT = 4;

function clampPct(n: number): number {
  return Math.max(8, Math.min(92, Math.round(n)));
}

function comboPropsFor(league: string, matches: Match[]): Binary[] {
  const listed = leagueProps(league).map((prop) => ({
    ...prop,
    match: { ...prop.match, league: prop.match.league === "World" ? league : prop.match.league },
  }));
  const derived = matches.slice(0, 3).flatMap((match) => {
    const [home, away] = match.teams;
    const pctHome = parseFloat(home.pct) || 50;
    const cover = clampPct(pctHome - 18);
    const early = clampPct(100 - pctHome + 8);
    return [
      binary({
        title: `${home.name} wins by 5+?`,
        yes: cover,
        no: 100 - cover,
        colors: [home.color, "#71717a"],
        vol: "$42K Vol.",
        date: match.date,
      }),
      binary({
        title: `${away.name} takes an early lead?`,
        yes: early,
        no: 100 - early,
        colors: [away.color, "#71717a"],
        vol: "$27K Vol.",
        date: match.date,
      }),
    ].map((prop) => ({ ...prop, match: { ...prop.match, league } }));
  });
  return [...listed, ...derived];
}

function rowsForLeague(league: string): { game: ComboGame; href: string }[] {
  return leagueGames(league)
    .flatMap((g) => g.matches)
    .map((m, i) => ({ game: matchToComboGame(m, i), href: withComboQuery(matchDetailHref(m)) }));
}

function ComboLeaguesSheet({
  visible,
  sportSlug,
  leagues,
  onSelect,
  onClose,
}: {
  visible: boolean;
  sportSlug: string;
  leagues: { name: string; count: number; avatar?: string }[];
  onSelect: (name: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const soccer = sportSlug === "soccer";
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            maxHeight: "78%",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            backgroundColor: colors.bg,
            paddingBottom: insets.bottom + 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingTop: 8 }}>
            <Pressable onPress={onClose} hitSlop={10} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
              <Icon name={IconName.Close} size={IconSize.Md} color={IconColor.IconDefault} />
            </Pressable>
            <HeaderTitle variant={TextVariant.HeadingSm} fontWeight={FontWeight.Bold} twClassName="flex-1 text-center pr-10">
              Leagues
            </HeaderTitle>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {soccer
              ? SOCCER_COUNTRY_SECTIONS.map((section) => (
                  <View key={section.country}>
                    <HeaderTitle
                      variant={TextVariant.BodySm}
                      fontWeight={FontWeight.Medium}
                      color={TextColor.TextAlternative}
                      twClassName="px-4 pt-4 pb-1"
                    >
                      {section.country}
                    </HeaderTitle>
                    {section.leagues.map((league) => (
                      <ListItem
                        key={league.name}
                        isInteractive
                        variant={ContentVariant.OneLine}
                        title={league.name}
                        accessoryGap={3}
                        startAccessory={<LeagueAvatar uri={league.avatar} />}
                        onPress={() => onSelect(league.name)}
                      />
                    ))}
                  </View>
                ))
              : leagues.map((league) => (
                  <ListItem
                    key={league.name}
                    isInteractive
                    variant={ContentVariant.OneLine}
                    title={league.name}
                    accessoryGap={3}
                    startAccessory={<LeagueAvatar uri={league.avatar} />}
                    onPress={() => onSelect(league.name)}
                  />
                ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ComboTabsBody({
  selected,
}: {
  selected: (id: string) => boolean;
}) {
  const router = useRouter();
  const templatesOn = useComboTemplates();
  const kalshi = useKalshiVenue();
  const sportTabs = comboSportTabsForVenue(kalshi);
  const params = useLocalSearchParams<{ tab?: string; template?: string }>();
  const [tabIndex, setTabIndex] = useState(0);
  const [pinnedLeague, setPinnedLeague] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  React.useEffect(() => {
    if (templatesOn && (params.tab === "templates" || params.template)) setTabIndex(0);
  }, [params.tab, params.template, templatesOn]);

  const tabs = [
    ...(templatesOn ? [{ key: "templates", label: "Picks" }] : []),
    ...sportTabs.map((item) => ({ key: item.label, label: item.label })),
  ];
  const templatesTab = templatesOn && tabIndex === 0;
  const sportTabIndex = templatesOn ? Math.max(0, tabIndex - 1) : tabIndex;
  const chip = sportTabs[Math.min(sportTabIndex, Math.max(0, sportTabs.length - 1))];
  const sport = sportBySlug(chip?.sportSlug ?? "");
  const leagues = (sport?.leagues ?? []).filter((item) => !kalshi || isKalshiLeague(item.name));
  const featured = leagues.slice(0, FEATURED_LEAGUE_COUNT);
  const chipLeagues = useMemo(() => {
    if (!pinnedLeague || featured.some((item) => item.name === pinnedLeague)) {
      return featured;
    }
    const extra = leagues.find((item) => item.name === pinnedLeague);
    return extra ? [...featured, extra] : featured;
  }, [featured, leagues, pinnedLeague]);
  const moreCount = Math.max(0, leagues.length - chipLeagues.length);
  const league = pinnedLeague ?? chip?.league ?? chipLeagues[0]?.name ?? leagues[0]?.name;
  const matches = useMemo(() => {
    if (!sport || !league) return [];
    return gamesForSelectedLeague(sport, league)
      .flatMap((group) => group.matches)
      .filter((m) => !kalshi || isKalshiLeague(m.league));
  }, [kalshi, league, sport]);
  const rows = useMemo(
    () => matches.map((m, i) => ({ game: matchToComboGame(m, i), href: withComboQuery(matchDetailHref(m)) })),
    [matches],
  );
  const props = useMemo(() => (league ? comboPropsFor(league, matches) : []), [league, matches]);

  const selectTab = (index: number) => {
    setTabIndex(index);
    if (templatesOn && index === 0) return;
    const nextSport = templatesOn ? index - 1 : index;
    setPinnedLeague(sportTabs[nextSport]?.league ?? null);
  };

  const selectLeague = (name: string) => {
    setPinnedLeague(name);
    setMoreOpen(false);
  };

  return (
    <>
      <TabsBar
        scrollable
        tabs={tabs}
        activeIndex={tabIndex}
        onTabPress={selectTab}
      />
      {templatesTab ? (
        <ComboTemplatesFeed />
      ) : (
        <>
      {!kalshi && chipLeagues.length > 0 ? (
        <FilterButtonGroup
          value={league ?? ""}
          variant={FilterButtonVariant.Secondary}
          onChange={(value) => {
            if (value === "more") {
              setMoreOpen(true);
              return;
            }
            selectLeague(value);
          }}
          style={{ flexGrow: 0 }}
          twClassName="px-4 pt-4 pb-4"
        >
          {chipLeagues.map((item) => (
            <FilterButton key={item.name} value={item.name} size={FilterButtonSize.Md} style={FILTER_CHIP_STYLE}>
              {item.name === "NCAA Football" ? "NCAAF" : item.name}
            </FilterButton>
          ))}
          {moreCount > 0 ? (
            <FilterButton value="more" size={FilterButtonSize.Md} endIconName={IconName.ArrowRight} style={FILTER_CHIP_STYLE}>
              {`+${moreCount} more`}
            </FilterButton>
          ) : null}
        </FilterButtonGroup>
      ) : null}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 220, gap: 12, paddingHorizontal: 16 }}>
        {rows.length === 0 && props.length === 0 ? (
          <Text style={{ fontFamily: geist.regular, fontSize: 14, color: colors.textMuted, paddingTop: 24 }}>
            No games in this league yet.
          </Text>
        ) : (
          <>
            {rows.map(({ game, href }) => (
              <ComboGameCard
                key={game.id}
                game={game}
                category={{ label: sport?.label ?? chip?.label ?? "", emoji: sport?.emoji }}
                selected={selected}
                onToggle={toggleComboPick}
                onOpen={() => {
                  enterComboFlow();
                  router.push(href as never);
                }}
              />
            ))}
            {props.map((prop) => (
              <ComboPropCard
                key={prop.title}
                prop={prop}
                category={{ label: sport?.label ?? chip?.label ?? "", emoji: sport?.emoji }}
                selected={selected}
                onToggle={toggleComboPick}
              />
            ))}
          </>
        )}
      </ScrollView>

      {sport ? (
        <ComboLeaguesSheet
          visible={moreOpen}
          sportSlug={sport.slug}
          leagues={leagues}
          onSelect={selectLeague}
          onClose={() => setMoreOpen(false)}
        />
      ) : null}
        </>
      )}
    </>
  );
}

function ComboBrowseBody({
  selected,
}: {
  selected: (id: string) => boolean;
}) {
  const router = useRouter();
  const templatesOn = useComboTemplates();
  const kalshi = useKalshiVenue();
  const navChips = comboNavChipsForVenue(kalshi);
  const popularLeagues = popularComboLeaguesForVenue(kalshi);
  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 16 }}
      >
        {navChips.map((chip) => (
          <Pressable
            key={chip.label}
            onPress={() => {
              enterComboFlow();
              if (chip.sportSlug && chip.league) {
                router.push(comboSportHref(chip.sportSlug, chip.league) as never);
                return;
              }
              router.push(chip.href as never);
            }}
            style={{
              height: 40,
              borderRadius: 12,
              paddingHorizontal: 14,
              backgroundColor: ON_SURFACE_BUTTON_BG,
              justifyContent: "center",
            }}
          >
            <Text style={{ fontFamily: geist.medium, fontSize: 16, color: colors.textPrimary }}>{chip.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 220, gap: 32 }}>
        {templatesOn ? (
          <View>
            <SectionHeader title="Picks" />
            <View style={{ paddingHorizontal: 16 }}>
              <ComboTemplatesFeed embedded />
            </View>
          </View>
        ) : null}
        {popularLeagues.map((section) => {
          const rows = rowsForLeague(section.league);
          const sport = sportBySlug(section.sportSlug);
          if (rows.length === 0) return null;
          return (
            <View key={section.league}>
              <SectionHeader
                title={section.title}
                onPress={() => {
                  enterComboFlow();
                  router.push(comboSportHref(section.sportSlug, section.league) as never);
                }}
              />
              <View style={{ paddingHorizontal: 16, gap: 12 }}>
                {rows.map(({ game, href }) => (
                  <ComboGameCard
                    key={game.id}
                    game={game}
                    category={{ label: sport?.label ?? section.title, emoji: sport?.emoji }}
                    selected={selected}
                    onToggle={toggleComboPick}
                    onOpen={() => {
                      enterComboFlow();
                      router.push(href as never);
                    }}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </>
  );
}

export default function CombinationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const enabled = useCombinationsVisible();
  const pageIa = useComboPageIa();
  const picks = useComboPicks();
  const selected = (id: string) => comboOutcomeOn(picks, id);
  const displayFont = useDisplayFont();
  const oswald = useOswaldDataSet();

  React.useEffect(() => {
    enterComboFlow();
  }, []);

  if (!enabled) {
    return <Redirect href={"/" as never} />;
  }

  return (
    <LiveTickProvider>
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: screenTopInset(insets.top) }}>
      <HeaderStandard
        onBack={() => {
          exitComboFlow();
          clearComboPicks();
          router.back();
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <HeaderComboMark />
          <HeaderTitle
            {...oswald}
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Bold}
            numberOfLines={1}
            style={{ fontFamily: displayFont }}
          >
            Combos
          </HeaderTitle>
        </View>
      </HeaderStandard>

      {pageIa === "tabs" ? <ComboTabsBody selected={selected} /> : <ComboBrowseBody selected={selected} />}

      <ComboTray returnTo="/combination" />
    </View>
    </LiveTickProvider>
  );
}
