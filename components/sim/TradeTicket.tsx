import { Fragment } from "react";
import { Text, View } from "react-native";
import { FontWeight, Text as DsText, TextColor, TextVariant } from "@metamask/design-system-react-native";

import { ComboMark } from "@/components/sim/ComboMark";
import { MetaChip } from "@/components/sim/MetaHeader";
import { PositionAvatar } from "@/components/sim/PositionAvatar";
import { colors } from "@/lib/sim/colors";
import { geist } from "@/lib/sim/geistFonts";

function comboSportTags(market?: string): string[] {
  if (!market?.trim()) return [];
  return market
    .split(/\s*[•·]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function money(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function TradeTicket({
  market,
  outcome,
  logo,
  flag,
  combo = false,
  cost,
  toWin,
  value,
}: {
  market?: string;
  outcome?: string;
  logo?: string;
  flag?: string;
  combo?: boolean;
  cost: number;
  toWin: number;
  value?: number;
}) {
  const filled = value ?? cost;
  const up = filled >= cost;
  const headline = outcome?.trim() || market || "Your pick";
  const sports = combo ? comboSportTags(market) : [];

  return (
    <View
      style={{
        borderRadius: 12,
        backgroundColor: colors.surface,
        padding: 14,
        gap: 16,
      }}
    >
      {sports.length > 0 ? (
        <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
          {sports.map((label, i) => (
            <Fragment key={`${label}-${i}`}>
              {i > 0 ? (
                <Text style={{ fontFamily: geist.medium, fontSize: 12, lineHeight: 16, color: colors.textMuted }}>•</Text>
              ) : null}
              <MetaChip tag>{label}</MetaChip>
            </Fragment>
          ))}
        </View>
      ) : !!market ? (
        <Text style={{ fontFamily: geist.medium, fontSize: 12, lineHeight: 16, color: colors.textMuted }} numberOfLines={1}>
          {market}
        </Text>
      ) : null}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        {combo ? (
          <ComboMark size={40} gradient padded={false} />
        ) : (
          <PositionAvatar market={market} title={outcome} logo={logo} flag={flag} size={36} />
        )}
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <DsText variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium} color={TextColor.TextDefault} numberOfLines={1}>
            {headline}
          </DsText>
          <Text style={{ fontFamily: geist.regular, fontSize: 13, lineHeight: 18, color: colors.textMuted }}>
            Cost {money(cost)}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontFamily: geist.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted }}>Max payout</Text>
          <Text style={{ fontFamily: geist.semibold, fontSize: 16, lineHeight: 22, color: colors.textPrimary }}>{money(toWin)}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontFamily: geist.regular, fontSize: 12, lineHeight: 16, color: up ? colors.green : colors.red }}>Current value</Text>
          <Text style={{ fontFamily: geist.semibold, fontSize: 16, lineHeight: 22, color: up ? colors.green : colors.red }}>
            {money(filled)}
          </Text>
        </View>
      </View>
    </View>
  );
}
