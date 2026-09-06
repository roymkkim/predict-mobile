import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { accessibleColor, barFill, colors } from "@/lib/sim/colors";
import { geist } from "@/lib/sim/geistFonts";

// Translucent tint of an accent hex for soft button backgrounds.
function hexA(hex: string, a: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export type Outcome = { label: string; value: string; color: string };

export type MarketEntry =
  | { kind: "buttons"; id: string; title: string; vol: string; outcomes: Outcome[] }
  | {
      kind: "spread";
      id: string;
      title: string;
      subject: string;
      line: string;
      ticks: string[];
      activeTick: number;
      yesPct: string;
      noPct: string;
    };

export type MarketTab = { key: string; title: string; markets: MarketEntry[] };

// A single horizontal outcome button (e.g. "ESP 50¢"): soft accent-tinted pill
// with accent-colored text, reusing the brand accessibleColor helper.
function OutcomeButton({ outcome }: { outcome: Outcome }) {
  const tint = accessibleColor(outcome.color);
  return (
    <Pressable style={[styles.outcomeBtn, { backgroundColor: hexA(outcome.color, 0.16) }]}>
      <Text style={[styles.outcomeText, { color: tint }]} numberOfLines={1}>
        {`${outcome.label} ${outcome.value}`}
      </Text>
    </Pressable>
  );
}

function ButtonsMarket({ title, vol, outcomes }: { title: string; vol: string; outcomes: Outcome[] }) {
  return (
    <View style={styles.market}>
      <View style={styles.marketHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.marketTitle}>{title}</Text>
          <Feather name="info" size={14} color={colors.textMuted} />
        </View>
        <Text style={styles.marketVol}>{vol}</Text>
      </View>
      <View style={styles.outcomeRow}>
        {outcomes.map((o, i) => (
          <OutcomeButton key={i} outcome={o} />
        ))}
      </View>
    </View>
  );
}

// Yes/No row reused from the home feed pattern: label + thin probability bar on
// the left, a colored percentage pill on the right.
function YesNoRow({ label, pct, color }: { label: string; pct: string; color: string }) {
  const val = parseFloat(pct) || 0;
  return (
    <View style={styles.ynRow}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.ynLabel}>{label}</Text>
        <View style={styles.ynTrack}>
          <View style={{ height: 2, borderRadius: 1, width: `${val}%`, backgroundColor: barFill(accessibleColor(color)) }} />
        </View>
      </View>
      <Pressable style={[styles.ynBtn, { backgroundColor: hexA(color, 0.16) }]}>
        <Text style={[styles.ynBtnText, { color: accessibleColor(color) }]}>{pct}</Text>
      </Pressable>
    </View>
  );
}

const SPREAD_PERIODS = ["REG", "1H", "2H"];

function SpreadMarket({ market }: { market: Extract<MarketEntry, { kind: "spread" }> }) {
  const [period, setPeriod] = useState("REG");
  return (
    <View style={styles.market}>
      <View style={styles.marketHeader}>
        <Text style={styles.marketTitle}>{market.title}</Text>
        <View style={styles.spreadControls}>
          <View style={styles.segment}>
            {SPREAD_PERIODS.map((p) => {
              const active = p === period;
              return (
                <Pressable key={p} onPress={() => setPeriod(p)} style={[styles.segmentBtn, active && styles.segmentBtnActive]}>
                  <Text style={[styles.segmentText, active && { color: "#fff" }]}>{p}</Text>
                </Pressable>
              );
            })}
          </View>
          <Feather name="chevron-up" size={18} color={colors.textMuted} />
        </View>
      </View>

      <View style={styles.spreadSentence}>
        <View style={styles.subjectPill}>
          <Text style={styles.subjectText}>{market.subject}</Text>
          <Feather name="repeat" size={12} color={accessibleColor("#e0a423")} />
        </View>
        <Text style={styles.spreadCopy}>wins by more than</Text>
        <View style={styles.linePill}>
          <Text style={styles.lineText}>{market.line}</Text>
          <Feather name="chevron-down" size={14} color={colors.textPrimary} />
        </View>
        <Text style={styles.spreadCopy}>goals</Text>
      </View>

      <View style={styles.tickRow}>
        {market.ticks.map((t, i) => {
          const active = i === market.activeTick;
          return (
            <View key={i} style={styles.tickCol}>
              <Text style={[styles.tickLabel, active && { color: accessibleColor("#e0a423") }]}>{t}</Text>
              <View style={[styles.tickMark, active && { backgroundColor: accessibleColor("#e0a423"), height: 14 }]} />
            </View>
          );
        })}
      </View>

      <View style={{ gap: 8, marginTop: 4 }}>
        <YesNoRow label="Yes" pct={market.yesPct} color={colors.greenOutline} />
        <YesNoRow label="No" pct={market.noPct} color={colors.red} />
      </View>
    </View>
  );
}

