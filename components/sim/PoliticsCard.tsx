import { Image, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/sim/colors";
import { formatVol } from "@/lib/formatVol";
import { useCenterHighlight } from "@/lib/sim/useCenterHighlight";
import { LightReflect } from "./LightReflect";
import { LiveBorder } from "./LiveBorder";
import { useFeedSettings } from "@/lib/sim/FeedSettingsContext";
import { useUxrMode } from "@/lib/sim/uxrModeStore";
import type {
  ButtonAnim,
  ButtonSize,
  ButtonStyle,
  ButtonText,
  CardPadding,
  MetaPlacement,
  MetaStyle,
  PoliticsMarket,
} from "@/lib/sim/types";
import { MetaChip, MetaTag, OutcomesMeta } from "./MetaHeader";
import { OutcomeRows } from "./OutcomeRows";
import { geist } from "@/lib/sim/geistFonts";

// Categories whose markets are sports-related. Their outcome bars keep accent
// colors even when the white-bars setting is on (e.g. F1, MLB World Series).
const SPORT_CATEGORIES = new Set(["F1", "MLB", "NBA", "NHL", "NFL", "UFC", "GOLF", "SOCCER", "TENNIS", "UCL"]);

// Non-versus market card (politics / crypto): a question with an optional avatar
// and a stacked list of outcomes. Meta (category pill + volume) sits at the
// bottom for Version A.
export function PoliticsCard({
  market,
  cardPadding = "16",
  metaStyle = "filled",
  metaPlacement = "top",
  buttonText,
  buttonStyle = "default",
  buttonAnim = "ticker",
  buttonSize = "lg",
  animate = false,
  liveBaseDelayMs = 0,
  staggerMs,
  showAvatar = false,
  combo,
}: {
  market: PoliticsMarket;
  cardPadding?: CardPadding;
  metaStyle?: MetaStyle;
  metaPlacement?: MetaPlacement;
  buttonText: ButtonText;
  buttonStyle?: ButtonStyle;
  buttonAnim?: ButtonAnim;
  buttonSize?: ButtonSize;
  animate?: boolean;
  liveBaseDelayMs?: number;
  staggerMs?: number;
  showAvatar?: boolean;
  combo?: boolean;
}) {
  const { density, showFooter, footerDetail, detailTags, cardStyle, versusMode, standardDateInFooter, sportsMarketAvatar = false } = useFeedSettings();
  const uxr = useUxrMode() === "uxr";
  const oldMode = versusMode === "old";
  const avatarSize = 40;
  const listMode = cardStyle === "list";
  const cardBg = cardStyle === "card" ? colors.surfaceTransparent : "transparent";
  const { rootRef, onLayout, bgOpacity, reflectOpacity, reflectTarget, reflectPulse, barProgress } = useCenterHighlight();
  const comfortPad = density === "comfort" ? 4 : 0;
  const padSide = (cardPadding === "16" ? 16 : 12) + comfortPad;
  const isSport = SPORT_CATEGORIES.has(market.category.toUpperCase());
  // Sports-market header avatars (e.g. the MLB logo) are hidden unless the
  // "Sports market avatar" setting turns them on.
  const hasAvatar = showAvatar && (!!market.avatar || !!market.blankAvatar) && (!isSport || sportsMarketAvatar);
  const metaFont = 14;
  // Header timestamp ("Ends ..." date above the title) is 14px, matching the
  // match-card header timestamps; the footer/category stay at metaFont (14).
  const headerDateFont = 14;
  // Sports markets here are futures (e.g. "Who wins the MLB World Series?"),
  // not games, so their "Ends ..." date adds little — drop it.
  const showDate = !isSport;
  // The "Date in footer" setting relocates the "Ends ..." date from the header
  // to the footer (next to volume). It applies ONLY to these non-sports market
  // cards — sports match cards always keep their date in the header.
  const dateToFooter = standardDateInFooter && showDate;
  // "End date" (footerDetail.endDate) is the master visibility toggle for the
  // market's end date — when off, no date renders (header OR footer), matching
  // the other footer toggles. "Date placement" (dateToFooter) only chooses where
  // the date sits when it IS shown: footer next to volume vs. above the title.
  const wantDate = showDate && footerDetail.endDate;
  const footerShowsDate = wantDate && dateToFooter;
  const showHeaderDate = wantDate && !dateToFooter;
  // The "Ends " word is replaced by a 12px clock icon (4px gap) before the date.
  const dateText = market.date.replace(/^Ends\s+/i, "");

  const dateEl = showHeaderDate ? (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <Ionicons name="time-outline" size={14} color={colors.textMuted} />
      <Text style={{ fontFamily: geist.medium, fontSize: headerDateFont, lineHeight: 22, color: colors.textMuted }} numberOfLines={1}>
        {dateText}
      </Text>
    </View>
  ) : null;
  const questionEl = (
    <Text
      style={[{ fontFamily: geist.semibold, fontSize: 16, lineHeight: 24, color: colors.textPrimary }, hasAvatar && showHeaderDate ? { marginTop: -2 } : null]}
      numberOfLines={dateToFooter ? 2 : 1}
    >
      {market.question}
    </Text>
  );

  return (
    <View
      ref={rootRef}
      onLayout={onLayout}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: listMode ? 0 : 16,
        paddingHorizontal: listMode ? 0 : padSide,
        paddingTop: padSide,
        paddingBottom: showFooter ? padSide : 20,
        backgroundColor: cardBg,
        // UXR spec: 16px between the header block, outcome rows, and footer.
        gap: uxr ? 16 : 12,
      }}
    >
      <LightReflect progress={reflectOpacity} target={reflectTarget} pulse={reflectPulse} radius={16} />
      {!listMode && <LiveBorder placement="center" color="#fff" radius={16} />}
      {metaPlacement === "top" && (
        <View style={{ position: "absolute", top: padSide, right: padSide, flexDirection: "row", gap: 8, zIndex: 1 }}>
          <MetaTag metaStyle={metaStyle}>{market.category}</MetaTag>
        </View>
      )}

      {hasAvatar ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: avatarSize,
              height: avatarSize,
              borderRadius: 8,
              backgroundColor: market.avatarBg ?? colors.surface2,
              overflow: "hidden",
            }}
          >
            {market.avatar ? (
              <Image
                source={market.avatar}
                style={{
                  width: avatarSize,
                  height: avatarSize,
                  transform: market.avatarScale ? [{ scale: market.avatarScale }] : undefined,
                }}
                resizeMode={market.avatarContain ? "contain" : "cover"}
              />
            ) : null}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            {dateEl}
            {questionEl}
          </View>
        </View>
      ) : (
        <View style={{ gap: 4 }}>
          {dateEl}
          {questionEl}
        </View>
      )}

      <OutcomeRows
        outcomes={market.outcomes}
        buttonText={buttonText}
        buttonStyle={buttonStyle}
        buttonAnim={buttonAnim}
        buttonSize={buttonSize}
        animate={animate}
        liveBaseDelayMs={liveBaseDelayMs}
        staggerMs={staggerMs}
        bgOpacity={bgOpacity}
        barProgress={barProgress}
        sport={isSport}
        oldMode={oldMode}
        marketTitle={market.question}
        combo={combo}
      />

      {metaPlacement === "bottom" && showFooter && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {footerDetail.metadata && <MetaTag metaStyle={metaStyle}>{market.category}</MetaTag>}
          {footerDetail.volume && (
            <MetaChip volume tag={!uxr && (detailTags?.volume ?? true)} metaStyle={metaStyle}>{formatVol(market.vol)}</MetaChip>
          )}
          {footerShowsDate && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="time-outline" size={14} color={colors.textMuted} />
              <Text
                style={{ fontFamily: geist.medium, fontSize: metaFont, lineHeight: 20, color: colors.textMuted }}
                numberOfLines={1}
              >
                {dateText}
              </Text>
            </View>
          )}
          {footerDetail.outcomes && market.markets > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginLeft: "auto" }}>
              <OutcomesMeta
                count={market.markets}
                tag={!uxr && (detailTags?.outcomes ?? true)}
                metaStyle={metaStyle}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}
