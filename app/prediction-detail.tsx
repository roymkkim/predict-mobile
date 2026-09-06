import React, { useMemo, useState } from "react";
import { OutcomeAvatarView } from "@/components/sim/OutcomeRows";
import type { OutcomeAvatar } from "@/lib/sim/types";
import { Image, Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ButtonIcon,
  ButtonIconSize,
  IconColor,
  IconName,
} from "@metamask/design-system-react-native";

import { BackIcon } from "@/components/PageHeader";

import { ChartWithPeriods } from "@/components/sim/ScoreChartUnit";
import { DetailSectionHeading, MatchPositionsSection } from "@/components/sim/MatchPositionsSection";
import { LIVE_CHAT_FOOTER_RESERVE } from "@/components/sim/MarketLiveChat";
import { MarketPageBody } from "@/components/sim/MarketPageTabs";
import { StickyDetailScroll } from "@/components/sim/StickyDetailScroll";
import { defaultMarketRules, MarketRulesSection } from "@/components/sim/MarketRulesSection";
import { MarketHelpSheet } from "@/components/sim/MarketHelpSheet";
import { MarketActionFooter, MARKET_ACTION_FOOTER_SPACE } from "@/components/sim/MarketActionFooter";
import { useBetRadius } from "@/lib/sim/pillButtonsStore";
import { ComboSelectedButton } from "@/components/sim/ComboGradient";
import { comboOutcomeVisual, outcomeButtonVisual } from "@/lib/sim/buttonStyle";
import { placeComboOrSlip, standardComboId } from "@/lib/sim/comboBet";
import { useComboMode, withComboQuery } from "@/lib/sim/comboFlowStore";
import { clearComboPicks, removeComboPick, replaceComboPick, useComboPicks } from "@/lib/sim/comboPicksStore";
import { ComboSheet } from "@/components/sim/ComboSheet";
import { comboListPaddingBottom, useComboSheetHeight } from "@/lib/sim/comboSheetHeightStore";
import { useFixedMarketActions } from "@/lib/sim/marketDetailActionsStore";
import { backgroundMuted, colors, semanticColor, UXR, uxrPaletteColor } from "@/lib/sim/colors";
import { screenTopInset } from "@/lib/sim/layout";
import { useThemeMode } from "@/lib/sim/dsModeStore";
import { findPredictionMarket, splitVol } from "@/lib/sim/predictionRegistry";
import { geist } from "@/lib/sim/geistFonts";
import { VolumeText } from "@/components/sim/VolumeText";
import { getSlidesKind } from "@/lib/sim/slidesDemo";

// General (non-sports) market detail page, standardized to the Panthers vs.
// Cardinals aesthetic: legend, the shared chart + watermark + period pills
// unit, then stacked Positions and Predict sections.

type Outcome = { label: string; pct: number; color: string; vol: string; points: number[]; avatar?: OutcomeAvatar; rules?: string[] };

// Deterministic wobble so the lines look organic but stable across renders.
function wob(seed: number, i: number): number {
  return Math.sin(seed * 12.9898 + i * 78.233) * 0.018;
}

function mkSeries(seed: number, anchors: number[]): number[] {
  // Four control points — enough to show direction without a noisy scribble.
  const N = 4;
  const out: number[] = [];
  for (let i = 0; i < N; i++) {
    const t = (i / (N - 1)) * (anchors.length - 1);
    const a = Math.floor(t);
    const b = Math.min(anchors.length - 1, a + 1);
    const f = t - a;
    const v = anchors[a] * (1 - f) + anchors[b] * f + wob(seed, i);
    out.push(Math.max(0.005, Math.min(0.95, v)));
  }
  return out;
}