// Configurable markets surface: a Games/Props (or more) tab switch over a list
// of market entries, each rendered by kind (button row or spread).
export function MarketsSection({ tabs }: { tabs: MarketTab[] }) {
  const [active, setActive] = useState(tabs[0]?.key ?? "");
  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <View>
      <View style={styles.tabRow}>
        {tabs.map((t) => {
          const isActive = t.key === active;
          return (
            <Pressable
              key={t.key}
              onPress={() => setActive(t.key)}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              <Text style={[styles.tabText, isActive && { color: colors.bg }]}>{t.title}</Text>
            </Pressable>
          );
        })}
      </View>

      <View>
        {current?.markets.map((m) =>
          m.kind === "buttons" ? (
            <ButtonsMarket key={m.id} title={m.title} vol={m.vol} outcomes={m.outcomes} />
          ) : (
            <SpreadMarket key={m.id} market={m} />
          ),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  tab: { paddingHorizontal: 16, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  tabActive: { backgroundColor: "#fff" },
  tabText: { color: colors.textPrimary, fontFamily: geist.medium, fontSize: 14 },

  market: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  marketHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  marketTitle: { color: colors.textPrimary, fontFamily: geist.semibold, fontSize: 16, lineHeight: 22 },
  marketVol: { color: colors.textMuted, fontFamily: geist.medium, fontWeight: "500", fontSize: 13 },

  outcomeRow: { flexDirection: "row", gap: 8 },
  outcomeBtn: { flex: 1, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  outcomeText: { fontFamily: geist.semibold, fontSize: 14 },

  ynRow: { flexDirection: "row", alignItems: "center" },
  ynLabel: { color: colors.textPrimary, fontFamily: geist.regular, fontSize: 14, lineHeight: 20 },
  ynTrack: { height: 2, borderRadius: 1, marginTop: 6, backgroundColor: "transparent", overflow: "hidden" },
  ynBtn: { width: 64, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", marginLeft: 12 },
  ynBtnText: { fontFamily: geist.medium, fontSize: 14 },

  spreadControls: { flexDirection: "row", alignItems: "center", gap: 8 },
  segment: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: 10, padding: 2 },
  segmentBtn: { paddingHorizontal: 12, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  segmentBtnActive: { backgroundColor: colors.surface2 },
  segmentText: { color: colors.textMuted, fontFamily: geist.medium, fontSize: 13 },

  spreadSentence: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
  subjectPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, height: 28, borderRadius: 8, backgroundColor: colors.surface },
  subjectText: { color: accessibleColor("#e0a423"), fontFamily: geist.medium, fontSize: 14 },
  spreadCopy: { color: colors.textPrimary, fontFamily: geist.regular, fontSize: 14 },
  linePill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, height: 28, borderRadius: 8, backgroundColor: colors.surface },
  lineText: { color: colors.textPrimary, fontFamily: geist.medium, fontSize: 14 },

  tickRow: { flexDirection: "row", justifyContent: "center", gap: 28, paddingVertical: 4 },
  tickCol: { alignItems: "center", gap: 4 },
  tickLabel: { color: colors.textMuted, fontFamily: geist.medium, fontSize: 12 },
  tickMark: { width: 2, height: 10, borderRadius: 1, backgroundColor: colors.surface2 },
});
