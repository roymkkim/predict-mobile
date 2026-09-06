import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { detentEnter, sheetExit, backdropIn, backdropOut } from "@/lib/sim/sheetMotion";
import { colors } from "@/lib/sim/colors";
import type { BetSlipPick } from "@/lib/sim/betSlipStore";
import { geist } from "@/lib/sim/geistFonts";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const TP_PRESETS = [10, 25, 50, 100];
const SL_PRESETS = [5, 10, 25, 50];

function clampCents(c: number) {
  return Math.max(1, Math.min(99, c));
}

// Adapted from the Perps "Auto close" screen for prediction markets: instead of
// a USD liquidation price, the outcome trades in cents (1-99¢), so take-profit /
// stop-loss triggers are expressed in cents and the percentages move relative to
// the current price.
export function AutoCloseSheet({ visible, pick, currentCents, side = "yes", onClose }: { visible: boolean; pick: BetSlipPick | null; currentCents?: number; side?: "yes" | "no"; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();

  const [render, setRender] = useState(visible);
  const slide = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current; // backdrop opacity 0..1

  // Price basis is side-aware: a NO bet trades at (100 - oddsCents). The parent
  // passes the resolved value, but fall back to the pick's odds if absent.
  const current = clampCents(currentCents ?? pick?.oddsCents ?? 50);

  const [tpPct, setTpPct] = useState("");
  const [tpTrigger, setTpTrigger] = useState("");
  const [slPct, setSlPct] = useState("");
  const [slTrigger, setSlTrigger] = useState("");

  // Reset the form each time a fresh pick raises the sheet.
  useEffect(() => {
    if (visible && pick) {
      setTpPct("");
      setTpTrigger("");
      setSlPct("");
      setSlTrigger("");
    }
  }, [visible, pick]);

  useEffect(() => {
    if (visible) {
      setRender(true);
      // Child sheet stacked over the bet slip → detent-sheet enter tween;
      // backdrop fades 0.2s in parallel.
      Animated.parallel([detentEnter(slide, false), backdropIn(fade, false)]).start();
    } else {
      Animated.parallel([sheetExit(slide, false), backdropOut(fade, false)]).start(({ finished }) => {
        if (finished) setRender(false);
      });
    }
  }, [visible, slide, fade]);

  if (!render || !pick) return null;

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [winH, 0] });

  // Take profit: price rises by pct above current. Stop loss: price falls below.
  const applyTpPct = (pct: number) => {
    setTpPct(String(pct));
    setTpTrigger(String(clampCents(Math.round(current * (1 + pct / 100)))));
  };
  const applySlPct = (pct: number) => {
    setSlPct(String(pct));
    setSlTrigger(String(clampCents(Math.round(current * (1 - pct / 100)))));
  };
  const onTpPctText = (t: string) => {
    setTpPct(t);
    const n = parseFloat(t);
    setTpTrigger(Number.isFinite(n) && n > 0 ? String(clampCents(Math.round(current * (1 + n / 100)))) : "");
  };
  const onTpTriggerText = (t: string) => {
    setTpTrigger(t);
    const n = parseFloat(t);
    // Take profit only makes sense above the current price.
    setTpPct(Number.isFinite(n) && n > current ? String(Math.round((n / current - 1) * 100)) : "");
  };
  const onSlPctText = (t: string) => {
    setSlPct(t);
    const n = parseFloat(t);
    setSlTrigger(Number.isFinite(n) && n > 0 ? String(clampCents(Math.round(current * (1 - n / 100)))) : "");
  };
  const onSlTriggerText = (t: string) => {
    setSlTrigger(t);
    const n = parseFloat(t);
    // Stop loss only makes sense below the current price.
    setSlPct(Number.isFinite(n) && n < current && n > 0 ? String(Math.round((1 - n / current) * 100)) : "");
  };

  return (
    <Modal visible={render} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <AnimatedPressable style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.6)", opacity: fade }]} onPress={onClose} />
        <Animated.View style={{ transform: [{ translateY }] }}>
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: colors.bg,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: 20,
              paddingTop: 10,
              paddingBottom: insets.bottom + 16,
              maxHeight: winH * 0.9,
              minHeight: 0,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 10 }}>
              <View style={{ width: 36, height: 5, borderRadius: 3, backgroundColor: colors.surface2 }} />
            </View>

            {/* Header — back arrow + centered title (mirrors the Perps screen). */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 18 }}>
              <Pressable onPress={onClose} hitSlop={8} style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
              </Pressable>
              <Text style={{ flex: 1, textAlign: "center", marginRight: 36, fontFamily: geist.bold, fontSize: 18, color: colors.textPrimary }} numberOfLines={1}>
                Auto close
              </Text>
            </View>

            <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ gap: 22 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Context: current price + outcome (betting has no liquidation). */}
              <View style={{ gap: 8 }}>
                <InfoRow label="Current price" value={`${current}¢`} />
                <InfoRow label="Outcome" value={`${pick.title} · ${side === "no" ? "No" : "Yes"}`} />
              </View>

              {/* Take profit */}
              <View style={{ gap: 12 }}>
                <Text style={sectionTitle}>Take profit</Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {TP_PRESETS.map((p) => (
                    <PresetBtn key={p} label={`+${p}%`} active={tpPct === String(p)} onPress={() => applyTpPct(p)} />
                  ))}
                </View>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <FieldBox prefix="¢" placeholder="Trigger price" value={tpTrigger} onChangeText={onTpTriggerText} />
                  <FieldBox suffix="%" placeholder="% Profit" value={tpPct} onChangeText={onTpPctText} />
                </View>
              </View>

              {/* Stop loss */}
              <View style={{ gap: 12 }}>
                <Text style={sectionTitle}>Stop loss</Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {SL_PRESETS.map((p) => (
                    <PresetBtn key={p} label={`-${p}%`} active={slPct === String(p)} onPress={() => applySlPct(p)} />
                  ))}
                </View>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <FieldBox prefix="¢" placeholder="Trigger price" value={slTrigger} onChangeText={onSlTriggerText} />
                  <FieldBox suffix="%" placeholder="% Loss" value={slPct} onChangeText={onSlPctText} />
                </View>
              </View>
            </ScrollView>

            {/* Footer actions */}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 18 }}>
              <Pressable
                onPress={onClose}
                style={{ flex: 1, height: 52, borderRadius: 14, backgroundColor: colors.surface2, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ fontFamily: geist.semibold, fontSize: 16, color: colors.textPrimary }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={onClose}
                style={{ flex: 1, height: 52, borderRadius: 14, backgroundColor: colors.controlActiveBg, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ fontFamily: geist.semibold, fontSize: 16, color: colors.controlActiveText }}>Set</Text>
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <Text style={{ fontFamily: geist.regular, fontSize: 15, color: colors.textMuted }}>{label}</Text>
      <Text style={{ fontFamily: geist.semibold, fontSize: 15, color: colors.textPrimary }} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function PresetBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        height: 44,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: active ? colors.controlActiveBg : colors.surface2,
      }}
    >
      <Text style={{ fontFamily: geist.semibold, fontSize: 14, color: active ? colors.controlActiveText : colors.textPrimary }}>{label}</Text>
    </Pressable>
  );
}

function FieldBox({ prefix, suffix, placeholder, value, onChangeText }: { prefix?: string; suffix?: string; placeholder: string; value: string; onChangeText: (t: string) => void }) {
  return (
    <View
      style={{
        flex: 1,
        height: 52,
        borderRadius: 12,
        backgroundColor: colors.surface2,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        gap: 6,
      }}
    >
      {prefix ? <Text style={affix}>{prefix}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType="numeric"
        style={{ flex: 1, fontFamily: geist.medium, fontSize: 15, color: colors.textPrimary, padding: 0 }}
      />
      {suffix ? <Text style={affix}>{suffix}</Text> : null}
    </View>
  );
}

const sectionTitle = { fontFamily: geist.bold, fontSize: 16, color: colors.textPrimary } as const;
const affix = { fontFamily: geist.medium, fontSize: 15, color: colors.textMuted } as const;
