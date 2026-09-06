import { Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Icon, IconColor, IconName, IconSize } from "@metamask/design-system-react-native";
import { colors } from "@/lib/sim/colors";
import { formatVol } from "@/lib/formatVol";
import { useFeedSettings } from "@/lib/sim/FeedSettingsContext";
import { tradedCopy } from "@/lib/sim/tradedCount";
import { useSocialUx } from "@/lib/sim/socialUxStore";
import { useUxrMode } from "@/lib/sim/uxrModeStore";
import type { AnimStyle, Match, MetaStyle } from "@/lib/sim/types";
import { LiveStatusLine } from "./LiveStatusLine";
import { geist } from "@/lib/sim/geistFonts";
import { VolumeText } from "@/components/sim/VolumeText";

/** MetaMask BodyXs — 12/16. All card meta footers use this, tag or plain. */
const META_FOOTER_TYPE = {
  fontSize: 12,
  lineHeight: 16,
  letterSpacing: 0.3,
  flexShrink: 1 as const,
  color: colors.textMuted,
};

export function MoreChevron() {
  return (
    <Svg width={12} height={12} viewBox="0 0 16 16" fill="none">
      <Path d="M5.92486 14.4038L4.74153 13.2205L10.2249 7.73713L4.74153 2.2538L5.92486 1.07047L12.5915 7.73713L5.92486 14.4038Z" fill={colors.textMuted} />
    </Svg>
  );
}

/** Right-side meta affordance: "+N more" when extra markets exist, otherwise "View >". */
export function MetaViewMore({ count }: { count: number }) {
  if (count > 0) {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginLeft: "auto", height: 16 }}>
        <OutcomesMeta count={count} tag={false} label="more" />
      </View>
    );
  }
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginLeft: "auto", height: 16 }}>
      <Text
        style={{
          fontFamily: geist.medium,
          ...META_FOOTER_TYPE,
        }}
      >
        View
      </Text>
      <MoreChevron />
    </View>
  );
}

export function OutcomesMeta({
  count,
  tag,
  metaStyle = "filled",
  label = "outcomes",
}: {
  count: number;
  tag: boolean;
  metaStyle?: MetaStyle;
  label?: "outcomes" | "more";
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, height: tag ? undefined : 16 }}>
      <MetaChip tag={tag} metaStyle={metaStyle}>{`+${count} ${label}`}</MetaChip>
      <MoreChevron />
    </View>
  );
}

// A single meta detail item rendered either as a tag pill (`tag` true, 12px
// text, "filled" = surface2 chip / "outline" = hairline border) or as plain
// muted text (`tag` false, 14px). Used for category/volume/outcomes so each can
// independently flip between text and tag via the detailTags setting.
export function MetaChip({
  tag,
  metaStyle = "filled",
  leading,
  children,
  volume = false,
}: {
  tag: boolean;
  metaStyle?: MetaStyle;
  leading?: React.ReactNode;
  children: React.ReactNode;
  volume?: boolean;
}) {
  const { density } = useFeedSettings();
  const typeStyle = META_FOOTER_TYPE;
  const label = volume ? (
    <VolumeText style={typeStyle}>{children}</VolumeText>
  ) : (
    <Text
      style={{ fontFamily: geist.medium, ...typeStyle }}
      numberOfLines={1}
    >
      {children}
    </Text>
  );
  if (!tag) {
    if (!leading) return label;
    return <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 1 }}>{leading}{label}</View>;
  }
  const variant =
    metaStyle === "outline"
      ? { borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" }
      : { backgroundColor: colors.tagSurface };
  return (
    <View
      style={[
        { height: density === "comfort" ? 24 : 20, borderRadius: 8, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", justifyContent: "center", alignSelf: "flex-start", gap: 4, maxWidth: "100%" },
        variant,
      ]}
    >
      {leading}
      {label}
    </View>
  );
}

// League/category metadata. Renders as a pill or plain text depending on the
// detailTags.metadata setting (defaults to a tag).
export function MetaTag({ metaStyle = "filled", children }: { metaStyle?: MetaStyle; children: React.ReactNode }) {
  const { detailTags } = useFeedSettings();
  return (
    <MetaChip tag={detailTags?.metadata ?? true} metaStyle={metaStyle}>
      {children}
    </MetaChip>
  );
}

/** Social UX: people-group icon + compact trader count, e.g. "2K traded". */
export function TradedMeta({ vol }: { vol: string; size?: "md" | "xs" }) {
  const socialUx = useSocialUx();
  if (!socialUx) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 1 }}>
      <Icon name={IconName.People} size={IconSize.Sm} color={IconColor.IconAlternative} />
      <Text
        style={{ fontFamily: geist.medium, ...META_FOOTER_TYPE }}
        numberOfLines={1}
      >
        {tradedCopy(vol)}
      </Text>
    </View>
  );
}

