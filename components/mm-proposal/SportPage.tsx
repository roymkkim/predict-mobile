import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { ScrollView, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Box,
  ContentVariant,
  FilterButton,
  FilterButtonGroup,
  FilterButtonSize,
  FilterButtonVariant,
  FontWeight,
  HeaderStandard,
  IconName,
  ListItem,
  Text,
  TextColor,
  TextFieldSearch,
  TextVariant,
} from "@metamask/design-system-react-native";

import {
  gamesForSelectedLeague,
  LeagueAvatar,
  leagueProps,
  SOCCER_COUNTRY_SECTIONS,
  UxrCardProviders,
  UxrGameGroups,
  UxrPropsList,
  type GameGroup,
  type UxrSport,
} from "@/components/sim/UxrBrowse";
import { TabsBar } from "@/components/mm-proposal/tabs";
import { SportsNavChrome, FILTER_CHIP_STYLE, type SportMarketFilter } from "@/components/mm-proposal/SportsNavChrome";
import { useMmProposalControls } from "@/lib/sim/mmProposalStore";
import { useSportsNavExperiment } from "@/lib/sim/sportsNavExperimentStore";
import { consumeSportLeagueSelection } from "@/lib/sim/sportLeagueSelectStore";
import { useKalshiMvp } from "@/lib/sim/kalshiFlavorStore";
import { useBrowseLeagues } from "@/lib/sim/browseLeaguesStore";
import { colors } from "@/lib/sim/colors";
import { PAGE_BODY_TOP_PADDING, screenTopInset } from "@/lib/sim/layout";
import { LiveDot } from "@/components/sim/Crest";
import { HeaderComboMark } from "@/components/sim/ComboMark";
import { ComboTray } from "@/components/sim/ComboTray";
import { StickyPageChrome } from "@/components/sim/StickyDetailScroll";
import { useComboMode } from "@/lib/sim/comboFlowStore";
import { comboListPaddingBottom, useComboSheetHeight } from "@/lib/sim/comboSheetHeightStore";
import { useDisplayFont, useOswaldDataSet } from "@/lib/sim/typefaceStore";

const CONTENT_TABS = [
  { key: "games", label: "Games" },
  { key: "props", label: "Props" },
];

type ContentTab = "games" | "props";

function canonicalLeagueName(name?: string): string | undefined {
  if (!name) return undefined;
  return name === "NCAAF" ? "NCAA Football" : name;
}

function leagueHeaderTitle(name: string): string {
  return name === "NCAA Football" ? "NCAAF" : name;
}

function resolveRequestedLeague(sport: UxrSport, initialLeague?: string): string | undefined {
  const requested = canonicalLeagueName(initialLeague);
  if (requested && sport.leagues.some((item) => item.name === requested)) return requested;
  return undefined;
}

function resolveStartLeague(sport: UxrSport, initialLeague?: string): string {
  return resolveRequestedLeague(sport, initialLeague) ?? sport.leagues[0]?.name ?? "All";
}

function LiveChipDot() {
  return (
    <View style={{ marginRight: 2 }}>
      <LiveDot color={colors.green} />
    </View>
  );
}

export function SportPageHeader({
  title,
  onBack,
  endButtonIconProps,
}: {
  title: string;
  onBack: () => void;
  endButtonIconProps?: ComponentProps<typeof HeaderStandard>["endButtonIconProps"];
}) {
  const insets = useSafeAreaInsets();
  const topInset = screenTopInset(insets.top);
  const comboMode = useComboMode();
  const displayFont = useDisplayFont();
  const oswald = useOswaldDataSet();
  return (
    <View style={{ paddingTop: topInset, backgroundColor: colors.bg }}>
      <HeaderStandard
        title={comboMode ? undefined : title}
        titleProps={{ ...oswald, style: { fontFamily: displayFont } }}
        onBack={onBack}
        endButtonIconProps={endButtonIconProps}
      >
        {comboMode ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <HeaderComboMark />
            <Text
              {...oswald}
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Bold}
              numberOfLines={1}
              style={{ fontFamily: displayFont }}
            >
              {title}
            </Text>
          </View>
        ) : undefined}
      </HeaderStandard>
    </View>
  );
}

