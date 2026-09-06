// Product home screen — the wallet app that hosts Predictions. Reached by
// tapping the back chevron on the Predictions feed header. Modeled on the
// attached wallet reference shots: account bar, balance + quick actions,
// money balance card, Tokens, Perps movers, the Predictions section, Weekly
// Top Traders, DeFi and More, with a Home/Explore/Trade/Money/Rewards tab bar.
//
// The Predictions section has TWO modes (per the reference):
//  - "none": no position yet — surfaces opportunities (BTC live market, World
//    Cup winner, FIFA markets) as tappable rows.
//  - "position": shows the open position with unrealized P&L + current value.
// Tap the "Predictions" title to flip between the modes (demo toggle); the
// chevron next to it routes into the Predictions app ("/").
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { screenTopInset } from "@/lib/sim/layout";

import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  ListItem,
  ContentVariant,
  Text as MmText,
  TextColor,
  TextVariant,
} from "@metamask/design-system-react-native";

import { colors } from "@/lib/sim/colors";
import { requestOnboarding } from "@/lib/sim/onboardingStore";
import { mockCurrent, usePlacedPositions } from "@/lib/sim/positionsStore";
import { uxrPaletteColor } from "@/lib/sim/colors";
import { ComboMark } from "@/components/sim/ComboMark";
import { PositionAvatar } from "@/components/sim/PositionAvatar";
import { geist } from "@/lib/sim/geistFonts";

const HAIR = "rgba(255,255,255,0.09)";

const ACTION_ROWS: { label: string; icon: IconName; href?: string }[][] = [
  [
    { label: "Buy", icon: IconName.Add },
    { label: "Sell", icon: IconName.Minus },
    { label: "Send", icon: IconName.Arrow2UpRight },
    { label: "Receive", icon: IconName.Received },
  ],
  [
    { label: "Swap", icon: IconName.SwapVertical },
    { label: "Perps", icon: IconName.Candlestick },
    { label: "Predict", icon: IconName.Predictions, href: "/" },
    { label: "Traders", icon: IconName.People },
  ],
];

const BREAKDOWN = [
  { key: "money", label: "Money", value: "$0.00", pct: "0%", apy: "5.6% APY", icon: IconName.Musd, color: "#8BB7F8" },
  { key: "tokens", label: "Tokens", value: "$18.32", pct: "13%", icon: IconName.Ethereum, color: "#C5B8F5" },
  { key: "perps", label: "Perps", value: "$0.00", pct: "0%", symbol: "∞", color: "#D6D6D6" },
  { key: "predict", label: "Predictions", value: "$123.12", pct: "87%", icon: IconName.Predictions, color: "#9A9A9A", href: "/" },
  { key: "defi", label: "DeFi", value: "$0.45", pct: "<1%", symbol: "%", color: "#6F6F6F" },
] as const;

function ActionGrid({ onPredict }: { onPredict: () => void }) {
  return (
    <Box twClassName="gap-4 px-4 pb-2 pt-5">
      {ACTION_ROWS.map((row) => (
        <Box
          key={row.map((item) => item.label).join("-")}
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          twClassName="w-full"
        >
          {row.map((item) => (
            <Pressable
              key={item.label}
              onPress={item.href === "/" ? onPredict : undefined}
              style={{ flex: 1, alignItems: "center" }}
            >
              <Box
                alignItems={BoxAlignItems.Center}
                justifyContent={BoxJustifyContent.Center}
                twClassName="h-14 w-14 rounded-full border border-muted bg-muted"
              >
                <Icon color={IconColor.IconAlternative} name={item.icon} size={IconSize.Lg} />
              </Box>
              <MmText
                color={TextColor.TextDefault}
                fontWeight={FontWeight.Medium}
                numberOfLines={1}
                twClassName="mt-2 w-full text-center"
                variant={TextVariant.BodySm}
              >
                {item.label}
              </MmText>
            </Pressable>
          ))}
        </Box>
      ))}
    </Box>
  );
}

function Circle({ bg, size = 40, children }: { bg: string; size?: number; children: React.ReactNode }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
      {children}
    </View>
  );
}

