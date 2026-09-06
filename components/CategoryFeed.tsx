import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  type TextStyle,
  View,
} from "react-native";
import ReAnimated, {
  Easing,
  FadeIn,
  FadeInRight,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "@/lib/sim/haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { getUxrMode } from "@/lib/sim/uxrModeStore";
import { FILTER_CHIP_ACTIVE_BG, FILTER_CHIP_INACTIVE_TEXT } from "@/lib/sim/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PageHeader } from "@/components/PageHeader";
import { PulsingDot } from "@/components/PulsingDot";
import { SlotPct } from "@/components/SlotPct";
import { useLiveOdds } from "@/hooks/useLiveOdds";
import { periodLabel } from "@/lib/periodLabel";
import { formatVol } from "@/lib/formatVol";
import { StandardCard } from "@/components/sim/StandardCard";
import { FeedSettingsProvider, type FeedSettings } from "@/lib/sim/FeedSettingsContext";
import { useVersusMode } from "@/lib/sim/versusModeStore";
import { useAccentControls } from "@/lib/sim/accentControlsStore";
import { useVersusHeaderAlign } from "@/lib/sim/versusHeaderAlignStore";
import { LiveTickProvider } from "@/lib/sim/LiveTickContext";
import { LiveCueColorProvider } from "@/lib/sim/LiveCueColorContext";
import type { Match as SimMatch } from "@/lib/sim/types";
import { colors as simColors } from "@/lib/sim/colors";
import { useThemeMode } from "@/lib/sim/dsModeStore";
import { getLastSelectedSport, setLastSelectedSport } from "@/lib/sim/sportsCarouselStore";
import { geist } from "@/lib/sim/geistFonts";
import { VolumeText } from "@/components/sim/VolumeText";

const pctToWidth = (a: Animated.Value) =>
  a.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });

const c = simColors;

const tapHaptic = () => {
  Haptics.selectionAsync().catch(() => {});
};

export type Team = { name: string; pct: string; color: string; initial: string; logo?: string };
export type Match = {
  league: string;
  leagueColor?: string;
  leagueLogo?: string;
  live?: { mins: string };
  teams: [Team, Team];
  draw?: { pct: string };
  vol: string;
  date: string;
  time?: string;
};
export type Section = { title: string; matches: Match[] };

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function relLuma({ r, g, b }: { r: number; g: number; b: number }): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function brightenForBar(color: string, i: number): string {
  const rgb = hexToRgb(color);
  const fallback = i === 0 ? "#ff5c6c" : "#4d8cff";
  if (!rgb) return fallback;
  if (relLuma(rgb) < 0.18) return fallback;
  return color;
}

// Pass EMPTY_LOGO when a fixture intentionally requests the neutral placeholder
// instead of its team logo.
export const EMPTY_LOGO = "__empty__";

function TeamBadge({ color, initial, logo }: { color: string; initial: string; logo?: string }) {
  if (logo === EMPTY_LOGO) {
    return <View style={[styles.logoWrap, { backgroundColor: "rgba(255,255,255,0.08)" }]} />;
  }
  if (logo) {
    return (
      <View style={styles.logoWrap}>
        <Image source={{ uri: logo }} style={styles.logoImg} resizeMode="cover" />
      </View>
    );
  }
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{initial}</Text>
    </View>
  );
}

function DrawBadge() {
  return (
    <View style={styles.drawBadge}>
      <Ionicons name="contrast" size={24} color={c.textPrimary} />
    </View>
  );
}

const pctToOdds = (pctStr: string) => {
  const p = parseFloat(pctStr) || 0;
  if (p <= 0) return "—";
  return `${(100 / p).toFixed(2)}x`;
};

function LiveOdds({ anim, style }: { anim: Animated.Value; style?: StyleProp<TextStyle> }) {
  const initial = (anim as unknown as { _value?: number })._value ?? 0;
  const [n, setN] = useState<number>(initial);
  useEffect(() => {
    const id = anim.addListener(({ value }) => setN(value));
    return () => anim.removeListener(id);
  }, [anim]);
  const label = n <= 0 ? "—" : `${(100 / n).toFixed(2)}x`;
  return <Text style={style}>{label}</Text>;
}

