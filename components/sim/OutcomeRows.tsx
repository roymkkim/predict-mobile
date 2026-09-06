import { Animated, Image, Pressable, Text, View } from "react-native";
import { accessibleColor, barFill, bgForWhiteText, colors, marketAccentColor } from "@/lib/sim/colors";
import { placeComboOrSlip } from "@/lib/sim/comboBet";
import { useComboPageUnselectedChrome, useEffectiveCombo } from "@/lib/sim/comboFlowStore";
import { comboOutcomeOn } from "@/lib/sim/comboPickEdit";
import { useComboPicks } from "@/lib/sim/comboPicksStore";
import { ComboSelectedButton } from "@/components/sim/ComboGradient";
import { buttonInteractionStyle, buttonMetrics, comboOutcomeVisual, outcomeButtonVisual } from "@/lib/sim/buttonStyle";
import { useUxrMode } from "@/lib/sim/uxrModeStore";
import { usePillButtons } from "@/lib/sim/pillButtonsStore";
import { useOutcomeButtonColorMode } from "@/lib/sim/outcomeButtonColorStore";
import { useFeedSettings } from "@/lib/sim/FeedSettingsContext";
import { useLiveOdds } from "@/lib/sim/useLiveOdds";
import type { ButtonAnim, ButtonSize, ButtonStyle, ButtonText, OutcomeAvatar, PoliticsOutcome } from "@/lib/sim/types";
import { HighlightFace } from "./HighlightFace";
import { SlotNumber } from "./SlotNumber";
import { YesNoControls } from "./YesNoControls";
import { geist } from "@/lib/sim/geistFonts";

// Per-outcome avatar shown to the left of an outcome label: a flag/logo image
// or a solid color swatch. Team logos ("contain") render BARE — the logo's own
// shape is the avatar, with no gray backing tile. Flags ("cover") still fill a
// rounded square so the wide image is cropped cleanly.
const OUTCOME_AVATAR_SIZE = 40;
export function OutcomeAvatarView({
  avatar,
  size = OUTCOME_AVATAR_SIZE,
  radius = 8,
}: {
  avatar: OutcomeAvatar;
  size?: number;
  radius?: number;
}) {
  const box = {
    width: size,
    height: size,
    borderRadius: radius,
    overflow: "hidden" as const,
  };
  if (avatar.type === "swatch") {
    return <View style={[box, { backgroundColor: avatar.color }]} />;
  }
  if (avatar.contain) {
    return (
      <View style={[box, { backgroundColor: avatar.bg ?? "transparent", alignItems: "center", justifyContent: "center" }]}>
        <Image
          source={avatar.source}
          style={{ width: size, height: size, borderRadius: radius }}
          resizeMode="contain"
        />
      </View>
    );
  }
  return (
    <View style={[box, { backgroundColor: avatar.bg ?? colors.surface2, alignItems: "center", justifyContent: "center" }]}>
      <Image
        source={avatar.source}
        style={{ width: size, height: size }}
        resizeMode="cover"
      />
    </View>
  );
}

// Acronym tile alternative to the official logo: a colored rounded square with
// the team's acronym, mirroring the team crest used on match cards.
function OutcomeAcronym({ abbr, color, size = OUTCOME_AVATAR_SIZE }: { abbr: string; color: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        backgroundColor: colors.surface2,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Acronym tiles are retired: empty square placeholder. */}
    </View>
  );
}

