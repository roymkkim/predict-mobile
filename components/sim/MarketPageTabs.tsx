import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import Svg, { Circle, Path } from "react-native-svg";
import {
  FilterButton,
  FilterButtonGroup,
  FilterButtonSize,
  FilterButtonVariant,
  Tag,
  TagSeverity,
} from "@metamask/design-system-react-native";

import { colors } from "@/lib/sim/colors";
import { useThemeMode } from "@/lib/sim/dsModeStore";
import { LiveDot } from "@/components/sim/Crest";
import { DetailSectionHeading, filterMarketPositions } from "@/components/sim/MatchPositionsSection";
import { type ShareableTrade } from "@/components/sim/ShareableTradeCard";
import { SocialAvatar } from "@/components/sim/SocialAvatar";
import { SocialFeedPost } from "@/components/sim/SocialFeedPost";
import { stickyChromeStyle } from "@/components/sim/StickyDetailScroll";
import { TabsBar, type TabItem } from "@/components/mm-proposal/tabs";
import { usePlacedPositions } from "@/lib/sim/positionsStore";
import { useSocialFeed } from "@/lib/sim/socialFeedStore";
import { useSocialTour } from "@/lib/sim/socialTourStore";
import { useSocialUx } from "@/lib/sim/socialUxStore";
import { geist } from "@/lib/sim/geistFonts";
import { FILTER_CHIP_STYLE } from "@/components/mm-proposal/SportsNavChrome";
import { LiveChatComposer, MarketLiveChat } from "@/components/sim/MarketLiveChat";
import { MarketAboutContent, SectionRule } from "@/components/sim/MarketRulesSection";
import { useMarketRulesStyle } from "@/lib/sim/marketRulesStore";
import { slidesMarketTab } from "@/lib/sim/slidesDemo";

export type MarketPageTab = "predict" | "about" | "positions" | "social" | "chat" | "live";

function MarketSocialBlock({ market, footerReserve = 0 }: { market: string; footerReserve?: number }) {
  const [pane, setPane] = useState<"feed" | "chat">("feed");
  return (
    <>
      <DetailSectionHeading marginTop={0}>Social</DetailSectionHeading>
      <FilterButtonGroup
        value={pane}
        variant={FilterButtonVariant.Secondary}
        onChange={(value) => setPane(value === "chat" ? "chat" : "feed")}
        style={{ flexGrow: 0 }}
        twClassName="px-4 pt-3"
      >
        <FilterButton value="feed" size={FilterButtonSize.Md} style={FILTER_CHIP_STYLE}>
          Feed
        </FilterButton>
        <FilterButton value="chat" size={FilterButtonSize.Md} style={FILTER_CHIP_STYLE}>
          Live chat
        </FilterButton>
      </FilterButtonGroup>
      {pane === "chat" ? (
        <>
          <LiveChatComposer market={market} footerReserve={footerReserve} />
          <MarketLiveChat market={market} footerReserve={footerReserve} />
        </>
      ) : (
        <MarketSocialFeed market={market} />
      )}
    </>
  );
}

export function hrefWithTab(href: string, tab: MarketPageTab) {
  if (/[?&]tab=/.test(href)) return href.replace(/([?&]tab=)[^&]*/, `$1${tab}`);
  return `${href}${href.includes("?") ? "&" : "?"}tab=${tab}`;
}

function parseTab(value?: string): MarketPageTab | undefined {
  return value === "predict" || value === "about" || value === "positions" || value === "social" || value === "chat" || value === "live"
    ? value
    : undefined;
}

const TABS: { id: MarketPageTab; label: string; live?: boolean }[] = [
  { id: "predict", label: "Markets" },
  { id: "positions", label: "Positions" },
  { id: "social", label: "Social feed" },
  { id: "chat", label: "Live chat" },
  { id: "live", label: "Live trade", live: true },
];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Official Material Symbols `mark_chat_unread` (opsz24 FILL0). Only the notch dot pulses. */
function LiveChatTabIcon({ active }: { active: boolean }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const ease = Easing.inOut(Easing.ease);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.28, duration: 1100, easing: ease, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: ease, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const iconColor = active ? colors.textPrimary : colors.textMuted;
  return (
    <View style={{ width: 18, height: 18, flexShrink: 0 }}>
      <Svg width={18} height={18} viewBox="0 -960 960 960">
        <Path
          fill={iconColor}
          d="M80-80v-720q0-33 23.5-56.5T160-880h404q-4 20-4 40t4 40H160v525l46-45h594v-324q23-5 43-13.5t37-22.5v360q0 33-23.5 56.5T800-240H240L80-80Zm80-720v480-480Z"
        />
        <AnimatedCircle cx={720} cy={-800} r={108} fill={iconColor} opacity={pulse} />
      </Svg>
    </View>
  );
}

