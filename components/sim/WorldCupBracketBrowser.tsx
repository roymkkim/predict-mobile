import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import colors from "@/constants/colors";
import { geist } from "@/lib/sim/geistFonts";

/**
 * World Cup knockout bracket browser.
 *
 * A frosted segmented control slides a TWO-STAGE window across
 * GS / R32 / R16 / QF / SF / F. The body is a horizontally PAGED pager — one
 * page per stage-pair — and each page shows the two windowed stages as two
 * side-by-side columns with SVG bracket connector lines between them. Swiping
 * left/right moves the window (and the segmented control tracks the swipe), so
 * you can follow how games connect from one round to the next. Reskinned to the
 * app's dark palette. Self-contained data + UI (no shared feed providers).
 *
 * Rendered both full-screen (`app/worldcup-bracket.tsx`) and inline as a page
 * section (`WorldCupBracketSection`, used on `app/worldcup.tsx`).
 */

const c = colors.light;

// ---------------------------------------------------------------- palette ---
const C = {
  bg: c.bg, // #131416
  card: c.surface, // #1c1d1f
  cardBorder: "rgba(255,255,255,0.06)",
  chip: "rgba(255,255,255,0.04)",
  chipBorder: "rgba(255,255,255,0.08)",
  avatar: "#2c2d30",
  line: "rgba(255,255,255,0.12)",
  white: "#ffffff",
  muted: c.textMuted, // #9b9b9b
  faint: "rgba(255,255,255,0.40)",
  windowBg: "rgba(255,255,255,0.08)",
  windowBorder: "rgba(255,255,255,0.14)",
  green: c.green, // #baf24a
  gold: "#f7c948",
};

const F = {
  reg: geist.regular,
  med: geist.medium,
  semi: geist.semibold,
  bold: geist.bold,
};

const flag = (cc: string) => ({ uri: `https://flagcdn.com/w160/${cc}.png` });

// ------------------------------------------------------------------ data ----
const STAGES = [
  { id: "GS", bars: 6 },
  { id: "R32", bars: 5 },
  { id: "R16", bars: 4 },
  { id: "QF", bars: 3 },
  { id: "SF", bars: 2 },
  { id: "F", bars: 0 }, // trophy
] as const;

const PAIRS = STAGES.slice(0, -1).map((_, i) => i); // [0..4]

type GroupRow = { rank: number; name: string; cc: string; pts: number };
type Group = { name: string; rows: GroupRow[] };

const G = (name: string, rows: [number, string, string, number][]): Group => ({
  name,
  rows: rows.map(([rank, n, cc, pts]) => ({ rank, name: n, cc, pts })),
});

const GROUPS: Group[] = [
  G("Group A", [[1, "Mexico", "mx", 6], [2, "Korea Republic", "kr", 3], [3, "Czechia", "cz", 1], [4, "South Africa", "za", 1]]),
  G("Group B", [[1, "Canada", "ca", 4], [2, "Switzerland", "ch", 4], [3, "Bosnia-Herz.", "ba", 1], [4, "Qatar", "qa", 1]]),
  G("Group C", [[1, "Scotland", "gb-sct", 3], [2, "Morocco", "ma", 1], [3, "Brazil", "br", 1], [4, "Haiti", "ht", 0]]),
  G("Group D", [[1, "USA", "us", 3], [2, "Australia", "au", 3], [3, "Türkiye", "tr", 0], [4, "Ghana", "gh", 0]]),
  G("Group E", [[1, "France", "fr", 7], [2, "Senegal", "sn", 4], [3, "Poland", "pl", 3], [4, "Saudi Arabia", "sa", 0]]),
  G("Group F", [[1, "Argentina", "ar", 6], [2, "Croatia", "hr", 4], [3, "Japan", "jp", 1], [4, "Egypt", "eg", 1]]),
  G("Group G", [[1, "Spain", "es", 7], [2, "Uruguay", "uy", 4], [3, "Ivory Coast", "ci", 1], [4, "Panama", "pa", 0]]),
  G("Group H", [[1, "Germany", "de", 6], [2, "Netherlands", "nl", 4], [3, "Ecuador", "ec", 1], [4, "Jordan", "jo", 0]]),
  G("Group I", [[1, "Portugal", "pt", 6], [2, "Colombia", "co", 4], [3, "Norway", "no", 3], [4, "New Zealand", "nz", 0]]),
  G("Group J", [[1, "England", "gb-eng", 7], [2, "Denmark", "dk", 4], [3, "Nigeria", "ng", 1], [4, "Costa Rica", "cr", 0]]),
  G("Group K", [[1, "Belgium", "be", 6], [2, "Peru", "pe", 3], [3, "Cameroon", "cm", 3], [4, "UAE", "ae", 0]]),
  G("Group L", [[1, "Italy", "it", 7], [2, "Serbia", "rs", 4], [3, "Tunisia", "tn", 1], [4, "Jamaica", "jm", 0]]),
];

