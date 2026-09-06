import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { buttonInteractionStyle, outcomeButtonVisual } from "@/lib/sim/buttonStyle";
import { ComboSelectedButton } from "@/components/sim/ComboGradient";
import { LinePicker } from "@/components/sim/LinePicker";
import { colors } from "@/lib/sim/colors";
import { openBetSlip } from "@/lib/sim/betSlipStore";
import { useBetRadius } from "@/lib/sim/pillButtonsStore";
import { matchKey } from "@/lib/sim/marketRoutes";
import { comboAvatarFromTeam } from "@/lib/sim/comboTeamMark";
import { comboOutcomeOn, comboPickAtSpreadIndex, comboPickForPrefix, comboSpreadPickerState } from "@/lib/sim/comboPickEdit";
import { replaceComboPick, toggleComboPick, useComboPicks } from "@/lib/sim/comboPicksStore";
import { useComboMode, useComboPageUnselectedChrome } from "@/lib/sim/comboFlowStore";
import type { Match, Team } from "@/lib/sim/types";
import type { ComboPick } from "@/components/sim/ComboSheet";
import { MarketHelpSheet } from "@/components/sim/MarketHelpSheet";
import { geist } from "@/lib/sim/geistFonts";
import { FilterButton, SegmentedControl } from "@metamask/design-system-react-native";

// Help-sheet copy for the (?) icons (shared with game-detail's bespoke cards).
export const SPREAD_HELP = [
  "A spread market is about the margin of victory, not just who wins. The favorite must win by more than the line (the number shown, like 4.5) for a bet on them to pay out; the underdog pays out if they win outright or lose by less than the line.",
  "Half-point lines (4.5 instead of 4) mean there's never a tie \u2014 one side always wins.",
  "Swipe the number strip to change the line. Prices update as you move: the bigger the margin you're backing, the cheaper the price.",
];
export const totalHelp = (unit: string) => [
  `A totals market is about the combined score of both teams \u2014 it doesn't matter who wins. You're predicting whether the total ${unit} scored will go Over or Under the line shown.`,
  `Half-${unit === "goals" ? "goal" : "point"} lines mean there's never a tie \u2014 the total always lands on one side.`,
  "Swipe the number strip to change the line. Prices update as you move: Over gets cheaper as the line climbs, Under gets cheaper as it drops.",
];

// Generalized Spread + Total (Over/Under) market cards for the match detail
// page — the "team rows" design approved on game-detail (title + one row per
// side: label, team-color underline scaled by price, signed line, cents pill)
// with the shared swipeable line strip underneath. game-detail keeps its own
// CAR/ARI-specific combo-enabled versions; these are read-only-market
// equivalents parameterized by Match.

function CentsPill({
  cents,
  color,
  selected,
  onPress,
  combo,
}: {
  cents: number;
  color: string;
  selected?: boolean;
  onPress: () => void;
  combo?: boolean;
}) {
  const betR = useBetRadius();
  const unselectedChrome = useComboPageUnselectedChrome();
  if (combo) {
    return (
      <ComboSelectedButton
        selected={!!selected}
        onPress={onPress}
        label={`${cents}\u00a2`}
        radius={betR}
        height={44}
        minWidth={72}
        paddingHorizontal={14}
        fontSize={15}
        fontFamily={geist.semibold}
        unselectedColor={color}
        unselectedChrome={unselectedChrome}
      />
    );
  }
  const visual = outcomeButtonVisual("default", "gray-colored", color, { mode: "muted-color" });
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          height: 44,
          minWidth: 72,
          paddingHorizontal: 14,
          borderRadius: betR,
          alignItems: "center",
          justifyContent: "center",
        },
        visual.container,
        buttonInteractionStyle(pressed),
      ]}
    >
      <Text style={[{ fontFamily: geist.semibold, fontSize: 15, lineHeight: 21 }, visual.text]}>{`${cents}\u00a2`}</Text>
    </Pressable>
  );
}