export function LeagueDirectory({
  onSelect,
  onBack,
}: {
  onSelect: (name: string) => void;
  onBack: () => void;
}) {
  return (
    <Box twClassName="flex-1 bg-default">
      <SportPageHeader title="Leagues" onBack={onBack} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: PAGE_BODY_TOP_PADDING }}
      >
        {SOCCER_COUNTRY_SECTIONS.map((section) => (
          <Box key={section.country ?? "trending"}>
            {section.country ? (
              <Text
                variant={TextVariant.BodySm}
                fontWeight={FontWeight.Medium}
                color={TextColor.TextAlternative}
                twClassName="px-4 pt-4 pb-1"
              >
                {section.country}
              </Text>
            ) : null}
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
          </Box>
        ))}
      </ScrollView>
    </Box>
  );
}

export function SportPage({ sport, initialLeague }: { sport: UxrSport; initialLeague?: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const comboMode = useComboMode();
  const comboSheetH = useComboSheetHeight();
  const { showSearch, showLiveChip } = useMmProposalControls();
  const { enabled: navEnabled, variant: navVariant } = useSportsNavExperiment();
  const kalshiMvp = useKalshiMvp();
  const browseLeagues = useBrowseLeagues();
  const kalshiLeaguePage = kalshiMvp && sport.slug === "football";
  const leagueOnlyPage = kalshiLeaguePage || (browseLeagues && Boolean(initialLeague));
  const compactLeagueRail = sport.slug === "soccer";
  const startLeague = resolveStartLeague(sport, initialLeague);
  const startOnGames = !resolveRequestedLeague(sport, initialLeague);

  const [tab, setTab] = useState<ContentTab>("games");
  const [marketFilter, setMarketFilter] = useState<SportMarketFilter>("games");
  const [league, setLeague] = useState(startLeague);
  const [pinnedLeague, setPinnedLeague] = useState(startOnGames ? null : startLeague);
  const [liveSelected, setLiveSelected] = useState(startOnGames);
  const [leagueFocused, setLeagueFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const prevNavEnabled = useRef(navEnabled);

  useEffect(() => {
    const fromParam = resolveStartLeague(sport, initialLeague);
    const onGames = !resolveRequestedLeague(sport, initialLeague);
    setLeague(fromParam);
    setPinnedLeague(onGames ? null : fromParam);
    setTab("games");
    setMarketFilter("games");
    setLiveSelected(onGames);
    setLeagueFocused(false);
    setQuery("");
    setSearchOpen(false);
  }, [sport.slug, initialLeague, kalshiLeaguePage, leagueOnlyPage, navEnabled]);

  useEffect(() => {
    const wasEnabled = prevNavEnabled.current;
    prevNavEnabled.current = navEnabled;
    if (leagueOnlyPage || !navEnabled) {
      setLeagueFocused(false);
      return;
    }
    // Turning the experiment on while a league chip is already selected
    // (the usual Soccer landing) collapses Games/Props into the compact row
    // instead of leaving the stacked carousel + tabs.
    if (!wasEnabled) {
      setLeagueFocused((focused) => focused || !liveSelected);
    }
    // liveSelected is read only on the rising edge; the browse/close paths
    // set it explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navEnabled, leagueOnlyPage]);

  useFocusEffect(
    useCallback(() => {
      const name = consumeSportLeagueSelection(sport.slug);
      if (!name) return;
      setLeague(name);
      setPinnedLeague(name);
      setLiveSelected(false);
      if (navEnabled && !leagueOnlyPage) setLeagueFocused(true);
    }, [sport.slug, navEnabled, leagueOnlyPage]),
  );

  const featuredLeagues = useMemo(
    () => (compactLeagueRail ? sport.leagues.slice(0, 4) : sport.leagues),
    [compactLeagueRail, sport.leagues],
  );
  const chipLeagues = useMemo(() => {
    if (!compactLeagueRail || !pinnedLeague) return featuredLeagues;
    const selected =
      sport.leagues.find((item) => item.name === pinnedLeague) ?? {
        name: pinnedLeague,
        count: 0,
      };
    const rest = featuredLeagues.filter((item) => item.name !== pinnedLeague);
    return [selected, ...rest];
  }, [compactLeagueRail, featuredLeagues, pinnedLeague, sport.leagues]);

  const groups = useMemo<GameGroup[]>(
    () => gamesForSelectedLeague(sport, league),
    [league, sport],
  );
  const props = useMemo(
    () => (league === "All" ? sport.props : leagueProps(league)),
    [league, sport],
  );
  const liveGroups = useMemo(() => {
    const liveMatches = sport.games.flatMap((group) =>
      group.matches.filter((match) => Boolean(match.live)),
    );
    const leagueOrder = [
      ...sport.leagues.map((item) => item.name),
      ...liveMatches.map((match) => match.league),
    ].filter((name, index, all) => all.indexOf(name) === index);
    return leagueOrder
      .map((name) => ({
        title: name,
        matches: liveMatches.filter((match) => match.league === name),
      }))
      .filter((group) => group.matches.length > 0);
  }, [sport]);

  const q = query.trim().toLowerCase();
  const filterGroups = useCallback(
    (source: GameGroup[]) => {
      if (!q) return source;
      return source
        .map((group) => ({
          ...group,
          matches: group.matches.filter((match) =>
            `${match.teams[0].name} ${match.teams[1].name} ${match.league}`
              .toLowerCase()
              .includes(q),
          ),
        }))
        .filter((group) => group.matches.length > 0);
    },
    [q],
  );

  const filteredGroups = filterGroups(liveSelected ? liveGroups : groups);
  const filteredProps = q
    ? props.filter((item) => item.title.toLowerCase().includes(q))
    : props;

  const selectLeague = (name: string) => {
    setLeague(name);
    setLiveSelected(false);
    if (navEnabled) setLeagueFocused(true);
  };

  const clearLeagueFocus = () => {
    setLeagueFocused(false);
    setLiveSelected(true);
    setPinnedLeague(null);
    setTab("games");
    setMarketFilter("games");
  };

  const selectMarket = (filter: SportMarketFilter) => {
    setMarketFilter(filter);
    if (filter === "games" || filter === "props") setTab(filter);
  };

  const openLeaguesPage = () => {
    router.push(`/uxr-leagues?slug=${encodeURIComponent(sport.slug)}` as never);
  };

  const chipValue = liveSelected ? "live" : league;
  const moreCount = Math.max(0, sport.leagues.length - chipLeagues.length);
  const showExperimentChrome = !leagueOnlyPage && navEnabled && !liveSelected;
  const showingProps = leagueOnlyPage
    ? tab === "props"
    : !liveSelected &&
      (navEnabled ? showExperimentChrome && marketFilter === "props" : tab === "props");
  const showingEmpty = !leagueOnlyPage && showExperimentChrome && marketFilter !== "games" && marketFilter !== "props";
  const pageTitle = leagueOnlyPage ? leagueHeaderTitle(league) : sport.label;
  const pageSearch = leagueOnlyPage ? false : showSearch;
  const showDefaultFilters = !leagueOnlyPage && !navEnabled;
  const showTabs = leagueOnlyPage || (showDefaultFilters && !liveSelected);
  const headerPaddingBottom = showTabs ? 0 : 12;

  const contentTabs = (
    <TabsBar
      tabs={CONTENT_TABS}
      activeIndex={tab === "games" ? 0 : 1}
      onTabPress={(index) => {
        const next = index === 0 ? "games" : "props";
        setTab(next);
        setMarketFilter(next);
      }}
    />
  );

  const leagueRail = (
    <FilterButtonGroup
      value={chipValue}
      variant={FilterButtonVariant.Secondary}
      onChange={(value) => {
        if (value === "live") {
          setLiveSelected(true);
          setLeagueFocused(false);
          return;
        }
        if (value === "more") {
          openLeaguesPage();
          return;
        }
        selectLeague(value);
      }}
      style={{ flexGrow: 0 }}
      twClassName="px-4"
    >
      {showLiveChip ? (
        <FilterButton value="live" size={FilterButtonSize.Md} startAccessory={<LiveChipDot />} style={FILTER_CHIP_STYLE}>
          Games
        </FilterButton>
      ) : null}
      {chipLeagues.map((item) => (
        <FilterButton
          key={item.name}
          value={item.name}
          size={FilterButtonSize.Md}
          style={FILTER_CHIP_STYLE}
          onPress={() => {
            if (navEnabled) setLeagueFocused(true);
          }}
        >
          {item.name}
        </FilterButton>
      ))}
      {compactLeagueRail && moreCount > 0 ? (
        <FilterButton value="more" size={FilterButtonSize.Md} endIconName={IconName.ArrowRight} style={FILTER_CHIP_STYLE}>
          {`+${moreCount} more`}
        </FilterButton>
      ) : null}
    </FilterButtonGroup>
  );

  return (
    <Box twClassName="flex-1 bg-default">
      <StickyPageChrome paddingBottom={headerPaddingBottom}>
        <SportPageHeader
          title={pageTitle}
          onBack={() => router.back()}
          endButtonIconProps={
            pageSearch
              ? [
                  {
                    iconName: IconName.Search,
                    onPress: () => setSearchOpen((open) => !open),
                  },
                ]
              : undefined
          }
        />
        {leagueOnlyPage ? contentTabs : null}
        {showExperimentChrome ? (
          <SportsNavChrome
            variant={navVariant}
            league={league}
            leagues={sport.leagues}
            marketFilter={marketFilter}
            onClear={clearLeagueFocus}
            onSelectLeague={selectLeague}
            onSelectMarket={selectMarket}
          />
        ) : null}
        {navEnabled && !showExperimentChrome && !leagueOnlyPage ? leagueRail : null}
        {showDefaultFilters ? (
          <>
            {leagueRail}
            {showTabs ? <View style={{ paddingTop: 12 }}>{contentTabs}</View> : null}
          </>
        ) : null}
      </StickyPageChrome>
      <ScrollView
        style={{ flex: 1, minHeight: 0 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: PAGE_BODY_TOP_PADDING,
          paddingBottom: comboListPaddingBottom(comboMode, comboSheetH, insets.bottom, 48),
        }}
      >
        <Box twClassName={comboMode ? "pb-12" : "pb-12"}>
          {pageSearch && searchOpen ? (
            <Box twClassName="px-4">
              <TextFieldSearch
                value={query}
                onChangeText={setQuery}
                placeholder="Search"
                onPressClearButton={() => setQuery("")}
              />
            </Box>
          ) : null}

          <UxrCardProviders>
            {showingEmpty ? (
              <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative} twClassName="px-4 py-8 text-center">
                Nothing here yet
              </Text>
            ) : showingProps ? (
              filteredProps.length === 0 ? (
                <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative} twClassName="px-4 py-8 text-center">
                  Nothing here yet
                </Text>
              ) : (
                <UxrPropsList key={`props-${league}`} props={filteredProps} combo={comboMode} />
              )
            ) : (
              <UxrGameGroups key={`games-${liveSelected ? "live" : league}`} groups={filteredGroups} sectionGap={32} combo={comboMode} />
            )}
          </UxrCardProviders>
        </Box>
      </ScrollView>
      {comboMode ? <ComboTray returnTo="/combination" dismissible /> : null}
    </Box>
  );
}
