import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { PageHeader } from "@/components/PageHeader";
import LeaguePage from "@/components/LeaguePage";
import { LEAGUES } from "@/data/leagues";
import { geist } from "@/lib/sim/geistFonts";

const c = colors.light;

function EmptyState({ title, label }: { title: string; label: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <PageHeader title={title} />
      <ScrollView contentContainerStyle={styles.emptyWrap}>
        <View style={styles.emptyIcon}>
          <Feather name="calendar" size={28} color={c.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>No markets yet</Text>
        <Text style={styles.emptyBody}>
          Markets for {label} aren&apos;t live yet. Check back soon.
        </Text>
      </ScrollView>
    </View>
  );
}

export default function SportSlugScreen() {
  const { slug, label } = useLocalSearchParams<{ slug?: string; label?: string }>();
  const s = typeof slug === "string" ? slug : "";
  const cfg = LEAGUES[s];
  const title = cfg?.label ?? (typeof label === "string" && label.length > 0 ? label : "Sport");

  if (!cfg) return <EmptyState title={title} label={title} />;

  return (
    <LeaguePage title={cfg.label} filters={cfg.filters} sections={cfg.sections} />
  );
}

const styles = StyleSheet.create({
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: c.surface,
    alignItems: "center", justifyContent: "center",
  },
  emptyTitle: { color: "#fff", fontFamily: geist.semibold, fontSize: 18 },
  emptyBody: { color: c.textMuted, fontFamily: geist.medium, fontSize: 14, textAlign: "center", maxWidth: 280 },
});