type Card = { id: string; head: string; sub?: string; top: string; bot: string };

const r32: Card[] = [
  ["Sun, Jun 28 · 12:00 PM", "2A", "2B"],
  ["Sun, Jun 28 · 4:00 PM", "1C", "3D/E/F"],
  ["Mon, Jun 29 · 1:30 PM", "1E", "3A/B/C/D/F"],
  ["Mon, Jun 29 · 5:00 PM", "1A", "3C/E/F/H"],
  ["Mon, Jun 29 · 6:00 PM", "1F", "2C"],
  ["Tue, Jun 30 · 12:00 PM", "1G", "3A/B/F"],
  ["Tue, Jun 30 · 2:00 PM", "1I", "3C/D/F/G/H"],
  ["Tue, Jun 30 · 6:00 PM", "1B", "2E"],
  ["Wed, Jul 1 · 11:00 AM", "1D", "2F"],
  ["Wed, Jul 1 · 12:00 PM", "1K", "2G"],
  ["Wed, Jul 1 · 3:00 PM", "1J", "2H"],
  ["Wed, Jul 1 · 5:00 PM", "1L", "3B/E/H/I"],
  ["Thu, Jul 2 · 11:00 AM", "1H", "2J"],
  ["Thu, Jul 2 · 12:00 PM", "2D", "2I"],
  ["Thu, Jul 2 · 4:00 PM", "2K", "2L"],
  ["Thu, Jul 2 · 6:00 PM", "2M", "3A/D/G"],
].map(([head, top, bot], i) => ({ id: `r32-${i}`, head, top, bot }));

const tbdCards = (prefix: string, dates: string[]): Card[] =>
  dates.map((head, i) => ({ id: `${prefix}-${i}`, head, top: "TBD", bot: "TBD" }));

const r16 = tbdCards("r16", [
  "Sat, Jul 4 · 10:00 AM",
  "Sat, Jul 4 · 2:00 PM",
  "Sun, Jul 5 · 1:00 PM",
  "Sun, Jul 5 · 5:00 PM",
  "Mon, Jul 6 · 12:00 PM",
  "Mon, Jul 6 · 5:00 PM",
  "Tue, Jul 7 · 12:00 PM",
  "Tue, Jul 7 · 5:00 PM",
]);

const qf = tbdCards("qf", [
  "Thu, Jul 9 · 1:00 PM",
  "Fri, Jul 10 · 12:00 PM",
  "Sat, Jul 11 · 2:00 PM",
  "Sat, Jul 11 · 6:00 PM",
]);

const sf = tbdCards("sf", ["Tue, Jul 14 · 12:00 PM", "Wed, Jul 15 · 12:00 PM"]);

const fin: Card[] = [
  { id: "final", head: "Final", sub: "Sun, Jul 19 · 12:00 PM", top: "TBD", bot: "TBD" },
  { id: "third", head: "Third Place Match", sub: "Sat, Jul 18 · 2:00 PM", top: "TBD", bot: "TBD" },
];

const KO: Record<string, Card[]> = { R32: r32, R16: r16, QF: qf, SF: sf, F: fin };

// --------------------------------------------------------------- geometry ---
const H = 104; // card height
const GAP = 16; // gap between cards in a column
const STEP = H + GAP;

// ------------------------------------------------------------- components ---
function BarsIcon({ count, active }: { count: number; active: boolean }) {
  if (count === 0) {
    return <MaterialCommunityIcons name="trophy" size={18} color={active ? C.gold : C.faint} />;
  }
  return (
    <View style={{ alignItems: "center", justifyContent: "center", gap: 2.5 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 16,
            height: 1.8,
            borderRadius: 2,
            backgroundColor: active ? C.white : C.faint,
          }}
        />
      ))}
    </View>
  );
}

function Avatar() {
  return <View style={styles.avatar} />;
}

function KnockCard({ card, width }: { card: Card; width: number }) {
  return (
    <View style={[styles.card, { width, height: H }]}>
      <View>
        <Text style={styles.head} numberOfLines={1}>
          {card.head}
        </Text>
        {card.sub ? (
          <Text style={styles.sub} numberOfLines={1}>
            {card.sub}
          </Text>
        ) : null}
      </View>
      <View style={{ gap: 8 }}>
        <View style={styles.slot}>
          <Avatar />
          <Text style={styles.slotLabel} numberOfLines={1}>
            {card.top}
          </Text>
        </View>
        <View style={styles.slot}>
          <Avatar />
          <Text style={styles.slotLabel} numberOfLines={1}>
            {card.bot}
          </Text>
        </View>
      </View>
    </View>
  );
}

