import React, { useState } from "react";
import { Pressable, Text as RNText, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { FontWeight, Text, TextColor, TextVariant } from "@metamask/design-system-react-native";

import { colors } from "@/lib/sim/colors";
import { useBetRadius } from "@/lib/sim/pillButtonsStore";
import { ComboMark } from "@/components/sim/ComboMark";
import { mockCurrent, type PlacedPosition } from "@/lib/sim/positionsStore";
import { geist } from "@/lib/sim/geistFonts";

const TYPE_RESET = {
  marginTop: 0,
  marginBottom: 0,
  paddingTop: 0,
  paddingBottom: 0,
  includeFontPadding: false as const,
};

const COLLAPSED_ROWS = 4;

// In-card action pills: quieter than the card itself per the design spec.
const actionBtn = {
  height: 46,
  borderRadius: 12,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(255,255,255,0.04)",
} as const;
const actionText = { fontFamily: geist.medium, fontSize: 15, color: colors.textPrimary } as const;

// Active-position card for a combination ticket: "N markets" header with the
// combo mark and current value, legs grouped by category ("Yes · A vs B —
// $x.xx at NN¢"), a VIEW MORE disclosure past 4 legs, and the standard
// Buy more / Cash out actions.
export function ComboPositionCard({
  position,
  onBuyMore,
  onCashOut,
}: {
  position: Extract<PlacedPosition, { kind: "combo" }>;
  onBuyMore?: () => void;
  onCashOut?: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const { current, changePct } = mockCurrent(position);
  // Respect the button-shape setting: 12px corners by default, pill when on.
  const betR = useBetRadius();

  // Per-leg deterministic drift (same style as mockCurrent) so each row shows
  // its own current value + change without live pricing.
  const legDrift = (i: number) => {
    let h = 0;
    for (const ch of `${position.id}:${i}`) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return 1 + (h % 280) / 10;
  };
  // "Yes · Bogdan vs Buzukja" -> { market: "Bogdan vs Buzukja", pick: "Bogdan" }
  const parseLeg = (label: string) => {
    const market = label.includes("\u00b7") ? label.split("\u00b7").slice(1).join("\u00b7").trim() : label;
    const pick = market.includes(" vs") ? market.split(" vs")[0].trim() : market;
    return { market, pick };
  };

  const groups: { category: string; legs: typeof position.legs }[] = [];
  for (const leg of position.legs) {
    const g = groups.find((x) => x.category === leg.category);
    if (g) g.legs.push(leg);
    else groups.push({ category: leg.category, legs: [leg] });
  }

  const perLeg = position.legs.length > 0 ? position.cost / position.legs.length : 0;
  const needsMore = position.legs.length > COLLAPSED_ROWS;

  // When collapsed, walk groups until the row budget is spent.
  let budget = showAll ? Infinity : COLLAPSED_ROWS;
  const visible = groups
    .map((g) => {
      const take = Math.max(0, Math.min(g.legs.length, budget));
      budget -= take;
      return { ...g, legs: g.legs.slice(0, take) };
    })
    .filter((g) => g.legs.length > 0);

  return (
    <View
      style={{
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.08)",
        padding: 16,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <ComboMark size={40} gradient padded={false} />
        <View style={{ flex: 1 }}>
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Regular} color={TextColor.TextDefault} style={TYPE_RESET}>
            {position.legs.length} market{position.legs.length === 1 ? "" : "s"}
          </Text>
          <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Regular} color={TextColor.TextAlternative} style={TYPE_RESET}>
            ${position.cost.toFixed(0)} used
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Regular} color={TextColor.TextDefault} style={TYPE_RESET}>
            ${current.toFixed(2)}
          </Text>
          <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Regular} color={TextColor.SuccessDefault} style={TYPE_RESET}>
            +{changePct.toFixed(2)}%
          </Text>
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginTop: 12 }} />

      {/* Legs grouped by category */}
      {visible.map((g) => (
        <View key={g.category}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 }}>
            <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Regular} color={TextColor.TextAlternative} style={TYPE_RESET}>
              {g.category}
            </Text>
          </View>
          {g.legs.map((leg, i) => {
            const { market, pick } = parseLeg(leg.label);
            const globalIdx = position.legs.indexOf(leg);
            const pct = legDrift(globalIdx);
            const legCurrent = perLeg * (1 + pct / 100);
            return (
              <View key={`${g.category}-${i}`} style={{ flexDirection: "row", alignItems: "flex-start", marginTop: 12 }}>
                <View style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                  <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Regular} color={TextColor.TextDefault} style={TYPE_RESET}>
                    {market}
                  </Text>
                  <Text
                    variant={TextVariant.BodySm}
                    fontWeight={FontWeight.Regular}
                    color={TextColor.TextAlternative}
                    style={{ ...TYPE_RESET, marginTop: 2 }}
                  >
                    ${perLeg.toFixed(2)} on {pick} · {leg.cents}¢
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Regular} color={TextColor.TextDefault} style={TYPE_RESET}>
                    ${legCurrent.toFixed(2)}
                  </Text>
                  <Text
                    variant={TextVariant.BodySm}
                    fontWeight={FontWeight.Regular}
                    color={TextColor.SuccessDefault}
                    style={{ ...TYPE_RESET, marginTop: 2 }}
                  >
                    {pct.toFixed(1)}%
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ))}

      {needsMore && (
        <Pressable
          onPress={() => setShowAll((v) => !v)}
          style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 14 }}
        >
          <RNText style={{ fontFamily: geist.semibold, fontSize: 13, letterSpacing: 0.6, color: colors.textPrimary }}>
            {showAll ? "VIEW LESS" : "VIEW MORE"}
          </RNText>
          <MaterialIcons name={showAll ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={18} color={colors.textPrimary} />
        </Pressable>
      )}

      {/* Actions: same surface as Cash out. Auto-sell is limit-order only. */}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
        <Pressable onPress={onBuyMore} style={[actionBtn, { flex: 1, borderRadius: betR === 999 ? 999 : 12 }]}>
          <RNText style={actionText}>Buy more</RNText>
        </Pressable>
        <Pressable onPress={onCashOut} style={[actionBtn, { flex: 1, borderRadius: betR === 999 ? 999 : 12 }]}>
          <RNText style={actionText}>Sell</RNText>
        </Pressable>
      </View>
    </View>
  );
}
