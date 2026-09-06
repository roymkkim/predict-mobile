import React from "react";
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type ImageSourcePropType, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  ButtonIcon,
  ButtonIconSize,
  HeaderStandard,
  Icon,
  IconColor,
  IconName,
  IconSize,
  FontWeight,
  Text as DsText,
  TextColor,
  TextVariant,
} from "@metamask/design-system-react-native";
import { buttonInteractionStyle, METAMASK_BUTTON_LABEL, METAMASK_BUTTON_RADIUS } from "@/lib/sim/buttonStyle";
import { colors, MUTED_OUTLINE } from "@/lib/sim/colors";
import {
  COMBO_EMPTY_BODY_FROM_TITLE,
  COMBO_EMPTY_BODY_MARGIN_BOTTOM,
  COMBO_FILLED_HEADER_PADDING_BOTTOM,
  COMBO_NEXT_FOOTER_PADDING_TOP,
  COMBO_SHEET_CLOSE_EDGE_INSET,
  COMBO_SHEET_PANEL_TEST_ID,
  comboCartListAlwaysExpanded,
  comboCartEmptyExitsFlow,
  comboEmptyCloseKeepsFlow,
  comboCartFabLayout,
  comboCloseDropsOverlay,
  comboPayoutMultipleLabel,
  dockedComboSheetVisible,
} from "@/lib/sim/comboAffordance";
import { closeComboCartSlip, useComboAffordance, useComboCartSlipOpen } from "@/lib/sim/comboAffordanceStore";
import { useComboCartStyle } from "@/lib/sim/comboCartStyleStore";
import { beginExitComboFlow, exitComboFlow } from "@/lib/sim/comboFlowStore";
import { beginComboCartReturn, clearComboMorphOrigin, getComboMorphOrigin } from "@/lib/sim/comboMorphStore";
import { screenTopInset } from "@/lib/sim/layout";
import { SHEET_EASE, SHEET_HEADER_DISMISS_DY, SHEET_HEADER_DISMISS_VY, createSheetHeaderPan, sheetEnter, sheetExit, sheetMorph, sheetResize } from "@/lib/sim/sheetMotion";
import { comboSheetListMaxH, comboSheetListShownH, comboSheetMaxStretch, sheetHeaderDismissAfterStretch, sheetHeaderStretchFromDy, sheetHeaderStretchSnap } from "@/lib/sim/comboSheetStretch";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { addPlacedPosition } from "@/lib/sim/positionsStore";
import { geist } from "@/lib/sim/geistFonts";
import { BuyAction } from "@/components/sim/BuyAction";
import { PayWithSummaryRow, SummaryRow } from "@/components/sim/BetSlipRows";
import {
  ComboGradientFill,
  ComboGradientText,
  ComboOuterGradientStroke,
  COMBO_SHEET_GRADIENT_BORDER,
} from "@/components/sim/ComboGradient";
import { ComboCartCountBadge } from "@/components/sim/ComboFab";
import { ComboMark } from "@/components/sim/ComboMark";
import { ComboLegAvatar } from "@/components/sim/ComboLegAvatar";
import { ComboLegSwapButton } from "@/components/sim/ComboLegSwapButton";
import { LinePicker } from "@/components/sim/LinePicker";
import { MARKET_DETAIL_NAV_H } from "@/components/sim/MarketDetailHeader";
import { comboLegCopy } from "@/lib/sim/comboLegCopy";
import { MetaChip } from "@/components/sim/MetaHeader";
import {
  comboPickAtSpreadIndex,
  comboPickAtTotalsIndex,
  comboPickIsOu,
  comboPickIsSpread,
  comboPickStripKey,
  comboSpreadPickerState,
  comboTotalsPickerState,
  flipComboPick,
} from "@/lib/sim/comboPickEdit";
import { resolveComboAvatar } from "@/lib/sim/comboTeamMark";
import { useComboSheetBorder, type ComboSheetBorder } from "@/lib/sim/comboSheetBorderStore";
import { useComboLineSlider } from "@/lib/sim/comboLineSliderStore";
import { setComboSheetHeight } from "@/lib/sim/comboSheetHeightStore";
import { useBetRadius } from "@/lib/sim/pillButtonsStore";
import { useDisplayFont, useOswaldDataSet } from "@/lib/sim/typefaceStore";
import { useUxrMode } from "@/lib/sim/uxrModeStore";
import {
  COMBO_HEADER_STAKE,
  comboPaysCopy,
  comboToWin,
  comboToWinCopy,
  fmtComboPaysAmount,
} from "@/lib/sim/comboPays";

export { COMBO_HEADER_STAKE, comboPaysCopy, comboToWin, comboToWinCopy, fmtComboPaysAmount };

// Docked COMBO ticket sheet. Screens (vertical page transitions, one height
// driver): 0 = tray (N markets + optional expand + Next), 1 = bet slip
// (amount / swipe-to-buy), 2 = markets list (same legs as the tray, back
// arrow, no Next). Amount header uses a right chevron to open screen 2.

const MUTED_SHEET_BORDER = 1;

/** Kill RN-web :focus outline on combo-sheet chrome only (not a global reset). */
const WEB_NO_FOCUS_RING: ViewStyle | undefined =
  Platform.OS === "web"
    ? ({
        outline: "none",
        outlineWidth: 0,
        outlineStyle: "none",
        boxShadow: "none",
        WebkitTapHighlightColor: "transparent",
      } as ViewStyle)
    : undefined;

const WEB_SHEET_GRAB: ViewStyle | undefined =
  Platform.OS === "web"
    ? ({ touchAction: "none", userSelect: "none", cursor: "ns-resize" } as ViewStyle)
    : undefined;

function isComboSheetCloseTarget(target: unknown): boolean {
  if (typeof Element === "undefined" || !(target instanceof Element)) return false;
  return Boolean(
    target.closest('[aria-label="Close combo slip"], [aria-label="Exit combo"], [aria-label="Close combo"]'),
  );
}

function comboSheetPad(mode: ComboSheetBorder): number {
  return mode === "gradient" ? COMBO_SHEET_GRADIENT_BORDER : MUTED_SHEET_BORDER;
}

function ComboSheetChrome({
  mode,
  style,
  children,
  hideRing = false,
}: {
  mode: ComboSheetBorder;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  hideRing?: boolean;
}) {
  // Morph: skip sheet chrome so the 1px gradient ring is not interpolated with the frame.
  if (hideRing) {
    return <View style={style}>{children}</View>;
  }
  if (mode === "gradient") {
    return <ComboGradientFill style={style}>{children}</ComboGradientFill>;
  }
  // MetaMask border/muted: #E2E2FF at 15%.
  return <View style={[style, { backgroundColor: "rgba(226, 226, 255, 0.15)" }]}>{children}</View>;
}

export type ComboPick = {
  id: string; // `${gameId}:${side}`
  category: string;
  categoryIcon?: ImageSourcePropType;
  categoryEmoji?: string;
  label: string; // "Packers · Packers vs Steelers"
  color: string; // palette dot / accent
  cents: number; // price in cents
  side?: "yes" | "no";
  avatar?: ImageSourcePropType;
  kind?: "ml" | "spread" | "ou";
  sport?: string;
  /** Market window, e.g. soccer "Regulation time" vs "Full game". */
  period?: string;
  line?: number;
  lines?: number[];
  /** Cached 3-way ML prices so tray swap can cycle Home / Draw / Away. */
  mlPrices?: { home: number; draw: number; away: number };
  alt?: {
    id: string;
    label: string;
    color: string;
    cents: number;
    avatar?: ImageSourcePropType;
  };
};

