import { Animated, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { accessibleColor, backgroundMuted, barFill, bgForWhiteText, colors, marketAccentColor } from "@/lib/sim/colors";
import { placeComboOrSlip } from "@/lib/sim/comboBet";
import { useComboPageUnselectedChrome, useEffectiveCombo } from "@/lib/sim/comboFlowStore";
import { matchKey } from "@/lib/sim/marketRoutes";
import { ComboSelectedButton } from "@/components/sim/ComboGradient";
import { buttonInteractionStyle, buttonMetrics, outcomeButtonVisual, type ButtonVisual } from "@/lib/sim/buttonStyle";
import { comboOutcomeOn } from "@/lib/sim/comboPickEdit";
import { useComboPicks } from "@/lib/sim/comboPicksStore";
import { comboAvatarFromTeam } from "@/lib/sim/comboTeamMark";
import { useUxrMode } from "@/lib/sim/uxrModeStore";
import { useThemeMode } from "@/lib/sim/dsModeStore";
import { usePillButtons } from "@/lib/sim/pillButtonsStore";
import { useOutcomeButtonColorMode } from "@/lib/sim/outcomeButtonColorStore";
import { useCenterHighlight } from "@/lib/sim/useCenterHighlight";
import { useFeedSettings } from "@/lib/sim/FeedSettingsContext";
import { useTeamAbbrUnderLogos } from "@/lib/sim/teamAbbrUnderLogosStore";
import { soccerShowsDraw } from "@/lib/sim/soccerMoneyline";
import { CardBuildComboButton } from "@/components/sim/BuildComboButton";
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
  Team,
  VersusLayout,
  VersusSidesLive,
  VersusTitle,
} from "@/lib/sim/types";
import { Crest } from "./Crest";
import type { ComboPick } from "./ComboSheet";
import { HighlightFace } from "./HighlightFace";

function versusAbbr(t: Team): string {
  return t.abbr ?? t.name.slice(0, 3).toUpperCase();
}

function versusComboPick(
  match: Match,
  team: Team,
  other: Team,
  color: string,
  cents: number,
  otherColor: string,
  otherCents: number,
): ComboPick {
  const vs = `${match.teams[0].name} vs. ${match.teams[1].name}`;
  return {
    id: `ml:${matchKey(match)}:${versusAbbr(team)}`,
    category: match.league ?? match.sport ?? "Sports",
    label: `${team.name} · ${vs}`,
    color,
    cents,
    side: "yes",
    kind: "ml",
    sport: match.sport,
    avatar: comboAvatarFromTeam(team),
    alt: {
      id: `ml:${matchKey(match)}:${versusAbbr(other)}`,
      label: `${other.name} · ${vs}`,
      color: otherColor,
      cents: otherCents,
      avatar: comboAvatarFromTeam(other),
    },
  };
}
import { LightReflect } from "./LightReflect";
import { LiveBorder } from "./LiveBorder";
import { LiveStatusLine } from "./LiveStatusLine";
import { ScoreGlowBorder } from "./ScoreGlowBorder";
import { ScoreGlowInPlace } from "./ScoreGlowInPlace";
import { MetaFooter, MetaHeader, MetaTag, MetaTopRight } from "./MetaHeader";
import { Possession } from "./Possession";
import { SlotNumber } from "./SlotNumber";
import { geist } from "@/lib/sim/geistFonts";
import { useDisplayFont, useOswaldDataSet } from "@/lib/sim/typefaceStore";

const DRAW_COLOR = "#71717a";

function scoreOf(t: Team): string {
  if (t.score != null) return String(t.score);
  return t.scoreText ?? "";
}

// Live status shown center of the "sides" layout: pulsing dot + ticking clock
// (or the "<team> scored" callout when a team scores).
function StatusInline({
  match,
  isLive,
  animate = false,
  animStyle = "pulse",
  glow = null,
  hideDate = false,
  align = "center",
  stacked = false,
}: {
  match: Match;
  isLive: boolean;
  animate?: boolean;
  animStyle?: AnimStyle;
  glow?: { team: number; key: number } | null;
  hideDate?: boolean;
  align?: "center" | "left";
  stacked?: boolean;
}) {
  // UXR: the center status line (live clock / date) drops to 12pt.
  const statusFont = useUxrMode() === "uxr" ? 12 : 14;
  if (isLive) {
    return (
      <LiveStatusLine match={match} animate={animate} fontSize={statusFont} align={align} glow={glow} stacked={stacked} />
    );
  }
  // The non-live date is relocated to the footer when the "End date" footer
  // toggle is on, so suppress the inline copy here to avoid showing it twice.
  if (hideDate) return null;
  // Upcoming games: uppercase date, with the start time on a second row.
  return (
    <View>
      <Text style={{ fontFamily: geist.medium, fontSize: statusFont, lineHeight: 18, color: colors.textMuted, textAlign: align, textTransform: "uppercase" }} numberOfLines={1}>
        {match.date}
      </Text>
      {match.time ? (
        <Text style={{ fontFamily: geist.medium, fontSize: statusFont, lineHeight: 18, color: colors.textMuted, textAlign: align, textTransform: "uppercase" }} numberOfLines={1}>
          {match.time}
        </Text>
      ) : null}
    </View>
  );
}

