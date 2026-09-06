import React from "react";
import { Pressable, Text, View, Image } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";

import { ComboSelectedButton } from "@/components/sim/ComboGradient";
import { marketPeriod, soccerPeriodScopesForSport, scopeSlug } from "@/components/sim/MatchMarkets";
import { colors, marketAccentColor } from "@/lib/sim/colors";
import { comboPrices, comboTeamMark, type ComboGame } from "@/lib/sim/comboData";
import { comboOutcomeOn, comboPickAtSpreadIndex, comboPickForPrefix, comboPickLine, comboSpreadPickerState, setComboPickLine } from "@/lib/sim/comboPickEdit";
import { replaceComboPick, useComboPicks } from "@/lib/sim/comboPicksStore";
import type { ComboCategoryInfo } from "./ComboGameCard";
import type { ComboPick } from "./ComboSheet";
import { SPREAD_LINES } from "@/lib/sim/spreadLines";
import { LinePicker } from "@/components/sim/LinePicker";
import { LiveDot } from "./Crest";
import { useLiveCueColors } from "@/lib/sim/LiveCueColorContext";
import { useTopControls } from "@/lib/sim/feedTopControlsStore";
import { geist } from "@/lib/sim/geistFonts";
import { useDisplayFont, useOswaldDataSet } from "@/lib/sim/typefaceStore";
import { VolumeText } from "@/components/sim/VolumeText";
import { useComboPageUnselectedChrome } from "@/lib/sim/comboFlowStore";

// Line-market kinds sharing this card structure. Spread keeps the flippable
// team sentence + team pills; the others are over/under (or yes/no) markets
// with neutral pills that fill white when selected.
export type LineKind = "spread" | "total" | "rfi" | "hrs" | "ks";

const OVER = colors.green;
const UNDER = "#D9C7FF";

const LINE_CONFIG: Record<
  Exclude<LineKind, "spread">,
  { noun: string; lines: number[]; defaultLine: number; yesNo?: boolean }
> = {
  total: { noun: "Total points more than", lines: [41.5, 42.5, 43.5, 44.5, 45.5, 46.5, 47.5, 48.5], defaultLine: 44.5 },
  hrs: { noun: "Total home runs more than", lines: [0.5, 1.5, 2.5, 3.5, 4.5], defaultLine: 1.5 },
  ks: { noun: "Total strikeouts more than", lines: [4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5], defaultLine: 8.5 },
  rfi: { noun: "A run scored in the 1st inning", lines: [0.5], defaultLine: 0.5, yesNo: true },
};