const QUICK_AMOUNTS = [20, 50, 100] as const;
const BALANCE = 950.22;

type ComboSheetScreen = 0 | 1 | 2;

function ComboSheetClose({
  onPress,
  label,
  right = COMBO_SHEET_CLOSE_EDGE_INSET,
}: {
  onPress: () => void;
  label: string;
  right?: number;
}) {
  return (
    <View
      pointerEvents="box-none"
      style={{ position: "absolute", right, top: 0, bottom: 0, justifyContent: "center", zIndex: 2 }}
    >
      <ButtonIcon
        iconName={IconName.Close}
        size={ButtonIconSize.Md}
        iconProps={{ color: IconColor.IconDefault }}
        onPress={onPress}
        accessibilityLabel={label}
      />
    </View>
  );
}

function CenteredSheetTitle({
  title,
  chevron,
  onPress,
  subtitle,
}: {
  title: string;
  chevron?: (typeof IconName)[keyof typeof IconName];
  onPress?: () => void;
  subtitle?: React.ReactNode;
}) {
  const displayFont = useDisplayFont();
  const oswald = useOswaldDataSet();
  const body = (
    <>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, alignSelf: "center" }}>
        <DsText
          {...oswald}
          variant={TextVariant.HeadingSm}
          color={TextColor.TextDefault}
          style={{ fontFamily: displayFont }}
        >
          {title}
        </DsText>
        {chevron ? <Icon name={chevron} size={IconSize.Sm} color={IconColor.IconAlternative} /> : null}
      </View>
      {subtitle == null || subtitle === false ? null : typeof subtitle === "string" ? (
        <View style={{ alignSelf: "center" }}>
          <ComboGradientText animate style={{ fontFamily: geist.medium, fontSize: 14, lineHeight: 20, textAlign: "center" }}>
            {subtitle}
          </ComboGradientText>
        </View>
      ) : (
        <View style={{ alignSelf: "center", width: "100%" }}>{subtitle}</View>
      )}
    </>
  );
  if (!onPress) {
    return <View style={{ minHeight: 28, width: "100%", alignItems: "center", justifyContent: "center" }}>{body}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[{ minHeight: 28, width: "100%", alignItems: "center", justifyContent: "center" }, WEB_NO_FOCUS_RING]}
    >
      {body}
    </Pressable>
  );
}

const PAYOUT_TICKER_H = 20;
const PAYOUT_TICKER_HOLD_MS = 3000;
const PAYOUT_TICKER_SWAP_MS = 200;

function usePrefersReducedMotion(): boolean {
  const [enabled, setEnabled] = React.useState(false);
  React.useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined" && typeof window.matchMedia === "function") {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      setEnabled(mq.matches);
      const onChange = (e: MediaQueryListEvent) => setEnabled(e.matches);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setEnabled(v);
    });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setEnabled);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  return enabled;
}

/** One-line payout ticker: two phrases, 3s hold / 200ms fade. Fixed height so the sheet doesn't jump. */
function ComboPayoutTicker({
  lines,
  active,
}: {
  lines: readonly [string, string];
  active: boolean;
}) {
  const reduceMotion = usePrefersReducedMotion();
  const anim = React.useRef(new Animated.Value(0)).current;
  const target = React.useRef(0);
  const type = { fontFamily: geist.medium, fontSize: 14, lineHeight: PAYOUT_TICKER_H, textAlign: "center" as const };

  React.useEffect(() => {
    if (!active) return;
    const tick = () => {
      target.current = target.current === 0 ? 1 : 0;
      if (reduceMotion) {
        anim.setValue(target.current);
        return;
      }
      Animated.timing(anim, {
        toValue: target.current,
        duration: PAYOUT_TICKER_SWAP_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    };
    const id = setInterval(tick, PAYOUT_TICKER_HOLD_MS);
    return () => {
      clearInterval(id);
      anim.stopAnimation();
    };
  }, [active, reduceMotion, anim]);

  return (
    <View
      style={{
        height: PAYOUT_TICKER_H,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
      }}
    >
      {lines.map((label, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            alignItems: "center",
            opacity: anim.interpolate({
              inputRange: [0, 1],
              outputRange: i === 0 ? [1, 0] : [0, 1],
            }),
          }}
        >
          <ComboGradientText animate style={type}>
            {label}
          </ComboGradientText>
        </Animated.View>
      ))}
    </View>
  );
}

function ComboPickRow({
  p,
  onRemove,
  onReplace,
  underCaretHairline = true,
  lineSlider = true,
}: {
  p: ComboPick;
  onRemove: (id: string) => void;
  onReplace?: (id: string, next: ComboPick) => void;
  /** False when a longer full-bleed divider follows — caret sits on that line. */
  underCaretHairline?: boolean;
  /** Spread / totals LinePicker. Off also hides swap on those markets. */
  lineSlider?: boolean;
}) {
  const { pick: headline, sub, tag } = comboLegCopy(p.label, {
    kind: p.kind,
    id: p.id,
    sport: p.sport,
    category: p.category,
    period: p.period,
  });
  const flipped = onReplace ? flipComboPick(p) : null;
  const spread = Boolean(onReplace && comboPickIsSpread(p));
  const totals = Boolean(onReplace && comboPickIsOu(p));
  const lineMarket = spread || totals;
  const strip = lineSlider && (spread ? comboSpreadPickerState(p) : totals ? comboTotalsPickerState(p) : null);
  const mark = resolveComboAvatar(p.label, p.avatar);
  const showSwap = Boolean(flipped && (!lineMarket || lineSlider));

  return (
    <View style={{ gap: 0 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <ComboLegAvatar source={mark} pick={p.label} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, minWidth: 0 }}>
            <DsText
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
              color={TextColor.TextDefault}
              numberOfLines={1}
              style={{ flexShrink: 1 }}
            >
              {headline}
            </DsText>
            {showSwap && flipped ? <ComboLegSwapButton onPress={() => onReplace?.(p.id, flipped)} /> : null}
          </View>
          {sub || tag ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, minWidth: 0 }}>
              {sub ? (
                <DsText variant={TextVariant.BodySm} color={TextColor.TextAlternative} numberOfLines={1} style={{ flexShrink: 1 }}>
                  {sub}
                </DsText>
              ) : null}
              {tag ? <MetaChip tag>{tag}</MetaChip> : null}
            </View>
          ) : null}
        </View>
        <ButtonIcon
          iconName={IconName.RemoveMinus}
          size={ButtonIconSize.Xs}
          iconProps={{ color: IconColor.IconAlternative, size: IconSize.Md }}
          onPress={() => onRemove(p.id)}
          accessibilityLabel="Remove pick"
        />
      </View>
      {strip && onReplace ? (
        <View style={{ marginTop: 8 }}>
          <LinePicker
            labels={strip.labels}
            dividerAt={"dividerAt" in strip ? strip.dividerAt : undefined}
            index={strip.index}
            fadeColor={colors.bg}
            edge={20}
            underCaretHairline={underCaretHairline}
            onIndex={(i) =>
              onReplace(p.id, spread ? comboPickAtSpreadIndex(p, i) : comboPickAtTotalsIndex(p, i))
            }
          />
        </View>
      ) : null}
    </View>
  );
}

