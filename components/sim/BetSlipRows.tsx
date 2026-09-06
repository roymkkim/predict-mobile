import { type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { PayWithMethodIcon, payWithRowValue } from "@/components/sim/PayWithSheet";
import { colors } from "@/lib/sim/colors";
import { geist } from "@/lib/sim/geistFonts";
import { openPayWith, usePayWith } from "@/lib/sim/payWithStore";

function InfoIcon({ size = 14, color = colors.textMuted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Path d="M5.5 8.5H6.5V5.5H5.5V8.5ZM6 4.5C6.14167 4.5 6.26042 4.45208 6.35625 4.35625C6.45208 4.26042 6.5 4.14167 6.5 4C6.5 3.85833 6.45208 3.73958 6.35625 3.64375C6.26042 3.54792 6.14167 3.5 6 3.5C5.85833 3.5 5.73958 3.54792 5.64375 3.64375C5.54792 3.73958 5.5 3.85833 5.5 4C5.5 4.14167 5.54792 4.26042 5.64375 4.35625C5.73958 4.45208 5.85833 4.5 6 4.5ZM6 11C5.30833 11 4.65833 10.8687 4.05 10.6062C3.44167 10.3437 2.9125 9.9875 2.4625 9.5375C2.0125 9.0875 1.65625 8.55833 1.39375 7.95C1.13125 7.34167 1 6.69167 1 6C1 5.30833 1.13125 4.65833 1.39375 4.05C1.65625 3.44167 2.0125 2.9125 2.4625 2.4625C2.9125 2.0125 3.44167 1.65625 4.05 1.39375C4.65833 1.13125 5.30833 1 6 1C6.69167 1 7.34167 1.13125 7.95 1.39375C8.55833 1.65625 9.0875 2.0125 9.5375 2.4625C9.9875 2.9125 10.3437 3.44167 10.6062 4.05C10.8687 4.65833 11 5.30833 11 6C11 6.69167 10.8687 7.34167 10.6062 7.95C10.3437 8.55833 9.9875 9.0875 9.5375 9.5375C9.0875 9.9875 8.55833 10.3437 7.95 10.6062C7.34167 10.8687 6.69167 11 6 11ZM6 10C7.11667 10 8.0625 9.6125 8.8375 8.8375C9.6125 8.0625 10 7.11667 10 6C10 4.88333 9.6125 3.9375 8.8375 3.1625C8.0625 2.3875 7.11667 2 6 2C4.88333 2 3.9375 2.3875 3.1625 3.1625C2.3875 3.9375 2 4.88333 2 6C2 7.11667 2.3875 8.0625 3.1625 8.8375C3.9375 9.6125 4.88333 10 6 10Z" fill={color} />
    </Svg>
  );
}

export function ChevronIcon({ size = 13, color = colors.textMuted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Path d="M4.44365 10.8027L3.55615 9.91523L7.66865 5.80273L3.55615 1.69023L4.44365 0.802734L9.44365 5.80273L4.44365 10.8027Z" fill={color} />
    </Svg>
  );
}

export function SummaryRow({
  label,
  value,
  chevron = false,
  info = false,
  valueColor,
  valueIcon,
  onPress,
}: {
  label: string;
  value: string;
  chevron?: boolean;
  info?: boolean;
  valueColor?: string;
  valueIcon?: ReactNode;
  onPress?: () => void;
}) {
  const body = (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Text style={{ fontFamily: geist.regular, fontSize: 14, color: colors.textMuted }}>{label}</Text>
        {info && <InfoIcon size={14} />}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {valueIcon}
        <Text style={{ fontFamily: geist.medium, fontSize: 14, color: valueColor ?? colors.textPrimary }}>{value}</Text>
        {chevron && <ChevronIcon size={16} />}
      </View>
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button">
      {body}
    </Pressable>
  ) : (
    body
  );
}

export function PayWithSummaryRow() {
  const { selected } = usePayWith();
  return (
    <SummaryRow
      label="Pay with"
      value={payWithRowValue(selected)}
      chevron
      valueIcon={<PayWithMethodIcon method={selected} size={16} />}
      onPress={openPayWith}
    />
  );
}

/** Small USDC coin marker for the "Pay with" row. */
export function UsdcCoin() {
  return (
    <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: "#2775CA", alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontFamily: geist.bold, fontSize: 9, lineHeight: 11, color: "#fff" }}>$</Text>
    </View>
  );
}
