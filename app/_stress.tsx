import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import colors from "@/constants/colors";
import { PageHeader } from "@/components/PageHeader";
import { CategoryFeed, type Section } from "@/components/CategoryFeed";
import { geist } from "@/lib/sim/geistFonts";

const c = colors.light;

const LONG = "Pneumonoultramicroscopicsilicovolcanoconiosisresearchcommittee";
const PARA =
  "This is an unusually long prediction title that someone might enter for a market and we want to confirm it does not break the layout no matter how many words it spans across the row.";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.sectionBody}>{children}</View>
    </View>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <Text style={s.label}>{children}</Text>;
}

// --- Replicas of patterns from real screens ---

function BalanceCard({ available, pnl, pnlColor }: { available: string; pnl: string; pnlColor: string }) {
  return (
    <View style={s.card}>
      <View style={[s.cardRow, { borderBottomWidth: 1, borderBottomColor: c.bg }]}>
        <Text style={s.cardLabel} numberOfLines={1}>Available balance</Text>
        <Text style={s.cardValue} numberOfLines={1}>{available}</Text>
      </View>
      <View style={s.cardRow}>
        <Text style={s.cardLabel} numberOfLines={1}>Unrealized P&amp;L</Text>
        <Text style={[s.cardValue, { color: pnlColor }]} numberOfLines={1}>{pnl}</Text>
      </View>
    </View>
  );
}

function PositionRow({
  title, meta, current, change, positive,
}: { title: string; meta: string; current: string; change: string; positive: boolean }) {
  return (
    <View style={s.posRow}>
      <View style={s.logoBox}>
        <Text style={{ color: "#fff", fontFamily: geist.bold }}>X</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0, marginLeft: 12, marginRight: 8 }}>
        <Text style={s.posTitle} numberOfLines={1}>{title}</Text>
        <Text style={s.posMeta} numberOfLines={1}>{meta}</Text>
      </View>
      <View style={{ alignItems: "flex-end", maxWidth: 110 }}>
        <Text style={s.posCurrent} numberOfLines={1}>{current}</Text>
        <Text style={[s.posChange, { color: positive ? c.green : c.red }]} numberOfLines={1}>
          {change}
        </Text>
      </View>
    </View>
  );
}

function BreakdownRow({ label, sub, amount, color }: { label: string; sub: string; amount: string; color: string }) {
  return (
    <View style={s.brkRow}>
      <View style={[s.dot, { backgroundColor: color }]} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.brkLabel} numberOfLines={1}>{label}</Text>
        <Text style={s.brkSub} numberOfLines={1}>{sub}</Text>
      </View>
      <Text style={[s.brkAmount, { color, maxWidth: 120 }]} numberOfLines={1}>{amount}</Text>
    </View>
  );
}

function ClaimCta({ text, bg = c.accent, color = "#fff" }: { text: string; bg?: string; color?: string }) {
  return (
    <Pressable style={[s.cta, { backgroundColor: bg }]}>
      <Text style={[s.ctaText, { color }]} numberOfLines={1}>{text}</Text>
    </Pressable>
  );
}