function GroupCard({ group }: { group: Group }) {
  return (
    <View style={styles.groupCard}>
      <View style={styles.groupHead}>
        <Text style={styles.groupName}>{group.name}</Text>
        <Text style={styles.groupPtsLabel}>PTS</Text>
      </View>
      {group.rows.map((r) => (
        <View key={r.rank} style={styles.groupRow}>
          <Text style={styles.rank}>{r.rank}</Text>
          <Animated.Image source={flag(r.cc)} style={styles.groupFlag} resizeMode="cover" />
          <Text style={styles.groupTeam} numberOfLines={1}>
            {r.name}
          </Text>
          <Text style={styles.groupPts}>{r.pts}</Text>
        </View>
      ))}
    </View>
  );
}

// Knockout pair: two absolutely-positioned columns + SVG bracket connectors.
function KnockoutPair({
  left,
  right,
  colW,
  gutter,
}: {
  left: Card[];
  right: Card[];
  colW: number;
  gutter: number;
}) {
  const boardW = colW * 2 + gutter;
  const leftEdge = colW;
  const midX = colW + gutter / 2;
  const rightEdge = colW + gutter;

  const leftCenterY = (i: number) => i * STEP + H / 2;
  const rightTop = (j: number) => (2 * j + 0.5) * STEP;
  const rightCenterY = (j: number) => rightTop(j) + H / 2;

  const leftHeight = left.length * STEP - GAP;
  const rightHeight = right.length ? rightTop(right.length - 1) + H : 0;
  const boardH = Math.max(leftHeight, rightHeight);

  // Connectors: each feeder pair (2j, 2j+1) elbows into right card j.
  const paths: string[] = [];
  right.forEach((_, j) => {
    const a = 2 * j;
    const b = 2 * j + 1;
    if (a >= left.length || b >= left.length) return; // no full feeder pair
    const cy = rightCenterY(j);
    [a, b].forEach((i) => {
      paths.push(`M ${leftEdge} ${leftCenterY(i)} H ${midX} V ${cy} H ${rightEdge}`);
    });
  });

  return (
    <View style={{ width: boardW, height: boardH, alignSelf: "center" }}>
      <Svg width={boardW} height={boardH} style={StyleSheet.absoluteFill} pointerEvents="none">
        {paths.map((d, i) => (
          <Path key={i} d={d} stroke={C.line} strokeWidth={1.5} fill="none" />
        ))}
      </Svg>
      {left.map((card, i) => (
        <View key={card.id} style={{ position: "absolute", left: 0, top: i * STEP }}>
          <KnockCard card={card} width={colW} />
        </View>
      ))}
      {right.map((card, j) => (
        <View key={card.id} style={{ position: "absolute", left: rightEdge, top: rightTop(j) }}>
          <KnockCard card={card} width={colW} />
        </View>
      ))}
    </View>
  );
}

// Group-stage pair: group tables on the left, R32 cards on the right (loose,
// no strict 2:1 connectors since groups don't map 1:1 to R32 matches).
function GroupPair({ right, colW }: { right: Card[]; colW: number }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <View style={{ width: colW, gap: GAP }}>
        {GROUPS.map((g) => (
          <GroupCard key={g.name} group={g} />
        ))}
      </View>
      <View style={{ width: colW, gap: GAP }}>
        {right.map((card) => (
          <KnockCard key={card.id} card={card} width={colW} />
        ))}
      </View>
    </View>
  );
}

const AnimatedScrollView = Animated.ScrollView;