// Team/outcome row: label + 2px bar (longest fills the track, others scale to
// it) · 12px · signed line · 12px · cents pill.
function MarketOutcomeRow({
  label,
  cents,
  maxCents,
  color,
  lineLabel,
  selected,
  onPress,
  combo,
}: {
  label: string;
  cents: number;
  maxCents: number;
  color: string;
  lineLabel: string;
  selected?: boolean;
  onPress: () => void;
  combo?: boolean;
}) {
  const barPct = maxCents > 0 ? (cents / maxCents) * 100 : 0;
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ fontFamily: geist.medium, fontSize: 16, lineHeight: 21, color: colors.textPrimary }}>
          {label}
        </Text>
        <View style={{ marginTop: 6, height: 2, borderRadius: 1, backgroundColor: color, width: `${barPct}%` }} />
      </View>
      <Text style={{ fontFamily: geist.medium, fontSize: 15, color: colors.textPrimary, marginRight: 12 }}>
        {lineLabel}
      </Text>
      <CentsPill cents={cents} color={color} selected={selected} onPress={onPress} combo={combo} />
    </View>
  );
}

function pctNum(t: Team): number {
  return parseInt(t.pct, 10) || 0;
}

// Yes price decays smoothly from the moneyline anchor toward 1¢ at far lines.
function spreadYes(anchor: number, line: number, step: number): number {
  const decayed = Math.round(anchor * Math.exp(-((line - step / 2) / step) * 0.22));
  return Math.max(1, Math.min(99, decayed));
}

export const SOCCER_PERIOD_SCOPES = ["Regulation time", "Full game"] as const;

// Sport-tuned line ranges. Spread lines are n+0.5 steps; totals get a range
// and label appropriate to typical scores for the sport.
function sportConfig(match: Match): { spreadLines: number[]; totalLines: number[]; totalDefault: number; totalTitle: string; unit: string; scopes?: string[] } {
  const half = (from: number, count: number, step = 1) => Array.from({ length: count }, (_, i) => from + i * step);
  switch (match.sport) {
    case "soccer":
      return { spreadLines: half(0.5, 5), totalLines: half(0.5, 7), totalDefault: 2.5, totalTitle: "Total Goals", unit: "goals", scopes: [...SOCCER_PERIOD_SCOPES] };
    case "hockey":
      return { spreadLines: half(0.5, 6), totalLines: half(3.5, 6), totalDefault: 5.5, totalTitle: "Total Goals", unit: "goals", scopes: [...SOCCER_PERIOD_SCOPES] };
    case "basketball":
      return { spreadLines: half(0.5, 25), totalLines: half(200.5, 41), totalDefault: 220.5, totalTitle: "Total Points", unit: "points" };
    case "baseball":
      return { spreadLines: half(0.5, 4), totalLines: half(5.5, 8), totalDefault: 8.5, totalTitle: "Total Runs", unit: "runs", scopes: ["Full Game", "First 5 Innings"] };
    default:
      return { spreadLines: half(0.5, 33), totalLines: half(30.5, 31), totalDefault: 44.5, totalTitle: "Total Points", unit: "points" };
  }
}

// Market-scope toggle (e.g. soccer/hockey Regulation time vs Full game, baseball
// Full Game vs First 5 Innings): MMDS SegmentedControl under the section title.
export function ScopeToggle({ options, index, onIndex }: { options: string[]; index: number; onIndex: (i: number) => void }) {
  const value = options[index] ?? options[0] ?? "";
  return (
    <View style={{ marginTop: 12 }}>
      <SegmentedControl
        value={value}
        onChange={(next) => {
          const i = options.indexOf(next);
          if (i >= 0) onIndex(i);
        }}
      >
        {options.map((label) => (
          <FilterButton key={label} value={label}>
            {label}
          </FilterButton>
        ))}
      </SegmentedControl>
    </View>
  );
}

export function scopeSlug(label?: string): string {
  return (label ?? "").trim().toLowerCase().replace(/\s+/g, "-");
}

export function soccerPeriodScopesForSport(sport?: string): readonly string[] | undefined {
  return sport === "soccer" || sport === "hockey" ? SOCCER_PERIOD_SCOPES : undefined;
}

export function marketPeriod(scopes: readonly string[] | undefined, index: number): string | undefined {
  const label = scopes?.[index];
  return label?.trim() || undefined;
}

const OVER_COLOR = colors.green;
const UNDER_COLOR = "#D9C7FF";