// The stacked outcome list for PoliticsCard/CryptoCard: each row is a label +
// probability bar on the left and a multiplier + percentage button on the right.
// When animations are on the button shows a live slot-rolling percentage.
export function OutcomeRows({
  outcomes,
  buttonText,
  buttonStyle = "default",
  buttonAnim = "ticker",
  buttonSize = "lg",
  animate = false,
  liveBaseDelayMs = 0,
  staggerMs,
  bgOpacity = null,
  barProgress = null,
  sport = false,
  oldMode = false,
  marketTitle,
  combo,
}: {
  outcomes: PoliticsOutcome[];
  buttonText: ButtonText;
  buttonStyle?: ButtonStyle;
  buttonAnim?: ButtonAnim;
  buttonSize?: ButtonSize;
  animate?: boolean;
  liveBaseDelayMs?: number;
  staggerMs?: number;
  bgOpacity?: Animated.AnimatedInterpolation<number> | null;
  // Drives the probability bars growing in from 0px width on scroll-in. Null off
  // the home feed, where bars render at full width with no entrance animation.
  barProgress?: Animated.Value | null;
  // When true this is a sports market (e.g. F1, MLB), so the white-bars setting
  // does NOT apply and outcomes keep their accent colors.
  sport?: boolean;
  // "Old" card version: each row swaps the multiplier + % button (and the bar)
  // for the shared green "Yes" / red "No" controls.
  oldMode?: boolean;
  // The parent market question, shown in the bet-slip header above the outcome.
  marketTitle?: string;
  combo?: boolean;
}) {
  const { density, whiteBars, barTrack, showTeamAvatars, teamAvatars, bodyAvatarSize } = useFeedSettings();
  // When the white-bars setting paints this (non-sports) market's bars white,
  // the related % button text turns white too.
  const barWhite = whiteBars && !sport;
  // Subscribe to the UXR mode so mounted rows re-render (and re-run
  // outcomeButtonVisual's non-reactive getUxrMode() read) when the toggle flips.
  const uxr = useUxrMode() === "uxr";
  const pill = usePillButtons();
  const comboBtnR = pill ? 999 : 12;
  const mode = useOutcomeButtonColorMode();
  const comboMode = useEffectiveCombo(combo);
  const unselectedChrome = useComboPageUnselectedChrome();
  const comboPicks = useComboPicks();
  const { fontSize: btnFontSize } = buttonMetrics(density, buttonSize);
  // Horizontal outcome rows use the medium 40px button (per the UXR spec);
  // classic keeps 48.
  const btnH = uxr ? 40 : 48;
  const labelFontSize = density === "comfort" ? 16 : 14;
  const labelLineHeight = density === "comfort" ? 24 : 22;
  const pcts = outcomes.map((o) => parseFloat(o.pct) || 0);
  const { vals: liveVals, displayVals } = useLiveOdds(pcts, animate, liveBaseDelayMs, staggerMs);
  // Bar widths are normalized to the leading outcome: the largest bar fills the
  // full track and the others render proportionally relative to it.
  const rawBarVals = pcts.map((p, i) => Math.max(0, Math.min(100, liveVals[i] ?? p)));
  const barMax = Math.max(...rawBarVals, 1);
  const barVals = rawBarVals.map((v) => (v / barMax) * 100);

  // Subscribe to the UXR mode so mounted rows re-render (and re-run
  // outcomeButtonVisual's non-reactive getUxrMode() read) when the toggle flips.
  useUxrMode();
  usePillButtons();
  useOutcomeButtonColorMode();
  return (
    <View style={{ gap: 8 }}>
      {outcomes.map((o, i) => {
        const pct = pcts[i] ?? 0;
        // Binary "Yes" / "No" outcomes always use the success-green / error-red
        // accent regardless of the market's own color.
        const yn = o.label.trim().toLowerCase();
        const effColor = yn === "yes" ? colors.greenOutline : yn === "no" ? colors.red : o.color;
        const pickId = `ml:${marketTitle ?? "market"}:${o.label}`;
        const visual = comboMode
          ? comboOutcomeVisual(comboOutcomeOn(comboPicks, pickId), effColor, comboBtnR, { unselectedChrome })
          : outcomeButtonVisual(buttonStyle, buttonText, effColor, { mode, label: o.label, pill });
        const tint = buttonStyle === "outline" ? colors.mono : effColor;
        const barW = barVals[i] ?? 0;
        const liveRounded = Math.round(liveVals[i] ?? pct);
        const displayRounded = displayVals[i] ?? Math.round(pct);
        const other = outcomes.find((x) => x.label !== o.label);
        const comboLeg = {
          id: pickId,
          category: "Predictions",
          label: `${o.label} · ${marketTitle ?? ""}`,
          color: effColor,
          cents: displayRounded,
          side: "yes" as const,
          avatar: o.avatar?.type === "image" ? o.avatar.source : undefined,
          alt: other
            ? {
                id: `ml:${marketTitle ?? "market"}:${other.label}`,
                label: `${other.label} · ${marketTitle ?? ""}`,
                color: other.color,
                cents: Math.max(8, Math.min(92, 100 - (parseFloat(other.pct) || 50))),
                avatar: other.avatar?.type === "image" ? other.avatar.source : undefined,
              }
            : undefined,
        };
        return (
          <View key={i} style={{ flexDirection: "row", alignItems: "center" }}>
            {showTeamAvatars && (o.avatar || o.abbr) && !oldMode && sport && (
              <View style={{ marginRight: 12 }}>
                {teamAvatars === "acronym" && o.abbr ? (
                  <OutcomeAcronym abbr={o.abbr} color={o.color} size={bodyAvatarSize} />
                ) : o.avatar ? (
                  <OutcomeAvatarView avatar={o.avatar} size={bodyAvatarSize} />
                ) : (
                  <OutcomeAcronym abbr={o.abbr!} color={o.color} size={bodyAvatarSize} />
                )}
              </View>
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontFamily: geist.regular, fontSize: labelFontSize, lineHeight: labelLineHeight, color: colors.textPrimary }} numberOfLines={1}>
                {o.label}
              </Text>
              {!oldMode && (
                <View style={{ height: 2, borderRadius: 1, marginTop: 6, backgroundColor: barTrack ? colors.surface2 : "transparent", overflow: "hidden" }}>
                  <Animated.View
                    style={{
                      height: 2,
                      borderRadius: 1,
                      width: barProgress ? barProgress.interpolate({ inputRange: [0, 1], outputRange: ["0%", `${barW}%`] }) : `${barW}%`,
                      backgroundColor: barWhite ? "#fff" : uxr ? marketAccentColor(tint) : barFill(accessibleColor(tint)),
                    }}
                  />
                </View>
              )}
            </View>
            {oldMode ? (
              <YesNoControls
                pctLabel={animate ? `${displayRounded}%` : o.pct}
                onYes={() =>
                  placeComboOrSlip(
                    comboMode,
                    comboLeg,
                      { market: marketTitle, title: o.label, oddsCents: displayRounded, color: effColor, side: "yes", avatar: o.avatar },
                  )
                }
                onNo={() =>
                  placeComboOrSlip(
                    comboMode,
                    { ...comboLeg, side: "no" },
                      { market: marketTitle, title: o.label, oddsCents: displayRounded, color: effColor, side: "no", avatar: o.avatar },
                  )
                }
              />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 12, gap: 12 }}>
                <Text style={{ fontFamily: geist.medium, fontSize: 14, color: colors.textMuted }}>
                  {animate ? `${(100 / Math.max(displayRounded, 1)).toFixed(2)}x` : o.multiplier}
                </Text>
                {comboMode ? (
                  <ComboSelectedButton
                    selected={comboOutcomeOn(comboPicks, pickId)}
                    onPress={() =>
                      placeComboOrSlip(
                        comboMode,
                        comboLeg,
                        { market: marketTitle, title: o.label, oddsCents: displayRounded, color: effColor, avatar: o.avatar },
                      )
                    }
                    label={animate ? `${displayRounded}%` : o.pct}
                    slotValue={animate ? liveRounded : undefined}
                    slotSuffix={animate ? "%" : undefined}
                    radius={comboBtnR}
                    height={btnH}
                    width={64}
                    fontSize={btnFontSize}
                    fontFamily={geist.medium}
                    unselectedColor={effColor}
                    unselectedChrome={unselectedChrome}
                    labelForInk={o.label}
                  />
                ) : (
                <Pressable
                  onPress={() =>
                    placeComboOrSlip(
                      comboMode,
                      comboLeg,
                      { market: marketTitle, title: o.label, oddsCents: displayRounded, color: effColor, avatar: o.avatar },
                    )
                  }
                  style={({ pressed }) => [
                    { width: 64, height: btnH, alignItems: "center", justifyContent: "center", overflow: "hidden" },
                    visual.container,
                    { borderRadius: comboBtnR },
                    buttonInteractionStyle(pressed),
                  ]}
                >
                  <HighlightFace opacity={bgOpacity} />
                  {animate ? (
                    buttonAnim === "slot" ? (
                      <SlotNumber value={liveRounded} color={barWhite ? "#fff" : (visual.text.color as string)} fontSize={btnFontSize} />
                    ) : (
                      <Text style={[{ fontFamily: geist.medium, fontSize: btnFontSize }, visual.text, barWhite && { color: "#fff" }]}>{`${displayRounded}%`}</Text>
                    )
                  ) : (
                    <Text style={[{ fontFamily: geist.medium, fontSize: btnFontSize }, visual.text, barWhite && { color: "#fff" }]}>{o.pct}</Text>
                  )}
                </Pressable>
                )}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