function StaticTeamRow({ t, i }: { t: Team; i: number }) {
  const pctNum = Math.max(0, Math.min(100, parseFloat(t.pct) || 0));
  const barColor = brightenForBar(t.color, i);
  return (
    <View style={styles.teamRow}>
      <TeamBadge color={t.color} initial={t.initial} logo={t.logo} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.teamName} numberOfLines={1}>{t.name}</Text>
        <View style={styles.teamUnderlineTrack}>
          <View
            style={[
              styles.teamUnderlineFill,
              { width: `${pctNum}%`, backgroundColor: barColor },
            ]}
          />
        </View>
      </View>
      <Text style={styles.oddsText}>{pctToOdds(t.pct)}</Text>
      <View style={styles.pctPill}>
        <Text style={styles.pctText}>{t.pct}</Text>
      </View>
    </View>
  );
}

function StaticDrawRow({ pct }: { pct: string }) {
  const pctNum = Math.max(0, Math.min(100, parseFloat(pct) || 0));
  return (
    <View style={styles.teamRow}>
      <DrawBadge />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.teamName} numberOfLines={1}>Draw</Text>
        <View style={styles.teamUnderlineTrack}>
          <View
            style={[
              styles.teamUnderlineFill,
              { width: `${pctNum}%`, backgroundColor: "#9b9b9b" },
            ]}
          />
        </View>
      </View>
      <Text style={styles.oddsText}>{pctToOdds(pct)}</Text>
      <View style={styles.pctPill}>
        <Text style={styles.pctText}>{pct}</Text>
      </View>
    </View>
  );
}

function LiveTeamRows({ teams, draw }: { teams: [Team, Team]; draw?: { pct: string } }) {
  const t0 = Math.max(1, Math.min(99, parseFloat(teams[0].pct) || 50));
  const t1 = Math.max(1, Math.min(99, parseFloat(teams[1].pct) || 50));
  const dPct = draw ? Math.max(1, Math.min(99, parseFloat(draw.pct) || 10)) : 0;
  const initials: number[] = draw ? [t0, t1, dPct] : [t0, t1];
  const odds = useLiveOdds(initials as [number, number] | [number, number, number], { preserveSum: true });
  return (
    <>
      {teams.map((t, i) => {
        const barColor = brightenForBar(t.color, i);
        return (
          <View key={t.name} style={styles.teamRow}>
            <TeamBadge color={t.color} initial={t.initial} logo={t.logo} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.teamName} numberOfLines={1}>{t.name}</Text>
              <View style={styles.teamUnderlineTrack}>
                <Animated.View
                  style={[
                    styles.teamUnderlineFill,
                    { width: pctToWidth(odds[i]), backgroundColor: barColor },
                  ]}
                />
              </View>
            </View>
            <LiveOdds anim={odds[i]} style={styles.oddsText} />
            <View style={styles.pctPill}>
              <SlotPct anim={odds[i]} style={styles.pctText} />
            </View>
          </View>
        );
      })}
      {draw ? (
        <View style={styles.teamRow}>
          <DrawBadge />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.teamName} numberOfLines={1}>Draw</Text>
            <View style={styles.teamUnderlineTrack}>
              <Animated.View
                style={[
                  styles.teamUnderlineFill,
                  { width: pctToWidth(odds[2]), backgroundColor: "#9b9b9b" },
                ]}
              />
            </View>
          </View>
          <LiveOdds anim={odds[2]} style={styles.oddsText} />
          <View style={styles.pctPill}>
            <SlotPct anim={odds[2]} style={styles.pctText} />
          </View>
        </View>
      ) : null}
    </>
  );
}

