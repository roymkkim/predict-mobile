import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "@/lib/sim/haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { PageHeader } from "@/components/PageHeader";
import { PulsingDot } from "@/components/PulsingDot";
import { MatchCard, type Section } from "@/components/CategoryFeed";
import { geist } from "@/lib/sim/geistFonts";

const c = colors.light;
const tap = () => { Haptics.selectionAsync().catch(() => {}); };

type Tab = "Games" | "Props" | "Players";
const TABS: Tab[] = ["Games", "Props", "Players"];

export default function LeaguePage({
  title, filters, sections,
}: {
  title: string;
  filters: string[];
  sections: Section[];
}) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("Games");
  const [filter, setFilter] = useState<string>(filters[0] ?? "All");

  const filteredSections = sections
    .map((sec) => ({
      ...sec,
      matches: sec.matches.filter((m) => {
        if (filter === "All") return true;
        if (filter === "Live") return !!m.live;
        return true; // remaining filters (Playoffs/Season/Finals) are dummy buckets
      }),
    }))
    .filter((sec) => sec.matches.length > 0);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <PageHeader title={title} />

      {/* Tabs: Games / Props / Players */}
      <View style={styles.tabRow}>
        {TABS.map((t) => {
          const active = t === tab;
          return (
            <Pressable
              key={t}
              onPress={() => { tap(); setTab(t); }}
              style={styles.tabBtn}
            >
              <Text style={[styles.tabText, active ? styles.tabTextActive : null]}>{t}</Text>
              <View style={[styles.tabUnderline, active ? styles.tabUnderlineActive : null]} />
            </Pressable>
          );
        })}
        <View style={styles.tabRowSpacer} />
      </View>

      {/* Filter chips — fixed-height container prevents overflow onto cards */}
      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filters.map((f) => {
            const active = f === filter;
            if (f === "All") {
              return (
                <Pressable
                  key={f}
                  onPress={() => { tap(); setFilter(f); }}
                  style={[styles.chip, active ? styles.chipAllActive : styles.chipFilled]}
                >
                  <Text style={[styles.chipText, active && { color: "#000" }]}>{f}</Text>
                </Pressable>
              );
            }
            if (f === "Live") {
              return (
                <Pressable
                  key={f}
                  onPress={() => { tap(); setFilter(f); }}
                  style={[styles.chip, active && styles.chipAllActive]}
                >
                  <PulsingDot size={6} color={c.green} />
                  <Text style={[styles.chipText, { color: active ? "#000" : c.green }]}>{f}</Text>
                </Pressable>
              );
            }
            return (
              <Pressable
                key={f}
                onPress={() => { tap(); setFilter(f); }}
                style={[styles.chip, styles.chipFilled, active && styles.chipAllActive]}
              >
                <Text style={[styles.chipText, active && { color: "#000" }]}>{f}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Body */}
      {tab !== "Games" ? (
        <View style={styles.emptyTabWrap}>
          <View style={styles.emptyIcon}>
            <Feather name={tab === "Props" ? "list" : "users"} size={24} color={c.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>{tab} coming soon</Text>
          <Text style={styles.emptyBody}>{tab} markets for {title} aren&apos;t live yet.</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24, gap: 14, paddingTop: 8 }}
        >
          {filteredSections.length === 0 ? (
            <View style={styles.emptyTabWrap}>
              <View style={styles.emptyIcon}>
                <Feather name="calendar" size={24} color={c.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No {filter.toLowerCase()} games</Text>
              <Text style={styles.emptyBody}>Try a different filter.</Text>
            </View>
          ) : filteredSections.map((sec) => (
            <View key={sec.title} style={{ gap: 10 }}>
              <Text style={styles.sectionTitle}>{sec.title}</Text>
              {sec.matches.map((m, i) => (
                <View key={`${sec.title}-${i}`} style={{ paddingHorizontal: 16 }}>
                  <MatchCard m={m} />
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: "row", paddingHorizontal: 16, marginTop: 4, borderBottomWidth: 1, borderBottomColor: c.surface },
  tabBtn: { paddingTop: 8, alignItems: "center", marginRight: 18 },
  tabText: { color: c.textMuted, fontFamily: geist.medium, fontSize: 15, paddingBottom: 10 },
  tabTextActive: { color: "#fff", fontFamily: geist.semibold },
  tabUnderline: { height: 2, width: "100%", backgroundColor: "transparent" },
  tabUnderlineActive: { backgroundColor: "#fff" },
  tabRowSpacer: { flex: 1 },
  filterRow: { height: 68, justifyContent: "center" },
  filterScroll: { paddingHorizontal: 16, gap: 8, alignItems: "center", flexGrow: 1 },
  chip: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingHorizontal: 12, height: 40, borderRadius: 12,
    backgroundColor: c.surface,
  },
  chipFilled: { backgroundColor: c.surface },
  chipAllActive: { backgroundColor: "#fff" },
  chipText: { color: "#fff", fontFamily: geist.medium, fontSize: 14, lineHeight: 22 },
  sectionTitle: { color: c.textMuted, fontFamily: geist.medium, fontSize: 13, paddingHorizontal: 16 },
  emptyTabWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 10 },
  emptyIcon: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: c.surface,
    alignItems: "center", justifyContent: "center",
  },
  emptyTitle: { color: "#fff", fontFamily: geist.semibold, fontSize: 16 },
  emptyBody: { color: c.textMuted, fontFamily: geist.medium, fontSize: 13, textAlign: "center", maxWidth: 260 },
});
