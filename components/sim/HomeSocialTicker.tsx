import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useRouter, type Href } from "expo-router";
import {
  Button,
  ButtonSize,
  ButtonVariant,
  IconName,
} from "@metamask/design-system-react-native";

import { hrefWithTab } from "@/components/sim/MarketPageTabs";
import { PositionAvatar } from "@/components/sim/PositionAvatar";
import { SectionHeader } from "@/components/sim/FeedChrome";
import { SocialAvatar } from "@/components/sim/SocialAvatar";
import { TourAnchor } from "@/components/sim/TourAnchor";
import { TradeTicket } from "@/components/sim/TradeTicket";
import { NFL, PRESS_SECRETARY_MARKET, SPURS_KNICKS } from "@/lib/sim/data";
import { colors } from "@/lib/sim/colors";
import { geist } from "@/lib/sim/geistFonts";
import { openBetSlip } from "@/lib/sim/betSlipStore";
import { inferDetailHref, matchDetailHref } from "@/lib/sim/marketRoutes";
import { useHomeSocialStyle } from "@/lib/sim/homeSocialStyleStore";
import { isSelfAuthor, profileFor } from "@/lib/sim/socialProfiles";
import { toggleFollow, useFollowing } from "@/lib/sim/socialFollowStore";
import { useSocialFeed, type SocialPost } from "@/lib/sim/socialFeedStore";
import { useSocialUx } from "@/lib/sim/socialUxStore";
import { getSlidesKind } from "@/lib/sim/slidesDemo";

const BTC_MARKET = "BTC Up or Down 5m";
const PRESS_MARKET = PRESS_SECRETARY_MARKET.question;
const SPURS_MARKET = `${SPURS_KNICKS.teams[0].name} vs ${SPURS_KNICKS.teams[1].name}`;
const NFL_MARKET = `${NFL.teams[0].name} vs ${NFL.teams[1].name}`;
const ALVAREZ_MARKET = "Julian Alvarez: Next Club";
const ARSENAL_LOGO = "https://a.espncdn.com/i/teamlogos/soccer/500/359.png";
const PRESS_AVATAR_URI =
  PRESS_SECRETARY_MARKET.avatar && typeof PRESS_SECRETARY_MARKET.avatar === "object" && "uri" in PRESS_SECRETARY_MARKET.avatar
    ? PRESS_SECRETARY_MARKET.avatar.uri
    : undefined;

const CARD_H = 108;
const DWELL_MS = 4000;
const SLIDE_MS = 320;

export type HomeSocialTickerItem = {
  id: string;
  author: string;
  timeLabel: string;
  caption: string;
  market: string;
  logo?: string;
  outcome?: string;
  cost?: number;
  toWin?: number;
  value?: number;
  accent?: string;
};

const SEEDED: HomeSocialTickerItem[] = [
  {
    id: "home-social-alvarez",
    author: "orbit",
    timeLabel: "3d ago",
    caption: "After Barcelona signs another striker, Alvarez starts looking at Arsenal…",
    market: ALVAREZ_MARKET,
    outcome: "Arsenal",
    logo: ARSENAL_LOGO,
    cost: 28.92,
    toWin: 576.77,
    value: 51.9,
    accent: "#ef0107",
  },
  {
    id: "home-social-btc-cented",
    author: "Cented",
    timeLabel: "20 min ago",
    caption: "This one's going places 🚀",
    market: BTC_MARKET,
    outcome: "Up",
    cost: 12.4,
    toWin: 41.5,
    value: 18.72,
    accent: colors.green,
  },
  {
    id: "home-social-press-jennings",
    author: "0x8f2a",
    timeLabel: "1 hr ago",
    caption: "Jennings is locked. Fade the field.",
    market: PRESS_MARKET,
    logo: PRESS_AVATAR_URI,
    outcome: "Scott Jennings",
    cost: 35,
    toWin: 100,
    value: 42.1,
    accent: colors.accent,
  },
  {
    id: "home-social-spurs",
    author: "jijo25",
    timeLabel: "2 hr ago",
    caption: "Spurs never trailing this quarter",
    market: SPURS_MARKET,
    logo: SPURS_KNICKS.teams[0].logo,
    outcome: "Spurs",
    cost: 94,
    toWin: 100,
    value: 96.4,
    accent: SPURS_KNICKS.teams[0].color,
  },
  {
    id: "home-social-btc-fade",
    author: "pengu-whale",
    timeLabel: "3 hr ago",
    caption: "Fading the bounce — Down",
    market: BTC_MARKET,
    outcome: "Down",
    cost: 8.15,
    toWin: 30.2,
    value: 6.08,
    accent: colors.red,
  },
  {
    id: "home-social-press-kelly",
    author: "wugi95",
    timeLabel: "4 hr ago",
    caption: "Anna Kelly catching late bids",
    market: PRESS_MARKET,
    logo: PRESS_AVATAR_URI,
    outcome: "Anna Kelly",
    cost: 18,
    toWin: 75,
    value: 22.4,
    accent: colors.green,
  },
  {
    id: "home-social-nfl",
    author: "nova4",
    timeLabel: "5 hr ago",
    caption: "Chiefs cover, easy money",
    market: NFL_MARKET,
    logo: NFL.teams[0].logo,
    outcome: "Chiefs",
    cost: 61,
    toWin: 100,
    value: 68.2,
    accent: NFL.teams[0].color,
  },
];

