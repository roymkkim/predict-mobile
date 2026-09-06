import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, Pressable, Text, View } from "react-native";
import {
  FontWeight,
  Text as DsText,
  TextColor,
  TextVariant,
} from "@metamask/design-system-react-native";

import { MetaTag } from "@/components/sim/MetaHeader";
import { SectionHeader } from "@/components/sim/FeedChrome";
import { SnapHScroll } from "@/components/sim/SnapHScroll";
import { colors, marketAccentColor } from "@/lib/sim/colors";
import { NBA, NFL, NFL_CAR_ARI, NFL_GB_PIT } from "@/lib/sim/data";
import { geist } from "@/lib/sim/geistFonts";
import { openBetSlip } from "@/lib/sim/betSlipStore";
import { buttonInteractionStyle, METAMASK_BUTTON_LABEL, outcomeButtonVisual } from "@/lib/sim/buttonStyle";
import { matchDetailHref } from "@/lib/sim/marketRoutes";
import { useOutcomeButtonColorMode } from "@/lib/sim/outcomeButtonColorStore";
import { useBetRadius } from "@/lib/sim/pillButtonsStore";
import {
  castHomePollVote,
  homePollPercents,
  homePollTotal,
  useHomePoll,
  type HomePollSide,
} from "@/lib/sim/homePollStore";
import type { Match } from "@/lib/sim/types";

const AVATAR = 32;
const BAR_H = 8;
const BAR_GAP = 4;
const TEAM_ROW_H = AVATAR + BAR_GAP + BAR_H;
const TEAMS_GAP = 12;
const TEAMS_SLOT_H = TEAM_ROW_H * 2 + TEAMS_GAP;
const RESULT_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const CARD_GAP = 12;
const CARD_PEEK = 36;

type PollOutcome = {
  side: HomePollSide;
  team: string;
  cents: number;
  color: string;
  logo?: string;
};

export type HomePollItem = {
  id: string;
  question: string;
  match: Match;
  yes: PollOutcome;
  no: PollOutcome;
};

function centsOf(pct: string | undefined): number {
  return parseInt(String(pct ?? "50"), 10) || 50;
}

function pollFromMatch(id: string, match: Match): HomePollItem {
  const [home, away] = match.teams;
  return {
    id,
    question: `Who will win: ${home.name} or ${away.name}?`,
    match,
    yes: {
      side: "yes",
      team: home.name,
      cents: centsOf(home.pct),
      color: home.color,
      logo: home.logo,
    },
    no: {
      side: "no",
      team: away.name,
      cents: centsOf(away.pct),
      color: away.color,
      logo: away.logo,
    },
  };
}

export const HOME_POLL_ITEMS: HomePollItem[] = [
  pollFromMatch("car-ari", NFL_CAR_ARI),
  pollFromMatch("gb-pit", NFL_GB_PIT),
  pollFromMatch("lal-bos", NBA),
  pollFromMatch("kc-buf", NFL),
];

function pollKickoff(match: Match): string {
  return match.time ? `${match.date}, ${match.time}` : match.date;
}