export function WorldCupBracketBrowser({ pagerHeight }: { pagerHeight: number }) {
  const PAD = 12;
  const GUTTER = 24;
  const INITIAL_PAIR = 1; // R32 + R16

  const [w, setW] = useState(0);
  const [ctrlW, setCtrlW] = useState(0);
  const [pair, setPair] = useState(INITIAL_PAIR);
  const hScroll = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const didInit = useRef(false);

  const colW = w > 0 ? Math.floor((w - 2 * PAD - GUTTER) / 2) : 0;
  const cellW = ctrlW / STAGES.length;

  // On the first measured width, jump to the initial pair without animating.
  // Gated to first mount so a later relayout doesn't discard the user's stage.
  useEffect(() => {
    if (w > 0 && !didInit.current) {
      didInit.current = true;
      scrollX.setValue(INITIAL_PAIR * w);
      hScroll.current?.scrollTo({ x: INITIAL_PAIR * w, animated: false });
    }
  }, [w, scrollX]);

  const onMomentum = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (w > 0) setPair(Math.round(e.nativeEvent.contentOffset.x / w));
  };

  const goToPair = (p: number) => {
    const clamped = Math.min(Math.max(p, 0), PAIRS.length - 1);
    setPair(clamped);
    if (w > 0) hScroll.current?.scrollTo({ x: clamped * w, animated: true });
  };

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {/* Stage labels */}
      <View style={styles.labelRow}>
        {STAGES.map((s, i) => {
          const on = i === pair || i === pair + 1;
          return (
            <Text key={s.id} style={[styles.stageLabel, { color: on ? C.white : C.faint }]}>
              {s.id}
            </Text>
          );
        })}
      </View>

      {/* Segmented control with a sliding two-stage window that tracks the swipe */}
      <View style={styles.control} onLayout={(e) => setCtrlW(e.nativeEvent.layout.width - 8)}>
        {ctrlW > 0 && w > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.window,
              {
                width: cellW * 2,
                transform: [
                  {
                    translateX: scrollX.interpolate({
                      inputRange: [0, (PAIRS.length - 1) * w],
                      outputRange: [0, (STAGES.length - 2) * cellW],
                      extrapolate: "clamp",
                    }),
                  },
                ],
              },
            ]}
          >
            <Feather name="chevron-left" size={14} color="rgba(255,255,255,0.6)" />
            <Feather name="chevron-right" size={14} color="rgba(255,255,255,0.6)" />
          </Animated.View>
        )}
        {STAGES.map((s, i) => {
          const on = i === pair || i === pair + 1;
          return (
            <Pressable key={s.id} style={styles.cell} onPress={() => goToPair(i)}>
              <BarsIcon count={s.bars} active={on} />
            </Pressable>
          );
        })}
      </View>

      {/* Horizontally paged two-column bracket — one page per stage-pair */}
      {w > 0 && (
        <AnimatedScrollView
          ref={hScroll as never}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: true,
          })}
          onMomentumScrollEnd={onMomentum}
          style={{ height: pagerHeight }}
        >
          {PAIRS.map((p) => (
            <ScrollView
              key={p}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              style={{ width: w, height: pagerHeight }}
              contentContainerStyle={{
                paddingHorizontal: PAD,
                paddingTop: 12,
                paddingBottom: 28,
              }}
            >
              {p === 0 ? (
                <GroupPair right={KO.R32} colW={colW} />
              ) : (
                <KnockoutPair
                  left={KO[STAGES[p].id]}
                  right={KO[STAGES[p + 1].id]}
                  colW={colW}
                  gutter={GUTTER}
                />
              )}
            </ScrollView>
          ))}
        </AnimatedScrollView>
      )}
    </View>
  );
}

// Inline page-section wrapper: a surface card with a title row + an expand
// affordance, hosting the browser at a bounded height.
export function WorldCupBracketSection({ onExpand }: { onExpand?: () => void }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Knockout bracket</Text>
        {onExpand ? (
          <Pressable onPress={onExpand} hitSlop={10} style={styles.expandBtn}>
            <Feather name="maximize-2" size={15} color={C.muted} />
          </Pressable>
        ) : null}
      </View>
      <WorldCupBracketBrowser pagerHeight={430} />
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  stageLabel: {
    flex: 1,
    textAlign: "center",
    fontFamily: F.semi,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  control: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.30)",
    borderWidth: 1,
    borderColor: C.chipBorder,
    marginBottom: 4,
  },
  window: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 14,
    backgroundColor: C.windowBg,
    borderWidth: 1,
    borderColor: C.windowBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  cell: {
    flex: 1,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 10,
    justifyContent: "space-between",
  },
  head: {
    fontFamily: F.semi,
    fontSize: 11,
    color: C.muted,
  },
  sub: {
    fontFamily: F.med,
    fontSize: 10,
    color: C.faint,
    marginTop: 1,
  },
  slot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.avatar,
  },
  slotLabel: {
    flex: 1,
    fontFamily: F.semi,
    fontSize: 14,
    color: C.white,
  },
  groupCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 12,
    gap: 9,
  },
  groupHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 1,
  },
  groupName: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.white,
  },
  groupPtsLabel: {
    fontFamily: F.med,
    fontSize: 9,
    color: C.faint,
    letterSpacing: 0.5,
  },
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rank: {
    width: 12,
    fontFamily: F.med,
    fontSize: 12,
    color: C.faint,
  },
  groupFlag: {
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: C.avatar,
  },
  groupTeam: {
    flex: 1,
    fontFamily: F.semi,
    fontSize: 13,
    color: C.white,
  },
  groupPts: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.white,
  },
  section: {
    backgroundColor: C.card,
    borderRadius: 16,
    marginHorizontal: 16,
    paddingHorizontal: 8,
    paddingVertical: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: C.white,
    fontFamily: F.semi,
    fontSize: 18,
    lineHeight: 24,
  },
  expandBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.chip,
    borderWidth: 1,
    borderColor: C.chipBorder,
  },
});
