import { Text, View } from "react-native";

import { LIVE_DOT_TEXT_GAP, LiveDot } from "@/components/sim/Crest";
import { colors } from "@/lib/sim/colors";
import { geist } from "@/lib/sim/geistFonts";

export const SCORE_SQUARE_SIZE = 28;
export const CAROUSEL_STATUS_H = 18;
export const CAROUSEL_HEADER_GAP = 4;
export const CAROUSEL_HEADER_H = CAROUSEL_STATUS_H + CAROUSEL_HEADER_GAP + SCORE_SQUARE_SIZE;
/** Live sports card header slot: score unit is centered as a block inside this height. */
export const LIVE_CARD_HEADER_H = 96;

export function ScoreSquare({ score, size = SCORE_SQUARE_SIZE }: { score: string | number; size?: number }) {
  return (
    <View
      style={{
        minWidth: size,
        height: size,
        paddingHorizontal: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(133,139,154,0.32)",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontFamily: geist.semibold, fontSize: 14, lineHeight: 18, color: colors.textPrimary }}>
        {score}
      </Text>
    </View>
  );
}

/** LIVE stamp over "Panthers [21] – [0] Cardinals" — carousel + collapsed detail headers. */
export function MatchTitleScoreHeader({
  leftName,
  rightName,
  leftScore,
  rightScore,
  clock,
  live = true,
  liveColor = colors.green,
}: {
  leftName: string;
  rightName: string;
  leftScore: string | number;
  rightScore: string | number;
  clock?: string;
  live?: boolean;
  liveColor?: string;
}) {
  return (
    <View style={{ alignItems: "center", gap: CAROUSEL_HEADER_GAP, width: "100%" }}>
      {live || clock ? (
        <View
          style={{
            height: CAROUSEL_STATUS_H,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: LIVE_DOT_TEXT_GAP,
          }}
        >
          {live ? <LiveDot color={liveColor} /> : null}
          {live ? (
            <Text style={{ fontFamily: geist.semibold, fontSize: 12, lineHeight: 18, letterSpacing: 0.4, color: liveColor }}>
              LIVE
            </Text>
          ) : null}
          {clock ? (
            <Text style={{ fontFamily: geist.semibold, fontSize: 12, lineHeight: 18, letterSpacing: 0.4, color: colors.textMuted, textTransform: "uppercase" }}>
              {clock}
            </Text>
          ) : null}
        </View>
      ) : null}
      <View
        style={{
          minHeight: SCORE_SQUARE_SIZE,
          flexDirection: "row",
          alignItems: "center",
          width: "100%",
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            textAlign: "right",
            fontFamily: geist.semibold,
            fontSize: 16,
            lineHeight: 22,
            color: colors.textPrimary,
          }}
        >
          {leftName}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginHorizontal: 8,
            flexShrink: 0,
          }}
        >
          <ScoreSquare score={leftScore} />
          <Text style={{ fontFamily: geist.semibold, fontSize: 16, lineHeight: 22, color: colors.textMuted }}>–</Text>
          <ScoreSquare score={rightScore} />
        </View>
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            textAlign: "left",
            fontFamily: geist.semibold,
            fontSize: 16,
            lineHeight: 22,
            color: colors.textPrimary,
          }}
        >
          {rightName}
        </Text>
      </View>
    </View>
  );
}