function SectionTitle({ label, onPress, onTitlePress }: { label: string; onPress?: () => void; onTitlePress?: () => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16 }}>
      <Pressable onPress={onTitlePress ?? onPress} hitSlop={8} disabled={!onTitlePress && !onPress}>
        <Text style={styles.sectionTitle}>{label}</Text>
      </Pressable>
      {onPress ? (
        <Pressable onPress={onPress} hitSlop={10}>
          <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: HAIR, marginVertical: 20 }} />;
}

// ---------------------------------------------------------------- tokens

const TOKENS = [
  { id: "eth1", name: "Ethereum", sub: "$1,782.90 · -1.25%", subNeg: true, value: "$5.99", qty: "0.00335 ETH", bg: "#7c8af0", glyph: "Ξ" },
  { id: "eth2", name: "Ethereum", sub: "$1,782.90 · -1.25%", subNeg: true, value: "$5.46", qty: "0.00306 ETH", bg: "#7c8af0", glyph: "Ξ" },
  { id: "eth3", name: "Ethereum", sub: "$1,782.90 · -1.25%", subNeg: true, value: "$3.88", qty: "0.00217 ETH", bg: "#7c8af0", glyph: "Ξ" },
  { id: "pol", name: "POL", sub: "$0.0829 · +2.72%", subNeg: false, value: "$2.20", qty: "26.47811 POL", bg: "#7b3fe4", glyph: "P" },
  { id: "avax", name: "AVAX", sub: "$6.48 · +0.93%", subNeg: false, value: "$0.45", qty: "0.06929 AVAX", bg: "#e84142", glyph: "A" },
];

const PERPS = [
  { id: "linea", label: "LINEA", pct: "+7.95%", bg: "#61dfff" },
  { id: "bsv", label: "BSV", pct: "+7.10%", bg: "#eab300" },
  { id: "cl", label: "CL", pct: "+6.28%", bg: "#f4f4f4" },
  { id: "eigen", label: "EIGEN", pct: "+4.52%", bg: "#1a0c6d" },
  { id: "jto", label: "JTO", pct: "+4.16%", bg: "#141414" },
  { id: "mega", label: "MEGA", pct: "+3.90%", bg: "#4a4a4a" },
];

const TRADERS = [
  { id: "t1", name: "0xfb94...", gain: "+$286.3K", bg: "#e08bf7" },
  { id: "t2", name: "mtaave...", gain: "+$136K", bg: "#5b2a86" },
  { id: "t3", name: "yieldz...", gain: "+$98.2K", bg: "#2743c9" },
];

// ------------------------------------------------------- predictions section

function LivePill({ clock }: { clock: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, height: 28, paddingHorizontal: 10, borderRadius: 14, backgroundColor: colors.surface }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.greenOutline }} />
      <Text style={{ fontFamily: geist.medium, fontSize: 13, color: "#fff" }}>Live</Text>
      <Text style={{ fontFamily: geist.medium, fontSize: 13, color: colors.liveYellow, fontVariant: ["tabular-nums"] }}>{clock}</Text>
    </View>
  );
}

function OppRow({ icon, title, sub, right, onPress }: { icon: React.ReactNode; title: string; sub: string; right?: React.ReactNode; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, opacity: pressed ? 0.6 : 1 })}>
      {icon}
      <View style={{ flex: 1, minWidth: 0, marginLeft: 12, marginRight: 8 }}>
        <Text style={{ fontFamily: geist.semibold, fontSize: 16, color: "#fff" }} numberOfLines={2}>{title}</Text>
        <Text style={{ fontFamily: geist.regular, fontSize: 14, color: colors.textMuted, marginTop: 2 }} numberOfLines={1}>{sub}</Text>
      </View>
      {right}
      <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} style={{ marginLeft: 6 }} />
    </Pressable>
  );
}