// Top status line of a card: a pulsing live dot + ticking clock when live,
// otherwise the (muted) date/time.
export function MetaHeader({
  match,
  live,
  animate = false,
  animStyle = "pulse",
  glow = null,
  hideDate = false,
  hideUpcomingDate = false,
  stacked = false,
  livePrefix = false,
}: {
  match: Match;
  live: boolean;
  animate?: boolean;
  animStyle?: AnimStyle;
  glow?: { team: number; key: number } | null;
  hideDate?: boolean;
  hideUpcomingDate?: boolean;
  // Two-line live format (dot + "LIVE" over the muted clock); only meaningful
  // when the card is live. Passed through to LiveStatusLine.
  stacked?: boolean;
  // Single-line "Live • " prefix before the live clock (standard-card variant of
  // the "LIVE included" format). Passed through to LiveStatusLine.
  livePrefix?: boolean;
}) {
  const uxrHeader = useUxrMode() === "uxr";
  const isLive = live && !!match.live;
  // Header timestamps (both the live ticking clock and the upcoming date/time)
  // are 14px in classic, 12px in UXR.
  const metaFont = uxrHeader ? 12 : 14;

  // "old" card style drops the top status line entirely on standard cards —
  // both the upcoming date/time and the live clock count as timestamps.
  if (hideDate) return null;
  if (isLive) {
    return <LiveStatusLine match={match} animate={animate} fontSize={metaFont} align="left" glow={glow} stacked={stacked} livePrefix={livePrefix} />;
  }
  // When the upcoming date has been relocated to the footer, drop it from the
  // header (live cards keep their clock above — only the static date moves).
  if (hideUpcomingDate) return null;
  return (
    <Text
      style={{
        fontFamily: geist.medium,
        fontSize: metaFont,
        lineHeight: uxrHeader ? 16 : 22,
        color: colors.textMuted,
        // UXR: cancel the line box's bottom half-leading (2px at 12/16) so the
        // card's 16px section gap measures 16 visually from the ink.
        marginBottom: uxrHeader ? -2 : 0,
      }}
      numberOfLines={1}
    >
      {match.date}
      {match.time ? `, ${match.time}` : ""}
    </Text>
  );
}

// Compact top-right meta cluster: the league tag, volume, and outcome count
// each rendered as a MetaTag-style chip, pinned inline with the LIVE indicator
// at the top of the card. Each piece respects the same footerDetail toggles as
// the bottom MetaFooter (metadata/volume/outcomes); the end date is omitted
// here (live cards show the ticking clock instead).
export function MetaTopRight({ match, metaStyle = "filled" }: { match: Match; metaStyle?: MetaStyle }) {
  const { footerDetail, detailTags } = useFeedSettings();
  // UXR: volume and outcome count render as plain text (no chip background);
  // only the league tag keeps its pill.
  const uxr = useUxrMode() === "uxr";
  const showTag = footerDetail.metadata;
  const showVol = footerDetail.volume;
  const showOutcomes = footerDetail.outcomes && match.markets > 0;
  if (!showTag && !showVol && !showOutcomes) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      {showTag && <MetaTag metaStyle={metaStyle}>{match.league}</MetaTag>}
      <TradedMeta vol={match.vol} />
      {showVol && <MetaChip volume tag={!uxr && (detailTags?.volume ?? true)} metaStyle={metaStyle}>{formatVol(match.vol)}</MetaChip>}
      {showOutcomes && (
        <OutcomesMeta
          count={match.markets}
          tag={!uxr && (detailTags?.outcomes ?? true)}
          metaStyle={metaStyle}
        />
      )}
    </View>
  );
}

// Bottom meta row: league pill, volume, end date, and "+N outcomes". Each piece
// is independently toggled via the footerDetail setting. The end date is hidden
// on live cards (they show the ticking clock in the header instead).
export function MetaFooter({ match, metaStyle = "filled", hideDate = false, hideTag = false }: { match: Match; metaStyle?: MetaStyle; hideDate?: boolean; hideTag?: boolean }) {
  const { showFooter, footerDetail, detailTags } = useFeedSettings();
  // UXR: "$X Vol" and "+N outcomes" lose their chip background (plain muted
  // text); the league tag keeps its pill (per the UXR footer mock).
  const uxr = useUxrMode() === "uxr";
  if (!showFooter) return null;
  const showTag = footerDetail.metadata && !hideTag;
  const showVolDate = footerDetail.endDate && !hideDate && !match.live;
  const showOutcomes = footerDetail.outcomes && match.markets > 0;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      {showTag && <MetaTag metaStyle={metaStyle}>{match.league}</MetaTag>}
      <TradedMeta vol={match.vol} />
      {footerDetail.volume && (
        <MetaChip volume tag={!uxr && (detailTags?.volume ?? true)} metaStyle={metaStyle}>{formatVol(match.vol)}</MetaChip>
      )}
      {showVolDate && (
        <Text
          style={{ fontFamily: geist.medium, ...META_FOOTER_TYPE }}
          numberOfLines={1}
        >
          {match.date}
        </Text>
      )}
      {showOutcomes && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          <OutcomesMeta
            count={match.markets}
            tag={uxr ? false : (detailTags?.outcomes ?? true)}
            metaStyle={metaStyle}
            label={uxr ? "more" : "outcomes"}
          />
        </View>
      )}
    </View>
  );
}
