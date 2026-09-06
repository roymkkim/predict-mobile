import React from "react";
import { Animated, Easing, PanResponder, Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { PageHeader } from "@/components/PageHeader";
import { UXR_SPORTS } from "@/components/sim/UxrBrowse";
import { colors } from "@/lib/sim/colors";
import {
  resetSportsTabs,
  setSportsTabOrder,
  toggleSportsTab,
  useSportsTabPreferences,
} from "@/lib/sim/sportsFilterStore";
import { geist } from "@/lib/sim/geistFonts";

const SPORTS = UXR_SPORTS.map(({ slug, label }) => ({ slug, label: slug === "motorsports" ? "Nascar" : label }));

const ROW_HEIGHT = 58;

function SportRow({
  slug,
  label,
  hidden,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  slug: string;
  label: string;
  hidden: boolean;
  dragging: boolean;
  onDragStart: (slug: string) => void;
  onDragEnd: (dy: number) => void;
}) {
  const translateY = React.useRef(new Animated.Value(0)).current;
  const release = React.useCallback((dy: number) => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => onDragEnd(dy));
  }, [onDragEnd, translateY]);
  const panHandlers = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dy) > 2,
        onPanResponderGrant: () => onDragStart(slug),
        onPanResponderMove: (_event, gesture) => translateY.setValue(gesture.dy),
        onPanResponderRelease: (_event, gesture) => release(gesture.dy),
        onPanResponderTerminate: () => release(0),
      }),
    [onDragStart, release, slug, translateY],
  );
  return (
    <Animated.View
      style={{
        height: ROW_HEIGHT,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        opacity: dragging ? 0.55 : hidden ? 0.55 : 1,
        zIndex: dragging ? 1 : 0,
        transform: [{ translateY }],
      }}
    >
      <View
        {...panHandlers.panHandlers}
        accessibilityRole="adjustable"
        accessibilityLabel={`Reorder ${label}`}
        style={{ width: 36, height: "100%", justifyContent: "center" }}
      >
        <MaterialIcons name="drag-handle" size={22} color={colors.textMuted} />
      </View>
      <Text style={{ flex: 1, fontFamily: geist.medium, fontSize: 16, color: hidden ? colors.textMuted : colors.textPrimary }}>
        {label}
      </Text>
      <Pressable
        onPress={() => toggleSportsTab(slug)}
        accessibilityRole="switch"
        accessibilityState={{ checked: !hidden }}
        accessibilityLabel={hidden ? `Show ${label}` : `Hide ${label}`}
        hitSlop={10}
        style={{ width: 36, height: "100%", alignItems: "flex-end", justifyContent: "center" }}
      >
        <MaterialIcons name={hidden ? "visibility-off" : "visibility"} size={22} color={hidden ? colors.textMuted : colors.textPrimary} />
      </Pressable>
    </Animated.View>
  );
}

export default function SportsFiltersScreen() {
  const { order, hidden } = useSportsTabPreferences();
  const dragOrigin = React.useRef(0);
  const draggingSlug = React.useRef<string | null>(null);
  const [, setDragVersion] = React.useState(0);
  const sports = order.map((slug) => SPORTS.find((sport) => sport.slug === slug)).filter((sport): sport is (typeof SPORTS)[number] => !!sport);

  const onDragStart = React.useCallback((slug: string) => {
    dragOrigin.current = order.indexOf(slug);
    draggingSlug.current = slug;
    setDragVersion((version) => version + 1);
  }, [order]);

  const onDragEnd = React.useCallback((dy: number) => {
    const slug = draggingSlug.current;
    if (!slug) return;
    const target = Math.max(0, Math.min(order.length - 1, dragOrigin.current + Math.round(dy / ROW_HEIGHT)));
    const next = [...order];
    next.splice(dragOrigin.current, 1);
    next.splice(target, 0, slug);
    draggingSlug.current = null;
    setDragVersion((version) => version + 1);
    setSportsTabOrder(next);
  }, [order]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <PageHeader title="Customize tabs" showSearch={false} />
      <ScrollView contentContainerStyle={{ paddingTop: 12, paddingBottom: 44, gap: 22 }} showsVerticalScrollIndicator={false}>
        <View>
          {sports.map((sport) => (
            <SportRow
              key={sport.slug}
              {...sport}
              hidden={hidden.includes(sport.slug)}
              dragging={draggingSlug.current === sport.slug}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))}
        </View>

        <Pressable
          onPress={resetSportsTabs}
          style={({ pressed }) => ({ alignSelf: "center", paddingHorizontal: 16, paddingVertical: 10, opacity: pressed ? 0.65 : 1 })}
        >
          <Text style={{ fontFamily: geist.semibold, fontSize: 15, color: colors.textPrimary }}>Reset Sports tabs</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}