export function MarketPageTabs({
  value,
  onChange,
  tabs = TABS,
  stickyTop = 0,
  stickyExtra,
}: {
  value: MarketPageTab;
  onChange: (tab: MarketPageTab) => void;
  tabs?: { id: MarketPageTab; label: string; live?: boolean }[];
  stickyTop?: number;
  stickyExtra?: ReactNode;
}) {
  useThemeMode();
  const items: TabItem[] = tabs.map((tab) => ({
    key: tab.id,
    label: tab.label,
    tourId:
      tab.id === "social" ? "tour-social-tab" : tab.id === "chat" ? "tour-chat-tab" : tab.id === "live" ? "tour-live-tab" : undefined,
    leading:
      tab.id === "chat" ? (
        <LiveChatTabIcon active={value === "chat"} />
      ) : tab.live ? (
        <LiveDot color={colors.green} size={7} pulse />
      ) : undefined,
  }));
  const activeIndex = Math.max(0, tabs.findIndex((t) => t.id === value));
  return (
    <>
      <View style={{ height: 20 }} />
      <View style={stickyChromeStyle(stickyTop)}>
        <TabsBar
          tabs={items}
          activeIndex={activeIndex}
          onTabPress={(index) => {
            const next = tabs[index];
            if (next) onChange(next.id);
          }}
          scrollable
        />
        <View style={{ height: 1, backgroundColor: colors.cardBorder, marginTop: 8 }} />
        {stickyExtra}
      </View>
    </>
  );
}

export function MarketPageBody({
  marketTitle,
  predict,
  positions,
  hidePredictHeading,
  predictHeading = "Markets",
  positionNames,
  rules,
  stickyTop = 0,
  footerReserve = 0,
}: {
  marketTitle: string;
  predict: ReactNode;
  positions: (opts: { tabbed: boolean }) => ReactNode;
  hidePredictHeading?: boolean;
  predictHeading?: string;
  positionNames?: string[];
  rules?: ReactNode;
  stickyTop?: number;
  footerReserve?: number;
}) {
  const socialUx = useSocialUx();
  const rulesStyle = useMarketRulesStyle();
  const showAbout = rulesStyle === "about";
  const placed = usePlacedPositions();
  const hasPositions = filterMarketPositions(placed, positionNames ?? [], marketTitle).length > 0;
  const hidePredictTab = !!hidePredictHeading;
  const visibleTabs = useMemo(() => {
    const tabs = TABS.filter((t) => {
      if (t.id === "predict" && hidePredictTab) return false;
      if (t.id === "positions" && !hasPositions) return false;
      if (!socialUx && (t.id === "social" || t.id === "chat" || t.id === "live")) return false;
      return true;
    }).map((t) => (t.id === "predict" ? { ...t, label: predictHeading } : t));
    if (!showAbout) return tabs;
    return [...tabs, { id: "about" as const, label: "About" }];
  }, [hasPositions, hidePredictTab, predictHeading, showAbout, socialUx]);
  const fallbackTab: MarketPageTab = hidePredictTab
    ? socialUx
      ? "social"
      : showAbout
        ? "about"
        : hasPositions
          ? "positions"
          : "predict"
    : "predict";
  const allowed = (id: MarketPageTab) => visibleTabs.some((t) => t.id === id);
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string | string[] }>();
  const tabFromRoute =
    parseTab(typeof tabParam === "string" ? tabParam : Array.isArray(tabParam) ? tabParam[0] : undefined) ??
    slidesMarketTab() ??
    undefined;
  const [tab, setTab] = useState<MarketPageTab>(() => (tabFromRoute && allowed(tabFromRoute) ? tabFromRoute : fallbackTab));
  const tour = useSocialTour();
  useEffect(() => {
    if (tabFromRoute && allowed(tabFromRoute)) setTab(tabFromRoute);
  }, [tabFromRoute]);
  useEffect(() => {
    if (!tour.active) return;
    if (tour.stepId === "socialFeed") {
      if (allowed("social")) setTab("social");
    }
    if (tour.stepId === "liveChat") {
      if (allowed("chat")) setTab("chat");
    }
    if (tour.stepId === "liveTrades") {
      if (allowed("live")) setTab("live");
    }
  }, [tour.active, tour.stepId]);
  useEffect(() => {
    if (!allowed(tab)) setTab(fallbackTab);
  }, [hasPositions, hidePredictTab, showAbout, socialUx, tab]);

  const slidesTab = slidesMarketTab();
  if (rulesStyle === "section" && !slidesTab) {
    const blocks: ReactNode[] = [];
    if (rules) blocks.push(rules);
    if (hasPositions) blocks.push(positions({ tabbed: false }));
    if (!hidePredictHeading) {
      blocks.push(
        <>
          <DetailSectionHeading marginTop={0}>{predictHeading}</DetailSectionHeading>
          {predict}
        </>,
      );
    }
    if (socialUx) blocks.push(<MarketSocialBlock market={marketTitle} footerReserve={footerReserve} />);
    return (
      <>
        {blocks.map((block, i) => (
          <Fragment key={i}>
            {i > 0 || !rules ? <SectionRule /> : null}
            {block}
          </Fragment>
        ))}
      </>
    );
  }

  return (
    <>
      {hidePredictTab && rulesStyle !== "about" ? rules : null}
      {visibleTabs.length > 0 ? (
        <MarketPageTabs
          value={tab}
          onChange={setTab}
          tabs={visibleTabs}
          stickyTop={stickyTop}
        />
      ) : null}
      {tab === "chat" ? <LiveChatComposer market={marketTitle} footerReserve={footerReserve} /> : null}
      {tab === "predict" ? (
        <>
          {predict}
          {rulesStyle === "about" ? null : rules}
        </>
      ) : null}
      {tab === "about" ? rules ?? <MarketAboutContent subject={marketTitle} /> : null}
      {tab === "positions" ? positions({ tabbed: true }) : null}
      {tab === "social" ? <MarketSocialFeed market={marketTitle} /> : null}
      {tab === "chat" ? <MarketLiveChat market={marketTitle} footerReserve={footerReserve} /> : null}
      {tab === "live" ? <MarketLiveTape market={marketTitle} /> : null}
    </>
  );
}

