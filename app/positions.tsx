import React, { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { PageHeader } from "@/components/PageHeader";
import { PositionCard } from "@/components/sim/CurrentPositionsCard";
import { ComboPositionCard } from "@/components/sim/ComboPositionCard";
import { PositionAvatar } from "@/components/sim/PositionAvatar";
import { colors as simColors, uxrPaletteColor } from "@/lib/sim/colors";
import { usePositionsLayout } from "@/lib/sim/positionsLayoutStore";
import { mockCurrent, usePlacedPositions, type PlacedPosition, positionMeta, setAutoSellTarget } from "@/lib/sim/positionsStore";
import { ComboSheet, type ComboPick } from "@/components/sim/ComboSheet";
import { replacePickInList } from "@/lib/sim/comboPicksStore";
import { openAutoSell } from "@/lib/sim/autoSellStore";
import { openBetSlip } from "@/lib/sim/betSlipStore";
import { openCashOut } from "@/lib/sim/cashOutStore";
import { useThemeMode } from "@/lib/sim/dsModeStore";
import { geist } from "@/lib/sim/geistFonts";
import { useDisplayFont, useOswaldDataSet } from "@/lib/sim/typefaceStore";

const c = colors.light;

function LogoBox({ bg, children, size = 32 }: { bg: string; children: React.ReactNode; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: bg,
      }}
    >
      {children}
    </View>
  );
}

// Bitcoin "₿" tile reused across active positions and history rows.
function BtcLogo({ box = 32 }: { box?: number }) {
  return (
    <LogoBox bg={c.bitcoin} size={box}>
      <Text style={{ color: "#fff", fontFamily: geist.bold, fontSize: box * 0.5, marginTop: -1 }}>₿</Text>
    </LogoBox>
  );
}

// NVIDIA brand tile: signature green with the white wordmark.
function NvidiaLogo() {
  return (
    <LogoBox bg="#76b900">
      <Text style={{ color: "#fff", fontFamily: geist.bold, fontSize: 6, letterSpacing: 0.3 }}>NVIDIA</Text>
    </LogoBox>
  );
}

// Country flag tile for political markets (matches the feed's flag convention).
function FlagLogo({ cc }: { cc: string }) {
  return (
    <Image
      source={{ uri: `https://flagcdn.com/w160/${cc}.png` }}
      style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: c.surface }}
      resizeMode="cover"
    />
  );
}

type HistoryItem = {
  id: string;
  action: string;
  detail: string;
  amount: string;
  logo: React.ReactNode;
};

type HistoryGroup = { label: string; items: HistoryItem[] };

const HISTORY: HistoryGroup[] = [
  {
    label: "Claim pending",
    items: [
      {
        id: "h-claim-pending",
        action: "Prediction won",
        detail: "Bitcoin Up or Down - June 16, 10:35AM-10:40AM ET",
        amount: "+$1.39",
        logo: <BtcLogo />,
      },
    ],
  },
  {
    label: "Today",
    items: [
      {
        id: "h-today-btc",
        action: "Predicted",
        detail: "Bitcoin Up or Down - June 16, 10:35AM-10:40AM ET",
        amount: "-$1.06",
        logo: <BtcLogo />,
      },
    ],
  },
  {
    label: "Jun 9",
    items: [
      {
        id: "h-nvidia",
        action: "Claimed winnings",
        detail: "Will NVIDIA be the largest company in the world by market cap on December 31?",
        amount: "+$1.08",
        logo: <NvidiaLogo />,
      },
      {
        id: "h-kast",
        action: "Claimed winnings",
        detail: "Will José Antonio Kast win the Chilean presidential election?",
        amount: "+$2.86",
        logo: <FlagLogo cc="cl" />,
      },
      {
        id: "h-jun9-btc",
        action: "Predicted",
        detail: "Bitcoin Up or Down - June 9, 9:00AM-9:05AM ET",
        amount: "-$5.00",
        logo: <BtcLogo />,
      },
    ],
  },
];