function PredictionsSection() {
  const router = useRouter();
  const placed = usePlacedPositions();
  // Entering the Predictions surface from the wallet raises the onboarding
  // (verification) flow over the destination screen. Small delay so the push
  // transition lands first.
  const triggerOnboarding = () => setTimeout(() => requestOnboarding(), 250);
  const openApp = () => {
    router.push("/");
    triggerOnboarding();
  };

  // Aggregate unrealized P&L across the session's real positions.
  const totals = placed.reduce(
    (acc, p) => {
      const { current } = mockCurrent(p);
      acc.cost += p.cost;
      acc.current += current;
      return acc;
    },
    { cost: 0, current: 0 },
  );
  const gain = totals.current - totals.cost;
  const gainPct = totals.cost > 0 ? (gain / totals.cost) * 100 : 0;

  return (
    <View>
      <SectionTitle label="Predictions" onPress={openApp} onTitlePress={openApp} />

      {placed.length > 0 ? (
        <View style={{ marginTop: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16 }}>
            <Text style={{ fontFamily: geist.medium, fontSize: 14, color: colors.green }}>
              {`${gain >= 0 ? "+" : "-"}$${Math.abs(gain).toFixed(2)} (${gain >= 0 ? "+" : ""}${gainPct.toFixed(0)}%)`}
            </Text>
            <Text style={{ fontFamily: geist.regular, fontSize: 14, color: colors.textMuted }}>Unrealized P&amp;L</Text>
          </View>
          {placed.map((p) => {
            const { current, changePct } = mockCurrent(p);
            const combo = p.kind === "combo";
            return (
              <Pressable
                key={p.id}
                onPress={() => {
                  router.push("/positions");
                  triggerOnboarding();
                }}
                style={({ pressed }) => ({ flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 16, paddingTop: 14, opacity: pressed ? 0.6 : 1 })}
              >
                <Circle bg={colors.surface} size={40}>
                  {combo ? (
                    <ComboMark size={24} gradient />
                  ) : (
                    <PositionAvatar market={p.market} title={p.title} size={40} />
                  )}
                </Circle>
                <View style={{ flex: 1, minWidth: 0, marginLeft: 12, marginRight: 8 }}>
                  <Text style={{ fontFamily: geist.semibold, fontSize: 16, color: "#fff", lineHeight: 22 }} numberOfLines={2}>
                    {combo ? `${p.legs.length} market combination` : p.market ?? p.title}
                  </Text>
                  <Text style={{ fontFamily: geist.regular, fontSize: 14, color: colors.textMuted, marginTop: 2 }} numberOfLines={1}>
                    {combo
                      ? `$${p.cost.toFixed(0)} to win $${(p.cost + p.toWin).toFixed(2)}`
                      : `$${p.cost.toFixed(0)} on ${p.title} to win $${(p.cost + p.toWin).toFixed(2)}`}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontFamily: geist.semibold, fontSize: 16, color: "#fff" }}>${current.toFixed(2)}</Text>
                  <Text style={{ fontFamily: geist.medium, fontSize: 13, color: colors.green, marginTop: 2 }}>
                    +{changePct.toFixed(2)}%
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <Text style={{ fontFamily: geist.regular, fontSize: 14, color: colors.textMuted }}>No positions</Text>
        </View>
      )}

      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <Pressable onPress={() => router.push("/claim")} style={({ pressed }) => [styles.claimBtn, pressed && { opacity: 0.8 }]}>
          <Text style={{ fontFamily: geist.medium, fontSize: 16, color: "#fff" }}>Claim $1.00</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- screen

export default function WalletHomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <ScrollView contentContainerStyle={{ paddingTop: screenTopInset(insets.top) + 8, paddingBottom: insets.bottom + 96 }}>
        {/* Account bar */}
        <View style={{ height: 48, flexDirection: "row", alignItems: "center", paddingHorizontal: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
            <Text style={{ fontFamily: geist.semibold, fontSize: 18, color: "#fff" }}>Account 2</Text>
            <MaterialIcons name="keyboard-arrow-down" size={22} color="#fff" />
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
            <MaterialIcons name="history" size={22} color="#fff" />
            <MaterialIcons name="content-copy" size={20} color="#fff" />
            <MaterialIcons name="menu" size={22} color="#fff" />
          </View>
        </View>

        {/* Balance */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <Text style={{ fontFamily: geist.bold, fontSize: 40, lineHeight: 48, color: "#fff", letterSpacing: -0.5 }}>$141.89</Text>
          <Text style={{ fontFamily: geist.medium, fontSize: 14, color: colors.red, marginTop: 4 }}>-$0.14 (-0.10%)  1d</Text>
        </View>

        <ActionGrid onPredict={() => router.push("/")} />

        <Box twClassName="mt-3 pt-2">
          {BREAKDOWN.map((row) => (
            <ListItem
              key={row.key}
              isInteractive={"href" in row}
              onPress={"href" in row ? () => router.push(row.href as never) : undefined}
              avatar={
                <Box
                  alignItems={BoxAlignItems.Center}
                  justifyContent={BoxJustifyContent.Center}
                  twClassName="h-8 w-8 rounded-full bg-muted"
                >
                  {"icon" in row && row.icon ? (
                    <Icon color={IconColor.IconDefault} name={row.icon} size={IconSize.Md} />
                  ) : (
                    <MmText fontWeight={FontWeight.Medium} variant={TextVariant.HeadingSm}>
                      {"symbol" in row ? row.symbol : ""}
                    </MmText>
                  )}
                </Box>
              }
              title={
                <Box alignItems={BoxAlignItems.Center} flexDirection={BoxFlexDirection.Row} twClassName="min-w-0" gap={1}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: row.color, marginRight: 4 }} />
                  <MmText fontWeight={FontWeight.Medium} variant={TextVariant.BodyMd} numberOfLines={1}>
                    {row.label}
                  </MmText>
                  <MmText color={TextColor.TextAlternative} variant={TextVariant.BodyMd}>
                    • {row.pct}
                  </MmText>
                  {"apy" in row && row.apy ? (
                    <Box twClassName="ml-1 rounded-md bg-success-muted px-1.5 py-0.5">
                      <MmText color={TextColor.SuccessDefault} fontWeight={FontWeight.Medium} variant={TextVariant.BodySm}>
                        {row.apy}
                      </MmText>
                    </Box>
                  ) : null}
                </Box>
              }
              value={row.value}
              variant={ContentVariant.OneLine}
              twClassName="min-h-10 py-0"
            />
          ))}
        </Box>

        <Divider />

        {/* Tokens */}
        <SectionTitle label="Tokens" />
        <View style={{ marginTop: 4 }}>
          {TOKENS.map((t) => (
            <View key={t.id} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10 }}>
              <Circle bg={t.bg}>
                <Text style={{ fontFamily: geist.bold, fontSize: 18, color: "#fff" }}>{t.glyph}</Text>
              </Circle>
              <View style={{ flex: 1, minWidth: 0, marginLeft: 12, marginRight: 8 }}>
                <Text style={{ fontFamily: geist.semibold, fontSize: 16, color: "#fff" }}>{t.name}</Text>
                <Text style={{ fontFamily: geist.regular, fontSize: 13, color: t.subNeg ? colors.red : colors.green, marginTop: 2 }}>{t.sub}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontFamily: geist.semibold, fontSize: 16, color: "#fff" }}>{t.value}</Text>
                <Text style={{ fontFamily: geist.regular, fontSize: 13, color: colors.textMuted, marginTop: 2 }}>{t.qty}</Text>
              </View>
            </View>
          ))}
        </View>

        <Divider />

        {/* Perps movers */}
        <SectionTitle label="Perps movers" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 16, marginTop: 12 }}>
          {PERPS.map((p) => (
            <View key={p.id} style={{ flexDirection: "row", alignItems: "center", gap: 8, height: 44, paddingLeft: 6, paddingRight: 14, borderRadius: 22, backgroundColor: colors.surface }}>
              <Circle bg={p.bg} size={30}>
                <Text style={{ fontFamily: geist.bold, fontSize: 13, color: p.bg === "#f4f4f4" ? "#000" : "#fff" }}>{p.label[0]}</Text>
              </Circle>
              <Text style={{ fontFamily: geist.semibold, fontSize: 14, color: "#fff" }}>{p.label}</Text>
              <Text style={{ fontFamily: geist.medium, fontSize: 14, color: colors.green }}>{p.pct}</Text>
            </View>
          ))}
        </View>

        <Divider />

        {/* Predictions — the section this whole screen exists for */}
        <PredictionsSection />

        <Divider />

        {/* Weekly Top Traders */}
        <SectionTitle label="Weekly Top Traders" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingTop: 12 }}>
          {TRADERS.map((t) => (
            <View key={t.id} style={{ width: 168, borderRadius: 16, backgroundColor: colors.surface, padding: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Circle bg={t.bg} size={36}>
                  <Text style={{ fontFamily: geist.bold, fontSize: 15, color: "#fff" }}>{t.name[0].toUpperCase()}</Text>
                </Circle>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ fontFamily: geist.semibold, fontSize: 14, color: "#fff" }}>{t.name}</Text>
                  <Text style={{ fontFamily: geist.medium, fontSize: 13, color: colors.green, marginTop: 2 }}>{t.gain}</Text>
                </View>
              </View>
              <View style={{ height: 36, borderRadius: 18, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", marginTop: 12 }}>
                <Text style={{ fontFamily: geist.semibold, fontSize: 14, color: "#000" }}>Follow</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <Divider />

        {/* DeFi */}
        <SectionTitle label="DeFi" />
        <View style={{ marginTop: 4 }}>
          {["$1.05", "$1.03"].map((v, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10 }}>
              <Circle bg="#8f7df8">
                <Ionicons name="planet" size={20} color="#fff" />
              </Circle>
              <View style={{ flex: 1, minWidth: 0, marginLeft: 12 }}>
                <Text style={{ fontFamily: geist.semibold, fontSize: 16, color: "#fff" }}>Aave V3</Text>
                <Text style={{ fontFamily: geist.regular, fontSize: 13, color: colors.textMuted, marginTop: 2 }}>USDC only</Text>
              </View>
              <Text style={{ fontFamily: geist.semibold, fontSize: 16, color: "#fff" }}>{v}</Text>
            </View>
          ))}
        </View>

        <Divider />

        {/* More */}
        <SectionTitle label="More" />
        <View style={{ marginTop: 4 }}>
          {[
            { label: "Import a token", icon: "add" as const },
            { label: "Import an NFT", icon: "add" as const },
            { label: "Contact support", icon: "help-outline" as const },
          ].map((m) => (
            <View key={m.label} style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14 }}>
              <MaterialIcons name={m.icon} size={22} color="#fff" />
              <Text style={{ flex: 1, fontFamily: geist.medium, fontSize: 16, color: "#fff" }}>{m.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom tab bar */}
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingBottom: insets.bottom + 6, paddingTop: 8, backgroundColor: "#000", borderTopWidth: 1, borderTopColor: HAIR, flexDirection: "row", alignItems: "center" }}>
        {([
          { label: "Home", icon: "home" as const, active: true },
          { label: "Explore", icon: "search" as const },
        ]).map((t) => (
          <View key={t.label} style={styles.tabItem}>
            <MaterialIcons name={t.icon} size={22} color={t.active ? "#fff" : colors.textMuted} />
            <Text style={[styles.tabLabel, t.active && { color: "#fff" }]}>{t.label}</Text>
          </View>
        ))}
        <View style={styles.tabItem}>
          <Pressable onPress={() => router.push("/")} style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", marginTop: -18 }}>
            <MaterialIcons name="add" size={28} color="#fff" />
          </Pressable>
          <Text style={styles.tabLabel}>Trade</Text>
        </View>
        {([
          { label: "Money", icon: "attach-money" as const },
          { label: "Rewards", icon: "pets" as const },
        ]).map((t) => (
          <View key={t.label} style={styles.tabItem}>
            <MaterialIcons name={t.icon} size={22} color={colors.textMuted} />
            <Text style={styles.tabLabel}>{t.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontFamily: geist.semibold, fontSize: 20, lineHeight: 26, color: "#fff" },
  claimBtn: { height: 48, borderRadius: 14, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  tabItem: { flex: 1, alignItems: "center", gap: 3 },
  tabLabel: { fontFamily: geist.medium, fontSize: 11, color: colors.textMuted },
});