function fmtVotes(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, "")}K votes`;
  return `${n} votes`;
}

function VoteBar({
  label,
  pct,
  color,
  logo,
  revealed,
  delay = 0,
}: {
  label: string;
  pct: number;
  color: string;
  logo?: string;
  revealed: boolean;
  delay?: number;
}) {
  const accent = marketAccentColor(color);
  const fill = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const open = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!revealed) {
      fill.setValue(0);
      fade.setValue(0);
      open.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(open, {
        toValue: 1,
        duration: 320,
        delay,
        easing: RESULT_EASE,
        useNativeDriver: false,
      }),
      Animated.timing(fill, {
        toValue: pct,
        duration: 520,
        delay,
        easing: RESULT_EASE,
        useNativeDriver: false,
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 280,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, fade, fill, open, pct, revealed]);

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
      {logo ? (
        <View style={{ width: AVATAR, height: AVATAR, alignItems: "center", justifyContent: "center" }}>
          <Image source={{ uri: logo }} style={{ width: AVATAR, height: AVATAR }} resizeMode="contain" />
        </View>
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, minHeight: AVATAR }}>
          <DsText
            variant={TextVariant.BodyMd}
            color={TextColor.TextDefault}
            numberOfLines={1}
            style={{ flexShrink: 1 }}
          >
            {label}
          </DsText>
          <Animated.View style={{ opacity: fade }} pointerEvents="none">
            <DsText variant={TextVariant.BodyMd} style={{ color: accent }}>
              {`${pct}%`}
            </DsText>
          </Animated.View>
        </View>
        <Animated.View
          style={{
            height: open.interpolate({ inputRange: [0, 1], outputRange: [0, BAR_H] }),
            marginTop: open.interpolate({ inputRange: [0, 1], outputRange: [0, BAR_GAP] }),
            borderRadius: BAR_H / 2,
            backgroundColor: colors.surface2,
            overflow: "hidden",
          }}
        >
          <Animated.View
            style={{
              width: fill.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
              height: BAR_H,
              borderRadius: BAR_H / 2,
              backgroundColor: accent,
            }}
          />
        </Animated.View>
      </View>
    </View>
  );
}

function PollFillButton({
  label,
  accessibilityLabel,
  color,
  flex,
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  color: string;
  flex?: number;
  onPress: () => void;
}) {
  const mode = useOutcomeButtonColorMode();
  const betR = useBetRadius();
  const visual = outcomeButtonVisual("default", "gray-colored", color, {
    mode: mode === "fill" ? "fill" : mode,
    label,
    pill: betR === 999,
  });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flex,
          height: 48,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        },
        visual.container,
        { borderRadius: betR },
        buttonInteractionStyle(pressed),
      ]}
    >
      <Text style={{ ...METAMASK_BUTTON_LABEL, ...visual.text }}>{label}</Text>
    </Pressable>
  );
}

export function HomePollCard({ item, width }: { item: HomePollItem; width?: number }) {
  const poll = useHomePoll(item.id);
  const pct = homePollPercents(poll);
  const picked = poll.vote === "yes" ? item.yes : poll.vote === "no" ? item.no : null;
  const revealed = picked != null;
  const market = `${item.yes.team} vs. ${item.no.team}`;
  const returnTo = matchDetailHref(item.match);

  const bid = (side: HomePollSide) => {
    const outcome = side === "yes" ? item.yes : item.no;
    openBetSlip({
      title: outcome.team,
      market,
      oddsCents: outcome.cents,
      color: marketAccentColor(outcome.color),
      side: outcome.side,
      avatar: outcome.logo ? { type: "image", source: { uri: outcome.logo }, contain: true } : undefined,
      returnTo,
    });
  };

  return (
    <View
      style={{
        width,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        backgroundColor: colors.surface,
        gap: 16,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <MetaTag>{pollKickoff(item.match)}</MetaTag>
        <Text style={{ fontFamily: geist.medium, fontSize: 12, lineHeight: 16, color: colors.textMuted }}>
          {fmtVotes(homePollTotal(poll))}
        </Text>
      </View>

      <DsText variant={TextVariant.HeadingSm} color={TextColor.TextDefault} fontWeight={FontWeight.Bold}>
        {item.question}
      </DsText>

      <View style={{ marginTop: -4, gap: 20 }}>
        <View style={{ height: TEAMS_SLOT_H, justifyContent: "center", gap: TEAMS_GAP }}>
          <VoteBar label={item.yes.team} pct={pct.yes} color={item.yes.color} logo={item.yes.logo} revealed={revealed} />
          <VoteBar label={item.no.team} pct={pct.no} color={item.no.color} logo={item.no.logo} revealed={revealed} delay={60} />
        </View>

        {picked ? (
          <PollFillButton
            label={`Predict ${picked.team} to win`}
            accessibilityLabel={`Predict ${picked.team} to win`}
            color={picked.color}
            onPress={() => bid(picked.side)}
          />
        ) : (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <PollFillButton
              label={item.yes.team}
              accessibilityLabel={`Vote ${item.yes.team}`}
              color={item.yes.color}
              flex={1}
              onPress={() => castHomePollVote(item.id, "yes")}
            />
            <PollFillButton
              label={item.no.team}
              accessibilityLabel={`Vote ${item.no.team}`}
              color={item.no.color}
              flex={1}
              onPress={() => castHomePollVote(item.id, "no")}
            />
          </View>
        )}
      </View>
    </View>
  );
}

export function HomePollCarousel({ gutter = 16 }: { gutter?: number }) {
  const [vw, setVw] = useState(0);
  const itemW = vw ? Math.max(240, vw - gutter * 2 - CARD_PEEK) : 0;

  return (
    <View onLayout={(e) => setVw(e.nativeEvent.layout.width)} style={{ paddingTop: 16 }}>
      <SectionHeader title="What people predict" showChevron={false} />
      {itemW > 0 ? (
        <SnapHScroll gutter={gutter} interval={itemW + CARD_GAP} gap={CARD_GAP}>
          {HOME_POLL_ITEMS.map((item) => (
            <HomePollCard key={item.id} item={item} width={itemW} />
          ))}
        </SnapHScroll>
      ) : null}
    </View>
  );
}