// Line market card (game-detail spread block promoted to a standalone COMBO
// card): live score header, market sentence, two pills, line stepper footer.
export function ComboSpreadCard({
  game,
  category,
  selected,
  onToggle,
  kind = "spread",
  onOpen,
}: {
  game: ComboGame;
  category: ComboCategoryInfo;
  selected: (pickId: string) => boolean;
  onToggle: (pick: ComboPick) => void;
  kind?: LineKind;
  // Tapping the card (outside the pills/stepper controls) opens game detail.
  onOpen?: () => void;
}) {
  const displayFont = useDisplayFont();
  const oswald = useOswaldDataSet();
  const cue = useLiveCueColors();
  const { showFooter } = useTopControls();
  const unselectedChrome = useComboPageUnselectedChrome();
  const prices = comboPrices(game);
  const conf = kind === "spread" ? undefined : LINE_CONFIG[kind];
  const lines = conf ? conf.lines : SPREAD_LINES;
  const [browseLine, setBrowseLine] = React.useState(conf ? conf.defaultLine : 0.5);
  const [browseFlip, setBrowseFlip] = React.useState(false);
  const periodScopes = kind === "spread" || kind === "total" ? soccerPeriodScopesForSport(game.sport) : undefined;
  const period = marketPeriod(periodScopes, 0);
  const periodKey = period ? `${scopeSlug(period)}:` : "";
  const picks = useComboPicks();
  const stored = comboPickForPrefix(picks, `${game.id}:spread:${periodKey}`);
  const stripFromStore = stored && kind === "spread" ? comboSpreadPickerState(stored) : null;
  const line = stored ? (comboPickLine(stored) ?? browseLine) : browseLine;
  const flip = stripFromStore ? stripFromStore.index >= stripFromStore.dividerAt : browseFlip;
  const homeLines = [...lines].reverse();
  const stripLabels = kind === "spread" ? [...homeLines, ...lines].map(String) : lines.map(String);
  const stripDivider = kind === "spread" ? lines.length : undefined;
  const stripIndex = stripFromStore
    ? stripFromStore.index
    : kind === "spread"
      ? flip
        ? lines.length + Math.max(0, lines.indexOf(line))
        : Math.max(0, homeLines.indexOf(line))
      : Math.max(0, lines.indexOf(line));
  const sentenceTeam = game.teams[flip ? 1 : 0];
  const fills = [marketAccentColor(game.teams[0].color), marketAccentColor(game.teams[1].color)];
  // Non-spread outcome pair: Over/Under (or Yes/No for RFI).
  const ou = conf
    ? [
        { key: "over", short: conf.yesNo ? "Yes" : `O ${line}`, color: OVER },
        { key: "under", short: conf.yesNo ? "No" : `U ${line}`, color: UNDER },
      ]
    : undefined;

  return (
    <Pressable onPress={onOpen} disabled={!onOpen} style={{ borderRadius: 16, backgroundColor: colors.surface, paddingTop: 14, paddingBottom: showFooter ? 0 : 20 }}>
      {/* Centered game title above the score header (mirrors ComboGameCard). */}
      <Text {...oswald} numberOfLines={1} style={{ fontFamily: displayFont, fontSize: 16, lineHeight: 24, color: colors.textPrimary, textAlign: "center", paddingHorizontal: 16 }}>
        {game.teams[0].name} vs. {game.teams[1].name}
      </Text>

      {/* Live score header: helmets pinned to the edges, scores, LIVE center. */}
      <View style={{ marginTop: 16, flexDirection: "row", alignItems: "center", width: "100%", gap: 12, paddingHorizontal: 16 }}>
        <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center" }}>
          {game.teams[0].logo ? (
            <Image source={{ uri: game.teams[0].logo }} style={{ width: 40, height: 40 }} resizeMode="contain" />
          ) : (
            <View style={{ width: 40, height: 40 }} />
          )}
          <Text {...oswald} numberOfLines={1} style={{ flex: 1, fontFamily: displayFont, fontSize: 32, lineHeight: 40, color: "#fff", textAlign: "center" }}>
            {game.teams[0].score}
          </Text>
        </View>
        <View style={{ flexShrink: 0, alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <LiveDot color={colors.green} />
            <Text style={{ fontFamily: geist.semibold, fontSize: 12, lineHeight: 18, color: colors.green }}>LIVE</Text>
          </View>
          <Text style={{ fontFamily: geist.semibold, fontSize: 12, lineHeight: 18, color: colors.textMuted, textAlign: "center" }} numberOfLines={1}>
            {game.clock}
          </Text>
        </View>
        <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center" }}>
          <Text {...oswald} numberOfLines={1} style={{ flex: 1, fontFamily: displayFont, fontSize: 32, lineHeight: 40, color: "#fff", textAlign: "center" }}>
            {game.teams[1].score}
          </Text>
          {game.teams[1].logo ? (
            <Image source={{ uri: game.teams[1].logo }} style={{ width: 40, height: 40 }} resizeMode="contain" />
          ) : (
            <View style={{ width: 40, height: 40 }} />
          )}
        </View>
      </View>

      {/* Hairline below the score header. */}
      <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginTop: 14 }} />

      {/* Market sentence. */}
      <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, paddingHorizontal: 16, marginTop: 14 }}>
        {kind === "spread" ? (
          <>
            <Pressable
              onPress={() => {
                if (stored) {
                  const flipped = comboPickAtSpreadIndex(stored, flip ? Math.max(0, homeLines.indexOf(line)) : lines.length + Math.max(0, lines.indexOf(line)));
                  replaceComboPick(stored.id, flipped);
                  return;
                }
                setBrowseFlip((f) => !f);
              }}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Text style={{ fontFamily: geist.medium, fontSize: 15, lineHeight: 20, color: fills[flip ? 1 : 0] }}>
                {sentenceTeam.name}
              </Text>
              <Feather name="repeat" size={14} color={colors.textMuted} />
            </Pressable>
            <Text style={{ fontFamily: geist.regular, fontSize: 15, lineHeight: 20, color: colors.textMuted }}>wins by more than</Text>
            <Text style={{ fontFamily: geist.medium, fontSize: 15, lineHeight: 20, color: colors.textPrimary }}>{line}</Text>
            <Text style={{ fontFamily: geist.regular, fontSize: 15, lineHeight: 20, color: colors.textMuted }}>points</Text>
          </>
        ) : (
          <>
            <Text style={{ fontFamily: geist.regular, fontSize: 15, lineHeight: 20, color: colors.textMuted }}>{conf!.noun}</Text>
            {!conf!.yesNo && (
              <Text style={{ fontFamily: geist.medium, fontSize: 15, lineHeight: 20, color: colors.textPrimary }}>{line}</Text>
            )}
          </>
        )}
      </View>

      {/* Team pills. */}
      <View style={{ flexDirection: "row", gap: 11, paddingHorizontal: 16, marginTop: 14 }}>
        {game.teams.map((team, i) => {
          const other = game.teams[1 - i];
          const id = `${game.id}:spread:${periodKey}${team.abbr}@${line}`;
          const on = stored ? comboOutcomeOn(picks, id) : selected(id);
          const fill = fills[i];
          return (
            <ComboSelectedButton
              key={i}
              selected={on}
              onPress={() =>
                onToggle({
                  id,
                  category: category.label,
                  categoryIcon: category.icon,
                  categoryEmoji: category.emoji,
                  label: `${team.abbr} +${line} \u00b7 ${game.teams[0].name} vs ${game.teams[1].name}`,
                  color: fill,
                  cents: prices[i],
                  avatar: comboTeamMark(team) ?? (team.logo ? { uri: team.logo } : undefined),
                  kind: kind === "spread" ? "spread" : "ou",
                  sport: game.sport,
                  period,
                  line,
                  lines,
                  alt: {
                    id: `${game.id}:spread:${periodKey}${other.abbr}@${line}`,
                    label: `${other.abbr} +${line} \u00b7 ${game.teams[0].name} vs ${game.teams[1].name}`,
                    color: fills[1 - i],
                    cents: prices[1 - i],
                    avatar: comboTeamMark(other) ?? (other.logo ? { uri: other.logo } : undefined),
                  },
                })
              }
              label={`${team.abbr} \u00b7 +${line}`}
              radius={12}
              height={48}
              flex={1}
              fontSize={16}
              fontFamily={geist.semibold}
              lineHeight={21}
              unselectedColor={fill}
              unselectedChrome={unselectedChrome}
            />
          );
        })}
      </View>

      {lines.length > 1 ? (
        <View style={{ marginTop: 14 }}>
          <LinePicker
            labels={stripLabels}
            dividerAt={stripDivider}
            index={stripIndex}
            onIndex={(i) => {
              if (stored) {
                replaceComboPick(
                  stored.id,
                  kind === "spread" ? comboPickAtSpreadIndex(stored, i) : setComboPickLine(stored, lines[i] ?? line),
                );
                return;
              }
              if (kind === "spread") {
                if (i < lines.length) {
                  setBrowseFlip(false);
                  setBrowseLine(homeLines[i] ?? line);
                } else {
                  setBrowseFlip(true);
                  setBrowseLine(lines[i - lines.length] ?? line);
                }
                return;
              }
              setBrowseLine(lines[i] ?? line);
            }}
          />
        </View>
      ) : (
        <View style={{ height: 14 }} />
      )}

      {showFooter ? (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingBottom: 14,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ height: 20, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.04)", justifyContent: "center", paddingHorizontal: 6 }}>
            <Text style={{ fontFamily: geist.medium, fontSize: 12, lineHeight: 16, color: colors.textMuted }}>{game.league}</Text>
          </View>
          <VolumeText style={{ fontSize: 12, lineHeight: 16 }}>{game.vol}</VolumeText>
        </View>
        <Text style={{ fontFamily: geist.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted }}>
          +{game.more} more <Ionicons name="chevron-forward" size={10} color={colors.textMuted} />
        </Text>
      </View>
      ) : null}
    </Pressable>
  );
}
