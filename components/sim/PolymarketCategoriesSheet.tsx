import { useEffect, useRef, useState } from "react";
import { Animated, Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/lib/sim/colors";
import { sheetEnter, sheetExit, backdropIn, backdropOut } from "@/lib/sim/sheetMotion";
import { useSportsIa } from "@/lib/sim/sportsIaStore";
import type { HomeCategorySelect } from "./FeedChrome";
import { geist } from "@/lib/sim/geistFonts";

type Category = {
  label: string;
  icon: string;
  key?: string;
  route?: string;
};

const CATEGORIES: Category[] = [
  { label: "Home", icon: "🧭" },
  { label: "MLB", icon: "⚾", key: "sport:baseball" },
  { label: "Tennis", icon: "🎾", key: "sport:tennis" },
  { label: "Table Tennis", icon: "🏓", key: "sport:tabletennis" },
  { label: "Soccer", icon: "⚽", key: "sport:soccer" },
  { label: "Darts", icon: "🎯", route: "/uxr-hub/sports" },
  { label: "NFL", icon: "🏈", key: "sport:football" },
  { label: "CFB", icon: "🏈", key: "sport:football" },
  { label: "Crypto", icon: "₿", key: "crypto" },
  { label: "Basketball", icon: "🏀", key: "sport:basketball" },
  { label: "Cricket", icon: "🏏", key: "sport:cricket" },
  { label: "Esports", icon: "🎮", key: "sport:esports" },
  { label: "Golf", icon: "⛳", key: "sport:golf" },
  { label: "Motorsports", icon: "🏎️", key: "sport:motorsports" },
  { label: "Pickleball", icon: "🎾", key: "sport:pickleball" },
  { label: "Baseball", icon: "⚾", key: "sport:baseball" },
  { label: "UFC", icon: "🥊", key: "sport:combat" },
  { label: "Hockey", icon: "🏒", key: "sport:hockey" },
  { label: "Boxing", icon: "🥊", key: "sport:combat" },
  { label: "Politics", icon: "♟️", key: "politics" },
  { label: "Weather", icon: "🌤️", route: "/trending" },
  { label: "Tech", icon: "🧮", route: "/topic/tech" },
  { label: "Econ", icon: "🏛️", route: "/topic/finance" },
  { label: "Culture", icon: "🎬", route: "/topic/culture" },
  { label: "Chess", icon: "♟️", key: "sport:chess" },
];

// Keep this list local. Importing the browse-data module here would create a
// FeedChrome → sheet → UxrBrowse → FeedChrome cycle in the fixture checker.
const availableSportSlugs = new Set([
  "baseball",
  "combat",
  "soccer",
  "cricket",
  "basketball",
  "football",
  "hockey",
  "rugby",
  "tabletennis",
  "golf",
  "motorsports",
  "tennis",
  "pickleball",
  "esports",
  "cycling",
  "poker",
  "chess",
]);

function categoryKey(category: Category): string | null {
  if (!category.key) return null;
  const slug = category.key.startsWith("sport:") ? category.key.slice(6) : null;
  return slug && !availableSportSlugs.has(slug) ? null : category.key;
}

function CategoryRow({
  category,
  active,
  onPress,
}: {
  category: Category;
  active: boolean;
  onPress: () => void;
}) {
  const router = useRouter();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 60,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.06)",
        opacity: pressed ? 0.62 : 1,
      })}
    >
      <Text style={{ width: 36, fontSize: 23, textAlign: "center", marginRight: 8 }}>{category.icon}</Text>
      <Text style={{ flex: 1, fontFamily: active ? geist.semibold : geist.medium, fontSize: 16, color: colors.textPrimary }}>
        {category.label}
      </Text>
      {active ? <Ionicons name="checkmark" size={21} color={colors.textPrimary} /> : <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
    </Pressable>
  );
}

export function PolymarketCategoriesSheet({
  visible,
  onClose,
  select,
}: {
  visible: boolean;
  onClose: () => void;
  select?: HomeCategorySelect;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const sportsIa = useSportsIa();
  const [render, setRender] = useState(visible);
  const [sheetHeight, setSheetHeight] = useState(0);
  const slide = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) setRender(true);
    else Animated.parallel([backdropOut(fade), sheetExit(slide)]).start(({ finished }) => {
      if (finished) setRender(false);
    });
  }, [visible, fade, slide]);

  useEffect(() => {
    if (render && visible) {
      slide.setValue(0);
      fade.setValue(0);
      Animated.parallel([sheetEnter(slide), backdropIn(fade)]).start();
    }
  }, [render, visible, fade, slide]);

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [sheetHeight || winH, 0] });

  const choose = (category: Category) => {
    const key = categoryKey(category);
    if (sportsIa === "polymarket-sport-pages" && key?.startsWith("sport:")) {
      router.push(`/uxr-sport/${key.slice(6)}` as never);
      onClose();
    } else if (select && category.label === "Home") {
      select.onSelect(null);
      onClose();
    } else if (select && key) {
      select.onSelect(select.selected === key ? null : key);
      onClose();
    } else if (category.route) {
      router.push(category.route as never);
      onClose();
    } else if (key) {
      router.push(`/poly-sport/${key.slice(6)}` as never);
      onClose();
    }
  };

  return (
    <Modal visible={render} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Animated.View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.55)", opacity: fade }}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>
        <Animated.View
          onLayout={(event) => setSheetHeight(event.nativeEvent.layout.height)}
          style={{
            maxHeight: winH * 0.94,
            minHeight: 0,
            transform: [{ translateY }],
            backgroundColor: colors.surface,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            paddingTop: 8,
            paddingBottom: insets.bottom,
            overflow: "hidden",
          }}
        >
          <View style={{ alignItems: "center", paddingBottom: 8 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.textMuted }} />
          </View>
          <View style={{ height: 52, flexDirection: "row", alignItems: "center", paddingHorizontal: 20 }}>
            <Pressable onPress={onClose} hitSlop={10} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="close" size={30} color={colors.textPrimary} />
            </Pressable>
            <Text style={{ flex: 1, textAlign: "center", marginRight: 40, fontFamily: geist.bold, fontSize: 20, color: colors.textPrimary }}>
              Categories
            </Text>
          </View>
          <ScrollView style={{ flexShrink: 1 }} showsVerticalScrollIndicator={false}>
            {CATEGORIES.map((category) => {
              const key = categoryKey(category);
              const active = category.label === "Home" ? !select?.selected : !!key && select?.selected === key;
              return <CategoryRow key={category.label} category={category} active={active} onPress={() => choose(category)} />;
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}