function relativeTime(createdAt: number): string {
  const sec = Math.max(1, Math.round((Date.now() - createdAt) / 1000));
  if (sec < 45) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  return `${Math.round(hr / 24)}d ago`;
}

function compactTime(label: string): string {
  if (label === "just now") return "now";
  const min = label.match(/(\d+)\s*min/);
  if (min) return `${min[1]}m`;
  const hr = label.match(/(\d+)\s*hr/);
  if (hr) return `${hr[1]}h`;
  const day = label.match(/(\d+)\s*d/);
  if (day) return `${day[1]}d`;
  return label;
}

function hrefForMarket(market: string): string {
  if (/spurs/i.test(market) && /knicks/i.test(market)) return matchDetailHref(SPURS_KNICKS);
  if (/chiefs/i.test(market) && /bills/i.test(market)) return matchDetailHref(NFL);
  return inferDetailHref(market) ?? "/btc-updown";
}

function fromUserPost(p: SocialPost): HomeSocialTickerItem {
  const outcome = (p.title ?? "").split(" \u00b7 ")[0].trim() || "Yes";
  const bearish = /^(down|no|short)$/i.test(outcome);
  const cost = p.cost || 0;
  const toWin = p.toWin || 0;
  return {
    id: p.id,
    author: "you",
    timeLabel: relativeTime(p.createdAt),
    caption: p.caption || p.title,
    market: p.market || p.title,
    logo: p.logo,
    outcome,
    cost,
    toWin,
    value: Math.round(cost * (bearish ? 0.72 : 1.79) * 100) / 100,
    accent: bearish ? colors.red : colors.green,
  };
}

function shortMarketLabel(market: string): string {
  if (/btc/i.test(market) && /up or down/i.test(market)) return "BTC Up or Down 5m";
  if (/press secretary/i.test(market)) return "Press Secretary";
  return market;
}

