import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

import { colors } from "@/lib/sim/colors";
import { geist } from "@/lib/sim/geistFonts";

// ── Kalshi IA shared pieces ──────────────────────────────────────────────────
// Kalshi's sports information architecture (user screenshots, Aug 17 2026),
// rendered with the app's own visual system: pages use the shared dynamic
// PageHeader with this tab nav below it, and all market cards are the
// existing home-feed cards (MatchCard / BinaryCard via UxrCardProviders) —
// only the IA structure (tabs, league rows, icon rail) is Kalshi's.
// Active when Settings → Sports IA = "Kalshi" (lib/sim/sportsIaStore.ts).

const HAIRLINE = "rgba(255,255,255,0.10)";
const MUTED = "#8b9096";

// ── Text tabs: uppercase, letter-spaced, no pills ────────────────────────────
export function KalshiTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: T; label: string }[];
  active: T;
  onChange: (t: T) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ flexDirection: "row", gap: 26, paddingHorizontal: 16, paddingVertical: 10 }}
      style={{ flexGrow: 0 }}
    >
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <Pressable key={t.key} onPress={() => onChange(t.key)} hitSlop={6}>
            <Text
              style={{
                fontFamily: geist.bold,
                fontSize: 13,
                letterSpacing: 1.2,
                color: on ? colors.textPrimary : "#6c7076",
                textTransform: "uppercase",
              }}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ── Section heading ("Happening now", "Featured") ───────────────────────────
export function KalshiSectionTitle({ title }: { title: string }) {
  return (
    <Text style={{ fontFamily: geist.bold, fontSize: 22, color: colors.textPrimary, paddingHorizontal: 16 }}>
      {title}
    </Text>
  );
}

// ── League list row (LEAGUES tab: name — count — chevron) ───────────────────
export function KalshiLeagueRow({
  name,
  count,
  onPress,
  last,
}: {
  name: string;
  count: number;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        height: 56,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: HAIRLINE,
      }}
    >
      <Text style={{ flex: 1, fontFamily: geist.semibold, fontSize: 16, color: colors.textPrimary }} numberOfLines={1}>
        {name}
      </Text>
      <Text style={{ fontFamily: geist.medium, fontSize: 15, color: MUTED, marginRight: 10 }}>{count}</Text>
      <Ionicons name="chevron-forward" size={16} color={MUTED} />
    </Pressable>
  );
}

// ── Sport icon rail (Kalshi sports hub): icon over label, hairline dividers ─
const SPORT_MI: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  baseball: "sports-baseball",
  combat: "sports-mma",
  soccer: "sports-soccer",
  cricket: "sports-cricket",
  basketball: "sports-basketball",
  football: "sports-football",
  hockey: "sports-hockey",
  rugby: "sports-rugby",
  tennis: "sports-tennis",
  golf: "sports-golf",
  motorsports: "sports-motorsports",
  esports: "sports-esports",
  cycling: "directions-bike",
  chess: "grid-on",
  poker: "style",
  pickleball: "sports-tennis",
  "table-tennis": "sports-tennis",
};

export function KalshiSportRail({
  sports,
  onPress,
}: {
  sports: { slug: string; label: string; emoji: string }[];
  onPress: (slug: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0, borderTopWidth: 1, borderBottomWidth: 1, borderColor: HAIRLINE }}
      contentContainerStyle={{ flexDirection: "row", alignItems: "stretch" }}
    >
      {sports.map((s, i) => (
        <Pressable
          key={s.slug}
          onPress={() => onPress(s.slug)}
          style={{
            width: 98,
            paddingVertical: 14,
            alignItems: "center",
            gap: 8,
            borderLeftWidth: i === 0 ? 0 : 1,
            borderLeftColor: HAIRLINE,
          }}
        >
          {SPORT_MI[s.slug] ? (
            <MaterialIcons name={SPORT_MI[s.slug]} size={26} color={colors.textPrimary} />
          ) : (
            <Text style={{ fontSize: 22 }}>{s.emoji}</Text>
          )}
          <Text style={{ fontFamily: geist.bold, fontSize: 13, color: colors.textPrimary }} numberOfLines={1}>
            {s.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