function MarketSocialFeed({ market }: { market: string }) {
  const { post: focusPost } = useLocalSearchParams<{ post?: string | string[] }>();
  const focusId = typeof focusPost === "string" ? focusPost : Array.isArray(focusPost) ? focusPost[0] : undefined;
  const posted = useSocialFeed();
  const mine = posted.filter(
    (p) =>
      p.id === focusId ||
      !market ||
      marketsOverlap(p.market, market) ||
      (p.title ?? "").toLowerCase().includes(market.toLowerCase()),
  );
  const demos = useMemo(() => demoPosts(market), [market]);
  const items: ShareableTrade[] = [
    ...mine.map((p) => ({
      id: p.id,
      market: p.market,
      title: p.title,
      cost: p.cost,
      toWin: p.toWin,
      logo: p.logo,
      flag: p.flag,
      caption: p.caption,
      gifUrl: p.gifUrl,
      author: "you",
      timeLabel: "just now",
    })),
    ...demos,
  ];
  if (items.length === 0) {
    return (
      <View nativeID="slides-social-feed" style={{ padding: 32, alignItems: "center" }}>
        <Text style={{ color: colors.textMuted, fontFamily: geist.regular, fontSize: 14 }}>No posts yet</Text>
      </View>
    );
  }
  return (
    <View nativeID="slides-social-feed" style={{ paddingHorizontal: 16, paddingTop: 16, gap: 22, paddingBottom: 24 }}>
      {items.map((trade, i) => (
        <SocialFeedPost
          key={trade.id ?? `${trade.author ?? "you"}-${i}`}
          trade={trade}
          tourHighlight={i === 0}
          focus={!!focusId && trade.id === focusId}
        />
      ))}
    </View>
  );
}

function marketsOverlap(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  const norm = (s: string) => s.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
  const na = norm(a);
  const nb = norm(b);
  return na.includes(nb) || nb.includes(na);
}

function demoPosts(market: string): ShareableTrade[] {
  const slug = market.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24);
  const up = /btc|bitcoin|eth|up or down/i.test(market);
  return [
    {
      id: `demo-${slug}-0`,
      market,
      title: up ? "Up" : "Yes",
      cost: 25,
      toWin: 41.5,
      caption: "This one's going places 🚀",
      author: "Cented",
      timeLabel: "20 min ago",
    },
    {
      id: `demo-${slug}-1`,
      market,
      title: up ? "Down" : "No",
      cost: 12,
      toWin: 19.2,
      caption: "fade",
      author: "0x8f2a",
      timeLabel: "1 hr ago",
    },
  ];
}

type TapeRow = {
  id: string;
  user: string;
  side: string;
  amount: string;
  cents: number;
  ago: string;
  whale: boolean;
};

function tapeWash(buy: boolean, whale: boolean): string {
  if (buy) return whale ? "rgba(186,242,74,0.22)" : "rgba(186,242,74,0.12)";
  return whale ? "rgba(255,117,132,0.22)" : "rgba(255,117,132,0.12)";
}

