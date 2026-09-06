import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/lib/sim/colors";
import { geist } from "@/lib/sim/geistFonts";

export type FooterButton = { label: string; tone: "yes" | "no" };

// Fixed bottom action bar with two buttons. Visual details are intentionally
// placeholder for now (per request) — tone maps to the brand green/red accents.
export function MarketFooter({
  buttons,
  bottomInset = 0,
}: {
  buttons: [FooterButton, FooterButton];
  bottomInset?: number;
}) {
  return (
    <View style={[styles.bar, { paddingBottom: bottomInset + 40 }]}>
      <LinearGradient
        pointerEvents="none"
        colors={["transparent", colors.bg, colors.bg]}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />
      {buttons.map((b, i) => {
        const bg = b.tone === "yes" ? colors.greenSoft : colors.redSoft;
        const fg = b.tone === "yes" ? colors.greenOutline : colors.red;
        return (
          <Pressable key={i} style={[styles.btn, { backgroundColor: bg }]}>
            <Text style={[styles.btnText, { color: fg }]} numberOfLines={1}>{b.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  btn: { flex: 1, height: 52, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  btnText: { fontFamily: geist.semibold, fontSize: 16 },
});
