import React, { useEffect, useMemo, useRef, useState } from "react";
import { Image, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";

import { Feather, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path as SvgPath } from "react-native-svg";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";

import {
  SOCCER_COUNTRY_SECTIONS,
  UXR_SPORTS,
  sportBySlug,
  leagueGames,
  leagueProps,
  UxrCardProviders,
  UxrGameGroups,
  UxrPropsList,
  UxrTabs,
  UxrPageScroll,
} from "@/components/sim/UxrBrowse";
import { LeaguePickerSheet } from "@/components/sim/LeaguePickerSheet";
import { BtcCardsCard } from "@/components/sim/LiveCardsCarousel";
import { UXR_ICONS, UXR_MATERIAL_ICONS, UXR_MCI_ICONS } from "@/lib/sim/uxrIcons";
import { MaterialOutlinedSportIcon, outlinedSportId } from "@/components/sim/MaterialSportsOutline";
import { useCategoryTileStyle, useSportsRailStyle, useSportsRailVariant } from "@/lib/sim/categoryTileStore";
import { TOPICS, MatchCard, BinaryCard } from "@/lib/sim/topicMarkets";
import { CRYPTO_MARKETS, POLITICS_MARKETS, TRENDING_SUBS, CRYPTO_SUBS, POLITICS_SUBS } from "@/lib/sim/hubMarkets";
import { Btc150kEntryCard } from "@/app/crypto";
import { matchDetailHref, PREDICTION_DETAIL_HREF } from "@/lib/sim/marketRoutes";
import { colors, FILTER_CHIP_INACTIVE_TEXT, filterChipBackground, PREDICT_PALETTE } from "@/lib/sim/colors";
import { useKalshiMvp } from "@/lib/sim/kalshiFlavorStore";
import { useThemeMode, type ThemeMode } from "@/lib/sim/dsModeStore";
import { useSportsTabPreferences } from "@/lib/sim/sportsFilterStore";
import { useSportsIa } from "@/lib/sim/sportsIaStore";
import { PolymarketMetaMaskSports } from "@/components/sim/PolymarketMetaMaskSports";

// ── Category hub ─────────────────────────────────────────────────────────────
// One page per top-level category (Trending / Crypto / Politics / Sports).
// A horizontal subcategory rail tabs between subcategories; the result
// populates below. Sports additionally gets a league header with a dropdown
// (detent sheet) to switch leagues, plus Games/Props filters — per the mock,
// users can land directly on e.g. Sports with Football/NFL selected via
// /uxr-hub/sports?sub=football.
import { PageHeader } from "@/components/PageHeader";
import { PolymarketCategoriesSheet } from "@/components/sim/PolymarketCategoriesSheet";
import { geist } from "@/lib/sim/geistFonts";

type Category = "trending" | "crypto" | "politics" | "sports";

// Market data + subcategory definitions live in lib/sim/hubMarkets so the
// chips-mode combined page can share them.

const TITLES: Record<Category, string> = {
  trending: "Trending",
  crypto: "Crypto",
  politics: "Politics",
  sports: "Sports",
};

// Square icon tile rail for the Sports subcategory tabs. Selected tile gets
// the card-surface background; unselected tiles have no background. A "Live"
// tile leads: every live game across all sports, no Games/Props filters.
const RAIL_ITEMS = [{ slug: "live", label: "Live", emoji: undefined as string | undefined }, ...UXR_SPORTS];

function railFadeColors(themeMode: ThemeMode): [string, string, string] {
  const transparent = themeMode === "light"
    ? "rgba(255,255,255,0)"
    : "rgba(0,0,0,0)";
  return [transparent, colors.bg, colors.bg];
}

function horizontalPillStyle(selected: boolean, themeMode: ThemeMode) {
  return {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    height: 40,
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: filterChipBackground(selected),
  };
}

function horizontalPillTextColor(selected: boolean, themeMode: ThemeMode): string {
  return selected ? colors.textPrimary : FILTER_CHIP_INACTIVE_TEXT;
}

function estimatedHorizontalPillWidth(label: string): number {
  // Geist 14px averages roughly 7px per character. This only seeds the initial
  // deep-link scroll position; the rail remains freely scrollable afterward.
    return 12 + 16 + 6 + label.length * 8 + 12;
}

function SportRail({ active, onChange }: { active: string; onChange: (slug: string) => void }) {
  const material = useCategoryTileStyle() === "material";
  const railStyle = useSportsRailStyle();
  const horizontal = railStyle === "horizontal";
  const themeMode = useThemeMode();
  const { order: tabOrder, hidden } = useSportsTabPreferences();
  const scrollRef = useRef<ScrollView>(null);
  const items = [
    RAIL_ITEMS[0],
    ...tabOrder
      .filter((slug) => !hidden.includes(slug))
      .map((slug) => RAIL_ITEMS.find((item) => item.slug === slug))
      .filter((item): item is (typeof RAIL_ITEMS)[number] => !!item),
  ];
  // Deep links (e.g. the home E-sports tile → ?sub=esports) can land on a rail
  // item that sits off-screen; scroll it into view (centered) on mount. Fixed
  // geometry (56px item + 4px gap + 16px lead pad) — no measurement needed.
  const { width: winW } = useWindowDimensions();
  useEffect(() => {
    const idx = items.findIndex((s) => s.slug === active);
    if (idx <= 0) return;
    const before = horizontal
      ? items.slice(0, idx).reduce((sum, item) => sum + estimatedHorizontalPillWidth(item.label) + 8, 0)
      : idx * (56 + 4);
    const activeWidth = horizontal ? estimatedHorizontalPillWidth(items[idx].label) : 56;
    const x = Math.max(0, 16 + before - (winW / 2 - activeWidth / 2));
    scrollRef.current?.scrollTo({ x, animated: false });
    // Mount-only: the rail order is frozen for the visit and taps keep the
    // user's own scroll position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const pick = (slug: string) => {
    onChange(slug);
  };
  return (
    <View>
    <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: horizontal ? 8 : 4 }}>
      {items.map((s) => {
        const selected = s.slug === active;
        return (
          <Pressable
            key={s.slug}
            onPress={() => pick(s.slug)}
            style={horizontal
              ? horizontalPillStyle(selected, themeMode)
              : { alignItems: "center", gap: railStyle === "tabs" ? 0 : 6, width: 56 }}
          >
            <View
              style={{
                width: horizontal ? 16 : 48,
                height: horizontal ? 16 : 48,
                borderRadius: horizontal ? 0 : 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: selected && railStyle === "pill" ? colors.surface : "transparent",
              }}
            >
              {s.slug === "live" ? (
                <MaterialIcons
                  name="sensors"
                  size={horizontal ? 16 : 24}
                  color={horizontal ? horizontalPillTextColor(selected, themeMode) : colors.textPrimary}
                />
              ) : !material && UXR_ICONS[s.slug] ? (
                <Image source={UXR_ICONS[s.slug]} style={{ width: horizontal ? 16 : 28, height: horizontal ? 16 : 28 }} resizeMode="contain" />
              ) : outlinedSportId(s.slug) ? (
                <MaterialOutlinedSportIcon
                  name={s.slug}
                  size={horizontal ? 16 : 24}
                  color={horizontal ? horizontalPillTextColor(selected, themeMode) : colors.textPrimary}
                />
              ) : UXR_MATERIAL_ICONS[s.slug] ? (
                <MaterialIcons
                  name={UXR_MATERIAL_ICONS[s.slug]}
                  size={horizontal ? 16 : 24}
                  color={horizontal ? horizontalPillTextColor(selected, themeMode) : colors.textPrimary}
                />
              ) : UXR_MCI_ICONS[s.slug] ? (
                <MaterialCommunityIcons
                  name={UXR_MCI_ICONS[s.slug]}
                  size={horizontal ? 16 : 24}
                  color={horizontal ? horizontalPillTextColor(selected, themeMode) : colors.textPrimary}
                />
              ) : (
                <Text style={{ fontSize: 20 }}>{s.emoji}</Text>
              )}
            </View>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: geist.regular,
                 fontSize: horizontal ? 16 : 12,
                lineHeight: horizontal ? 22 : 16,
                color: horizontal
                  ? horizontalPillTextColor(selected, themeMode)
                  : selected ? colors.textPrimary : colors.textMuted,
              }}
            >
              {s.label}
            </Text>
            {selected && railStyle === "tabs" ? (
              <View style={{ width: 48, height: 2, marginTop: 4, backgroundColor: PREDICT_PALETTE.textPrimary }} />
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
    </View>
  );
}

// League-focused rail variant (Settings → Sports carousel → Leagues): the
// tiles are leagues across every sport, Live first. Icons come from the
// parent sport. The grouped league browser is opened from the Sports header.
const LEAGUE_RAIL_ITEMS = UXR_SPORTS.flatMap((sport) => sport.leagues.map((l) => ({ league: l.name, sport })));

let lastPickedLeague: string | null = null;

function LeagueRail({ active, onChange }: { active: string; onChange: (league: string) => void }) {
  const material = useCategoryTileStyle() === "material";
  const railStyle = useSportsRailStyle();
  const horizontal = railStyle === "horizontal";
  const themeMode = useThemeMode();
  // Same rule as the sport rail: order is computed once on mount from the
  // previous visit's pick — never reshuffles while the user is on the page.
  const [order] = useState(() => {
    const base = ["live", ...LEAGUE_RAIL_ITEMS.map((i) => i.league)];
    const p = lastPickedLeague;
    return p && p !== "live" && base.includes(p) ? ["live", p, ...base.filter((x) => x !== "live" && x !== p)] : base;
  });
  const items = [...LEAGUE_RAIL_ITEMS].sort((a, b) => order.indexOf(a.league) - order.indexOf(b.league));
  const pick = (league: string) => {
    onChange(league);
    if (league !== "live") lastPickedLeague = league;
  };
  const tile = (selected: boolean) => ({
    width: horizontal ? 16 : 48,
    height: horizontal ? 16 : 48,
    borderRadius: horizontal ? 0 : 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: selected && railStyle === "pill" ? colors.surface : "transparent",
  });
  const label = (selected: boolean) => ({
    fontFamily: geist.regular,
     fontSize: horizontal ? 16 : 12,
    lineHeight: horizontal ? 22 : 16,
    color: horizontal
      ? horizontalPillTextColor(selected, themeMode)
      : selected ? colors.textPrimary : colors.textMuted,
  });
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: horizontal ? 8 : 4 }}>
        <Pressable
          onPress={() => pick("live")}
          style={horizontal ? horizontalPillStyle(active === "live", themeMode) : { alignItems: "center", gap: railStyle === "tabs" ? 0 : 6, width: 60 }}
        >
          <View style={tile(active === "live")}>
            <MaterialIcons
              name="sensors"
              size={horizontal ? 16 : 24}
              color={horizontal ? horizontalPillTextColor(active === "live", themeMode) : colors.textPrimary}
            />
          </View>
          <Text numberOfLines={1} style={label(active === "live")}>
            Live
          </Text>
          {active === "live" && railStyle === "tabs" ? (
            <View style={{ width: 48, height: 2, marginTop: 4, backgroundColor: PREDICT_PALETTE.textPrimary }} />
          ) : null}
        </Pressable>
        {items.map(({ league, sport }) => {
          const selected = league === active;
          return (
            <Pressable
              key={league}
              onPress={() => pick(league)}
              style={horizontal ? horizontalPillStyle(selected, themeMode) : { alignItems: "center", gap: railStyle === "tabs" ? 0 : 6, width: 60 }}
            >
              <View style={tile(selected)}>
                {!material && UXR_ICONS[sport.slug] ? (
                  <Image source={UXR_ICONS[sport.slug]} style={{ width: horizontal ? 16 : 28, height: horizontal ? 16 : 28 }} resizeMode="contain" />
                ) : outlinedSportId(sport.slug) ? (
                  <MaterialOutlinedSportIcon
                    name={sport.slug}
                    size={horizontal ? 16 : 24}
                    color={horizontal ? horizontalPillTextColor(selected, themeMode) : colors.textPrimary}
                  />
                ) : UXR_MATERIAL_ICONS[sport.slug] ? (
                  <MaterialIcons
                    name={UXR_MATERIAL_ICONS[sport.slug]}
                    size={horizontal ? 16 : 24}
                    color={horizontal ? horizontalPillTextColor(selected, themeMode) : colors.textPrimary}
                  />
                ) : UXR_MCI_ICONS[sport.slug] ? (
                  <MaterialCommunityIcons
                    name={UXR_MCI_ICONS[sport.slug]}
                    size={horizontal ? 16 : 24}
                    color={horizontal ? horizontalPillTextColor(selected, themeMode) : colors.textPrimary}
                  />
                ) : (
                  <Text style={{ fontSize: 20 }}>{sport.emoji}</Text>
                )}
              </View>
              <Text numberOfLines={1} style={label(selected)}>
                {league}
              </Text>
              {selected && railStyle === "tabs" ? (
                <View style={{ width: 48, height: 2, marginTop: 4, backgroundColor: PREDICT_PALETTE.textPrimary }} />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// Mix rail (Settings → Sports carousel → Mix): Live first, then trending
// leagues (top league of each sport) mixed with the sport tiles themselves.
// Values: "live" | "sport:<slug>" | "<league name>".
const MIX_TRENDING = UXR_SPORTS.filter((sp) => sp.leagues.length > 0).map((sp) => ({ league: sp.leagues[0].name, sport: sp }));

function MixRail({ active, onChange }: { active: string; onChange: (val: string) => void }) {
  const material = useCategoryTileStyle() === "material";
  const railStyle = useSportsRailStyle();
  const horizontal = railStyle === "horizontal";
  const themeMode = useThemeMode();
  const scrollRef = useRef<ScrollView>(null);
  const { width: winW } = useWindowDimensions();
  const tile = (selected: boolean) => ({
    width: horizontal ? 16 : 48,
    height: horizontal ? 16 : 48,
    borderRadius: horizontal ? 0 : 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: selected && railStyle === "pill" ? colors.surface : "transparent",
  });
  const label = (selected: boolean) => ({
    fontFamily: geist.regular,
    fontSize: horizontal ? 16 : 12,
    lineHeight: horizontal ? 22 : 16,
    color: horizontal
      ? horizontalPillTextColor(selected, themeMode)
      : selected ? colors.textPrimary : colors.textMuted,
  });
  const sportIcon = (sp: (typeof UXR_SPORTS)[number], selected: boolean) =>
    !material && UXR_ICONS[sp.slug] ? (
      <Image source={UXR_ICONS[sp.slug]} style={{ width: horizontal ? 16 : 28, height: horizontal ? 16 : 28 }} resizeMode="contain" />
    ) : outlinedSportId(sp.slug) ? (
      <MaterialOutlinedSportIcon
        name={sp.slug}
        size={horizontal ? 16 : 24}
        color={horizontal ? horizontalPillTextColor(selected, themeMode) : colors.textPrimary}
      />
    ) : UXR_MATERIAL_ICONS[sp.slug] ? (
      <MaterialIcons
        name={UXR_MATERIAL_ICONS[sp.slug]}
        size={horizontal ? 16 : 24}
        color={horizontal ? horizontalPillTextColor(selected, themeMode) : colors.textPrimary}
      />
    ) : UXR_MCI_ICONS[sp.slug] ? (
      <MaterialCommunityIcons
        name={UXR_MCI_ICONS[sp.slug]}
        size={horizontal ? 16 : 24}
        color={horizontal ? horizontalPillTextColor(selected, themeMode) : colors.textPrimary}
      />
    ) : (
      <Text style={{ fontSize: 20 }}>{sp.emoji}</Text>
    );
  // Interleave: league, its sport, next league, ... so both kinds stay visible
  // near the front of the rail.
  const entries: { key: string; value: string; label: string; sport: (typeof UXR_SPORTS)[number] }[] = [];
  MIX_TRENDING.forEach(({ league, sport }) => {
    entries.push({ key: `l:${league}`, value: league, label: league, sport });
    entries.push({ key: `s:${sport.slug}`, value: `sport:${sport.slug}`, label: sport.label, sport });
  });
  // Deep links from the home E-sports tile can arrive with E-sports already
  // selected. Reveal that mixed-rail item so the selected state is visible
  // instead of leaving it offscreen at the rail's initial scroll position.
  useEffect(() => {
    const itemIndex = active === "live" ? 0 : entries.findIndex((e) => e.value === active) + 1;
    if (itemIndex <= 0) return;
    const before = horizontal
      ? estimatedHorizontalPillWidth("Live") + 8 + entries.slice(0, itemIndex - 1).reduce((sum, entry) => sum + estimatedHorizontalPillWidth(entry.label) + 8, 0)
      : itemIndex * (60 + 4);
    const activeWidth = horizontal ? estimatedHorizontalPillWidth(entries[itemIndex - 1].label) : 60;
    const x = Math.max(0, 16 + before - (winW / 2 - activeWidth / 2));
    scrollRef.current?.scrollTo({ x, animated: false });
  }, [active, horizontal, winW]);
  // A league picker can select any league, while Mix only exposes each
  // sport's trending league plus its parent sport tile. Keep exact matches
  // (for example MLB) highlighted; otherwise fall back to the parent sport
  // tile (for example Baseball when NPB is selected).
  const hasDirectSelection = entries.some((e) => e.value === active);
  const activeSportSlug = active.startsWith("sport:")
    ? active.slice(6)
    : UXR_SPORTS.find((sp) => sp.leagues.some((l) => l.name === active))?.slug;
  return (
    <View>
      <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: horizontal ? 8 : 4 }}>
        <Pressable
          onPress={() => onChange("live")}
          style={horizontal ? horizontalPillStyle(active === "live", themeMode) : { alignItems: "center", gap: railStyle === "tabs" ? 0 : 6, width: 60 }}
        >
          <View style={tile(active === "live")}>
            <MaterialIcons
              name="sensors"
              size={horizontal ? 16 : 24}
              color={horizontal ? horizontalPillTextColor(active === "live", themeMode) : colors.textPrimary}
            />
          </View>
          <Text numberOfLines={1} style={label(active === "live")}>
            Live
          </Text>
          {active === "live" && railStyle === "tabs" ? (
            <View style={{ width: 48, height: 2, marginTop: 4, backgroundColor: PREDICT_PALETTE.textPrimary }} />
          ) : null}
        </Pressable>
        {entries.map((e) => {
          const selected =
            e.value === active ||
            (!hasDirectSelection && e.value === `sport:${activeSportSlug}`);
          return (
            <Pressable
              key={e.key}
              onPress={() => onChange(e.value)}
              style={horizontal ? horizontalPillStyle(selected, themeMode) : { alignItems: "center", gap: railStyle === "tabs" ? 0 : 6, width: 60 }}
            >
              <View style={tile(selected)}>
                {sportIcon(e.sport, selected)}
              </View>
              <Text numberOfLines={1} style={label(selected)}>
                {e.label}
              </Text>
              {selected && railStyle === "tabs" ? (
                <View style={{ width: 48, height: 2, marginTop: 4, backgroundColor: PREDICT_PALETTE.textPrimary }} />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// League header row: "🏈 NFL ⌄" — tapping opens the league picker sheet.
function LeagueHeader({ league, onPress }: { league: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingTop: 16, opacity: pressed ? 0.6 : 1 })}>
      <Text style={{ fontFamily: geist.semibold, fontSize: 18, lineHeight: 24, color: colors.textPrimary }}>{league}</Text>
      <Feather name="chevron-down" size={24} color={colors.textAlternative} />
    </Pressable>
  );
}

// ── Polymarket IA shared helpers ─────────────────────────────────────────────
// Used both by the in-place SportsHub view and the nested /poly-sport/[slug]
// page pushed from the Live feed's category headers.
type PmGroups = (typeof UXR_SPORTS)[number]["games"];

// Merge league game lists by day title, deduping matches by identity (leagues
// without dedicated fixtures fall back to their parent sport's games, so the
// same match object can arrive once per league).
export const pmMergeGroups = (lists: PmGroups[]) => {
  const byTitle = new Map<string, PmGroups[number]>();
  const seen = new Set<unknown>();
  for (const list of lists)
    for (const g of list) {
      const fresh = g.matches.filter((m) => !seen.has(m));
      fresh.forEach((m) => seen.add(m));
      if (fresh.length === 0) continue;
      const existing = byTitle.get(g.title);
      if (existing) existing.matches.push(...fresh);
      else byTitle.set(g.title, { title: g.title, matches: fresh });
    }
  return [...byTitle.values()];
};

// Per the Polymarket screenshots, live games always lead under a "Live"
// section; remaining games keep their date-style group titles.
export const pmLiveFirst = (gs: PmGroups) => {
  const live = gs.flatMap((g) => g.matches.filter((m) => m.live));
  const rest = gs
    .map((g) => ({ title: g.title, matches: g.matches.filter((m) => !m.live) }))
    .filter((g) => g.matches.length > 0);
  return [...(live.length ? [{ title: "Live", matches: live }] : []), ...rest];
};

// Merged games across a sport's leagues plus its props split into Awards
// (award-like titles) vs Futures (everything else).
export function buildPolySport(sport: (typeof UXR_SPORTS)[number]) {
  const all = pmMergeGroups(sport.leagues.map((l) => leagueGames(l.name)));
  const allProps = [...new Set(sport.leagues.flatMap((l) => leagueProps(l.name)))];
  const isAward = (t: string) => /(award|mvp|golden|winner|ballon|leader|trophy|boot|cy young|rookie)/i.test(t);
  const awards = allProps.filter((p) => isAward(p.title));
  const futures = allProps.filter((p) => !isAward(p.title));
  const gameCount = all.reduce((sum, g) => sum + g.matches.length, 0);
  return { all, awards, futures, gameCount };
}

// The pill set for a sport: Games + one pill per league + Futures/Awards when
// those markets exist (zero-count pills never render, matching Polymarket).
export function polySportPills(sport: (typeof UXR_SPORTS)[number], data: ReturnType<typeof buildPolySport>) {
  return [
    { key: "games", label: "Games", count: data.gameCount },
    ...sport.leagues.map((l) => ({ key: `league:${l.name}`, label: l.name, count: l.count })),
    ...(data.futures.length ? [{ key: "futures", label: "Futures", count: data.futures.length }] : []),
    ...(data.awards.length ? [{ key: "awards", label: "Awards", count: data.awards.length }] : []),
  ];
}

export function PolyPillTabs({
  pills,
  active,
  onChange,
}: {
  pills: { key: string; label: string; count: number }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={{ flexDirection: "row", gap: 8, paddingHorizontal: 16 }}
    >
      {pills.map((p) => {
        const on = p.key === active;
        return (
          <Pressable
            key={p.key}
            onPress={() => onChange(p.key)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              height: 40,
              paddingHorizontal: 14,
              borderRadius: 12,
              backgroundColor: filterChipBackground(on),
            }}
          >
            <Text style={{ fontFamily: geist.medium, fontSize: 16, color: on ? colors.textPrimary : FILTER_CHIP_INACTIVE_TEXT }} numberOfLines={1}>
              {p.label}
            </Text>
            <Text style={{ fontFamily: geist.medium, fontSize: 16, color: on ? colors.textPrimary : FILTER_CHIP_INACTIVE_TEXT }}>{p.count}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function SportsHub({
  initialSport,
  embedded,
  browserOpen: controlledBrowserOpen,
  onBrowserOpenChange,
}: {
  initialSport?: string;
  embedded?: boolean;
  browserOpen?: boolean;
  onBrowserOpenChange?: (open: boolean) => void;
}) {
  useThemeMode();
  const router = useRouter();
  // Kalshi MVP: no sport carousel, football only, and the league picker
  // defaults to NFL with only NFL / NCAAF available. V2 uses the regular hub.
  const kalshi = useKalshiMvp();
  const railVariant = useSportsRailVariant();
  const railStyle = useSportsRailStyle();
  const leaguesRail = railVariant === "leagues" && !kalshi;
  // Mix: one carousel with both sports and trending leagues. Its selected
  // entry still resolves into the same Sports page IA below the rail.
  const mixRail = railVariant === "mix" && !kalshi;
  // Leagues variant: the rail selection IS the league ("live" or a league
  // name); no intermediate league-picker header flow.
  const [leagueSel, setLeagueSel] = useState<string>(() => (
    mixRail && initialSport && sportBySlug(initialSport) ? `sport:${initialSport}` : "live"
  ));
  const [uncontrolledBrowserOpen, setUncontrolledBrowserOpen] = useState(false);
  const browserOpen = controlledBrowserOpen ?? uncontrolledBrowserOpen;
  const setBrowserOpen = onBrowserOpenChange ?? setUncontrolledBrowserOpen;
  const [slug, setSlug] = useState(
    // Default to the Live rail tile (all live games) unless a specific sport
    // was requested via the route param.
    initialSport === "live" ? "live" : initialSport && sportBySlug(initialSport) ? initialSport : "live",
  );
  const liveMode = !kalshi && (leaguesRail || mixRail ? leagueSel === "live" : slug === "live");
  // In Mix, both a sport tile and a league tile resolve to the parent sport.
  // This lets the body use the exact same Sports structure while retaining the
  // picked league as the selector value.
  const mixSport = mixRail
    ? leagueSel.startsWith("sport:")
      ? sportBySlug(leagueSel.slice(6))
      : UXR_SPORTS.find((sp) => sp.leagues.some((l) => l.name === leagueSel))
    : undefined;
  const effectiveSlug = kalshi ? "football" : mixSport?.slug ?? slug;
  const sport = liveMode || leaguesRail ? undefined : mixRail ? mixSport : sportBySlug(effectiveSlug)!;
  const [leagueBySport, setLeagueBySport] = useState<Record<string, string>>({});
  // Every sport defaults to "All" (merged leagues); Live has no league picker.
  // In Kalshi mode the default is NFL instead.
  const league = liveMode
    ? "Live"
    : leaguesRail
      ? leagueSel
      : mixRail
        ? (leagueSel.startsWith("sport:") ? "All" : leagueSel)
        : leagueBySport[effectiveSlug] ?? (kalshi ? "NFL" : "All");
  const [tab, setTab] = useState<"games" | "props">("games");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  // Polymarket IA (default sport rail variant): one scrollable pill row acts
  // as the tab bar — "Games N", a pill per league with its count, then
  // "Futures N" / "Awards N" (per the user's Polymarket screenshots, Aug 17
  // 2026). The league picker header + Games/Props tabs are replaced in this
  // path only; Live rail tile, Leagues/Mix rail variants, and the region-
  // Kalshi mode keep the original structure.
  const pmPills = !kalshi && !leaguesRail && !mixRail && !liveMode && !!sport;
  const [pmTab, setPmTab] = useState<string>("games");
  // Polymarket Live tile: the feed groups live games under tappable category
  // headers (sport titles with a chevron) that push /poly-sport/[slug].
  const pmLive = !kalshi && !leaguesRail && !mixRail && liveMode;
  // The default Polymarket rail mixes leagues (NFL, NBA, …) in with sports;
  // selecting a league lands on the parent sport with that league's pill
  // active. Resets are explicit here (no effect on slug), so the league
  // preselect isn't clobbered.
  const [pmRail, setPmRail] = useState<string>(() =>
    initialSport && initialSport !== "live" && sportBySlug(initialSport) ? `sport:${initialSport}` : "live",
  );
  // Deep-link changes while this hub stays mounted (route `sub` param) must
  // re-sync all selection state; the mount run is a no-op.
  useEffect(() => {
    const next = initialSport && initialSport !== "live" && sportBySlug(initialSport) ? initialSport : "live";
    setSlug(next);
    setPmRail(next === "live" ? "live" : `sport:${next}`);
    setPmTab("games");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSport]);
  // The rail highlight is DERIVED from `slug` (the canonical selection) so it
  // can never desync when slug changes through another path (region toggle,
  // rail-variant switch). pmRail only remembers the last tapped league so a
  // league tile stays highlighted while its parent sport is active.
  const pmRailActive =
    slug === "live"
      ? "live"
      : pmRail !== "live" &&
          !pmRail.startsWith("sport:") &&
          UXR_SPORTS.find((s) => s.leagues.some((l) => l.name === pmRail))?.slug === slug
        ? pmRail
        : `sport:${slug}`;
  const onPmRail = (v: string) => {
    setPmRail(v);
    if (v === "live") {
      setSlug("live");
      return;
    }
    if (v.startsWith("sport:")) {
      setSlug(v.slice(6));
      setPmTab("games");
      return;
    }
    const parent = UXR_SPORTS.find((s) => s.leagues.some((l) => l.name === v));
    if (parent) {
      setSlug(parent.slug);
      setPmTab(`league:${v}`);
    }
  };

  // "Live" rail tile shows every live game across all sports (no Games/Props
  // filters); "All" in the league picker merges all of the current sport's
  // leagues. Groups merge by day title.
  const mergeGroups = pmMergeGroups;
  const groups = useMemo(() => {
    if (liveMode)
      return mergeGroups(UXR_SPORTS.map((s) => s.games))
        .map((g) => ({ ...g, matches: g.matches.filter((m) => m.live) }))
        .filter((g) => g.matches.length > 0);
    if (sport && league === "All") return mergeGroups(sport.leagues.map((l) => leagueGames(l.name)));
    if (league === "All") return mergeGroups(sport!.leagues.map((l) => leagueGames(l.name)));
    return leagueGames(league);
  }, [liveMode, league, sport]);
  // Polymarket pill data: merged games across the sport's leagues, plus the
  // props split into Awards (award-like titles) vs Futures (everything else).
  const pm = useMemo(() => (pmPills && sport ? buildPolySport(sport) : null), [pmPills, sport]);
  const liveFirst = pmLiveFirst;

  // Live feed sections, one per sport with live games.
  const pmLiveSections = useMemo(() => {
    if (!pmLive) return [];
    return UXR_SPORTS.map((s) => ({
      slug: s.slug,
      label: s.label,
      matches: s.games.flatMap((g) => g.matches.filter((m) => m.live)),
    })).filter((s) => s.matches.length > 0);
  }, [pmLive]);

  const props = useMemo(() => {
    if (liveMode) return [];
    // Same fallback story as games: leagues without dedicated props inherit
    // the parent sport's, so dedupe by identity or "All" repeats every card.
    if (sport && league === "All") return [...new Set(sport.leagues.flatMap((l) => leagueProps(l.name)))];
    if (league === "All") return [...new Set(sport!.leagues.flatMap((l) => leagueProps(l.name)))];
    return leagueProps(league);
  }, [liveMode, league, sport]);

  // Embedded (home pills variant): the host page owns the ScrollView, so the
  // hub body renders in a plain View with the same vertical rhythm.
  const Wrap = embedded
    ? ({ children }: { children: React.ReactNode }) => <View style={{ paddingTop: 16, gap: 16 }}>{children}</View>
    : UxrPageScroll;
  const railEl = mixRail ? (
    <MixRail active={leagueSel} onChange={setLeagueSel} />
  ) : leaguesRail ? (
    <LeagueRail active={leagueSel} onChange={setLeagueSel} />
  ) : kalshi ? (
    <SportRail active={slug} onChange={setSlug} />
  ) : (
    // Polymarket default: leagues (NFL, NBA, …) mixed into the sports rail.
    <MixRail active={pmRailActive} onChange={onPmRail} />
  );
  const railWithCategories = !kalshi ? (
    <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
      <View style={{ flex: 1, minWidth: 0 }}>{railEl}</View>
      <Pressable
        onPress={() => setCategoriesOpen(true)}
        accessibilityLabel="Open all categories"
        hitSlop={8}
        style={{ width: 48, height: 74, marginRight: 4, alignItems: "center", justifyContent: "flex-start" }}
      >
        <View style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}>
          <MaterialIcons name="sort" size={24} color={colors.textMuted} />
        </View>
      </Pressable>
    </View>
  ) : railEl;
  const body = (
    <Wrap>
      {!kalshi && embedded && railWithCategories}
      {liveMode ? (
        <Text style={{ fontFamily: geist.semibold, fontSize: 18, lineHeight: 24, color: colors.textPrimary, paddingHorizontal: 16, paddingTop: 16, marginBottom: 16 }}>
          Live
        </Text>
      ) : leaguesRail ? (
        <Text style={{ fontFamily: geist.semibold, fontSize: 18, lineHeight: 24, color: colors.textPrimary, paddingHorizontal: 16, paddingTop: 16 }}>
          {mixSport ? mixSport.label : league}
        </Text>
      ) : pmPills ? null : (
        <LeagueHeader league={league} onPress={() => setPickerOpen(true)} />
      )}
      {!liveMode && !pmPills && (
        <UxrTabs<"games" | "props">
          tabs={[
            { key: "games", label: "Games" },
            { key: "props", label: "Props" },
          ]}
          active={tab}
          onChange={setTab}
        />
      )}
      {pmPills && pm && sport && (
        <PolyPillTabs
          active={pmTab}
          onChange={setPmTab}
          pills={[
            { key: "games", label: "Games", count: pm.gameCount },
            ...sport.leagues.map((l) => ({ key: `league:${l.name}`, label: l.name, count: l.count })),
            ...(pm.futures.length ? [{ key: "futures", label: "Futures", count: pm.futures.length }] : []),
            ...(pm.awards.length ? [{ key: "awards", label: "Awards", count: pm.awards.length }] : []),
          ]}
        />
      )}
      <UxrCardProviders>
        {pmPills && pm ? (
          pmTab === "futures" ? (
            <UxrPropsList props={pm.futures} />
          ) : pmTab === "awards" ? (
            <UxrPropsList props={pm.awards} />
          ) : pmTab.startsWith("league:") ? (
            <UxrGameGroups groups={liveFirst(leagueGames(pmTab.slice(7)))} />
          ) : (
            <UxrGameGroups groups={liveFirst(pm.all)} />
          )
        ) : pmLive ? (
          <View style={{ gap: 24 }}>
            {pmLiveSections.map((s) => (
              <View key={s.slug} style={{ gap: 12 }}>
                <Pressable
                  onPress={() => router.push(`/poly-sport/${s.slug}` as never)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 16,
                  }}
                >
                  <Text style={{ fontFamily: geist.semibold, fontSize: 18, lineHeight: 24, color: colors.textPrimary }}>
                    {s.label}
                  </Text>
                  <Feather name="chevron-right" size={22} color={colors.textMuted} />
                </Pressable>
                <View style={{ gap: 12, paddingHorizontal: 16 }}>
                  {s.matches.map((m, i) => (
                    <Pressable key={`${s.slug}-${i}`} onPress={() => router.push(matchDetailHref(m) as never)}>
                      <MatchCard m={m} layout="global" />
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : liveMode || tab === "games" ? (
          <UxrGameGroups groups={groups} />
        ) : (
          <UxrPropsList props={props} />
        )}
      </UxrCardProviders>
      <LeaguePickerSheet
        visible={pickerOpen && !liveMode}
        title={sport?.label ?? "Sports"}
        leagues={
          kalshi
            ? [
                { name: "NFL", count: 2 },
                { name: "NCAAF", count: 2 },
              ]
            : sport
              ? [
                  { name: "All", count: sport.leagues.reduce((sum, l) => sum + l.count, 0) },
                  ...(sport.slug === "soccer" ? [] : sport.leagues),
                ]
              : []
        }
        sections={!kalshi && sport?.slug === "soccer" ? SOCCER_COUNTRY_SECTIONS : undefined}
        selected={league}
        onSelect={(name) => {
          if (mixRail) {
            // Keep the current parent sport selected in the mixed rail when
            // "All" is chosen; a specific league becomes the active mixed
            // entry and is shown in the same selector header.
            setLeagueSel(name === "All" ? `sport:${effectiveSlug}` : name);
          } else {
            setLeagueBySport((m) => ({ ...m, [effectiveSlug]: name }));
          }
        }}
        onClose={() => setPickerOpen(false)}
      />
      {!kalshi && (
        <PolymarketCategoriesSheet
          visible={categoriesOpen}
          onClose={() => setCategoriesOpen(false)}
        />
      )}
      {/* Browse every league grouped by sport. The Sports header opens this
          sheet for Mix and Leagues rail variants. */}
      <LeaguePickerSheet
        visible={browserOpen && (leaguesRail || mixRail)}
        title={mixRail ? "Browse" : "Leagues"}
        leagues={[]}
        sections={UXR_SPORTS.map((sp) => ({
          country: sp.label,
          icon: UXR_MATERIAL_ICONS[sp.slug],
          leagues: mixRail
            ? [{ name: `All ${sp.label}`, count: sp.leagues.reduce((sum, l) => sum + l.count, 0) }, ...sp.leagues]
            : sp.leagues,
        }))}
        selected={mixSport ? `All ${mixSport.label}` : leagueSel}
        onSelect={(name) => {
          if (mixRail && name.startsWith("All ")) {
            const sp = UXR_SPORTS.find((x) => `All ${x.label}` === name);
            setLeagueSel(sp ? `sport:${sp.slug}` : "live");
          } else {
            setLeagueSel(name);
            lastPickedLeague = name;
          }
        }}
        onClose={() => setBrowserOpen(false)}
      />
    </Wrap>
  );
  // Full-page variant: the rail is part of the header block (solid bg, outside
  // the scroll), so cards never scroll behind it.
  if (embedded) return body;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {!kalshi && (
        <View
          style={{
            paddingTop: railStyle === "horizontal" ? 12 : 4,
            paddingBottom: 12,
            backgroundColor: colors.bg,
          }}
        >
          {railWithCategories}
        </View>
      )}
      {body}
    </View>
  );
}

export function TopicList({ topicKey, limit }: { topicKey: string; limit?: number }) {
  const router = useRouter();
  const topic = TOPICS[topicKey];
  if (!topic) return null;
  return (
    <View style={{ gap: 12, paddingHorizontal: 16 }}>
      {topic.kind === "match"
        ? (limit ? topic.data.slice(0, limit) : topic.data).map((m, i) => (
            <Pressable key={i} onPress={() => router.push(matchDetailHref(m) as never)}>
              <MatchCard m={m} layout="global" />
            </Pressable>
          ))
        : (limit ? topic.data.slice(0, limit) : topic.data).map((b) => (
            <Pressable key={b.title} onPress={() => router.push({ pathname: PREDICTION_DETAIL_HREF, params: { t: b.title, yes: String(parseInt(b.match.teams[0].pct ?? "50", 10) || 50), vol: b.match.vol } } as never)}>
              <BinaryCard item={b} />
            </Pressable>
          ))}
    </View>
  );
}

// Recurring "BTC Up or Down" market durations (Polymarket's crypto up/down
// series). Each duration gets its own live countdown; only mm:ss clocks tick.
const BTC_DURATIONS: { key: string; label: string; clock: string; odds: [number, number] }[] = [
  { key: "5m", label: "5 Min", clock: "3:12", odds: [73, 27] },
  { key: "15m", label: "15 Min", clock: "11:47", odds: [61, 39] },
  { key: "1h", label: "1 Hr", clock: "38:05", odds: [55, 45] },
  { key: "1d", label: "1 Day", clock: "16 Hrs left", odds: [52, 48] },
];

export function SimpleHub({ category, embedded }: { category: Exclude<Category, "sports">; embedded?: boolean }) {
  const subs = category === "trending" ? TRENDING_SUBS : category === "crypto" ? CRYPTO_SUBS : POLITICS_SUBS;
  const [sub, setSub] = useState(subs[0].key);
  const [btcDur, setBtcDur] = useState(BTC_DURATIONS[0].key);
  const { width: winW } = useWindowDimensions();
  const content = () => {
    if (category === "trending") return <TopicList topicKey={sub} />;
    // Crypto: Live/Bitcoin/Ethereum sub nav. Live shows the recurring BTC
    // Up/Down cards; Bitcoin and Ethereum keep their market lists.
    if (category === "crypto") {
      if (sub === "live") {
        return (
          <View style={{ gap: 12, paddingHorizontal: 16 }}>
            {BTC_DURATIONS.map((duration) => (
              <BtcCardsCard
                key={duration.key}
                width={Math.max(0, winW - 32)}
                duration={duration.label}
                clock={duration.clock}
                odds={duration.odds}
              />
            ))}
          </View>
        );
      }
      const list =
        sub === "bitcoin" ? CRYPTO_MARKETS.slice(0, 1) : sub === "ethereum" ? CRYPTO_MARKETS.slice(1, 2) : CRYPTO_MARKETS;
      return (
        <View style={{ gap: 12 }}>
          {sub !== "ethereum" && (
            <View style={{ paddingHorizontal: 16 }}>
              <Btc150kEntryCard />
            </View>
          )}
          <UxrPropsList props={list} />
        </View>
      );
    }
    const list = sub === "geopolitics" ? TOPICS.iran : undefined;
    return list && list.kind === "binary" ? <UxrPropsList props={list.data} /> : <UxrPropsList props={POLITICS_MARKETS} />;
  };
  const Wrap = embedded
    ? ({ children }: { children: React.ReactNode }) => <View style={{ paddingTop: 16, gap: 16 }}>{children}</View>
    : UxrPageScroll;
  const tabsEl = <UxrTabs tabs={subs.map((s) => ({ key: s.key, label: s.label }))} active={sub} onChange={setSub} bottomSpacing={0} />;
  if (embedded)
    return (
      <Wrap>
        {tabsEl}
        <UxrCardProviders>{content()}</UxrCardProviders>
      </Wrap>
    );
  // Full-page variant: the filter row is part of the header block (solid bg,
  // outside the scroll) so content never scrolls behind it.
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: 12, paddingBottom: 12, backgroundColor: colors.bg }}>{tabsEl}</View>
      <UxrPageScroll>
        <UxrCardProviders>{content()}</UxrCardProviders>
      </UxrPageScroll>
    </View>
  );
}

export default function UxrHubScreen() {
  const { category, sub } = useLocalSearchParams<{ category: string; sub?: string }>();
  const cat = (typeof category === "string" ? category : "sports") as Category;
  const title = TITLES[cat] ?? "Browse";
  const sportsIa = useSportsIa();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <PageHeader title={title} showSearch={false} />
      {cat === "sports" ? (
        sportsIa === "polymarket-sport-pages" ? (
          <Redirect href="/uxr-categories?sports=1" />
        ) : sportsIa === "polymarket-metamask" ? (
          <PolymarketMetaMaskSports initialSport={typeof sub === "string" ? sub : undefined} />
        ) : (
          <SportsHub initialSport={typeof sub === "string" ? sub : undefined} />
        )
      ) : (
        <SimpleHub category={cat === "crypto" || cat === "politics" || cat === "trending" ? cat : "trending"} />
      )}
    </View>
  );
}