export default function PositionsScreen() {
  const [tab, setTab] = useState<"active" | "history">("active");
  const router = useRouter();
  useThemeMode();
  const displayFont = useDisplayFont();
  const oswald = useOswaldDataSet();
  const placed = usePlacedPositions();
  const insets = useSafeAreaInsets();
  const layout = usePositionsLayout();
  // "Buy more" pulls the combo bet slip back up, pre-loaded with the ticket's legs.
  const [slipPicks, setSlipPicks] = useState<ComboPick[]>([]);
  const buyMore = (pos: Extract<PlacedPosition, { kind: "combo" }>) =>
    setSlipPicks(
      pos.legs.map((leg, i) => ({
        id: `${pos.id}:${i}`,
        category: leg.category,
        categoryEmoji: leg.categoryEmoji,
        label: leg.label,
        color: leg.color,
        cents: leg.cents,
      })),
    );

  const autoSell = (pos: PlacedPosition) => {
    const { current } = mockCurrent(pos);
    openAutoSell({
      tint: pos.kind === "combo" ? pos.legs[0]?.color ?? simColors.green : pos.color,
      cost: current,
      toWin: pos.cost + pos.toWin,
      onSet: (target) => setAutoSellTarget(pos.id, target),
    });
  };

  return (
    <View style={styles.root}>
      <PageHeader title="Prediction portfolio" variant="lg" />

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>

        {layout === "stats" ? (
          /* Stats header: two-column Balance / Winnings with sub-lines */
          <View style={{ paddingHorizontal: 16, paddingTop: 0, flexDirection: "row" }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.statLabel} numberOfLines={1}>Available balance</Text>
              <Text {...oswald} style={[styles.statValue, { fontFamily: displayFont }]} numberOfLines={1}>$123.12</Text>
              <Text style={[styles.statSub, { color: simColors.green }]} numberOfLines={1}>+$0.04 (+4.24%)</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statLabel} numberOfLines={1}>Winnings</Text>
              <Text {...oswald} style={[styles.statValue, { fontFamily: displayFont }]} numberOfLines={1}>$1,120.99</Text>
              <Text style={styles.statSub} numberOfLines={1}>62% Win Rate</Text>
            </View>
          </View>
        ) : (
          /* Balance & PNL card */
          <View style={{ paddingHorizontal: 16, paddingTop: 0 }}>
            <View style={styles.card}>
              <View style={[styles.cardRow, styles.cardRowDivider]}>
                <Text style={styles.cardLabel} numberOfLines={1}>Available balance</Text>
                <Text style={styles.cardValue} numberOfLines={1}>$250.00</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel} numberOfLines={1}>Unrealized P&amp;L</Text>
                <Text style={[styles.cardValue, { color: simColors.green }]} numberOfLines={1}>+$46.35 (+20.23%)</Text>
              </View>
            </View>
          </View>
        )}

        {/* Add funds / Withdraw — absorbed from the header money sheet. */}
        <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingTop: 16 }}>
          {([
            { label: "Add funds", icon: "add" as const, href: "/add-funds" as const },
            { label: "Withdraw", icon: "arrow-downward" as const, href: "/withdraw" as const },
          ]).map(({ label, icon, href }) => (
            <Pressable
              key={label}
              onPress={() => router.push(href)}
              style={({ pressed }) => ({
                flex: 1,
                height: 72,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: c.surface,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <MaterialIcons name={icon} size={22} color={c.textMuted} />
              <Text style={{ fontFamily: geist.medium, fontSize: 16, color: c.textPrimary }}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(["active", "history"] as const).map((t) => {
            const active = tab === t;
            return (
              <Pressable key={t} style={styles.tab} onPress={() => setTab(t)}>
                <Text style={[styles.tabLabel, !active && { color: c.textMuted }]}>
                  {t === "active" ? "Active positions" : "History"}
                </Text>
                {active ? <View style={styles.tabUnderline} /> : null}
              </Pressable>
            );
          })}
        </View>

        {/* Position list */}
        {tab === "active" ? (
          placed.length === 0 ? (
            <View style={{ padding: 32, alignItems: "center" }}>
              <Text style={{ color: c.textMuted, fontFamily: geist.regular, fontSize: 14 }}>
                No active positions yet
              </Text>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 12 }}>
              {placed.map((p) => {
                if (p.kind === "combo")
                  return (
                    <ComboPositionCard
                      key={p.id}
                      position={p}
                      onBuyMore={() => buyMore(p)}
                      onCashOut={() => {
                        const { current } = mockCurrent(p);
                        openCashOut({
                          tint: p.legs[0]?.color ?? simColors.green,
                          title: `${p.legs.length} market combination`,
                          sub: `$${p.cost.toFixed(2)} used`,
                          current,
                          cost: p.cost,
                          cents: p.legs[0]?.cents ?? 50,
                          combo: true,
                        });
                      }}
                    />
                  );
                const { current, changePct } = mockCurrent(p);
                const autoSellEnabled = p.orderType === "limit";
                return (
                  <PositionCard
                    key={p.id}
                    avatar={<PositionAvatar market={p.market} title={p.title} size={40} />}
                    title={p.market ?? p.title}
                    meta={positionMeta(p.title, p.cents)}
                    value={`$${current.toFixed(2)}`}
                    changeText={`+${changePct.toFixed(2)}%`}
                    positive
                    truncate={false}
                    onBuyMore={() => openBetSlip({ title: p.title, market: p.market, oddsCents: p.cents, color: p.color, side: "yes" })}
                    onCashOut={() =>
                      openCashOut({
                        tint: uxrPaletteColor(p.color),
                        title: p.market ?? p.title,
                        sub: positionMeta(p.title, p.cents),
                        current,
                        cost: p.cost,
                        cents: p.cents,
                      })
                    }
                    onAutoSell={autoSellEnabled ? () => autoSell(p) : undefined}
                    autoSellTarget={autoSellEnabled ? p.autoSellAt : undefined}
                    onOpen={p.detailHref ? () => router.push(p.detailHref as any) : undefined}
                  />
                );
              })}
            </View>
          )
        ) : (
          <View>
            {HISTORY.map((g, gi) => (
              <View key={g.label}>
                <Text style={[styles.histSection, gi === 0 && { marginTop: 12 }]}>{g.label}</Text>
                {g.items.map((it) => (
                  <View key={it.id} style={styles.histRow}>
                    {it.logo}
                    <View style={{ flex: 1, minWidth: 0, marginLeft: 12, marginRight: 8 }}>
                      <Text style={styles.histAction} numberOfLines={1}>{it.action}</Text>
                      <Text style={styles.histDetail} numberOfLines={3}>{it.detail}</Text>
                    </View>
                    <Text style={styles.histAmount} numberOfLines={1}>{it.amount}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <ComboSheet
        picks={slipPicks}
        initialScreen={1}
        onRemove={(id) => setSlipPicks((prev) => prev.filter((x) => x.id !== id))}
        onReplace={(id, next) => setSlipPicks((prev) => replacePickInList(prev, id, next))}
        onClear={() => setSlipPicks([])}
        onClose={() => setSlipPicks([])}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  card: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: c.surface,
  },
  cardRow: {
    height: 52,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: c.bg,
  },
  cardLabel: {
    color: c.textMuted,
    fontFamily: geist.medium,
    fontSize: 16,
  },
  cardValue: {
    color: "#fff",
    fontFamily: geist.medium,
    fontSize: 16,
  },
  statLabel: {
    color: c.textMuted,
    fontFamily: geist.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  statValue: {
    color: "#fff",
    fontFamily: geist.semibold,
    fontSize: 24,
    lineHeight: 32,
    marginTop: 4,
  },
  statSub: {
    color: c.textMuted,
    fontFamily: geist.medium,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 2,
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    position: "relative",
  },
  tabLabel: {
    color: "#fff",
    fontFamily: geist.regular,
    fontSize: 16,
    paddingBottom: 8,
  },
  tabUnderline: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    backgroundColor: "#fff",
  },
  histSection: {
    color: "#9B9B9B",
    fontFamily: geist.semibold,
    fontSize: 16,
    paddingHorizontal: 16,
    // Row bottom padding (12) + this margin = 32px visual gap between sections
    marginTop: 20,
    marginBottom: 4,
  },
  histRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  histAction: {
    color: "#fff",
    fontFamily: geist.regular,
    fontSize: 16,
    lineHeight: 21,
  },
  histDetail: {
    color: c.textMuted,
    fontFamily: geist.regular,
    fontSize: 14,
    lineHeight: 19,
    marginTop: 2,
  },
  histAmount: {
    color: "rgba(255,255,255,0.72)",
    fontFamily: geist.medium,
    fontSize: 16,
    marginTop: 1,
  },
});