const cardStyle = {
  borderRadius: 16,
  overflow: "hidden" as const,
  backgroundColor: colors.surface,
  paddingTop: 16,
  paddingHorizontal: 16,
  paddingBottom: 0,
} as const;

export function SpreadCard({ match, teamColor }: { match: Match; teamColor?: (t: Team) => string }) {
  const comboMode = useComboMode();
  const comboPicks = useComboPicks();
  const [home, away] = match.teams;
  const cfg = sportConfig(match);
  const colorOf = (t: Team) => (teamColor ? teamColor(t) : t.color);
  // Home lines descending, then away ascending (mirrored around the divider).
  const entries = [
    ...cfg.spreadLines.slice().reverse().map((l) => ({ team: home, line: l })),
    ...cfg.spreadLines.map((l) => ({ team: away, line: l })),
  ];
  const [browseIdx, setBrowseIdx] = useState(cfg.spreadLines.length); // away's first (smallest) line? no — divider index = home group length; default = first away entry
  const [help, setHelp] = useState(false);
  const [scope, setScope] = useState(0);
  const period = marketPeriod(cfg.scopes, scope);
  const periodKey = period ? `${scopeSlug(period)}:` : "";
  const stored = comboPickForPrefix(comboPicks, `spread:${matchKey(match)}:${periodKey}`);
  const strip = stored ? comboSpreadPickerState(stored) : null;
  const idx = strip?.index ?? browseIdx;
  const en = entries[idx];
  const anchor = pctNum(en.team) + 9; // covering the smallest spread prices a touch above the moneyline
  const yes = spreadYes(anchor, en.line, 1);
  const rows = match.teams.map((team) => {
    const isSel = team === en.team;
    return { team, cents: isSel ? yes : 100 - yes, lineLabel: `${isSel ? "+" : "-"}${en.line}`, isSel };
  });
  const maxCents = Math.max(...rows.map((r) => r.cents), 1);
  return (
    <View style={cardStyle}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontFamily: geist.semibold, fontSize: 16, lineHeight: 21, color: colors.textPrimary }}>Spreads</Text>
        <Pressable hitSlop={8} onPress={() => setHelp(true)}>
          <Feather name="help-circle" size={18} color={colors.textMuted} />
        </Pressable>
        <MarketHelpSheet visible={help} title="What's a spread?" paragraphs={SPREAD_HELP} onClose={() => setHelp(false)} />
      </View>
      {cfg.scopes && <ScopeToggle options={cfg.scopes} index={scope} onIndex={setScope} />}
      <View style={{ marginTop: 14, gap: 14 }}>
        {rows.map(({ team, cents, lineLabel }) => {
          const id = `spread:${matchKey(match)}:${periodKey}${team.abbr ?? team.name}:${lineLabel}`;
          const on = comboOutcomeOn(comboPicks, id);
          const other = team === home ? away : home;
          const otherLabel = team === en.team ? `-${en.line}` : `+${en.line}`;
          const pick: ComboPick = {
            id,
            category: match.league ?? match.sport ?? "Sports",
            label: `${team.abbr ?? team.name} ${lineLabel} · ${home.name} vs ${away.name}`,
            color: colorOf(team),
            cents,
            side: "yes",
            kind: "spread",
            sport: match.sport,
            period,
            line: en.line,
            lines: cfg.spreadLines,
            avatar: comboAvatarFromTeam(team),
            alt: {
              id: `spread:${matchKey(match)}:${periodKey}${other.abbr ?? other.name}:${otherLabel}`,
              label: `${other.abbr ?? other.name} ${otherLabel} · ${home.name} vs ${away.name}`,
              color: colorOf(other),
              cents: 100 - cents,
              avatar: comboAvatarFromTeam(other),
            },
          };
          return (
            <MarketOutcomeRow
              key={team.abbr ?? team.name}
              label={team.abbr ?? team.name}
              cents={cents}
              maxCents={maxCents}
              color={colorOf(team)}
              lineLabel={lineLabel}
              selected={comboMode && on}
              combo={comboMode}
              onPress={() => {
                if (comboMode) {
                  toggleComboPick(pick);
                  return;
                }
                openBetSlip({
                  title: `${team.abbr ?? team.name} ${lineLabel}`,
                  market: "Spreads",
                  oddsCents: cents,
                  color: colorOf(team),
                  side: "yes",
                });
              }}
            />
          );
        })}
      </View>
      <View style={{ marginTop: 12 }}>
        <LinePicker
          labels={entries.map((e) => String(e.line))}
          dividerAt={cfg.spreadLines.length}
          index={idx}
          onIndex={(i) => {
            if (stored) {
              replaceComboPick(stored.id, comboPickAtSpreadIndex(stored, i));
              return;
            }
            setBrowseIdx(i);
          }}
        />
      </View>
    </View>
  );
}

