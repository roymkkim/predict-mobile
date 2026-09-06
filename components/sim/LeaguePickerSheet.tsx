import { useEffect, useRef, useState } from "react";
import { Animated, Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { MaterialOutlinedSportIcon, outlinedSportId } from "@/components/sim/MaterialSportsOutline";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/lib/sim/colors";
import { createSheetHeaderPan, detentEnter, sheetExit, backdropIn, backdropOut } from "@/lib/sim/sheetMotion";
import type { MaterialIconName } from "@/lib/sim/uxrIcons";
import { geist } from "@/lib/sim/geistFonts";

function LeagueRow({
  league,
  active,
  indent,
  onPress,
}: {
  league: { name: string; count: number };
  active: boolean;
  indent?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingLeft: indent ? 32 : 20,
        paddingRight: 20,
        paddingVertical: 14,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Text
        style={{
          flex: 1,
          fontFamily: active ? geist.semibold : geist.regular,
          fontSize: 16,
          color: colors.textPrimary,
        }}
      >
        {league.name}
      </Text>
      {active ? (
        <MaterialIcons name="check" size={24} color={colors.green} />
      ) : (
        <Text style={{ fontFamily: geist.medium, fontSize: 16, color: colors.textMuted }}>{String(league.count)}</Text>
      )}
    </Pressable>
  );
}

// Compact detent sheet for quickly switching leagues from a category hub page
// (mock: "Picker" — title = sport, rows = leagues). Detent motion vocabulary:
// enter tween 0.32s [0.32,0.72,0,1], exit tween, backdrop 0.25 fade.
// Optional `sections` renders country groups with collapsible headers below
// the flat `leagues` rows (used by Soccer).
export function LeaguePickerSheet({
  visible,
  title,
  leagues,
  sections,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  leagues: { name: string; count: number }[];
  sections?: { country: string; flag?: string; icon?: MaterialIconName; leagues: { name: string; count: number }[] }[];
  selected: string;
  onSelect: (name: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  // Collapsed countries; sections start expanded when they hold the selection.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (visible && sections) {
      const init: Record<string, boolean> = {};
      for (const sec of sections) init[sec.country] = !sec.leagues.some((l) => l.name === selected);
      setCollapsed(init);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);
  const [render, setRender] = useState(visible);
  const [sheetHeight, setSheetHeight] = useState(0);
  const slide = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const headerPan = useRef(
    createSheetHeaderPan({
      dragY,
      onDismiss: () => onCloseRef.current(),
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      setRender(true);
      dragY.setValue(0);
    } else {
      Animated.parallel([backdropOut(fade), sheetExit(slide)]).start(({ finished }) => {
        if (finished) setRender(false);
      });
    }
  }, [visible, fade, slide]);

  useEffect(() => {
    if (render && visible) {
      slide.setValue(0);
      fade.setValue(0);
      Animated.parallel([detentEnter(slide), backdropIn(fade)]).start();
    }
  }, [render, visible, fade, slide]);

  const translateY = Animated.add(
    slide.interpolate({ inputRange: [0, 1], outputRange: [sheetHeight || 320, 0] }),
    dragY,
  );

  return (
    <Modal visible={render} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Animated.View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.45)", opacity: fade }}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>
        <Animated.View
          onLayout={(e) => setSheetHeight(e.nativeEvent.layout.height)}
          style={{
            transform: [{ translateY }],
            backgroundColor: "#141414",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: 10,
            paddingBottom: insets.bottom + 24,
          }}
        >
          <View {...headerPan.panHandlers}>
            <View style={{ alignItems: "center", marginBottom: 10 }}>
              <View style={{ width: 36, height: 5, borderRadius: 3, backgroundColor: colors.surface2 }} />
            </View>
            <Text style={{ fontFamily: geist.semibold, fontSize: 16, color: colors.textPrimary, textAlign: "center", marginBottom: 8 }}>
              {title}
            </Text>
          </View>
          <ScrollView style={{ maxHeight: winH * 0.62, minHeight: 0 }} showsVerticalScrollIndicator={false}>
            {leagues.map((l) => (
              <LeagueRow key={l.name} league={l} active={l.name === selected} onPress={() => { onSelect(l.name); onClose(); }} />
            ))}
            {sections?.map((sec) => {
              const isCollapsed = collapsed[sec.country];
              return (
                <View key={sec.country}>
                  <Pressable
                    onPress={() => setCollapsed((c) => ({ ...c, [sec.country]: !c[sec.country] }))}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 20,
                      paddingVertical: 12,
                      opacity: pressed ? 0.6 : 1,
                    })}
                  >
                    {sec.icon && outlinedSportId(sec.icon) ? (
                      <View style={{ marginRight: 8 }}>
                        <MaterialOutlinedSportIcon name={sec.icon} size={18} color={colors.textMuted} />
                      </View>
                    ) : sec.icon ? (
                      <MaterialIcons name={sec.icon} size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
                    ) : null}
                    <Text style={{ flex: 1, fontFamily: geist.semibold, fontSize: 13, letterSpacing: 0.4, color: colors.textMuted, textTransform: "uppercase" }}>
                      {sec.country}
                    </Text>
                    <MaterialIcons name={isCollapsed ? "keyboard-arrow-down" : "keyboard-arrow-up"} size={20} color={colors.textMuted} />
                  </Pressable>
                  {!isCollapsed &&
                    sec.leagues.map((l) => (
                      <LeagueRow key={l.name} league={l} active={l.name === selected} indent onPress={() => { onSelect(l.name); onClose(); }} />
                    ))}
                </View>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