const SHEET_H_PAD = 20;
const LEG_DIVIDER_INSET = 16;
/** Scroll-only inset when the list is clipped to max height (LinePicker on last row). */
const COMBO_SLIP_OVERFLOW_PAD = 56;

function ComboPicksBody({
  grouped,
  onRemove,
  onReplace,
}: {
  grouped: Record<string, ComboPick[]>;
  onRemove: (id: string) => void;
  onReplace?: (id: string, next: ComboPick) => void;
}) {
  const lineSlider = useComboLineSlider();
  const cats = Object.entries(grouped);
  return (
    <View>
      {cats.map(([cat, rows], catIdx) => {
        const prevRows = catIdx > 0 ? cats[catIdx - 1][1] : [];
        const prevLast = prevRows[prevRows.length - 1];
        const prevLastStrip = Boolean(
          lineSlider && prevLast && onReplace && (comboPickIsSpread(prevLast) || comboPickIsOu(prevLast)),
        );
        return (
        <View key={cat}>
          {catIdx > 0 ? (
            <View style={{ paddingTop: prevLastStrip ? 0 : 32, paddingBottom: 32 }}>
              <View
                style={{
                  height: StyleSheet.hairlineWidth,
                  backgroundColor: MUTED_OUTLINE,
                  marginHorizontal: -SHEET_H_PAD,
                }}
              />
            </View>
          ) : null}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
            <Text
              style={{
                fontFamily: geist.medium,
                fontSize: 12,
                lineHeight: 16,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                color: colors.textMuted,
              }}
            >
              {cat}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Delete all ${cat} picks`}
              onPress={() => rows.forEach((p) => onRemove(p.id))}
              hitSlop={8}
              style={WEB_NO_FOCUS_RING}
            >
              <Text style={{ fontFamily: geist.medium, fontSize: 13, lineHeight: 18, color: colors.textMuted }}>
                Delete all
              </Text>
            </Pressable>
          </View>
          {rows.map((p, i) => {
            const lineStrip = Boolean(
              lineSlider && onReplace && (comboPickIsSpread(p) || comboPickIsOu(p)),
            );
            const lastInCat = i === rows.length - 1;
            const lastCat = catIdx === cats.length - 1;
            // Longer full-bleed line follows: next category, or end of slip (Next).
            const longerFollows = lineStrip && lastInCat;
            // LinePicker inset vs another inset: skip stacking. Keep inset when
            // the next divider is also inset (or there is none yet in-category).
            const betweenLeg = i < rows.length - 1 && !lineStrip;
            return (
              <View key={comboPickStripKey(p)}>
                <ComboPickRow
                  p={p}
                  onRemove={onRemove}
                  onReplace={onReplace}
                  underCaretHairline={lineStrip && !longerFollows}
                  lineSlider={lineSlider}
                />
                {betweenLeg ? (
                  <View
                    style={{
                      height: StyleSheet.hairlineWidth,
                      backgroundColor: MUTED_OUTLINE,
                      marginHorizontal: -(SHEET_H_PAD - LEG_DIVIDER_INSET),
                      marginVertical: 12,
                    }}
                  />
                ) : null}
                {lineStrip && lastInCat && lastCat ? (
                  <View
                    style={{
                      height: StyleSheet.hairlineWidth,
                      backgroundColor: MUTED_OUTLINE,
                      marginHorizontal: -SHEET_H_PAD,
                    }}
                  />
                ) : null}
              </View>
            );
          })}
        </View>
        );
      })}
    </View>
  );
}

function fmtPayoutAmount(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `$${k >= 100 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, "")}K`;
  }
  return `$${n.toFixed(2)}`;
}

export function comboPayoutParts(picks: ComboPick[], stake: number): { multiple: string; range: string } {
  const profit = comboToWin(picks, stake);
  const total = stake + profit;
  const multiple = stake > 0 ? total / stake : 0;
  return {
    multiple: `${multiple.toFixed(1)}X payout`,
    range: `${fmtPayoutAmount(stake)} → ${fmtPayoutAmount(total)}`,
  };
}

export function comboPayoutCopy(picks: ComboPick[], stake: number): string {
  const { multiple, range } = comboPayoutParts(picks, stake);
  return `${multiple} · ${range}`;
}

type ComboSheetProps = {
  picks: ComboPick[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onReplace?: (id: string, next: ComboPick) => void;
  // COMBO-mode pages keep the slip always visible; with no picks the Next
  // button is disabled instead of the sheet dismissing.
  docked?: boolean;
  // Open directly on a screen (1 = amount) — used by the home-feed preview
  // "Buy", which arrives with its picks pre-selected.
  initialScreen?: 0 | 1;
  // Open with the picks breakdown fully expanded (screen 0) — used when a
  // preview card body (not its Buy button) opens the slip.
  initialExpanded?: boolean;
  // Where the trade-submitted screen should return the user on exit
  // (defaults to the positions page).
  returnTo?: string;
  onClose?: () => void;
  /** Y of the page header’s bottom edge. Drag-up grows the sheet up to this line. */
  maxTop?: number;
};

export function ComboSheet(props: ComboSheetProps) {
  const affordance = useComboAffordance();
  const slipOpen = useComboCartSlipOpen();
  const pathname = usePathname();
  if (
    !dockedComboSheetVisible({
      affordance,
      docked: props.docked ?? false,
      pickCount: props.picks.length,
      slipOpen,
      pathname,
    })
  ) {
    return null;
  }
  return <ComboSheetBody {...props} />;
}

function ComboSheetBody({
  picks,
  onRemove,
  onClear,
  onReplace,
  docked = false,
  initialScreen = 0,
  initialExpanded = false,
  returnTo,
  onClose,
  maxTop,
}: ComboSheetProps) {
  const { width: winW, height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { sports } = useLocalSearchParams<{ sports?: string }>();
  const sportsFlag = Array.isArray(sports) ? sports[0] : sports;
  const uxr = useUxrMode() === "uxr";
  const sheetBorder = useComboSheetBorder();
  const borderPad = comboSheetPad(sheetBorder);
  const chipBg = uxr ? "rgba(255,255,255,0.08)" : colors.surface2;
  const betR = useBetRadius();
  const displayFont = useDisplayFont();
  const oswald = useOswaldDataSet();
  const cartMode = useComboAffordance() === "cart";
  const cartStyle = useComboCartStyle();
  const listAlwaysExpanded = comboCartListAlwaysExpanded(cartMode ? "cart" : "sheet");
  const [origin, setOrigin] = React.useState(() => getComboMorphOrigin());
  const morphing = Boolean(origin && docked);
  const morph = React.useRef(new Animated.Value(morphing ? 0 : 1)).current;
  const frameH = React.useRef(new Animated.Value(origin?.height ?? 0)).current;
  const [morphDone, setMorphDone] = React.useState(!morphing);
  const morphDoneRef = React.useRef(!morphing);
  morphDoneRef.current = morphDone;
  const [morphClosing, setMorphClosing] = React.useState(false);
  const morphClosingRef = React.useRef(false);
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;
  const onClearRef = React.useRef(onClear);
  onClearRef.current = onClear;
  const cartModeRef = React.useRef(cartMode);
  cartModeRef.current = cartMode;
  const [expanded, setExpanded] = React.useState(listAlwaysExpanded || initialExpanded);
  const expandedRef = React.useRef(listAlwaysExpanded || initialExpanded);
  expandedRef.current = listAlwaysExpanded || expanded;
  const stretchExtra = React.useRef(0);
  const [stretchPx, setStretchPx] = React.useState(0);
  const [screen, setScreen] = React.useState<ComboSheetScreen>(initialScreen); // 0 tray · 1 amount · 2 list
  const [amountStr, setAmountStr] = React.useState("100");
  const [keypadOpen, setKeypadOpen] = React.useState(false);
  const keypadOpenRef = React.useRef(false);
  keypadOpenRef.current = keypadOpen;
  const stake = parseFloat(amountStr) || 0;

  // Entrance/exit (translateY, native) — mounts while visible or animating out.
  const present = docked || picks.length > 0;
  const [render, setRender] = React.useState(present);
  const enter = React.useRef(new Animated.Value(docked || morphing ? 1 : 0)).current;
  React.useEffect(() => {
    if (morphing) {
      setRender(true);
      sheetMorph(morph, 1).start(({ finished }) => {
        if (finished) {
          setMorphDone(true);
          clearComboMorphOrigin();
        }
      });
      return;
    }
    if (present) {
      if (!render) {
        // Fresh open: honor the CURRENT initial props (they can change between
        // opens — e.g. card tap = expanded picks, Buy = amount screen).
        setScreen(initialScreen);
        screenRef.current = initialScreen;
        slide.setValue(initialScreen);
        setExpanded(listAlwaysExpanded || initialExpanded);
      }
      setRender(true);
      sheetEnter(enter).start();
    } else if (render) {
      sheetExit(enter).start(({ finished }) => {
        if (finished) {
          // Reset every screen-driving value together so the next ticket
          // always reopens on the picks screen at the right height.
          setRender(false);
          setExpanded(false);
          setScreen(initialScreen);
          screenRef.current = initialScreen;
          slide.setValue(initialScreen);
          lastH.current = 0;
          sheetH.setValue(0);
          listH.setValue(0);
          stretchExtra.current = 0;
          setStretchPx(0);
          setKeypadOpen(false);
          setAmountStr("100");
        }
      });
    }
  }, [present]);

  React.useEffect(() => {
    if (!morphClosing || !origin) return;
    Animated.parallel([
      sheetMorph(morph, 0),
      sheetMorph(frameH, origin.height),
    ]).start(({ finished }) => {
      if (finished) {
        if (cartModeRef.current) closeComboCartSlip();
        else onCloseRef.current?.();
      }
    });
  }, [morphClosing, origin]);

  // Height driver (non-native): animate to the active screen's measured height.
  // Screen 0 is chrome (header + Next) + an animated list clip so the CTA stays
  // pinned to the bottom of the sheet while the picks list opens above it.
  const heights = React.useRef<[number, number, number]>([0, 0, 0]);
  const sheetH = React.useRef(new Animated.Value(0)).current;
  const listH = React.useRef(new Animated.Value(0)).current;
  const lastH = React.useRef(0);
  const snapHeight = React.useRef(false);
  const dockedRef = React.useRef(docked);
  dockedRef.current = docked;
  const borderPadRef = React.useRef(borderPad);
  borderPadRef.current = borderPad;
  const publishDockedHeight = React.useCallback((h: number) => {
    if (!dockedRef.current || h <= 0) return;
    setComboSheetHeight(h);
  }, []);
  const amountBaseH = React.useRef(0);
  const keypadBlockH = React.useRef(232);
  const topH = React.useRef(0);
  const footerH = React.useRef(0);
  const listNatural = React.useRef(0);
  const animatingList = React.useRef(false);
  const [listOverflowPad, setListOverflowPad] = React.useState(0);
  const winHRef = React.useRef(winH);
  winHRef.current = winH;
  const ceilingRef = React.useRef(0);
  ceilingRef.current = maxTop ?? Math.max(screenTopInset(insets.top), 12) + MARKET_DETAIL_NAV_H;
  const stretchLayout = () => ({
    winH: winHRef.current,
    topH: topH.current,
    footerH: footerH.current,
    ceiling: ceilingRef.current,
    chrome: borderPadRef.current,
  });
  // Compact half-sheet; drag-up on the header grows toward the page header.
  const listMaxH = () => comboSheetListMaxH({ ...stretchLayout(), stretch: stretchExtra.current });
  const listShownH = () =>
    comboSheetListShownH({
      expanded: expandedRef.current,
      listNatural: listNatural.current,
      listMaxH: listMaxH(),
      stretch: stretchExtra.current,
    });
  const screen0Height = () => topH.current + footerH.current + listShownH();
  const applyHeight = React.useCallback(
    (which: ComboSheetScreen, h: number) => {
      heights.current[which] = h;
      if (which !== screenRef.current) return;
      if (lastH.current === 0 || snapHeight.current) {
        snapHeight.current = false;
        sheetH.setValue(h);
      } else if (Math.abs(h - lastH.current) > 1) {
        sheetResize(sheetH, h).start();
      }
      lastH.current = h;
      publishDockedHeight(h + borderPadRef.current);
    },
    [sheetH, publishDockedHeight],
  );
  const screenRef = React.useRef<ComboSheetScreen>(initialScreen);

  const commitScreen0 = React.useCallback(
    (animate: boolean) => {
      const listTarget = listShownH();
      const target = topH.current + footerH.current + listTarget;
      heights.current[0] = target;
      if (target <= 0) return;
      if (!animate || lastH.current === 0 || screenRef.current !== 0) {
        listH.setValue(listTarget);
        lastH.current = target;
        if (morphing && !morphDoneRef.current && target > 0) {
          sheetMorph(frameH, target).start();
        }
        publishDockedHeight(target + borderPadRef.current);
        return;
      }
      animatingList.current = true;
      lastH.current = target;
      publishDockedHeight(target + borderPadRef.current);
      sheetResize(listH, listTarget).start(({ finished }) => {
        if (finished) animatingList.current = false;
      });
    },
    [listH, winH, publishDockedHeight],
  );

  const skipExpandEffect = React.useRef(true);
  React.useEffect(() => {
    if (skipExpandEffect.current) {
      skipExpandEffect.current = false;
      return;
    }
    if (!expanded) {
      stretchExtra.current = 0;
      setStretchPx(0);
    }
    commitScreen0(true);
  }, [expanded, commitScreen0]);

  // Vertical transition: 0↔1 resizes the clip while both screens stay pinned
  // to the sheet bottom (Next / swipe stay full height; the top edge eases).
  // 1↔2 is a same-height horizontal slide (amount left, list from the right).
  const slide = React.useRef(new Animated.Value(initialScreen)).current;
  const [settled, setSettled] = React.useState(true);
  const pressDigit = (d: string) => {
    setAmountStr((s) => {
      if (d === ".") {
        if (s.includes(".")) return s;
        return s === "" ? "0." : s + ".";
      }
      if (s === "0") return d;
      const next = s + d;
      if (next.replace(".", "").length > 7) return s;
      const dot = next.indexOf(".");
      if (dot >= 0 && next.length - dot - 1 > 2) return s;
      return next;
    });
  };
  const pressBack = () => setAmountStr((s) => s.slice(0, -1));

  const capAmountH = (h: number) => {
    if (h <= 0) return 0;
    // Closed amount screen rejects stretch-to-parent noise (>62%). With the
    // keypad open the sheet must hug the taller content — clamp, don't drop.
    const max = winHRef.current * (keypadOpenRef.current ? 0.92 : 0.62);
    if (keypadOpenRef.current) return Math.min(h, max);
    return h > max ? 0 : h;
  };
  // Screens 1 and 2 share the bet-slip height so 1↔2 slides, not a resize.
  const amountHeight = () => capAmountH(amountBaseH.current || heights.current[1]);
  const heightOf = (s: ComboSheetScreen) => {
    if (s === 0) return screen0Height();
    return amountHeight();
  };
  const go = (next: ComboSheetScreen) => {
    if (next !== 1) setKeypadOpen(false);
    const from = heightOf(screenRef.current);
    if (next === 0) heights.current[0] = screen0Height();
    const to = heightOf(next);
    if (from > 0) sheetH.setValue(from);
    setScreen(next);
    screenRef.current = next;
    setSettled(false);
    Animated.timing(slide, { toValue: next, duration: 350, easing: SHEET_EASE, useNativeDriver: true }).start(({ finished }) => {
      if (finished) setSettled(true);
    });
    if (to > 0 && Math.abs(to - from) > 1) {
      sheetResize(sheetH, to).start();
      lastH.current = to;
    } else if (to > 0) {
      lastH.current = to;
    }
  };
  // Header drag: up grows toward the page header; down dismisses from compact.
  // Vertical-only so it does not steal the amount ↔ list horizontal slide.
  const dragY = React.useRef(new Animated.Value(0)).current;
  const collapseSheetRef = React.useRef<() => void>(() => {});
  const headerPanEnabled = React.useRef(true);
  const applyStretchRef = React.useRef(() => {});
  applyStretchRef.current = () => {
    commitScreen0(false);
  };
  const applyStretchValue = React.useCallback((next: number) => {
    if (screenRef.current !== 0) return;
    if (stretchExtra.current === next) return;
    stretchExtra.current = next;
    setStretchPx(next);
    applyStretchRef.current();
  }, []);
  const snapStretchRef = React.useRef((next: number) => {});
  snapStretchRef.current = (next: number) => {
    if (screenRef.current !== 0) return;
    stretchExtra.current = next;
    setStretchPx(next);
    commitScreen0(true);
  };
  const headerPan = React.useRef(
    createSheetHeaderPan({
      dragY,
      onDismiss: () => collapseSheetRef.current(),
      enabled: () => headerPanEnabled.current,
      stretch: {
        get: () => (screenRef.current === 0 ? stretchExtra.current : 0),
        max: () => {
          if (screenRef.current !== 0) return 0;
          if (!expandedRef.current) return 0;
          if (!morphDoneRef.current || morphClosingRef.current) return 0;
          return comboSheetMaxStretch(stretchLayout());
        },
        set: (next) => applyStretchValue(next),
        snap: (next) => snapStretchRef.current(next),
        onUpward: () => {
          if (expandedRef.current) return;
          expandedRef.current = true;
          setExpanded(true);
        },
      },
    }),
  ).current;

  const onWebHeaderPointerDown = (e: { nativeEvent: { pageY: number; target?: unknown }; preventDefault?: () => void }) => {
    if (Platform.OS !== "web") return;
    if (!headerPanEnabled.current) return;
    if (isComboSheetCloseTarget(e.nativeEvent.target)) return;
    e.preventDefault?.();
    const startY = e.nativeEvent.pageY;
    const startStretch = screenRef.current === 0 ? stretchExtra.current : 0;
    const move = (ev: PointerEvent) => {
      ev.preventDefault();
      const dy = ev.pageY - startY;
      if (dy < 0 && !expandedRef.current) {
        expandedRef.current = true;
        setExpanded(true);
      }
      const max =
        screenRef.current !== 0 || !expandedRef.current || !morphDoneRef.current || morphClosingRef.current
          ? 0
          : comboSheetMaxStretch(stretchLayout());
      const next = sheetHeaderStretchFromDy(startStretch, dy, max);
      applyStretchValue(next.stretch);
      dragY.setValue(next.dismissDy);
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      const dy = ev.pageY - startY;
      const vy = 0;
      const max =
        screenRef.current !== 0 || !expandedRef.current || !morphDoneRef.current || morphClosingRef.current
          ? 0
          : comboSheetMaxStretch(stretchLayout());
      const next = sheetHeaderStretchFromDy(startStretch, dy, max);
      if (
        sheetHeaderDismissAfterStretch({
          startStretch,
          stretch: next.stretch,
          dy,
          vy,
          dismissDy: SHEET_HEADER_DISMISS_DY,
          dismissVy: SHEET_HEADER_DISMISS_VY,
        })
      ) {
        collapseSheetRef.current();
      } else {
        snapStretchRef.current(sheetHeaderStretchSnap(next.stretch, max, vy));
      }
      dragY.setValue(0);
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };
  const webHeaderGrab =
    Platform.OS === "web" ? { onPointerDown: onWebHeaderPointerDown } : headerPan.panHandlers;

  const picksStyle = {
    opacity: slide.interpolate({ inputRange: [0, 0.55, 1, 2], outputRange: [1, 0, 0, 0] }),
  };
  const amountStyle = {
    opacity: slide.interpolate({ inputRange: [0, 0.45, 1, 2], outputRange: [0, 0, 1, 1] }),
    transform: [{ translateX: slide.interpolate({ inputRange: [0, 1, 2], outputRange: [0, 0, -winW] }) }],
  };
  const reviewStyle = {
    opacity: slide.interpolate({ inputRange: [0, 0.99, 1, 2], outputRange: [0, 0, 1, 1] }),
    transform: [{ translateX: slide.interpolate({ inputRange: [1, 2], outputRange: [winW, 0], extrapolate: "clamp" }) }],
  };

  // Docked mode never dismisses; when the last pick is removed (or Buy
  // clears), fall back to the collapsed picks bar.
  React.useEffect(() => {
    if (docked && picks.length === 0) {
      setExpanded(false);
      stretchExtra.current = 0;
      setStretchPx(0);
      listNatural.current = 0;
      setListOverflowPad(0);
      if (screenRef.current !== 0) go(0);
    }
  }, [docked, picks.length]);

  React.useEffect(() => {
    if (!docked) return;
    const sub = sheetH.addListener(({ value }) => {
      if (value > 0) setComboSheetHeight(value + borderPadRef.current);
    });
    return () => {
      sheetH.removeListener(sub);
      setComboSheetHeight(0);
    };
  }, [docked, sheetH]);

  if (!render) return null;

  const empty = picks.length === 0;

  const toWin = comboToWin(picks, screen === 0 ? 10 : stake);
  const grouped = picks.reduce<Record<string, ComboPick[]>>((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {});

  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [420, 0] });
  const originFrame = origin;
  const startRadius = originFrame ? Math.min(originFrame.radius, originFrame.height / 2) : 12;
  const startBottom = originFrame ? originFrame.windowHeight - originFrame.y - originFrame.height : 0;
  const startRight = originFrame ? originFrame.windowWidth - originFrame.x - originFrame.width : 0;
  const morphingFrame = Boolean(originFrame && morphing && (!morphDone || morphClosing));
  const chromePad = morphingFrame ? 0 : borderPad;
  const innerStartR = Math.max(0, startRadius - chromePad);
  const innerEndTopR = 28 - chromePad;
  // Portfolio / preview Buy more is undocked and has no cart morph origin.
  // closeComboCartSlip / beginExitComboFlow no-op there and left the amount
  // screen unclosable. Drop picks (or the caller's overlay) instead of FAB.
  const dismissUndockedOverlay = () => {
    closeComboCartSlip();
    if (onCloseRef.current) onCloseRef.current();
    else onClearRef.current();
  };
  const exitCategoryToZeroState = () => {
    closeComboCartSlip();
    if (beginComboCartReturn()) return;
    exitComboFlow();
    router.setParams({ combo: "" });
  };
  const closeToCartFab = () => {
    if (morphClosingRef.current) return;
    const cart = comboCartFabLayout(winW, winH, insets.bottom, {
      itemCount: picks.length,
      payoutLabel: picks.length >= 1 ? comboPayoutMultipleLabel(picks) : undefined,
      safeRight: insets.right,
    });
    const next = {
      x: cart.x,
      y: cart.y,
      width: cart.width,
      height: cart.height,
      windowWidth: winW,
      windowHeight: winH,
      radius: cart.radius,
    };
    morphClosingRef.current = true;
    frameH.setValue(lastH.current > 0 ? lastH.current : next.height);
    morph.setValue(1);
    setOrigin(next);
    setMorphDone(false);
    setMorphClosing(true);
  };
  const handleClose = () => {
    if (morphClosingRef.current) return;
    if (comboCloseDropsOverlay(docked)) {
      dismissUndockedOverlay();
      return;
    }
    if (picks.length === 0 && comboCartEmptyExitsFlow(pathname, sportsFlag)) {
      exitCategoryToZeroState();
      return;
    }
    if (cartMode) {
      closeToCartFab();
      return;
    }
    if (picks.length === 0 && comboEmptyCloseKeepsFlow(pathname)) {
      closeComboCartSlip();
      return;
    }
    if (!onClose) {
      setExpanded(false);
      if (screenRef.current !== 0) go(0);
      return;
    }
    beginExitComboFlow();
    if (morphClosingRef.current) {
      onClose();
      return;
    }
    if (!origin) {
      sheetExit(enter).start(({ finished }) => {
        if (finished) onCloseRef.current?.();
      });
      return;
    }
    morphClosingRef.current = true;
    frameH.setValue(lastH.current > 0 ? lastH.current : origin.height);
    morph.setValue(1);
    setMorphDone(false);
    setMorphClosing(true);
  };
  const handleCollapse = () => {
    if (morphClosingRef.current) return;
    if (comboCloseDropsOverlay(docked)) {
      dismissUndockedOverlay();
      return;
    }
    if (picks.length === 0 && comboCartEmptyExitsFlow(pathname, sportsFlag)) {
      exitCategoryToZeroState();
      return;
    }
    if (cartMode) {
      closeToCartFab();
      return;
    }
    if (picks.length === 0 && comboEmptyCloseKeepsFlow(pathname)) {
      closeComboCartSlip();
      return;
    }
    if (picks.length > 0 && !listAlwaysExpanded && expandedRef.current) {
      stretchExtra.current = 0;
      setStretchPx(0);
      setExpanded(false);
      if (screenRef.current !== 0) go(0);
      return;
    }
    setExpanded(false);
    if (screenRef.current !== 0) go(0);
  };
  collapseSheetRef.current = handleCollapse;
  headerPanEnabled.current = morphDoneRef.current && !morphClosingRef.current;
  const sheetFrameStyle = morphingFrame
    ? {
        position: "absolute" as const,
        zIndex: 65,
        overflow: (morphClosing ? "visible" : "hidden") as "visible" | "hidden",
        left: morph.interpolate({ inputRange: [0, 1], outputRange: [originFrame.x, 0] }),
        right: morph.interpolate({ inputRange: [0, 1], outputRange: [startRight, 0] }),
        bottom: morph.interpolate({ inputRange: [0, 1], outputRange: [startBottom, 0] }),
        height: frameH,
        borderTopLeftRadius: morph.interpolate({ inputRange: [0, 1], outputRange: [startRadius, 28] }),
        borderTopRightRadius: morph.interpolate({ inputRange: [0, 1], outputRange: [startRadius, 28] }),
        borderBottomLeftRadius: morph.interpolate({ inputRange: [0, 1], outputRange: [startRadius, 0] }),
        borderBottomRightRadius: morph.interpolate({ inputRange: [0, 1], outputRange: [startRadius, 0] }),
      }
    : {
        position: "absolute" as const,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 65,
        transform: [{ translateY: Animated.add(translateY, dragY) }],
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        overflow: "hidden" as const,
      };

  const placeOrder = () => {
    const n = picks.length;
    const win = comboToWin(picks, stake);
    addPlacedPosition({
      kind: "combo",
      legs: picks.map((p) => ({
        category: p.category,
        categoryEmoji: p.categoryEmoji,
        label: p.label,
        color: p.color,
        cents: p.cents,
      })),
      cost: stake,
      toWin: win,
    });
    onClear();
    router.push({
      pathname: "/trade-submitted",
      params: {
        kind: "combo",
        // All categories in the ticket, deduped, "A \u2022 B" style.
        market: [...new Set(picks.map((p) => p.category))].join(" \u2022 "),
        title: `${n} market${n === 1 ? "" : "s"}`,
        cost: stake.toFixed(2),
        toWin: win.toFixed(2),
        returnTo: returnTo ?? "",
      },
    });
  };

  return (
    <View
      pointerEvents={Platform.OS === "web" ? "none" : "box-none"}
      onStartShouldSetResponder={() => false}
      onMoveShouldSetResponder={() => false}
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 65 }}
    >
    <Animated.View
      testID={COMBO_SHEET_PANEL_TEST_ID}
      nativeID={COMBO_SHEET_PANEL_TEST_ID}
      {...(Platform.OS === "web" ? ({ dataSet: { comboSheet: "panel" } } as object) : {})}
      pointerEvents="auto"
      style={sheetFrameStyle}
      onLayout={(e) => {
        if (!docked) return;
        const h = e.nativeEvent.layout.height;
        if (h > 0) setComboSheetHeight(h);
      }}
    >
      <ComboSheetChrome
        mode={sheetBorder}
        hideRing={morphingFrame}
        style={{
          flex: morphingFrame ? 1 : undefined,
          paddingTop: chromePad,
          paddingHorizontal: chromePad,
          paddingBottom: morphingFrame ? chromePad : 0,
        }}
      >
        <Animated.View
          style={{
            backgroundColor: morphingFrame ? colors.surface : colors.bg,
            overflow: "hidden",
            flex: morphingFrame ? 1 : undefined,
            borderTopLeftRadius: morphingFrame
              ? morph.interpolate({ inputRange: [0, 1], outputRange: [innerStartR, innerEndTopR], extrapolate: "clamp" })
              : innerEndTopR,
            borderTopRightRadius: morphingFrame
              ? morph.interpolate({ inputRange: [0, 1], outputRange: [innerStartR, innerEndTopR], extrapolate: "clamp" })
              : innerEndTopR,
            borderBottomLeftRadius: morphingFrame
              ? morph.interpolate({ inputRange: [0, 1], outputRange: [innerStartR, 0], extrapolate: "clamp" })
              : 0,
            borderBottomRightRadius: morphingFrame
              ? morph.interpolate({ inputRange: [0, 1], outputRange: [innerStartR, 0], extrapolate: "clamp" })
              : 0,
          }}
        >
      <Animated.View style={screen === 0 && settled ? { overflow: "hidden" } : { height: sheetH, overflow: "hidden" }}>
        <View style={screen === 0 && settled ? undefined : { height: "100%" }}>
          {/* Screen 0: picks */}
          <Animated.View
            pointerEvents={screen === 0 && settled ? "auto" : "none"}
            style={[
              { width: winW },
              !(screen === 0 && settled) ? { position: "absolute" as const, left: 0, bottom: 0 } : null,
              picksStyle,
              morphingFrame
                ? {
                    opacity: morph.interpolate({ inputRange: [0.08, 0.42], outputRange: [0, 1], extrapolate: "clamp" }),
                    transform: [{ translateX: morph.interpolate({ inputRange: [0, 1], outputRange: [-originFrame.x, 0] }) }],
                  }
                : null,
            ]}
          >
            <View
              onLayout={(e) => {
                topH.current = e.nativeEvent.layout.height;
                if (footerH.current > 0 && !animatingList.current) commitScreen0(false);
              }}
              style={{ paddingTop: 10, paddingHorizontal: empty ? 0 : 20 }}
            >
              {empty ? (
                <>
                  <View {...webHeaderGrab} style={[{ position: "relative" }, WEB_SHEET_GRAB]}>
                    <View style={{ alignSelf: "center", width: 36, height: 5, borderRadius: 3, backgroundColor: colors.surface2, marginBottom: 0 }} />
                    <HeaderStandard
                      title="Build your combo"
                      titleProps={{
                        variant: TextVariant.BodyMd,
                        fontWeight: FontWeight.Bold,
                        numberOfLines: 1,
                        ...oswald,
                        style: { fontFamily: displayFont },
                      }}
                      style={[WEB_NO_FOCUS_RING]}
                    />
                    {cartMode || onClose ? (
                      <ComboSheetClose
                        onPress={handleClose}
                        label={cartMode ? "Close combo slip" : "Exit combo"}
                      />
                    ) : null}
                  </View>
                  <DsText
                    variant={TextVariant.BodyMd}
                    color={TextColor.TextAlternative}
                    style={{
                      textAlign: "center",
                      marginTop: COMBO_EMPTY_BODY_FROM_TITLE,
                      marginBottom: COMBO_EMPTY_BODY_MARGIN_BOTTOM,
                      paddingHorizontal: 20,
                    }}
                  >
                    Tap on markets to start building your combo
                  </DsText>
                </>
              ) : (
                <View
                  {...webHeaderGrab}
                  style={[
                    {
                      position: "relative",
                      alignSelf: "stretch",
                      marginHorizontal: -20,
                      paddingBottom: COMBO_FILLED_HEADER_PADDING_BOTTOM,
                    },
                    WEB_SHEET_GRAB,
                  ]}
                >
                  <View style={{ alignSelf: "center", width: 36, height: 5, borderRadius: 3, backgroundColor: colors.surface2, marginBottom: 10 }} />
                  <CenteredSheetTitle
                    title={`${picks.length} market${picks.length === 1 ? "" : "s"}`}
                    chevron={listAlwaysExpanded ? undefined : expanded ? IconName.ArrowDown : IconName.ArrowUp}
                    onPress={listAlwaysExpanded ? undefined : () => setExpanded((e) => !e)}
                    subtitle={
                      <ComboPayoutTicker
                        lines={[comboPaysCopy(picks), comboPayoutParts(picks, COMBO_HEADER_STAKE).multiple]}
                        active
                      />
                    }
                  />
                  {cartMode || onClose ? (
                    <ComboSheetClose onPress={handleClose} label="Close combo slip" />
                  ) : null}
                </View>
              )}
            </View>

            {empty ? null : (
            <Animated.View style={{ height: stretchPx > 0 ? listShownH() : listH, overflow: "hidden" }}>
              <View
                pointerEvents="none"
                onLayout={(e) => {
                  const h = e.nativeEvent.layout.height;
                  if (Math.abs(h - listNatural.current) < 1) return;
                  listNatural.current = h;
                  const max = listMaxH();
                  setListOverflowPad(max > 0 && h > max ? COMBO_SLIP_OVERFLOW_PAD : 0);
                  if (animatingList.current) {
                    heights.current[0] = screen0Height();
                    return;
                  }
                  if (expandedRef.current) commitScreen0(lastH.current !== 0);
                  else heights.current[0] = screen0Height();
                }}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  opacity: 0,
                  paddingHorizontal: 20,
                  paddingTop: 14,
                  gap: 24,
                }}
              >
                <ComboPicksBody grouped={grouped} onRemove={onRemove} onReplace={onReplace} />
              </View>
              <ScrollView
                style={{ flex: 1 }}
                pointerEvents="auto"
                contentContainerStyle={{
                  flexGrow: 0,
                  paddingHorizontal: 20,
                  paddingTop: 14,
                  paddingBottom: listOverflowPad,
                  gap: 24,
                }}
                showsVerticalScrollIndicator={expandedRef.current}
                scrollEnabled
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                <ComboPicksBody grouped={grouped} onRemove={onRemove} onReplace={onReplace} />
              </ScrollView>
            </Animated.View>
            )}

            <View
              onLayout={(e) => {
                footerH.current = e.nativeEvent.layout.height;
                if (topH.current > 0 && !animatingList.current) commitScreen0(false);
              }}
              style={{
                paddingHorizontal: 20,
                paddingTop: empty ? 0 : COMBO_NEXT_FOOTER_PADDING_TOP,
                paddingBottom: empty ? 0 : 28,
              }}
            >
              {empty ? null : (
                <Pressable
                  onPress={() => go(1)}
                  accessibilityRole="button"
                  accessibilityLabel="Next"
                  style={[{ height: 48, flexShrink: 0, borderRadius: betR, overflow: "hidden" }, WEB_NO_FOCUS_RING]}
                >
                  <ComboGradientFill
                    animate
                    style={{
                      height: 48,
                      borderRadius: betR,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontFamily: geist.semibold, fontSize: 16, lineHeight: 21, color: "#131416" }}>
                      Next
                    </Text>
                  </ComboGradientFill>
                </Pressable>
              )}
            </View>
          </Animated.View>

          {/* Screen 1: amount */}
          <Animated.View
            pointerEvents={screen === 1 && settled ? "auto" : "none"}
            style={[
              { width: winW, flexGrow: 0, flexShrink: 0 },
              !(screen === 1 && settled) ? { position: "absolute" as const, left: 0, bottom: 0 } : null,
              amountStyle,
            ]}
          >
            <View
              onLayout={(e) => {
                const raw = e.nativeEvent.layout.height;
                if (!keypadOpenRef.current) amountBaseH.current = raw;
                const grown = keypadOpenRef.current && amountBaseH.current > 0 && raw > amountBaseH.current + 40;
                const next = keypadOpenRef.current
                  ? (grown ? raw : amountBaseH.current + keypadBlockH.current)
                  : raw;
                const h = capAmountH(next);
                if (h > 0) applyHeight(1, h);
              }}
              style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28, flexGrow: 0, flexShrink: 0 }}
            >
              <View {...webHeaderGrab} style={[{ paddingVertical: 0, marginHorizontal: -20, alignItems: "center", marginBottom: 10 }, WEB_SHEET_GRAB]}>
                <View style={{ width: 36, height: 5, borderRadius: 3, backgroundColor: colors.surface2 }} />
              </View>
              <View style={{ gap: 16, flexGrow: 0, flexShrink: 0 }}>
              <View {...webHeaderGrab} style={[{ position: "relative", alignSelf: "stretch", marginHorizontal: -20 }, WEB_SHEET_GRAB]}>
              <CenteredSheetTitle
                title={`${picks.length} market${picks.length === 1 ? "" : "s"}`}
                chevron={IconName.ArrowRight}
                onPress={() => go(2)}
              />
              <ComboSheetClose onPress={handleClose} label="Close combo slip" />
              </View>

              <Pressable
                onPress={() => {
                  setKeypadOpen((k) => !k);
                }}
                style={{ alignItems: "center", paddingVertical: 4, gap: 4, flexGrow: 0, flexShrink: 0 }}
              >
                <Text {...oswald} style={{ fontFamily: displayFont, fontSize: 52, lineHeight: 60, color: colors.textPrimary }}>
                  {`$${amountStr || "0"}`}
                </Text>
                <Text
                  style={{
                    fontFamily: geist.medium,
                    fontSize: 14,
                    lineHeight: 20,
                    color: colors.green,
                    textAlign: "center",
                  }}
                >
                  {comboToWinCopy(picks, stake)}
                </Text>
              </Pressable>

              <View style={{ flexDirection: "row", gap: 10 }}>
                {QUICK_AMOUNTS.map((a) => (
                  <Pressable
                    key={a}
                    onPress={() => setAmountStr(String(a))}
                    style={({ pressed }) => [
                      {
                        flex: 1,
                        height: 44,
                        borderRadius: betR,
                        backgroundColor: chipBg,
                        alignItems: "center",
                        justifyContent: "center",
                      },
                      buttonInteractionStyle(pressed),
                    ]}
                  >
                    <Text style={[METAMASK_BUTTON_LABEL, { color: colors.textPrimary }]}>${a}</Text>
                  </Pressable>
                ))}
                <Pressable
                  onPress={() => setAmountStr(String(BALANCE))}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      height: 44,
                      borderRadius: betR,
                      backgroundColor: chipBg,
                      alignItems: "center",
                      justifyContent: "center",
                    },
                    buttonInteractionStyle(pressed),
                  ]}
                >
                  <Text style={[METAMASK_BUTTON_LABEL, { color: colors.textPrimary }]}>Max</Text>
                </Pressable>
              </View>

              <View style={{ gap: 12 }}>
                <PayWithSummaryRow />
                <SummaryRow label="Total" info value={`$${stake.toFixed(2)}`} />
              </View>
              </View>

              <View style={{ gap: 8, paddingTop: 16 }}>
              <BuyAction key={`combo-buy-${screen}-${picks.length}`} label="Buy" onConfirm={placeOrder} combo />
              <Text style={{ textAlign: "center", fontFamily: geist.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted }}>
                By continuing, you accept Polymarket's terms. <Text style={{ color: "#8B99FF" }}>Learn more</Text>
              </Text>
              </View>

              {keypadOpen && (
                <View style={{ gap: 8, marginTop: 16 }}>
                  {[
                    ["1", "2", "3"],
                    ["4", "5", "6"],
                    ["7", "8", "9"],
                    [".", "0", "back"],
                  ].map((row, ri) => (
                    <View key={ri} style={{ flexDirection: "row", gap: 8 }}>
                      {row.map((k) => (
                        <Pressable
                          key={k}
                          onPress={() => (k === "back" ? pressBack() : pressDigit(k))}
                          style={({ pressed }) => [
                            { flex: 1, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface2 },
                            buttonInteractionStyle(pressed),
                          ]}
                        >
                          {k === "back" ? (
                            <Ionicons name="backspace-outline" size={22} color={colors.textPrimary} />
                          ) : (
                            <Text style={{ fontFamily: geist.semibold, fontSize: 22, color: colors.textPrimary }}>{k}</Text>
                          )}
                        </Pressable>
                      ))}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </Animated.View>

          {/* Screen 2: markets list (from bet slip) — same height as amount, no Next */}
          <Animated.View
            pointerEvents={screen === 2 && settled ? "auto" : "none"}
            style={[
              { width: winW, height: "100%" },
              !(screen === 2 && settled) ? { position: "absolute" as const, left: 0, top: 0 } : null,
              reviewStyle,
            ]}
          >
            <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28 }}>
              <View {...webHeaderGrab} style={[{ paddingVertical: 0, marginHorizontal: -20, alignItems: "center", marginBottom: 10 }, WEB_SHEET_GRAB]}>
                <View style={{ width: 36, height: 5, borderRadius: 3, backgroundColor: colors.surface2 }} />
              </View>
              <View {...webHeaderGrab} style={[{ minHeight: 24, alignItems: "center", justifyContent: "center", marginBottom: 14 }, WEB_SHEET_GRAB]}>
                <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, justifyContent: "center" }}>
                  <Pressable
                    onPress={() => go(1)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Back to bet slip"
                    style={[{ width: 24, height: 24, alignItems: "center", justifyContent: "center" }, WEB_NO_FOCUS_RING]}
                  >
                    <Icon name={IconName.ArrowLeft} size={IconSize.Lg} color={IconColor.IconDefault} />
                  </Pressable>
                </View>
                <DsText variant={TextVariant.HeadingSm} color={TextColor.TextDefault}>
                  {`${picks.length} market${picks.length === 1 ? "" : "s"}`}
                </DsText>
              </View>
              <ScrollView
                style={{ flex: 1 }}
                pointerEvents="auto"
                contentContainerStyle={{ gap: 24, flexGrow: 0 }}
                showsVerticalScrollIndicator
                scrollEnabled
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                <ComboPicksBody grouped={grouped} onRemove={onRemove} onReplace={onReplace} />
              </ScrollView>
            </View>
          </Animated.View>
        </View>
      </Animated.View>
      {morphingFrame ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: morph.interpolate({ inputRange: [0, 0.22], outputRange: [1, 0], extrapolate: "clamp" }),
          }}
        >
          <ComboMark
            size={16}
            gradient={!(cartMode && cartStyle === "fill")}
            color={cartMode && cartStyle === "fill" ? "#111111" : undefined}
            padded={false}
          />
          {!cartMode && originFrame && originFrame.width > 56 ? (
          <ComboGradientText style={{ fontFamily: geist.medium, fontSize: 15, lineHeight: 20 }}>
            Build a Combo
          </ComboGradientText>
          ) : null}
        </Animated.View>
      ) : null}
        </Animated.View>
      </ComboSheetChrome>
      {cartMode && morphClosing ? (
        <>
          {cartStyle === "outline" ? <ComboOuterGradientStroke radius={startRadius} matchParentRadius /> : null}
          <ComboCartCountBadge count={picks.length} popIn />
        </>
      ) : null}
    </Animated.View>
    </View>
  );
}