// The separator shown between the two scores in Version B (sides layout),
// replacing the centered live status. Rendered as an actual Geist 32px "-" glyph
// (#fff) to match the big scores it sits between. Shares the scores' 40px line
// box so the row's alignItems:"center" lines it up vertically with the scores.
function ScoreColon() {
  const displayFont = useDisplayFont();
  const oswald = useOswaldDataSet();
  return (
    <Text {...oswald} style={{ fontFamily: displayFont, fontSize: 32, lineHeight: 40, color: colors.textPrimary }}>-</Text>
  );
}

function OutcomeBtn({
  value,
  staticLabel,
  prefix,
  suffix,
  reel,
  color,
  buttonText,
  buttonStyle,
  btnH,
  btnFontSize,
  bgOpacity,
  oldMode,
  pickTitle,
  market,
  drawIcon,
  comboPick,
  combo,
}: {
  value: number;
  staticLabel: string;
  prefix?: string;
  suffix?: string;
  reel: boolean;
  color: string;
  buttonText: ButtonText;
  buttonStyle: ButtonStyle;
  btnH: number;
  btnFontSize: number;
  bgOpacity?: Animated.AnimatedInterpolation<number> | null;
  oldMode: boolean;
  pickTitle: string;
  market: string;
  // Tie/draw button: half-filled circle icon in place of the "DRAW" label.
  drawIcon?: boolean;
  comboPick: ComboPick;
  combo?: boolean;
}) {
  // Subscribe to the UXR mode so already-mounted cards re-render (and re-run
  // outcomeButtonVisual's non-reactive getUxrMode() read) when the Mode toggle
  // flips — classic must be restored without a remount.
  useUxrMode();
  const themeMode = useThemeMode();
  const pill = usePillButtons();
  const mode = useOutcomeButtonColorMode();
  const comboMode = useEffectiveCombo(combo);
  const unselectedChrome = useComboPageUnselectedChrome();
  const comboOn = comboOutcomeOn(useComboPicks(), comboPick.id);
  const radius = pill ? 999 : 12;
  if (comboMode) {
    return (
      <ComboSelectedButton
        selected={comboOn}
        onPress={() =>
          placeComboOrSlip(comboMode, comboPick, { market, title: pickTitle, oddsCents: Math.round(value), color })
        }
        label={staticLabel}
        slotPrefix={prefix ? `${prefix} ` : undefined}
        slotSuffix={suffix}
        slotValue={value}
        radius={radius}
        height={btnH}
        flex={1}
        fontSize={btnFontSize}
        fontFamily={geist.medium}
        lineHeight={24}
        unselectedColor={color}
        unselectedChrome={unselectedChrome}
        labelForInk={pickTitle}
      />
    );
  }
  // Old mode (versus): solid colored pill — the (white-text-safe) team color is
  // the BACKGROUND and the label is white, instead of the soft tinted style.
  const visual: ButtonVisual = drawIcon
      ? // Draw/tie uses the theme's muted background, regardless of mode/style.
        { container: { backgroundColor: backgroundMuted(themeMode), borderRadius: radius }, text: { color: colors.controlActiveText } }
      : oldMode
        ? { container: { backgroundColor: bgForWhiteText(color) }, text: { color: "#fff" } }
        : outcomeButtonVisual(buttonStyle, buttonText, color, { mode, label: pickTitle, pill });
  return (
    <Pressable
      onPress={() =>
        placeComboOrSlip(comboMode, comboPick, { market, title: pickTitle, oddsCents: Math.round(value), color })
      }
      style={({ pressed }) => [
        { flex: 1, minWidth: 0, height: btnH, alignItems: "center", justifyContent: "center", overflow: "hidden" },
        visual.container,
        { borderRadius: radius },
        buttonInteractionStyle(pressed),
      ]}
    >
      <HighlightFace opacity={bgOpacity ?? null} />
      {drawIcon ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="contrast" size={18} color={visual.text.color as string} />
          {reel ? (
            <SlotNumber suffix={suffix} value={Math.round(value)} color={visual.text.color as string} fontSize={btnFontSize} />
          ) : (
            <Text style={[{ fontFamily: geist.medium, fontSize: btnFontSize, lineHeight: 24 }, visual.text]} numberOfLines={1}>
              {`${Math.round(value)}${suffix ?? ""}`}
            </Text>
          )}
        </View>
      ) : reel ? (
        <SlotNumber prefix={prefix ? `${prefix} ` : undefined} suffix={suffix} value={Math.round(value)} color={visual.text.color as string} fontSize={btnFontSize} />
      ) : (
        <Text style={[{ fontFamily: geist.medium, fontSize: btnFontSize, lineHeight: 24 }, visual.text]} numberOfLines={1}>
          {staticLabel}
        </Text>
      )}
    </Pressable>
  );
}