// UXR palette colors, hand-assigned so all four outcomes stay distinct.
const OUTCOMES: Outcome[] = [
  { label: "OpenAI", pct: 50, color: UXR.red, vol: "$1.4M Vol.", points: mkSeries(1, [0.36, 0.44, 0.44, 0.3, 0.28, 0.44, 0.47, 0.46, 0.5]) },
  { label: "Google", pct: 42, color: UXR.blue, vol: "$1.1M Vol.", points: mkSeries(2, [0.56, 0.44, 0.44, 0.62, 0.66, 0.36, 0.3, 0.33, 0.42]) },
  { label: "xAI", pct: 5, color: UXR.yellow, vol: "$412K Vol.", points: mkSeries(3, [0.07, 0.06, 0.08, 0.06, 0.07, 0.06, 0.05, 0.06, 0.05]) },
  { label: "Anthropic", pct: 3, color: UXR.indigo, vol: "$187K Vol.", points: mkSeries(4, [0.03, 0.03, 0.03, 0.03, 0.03, 0.03, 0.03, 0.03, 0.03]) },
];

const AI_TITLE = "Which company will have the best AI model by next month?";

// Fallback avatars for binary markets routed with only a title (no registry
// entry): match the subject keyword so the header mark matches the card's
// market family (BTC orange coin, ETH, SOL, politics building).
const FALLBACK_AVATARS: { re: RegExp; avatar: ReturnType<typeof require> }[] = [
  { re: /bitcoin|btc/i, avatar: require("@/assets/figmaAssets/btc-logo-orange.png") },
  { re: /ethereum|\beth\b/i, avatar: require("@/assets/figmaAssets/icon-3d-crypto.png") },
  { re: /solana|\bsol\b/i, avatar: require("@/assets/figmaAssets/icon-solana-logo.png") },
  { re: /fed|rates|shutdown|government|election|senate|congress|president|press secretary|trump/i, avatar: require("@/assets/figmaAssets/fed-building.png") },
  { re: /crypto|coin|token|etf/i, avatar: require("@/assets/figmaAssets/icon-3d-crypto.png") },
];
function fallbackAvatar(title: string) {
  return FALLBACK_AVATARS.find((f) => f.re.test(title))?.avatar;
}

