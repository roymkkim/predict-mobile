import type { ReactNode } from "react";
import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors } from "@/lib/sim/colors";
import { buttonInteractionStyle, METAMASK_BUTTON_LABEL } from "@/lib/sim/buttonStyle";
import { useBetRadius } from "@/lib/sim/pillButtonsStore";
import { SectionHeader } from "./FeedChrome";
import { geist } from "@/lib/sim/geistFonts";

// A single open position shown on the home "Active positions" carousel.
type Position = {
  id: string;
  flag: string; // ISO 3166-1 alpha-2 (or flagcdn subdivision) for the avatar
  title: string;
  stake: string;
  value: string;
  changePct: number; // sign drives the color (green up / red down)
};

// Static demo content — a few open positions to scroll through.
const POSITIONS: Position[] = [
  {
    id: "kr",
    flag: "kr",
    title: "Will Korea Republic win?",
    stake: "$20 on Korea Republic to win $40",
    value: "$20.46",
    changePct: 2.3,
  },
  {
    id: "br",
    flag: "br",
    title: "Will Brazil win the World Cup?",
    stake: "$30 on Brazil to win $96",
    value: "$33.10",
    changePct: 10.3,
  },
  {
    id: "us",
    flag: "us",
    title: "Republican Nominee 2028?",
    stake: "$50 on the field to win $90",
    value: "$48.20",
    changePct: -3.6,
  },
];

// Default flag avatar for the home carousel positions.
function FlagAvatar({ flag }: { flag: string }) {
  return (
    <Image
      source={{ uri: `https://flagcdn.com/w160/${flag}.png` }}
      resizeMode="cover"
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: colors.surface2,
      }}
    />
  );
}

// Single open-position summary card — avatar + title/meta on the left, current
// value + change on the right, two action buttons below. Reused on the home
// carousel and (stacked) on the Positions page Active tab.
const actionBtn = {
  height: 46,
  borderRadius: 12,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.surface2,
} as const;
const actionText = { ...METAMASK_BUTTON_LABEL, color: colors.textPrimary };

export function PositionCard({
  avatar,
  title,
  meta,
  value,
  changeText,
  positive,
  width,
  onBuyMore,
  onCashOut,
  onAutoSell,
  autoSellTarget,
  onOpen,
  truncate = true,
}: {
  avatar: ReactNode;
  title: string;
  meta: string;
  value: string;
  changeText: string;
  positive: boolean;
  width?: number;
  // Optional actions footer (portfolio cards). Auto-sell is limit-order only.
  onBuyMore?: () => void;
  onCashOut?: () => void;
  onAutoSell?: () => void;
  autoSellTarget?: number;
  // Navigates to the market's detail page when the card body is tapped.
  onOpen?: () => void;
  truncate?: boolean;
}) {
  const hasActions = !!(onBuyMore || onCashOut || onAutoSell);
  // Respect the button-shape setting: 12px corners by default, pill when on.
  const betR = useBetRadius();
  return (
    <View
      style={{
        ...(width ? { width } : {}),
        borderRadius: 16,
        ...(hasActions
          ? { backgroundColor: colors.surface }
          : { borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.surface }),
        padding: 16,
      }}
    >
      <Pressable disabled={!onOpen} onPress={onOpen} style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <View style={{ marginRight: 12 }}>{avatar}</View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <Text
              numberOfLines={truncate ? 1 : undefined}
              style={{
                flex: 1,
                fontFamily: geist.semibold,
                fontSize: 16,
                lineHeight: 22,
                color: colors.textPrimary,
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                fontFamily: geist.semibold,
                fontSize: 16,
                lineHeight: 22,
                color: colors.textPrimary,
                marginLeft: 8,
              }}
            >
              {value}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
            <Text
              numberOfLines={truncate ? 1 : undefined}
              style={{
                flex: 1,
                fontFamily: geist.regular,
                fontSize: 14,
                lineHeight: 20,
                color: colors.textMuted,
              }}
            >
              {meta}
            </Text>
            <Text
              style={{
                fontFamily: geist.semibold,
                fontSize: 14,
                lineHeight: 20,
                color: positive ? colors.greenOutline : colors.red,
                marginLeft: 8,
              }}
            >
              {changeText}
            </Text>
          </View>
        </View>
      </Pressable>

      {hasActions ? (
        <>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
            <Pressable onPress={onBuyMore} style={({ pressed }) => [actionBtn, { flex: 1, borderRadius: betR === 999 ? 999 : 12 }, buttonInteractionStyle(pressed)]}>
              <Text style={actionText}>Buy more</Text>
            </Pressable>
            <Pressable onPress={onCashOut} style={({ pressed }) => [actionBtn, { flex: 1, borderRadius: betR === 999 ? 999 : 12 }, buttonInteractionStyle(pressed)]}>
              <Text style={actionText}>Sell</Text>
            </Pressable>
          </View>
          {onAutoSell &&
            (autoSellTarget === undefined ? (
              <Pressable onPress={onAutoSell} style={({ pressed }) => [actionBtn, { marginTop: 10, borderRadius: betR === 999 ? 999 : 12 }, buttonInteractionStyle(pressed)]}>
                <Text style={actionText}>Auto-sell</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={onAutoSell}
                style={({ pressed }) => [
                  actionBtn,
                  { marginTop: 10, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 18, borderRadius: betR === 999 ? 999 : 12 },
                  buttonInteractionStyle(pressed),
                ]}
              >
                <Text style={actionText}>{`Auto-sell set to $${autoSellTarget.toFixed(autoSellTarget % 1 === 0 ? 0 : 2)}`}</Text>
                <MaterialIcons name="edit" size={16} color={colors.textPrimary} />
              </Pressable>
            ))}
        </>
      ) : (
        <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
          {(["Buy more", "Sell"] as const).map((label) => (
            <Pressable
              key={label}
              style={{ flex: 1, height: 40, borderRadius: betR, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface2 }}
            >
              <Text style={{ fontFamily: geist.medium, fontSize: 14, color: colors.textPrimary }}>{label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// "Active positions" home section — a "Trending"-style header with chevron above
// a horizontally-snapping carousel of open positions, each one feed-card wide.
export function CurrentPositionsCard({ gutter = 16 }: { gutter?: number }) {
  const [vw, setVw] = useState(0);
  const gap = 8;
  const itemW = vw ? vw - gutter * 2 : 0;

  return (
    <View onLayout={(e) => setVw(e.nativeEvent.layout.width)}>
      <SectionHeader title="Active positions" onPress={() => router.push("/positions")} />
      {itemW > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={itemW + gap}
          snapToAlignment="start"
          disableIntervalMomentum
          contentContainerStyle={{ paddingHorizontal: gutter, gap }}
        >
          {POSITIONS.map((p) => (
            <PositionCard
              key={p.id}
              avatar={<FlagAvatar flag={p.flag} />}
              title={p.title}
              meta={p.stake}
              value={p.value}
              changeText={`${p.changePct >= 0 ? "+" : ""}${p.changePct}%`}
              positive={p.changePct >= 0}
              width={itemW}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
