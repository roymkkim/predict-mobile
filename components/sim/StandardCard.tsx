import { Fragment } from "react";
import { Animated, Image, Pressable, Text, View, type ImageSourcePropType } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { accessibleColor, backgroundMuted, barFill, colors, marketAccentColor } from "@/lib/sim/colors";
import { placeComboOrSlip, standardComboId } from "@/lib/sim/comboBet";
import { useComboPageUnselectedChrome, useEffectiveCombo } from "@/lib/sim/comboFlowStore";
import { comboOutcomeOn } from "@/lib/sim/comboPickEdit";
import { useComboPicks } from "@/lib/sim/comboPicksStore";
import { comboAvatarFromTeam } from "@/lib/sim/comboTeamMark";
import { matchKey } from "@/lib/sim/marketRoutes";
import { ComboSelectedButton } from "@/components/sim/ComboGradient";
import { CardBuildComboButton } from "@/components/sim/BuildComboButton";
import { buttonInteractionStyle, buttonMetrics, comboOutcomeVisual, outcomeButtonVisual } from "@/lib/sim/buttonStyle";
import { soccerDrawCents } from "@/lib/sim/soccerMoneyline";
import { useUxrMode } from "@/lib/sim/uxrModeStore";
import { useThemeMode } from "@/lib/sim/dsModeStore";
import { usePillButtons } from "@/lib/sim/pillButtonsStore";
import { useOutcomeButtonColorMode } from "@/lib/sim/outcomeButtonColorStore";
import { useCenterHighlight } from "@/lib/sim/useCenterHighlight";
import { useFeedSettings } from "@/lib/sim/FeedSettingsContext";
import { useLiveOdds } from "@/lib/sim/useLiveOdds";
import { useLiveScores } from "@/lib/sim/useLiveScores";
import type {
  AnimStyle,
  ButtonAnim,
  ButtonSize,
  ButtonStyle,
  ButtonText,
  CardPadding,
  Display,
  Match,
  MetaPlacement,
  MetaStyle,
  PossessionMode,
  StandardAsideCue,
  StandardButtons,
  StandardScore,
  StandardTitle,
} from "@/lib/sim/types";
import { Crest, PhotoAvatar } from "./Crest";
import { useAthletePhotos } from "@/lib/sim/athletePhotosStore";
import { YesNoControls } from "./YesNoControls";
import { HighlightFace } from "./HighlightFace";
import { LightReflect } from "./LightReflect";
import { LiveBorder } from "./LiveBorder";
import { ScoreGlowBorder } from "./ScoreGlowBorder";
import { ScoreGlowInPlace } from "./ScoreGlowInPlace";
import { MetaFooter, MetaHeader } from "./MetaHeader";
import { Possession } from "./Possession";
import { SlotNumber } from "./SlotNumber";
import { SportIcon } from "./SportIcon";
import { outlinedSportId } from "./MaterialSportsOutline";
import { geist } from "@/lib/sim/geistFonts";
import { useDisplayFont, useOswaldDataSet } from "@/lib/sim/typefaceStore";

// Live game score chip: a rounded 32x32 box with a hairline border; tints to the
// team color briefly when the team just scored (flash). Score is a flat 14px — a
// 3-digit score (e.g. "120") is ~24px wide in Geist Medium, well inside the 32px
// box, so no shrink is needed.
function ScoreChip({ value, flash = false, flashColor }: { value: string; flash?: boolean; flashColor?: string }) {
  const fontSize = 14;
  return (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(133,139,154,0.2)",
      }}
    >
      <Text style={{ fontFamily: geist.medium, fontSize, color: flash ? flashColor : colors.textPrimary }}>{value}</Text>
    </View>
  );
}

// A completed/active set score: a bare muted number (no padded box); the active
// (current) set is rendered white + semibold. Optional tiebreak renders as a
// superscript (7⁷-style, tennis).
function SetScore({ value, active = false, tiebreak }: { value: number; active?: boolean; tiebreak?: number }) {
  const color = active ? colors.textPrimary : colors.textMuted;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
      <Text
        style={{
          fontFamily: active ? geist.semibold : geist.medium,
          fontSize: 14,
          lineHeight: 24,
          color,
        }}
      >
        {value}
      </Text>
      {tiebreak !== undefined && (
        <Text style={{ fontFamily: geist.medium, fontSize: 9, lineHeight: 13, color }}>{tiebreak}</Text>
      )}
    </View>
  );
}