function QuickAction({ label, badge }: { label: string; badge?: string }) {
  return (
    <View style={s.quickCard}>
      <View>
        <Feather name="briefcase" size={22} color="#fff" />
        {badge ? (
          <View style={s.badge}>
            <Text style={s.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={s.quickLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

// --- Page ---

export default function StressScreen() {
  const insets = useSafeAreaInsets();

  // CategoryFeed extreme data
  const longSections: Section[] = [
    {
      title: "Section with an extremely long header that should not wrap or push the row sideways",
      matches: [
        {
          league: "Super Long League Name That Goes On",
          leagueColor: c.bitcoin,
          live: { mins: "120'" },
          teams: [
            { name: LONG.slice(0, 25), pct: "150%", color: "#0c5b3c", initial: "AAA" },
            { name: "B", pct: "-10%", color: "#cf102c", initial: "B" },
          ],
          vol: "$999,999,999.99 Vol.",
          date: "Tomorrow at 3:30 PM EST, 11 June 2026",
        },
      ],
    },
  ];
  const emptySections: Section[] = [];

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <PageHeader title="UI Stress Test" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}>

        <Section title="Balance numbers (huge / negative / zero)">
          <Label>Massive balance</Label>
          <View style={{ paddingHorizontal: 16 }}>
            <Text style={s.balance} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
              $1,234,567,890.99
            </Text>
            <Text style={s.balanceMeta} numberOfLines={1}>
              <Text style={{ color: c.red }}>-$1,234,567.89 (99.99%)</Text>
              <Text style={{ color: c.textMuted }}>  ·  $999,999.99 available</Text>
            </Text>
          </View>
          <Label>Zero balance</Label>
          <View style={{ paddingHorizontal: 16 }}>
            <Text style={s.balance} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>$0.00</Text>
            <Text style={s.balanceMeta} numberOfLines={1}>
              <Text style={{ color: c.textMuted }}>$0.00 available</Text>
            </Text>
          </View>
        </Section>

        <Section title="Balance / PNL card">
          <Label>Huge available + PNL</Label>
          <BalanceCard available="$1,234,567,890.12" pnl="+$1,234,567.89 (+999.99%)" pnlColor={c.green} />
          <Label>Negative PNL, zero balance</Label>
          <BalanceCard available="$0.00" pnl="-$1,234,567.89 (-99.99%)" pnlColor={c.red} />
        </Section>

        <Section title="Quick actions (long labels)">
          <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 16 }}>
            <QuickAction label="Mes positions financières" badge="999" />
            <QuickAction label="Add funds via wire transfer" />
            <QuickAction label="Withdraw" />
          </View>
        </Section>

        <Section title="Claim CTA (extreme amounts)">
          <ClaimCta text="Claim $1,234,567.89 rewards from your winning positions" />
          <ClaimCta text="Claim $0.00" />
          <ClaimCta text="Done" bg={c.green} color={c.bg} />
        </Section>

        <Section title="Position rows (long titles, huge amounts, zero, negative)">
          <PositionRow
            title={PARA}
            meta="$9,999,999 on Some Extremely Long Side Name Here · 99¢"
            current="$1,234,567.89"
            change="+999.99%"
            positive
          />
          <PositionRow
            title="Short title"
            meta="$1 on Up · 1¢"
            current="$0.00"
            change="-100.00%"
            positive={false}
          />
          <PositionRow
            title={LONG}
            meta="No spaces in this stake or side"
            current="—"
            change="0.00%"
            positive
          />
        </Section>

        <Section title="Empty positions list">
          <View style={{ padding: 32, alignItems: "center", backgroundColor: c.surface, borderRadius: 12, marginHorizontal: 16 }}>
            <Text style={{ color: c.textMuted, fontFamily: geist.regular, fontSize: 14 }}>
              No active positions yet
            </Text>
          </View>
        </Section>

        <Section title="Claim breakdown rows (long labels, huge amounts)">
          <View style={{ marginHorizontal: 16, backgroundColor: c.surface, borderRadius: 12 }}>
            <BreakdownRow
              label="An exceptionally long source label that should ellipsize"
              sub="And a very long subtitle line that also must truncate"
              amount="+$1,234,567.89"
              color={c.green}
            />
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.surface2 }} />
            <BreakdownRow label={LONG} sub="x" amount="+$0.01" color={c.accent} />
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.surface2 }} />
            <BreakdownRow label="Short" sub="Short" amount="+$9,999,999.99" color={c.bitcoin} />
          </View>
        </Section>

        <Section title="Page header (long title)">
          <View style={{ height: 56 }}>
            <PageHeader title="An extremely long screen title that should not push the icons" />
          </View>
        </Section>

        <Section title="Match cards (long names, > 100% / negative pct, missing logos)">
          <View style={{ height: 320 }}>
            <CategoryFeed
              title="Sports"
              topTabs={["A","Tab with a really long name","C"]}
              filters={["All","Live","Filter with a long name"]}
              sections={longSections}
            />
          </View>
        </Section>

        <Section title="Empty filter state">
          <View style={{ height: 200 }}>
            <CategoryFeed
              title="Sports"
              topTabs={["A","B"]}
              filters={["All","Live"]}
              sections={emptySections}
            />
          </View>
        </Section>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  section: { paddingTop: 16, gap: 8 },
  sectionTitle: {
    color: "#fff", fontFamily: geist.semibold, fontSize: 15,
    paddingHorizontal: 16, paddingTop: 8,
  },
  sectionBody: { gap: 12 },
  label: {
    color: c.textMuted, fontFamily: geist.medium, fontSize: 12,
    paddingHorizontal: 16, paddingTop: 4,
  },

  // Balance numbers
  balance: { color: "#fff", fontFamily: geist.semibold, fontSize: 40, lineHeight: 50 },
  balanceMeta: { fontFamily: geist.medium, fontSize: 14 },

  // Card
  card: { borderRadius: 12, overflow: "hidden", backgroundColor: c.surface, marginHorizontal: 16 },
  cardRow: {
    height: 52, paddingHorizontal: 12,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  cardLabel: { color: c.textMuted, fontFamily: geist.medium, fontSize: 16, flexShrink: 1, paddingRight: 8 },
  cardValue: { color: "#fff", fontFamily: geist.medium, fontSize: 16 },

  // Quick action
  quickCard: {
    flex: 1, backgroundColor: c.surfaceTransparent, borderRadius: 12,
    paddingVertical: 12, alignItems: "center", gap: 4,
  },
  quickLabel: { color: "#fff", fontFamily: geist.medium, fontSize: 14, paddingHorizontal: 8 },
  badge: {
    position: "absolute", right: -12, top: -6,
    minWidth: 16, paddingHorizontal: 4, height: 16, borderRadius: 8,
    backgroundColor: c.red, alignItems: "center", justifyContent: "center",
  },
  badgeText: { color: c.bg, fontFamily: geist.medium, fontSize: 11 },

  // CTA
  cta: {
    height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center",
    marginHorizontal: 16, paddingHorizontal: 16,
  },
  ctaText: { fontFamily: geist.medium, fontSize: 16 },

  // Position row
  posRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
  },
  logoBox: {
    width: 44, height: 44, borderRadius: 8, backgroundColor: c.surface2,
    alignItems: "center", justifyContent: "center",
  },
  posTitle: { color: "#fff", fontFamily: geist.medium, fontSize: 15, lineHeight: 20 },
  posMeta: { color: c.textMuted, fontFamily: geist.medium, fontSize: 13, marginTop: 2 },
  posCurrent: { color: "#fff", fontFamily: geist.medium, fontSize: 16 },
  posChange: { fontFamily: geist.medium, fontSize: 13, marginTop: 2 },

  // Breakdown row
  brkRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  brkLabel: { color: "#fff", fontFamily: geist.medium, fontSize: 15 },
  brkSub: { color: c.textMuted, fontFamily: geist.medium, fontSize: 12, marginTop: 2 },
  brkAmount: { fontFamily: geist.semibold, fontSize: 15 },
});