export default function PredictionDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const themeMode = useThemeMode();
  // Chart scrub values (0..1 per outcome) — the legend follows the finger.
  const [scrubVals, setScrubVals] = useState<number[] | null>(null);
  const [rulesOutcome, setRulesOutcome] = useState<Outcome | null>(null);
  const betR = useBetRadius();
  // Draw / tie ink: rgb(208, 210, 217) — same as dark `backgroundMuted`.
  const drawGray = backgroundMuted("dark");
  const comboMode = useComboMode();
  const comboPicks = useComboPicks();
  const comboSheetH = useComboSheetHeight();
  const fixedMarketActions = useFixedMarketActions();
  // Binary topic markets route here with the actual market's title / yes% /
  // volume; without params the page shows the multi-outcome AI market.
  const { t, yes, vol, pm } = useLocalSearchParams<{ t?: string; yes?: string; vol?: string; pm?: string }>();
  // Feed politics/crypto cards route here with pm=<question>; the market is
  // looked up so the page shows its real avatar, title, and outcomes.
  const market = findPredictionMarket(pm) ?? findPredictionMarket(t);
  const title = market ? market.question : typeof t === "string" && t ? t : AI_TITLE;
  const outcomes: Outcome[] = useMemo(() => {
    if (market) {
      const pcts = market.outcomes.map((o) => Math.min(99, Math.max(1, parseFloat(o.pct) || 1)));
      const vols = splitVol(market.vol, pcts);
      return market.outcomes.map((o, i) => {
        const p = pcts[i] / 100;
        return {
          label: o.label,
          pct: pcts[i],
          color: uxrPaletteColor(o.color),
          vol: o.vol || vols[i],
          points: mkSeries(i + 1, [p * 0.82, p * 1.12, p * 0.9, p * 1.05, p * 0.95, p]),
          avatar: o.avatar,
          rules: o.rules,
        };
      });
    }
     if (typeof t !== "string" || !t) return OUTCOMES.map((o) => ({ ...o, color: semanticColor(o.color) }));
    const y = Math.min(99, Math.max(1, parseInt(yes ?? "", 10) || 50));
    const v = typeof vol === "string" && vol ? vol : "$1.0M Vol.";
    return [
      { label: "Yes", pct: y, color: colors.green, vol: v, points: mkSeries(1, [0.5, 0.55, 0.45, 0.5, y / 100 - 0.05, y / 100 + 0.03, y / 100]) },
      { label: "No", pct: 100 - y, color: colors.red, vol: v, points: mkSeries(2, [0.5, 0.45, 0.55, 0.5, 1.05 - y / 100, 0.97 - y / 100, 1 - y / 100]) },
    ];
  }, [market, t, yes, vol, themeMode]);
  const rawDetailHref = market
    ? `/prediction-detail?pm=${encodeURIComponent(market.question)}`
    : typeof t === "string" && t
      ? `/prediction-detail?t=${encodeURIComponent(t)}&yes=${yes ?? ""}&vol=${encodeURIComponent(typeof vol === "string" ? vol : "")}`
      : "/prediction-detail";
  const detailHref = comboMode ? withComboQuery(rawDetailHref) : rawDetailHref;
  // Binary market (one Yes/No pair): the bet IS the market, so the Yes/No
  // buttons sit right under the chart and the Predict section is dropped.
  const binary = outcomes.length === 2 && outcomes[0].label === "Yes";
  const outcomeRuleSheets = outcomes.some((o) => (o.rules?.length ?? 0) > 0);
  const binaryLeg = (key: "Yes" | "No", cents: number, color: string, side: "yes" | "no") => ({
    id: standardComboId("y-n", key, title),
    category: "Sports",
    label: `${key} · ${title}`,
    color,
    cents,
    side,
  });
  const binaryActions = binary
    ? [
        {
          key: "yes",
          label: `Yes \u00b7 ${outcomes[0].pct}\u00a2`,
          color: outcomes[0].color,
          onPress: () =>
            placeComboOrSlip(
              comboMode,
              binaryLeg("Yes", outcomes[0].pct, outcomes[0].color, "yes"),
              { title: "Yes", market: title, oddsCents: outcomes[0].pct, color: outcomes[0].color, side: "yes", returnTo: detailHref },
            ),
        },
        {
          key: "no",
          label: `No \u00b7 ${100 - outcomes[0].pct}\u00a2`,
          color: outcomes[1].color,
          onPress: () =>
            placeComboOrSlip(
              comboMode,
              binaryLeg("No", 100 - outcomes[0].pct, outcomes[1].color, "no"),
              { title: "No", market: title, oddsCents: 100 - outcomes[0].pct, color: outcomes[1].color, side: "no", returnTo: detailHref },
            ),
        },
      ]
    : [];
  const chartOutcomes = useMemo(() => outcomes.slice(0, 4), [outcomes]);
  const legendCols = useMemo(() => {
    // Reference splits the legend column-major: [0,1] left, [2,3] right.
    const half = Math.ceil(chartOutcomes.length / 2);
    return [chartOutcomes.slice(0, half), chartOutcomes.slice(half)];
  }, [chartOutcomes]);
  const legendStacked = chartOutcomes.some((o) => o.label.length > 16);
  const slidesSocialFocus =
    getSlidesKind() === "feed" || getSlidesKind() === "chat" || getSlidesKind() === "tape";
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StickyDetailScroll
        topInset={screenTopInset(insets.top)}
        paddingBottom={comboListPaddingBottom(
          comboMode,
          comboSheetH,
          insets.bottom,
          insets.bottom + (fixedMarketActions && binary && !slidesSocialFocus ? MARKET_ACTION_FOOTER_SPACE : 40),
        )}
        header={
          <>
        {/* Nav row: back · share. Avatar + title sit on their own line below. */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 }}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <BackIcon />
          </Pressable>
          <Pressable hitSlop={10}>
            <MaterialIcons name="ios-share" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        {/* Market identity line: avatar · title. */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 12, marginTop: 18 }}>
          {(market?.avatar ?? fallbackAvatar(title)) ? (
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                overflow: "hidden",
                backgroundColor: market?.avatarBg ?? colors.surface2,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                source={(market?.avatar ?? fallbackAvatar(title)) as number}
                style={{
                  width: 40,
                  height: 40,
                  transform: market?.avatarScale ? [{ scale: market.avatarScale }] : undefined,
                }}
                resizeMode={market?.avatarContain ? "contain" : "cover"}
              />
            </View>
          ) : market?.blankAvatar ? (
            // Inherit the card's look: markets modeled with a blank tile (e.g.
            // the MLB market, real league logo retired) show the same blank
            // tile here instead of the generic robot placeholder.
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: market.avatarBg ?? colors.surface2,
              }}
            />
          ) : !market && (typeof t !== "string" || !t) ? (
            // Robot mark belongs to the default AI market only; title-routed
            // markets without an avatar mirror their card (no avatar tile).
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: "#7FC8CF",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 22 }}>{"\u{1F916}"}</Text>
            </View>
          ) : null}
          <Text
            numberOfLines={2}
            style={{ flex: 1, fontFamily: geist.semibold, fontSize: 16, lineHeight: 22, color: colors.textPrimary }}
          >
            {title}
          </Text>
        </View>
          </>
        }
      >

        {/* Legend: two columns when labels fit; stacked rows when a label would wrap. */}
        {!slidesSocialFocus && (legendStacked ? (
          <View style={{ gap: 14, paddingHorizontal: 16, marginTop: 24 }}>
            {chartOutcomes.map((o, i) => (
              <View key={o.label} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: o.color }} />
                <Text style={{ flex: 1, fontFamily: geist.medium, fontSize: 14, color: colors.textPrimary }}>
                  {o.label}
                </Text>
                <Text style={{ fontFamily: geist.semibold, fontSize: 14, color: colors.textPrimary }}>
                  {scrubVals ? Math.round((scrubVals[i] ?? 0) * 100) : o.pct}%
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={{ flexDirection: "row", paddingHorizontal: 16, marginTop: 24 }}>
            {legendCols.map((col, ci) => (
              <View key={ci} style={{ flex: 1, gap: 14 }}>
                {col.map((o) => {
                  const i = chartOutcomes.indexOf(o);
                  return (
                  <View key={o.label} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: o.color }} />
                    <Text style={{ fontFamily: geist.medium, fontSize: 14, color: colors.textPrimary }}>
                      {o.label}
                    </Text>
                    <Text style={{ fontFamily: geist.semibold, fontSize: 14, color: colors.textPrimary }}>
                      {scrubVals ? Math.round((scrubVals[i] ?? 0) * 100) : o.pct}%
                    </Text>
                  </View>
                  );
                })}
              </View>
            ))}
          </View>
        ))}

        {/* Shared Panthers chart + MetaMask watermark + period pills. */}
        {slidesSocialFocus ? null : (
          <ChartWithPeriods series={chartOutcomes.map((o) => ({ color: o.color, points: o.points }))} live fitTop showGrid={false} onScrub={setScrubVals} />
        )}

        {/* Binary markets: Yes/No buttons stay inline only in the comparison variant. */}
        {binary && !slidesSocialFocus && (!fixedMarketActions || comboMode) && (
          <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 16, marginTop: 18 }}>
            {binaryActions.map((b) => {
              const visual = comboMode
                ? comboOutcomeVisual(
                    comboPicks.some((p) => p.id === standardComboId("y-n", b.key === "yes" ? "Yes" : "No", title)),
                    b.color,
                  )
                : outcomeButtonVisual("default", "gray-colored", b.color, { mode: "fill", label: b.label });
              if (comboMode) {
                return (
                  <ComboSelectedButton
                    key={b.label}
                    selected={comboPicks.some((p) => p.id === standardComboId("y-n", b.key === "yes" ? "Yes" : "No", title))}
                    onPress={b.onPress}
                    label={b.label}
                    radius={betR === 999 ? 999 : 12}
                    height={48}
                    flex={1}
                    fontSize={15}
                    fontFamily={geist.semibold}
                    unselectedColor={b.color}
                    unselectedChrome="outline"
                    labelForInk={b.label}
                  />
                );
              }
              return (
              <Pressable
                key={b.label}
                onPress={b.onPress}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: betR === 999 ? 999 : 12,
                  alignItems: "center",
                  justifyContent: "center",
                  ...visual.container,
                }}
              >
                <Text style={{ fontFamily: geist.semibold, fontSize: 15, ...visual.text }}>
                  {b.label}
                </Text>
              </Pressable>
              );
            })}
          </View>
        )}

        <MarketPageBody
          marketTitle={title}
          footerReserve={fixedMarketActions && binary && !comboMode && !slidesSocialFocus ? LIVE_CHAT_FOOTER_RESERVE : 0}
          hidePredictHeading={binary}
          predictHeading={binary ? undefined : "Outcomes"}
          positionNames={outcomes.map((o) => o.label)}
          rules={
            binary && !slidesSocialFocus ? (
              <MarketRulesSection
                subject={title}
                paragraphs={
                  /press secretary/i.test(title)
                    ? [
                        "This market resolves to the next person the White House announces as Press Secretary, replacing Karoline Leavitt.",
                        "Acting or interim Press Secretaries do not count toward resolution.",
                        "If nobody is chosen or the role is abolished by December 31, 2026, 11:59 PM ET, the market resolves to Other.",
                      ]
                    : /alvarez/i.test(title)
                      ? [
                          "This market will resolve to the next team Julian Alvarez officially joins by September 1, 2026, 11:59 PM ET.",
                          "If he does not officially join a new team by that deadline, the market resolves to Atletico Madrid.",
                          "If he joins a team that is not listed, is released, or retires, the market resolves to Other.",
                        ]
                      : undefined
                }
              />
            ) : undefined
          }
          positions={({ tabbed }) => (
            <MatchPositionsSection
              names={outcomes.map((o) => o.label)}
              marketTitle={title}
              returnTo={detailHref}
              hideHeading={tabbed}
              showEmpty={tabbed}
            />
          )}
          predict={
            !binary ? (
        <View style={{ paddingHorizontal: 16, marginTop: 14, gap: 14 }}>
          {/* Binary markets: one card (its buttons already cover Yes and No). */}
          {(outcomes.length === 2 && outcomes[0].label === "Yes" ? [outcomes[0]] : outcomes).map((o) => {
            const noPct = 100 - o.pct;
            return (
              <View key={o.label} style={{ borderRadius: 16, backgroundColor: colors.surface, padding: 16 }}>
                <Pressable disabled={outcomeRuleSheets} onPress={() => setRulesOutcome(o)}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 10 }}>
                      {o.avatar ? <OutcomeAvatarView avatar={o.avatar} size={32} /> : null}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", minWidth: 0 }}>
                          <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: geist.semibold, fontSize: 16, color: colors.textPrimary }}>
                            {o.label}
                          </Text>
                          {outcomeRuleSheets ? (
                            <ButtonIcon
                              iconName={IconName.Question}
                              size={ButtonIconSize.Xs}
                              iconProps={{ color: IconColor.IconAlternative }}
                              onPress={() => setRulesOutcome(o)}
                              accessibilityLabel={`${o.label} market rules`}
                              style={{ marginLeft: 4, flexShrink: 0 }}
                            />
                          ) : null}
                        </View>
                        <VolumeText style={{ fontSize: 13, marginTop: 2 }}>{o.vol}</VolumeText>
                      </View>
                    </View>
                    <Text style={{ fontFamily: geist.medium, fontSize: 24, lineHeight: 30, color: colors.textPrimary, marginLeft: 12 }}>
                      {o.pct}%
                    </Text>
                  </View>
                  {/* Neutral Draw-gray split — not lime/pink Yes/No. */}
                  <View style={{ flexDirection: "row", gap: 4, width: "100%", height: 2, marginTop: 14 }}>
                    <View style={{ flexGrow: 0, flexShrink: 1, flexBasis: `${o.pct}%`, height: 2, borderRadius: 999, backgroundColor: drawGray }} />
                    <View style={{ flexGrow: 0, flexShrink: 1, flexBasis: `${noPct}%`, height: 2, borderRadius: 999, backgroundColor: drawGray }} />
                  </View>
                </Pressable>
                <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                  {[
                     { label: "Yes", cents: o.pct, color: drawGray, side: "yes" as const },
                     { label: "No", cents: noPct, color: drawGray, side: "no" as const },
                  ].map((b) => {
                    const pickId = `ml:${title}:${o.label}:${b.label}`;
                    const on = comboPicks.some((p) => p.id === pickId);
                    if (comboMode) {
                      return (
                        <ComboSelectedButton
                          key={b.label}
                          selected={on}
                          onPress={() => {
                            placeComboOrSlip(
                              comboMode,
                              { id: pickId, category: "Predictions", label: `${b.label} · ${o.label}`, color: b.color, cents: b.cents, side: b.side },
                              { title: `${b.label} · ${o.label}`, market: title, oddsCents: b.cents, color: o.color, side: b.side, returnTo: detailHref, avatar: o.avatar },
                            );
                          }}
                          label={`${b.label} \u00b7 ${b.cents}\u00a2`}
                          radius={betR === 999 ? 999 : 12}
                          height={48}
                          flex={1}
                          fontSize={15}
                          fontFamily={geist.semibold}
                          unselectedColor={drawGray}
                          unselectedChrome="outline"
                        />
                      );
                    }
                    const visual = outcomeButtonVisual("default", "gray-colored", drawGray, {
                      mode: "muted-color",
                    });
                    return (
                      <Pressable
                        key={b.label}
                        onPress={() => {
                          placeComboOrSlip(
                            comboMode,
                            { id: pickId, category: "Predictions", label: `${b.label} · ${o.label}`, color: b.color, cents: b.cents, side: b.side },
                            { title: `${b.label} · ${o.label}`, market: title, oddsCents: b.cents, color: o.color, side: b.side, returnTo: detailHref, avatar: o.avatar },
                          );
                        }}
                        style={{
                          flex: 1,
                          height: 48,
                          borderRadius: betR === 999 ? 999 : 12,
                          alignItems: "center",
                          justifyContent: "center",
                          ...visual.container,
                        }}
                      >
                        <Text style={{ fontFamily: geist.semibold, fontSize: 15, ...visual.text, color: drawGray }}>
                          {`${b.label} \u00b7 ${b.cents}\u00a2`}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
            ) : null
          }
        />
      </StickyDetailScroll>
      {fixedMarketActions && binary && !comboMode && !slidesSocialFocus && <MarketActionFooter actions={binaryActions} bottomInset={insets.bottom} />}
      {comboMode ? (
        <ComboSheet
          picks={comboPicks}
          onRemove={removeComboPick}
          onReplace={replaceComboPick}
          onClear={clearComboPicks}
          docked
          returnTo="/combination"
        />
      ) : null}
      <MarketHelpSheet
        visible={!!rulesOutcome}
        title={rulesOutcome ? `${rulesOutcome.label} Market Rules` : "Market rules"}
        paragraphs={rulesOutcome?.rules ?? (rulesOutcome ? defaultMarketRules(rulesOutcome.label) : [])}
        onClose={() => setRulesOutcome(null)}
      />
    </View>
  );
}