export function MatchCard({ m }: { m: Match }) {
  const router = useRouter();
  const isLive = !!m.live;
  const isSoccer =
    /fifa|soccer|premier|serie|liga|bundesliga|cup/i.test(m.league);
  const onPress = () => {
    // Match/market detail pages are disabled in UXR pending an overhaul.
    if (getUxrMode() === "uxr") return;
    router.push({
      pathname: "/match",
      params: {
        home: m.teams[0].name,
        away: m.teams[1].name,
        homeInitial: m.teams[0].initial,
        awayInitial: m.teams[1].initial,
        homeFlag: m.teams[0].logo ?? "",
        awayFlag: m.teams[1].logo ?? "",
        homeColor: "#f7931a",
        awayColor: "#ff5c6c",
        homePct: String(parseFloat(m.teams[0].pct) || 50),
        awayPct: String(parseFloat(m.teams[1].pct) || 50),
        league: m.league,
        mins: m.live?.mins ?? "",
        vol: m.vol,
      },
    });
  };
  const card = (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {isLive ? (
          <View style={styles.liveChip}>
            <PulsingDot size={6} />
            <Text style={styles.liveText}>
              {(() => {
                const p = periodLabel(m.league, m.live!.mins.replace(/[^0-9]/g, ""));
                return p ? `Live · ${m.live!.mins} · ${p}` : `Live · ${m.live!.mins}`;
              })()}
            </Text>
          </View>
        ) : null}
        <View style={styles.leagueChip}>
          {m.leagueLogo ? (
            <Image source={{ uri: m.leagueLogo }} style={styles.leagueLogo} resizeMode="contain" />
          ) : (
            <View style={[styles.leagueDot, { backgroundColor: m.leagueColor ?? c.surface2 }]} />
          )}
          <Text style={styles.leagueChipText} numberOfLines={1}>{m.league}</Text>
        </View>
      </View>

      {isLive ? (
        <LiveTeamRows teams={m.teams} draw={m.draw} />
      ) : (
        <>
          {m.teams.map((t, i) => <StaticTeamRow key={t.name} t={t} i={i} />)}
          {m.draw ? <StaticDrawRow pct={m.draw.pct} /> : null}
        </>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <Feather name="briefcase" size={12} color={c.textMuted} />
          <VolumeText style={styles.footerText}>{formatVol(m.vol)}</VolumeText>
        </View>
        <View style={styles.footerItem}>
          <Feather name="clock" size={12} color={c.textMuted} />
          <Text style={styles.footerText}>{m.time ? `${m.date} · ${m.time}` : m.date}</Text>
        </View>
      </View>
    </View>
  );
  const wrapped = card;
  if (!isSoccer) return wrapped;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      {wrapped}
    </Pressable>
  );
}

// Feed display settings for the standard-card variant — mirrors the home feed's
// defaults so the shared StandardCard renders identically here.
const SIM_SETTINGS: FeedSettings = {
  density: "comfort",
  showFooter: true,
  footerDetail: { metadata: true, volume: true, endDate: false, outcomes: true },
  versusLayout: "sides",
  versusMode: "new",
  versusAccent: "corner",
  versusHeaderAlign: "center",
  versusVersion: "a",
  versusUpcoming: true,
  standardAccent: "corner",
  centerAccentWidth: "default",
  accentOpacity: 0.54,
  oddsUnit: "cents",
  matchLayout: "standard",
  scoreGlow: false,
  scoreGlowMode: "inPlace",
  scorerCallout: false,
  innerGlow: true,
  whiteBars: false,
  barTrack: false,
  heroSection: "none",
  sections: {
    trending: { enabled: true, count: 5 },
    sports: { enabled: true, count: 4 },
    crypto: { enabled: true, count: 4 },
    politics: { enabled: true, count: 4 },
  },
  popularPlacement: "inTrending",
  popularRows: 1,
  cardStyle: "card",
  showClaim: false,
  showPositionBanner: false,
  positionBannerPlacement: "carousel",
  showLiveGames: false,
  showActivePositions: false,
  showBtcUpDown: false,
  showTeamAvatars: true,
  standardDateInFooter: true,
  teamAvatars: "logo",
  possessionScope: "none",
  openSettings: () => {},
};

// Renders a binary market in the shared "standard card" format (stacked outcome
// rows with colored initial avatars, probability bar, % button). Maps the local
// CategoryFeed Match shape onto the sim Match shape; markets:0 hides the
// "+N outcomes" tail since these are two-outcome markets.
//
// Policy: this variant is for non-live prediction markets, so `live` is forced
// off and `m.live` is intentionally NOT mapped. In the source data `live.mins`
// (e.g. "2h") is a "starts in" hint, not an in-progress game — these markets
// have no scores. StandardCard's live path swaps the odds multiplier for a score
// column, so forcing live here keeps the odds + % button (the correct look) and
// avoids rendering empty score chips. `leagueLogo` is likewise unsupported in
// this variant (the sim card surfaces the league via leagueColor only).
function StandardMarketCard({ m }: { m: Match }) {
  const sim: SimMatch = {
    league: m.league,
    leagueColor: m.leagueColor,
    teams: [
      {
        name: m.teams[0].name,
        pct: m.teams[0].pct,
        color: m.teams[0].color,
        initial: m.teams[0].initial,
        ...(m.teams[0].logo ? { logo: m.teams[0].logo } : {}),
      },
      {
        name: m.teams[1].name,
        pct: m.teams[1].pct,
        color: m.teams[1].color,
        initial: m.teams[1].initial,
        ...(m.teams[1].logo ? { logo: m.teams[1].logo } : {}),
      },
    ],
    ...(m.draw ? { draw: m.draw } : {}),
    vol: m.vol,
    date: m.date,
    ...(m.time ? { time: m.time } : {}),
    markets: 0,
  };
  return (
    <StandardCard
      match={sim}
      live={false}
      score="aside"
      display="avatar"
      title="show"
      possession="none"
      asideCue="score"
      buttons="simple"
      buttonSize="md"
      buttonText="gray-colored"
      buttonStyle="default"
      buttonAnim="slot"
      metaStyle="filled"
      metaPlacement="bottom"
      cardPadding="12"
      animate={false}
      animStyle="border"
    />
  );
}

export function CategoryFeed({
  title,
  topTabs,
  filters,
  sections,
  initialTab,
  initialFilter,
  tabIcons,
  richTabs,
  filtersByTab,
  hideTopTabs,
  cardVariant,
  rememberSelectedCarouselItem = false,
}: {
  title: string;
  topTabs: string[];
  tabIcons?: Record<string, React.ComponentProps<typeof Ionicons>["name"]>;
  filters: string[];
  sections: Section[];
  initialTab?: string;
  initialFilter?: string;
  richTabs?: boolean;
  filtersByTab?: Record<string, string[]>;
  hideTopTabs?: boolean;
  cardVariant?: "standard";
  rememberSelectedCarouselItem?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const themeMode = useThemeMode();
  const versusMode = useVersusMode();
  const accentControls = useAccentControls();
  const versusHeaderAlign = useVersusHeaderAlign();
  const edgeFadeColor = themeMode === "light" ? simColors.bg : c.bg;
  const edgeFadeTransparent = themeMode === "light"
    ? "rgba(255,255,255,0)"
    : "rgba(0,0,0,0)";
  const simSettings = React.useMemo<FeedSettings>(() => ({ ...SIM_SETTINGS, versusMode, ...accentControls, versusHeaderAlign }), [versusMode, accentControls, versusHeaderAlign]);
  const [activeTab, setActiveTab] = useState(
    initialTab && topTabs.includes(initialTab) ? initialTab : topTabs[0],
  );
  const [activeFilter, setActiveFilter] = useState(
    initialFilter ?? (richTabs ? "Live" : filters[0]),
  );
  const [carouselTabs, setCarouselTabs] = useState(() => {
    if (!rememberSelectedCarouselItem) return topTabs;
    const remembered = getLastSelectedSport();
    return remembered && topTabs.includes(remembered)
      ? [remembered, ...topTabs.filter((tab) => tab !== remembered)]
      : topTabs;
  });
  const [tabMenuOpen, setTabMenuOpen] = useState(false);
  const [expandedTab, setExpandedTab] = useState<string | null>(null);
  const [rowVersion, setRowVersion] = useState(0);

  // Expo Router can keep the Sports route mounted while a detail page is
  // pushed. Re-read the remembered sport when the route becomes visible again
  // so the next visit promotes it without reordering the current interaction.
  const topTabsKey = topTabs.join("\u0000");
  useFocusEffect(
    React.useCallback(() => {
      if (!rememberSelectedCarouselItem) return;
      const remembered = getLastSelectedSport();
      const nextTabs = remembered && topTabs.includes(remembered)
        ? [remembered, ...topTabs.filter((tab) => tab !== remembered)]
        : topTabs;
      setCarouselTabs((current) => (
        current.length === nextTabs.length && current.every((tab, i) => tab === nextTabs[i])
          ? current
          : nextTabs
      ));
    }, [rememberSelectedCarouselItem, topTabsKey]),
  );

  const pillLayout = LinearTransition.duration(220).easing(Easing.out(Easing.cubic));
  const enterAnim = FadeIn.duration(140);
  const exitAnim = FadeOut.duration(140).easing(Easing.in(Easing.cubic));

  const scrollXRef = useRef(0);
  const sportLayoutsRef = useRef(new Map<string, { x: number; width: number }>()).current;
  const slideX = useSharedValue(0);
  const leadingSlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));
  const filterScrollX = useSharedValue(0);
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, filterScrollX.value / 24)),
  }));

  const expandTo = (s: string) => {
    const layout = sportLayoutsRef.get(s);
    let offset = 60;
    if (layout) {
      const visibleX = layout.x - scrollXRef.current;
      offset = Math.max(0, Math.min(visibleX - 16, 120));
    }
    slideX.value = offset;
    if (rememberSelectedCarouselItem) setLastSelectedSport(s);
    setActiveTab(s);
    const sf = filtersByTab?.[s] ?? filters;
    setActiveFilter(sf[0]);
    setExpandedTab(s);
    requestAnimationFrame(() => {
      slideX.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) });
    });
  };

  const collapseExpanded = () => {
    slideX.value = 0;
    setRowVersion((v) => v + 1);
    setExpandedTab(null);
    setActiveFilter("Live");
  };

  const filteredSections = sections
    .map((sec) => ({
      ...sec,
      matches: sec.matches.filter((m) => {
        if (activeFilter === "All") return true;
        if (activeFilter === "Live") return !!m.live;
        const f = activeFilter.toLowerCase();
        return m.league.toLowerCase().includes(f) || f.includes(m.league.toLowerCase());
      }),
    }))
    .filter((sec) => sec.matches.length > 0);

  const scroll = (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24, gap: 12 }}
      showsVerticalScrollIndicator={false}
    >
      {filteredSections.length === 0 ? (
        <View style={{ paddingVertical: 48, alignItems: "center" }}>
          <Text style={{ color: c.textMuted, fontFamily: geist.regular, fontSize: 14 }}>
            No matches for this filter
          </Text>
        </View>
      ) : (
        filteredSections.map((sec, si) => (
          <View key={si} style={{ gap: 12 }}>
            <Text style={[styles.sectionHeader, si > 0 && { paddingTop: 8 }]} numberOfLines={1}>{sec.title}</Text>
            {sec.matches.map((m, mi) => (
              <View key={mi} style={{ paddingHorizontal: 16 }}>
                {cardVariant === "standard" ? <StandardMarketCard m={m} /> : <MatchCard m={m} />}
              </View>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <PageHeader title={title} />

      {richTabs ? (
        expandedTab ? (
          <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 4, paddingBottom: 10 }}>
            <ReAnimated.View
              key={`leading-${expandedTab}`}
              style={[leadingSlideStyle, { paddingLeft: 16, paddingRight: 8, zIndex: 2 }]}
              entering={enterAnim}
            >
              <Pressable
                onPress={() => {
                  tapHaptic();
                  collapseExpanded();
                }}
                style={[styles.filterChip, styles.sportPill, styles.filterChipAllActive]}
              >
                <Ionicons
                  name={tabIcons?.[expandedTab] ?? "ellipse-outline"}
                  size={16}
                  color="#000"
                />
                <Text style={[styles.filterChipText, { fontSize: 14, color: "#000" }]}>
                  {expandedTab}
                </Text>
                <Feather name="x" size={14} color="#000" />
              </Pressable>
            </ReAnimated.View>
            <View style={{ flexGrow: 1, flexShrink: 1, position: "relative" }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.filterScroll, { paddingLeft: 8, paddingRight: 16 }]}
              onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
                filterScrollX.value = e.nativeEvent.contentOffset.x;
              }}
              scrollEventThrottle={16}
            >
              {(filtersByTab?.[expandedTab] ?? filters).map((f, index) => {
                const active = f === activeFilter;
                return (
                  <ReAnimated.View
                    key={`filter-${f}`}
                    entering={FadeInRight.duration(160)
                      .delay(120 + index * 28)
                      .easing(Easing.out(Easing.cubic))}
                  >
                    {f === "All" ? (
                      <Pressable
                        onPress={() => {
                          tapHaptic();
                          setActiveFilter(f);
                        }}
                        style={[
                          styles.filterChip,
                          !active && styles.filterChipFilled,
                          active && styles.filterChipAllActive,
                        ]}
                      >
                        <Text style={[styles.filterChipText, active && { color: "#000" }]}>{f}</Text>
                      </Pressable>
                    ) : f === "Live" ? (
                      <Pressable
                        onPress={() => {
                          tapHaptic();
                          setActiveFilter(f);
                        }}
                        style={[styles.filterChip, active && styles.filterChipAllActive]}
                      >
                        <PulsingDot size={6} color={c.green} />
                   <Text style={[styles.filterChipText, { color: active ? "#fff" : c.green }]}>{f}</Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={() => {
                          tapHaptic();
                          setActiveFilter(f);
                        }}
                        style={[
                          styles.filterChip,
                          styles.filterChipFilled,
                          active && styles.filterChipAllActive,
                        ]}
                      >
                 <Text style={[styles.filterChipText, { color: active ? "#fff" : FILTER_CHIP_INACTIVE_TEXT }]}>{f}</Text>
                      </Pressable>
                    )}
                  </ReAnimated.View>
                );
              })}
            </ScrollView>
            <ReAnimated.View
              pointerEvents="none"
              style={[
                { position: "absolute", left: 0, top: 0, bottom: 0, width: 24, zIndex: 1 },
                fadeStyle,
              ]}
            >
              <LinearGradient
                colors={[edgeFadeColor, edgeFadeTransparent]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ flex: 1 }}
              />
            </ReAnimated.View>
            </View>
          </View>
        ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={[styles.filterScroll, { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10 }]}
          onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
            scrollXRef.current = e.nativeEvent.contentOffset.x;
          }}
          scrollEventThrottle={16}
        >
          {(() => {
            type Item =
              | { kind: "live" }
              | { kind: "sport"; name: string };
            const items: Item[] = [
              { kind: "live" },
              ...carouselTabs.map((s) => ({ kind: "sport" as const, name: s })),
            ];

            return items.map((item) => {
              if (item.kind === "live") {
                return (
                  <ReAnimated.View
                    key={`live-${rowVersion}`}
                    layout={pillLayout}
                    entering={enterAnim}
                    exiting={exitAnim}
                  >
                    <Pressable
                      onPress={() => {
                        tapHaptic();
                        setActiveFilter("Live");
                      }}
                      style={[
                        styles.filterChip,
                        styles.sportPill,
                        activeFilter === "Live" && styles.filterChipAllActive,
                      ]}
                    >
                      <PulsingDot size={7} color={c.green} />
                      <Text
                        style={[
                          styles.filterChipText,
                          { fontSize: 14, color: activeFilter === "Live" ? "#000" : c.green },
                        ]}
                      >
                        Live
                      </Text>
                    </Pressable>
                  </ReAnimated.View>
                );
              }
              if (item.kind === "sport") {
                const s = item.name;
                const isExpanded = expandedTab === s;
                const activeOutline = !isExpanded && s === activeTab && activeFilter !== "Live";
                return (
                  <ReAnimated.View
                    key={`sport-${s}-${rowVersion}`}
                    layout={isExpanded ? undefined : pillLayout}
                    entering={enterAnim}
                    exiting={exitAnim}
                    style={isExpanded ? leadingSlideStyle : undefined}
                    onLayout={(e: LayoutChangeEvent) => {
                      if (!isExpanded) {
                        sportLayoutsRef.set(s, {
                          x: e.nativeEvent.layout.x,
                          width: e.nativeEvent.layout.width,
                        });
                      }
                    }}
                  >
                    <Pressable
                      onPress={() => {
                        tapHaptic();
                        if (isExpanded) collapseExpanded();
                        else expandTo(s);
                      }}
                      style={[
                        styles.filterChip,
                        styles.sportPill,
                        (isExpanded || activeOutline) && styles.filterChipAllActive,
                      ]}
                    >
                      <Ionicons
                        name={tabIcons?.[s] ?? "ellipse-outline"}
                        size={16}
                        color={isExpanded || activeOutline ? "#000" : c.textMuted}
                      />
                      <Text
                        style={[
                          styles.filterChipText,
                          {
                            fontSize: 14,
                            color: isExpanded || activeOutline ? "#000" : c.textMuted,
                          },
                        ]}
                      >
                        {s}
                      </Text>
                      {isExpanded && <Feather name="x" size={14} color="#000" />}
                    </Pressable>
                  </ReAnimated.View>
                );
              }
              return null;
            });
          })()}
        </ScrollView>
        )
      ) : (
      <View style={styles.filterBar}>
        {hideTopTabs ? null : (
          <>
            <Pressable
              onPress={() => setTabMenuOpen((v) => !v)}
              style={[styles.filterChip, styles.sportPill]}
            >
              <Ionicons
                name={tabIcons?.[activeTab] ?? "ellipse-outline"}
                size={16}
                color="#fff"
              />
              <Text style={[styles.filterChipText, { color: "#fff", fontSize: 14 }]}>{activeTab}</Text>
              <Feather name="chevron-down" size={14} color={c.textMuted} />
            </Pressable>
            <View style={styles.divider} />
          </>
        )}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.filterScroll, hideTopTabs && { paddingRight: 16 }]}
        >
          {filters.map((f) => {
            const active = f === activeFilter;
            if (f === "All") {
              return (
                <Pressable
                  key={f}
                  onPress={() => setActiveFilter(f)}
                  style={[styles.filterChip, active && styles.filterChipAllActive]}
                >
                  <Text style={[styles.filterChipText, active && { color: "#000" }]}>{f}</Text>
                </Pressable>
              );
            }
            if (f === "Live") {
              return (
                <Pressable
                  key={f}
                  onPress={() => setActiveFilter(f)}
                  style={[styles.filterChip, active && styles.filterChipAllActive]}
                >
                  <PulsingDot size={6} color={c.green} />
                  <Text style={[styles.filterChipText, { color: active ? "#000" : c.green }]}>{f}</Text>
                </Pressable>
              );
            }
            return (
              <Pressable
                key={f}
                onPress={() => setActiveFilter(f)}
                style={[styles.filterChip, active && styles.filterChipAllActive]}
              >
                <Text style={[styles.filterChipText, active && { color: "#000" }]}>{f}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      )}

      {tabMenuOpen ? (
        <>
          <Pressable style={styles.tabMenuBackdrop} onPress={() => setTabMenuOpen(false)} />
          <View style={styles.tabMenu}>
            {topTabs.map((s) => {
              const active = s === activeTab;
              return (
                <Pressable
                  key={s}
                  onPress={() => {
                    setActiveTab(s);
                    setTabMenuOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.tabMenuItem,
                    pressed && { backgroundColor: c.surface2 },
                  ]}
                >
                  <Text style={[styles.tabMenuText, active && { color: "#fff" }]}>{s}</Text>
                  {active ? <Feather name="check" size={14} color="#fff" /> : null}
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      {cardVariant === "standard" ? (
        <FeedSettingsProvider value={simSettings}>
          <LiveTickProvider>
            <LiveCueColorProvider cue="red">{scroll}</LiveCueColorProvider>
          </LiveTickProvider>
        </FeedSettingsProvider>
      ) : (
        scroll
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filterBar: {
    flexDirection: "row", alignItems: "center",
    paddingLeft: 16, paddingTop: 4, paddingBottom: 10,
    gap: 8,
  },
  filterScroll: { gap: 8, paddingRight: 16 },
  sportPill: { paddingLeft: 10, paddingRight: 10, gap: 8 },
  divider: { width: 1, height: 22, backgroundColor: c.surface2 },
  tabMenuBackdrop: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9,
  },
  tabMenu: {
    position: "absolute", top: 96, left: 16, zIndex: 10,
    backgroundColor: c.surface, borderRadius: 12,
    borderWidth: 1, borderColor: c.surface2,
    paddingVertical: 6, minWidth: 160,
    shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  tabMenuItem: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 10,
  },
  tabMenuText: { color: c.textMuted, fontFamily: geist.medium, fontSize: 14 },
  filterChip: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingHorizontal: 12, height: 40,
     borderRadius: 12, backgroundColor: "transparent",
  },
   filterChipAllActive: { backgroundColor: FILTER_CHIP_ACTIVE_BG },
  filterChipFilled: { backgroundColor: c.surface },
  filterChipText: { color: "#fff", fontFamily: geist.medium, fontSize: 14, lineHeight: 22 },
  sectionHeader: {
    color: "#9b9b9b", fontFamily: geist.medium, fontSize: 14, lineHeight: 22,
    paddingHorizontal: 16, paddingTop: 0, paddingBottom: 0,
  },
  card: {
    backgroundColor: c.surface, borderRadius: 14, padding: 12, gap: 10,
    borderWidth: 1, borderColor: "transparent",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.liveYellow },
  liveText: { color: c.liveYellow, fontFamily: geist.medium, fontSize: 11 },
  liveChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: c.surface2, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  leagueChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: c.tagSurface, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  leagueDot: { width: 10, height: 10, borderRadius: 2 },
  leagueChipText: { color: c.textMuted, fontFamily: geist.medium, fontSize: 11 },
  teamRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  badge: {
    width: 28, height: 28, borderRadius: 6, alignItems: "center", justifyContent: "center",
  },
  badgeText: { color: "#fff", fontFamily: geist.semibold, fontSize: 12 },
  drawBadge: {
    width: 32, height: 32, alignItems: "center", justifyContent: "center",
  },
  logoWrap: { width: 28, height: 28, borderRadius: 4, overflow: "hidden" },
  logoImg: { width: 28, height: 28 },
  leagueLogo: { width: 12, height: 12 },
  teamName: { color: "#fff", fontFamily: geist.medium, fontSize: 15 },
  teamUnderlineTrack: {
    height: 1.5, width: 120, marginTop: 4, borderRadius: 1,
    backgroundColor: c.surface2, overflow: "hidden",
  },
  teamUnderlineFill: { height: "100%", borderRadius: 1 },
  pctPill: {
    minWidth: 56, paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: c.surface2, borderRadius: 8, alignItems: "center",
  },
  pctText: { color: "#fff", fontFamily: geist.medium, fontSize: 14 },
  oddsText: { color: c.textMuted, fontFamily: geist.medium, fontSize: 13, marginRight: 4 },
  cardFooter: {
    flexDirection: "row", justifyContent: "space-between", paddingTop: 6,
  },
  footerItem: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 6 },
  footerText: { color: c.textMuted, fontFamily: geist.medium, fontSize: 12 },
});