// One score cell sized to the WIDEST value among the stacked rows: every
// candidate string is rendered transparently (stacked, but clipped to a single
// line height so it never adds vertical space) to establish the cell width by
// the genuinely widest glyph run, and the actual value is overlaid centered. So
// a "5" occupies the same box as a "33", and "P1"/"P2" share one width even when
// the font's tabular metrics don't make every digit pixel-identical (relying on
// length alone wrapped the wider "P2" against a "P1"-sized box). numberOfLines={1}
// guarantees the overlaid value never wraps.
function ColCell({ value, candidates, color }: { value: string; candidates: string[]; color: string }) {
  const all = candidates.length ? candidates : [value];
  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ height: 24, overflow: "hidden" }} pointerEvents="none">
        {all.map((c, i) => (
          <Text key={i} numberOfLines={1} style={{ fontFamily: geist.medium, fontSize: 14, lineHeight: 24, color: "transparent" }}>
            {c}
          </Text>
        ))}
      </View>
      <Text
        numberOfLines={1}
        style={{
          fontFamily: geist.medium,
          fontSize: 14,
          lineHeight: 24,
          color,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          textAlign: "center",
        }}
      >
        {value}
      </Text>
    </View>
  );
}

// Two-column live score with no bordered chip — a primary stat (white) and a
// muted secondary stat. Used by golf (to-par + "THRU N") and racing (position +
// time gap). Each column is as wide as the widest value across the rows.
// Exported: detail-page headers (SportScoreHeader) reuse this exact card unit.
export function ColumnScore({
  value,
  sub,
  valueCandidates,
  subCandidates,
  emphasizeSub = false,
}: {
  value: string;
  sub?: string;
  valueCandidates: string[];
  subCandidates?: string[];
  emphasizeSub?: boolean;
}) {
  // emphasizeSub flips which column reads as the primary (white) stat: racing
  // wants the time gap highlighted with the position muted, while keeping the
  // position on the left.
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <ColCell value={value} candidates={valueCandidates} color={emphasizeSub ? colors.textMuted : colors.textPrimary} />
      {sub != null && <ColCell value={sub} candidates={subCandidates ?? [sub]} color={emphasizeSub ? colors.textPrimary : colors.textMuted} />}
    </View>
  );
}

// Set scores followed by the live game chip, 12px between cells. This is THE
// card scoring unit — detail-page headers reuse it (SportScoreHeader,
// tennis-detail) so cards and detail pages always match.
export type ScoreUnitSet = number | { games: number; tiebreak?: number };
export function ScoreUnit({
  value,
  sets,
  activeSetIdx = -1,
  flash = false,
  flashColor,
}: {
  value: string;
  sets: ScoreUnitSet[];
  activeSetIdx?: number;
  flash?: boolean;
  flashColor?: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      {sets.map((s, i) => (
        <SetScore
          key={i}
          value={typeof s === "number" ? s : s.games}
          tiebreak={typeof s === "number" ? undefined : s.tiebreak}
          active={i === activeSetIdx}
        />
      ))}
      <ScoreChip value={value} flash={flash} flashColor={flashColor} />
    </View>
  );
}

