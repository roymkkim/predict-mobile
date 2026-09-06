import React from "react";
import { createPortal } from "react-dom";
import { Animated, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";

import {
  Text as DsText,
  TextColor,
  TextVariant,
} from "@metamask/design-system-react-native";
import { colors } from "@/lib/sim/colors";
import { backdropIn, backdropOut, sheetEnter, sheetExit } from "@/lib/sim/sheetMotion";
import { closeAutoSell, useAutoSell } from "@/lib/sim/autoSellStore";
import { geist } from "@/lib/sim/geistFonts";
import { useBetRadius } from "@/lib/sim/pillButtonsStore";
import { useDisplayFont, useOswaldDataSet } from "@/lib/sim/typefaceStore";

const GREEN = colors.green;
const TRACK_H = 6;
const KNOB = 28;

// Compact "Auto sell if you're up?" prompt shown over the trade-submitted
// screen after a LIMIT order: drag the slider to pick a cash-out target
// between just-above-cost and the max payout, then set it or dismiss.
export function AutoSellSheet() {
  const { open, req } = useAutoSell();
  const visible = open && !!req;
  const onClose = closeAutoSell;
  const router = useRouter();
  // "Not now" routes to the market's detail page when the caller provided one
  // (e.g. from the trade-submitted screen) instead of just dismissing.
  const onNotNow = () => {
    const href = req?.detailHref;
    closeAutoSell();
    if (href) router.push(href as Href);
  };
  const cost = req?.cost ?? 0;
  const toWin = req?.toWin ?? 0;
  const insets = useSafeAreaInsets();
  const betR = useBetRadius();
  const displayFont = useDisplayFont();
  const oswald = useOswaldDataSet();
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

  // Slider fraction 0..1 → target between cost*1.05 and toWin.
  const [frac, setFrac] = React.useState(0.6);
  const [trackW, setTrackW] = React.useState(0);
  const startFrac = React.useRef(0.6);
  const lo = cost * 1.05;
  const hi = Math.max(toWin, lo + 0.01);
  const target = lo + frac * (hi - lo);
  const delta = target - cost;
  const pct = cost > 0 ? (delta / cost) * 100 : 0;

  if (!render) return null;

  // On web, the JS stack can render duplicate route cards whose stacking
  // contexts paint above any overlay inside the app tree — portal the sheet
  // to document.body so it always sits on top. Native keeps the plain view.
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
        <DsText
          {...oswald}
          variant={TextVariant.HeadingSm}
          color={TextColor.TextDefault}
          twClassName="text-center"
          style={{ fontFamily: displayFont }}
        >
          Auto sell if you&rsquo;re up?
        </DsText>

        {/* Cash out figure */}
        <View style={{ alignItems: "center", marginTop: 24 }}>
          <Text style={{ fontFamily: geist.medium, fontSize: 15, lineHeight: 20, color: colors.textPrimary }}>Cash out</Text>
          <Text {...oswald} style={{ fontFamily: displayFont, fontSize: 56, lineHeight: 66, color: colors.textPrimary, marginTop: 2 }}>
            ${target.toFixed(2)}
          </Text>
          <Text style={{ fontFamily: geist.semibold, fontSize: 15, lineHeight: 20, color: GREEN }}>
            +${delta.toFixed(2)} (+{pct.toFixed(2)}%)
          </Text>
        </View>

        {/* Slider */}
        <View
          style={{ marginTop: 24, height: KNOB + 12, justifyContent: "center" }}
          onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(e) => {
            if (trackW > 0) {
              const f = Math.min(1, Math.max(0, e.nativeEvent.locationX / trackW));
              startFrac.current = f;
              setFrac(f);
            }
          }}
          onResponderMove={(e) => {
            if (trackW > 0) setFrac(Math.min(1, Math.max(0, e.nativeEvent.locationX / trackW)));
          }}
        >
          <View style={{ height: TRACK_H, borderRadius: TRACK_H / 2, backgroundColor: "rgba(255,255,255,0.14)" }} />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              width: Math.max(KNOB, frac * trackW),
              height: TRACK_H,
              borderRadius: TRACK_H / 2,
              backgroundColor: GREEN,
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: Math.max(0, Math.min(trackW - KNOB, frac * trackW - KNOB / 2)),
              width: KNOB,
              height: KNOB,
              borderRadius: KNOB / 2,
              backgroundColor: "#ffffff",
            }}
          />
        </View>

        <Text
          style={{
            marginTop: 16,
            textAlign: "center",
            fontFamily: geist.regular,
            fontSize: 13,
            lineHeight: 18,
            color: colors.textMuted,
          }}
        >
          If your target price is hit, we&rsquo;ll auto-sell. Your order may be partially filled and is editable in Orders.
        </Text>

        <Pressable onPress={onClose} style={{ alignSelf: "center", marginTop: 14 }}>
          <Text
            style={{
              fontFamily: geist.semibold,
              fontSize: 14,
              color: colors.textPrimary,
              textDecorationLine: "underline",
            }}
          >
            Don&rsquo;t show this again
          </Text>
        </Pressable>

        {/* Actions */}
        <View style={{ flexDirection: "row", gap: 12, marginTop: 18 }}>
          <Pressable
            onPress={onNotNow}
            style={{
              flex: 1,
              height: 48,
              borderRadius: betR,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.08)",
            }}
          >
            <Text style={{ fontFamily: geist.semibold, fontSize: 15, color: colors.textPrimary }}>Not now</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              req?.onSet?.(target);
              onClose();
            }}
            style={{
              flex: 1,
              height: 48,
              borderRadius: betR,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#ffffff",
            }}
          >
            <Text style={{ fontFamily: geist.semibold, fontSize: 15, color: "#131416" }}>Set target</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );

  if (Platform.OS === "web" && typeof document !== "undefined") {
    return createPortal(overlay, document.body);
  }
  return overlay;
}