function TapePrint({ row, first, animate }: { row: TapeRow; first: boolean; animate: boolean }) {
  const buy = /up|yes/i.test(row.side);
  const tint = buy ? colors.green : colors.red;
  const opacity = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const slide = useRef(new Animated.Value(animate ? -14 : 0)).current;
  const pop = useRef(new Animated.Value(animate ? (row.whale ? 0.72 : 0.86) : 1)).current;
  const wash = useRef(new Animated.Value(animate ? 1 : 0)).current;

  useEffect(() => {
    if (!animate) return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(pop, { toValue: 1, friction: 8, tension: 120, useNativeDriver: true }),
    ]).start();
    Animated.timing(wash, {
      toValue: 0,
      duration: row.whale ? 1100 : 700,
      delay: 80,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [animate, opacity, pop, row.whale, slide, wash]);

  return (
    <Animated.View
      style={{
        backgroundColor: wash.interpolate({
          inputRange: [0, 1],
          outputRange: ["rgba(0,0,0,0)", tapeWash(buy, row.whale)],
        }),
      }}
    >
      <Animated.View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderTopWidth: first ? 0 : 1,
          borderTopColor: "rgba(255,255,255,0.08)",
          opacity,
          transform: [{ translateY: slide }],
        }}
      >
        <SocialAvatar seed={row.user} size="md" tappable />
        <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ fontFamily: geist.medium, fontSize: 15, color: colors.textPrimary }} numberOfLines={1}>
              {row.user}
            </Text>
            <Tag severity={buy ? TagSeverity.Success : TagSeverity.Danger}>{row.side}</Tag>
            <Text style={{ fontFamily: geist.regular, fontSize: 13, color: colors.textMuted }}>{row.ago}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Animated.Text
              style={{
                fontFamily: geist.bold,
                fontSize: 16,
                lineHeight: 20,
                color: tint,
                transform: [{ scale: pop }],
              }}
            >
              {row.amount}
            </Animated.Text>
            <Text style={{ fontFamily: geist.regular, fontSize: 16, lineHeight: 20, color: colors.textMuted }}>at</Text>
            <Text style={{ fontFamily: geist.medium, fontSize: 16, lineHeight: 20, color: colors.textPrimary }}>{row.cents}¢</Text>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function MarketLiveTape({ market }: { market: string }) {
  const [rows, setRows] = useState<TapeRow[]>(() => seedTape(market));
  const seen = useRef(new Set(rows.map((r) => r.id)));

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;
    const loop = () => {
      timer = setTimeout(() => {
        if (cancelled) return;
        setRows((prev) => [nextTape(market, true), ...prev].slice(0, 16));
        loop();
      }, 1700 + Math.round(Math.random() * 1800));
    };
    loop();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [market]);

  return (
    <View nativeID="slides-live-tape" style={{ paddingTop: 4 }}>
      {rows.map((row, i) => {
        const animate = !seen.current.has(row.id);
        if (animate) seen.current.add(row.id);
        return <TapePrint key={row.id} row={row} first={i === 0} animate={animate} />;
      })}
    </View>
  );
}

function seedTape(market: string): TapeRow[] {
  return Array.from({ length: 8 }, () => nextTape(market, false));
}

const TAPE_USERS = ["Cented", "jijo25", "wugi95", "pengu-whale", "nova4", "kite88", "orbit", "0x8f2a", "minty"];

let tapeSeq = 0;
function nextTape(market: string, live: boolean): TapeRow {
  const up = /btc|bitcoin|eth|up or down/i.test(market);
  const sides = up ? ["Up", "Down"] : ["Yes", "No"];
  const side = sides[Math.floor(Math.random() * sides.length)];
  const raw = [12, 48, 96, 180, 420, 960, 1200, 4500, 12000][Math.floor(Math.random() * 9)];
  const whale = raw >= 1000;
  const amount = whale ? `$${(raw / 1000).toFixed(raw >= 10000 ? 0 : 1).replace(/\.0$/, "")}K` : `$${raw}`;
  const cents = 22 + Math.round(Math.random() * 56);
  tapeSeq += 1;
  const agoSec = live ? 0 : 1 + (tapeSeq % 90);
  return {
    id: `tape-${tapeSeq}-${Date.now()}`,
    user: TAPE_USERS[tapeSeq % TAPE_USERS.length],
    side,
    amount,
    cents,
    ago: agoSec === 0 ? "now" : agoSec < 60 ? `${agoSec}s` : `${Math.round(agoSec / 60)}m`,
    whale,
  };
}