// Standard sports card: stacked team rows with crest, name, probability bar,
// live score column, and a % button. Version A uses score="aside" + slot button.
export function StandardCard({
  match,
  live,
  score,
  display,
  title,
  titleText,
  titleAvatar,
  possession,
  asideCue,
  buttonSize = "lg",
  buttonText,
  buttonStyle = "default",
  buttonAnim = "ticker",
  metaStyle,
  metaPlacement = "top",
  cardPadding,
  hybridButtons = false,
  animate = false,
  animStyle = "pulse",
  liveBaseDelayMs = 0,
  staggerMs,
  combo,
  showBuildCombo = false,
}: {
  match: Match;
  live: boolean;
  score: StandardScore;
  display: Display;
  title: StandardTitle;
  titleText?: string;
  titleAvatar?: ImageSourcePropType;
  possession: PossessionMode;
  asideCue: StandardAsideCue;
  buttons?: StandardButtons;
  buttonSize?: ButtonSize;
  buttonText: ButtonText;
  buttonStyle?: ButtonStyle;
  buttonAnim?: ButtonAnim;
  metaStyle: MetaStyle;
  metaPlacement?: MetaPlacement;
  cardPadding: CardPadding;
  // "hybrid" feed layout: drop the per-row % buttons (keep live scores) and place
  // the outcome bets in a horizontal stacked button row at the card bottom.
  hybridButtons?: boolean;
  animate?: boolean;
  animStyle?: AnimStyle;
  liveBaseDelayMs?: number;
  staggerMs?: number;
  combo?: boolean;
  /** Home/feed cards omit this; match detail uses BuildComboButton directly. */
  showBuildCombo?: boolean;
}) {
  const displayFont = useDisplayFont();
  const oswald = useOswaldDataSet();
  const isLive = live && !!match.live;
  const themeMode = useThemeMode();
  const isWorldCup = /world cup/i.test(match.league);
  const inline = score === "inline";
  const cueByScore = !inline && asideCue === "score";
  const { density, showFooter, footerDetail, scoreGlow, scoreGlowMode, cardStyle, cardBg: cardBgOverride, barTrack, versusMode, standardAccent, centerAccentWidth, showTeamAvatars, oddsUnit, showLiveAccent = true, liveFormat = "inline", bodyAvatarSize = 32 } = useFeedSettings();
  // The team-avatar style toggle drives the per-row crest variant. World Cup
  // keeps flags via preferFlag in either mode.
  const crestVariant = "logo";
  const oldMode = versusMode === "old";
  const isQuestionCard = Boolean(titleText);
  const listMode = cardStyle === "list";
  const cardBg = cardStyle === "card" ? cardBgOverride ?? colors.surfaceTransparent : "transparent";
  const { rootRef, onLayout, bgOpacity, reflectOpacity, reflectTarget, reflectPulse, barProgress } = useCenterHighlight();
  const showMetaFooter = metaPlacement === "bottom" && showFooter;
  const comfortPad = density === "comfort" ? 4 : 0;
  const padSide = (cardPadding === "16" ? 16 : 12) + comfortPad;
  const padTop = (cardPadding === "16" ? 6 : 8) + comfortPad;
  const { fontSize: btnFontSize } = buttonMetrics(density, buttonSize);
  const btnH = 40;
  const nameFontSize = density === "comfort" ? 16 : 14;
  const nameLineHeight = density === "comfort" ? 24 : 22;
  const crestSize = bodyAvatarSize;
  const crestRadius = 8;
  // Individual sports show no avatar by default; the "Athlete photos" toggle
  // swaps in a real headshot for golf/tennis/racing competitors.
  const athletePhotos = useAthletePhotos();
  const isIndividual = match.sport === "golf" || match.sport === "tennis" || match.sport === "racing";
  const pcts = match.teams.map((t) => parseFloat(t.pct) || 0);
  const soccerDraw = soccerDrawCents(match);
  const drawBase = soccerDraw ?? (match.draw ? parseFloat(match.draw.pct) || 0 : 0);
  const hasDraw = soccerDraw != null || !!match.draw;
  const drawIdx = match.teams.length;
  const drawTint = "#71717a";
  const uxrTeamBtn = useUxrMode() === "uxr";
  const pill = usePillButtons();
  const comboBtnR = pill ? 999 : 12;
  const mode = useOutcomeButtonColorMode();
  const drawBaseVisual = outcomeButtonVisual(buttonStyle, buttonText, drawTint, { pill });
  const oddsInput = hasDraw ? [...pcts, drawBase] : pcts;
  const { vals: liveVals, displayVals } = useLiveOdds(oddsInput, animate, liveBaseDelayMs, staggerMs);
  // Bar widths are normalized to the leading outcome: the highest-probability
  // bar fills the full track and the others scale relative to it, so the chart
  // uses as much horizontal space as possible.
  const rawBarVals = oddsInput.map((p, i) => Math.max(0, Math.min(100, liveVals[i] ?? p)));
  const barMax = Math.max(...rawBarVals, 1);
  const barVals = rawBarVals.map((v) => (v / barMax) * 100);
  const barWidth = (i: number) => barVals[i] ?? 0;
  const scoreAnim = useLiveScores(match, animate);
  // Stacked-row card: the glow lights the HALF of the ring nearest the scoring
  // row — top row (idx 0) glows the top edge, bottom row (idx 1) the bottom.
  const glow = scoreGlow && animate && isLive ? scoreAnim.glow : null;
  const glowColor = glow ? accessibleColor(match.teams[glow.team]?.color ?? colors.mono) : undefined;
  const glowEdge: "top" | "bottom" = glow?.team === 1 ? "bottom" : "top";
  const borderCue = showLiveAccent && animate && isLive && animStyle === "border" && !glow;
  const inactiveBorderCue = showLiveAccent && animate && !isLive && animStyle === "border";
  // When the team rows show a live score chip, the draw row has no score of its
  // own — reserve an empty score-unit-sized slot so its probability bar and %
  // button line up with the team rows above.
  const teamsHaveScores = !inline && isLive && match.teams.some((_, i) => (scoreAnim.values[i] || null) != null);
  // All value/sub strings across the stacked rows, so the ColumnScore cells
  // (golf, racing) reserve one shared width (= the genuinely widest string) and
  // line up regardless of digit/character width.
  const colValueCandidates = scoreAnim.values.map((v) => v || "");
  const colSubCandidates = match.teams.map((t) =>
    match.sport === "golf" ? (t.thru != null ? `THRU ${t.thru}` : "") : match.sport === "racing" ? (t.gap ?? "") : "",
  );

  // Hybrid layout bottom button row: one outcome button per market outcome
  // (teams + draw). Labels ALWAYS use the team acronym so two-outcome and
  // three-outcome (draw) cards read uniformly side-by-side.
  const unit = oddsUnit === "cents" ? "¢" : "%";
  // UXR bet buttons: teams with a real abbr get the "CAR · 53¢" label;
  // abstract outcomes (Yes/No binaries, market rows) keep the plain pct box.
  // UXR sports layout: the inline per-row button moves to the bottom of the
  // card as a versus-style button row (same slot the hybrid layout uses).
  const uxrVersusButtons = uxrTeamBtn && !oldMode && !!match.sport && match.teams.length === 2 && match.teams.every((t) => !!t.abbr);
  const hybrid = hybridButtons || uxrVersusButtons;
  // Parent market label for the bet slip header (e.g. "Spurs vs. Knicks").
  const betMarket = titleText ?? `${match.teams[0].name} vs. ${match.teams[1].name}`;
  const comboMode = useEffectiveCombo(combo);
  const unselectedChrome = useComboPageUnselectedChrome();
  const comboPicks = useComboPicks();
  // Binary Yes/No props share matchKey "y-n"; include the question so each
  // card's legs stay distinct in the combo ticket.
  const comboId = (key: string) => standardComboId(matchKey(match), key, titleText);
  const comboLeg = (key: string, title: string, cents: number, color: string) => {
    const team = match.teams.find((t) => (t.abbr ?? t.name) === key);
    const other = match.teams.find((t) => (t.abbr ?? t.name) !== key);
    return {
      id: comboId(key),
      category: match.league ?? match.sport ?? "Sports",
      label: `${title} · ${betMarket}`,
      color,
      cents: Math.round(cents),
      side: "yes" as const,
      kind: "ml" as const,
      sport: match.sport,
      avatar: comboAvatarFromTeam(team),
      alt:
        key !== "draw" && other
          ? {
              id: comboId(other.abbr ?? other.name),
              label: `${other.name} · ${betMarket}`,
              color: other.color,
              cents: Math.max(8, Math.min(92, 100 - Math.round(cents))),
              avatar: comboAvatarFromTeam(other),
            }
          : undefined,
    };
  };
  const drawVisual = comboMode
    ? comboOutcomeVisual(comboOutcomeOn(comboPicks, comboId("draw")), drawTint, comboBtnR, { unselectedChrome })
    : {
        ...drawBaseVisual,
        container: { ...drawBaseVisual.container, backgroundColor: backgroundMuted(themeMode) },
        // Draw keeps the neutral light-gray fill, so its label must stay dark in
        // both theme modes instead of inheriting the generic colored-button text.
        text: { ...drawBaseVisual.text, color: colors.controlActiveText },
      };
  const hybridItems = match.teams.map((t, i) => {
    const yn = t.name.trim().toLowerCase();
    const c = yn === "yes" ? colors.greenOutline : yn === "no" ? colors.red : t.color;
    return { name: t.name, abbr: t.abbr ?? t.name.slice(0, 3).toUpperCase(), color: c, val: displayVals[i] ?? Math.round(pcts[i] ?? 0) };
  });
  if (hasDraw) {
    const drawItem = { name: "Draw", abbr: "DRAW", color: drawTint, val: displayVals[drawIdx] ?? Math.round(drawBase) };
    // UXR: Draw slots between the two team buttons (home / Draw / away),
    // mirroring the row order; classic keeps it last.
    if (uxrTeamBtn) hybridItems.splice(1, 0, drawItem);
    else hybridItems.push(drawItem);
  }

  // The Draw row, extracted so UXR can slot it BETWEEN the two team rows
  // (home / Draw / away, matching sportsbook convention) while classic keeps
  // it after both teams.
  const drawRow = hasDraw ? (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {display !== "name" && match.sport !== "tennis" && showTeamAvatars && (
        <View style={{ width: 32, height: 32, marginRight: 12, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="contrast" size={24} color={colors.textPrimary} />
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontFamily: uxrTeamBtn && match.sport ? geist.semibold : geist.regular, fontSize: nameFontSize, lineHeight: nameLineHeight, color: colors.textPrimary }} numberOfLines={1}>
          Draw
        </Text>
        {!oldMode && (
          <View style={{ height: 2, borderRadius: 1, marginTop: 6, backgroundColor: barTrack ? colors.surface2 : "transparent", overflow: "hidden" }}>
            <Animated.View
              style={{
                height: 2,
                borderRadius: 1,
                width: barProgress ? barProgress.interpolate({ inputRange: [0, 1], outputRange: ["0%", `${barWidth(drawIdx)}%`] }) : `${barWidth(drawIdx)}%`,
                backgroundColor: uxrTeamBtn ? marketAccentColor(drawTint) : barFill(accessibleColor(drawTint)),
              }}
            />
          </View>
        )}
      </View>
      {oldMode ? (
        <YesNoControls
          pctLabel={`${displayVals[drawIdx] ?? Math.round(drawBase)}%`}
          onYes={() => placeComboOrSlip(comboMode, comboLeg("draw", "Draw", displayVals[drawIdx] ?? Math.round(drawBase), drawTint), { market: betMarket, title: "Draw", oddsCents: displayVals[drawIdx] ?? Math.round(drawBase), color: drawTint, side: "yes" })}
          onNo={() => placeComboOrSlip(comboMode, comboLeg("draw", "Draw", displayVals[drawIdx] ?? Math.round(drawBase), drawTint), { market: betMarket, title: "Draw", oddsCents: displayVals[drawIdx] ?? Math.round(drawBase), color: drawTint, side: "no" })}
        />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 16, gap: 12 }}>
          {teamsHaveScores && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {cueByScore && <Possession mode={possession} color={drawTint} sport={match.sport} invisible />}
              <View style={{ width: 32, height: 32 }} />
            </View>
          )}
          {!isLive && drawBase > 0 && (
            <Text style={{ fontFamily: geist.medium, fontSize: 14, color: colors.textMuted }}>{`${(100 / drawBase).toFixed(2)}x`}</Text>
          )}
          {!hybrid && (comboMode ? (
            <ComboSelectedButton
              selected={comboOutcomeOn(comboPicks, comboId("draw"))}
              onPress={() => placeComboOrSlip(comboMode, comboLeg("draw", "Draw", displayVals[drawIdx] ?? Math.round(drawBase), drawTint), { market: betMarket, title: "Draw", oddsCents: displayVals[drawIdx] ?? Math.round(drawBase), color: drawTint })}
              label={`${displayVals[drawIdx] ?? Math.round(drawBase)}%`}
              slotValue={liveVals[drawIdx] ?? drawBase}
              slotSuffix="%"
              radius={comboBtnR}
              height={btnH}
              width={64}
              fontSize={btnFontSize}
              fontFamily={geist.medium}
              lineHeight={24}
              unselectedColor={drawTint}
              unselectedChrome={unselectedChrome}
            />
          ) : (
            <Pressable
              onPress={() => placeComboOrSlip(comboMode, comboLeg("draw", "Draw", displayVals[drawIdx] ?? Math.round(drawBase), drawTint), { market: betMarket, title: "Draw", oddsCents: displayVals[drawIdx] ?? Math.round(drawBase), color: drawTint })}
              style={({ pressed }) => [
                { width: 64, height: btnH, alignItems: "center", justifyContent: "center", overflow: "hidden" },
                drawVisual.container,
                { borderRadius: comboBtnR },
                buttonInteractionStyle(pressed),
              ]}
            >
              <HighlightFace opacity={bgOpacity} />
              {animate && buttonAnim === "slot" ? (
                <SlotNumber value={Math.round(liveVals[drawIdx] ?? drawBase)} color={drawVisual.text.color as string} fontSize={btnFontSize} />
              ) : (
                <Text style={[{ fontFamily: geist.medium, fontSize: btnFontSize, lineHeight: 24 }, drawVisual.text]}>{`${displayVals[drawIdx] ?? Math.round(drawBase)}%`}</Text>
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  ) : null;

  return (
    <View
      ref={rootRef}
      onLayout={onLayout}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: listMode ? 0 : 12,
        paddingHorizontal: listMode ? 0 : padSide,
        paddingBottom: showFooter ? (showMetaFooter ? (listMode ? 16 : padSide) : 16) : 20,
        paddingTop: padTop,
        backgroundColor: cardBg,
        // UXR spec: 16px between the title block, team rows, and buy buttons.
        gap: uxrTeamBtn ? 16 : 12,
      }}
    >
      <LightReflect progress={reflectOpacity} target={reflectTarget} pulse={reflectPulse} />
      {borderCue && !listMode && !oldMode && <LiveBorder placement={standardAccent === "center" ? "center" : "left"} live centerWide={standardAccent === "center" && centerAccentWidth === "full"} glowAnchor="left" />}
      {inactiveBorderCue && !listMode && !oldMode && <LiveBorder placement="center" color="#fff" centerWide={standardAccent === "center" && centerAccentWidth === "full"} />}
      {glow &&
        glowColor &&
        (scoreGlowMode === "inPlace" ? (
          <ScoreGlowInPlace key={glow.key} color={glowColor} placement="left" radius={listMode ? 0 : 12} />
        ) : (
          <ScoreGlowBorder key={glow.key} color={glowColor} edge={glowEdge} radius={listMode ? 0 : 12} />
        ))}

      <View style={(oldMode || isQuestionCard) && title === "show" ? { flexDirection: "row", alignItems: "center", gap: 12 } : undefined}>
        {(oldMode || isQuestionCard) && title === "show" && (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              backgroundColor: colors.surface2,
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {titleAvatar ? (
              <Image source={titleAvatar} style={{ width: 40, height: 40 }} resizeMode="cover" />
            ) : match.sport && outlinedSportId(match.sport) ? (
              <SportIcon sport={match.sport} size={22} />
            ) : isQuestionCard ? (
              <Image
                source={require("@/assets/figmaAssets/icon-3d-sports.png")}
                style={{ width: 40, height: 40 }}
                resizeMode="cover"
              />
            ) : (
              <Crest team={match.teams[0]} size={40} radius={8} variant="avatar" preferFlag={isWorldCup} />
            )}
          </View>
        )}
        <View style={(oldMode || isQuestionCard) && title === "show" ? { flex: 1, minWidth: 0 } : undefined}>
          <MetaHeader match={match} live={live} animate={animate} animStyle={animStyle} glow={glow} hideDate={oldMode || isQuestionCard} hideUpcomingDate={footerDetail.endDate} livePrefix={liveFormat === "stacked"} />
          {title === "show" && !(uxrTeamBtn && match.sport) && (
            <Text
              {...oswald}
              style={{
                fontFamily: displayFont,
                fontSize: 16,
                lineHeight: 24,
                color: colors.textPrimary,
                // Classic: the 14/22 timestamp contributes 4px half-leading below
                // and the 16/24 title 4px above, so an 8px gap falls out
                // naturally; pull the title up 4px to land on a 4px gap.
                // UXR: the timestamp is 12/16 with its half-leading cancelled, so
                // keep the title's natural 4px half-leading + 4px for an 8px gap.
                marginTop: uxrTeamBtn ? 4 : -4,
              }}
              numberOfLines={1}
            >
              {titleText ?? `${match.teams[0].name} vs. ${match.teams[1].name}`}
            </Text>
          )}
        </View>
      </View>

      <View style={{ gap: 12 }}>
        {match.teams.map((t, i) => {
          const pct = pcts[i] ?? 0;
          const scoreDisplay = scoreAnim.values[i] || null;
          const sets = scoreAnim.sets[i] ?? [];
          const scoreFlash = scoreAnim.flash[i] ?? false;
          const mono = buttonStyle === "outline";
          // Literal "Yes" / "No" outcomes always use success-green / error-red.
          const yn = t.name.trim().toLowerCase();
          const effColor = yn === "yes" ? colors.greenOutline : yn === "no" ? colors.red : t.color;
          const tint = mono ? colors.mono : effColor;
          const visual = comboMode
            ? comboOutcomeVisual(comboOutcomeOn(comboPicks, comboId(t.abbr ?? t.name)), effColor, comboBtnR, { unselectedChrome })
            : outcomeButtonVisual(buttonStyle, buttonText, effColor, { mode, label: t.name, pill });
          const barW = barWidth(i);
          return (
            <Fragment key={i}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {display !== "name" &&
                (isIndividual ? (
                  showTeamAvatars && (
                    athletePhotos && t.photo ? (
                      <View style={{ marginRight: 12 }}>
                        <PhotoAvatar source={t.photo} aspect={t.photoAspect ?? 1.33} size={crestSize} radius={crestRadius} />
                      </View>
                    ) : t.flag ? (
                      <View style={{ marginRight: 12 }}>
                        <Crest team={t} size={crestSize} radius={crestRadius} variant={crestVariant} preferFlag />
                      </View>
                    ) : null
                  )
                ) : showTeamAvatars ? (
                  <View style={{ marginRight: 12 }}>
                    <Crest
                      team={t}
                      size={crestSize}
                      radius={crestRadius}
                      variant={crestVariant}
                      preferFlag={isWorldCup}
                      flip={match.sport === "baseball" && i === 0}
                    />
                  </View>
                ) : null)}
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontFamily: uxrTeamBtn && match.sport ? geist.semibold : geist.regular, fontSize: nameFontSize, lineHeight: nameLineHeight, color: colors.textPrimary, flexShrink: 1 }} numberOfLines={1}>
                    {t.name}
                  </Text>
                  {!inline && asideCue === "name" && isLive && t.hasBall && (
                    <Possession mode={possession} color={tint} sport={match.sport} />
                  )}
                  {inline && isLive && scoreDisplay != null && (
                    <View style={{ marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 8 }}>
                      {t.hasBall && <Possession mode={possession} color={tint} sport={match.sport} />}
                      <ScoreUnit value={scoreDisplay} sets={sets} activeSetIdx={scoreAnim.activeSetIdx} flash={scoreFlash} flashColor={accessibleColor(tint)} />
                    </View>
                  )}
                </View>
                {!oldMode && (
                  <View style={{ height: 2, borderRadius: 1, marginTop: 6, backgroundColor: barTrack ? colors.surface2 : "transparent", overflow: "hidden" }}>
                    <Animated.View
                      style={{
                        height: 2,
                        borderRadius: 1,
                        width: barProgress ? barProgress.interpolate({ inputRange: [0, 1], outputRange: ["0%", `${barW}%`] }) : `${barW}%`,
                        backgroundColor: uxrTeamBtn ? marketAccentColor(tint) : barFill(accessibleColor(tint)),
                      }}
                    />
                  </View>
                )}
              </View>
              {oldMode ? (
                <YesNoControls
                  pctLabel={`${displayVals[i] ?? Math.round(pct)}%`}
                  onYes={() => placeComboOrSlip(comboMode, comboLeg(t.abbr ?? t.name, t.name, displayVals[i] ?? Math.round(pct), effColor), { market: betMarket, title: t.name, oddsCents: displayVals[i] ?? Math.round(pct), color: effColor, side: "yes" })}
                  onNo={() => placeComboOrSlip(comboMode, comboLeg(t.abbr ?? t.name, t.name, displayVals[i] ?? Math.round(pct), effColor), { market: betMarket, title: t.name, oddsCents: displayVals[i] ?? Math.round(pct), color: effColor, side: "no" })}
                />
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 16, gap: 12 }}>
                  {!inline && isLive && scoreDisplay != null && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      {cueByScore && <Possession mode={possession} color={tint} sport={match.sport} invisible={!t.hasBall} />}
                      {match.sport === "golf" ? (
                        <ColumnScore value={scoreDisplay} sub={t.thru != null ? `THRU ${t.thru}` : undefined} valueCandidates={colValueCandidates} subCandidates={colSubCandidates} />
                      ) : match.sport === "racing" ? (
                        <ColumnScore value={scoreDisplay} sub={t.gap} valueCandidates={colValueCandidates} subCandidates={colSubCandidates} emphasizeSub />
                      ) : (
                        <ScoreUnit value={scoreDisplay} sets={sets} activeSetIdx={scoreAnim.activeSetIdx} flash={scoreFlash} flashColor={accessibleColor(tint)} />
                      )}
                    </View>
                  )}
                  {!isLive && pct > 0 && (
                    <Text style={{ fontFamily: geist.medium, fontSize: 14, color: colors.textMuted }}>{`${(100 / pct).toFixed(2)}x`}</Text>
                  )}
                  {!hybrid && (comboMode ? (
                    <ComboSelectedButton
                      selected={comboOutcomeOn(comboPicks, comboId(t.abbr ?? t.name))}
                      onPress={() => placeComboOrSlip(comboMode, comboLeg(t.abbr ?? t.name, t.name, displayVals[i] ?? Math.round(pct), effColor), { market: betMarket, title: t.name, oddsCents: displayVals[i] ?? Math.round(pct), color: effColor })}
                      label={
                        uxrTeamBtn && t.abbr
                          ? `${t.abbr} · ${displayVals[i] ?? Math.round(pct)}¢`
                          : `${displayVals[i] ?? Math.round(pct)}%`
                      }
                      slotPrefix={uxrTeamBtn && t.abbr ? `${t.abbr} · ` : undefined}
                      slotSuffix={uxrTeamBtn && t.abbr ? "¢" : "%"}
                      slotValue={liveVals[i] ?? pct}
                      radius={comboBtnR}
                      height={btnH}
                      width={uxrTeamBtn && t.abbr ? undefined : 64}
                      minWidth={64}
                      paddingHorizontal={uxrTeamBtn && t.abbr ? 14 : 10}
                      fontSize={btnFontSize}
                      fontFamily={geist.medium}
                      lineHeight={24}
                      unselectedColor={effColor}
                      unselectedChrome={unselectedChrome}
                      labelForInk={t.name}
                    />
                  ) : (
                    <Pressable
                      onPress={() => placeComboOrSlip(comboMode, comboLeg(t.abbr ?? t.name, t.name, displayVals[i] ?? Math.round(pct), effColor), { market: betMarket, title: t.name, oddsCents: displayVals[i] ?? Math.round(pct), color: effColor })}
                      style={({ pressed }) => [
                        // UXR team buttons carry the "CAR · 53¢" label, so they
                        // size to content instead of the fixed 64px pct box.
                        uxrTeamBtn && t.abbr
                          ? { minWidth: 64, paddingHorizontal: 14, height: btnH, alignItems: "center", justifyContent: "center", overflow: "hidden" }
                          : { width: 64, height: btnH, alignItems: "center", justifyContent: "center", overflow: "hidden" },
                        visual.container,
                        { borderRadius: comboBtnR },
                        buttonInteractionStyle(pressed),
                      ]}
                    >
                      <HighlightFace opacity={bgOpacity} />
                      {animate && buttonAnim === "slot" ? (
                        <SlotNumber
                          prefix={uxrTeamBtn && t.abbr ? `${t.abbr} · ` : undefined}
                          suffix={uxrTeamBtn && t.abbr ? "¢" : undefined}
                          value={Math.round(liveVals[i] ?? pct)}
                          color={visual.text.color as string}
                          fontSize={btnFontSize}
                        />
                      ) : (
                        <Text style={[{ fontFamily: geist.medium, fontSize: btnFontSize, lineHeight: 24 }, visual.text]}>
                          {uxrTeamBtn && t.abbr
                            ? `${t.abbr} · ${displayVals[i] ?? Math.round(pct)}¢`
                            : `${displayVals[i] ?? Math.round(pct)}%`}
                        </Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
            {/* UXR: Draw slots between the two team rows (home / Draw / away). */}
            {/* Draw row renders LAST (after both teams) per the UXR mock. */}
            {i === match.teams.length - 1 && uxrTeamBtn ? drawRow : null}
            </Fragment>
          );
        })}
        {!uxrTeamBtn && drawRow}
      </View>

      {hybrid && (
        // UXR: 20px between the score unit and the buy buttons (container gap
        // 16 + 4) per the mock; other sections keep the 16px rhythm.
        <View style={{ flexDirection: "row", width: "100%", gap: 8, marginTop: uxrTeamBtn ? 4 : 0 }}>
          {hybridItems.map((o, i) => {
            const pickId = comboId(o.abbr === "DRAW" ? "draw" : o.abbr);
            const visual = o.abbr === "DRAW" ? drawVisual : outcomeButtonVisual(buttonStyle, buttonText, o.color, { mode, label: o.abbr, pill });
            const hybridLabel =
              o.abbr === "DRAW"
                ? `${o.val}${uxrTeamBtn ? "¢" : unit}`
                : uxrTeamBtn
                  ? `${o.abbr} · ${o.val}¢`
                  : `${o.abbr} ${o.val}${unit}`;
            if (comboMode) {
              return (
                <ComboSelectedButton
                  key={i}
                  selected={comboOutcomeOn(comboPicks, pickId)}
                  onPress={() => placeComboOrSlip(comboMode, comboLeg(o.abbr === "DRAW" ? "draw" : o.abbr, o.name, o.val, o.color), { market: betMarket, title: o.name, oddsCents: o.val, color: o.color })}
                  label={hybridLabel}
                  slotPrefix={
                    o.abbr === "DRAW" ? undefined : uxrTeamBtn && o.abbr ? `${o.abbr} · ` : `${o.abbr} `
                  }
                  slotSuffix={uxrTeamBtn ? "¢" : unit}
                  slotValue={o.val}
                  radius={comboBtnR}
                  height={48}
                  flex={1}
                  fontSize={btnFontSize}
                  fontFamily={geist.medium}
                  lineHeight={24}
                  unselectedColor={o.color}
                  unselectedChrome={unselectedChrome}
                  labelForInk={o.name}
                />
              );
            }
            return (
              <Pressable
                key={i}
                onPress={() => placeComboOrSlip(comboMode, comboLeg(o.abbr === "DRAW" ? "draw" : o.abbr, o.name, o.val, o.color), { market: betMarket, title: o.name, oddsCents: o.val, color: o.color })}
                style={({ pressed }) => [
                  { flex: 1, minWidth: 0, height: 48, alignItems: "center", justifyContent: "center", overflow: "hidden" },
                  visual.container,
                  { borderRadius: comboBtnR },
                  buttonInteractionStyle(pressed),
                ]}
              >
                <HighlightFace opacity={bgOpacity} />
                {o.abbr === "DRAW" ? (
                  // Tie button: half-filled circle icon instead of the "DRAW" label.
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="contrast" size={18} color={visual.text.color as string} />
                    {animate && buttonAnim === "slot" ? (
                      <SlotNumber value={o.val} suffix={uxrTeamBtn ? "¢" : unit} color={visual.text.color as string} fontSize={btnFontSize} />
                    ) : (
                      <Text style={[{ fontFamily: geist.medium, fontSize: btnFontSize, lineHeight: 24 }, visual.text]} numberOfLines={1}>
                        {`${o.val}${uxrTeamBtn ? "¢" : unit}`}
                      </Text>
                    )}
                  </View>
                ) : animate && buttonAnim === "slot" ? (
                  <SlotNumber
                    value={o.val}
                    prefix={uxrTeamBtn ? `${o.abbr} · ` : `${o.abbr} `}
                    suffix={uxrTeamBtn ? "¢" : unit}
                    color={visual.text.color as string}
                    fontSize={btnFontSize}
                  />
                ) : (
                  <Text style={[{ fontFamily: geist.medium, fontSize: btnFontSize, lineHeight: 24 }, visual.text]} numberOfLines={1}>
                    {uxrTeamBtn ? `${o.abbr} · ${o.val}¢` : `${o.abbr} ${o.val}${unit}`}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      )}

      <CardBuildComboButton showBuildCombo={showBuildCombo} radius={comboBtnR} />

      {showMetaFooter && <MetaFooter match={match} metaStyle={metaStyle} hideDate={oldMode || isQuestionCard} hideTag={oldMode} />}
    </View>
  );
}