function TickerRow({ item }: { item: HomeSocialTickerItem }) {
  return (
    <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12, padding: 16 }}>
      <SocialAvatar seed={item.author} size="md" showPlus={false} />
      <View style={{ flex: 1, minWidth: 0, gap: 12 }}>
        <View style={{ gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
            <Text style={{ fontFamily: geist.medium, fontSize: 14, lineHeight: 18, color: colors.textPrimary }} numberOfLines={1}>
              {item.author}
            </Text>
            <Text style={{ fontFamily: geist.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted }} numberOfLines={1}>
              {item.timeLabel}
            </Text>
          </View>
          <Text style={{ fontFamily: geist.regular, fontSize: 14, lineHeight: 18, color: colors.textPrimary }} numberOfLines={1}>
            {item.caption}
          </Text>
        </View>
        <View
          style={{
            alignSelf: "flex-start",
            maxWidth: "100%",
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            height: 24,
            paddingHorizontal: 8,
            borderRadius: 8,
            backgroundColor: colors.surface2,
          }}
        >
          <PositionAvatar market={item.market} logo={item.logo} size={16} />
          <Text style={{ flexShrink: 1, fontFamily: geist.medium, fontSize: 12, lineHeight: 16, color: colors.textAlternative }} numberOfLines={1}>
            {shortMarketLabel(item.market)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function FollowChip({ author }: { author: string }) {
  const profileId = profileFor(author).id;
  const following = useFollowing(profileId);
  if (isSelfAuthor(author)) return null;
  return (
    <Button
      variant={ButtonVariant.Secondary}
      size={ButtonSize.Sm}
      onPress={() => toggleFollow(profileId)}
      accessibilityLabel={following ? "Following" : `Follow ${author}`}
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}

function copyTradeFromItem(item: HomeSocialTickerItem) {
  const outcome = item.outcome?.trim() || "Yes";
  const bearish = /^(down|no|short)$/i.test(outcome);
  const oddsCents =
    item.toWin && item.cost && item.toWin > 0 ? Math.round((item.cost / item.toWin) * 100) : 50;
  const inferred = inferDetailHref(item.market);
  const returnTo = inferred
    ? hrefWithTab(inferred, "social")
    : `/prediction-detail?t=${encodeURIComponent(item.market)}&tab=social`;
  openBetSlip({
    market: item.market,
    title: outcome,
    oddsCents,
    color: bearish ? colors.red : (item.accent ?? colors.green),
    side: bearish ? "no" : "yes",
    returnTo,
  });
}

function PositionTicket({ item }: { item: HomeSocialTickerItem }) {
  return (
    <TradeTicket
      market={shortMarketLabel(item.market)}
      outcome={item.outcome}
      logo={item.logo}
      cost={item.cost ?? 0}
      toWin={item.toWin ?? 0}
      value={item.value}
    />
  );
}

function SocialCarouselCard({ item, width, onOpen }: { item: HomeSocialTickerItem; width: number; onOpen: () => void }) {
  const profile = profileFor(item.author);
  return (
    <View
      style={{
        width,
        borderRadius: 16,
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "rgba(226, 226, 255, 0.15)",
        padding: 16,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <SocialAvatar seed={item.author} size="md" tappable showPlus={false} />
        <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "baseline", gap: 6 }}>
          <Text style={{ flexShrink: 1, fontFamily: geist.semibold, fontSize: 14, lineHeight: 18, color: colors.textPrimary }} numberOfLines={1}>
            {profile.handle}
          </Text>
          <Text style={{ fontFamily: geist.regular, fontSize: 13, lineHeight: 18, color: colors.textMuted }}>·</Text>
          <Text style={{ fontFamily: geist.regular, fontSize: 13, lineHeight: 18, color: colors.textMuted }}>{compactTime(item.timeLabel)}</Text>
        </View>
        <FollowChip author={item.author} />
      </View>
      <Pressable onPress={onOpen} accessibilityRole="button">
        {item.caption ? (
          <Text style={{ fontFamily: geist.regular, fontSize: 15, lineHeight: 20, color: colors.textPrimary, marginBottom: 12 }} numberOfLines={1}>
            {item.caption}
          </Text>
        ) : null}
        <PositionTicket item={item} />
      </Pressable>
      <Button
        variant={ButtonVariant.Secondary}
        size={ButtonSize.Lg}
        isFullWidth
        startIconName={IconName.Refresh}
        onPress={() => copyTradeFromItem(item)}
      >
        Copy trade
      </Button>
    </View>
  );
}

function TickerCard({
  items,
  gutter,
  openItem,
}: {
  items: HomeSocialTickerItem[];
  gutter: number;
  openItem: (item: HomeSocialTickerItem) => void;
}) {
  const [index, setIndex] = useState(0);
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const indexRef = useRef(0);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const inY = useRef(new Animated.Value(0)).current;
  const inOp = useRef(new Animated.Value(1)).current;
  const outY = useRef(new Animated.Value(0)).current;
  const outOp = useRef(new Animated.Value(1)).current;
  const pausedRef = useRef(false);
  const runningRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const scheduleRef = useRef<() => void>(() => undefined);
  const advanceRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    indexRef.current = 0;
    setIndex((i) => (i === 0 ? i : 0));
    setOutgoing((o) => (o == null ? o : null));
    inY.setValue(0);
    inOp.setValue(1);
  }, [items.length, inY, inOp]);

  useEffect(() => {
    if (items.length < 2) return;

    const clearTimer = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const advance = () => {
      if (pausedRef.current || runningRef.current) return;
      const list = itemsRef.current;
      if (list.length < 2) return;
      runningRef.current = true;
      const from = indexRef.current;
      const to = (from + 1) % list.length;
      outY.setValue(0);
      outOp.setValue(1);
      inY.setValue(12);
      inOp.setValue(0);
      setOutgoing(from);
      indexRef.current = to;
      setIndex(to);
      animRef.current = Animated.parallel([
        Animated.timing(outY, { toValue: -12, duration: SLIDE_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(outOp, { toValue: 0, duration: SLIDE_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(inY, { toValue: 0, duration: SLIDE_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(inOp, { toValue: 1, duration: SLIDE_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]);
      animRef.current.start(({ finished }) => {
        runningRef.current = false;
        animRef.current = null;
        if (!finished) return;
        setOutgoing(null);
        scheduleRef.current();
      });
    };

    const schedule = () => {
      clearTimer();
      if (pausedRef.current) return;
      timeoutRef.current = setTimeout(() => advanceRef.current(), DWELL_MS);
    };

    advanceRef.current = advance;
    scheduleRef.current = schedule;
    schedule();
    return () => {
      clearTimer();
      animRef.current?.stop();
      runningRef.current = false;
    };
  }, [items.length, inOp, inY, outOp, outY]);

  const current = items[Math.min(index, items.length - 1)];
  const leaving = outgoing != null ? items[outgoing] : null;

  return (
    <TourAnchor id="tour-latest-posts" style={{ paddingHorizontal: gutter }}>
      <Pressable
        onPress={() => openItem(current)}
        onPressIn={() => {
          pausedRef.current = true;
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        }}
        onPressOut={() => {
          pausedRef.current = false;
          scheduleRef.current();
        }}
        style={{
          height: CARD_H,
          borderRadius: 12,
          backgroundColor: colors.surface,
          overflow: "hidden",
        }}
      >
        <View style={{ flex: 1, overflow: "hidden" }}>
          {leaving ? (
            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: outOp,
                transform: [{ translateY: outY }],
              }}
            >
              <TickerRow item={leaving} />
            </Animated.View>
          ) : null}
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: inOp,
              transform: [{ translateY: inY }],
            }}
          >
            <TickerRow item={current} />
          </Animated.View>
        </View>
      </Pressable>
    </TourAnchor>
  );
}

export function HomeSocialTicker({ gutter = 16 }: { gutter?: number }) {
  const socialUx = useSocialUx();
  const layout = useHomeSocialStyle();
  const posted = useSocialFeed();
  const router = useRouter();
  const { width: winW } = useWindowDimensions();
  const items = useMemo(() => [...posted.map(fromUserPost), ...SEEDED], [posted]);
  const cardW = winW - gutter * 2 - 36;

  useEffect(() => {
    if (!socialUx || getSlidesKind() !== "home" || typeof document === "undefined") return;
    const pin = () => document.getElementById("what-people-are-saying")?.scrollIntoView({ block: "start", inline: "nearest" });
    pin();
    const frame = requestAnimationFrame(pin);
    const later = setTimeout(pin, 80);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(later);
    };
  }, [socialUx, items.length]);

  if (!socialUx || items.length === 0) return null;

  const openItem = (item: HomeSocialTickerItem) => {
    router.push(hrefWithTab(hrefForMarket(item.market), "social") as Href);
  };

  return (
    <View nativeID="what-people-are-saying">
      <SectionHeader title="What people are saying" showChevron={false} />
      {layout === "carousel" ? (
        <TourAnchor id="tour-latest-posts">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={cardW + 10}
            snapToAlignment="start"
            disableIntervalMomentum
            contentContainerStyle={{ paddingHorizontal: gutter, gap: 10 }}
          >
            {items.map((item) => (
              <SocialCarouselCard key={item.id} item={item} width={cardW} onOpen={() => openItem(item)} />
            ))}
          </ScrollView>
        </TourAnchor>
      ) : (
        <TickerCard items={items} gutter={gutter} openItem={openItem} />
      )}
    </View>
  );
}
