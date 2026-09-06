import React from "react";
import { createPortal } from "react-dom";
import { Animated, Platform, Pressable, Text, View } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/lib/sim/colors";
import { backdropIn, backdropOut, sheetEnter, sheetExit } from "@/lib/sim/sheetMotion";
import { closeCashOut, useCashOut } from "@/lib/sim/cashOutStore";
import { ComboMark } from "@/components/sim/ComboMark";
import { PositionAvatar } from "@/components/sim/PositionAvatar";
import { geist } from "@/lib/sim/geistFonts";
import { useBetRadius } from "@/lib/sim/pillButtonsStore";

const GREEN = colors.green;

// Cash-out confirmation sheet (Kalshi reference restyled to our language):
// header row with the position identity + close, centered cash-out figure with
// "Selling N shares at NN¢" and the gain line, a Total row, then a full-width
// primary pill and a reassurance footnote.
export function CashOutSheet() {
  const { open, req } = useCashOut();
  const visible = open && !!req;
  const onClose = closeCashOut;
  const insets = useSafeAreaInsets();
  const betR = useBetRadius();
  const [render, setRender] = React.useState(visible);
  const enter = React.useRef(new Animated.Value(visible ? 1 : 0)).current;
  const dim = React.useRef(new Animated.Value(visible ? 1 : 0)).current;

  React.useEffect(() => {
    if (visible) {
      setRender(true);
      sheetEnter(enter).start();
      backdropIn(dim).start();
    } else if (render) {
      backdropOut(dim).start();
      sheetExit(enter).start(({ finished }) => finished && setRender(false));
    }
  }, [visible]);

  if (!render || !req) return null;

  const shares = req.cents > 0 ? req.current / (req.cents / 100) : 0;
  const delta = req.current - req.cost;
  const pct = req.cost > 0 ? (delta / req.cost) * 100 : 0;

  const overlay = (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, elevation: 1000 }}>
      <Animated.View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", opacity: dim }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#141414",
          borderTopWidth: 1,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: colors.cardBorder,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: insets.bottom + 16,
          transform: [
            {
              translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [560, 0] }),
            },
          ],
        }}
      >
        {/* Header: position identity + close. */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.08)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {req.combo ? <ComboMark size={24} gradient /> : <PositionAvatar market={req.title} title={req.sub} size={40} />}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ fontFamily: geist.semibold, fontSize: 16, lineHeight: 21, color: colors.textPrimary }}>
              {req.title}
            </Text>
            <Text numberOfLines={1} style={{ fontFamily: geist.regular, fontSize: 14, lineHeight: 18, color: colors.textMuted, marginTop: 2 }}>
              {req.sub}
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={10}>
            <Feather name="x" size={22} color="#fff" />
          </Pressable>
        </View>

        {/* Cash-out figure. */}
        <View style={{ alignItems: "center", marginTop: 28 }}>
          <Text style={{ fontFamily: geist.bold, fontSize: 52, lineHeight: 60, color: colors.textPrimary }}>
            ${req.current.toFixed(2)}
          </Text>
          <Text style={{ fontFamily: geist.regular, fontSize: 15, lineHeight: 20, color: colors.textMuted, marginTop: 6 }}>
            Selling {shares.toFixed(2)} shares at {Math.round(req.cents)}&cent;
          </Text>
          <Text style={{ fontFamily: geist.semibold, fontSize: 15, lineHeight: 20, color: GREEN, marginTop: 8 }}>
            {delta >= 0 ? "+" : "-"}${Math.abs(delta).toFixed(2)} ({delta >= 0 ? "+" : ""}
            {pct.toFixed(2)}%)
          </Text>
        </View>

        {/* Total row. */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 28,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.08)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ fontFamily: geist.medium, fontSize: 15, lineHeight: 20, color: colors.textMuted }}>Total</Text>
            <Ionicons name="information-circle-outline" size={15} color={colors.textMuted} />
          </View>
          <Text style={{ fontFamily: geist.semibold, fontSize: 16, lineHeight: 21, color: colors.textPrimary }}>
            ${req.current.toFixed(2)}
          </Text>
        </View>

        {/* Primary action + footnote. */}
        <Pressable
          onPress={() => {
            req.onConfirm?.();
            onClose();
          }}
          style={{
            marginTop: 20,
            height: 48,
            borderRadius: betR,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#ffffff",
          }}
        >
          <Text style={{ fontFamily: geist.semibold, fontSize: 16, color: "#131416" }}>Sell</Text>
        </Pressable>
        <Text
          style={{
            marginTop: 12,
            textAlign: "center",
            fontFamily: geist.regular,
            fontSize: 13,
            lineHeight: 17,
            color: colors.textMuted,
          }}
        >
          Funds will be added to your available balance
        </Text>
      </Animated.View>
    </View>
  );

  if (Platform.OS === "web" && typeof document !== "undefined") {
    return createPortal(overlay, document.body);
  }
  return overlay;
}