// Versus card. Version A: layout "sides", display "avatar", title "show",
// sidesLive "center", possession "icon", meta at bottom, slot buttons.
export function VersusCard({
  match,
  live,
  display,
  layout,
  buttonText,
  buttonStyle = "default",
  buttonSize = "lg",
  buttonAnim = "ticker",
  metaStyle,
  metaPlacement = "top",
  cardPadding,
  title,
  sidesLive = "center",
  possession,
  animate = false,
  animStyle = "pulse",
  liveBaseDelayMs = 0,
  staggerMs,
  hideMetaFooter = false,
  cardRadius = 12,
  fillHeight = false,
  combo,
  showBuildCombo = false,
}: {
  match: Match;
  live: boolean;
  display: Display;
  layout: VersusLayout;
  buttonText: ButtonText;
  buttonStyle?: ButtonStyle;
  buttonSize?: ButtonSize;
  buttonAnim?: ButtonAnim;
  metaStyle: MetaStyle;
  metaPlacement?: MetaPlacement;
  cardPadding: CardPadding;
  title: VersusTitle;
  sidesLive?: VersusSidesLive;
  possession: PossessionMode;
  animate?: boolean;
  animStyle?: AnimStyle;
  liveBaseDelayMs?: number;
  staggerMs?: number;
  hideMetaFooter?: boolean;
  cardRadius?: number;
  // Fill a fixed-height host (live carousel rail): the card stretches to 100%
  // height, the score unit centers in the extra space, and the outcome buttons
  // stay pinned to the same bottom position as the neighboring cards.
  fillHeight?: boolean;
  combo?: boolean;
  /** Home/feed cards omit this; match detail uses BuildComboButton directly. */
  showBuildCombo?: boolean;
}) {
  const displayFont = useDisplayFont();
  const oswald = useOswaldDataSet();
  const { density, showFooter, footerDetail, scoreGlow, scoreGlowMode, cardStyle, versusMode, versusAccent, versusHeaderAlign, versusVersion, centerAccentWidth, oddsUnit, showLiveAccent = true, versusScoreSize = 32, liveFormat = "inline", hideVersusAccent = false, versusCenterLive = "centered", footerPosition = "bottom" } = useFeedSettings();
  const showLogoAbbr = useTeamAbbrUnderLogos();
  const crestVariant = "logo";
  const oldMode = versusMode === "old";
  const listMode = cardStyle === "list";
  const cardBg = cardStyle === "card" ? colors.surfaceTransparent : "transparent";
  const { rootRef, onLayout, bgOpacity, reflectOpacity, reflectTarget, reflectPulse, barProgress } = useCenterHighlight();
  const comfortPad = density === "comfort" ? 4 : 0;
  const padSide = (cardPadding === "16" ? 16 : 12) + comfortPad;
  // Centered VersusCard "Live left" variant: timestamp + title left-align, the
  // live border accent moves to the LEFT, and the probability bar relocates to
  // sit horizontally between the two scores. This is a self-contained layout:
  // selecting it forces the centered composition (overriding the sides/center
  // "Versus score" setting via `sides` below), so a single toggle yields the
  // bar-between-scores look regardless of the base layout.
  const centerLeft = versusCenterLive === "left";
  // Version B (sides layout only): timestamp + title move to a left-aligned
  // header at the top, a colon sits between the scores instead of the live
  // status, and the scores grow to 32/40 with a 16px gap to the avatar.
  const versionB = layout === "sides" && !centerLeft && versusVersion === "b";
  // Left-align the timestamp + title (instead of centering). Driven by the
  // "VS card header" control (versusVersion: a=center, b=left) in BOTH score
  // layouts — so the center-score layout inherits the same header alignment as
  // sides. The separate "Versus header" toggle (versusHeaderAlign) and the
  // "Live left" centered variant (centerLeft) also left-align the center layout.
  const leftAlignHeader = versusVersion === "b" || centerLeft || (layout === "center" && versusHeaderAlign === "left");
  // Center layout: give the live label / meta header up top 12px of breathing
  // room from the card edge. Sides layout uses a centered badge, so it keeps
  // padSide — EXCEPT Version B, whose live indicator is anchored at the
  // top-left, where it gets the same tight 12px of top padding.
  const liveIndicatorTopLeft = versionB && live && !!match.live;
  const padTop = layout === "sides" && !centerLeft ? (liveIndicatorTopLeft ? 12 + comfortPad : padSide) : 12 + comfortPad;
  // "Footer position" = top-right: relocate the footer metadata to compact chips
  // inline with the LIVE indicator at the top. Applies to the centered
  // compositions (center score layout + the "Live left" variant, where the
  // header status row lives); the sides layout keeps the bottom footer.
  const metaTop = footerPosition === "topRight" && showFooter && !oldMode && (layout === "center" || centerLeft);
  const showMetaFooter = !hideMetaFooter && metaPlacement === "bottom" && showFooter && !metaTop;
  // UXR spec: 16px between the score unit (rows/prob bar) and the buy buttons.
  const uxrCard = useUxrMode() === "uxr";
  const [home, away] = match.teams;
  const rawHome = parseFloat(home.pct) || 0;
  const rawAway = parseFloat(away.pct) || 0;
  // Sports that can't tie (basketball, American football, hockey) show only a
  // two-outcome (home / away) market — no Tie button, bar segment, or
  // synthesized draw. Soccer/tennis keep the draw (explicit or synthesized).
  const NO_DRAW_SPORTS = ["basketball", "americanFootball", "hockey"];
  const showDraw = match.sport === "soccer" ? soccerShowsDraw(match) : !NO_DRAW_SPORTS.includes(match.sport ?? "");
  // Every versus card shows three outcomes (home / draw / away). When the match
  // has no explicit draw market, synthesize a plausible draw share and rescale
  // the two sides so the three still add up to ~100.
  let baseHome: number;
  let baseAway: number;
  let baseDraw: number;
  if (!showDraw) {
    baseHome = rawHome;
    baseAway = rawAway;
    baseDraw = 0;
  } else if (match.draw) {
    baseHome = rawHome;
    baseAway = rawAway;
    baseDraw = parseFloat(match.draw.pct) || 0;
  } else {
    baseDraw = Math.round(Math.min(rawHome, rawAway) * 0.4);
    baseHome = Math.round((rawHome * (100 - baseDraw)) / 100);
    baseAway = Math.max(0, 100 - baseDraw - baseHome);
  }
  const basePcts = [baseHome, baseDraw, baseAway];
  const { vals: liveVals, displayVals } = useLiveOdds(basePcts, animate, liveBaseDelayMs, staggerMs);
  const scoreAnim = useLiveScores(match, animate);
  const homePct = liveVals[0] ?? baseHome;
  // When there is no draw outcome (basketball / American football / hockey), force the draw share to 0.
  // useLiveOdds' nudgeVals floors every slot at 1 and redistributes deltas across
  // all three, so the unrendered draw slot drifts above 0 over time and inflates
  // `total` — which shrinks home+away and opens a growing gap between the two bars.
  const drawPct = showDraw ? (liveVals[1] ?? baseDraw) : 0;
  const awayPct = liveVals[2] ?? baseAway;
  // Old mode shows static acronym + cents labels, so the slot-reel animation is
  // forced off there (a reel can only animate the numeric value, not the text).
  const reel = animate && buttonAnim !== "ticker" && !oldMode;

  const homeVal = displayVals[0] ?? Math.round(baseHome);
  const drawVal = displayVals[1] ?? Math.round(baseDraw);
  const awayVal = displayVals[2] ?? Math.round(baseAway);
  const abbrOf = (t: Team) => t.abbr ?? t.name.slice(0, 3).toUpperCase();
  // Outcome buttons prefix the team acronym to the odds (e.g. "ENG 38¢" /
  // "ENG 38%"). The unit (cents vs percent) is driven by the oddsUnit setting,
  // independent of card version; draw uses the literal "DRAW".
  const unit = oddsUnit === "cents" ? "¢" : "%";
  const homeLabel = `${abbrOf(home)} ${homeVal}${unit}`;
  const drawLabel = `DRAW ${drawVal}${unit}`;
  const awayLabel = `${abbrOf(away)} ${awayVal}${unit}`;

  const total = homePct + awayPct + drawPct || 1;
  const isLive = live && !!match.live;
  const comboMode = useEffectiveCombo(combo);
  const pillButtons = usePillButtons();
  const homeScore = scoreAnim.values[0] || scoreOf(home);
  const awayScore = scoreAnim.values[1] || scoreOf(away);
  const homeFlash = scoreAnim.flash[0] ?? false;
  const awayFlash = scoreAnim.flash[1] ?? false;
  const showScore = isLive && (homeScore !== "" || awayScore !== "");
  const sides = layout === "sides" && !centerLeft;
  // The center-only "hide accent + bloom" toggle folds into the same effective
  // flag the global showLiveAccent uses: when hiding the centered accent, treat
  // the accent as off (suppresses the ring + bloom and restores the hairline).
  const accentOn = showLiveAccent && !(hideVersusAccent && !sides);
  const { fontSize: btnFontSize } = buttonMetrics(density, buttonSize);
  const btnH = 48;
  const mono = buttonStyle === "outline";
  const tintHome = mono ? colors.mono : home.color;
  const tintAway = mono ? colors.mono : away.color;
  const tintDraw = mono ? colors.mono : DRAW_COLOR;

  const isWorldCup = /world cup/i.test(match.league);
  const crestSize = 32;
  const crestRadius = 8;
  const crest = (team: Team, variant: "logo" | "avatar", flip = false) => (
      <Crest team={team} size={crestSize} radius={crestRadius} variant={variant} preferFlag={isWorldCup} flip={flip} />
    );
  const teamName = (team: Team, align: "left" | "right") => (
    <Text
      style={{ fontFamily: geist.regular, fontSize: 15, color: colors.textPrimary, flexShrink: 1, textAlign: align === "right" ? "right" : "left" }}
      numberOfLines={1}
    >
      {team.name}
    </Text>
  );
  // Sides layout stacks the team name (12px) below each avatar; the row's
  // center alignment keeps the scores vertically centered against the stack.
  const sideEl = (team: Team, align: "left" | "right") =>
    display === "name" ? (
      teamName(team, align)
    ) : sides ? (
      <View style={{ alignItems: "center", flexShrink: 1, minWidth: 0 }}>
        {crest(team, crestVariant, align === "right")}
        {showLogoAbbr ? (
          <Text
            numberOfLines={1}
            style={{ marginTop: 6, fontFamily: geist.medium, fontSize: 12, lineHeight: 16, color: "#9B9B9B", textAlign: "center" }}
          >
            {abbrOf(team)}
          </Text>
        ) : null}
      </View>
    ) : (
      crest(team, crestVariant, align === "right")
    );
  // Reserve the possession-icon footprint on BOTH sides so the score columns stay
  // balanced; the team without the ball renders the cue at 0% opacity (invisible).
  const possCue = (team: Team, tint: string) =>
    isLive ? <Possession mode={possession} color={tint} sport={match.sport} invisible={!team.hasBall} /> : null;

  // Versus card: the glow lights the SIDE of the ring nearest the scoring team —
  // home (idx 0) glows the left edge, away (idx 1) the right.
  // "old" mode automatically suppresses both glow cues: the score-glow and the
  // animated (live / inactive) border.
  const glow = !oldMode && scoreGlow && animate && isLive ? scoreAnim.glow : null;
  const glowColor = glow ? accessibleColor(glow.team === 0 ? home.color : away.color) : undefined;
  const glowEdge: "left" | "right" = glow?.team === 1 ? "right" : "left";
  const borderCue = accentOn && !oldMode && animate && isLive && animStyle === "border" && !glow;
  const inactiveBorderCue = accentOn && !oldMode && animate && !isLive && animStyle === "border";
  // Accent anchor: "corner" lights the top-left corner like standard cards;
  // "center" lights the middle of the ring (the original versus-card treatment).
  const accentPlacement = versusAccent === "corner" || centerLeft ? "left" : "center";
  const sidesLiveTop = sides && sidesLive === "top";

  const header = sides ? (
    metaPlacement === "top" ? (
      <View style={{ flexDirection: "row", justifyContent: "center" }}>
        <MetaTag metaStyle={metaStyle}>{match.league}</MetaTag>
      </View>
    ) : null
  ) : (
    // Center layout centers the whole composition (title + score), so the
    // timestamp/live clock is centered to match — unless the header is set to
    // left-align (or footer metadata is pinned top-right), in which case it
    // anchors to the left edge with the meta chips floated to the right.
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: leftAlignHeader || metaTop ? "flex-start" : "center" }}>
      <MetaHeader match={match} live={live} animate={animate} animStyle={animStyle} glow={glow} hideUpcomingDate={footerDetail.endDate} stacked={liveFormat === "stacked"} />
      {metaTop && (
        <View style={{ marginLeft: "auto" }}>
          <MetaTopRight match={match} metaStyle={metaStyle} />
        </View>
      )}
    </View>
  );

  const topEl = sidesLiveTop ? (
    <View style={{ flexDirection: "row", justifyContent: "center" }}>
      <StatusInline match={match} isLive={isLive} animate={animate} animStyle={animStyle} glow={glow} hideDate={footerDetail.endDate} stacked={liveFormat === "stacked"} />
    </View>
  ) : versionB ? (
    <View style={{ flexDirection: "row", justifyContent: "flex-start" }}>
      <StatusInline match={match} isLive={isLive} animate={animate} animStyle={animStyle} glow={glow} hideDate={footerDetail.endDate} align="left" stacked={liveFormat === "stacked"} />
    </View>
  ) : (
    header
  );
  const hasTopEl = topEl != null;
  const titleAtTop = !hasTopEl && title === "show";

  // All versus scores (center and sides layouts) share the configurable score
  // size (versusScoreSize, default 24); lineHeight derives as round(size*1.25).
  const bigScoreStyle = { fontFamily: displayFont, fontSize: versusScoreSize, lineHeight: Math.round(versusScoreSize * 1.25), color: colors.textPrimary } as const;
  const sidesScoreStyle = bigScoreStyle;
  // The avatar↔score gap is a fixed 12px in the sides layout (every mode).
  const sideGap = 12;

  // The probability bar (home / draw / away proportional slots). Extracted so it
  // can render either in its standard slot below the scores OR — in the centered
  // "Live left" variant — horizontally between the two scores.
  const probBar = !oldMode ? (
    <View style={{ flexDirection: "row", gap: 4, width: "100%", height: 2 }}>
      <View style={{ flexGrow: 0, flexShrink: 1, flexBasis: `${(homePct / total) * 100}%`, height: 2, borderRadius: 999, overflow: "hidden" }}>
        <Animated.View style={{ height: 2, width: barProgress ? barProgress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) : "100%", backgroundColor: uxrCard ? marketAccentColor(tintHome) : barFill(accessibleColor(tintHome)) }} />
      </View>
      {showDraw && (
        <View style={{ flexGrow: 0, flexShrink: 1, flexBasis: `${(drawPct / total) * 100}%`, height: 2, borderRadius: 999, overflow: "hidden" }}>
          <Animated.View style={{ height: 2, width: barProgress ? barProgress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) : "100%", backgroundColor: uxrCard ? marketAccentColor(tintDraw) : barFill(accessibleColor(tintDraw)) }} />
        </View>
      )}
      <View style={{ flexGrow: 0, flexShrink: 1, flexBasis: `${(awayPct / total) * 100}%`, height: 2, borderRadius: 999, overflow: "hidden", flexDirection: "row", justifyContent: "flex-end" }}>
        <Animated.View
          style={{
            height: 2,
            width: barProgress ? barProgress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) : "100%",
            backgroundColor: barProgress ? barProgress.interpolate({ inputRange: [0, 1], outputRange: [uxrCard ? marketAccentColor(tintDraw) : barFill(accessibleColor(tintDraw)), uxrCard ? marketAccentColor(tintAway) : barFill(accessibleColor(tintAway))] }) : uxrCard ? marketAccentColor(tintAway) : barFill(accessibleColor(tintAway)),
          }}
        />
      </View>
    </View>
  ) : null;

  const scoreRow = sides ? (
    <View style={{ flexDirection: "row", alignItems: "center", width: "100%", gap: 12 }}>
      <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", justifyContent: "flex-start", gap: sideGap }}>
        {sideEl(home, "left")}
        {isLive && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: uxrCard ? 1 : undefined, minWidth: 0 }}>
            {showScore && <Text {...oswald} numberOfLines={1} style={[sidesScoreStyle, uxrCard ? { flex: 1, textAlign: "center" } : { width: 64, textAlign: "left" }, homeFlash ? { color: accessibleColor(tintHome) } : null]}>{homeScore}</Text>}
            {possCue(home, tintHome)}
          </View>
        )}
      </View>
      <View style={[{ paddingHorizontal: 4 }, sidesLiveTop ? { flex: 1, minWidth: 0 } : { flexShrink: 0 }]}>
        {sidesLiveTop ? (
          title === "show" ? (
            <Text {...oswald} style={{ fontFamily: displayFont, fontSize: 16, lineHeight: 24, color: colors.textPrimary, textAlign: "center" }} numberOfLines={1}>
              {home.name} vs. {away.name}
            </Text>
          ) : null
        ) : versionB ? (
          <ScoreColon />
        ) : (
          <StatusInline match={match} isLive={isLive} animate={animate} animStyle={animStyle} glow={glow} hideDate={footerDetail.endDate} stacked={liveFormat === "stacked"} />
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: sideGap }}>
        {isLive && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: uxrCard ? 1 : undefined, minWidth: 0 }}>
            {possCue(away, tintAway)}
            {showScore && <Text {...oswald} numberOfLines={1} style={[sidesScoreStyle, uxrCard ? { flex: 1, textAlign: "center" } : { width: 64, textAlign: "right" }, awayFlash ? { color: accessibleColor(tintAway) } : null]}>{awayScore}</Text>}
          </View>
        )}
        {sideEl(away, "right")}
      </View>
    </View>
  ) : centerLeft ? (
    // "Live left" centered variant: avatar + score + probability bar + score +
    // avatar. Scores only appear when live; otherwise the bar sits between the
    // two avatars. The standalone bar below the scores is suppressed.
    <View style={{ flexDirection: "row", alignItems: "center", width: "100%", gap: 12 }}>
      {sideEl(home, "left")}
      {showScore && <Text {...oswald} numberOfLines={1} style={[bigScoreStyle, { width: 64, textAlign: "center" }, homeFlash ? { color: accessibleColor(tintHome) } : null]}>{homeScore}</Text>}
      <View style={{ flex: 1, minWidth: 0 }}>{probBar}</View>
      {showScore && <Text {...oswald} numberOfLines={1} style={[bigScoreStyle, { width: 64, textAlign: "center" }, awayFlash ? { color: accessibleColor(tintAway) } : null]}>{awayScore}</Text>}
      {sideEl(away, "right")}
    </View>
  ) : (
    <View style={{ flexDirection: "row", alignItems: "center", width: "100%", gap: 8 }}>
      <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", justifyContent: "flex-start", gap: 8 }}>
        {sideEl(home, "left")}
        {possCue(home, tintHome)}
      </View>
      <View style={{ flexShrink: 0 }}>
        {showScore ? (
          <Text {...oswald} style={bigScoreStyle}>
            <Text style={homeFlash ? { color: accessibleColor(tintHome) } : null}>{homeScore}</Text>
            {" - "}
            <Text style={awayFlash ? { color: accessibleColor(tintAway) } : null}>{awayScore}</Text>
          </Text>
        ) : (
          <Text style={{ fontFamily: geist.medium, fontSize: 14, color: colors.textMuted }}>vs</Text>
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
        {possCue(away, tintAway)}
        {sideEl(away, "right")}
      </View>
    </View>
  );

  // "old" mode adds an explicit team-name row below the score unit. In old mode
  // the probability bar and the footer metadata (tag/volume/outcomes) are
  // hidden, so this row sits directly under the score unit. It mirrors the score
  // columns: home left, away right (no centered draw label).
  const nameRowStyle = { fontFamily: geist.medium, fontSize: 14, lineHeight: 20, color: "#9b9b9b" } as const;
  const namesRow = oldMode ? (
    <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", width: "100%", gap: 8 }}>
      <Text style={[nameRowStyle, { flex: 1, minWidth: 0, textAlign: "left" }]} numberOfLines={1}>
        {home.name}
      </Text>
      <Text style={[nameRowStyle, { flex: 1, minWidth: 0, textAlign: "right" }]} numberOfLines={1}>
        {away.name}
      </Text>
    </View>
  ) : null;

  return (
    <View
      ref={rootRef}
      onLayout={onLayout}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: listMode ? 0 : cardRadius,
        paddingHorizontal: listMode ? 0 : padSide,
        paddingBottom: fillHeight ? 16 : !showFooter ? 20 : showMetaFooter ? (listMode ? 16 : padSide) : 16,
        paddingTop: fillHeight ? 16 : centerLeft ? 12 : titleAtTop ? 12 + comfortPad : padTop,
        backgroundColor: cardBg,
        height: fillHeight ? "100%" : undefined,
      }}
    >
      <LightReflect progress={reflectOpacity} target={reflectTarget} pulse={reflectPulse} />
      {borderCue && !listMode && <LiveBorder placement={accentPlacement} live centerWide={versusAccent === "center" && centerAccentWidth === "full"} />}
      {inactiveBorderCue && !listMode && <LiveBorder placement="center" color="#fff" centerWide={versusAccent === "center" && centerAccentWidth === "full"} />}
      {glow &&
        glowColor &&
        (scoreGlowMode === "inPlace" ? (
          <ScoreGlowInPlace key={glow.key} color={glowColor} placement={accentPlacement} radius={listMode ? 0 : 12} />
        ) : (
          <ScoreGlowBorder key={glow.key} color={glowColor} edge={glowEdge} radius={listMode ? 0 : 12} />
        ))}
      {topEl}

      {title === "show" && !sidesLiveTop && (
        <Text
          {...oswald}
          style={[
            { fontFamily: displayFont, fontSize: 16, lineHeight: 24, color: colors.textPrimary, textAlign: leftAlignHeader ? "left" : "center" },
            // Let the type leading govern the gap to the status/header line above
            // it — the 14/22 timestamp's 4px lower half-leading plus the 16/24
            // title's 4px upper half-leading give an 8px breathing gap with no
            // negative pull, in BOTH the centered and sides (version B) layouts.
          ]}
          numberOfLines={1}
        >
          {home.name} vs. {away.name}
        </Text>
      )}

      {/* Feed sandwich: 16px card-top → title, then 12px → score unit.
          Carousel fillHeight still centers the unit in leftover space. */}
      <View
        style={{
          marginTop: fillHeight ? 0 : title === "show" && !sidesLiveTop ? 12 : !sides && title === "hide" ? 24 : !hasTopEl && sides ? 0 : uxrCard ? 16 : 12,
          flexGrow: fillHeight ? 1 : 0,
          justifyContent: "center",
        }}
      >
        {scoreRow}
      </View>

      {namesRow}

      <View style={{ marginTop: fillHeight ? 0 : uxrCard ? 16 : 12, gap: fillHeight || uxrCard ? 16 : 12 }}>
        {!oldMode && !centerLeft ? probBar : null}
        <View style={{ flexDirection: "row", width: "100%", gap: 8 }}>
          <OutcomeBtn combo={combo} value={homePct} pickTitle={home.name} market={`${home.name} vs. ${away.name}`} staticLabel={homeLabel} prefix={abbrOf(home)} suffix={unit} reel={reel} color={tintHome} buttonText={buttonText} buttonStyle={buttonStyle} btnH={btnH} btnFontSize={btnFontSize} bgOpacity={bgOpacity} oldMode={oldMode} comboPick={versusComboPick(match, home, away, tintHome, Math.round(homePct), tintAway, Math.round(awayPct))} />
          {showDraw && <OutcomeBtn combo={combo} value={drawPct} pickTitle="Draw" market={`${home.name} vs. ${away.name}`} staticLabel={drawLabel} prefix="DRAW" suffix={unit} drawIcon reel={reel} color={tintDraw} buttonText={buttonText} buttonStyle={buttonStyle} btnH={btnH} btnFontSize={btnFontSize} bgOpacity={bgOpacity} oldMode={oldMode} comboPick={{ id: `ml:${matchKey(match)}:draw`, category: match.league ?? match.sport ?? "Sports", label: `Draw · ${home.name} vs. ${away.name}`, color: tintDraw, cents: Math.round(drawPct), side: "yes", kind: "ml", sport: match.sport }} />}
          <OutcomeBtn combo={combo} value={awayPct} pickTitle={away.name} market={`${home.name} vs. ${away.name}`} staticLabel={awayLabel} prefix={abbrOf(away)} suffix={unit} reel={reel} color={tintAway} buttonText={buttonText} buttonStyle={buttonStyle} btnH={btnH} btnFontSize={btnFontSize} bgOpacity={bgOpacity} oldMode={oldMode} comboPick={versusComboPick(match, away, home, tintAway, Math.round(awayPct), tintHome, Math.round(homePct))} />
        </View>
      </View>

      {!fillHeight ? <CardBuildComboButton showBuildCombo={showBuildCombo} radius={pillButtons ? 999 : 12} /> : null}

      {!oldMode && showMetaFooter && (
        <View style={{ marginTop: uxrCard ? 16 : 12 }}>
          <MetaFooter match={match} metaStyle={metaStyle} />
        </View>
      )}
    </View>
  );
}