export function TotalCard({ match }: { match: Match }) {
  const comboMode = useComboMode();
  const comboPicks = useComboPicks();
  const cfg = sportConfig(match);
  const [idx, setIdx] = useState(Math.max(0, cfg.totalLines.indexOf(cfg.totalDefault)));
  const [help, setHelp] = useState(false);
  const [scope, setScope] = useState(0);
  const period = marketPeriod(cfg.scopes, scope);
  const periodKey = period ? `${scopeSlug(period)}:` : "";
  const line = cfg.totalLines[idx];
  // Over price decays as the line climbs; Under is the complement.
  const span = cfg.totalLines[cfg.totalLines.length - 1] - cfg.totalLines[0];
  const over = Math.max(1, Math.min(99, Math.round(55 - ((line - cfg.totalDefault) / span) * 100)));
  const rows = [
    { key: "over", label: "Over", cents: over, color: OVER_COLOR },
    { key: "under", label: "Under", cents: 100 - over, color: UNDER_COLOR },
  ];
  const maxCents = Math.max(...rows.map((r) => r.cents), 1);
  const [home, away] = match.teams;
  return (
    <View style={cardStyle}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontFamily: geist.semibold, fontSize: 16, lineHeight: 21, color: colors.textPrimary }}>{cfg.totalTitle}</Text>
        <Pressable hitSlop={8} onPress={() => setHelp(true)}>
          <Feather name="help-circle" size={18} color={colors.textMuted} />
        </Pressable>
        <MarketHelpSheet
          visible={help}
          title={`What's a ${cfg.totalTitle.toLowerCase()} market?`}
          paragraphs={totalHelp(cfg.unit)}
          onClose={() => setHelp(false)}
        />
      </View>
      {cfg.scopes && <ScopeToggle options={cfg.scopes} index={scope} onIndex={setScope} />}
      <View style={{ marginTop: 14, gap: 14 }}>
        {rows.map((r) => {
          const id = `total:${matchKey(match)}:${periodKey}${r.key}:${line}`;
          const on = comboPicks.some((p) => p.id === id);
          const other = r.key === "over" ? rows[1] : rows[0];
          const pick: ComboPick = {
            id,
            category: match.league ?? match.sport ?? "Sports",
            label: `${r.label} ${line} · ${home.name} vs ${away.name}`,
            color: r.color,
            cents: r.cents,
            side: "yes",
            kind: "ou",
            sport: match.sport,
            period,
            line,
            lines: cfg.totalLines,
            avatar: comboAvatarFromTeam(r.key === "over" ? home : away),
            alt: other
              ? {
                  id: `total:${matchKey(match)}:${periodKey}${other.key}:${line}`,
                  label: `${other.label} ${line} · ${home.name} vs ${away.name}`,
                  color: other.color,
                  cents: other.cents,
                  avatar: comboAvatarFromTeam(r.key === "over" ? away : home),
                }
              : undefined,
          };
          return (
            <MarketOutcomeRow
              key={r.key}
              label={r.label}
              cents={r.cents}
              maxCents={maxCents}
              color={r.color}
              lineLabel={`${r.key === "over" ? "O" : "U"} ${line}`}
              selected={comboMode && on}
              combo={comboMode}
              onPress={() => {
                if (comboMode) {
                  toggleComboPick(pick);
                  return;
                }
                openBetSlip({
                  title: `${r.label} ${line}`,
                  market: cfg.totalTitle,
                  oddsCents: r.cents,
                  color: r.color,
                  side: "yes",
                });
              }}
            />
          );
        })}
      </View>
      <View style={{ marginTop: 12 }}>
        <LinePicker labels={cfg.totalLines.map((l) => String(l))} index={idx} onIndex={setIdx} />
      </View>
    </View>
  );
}
