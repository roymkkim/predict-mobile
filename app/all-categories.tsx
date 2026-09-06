import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "@/lib/sim/haptics";

import colors from "@/constants/colors";
import { PageHeader } from "@/components/PageHeader";
import { ALL_CATEGORIES_SECTIONS, type HomeCategory } from "@/data/categories";
import { geist } from "@/lib/sim/geistFonts";

const c = colors.light;
const flagUri = (cc: string) => ({ uri: `https://flagcdn.com/w80/${cc}.png` });
const tapHaptic = () => { Haptics.selectionAsync().catch(() => {}); };

function CatIcon({ item }: { item: HomeCategory }) {
  if (item.kind === "flag") {
    return <Image source={flagUri(item.cc)} style={styles.iconFlag} resizeMode="cover" />;
  }
  const tint = item.tint ?? "#fff";
  if (item.kind === "ionicon") {
    return <Ionicons name={item.name} size={22} color={tint} />;
  }
  return <MaterialCommunityIcons name={item.name} size={24} color={tint} />;
}

export default function AllCategoriesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <PageHeader title="All categories" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24, gap: 20, paddingTop: 8 }}
      >
        {ALL_CATEGORIES_SECTIONS.map((sec) => (
          <View key={sec.title} style={{ gap: 10 }}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>
            <View style={styles.groupCard}>
              {sec.items.map((item, idx) => (
                <Pressable
                  key={`${sec.title}-${item.label}-${idx}`}
                  onPress={() => { tapHaptic(); router.push(item.href as Href); }}
                  style={({ pressed }) => [
                    styles.row,
                    idx !== sec.items.length - 1 ? styles.rowDivider : null,
                    pressed ? { opacity: 0.7 } : null,
                  ]}
                >
                  <View style={[styles.iconWrap, item.bg ? { backgroundColor: item.bg, borderRadius: 6 } : null]}>
                    <CatIcon item={item} />
                  </View>
                  <Text style={styles.rowLabel} numberOfLines={1}>{item.label}</Text>
                  <Feather name="chevron-right" size={20} color={c.textMuted} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { color: "#fff", fontFamily: geist.semibold, fontSize: 20 },
  groupCard: { backgroundColor: c.surface, borderRadius: 12, overflow: "hidden" },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: c.bg },
  iconWrap: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  iconFlag: { width: 28, height: 28, borderRadius: 6 },
  rowLabel: { color: "#fff", fontFamily: geist.medium, fontSize: 16, flex: 1 },
});
