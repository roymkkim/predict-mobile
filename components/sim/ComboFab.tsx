import React from "react";
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, Text, View, useWindowDimensions, type ImageSourcePropType } from "react-native";
import { useGlobalSearchParams, usePathname, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BuildComboButton } from "@/components/sim/BuildComboButton";
import {
  ComboGradientArrow,
  ComboGradientFill,
  ComboOuterGradientStroke,
} from "@/components/sim/ComboGradient";
import { ComboLegAvatar } from "@/components/sim/ComboLegAvatar";
import { ComboMark } from "@/components/sim/ComboMark";
import { SlotNumber } from "@/components/sim/SlotNumber";
import {
  BadgeCount,
  BadgeCountSize,
  Icon,
  IconColor,
  IconName,
  IconSize,
} from "@metamask/design-system-react-native";
import {
  COMBO_CART_BADGE_OVERLAP,
  COMBO_CART_CLOSE_BUTTON_SIZE,
  COMBO_CART_FAB_SIZE,
  COMBO_CART_PILL_ARROW_GAP,
  COMBO_CART_PILL_ARROW_SIZE,
  COMBO_CART_PILL_EXPAND_MS,
  COMBO_CART_PILL_LEADING_PAD,
  COMBO_CART_PILL_MARK_GAP,
  COMBO_CART_PILL_MARK_SIZE,
  COMBO_CART_PILL_TRAILING_PAD,
  comboCartCloseLeading,
  comboCartExitVisible,
  comboCartFabLayout,
  comboCartFabVisible,
  comboCartFabWidth,
  isComboIndexPath,
  isSportsLandingPath,
  comboCartBadgeCenter,
  comboPayoutMultiple,
  comboPayoutMultipleLabel,
} from "@/lib/sim/comboAffordance";
import { openComboCartSlip, useComboAffordance, useComboCartSlipOpen } from "@/lib/sim/comboAffordanceStore";
import { comboCartBadgeColors } from "@/lib/sim/comboCartStyle";
import { getComboCartDropPointer, useComboCartDrop } from "@/lib/sim/comboCartDropStore";
import { useComboCartStyle } from "@/lib/sim/comboCartStyleStore";
import { comboBrandOnFillInk, useComboBrandStyle } from "@/lib/sim/comboBrandStore";
import { comboParamOn, enterComboFlow, exitComboFlow, useComboFlow, useComboMode } from "@/lib/sim/comboFlowStore";
import { getComboPicks, useComboPicks } from "@/lib/sim/comboPicksStore";
import {
  beginComboCartReturn,
  clearComboMorphOrigin,
  clearComboMorphReturnTarget,
  setComboMorphOrigin,
  useComboMorphOrigin,
  useComboMorphReverse,
} from "@/lib/sim/comboMorphStore";
import { useCombinationsVisible, useShowCombinationsFab } from "@/lib/sim/combinationsStore";
import { colors, MUTED_OUTLINE } from "@/lib/sim/colors";
import { geist } from "@/lib/sim/geistFonts";
import { sheetMorph } from "@/lib/sim/sheetMotion";

/** Cart count — lime on Outline, card-surface disc + white numeral on Fill. Actual integer — no 9+ cap. */
export function formatComboCartCount(count: number): string {
  return String(count);
}

const COUNT_ADD_POP_PEAK = 1.1;
const COUNT_ADD_POP_UP_MS = 140;
const COUNT_ADD_POP_DOWN_MS = 90;
/** Close circle scale+fade before the cart morphs back to Build a combo. */
const CLOSE_SHRINK_MS = 170;
const PILL_EXPAND_EASE = Easing.bezier(0.22, 1, 0.36, 1);
const CART_DROP_CHIP = 24;
const CART_DROP_MS = 420;
const CART_DROP_STAGGER_MS = 55;
const CART_DROP_EASE = Easing.in(Easing.cubic);

function usePrefersReducedMotion(): boolean {
  const [enabled, setEnabled] = React.useState(false);
  React.useEffect(() => {
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

type CartDropChip = {
  id: number;
  label: string;
  color: string;
  avatar?: ImageSourcePropType;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  delay: number;
};

/** Cart count. `popIn` is sheet→FAB close only — scale from the badge center. */
export function ComboCartCountBadge({
  count,
  popIn = false,
}: {
  count: number;
  popIn?: boolean;
}) {
  const cartStyle = useComboCartStyle();
  const brand = useComboBrandStyle();
  const badge = comboCartBadgeColors(cartStyle, brand);
  const scale = React.useRef(new Animated.Value(popIn ? 0 : 1)).current;
  const prevCount = React.useRef(count);

  React.useEffect(() => {
    if (!popIn) return;
    scale.setValue(0);
    const pop = Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.06,
        duration: 190,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 50,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]);
    pop.start();
    return () => pop.stop();
  }, [popIn, scale]);

  React.useEffect(() => {
    const prev = prevCount.current;
    prevCount.current = count;
    if (popIn || count <= prev) return;
    scale.setValue(1);
    const pop = Animated.sequence([
      Animated.timing(scale, {
        toValue: COUNT_ADD_POP_PEAK,
        duration: COUNT_ADD_POP_UP_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: COUNT_ADD_POP_DOWN_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);
    pop.start();
    return () => pop.stop();
  }, [count, popIn, scale]);

  if (count <= 0) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: -COMBO_CART_BADGE_OVERLAP,
        right: -COMBO_CART_BADGE_OVERLAP,
        zIndex: 4,
        transform: [{ scale }],
        ...(Platform.OS === "web" ? ({ transformOrigin: "center center" } as Record<string, string>) : null),
      }}
    >
      <BadgeCount
        count={count}
        size={BadgeCountSize.Md}
        max={Number.MAX_SAFE_INTEGER}
        style={{ backgroundColor: badge.backgroundColor }}
        textProps={{ style: { color: badge.color } }}
      />
    </Animated.View>
  );
}

function isSportCategoryPath(pathname: string): boolean {
  return pathname.startsWith("/uxr-sport/") || pathname.startsWith("/kalshi-sport/");
}

function isSportDetailPath(pathname: string): boolean {
  return pathname === "/match-detail" || pathname === "/game-detail" || pathname === "/tennis-detail";
}

function ComboCartMorph() {
  const origin = useComboMorphOrigin();
  const reverse = useComboMorphReverse();
  const affordance = useComboAffordance();
  const cartStyle = useComboCartStyle();
  const slipOpen = useComboCartSlipOpen();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const picks = useComboPicks();
  const payoutLabel = comboPayoutMultipleLabel(picks);
  const progress = React.useRef(new Animated.Value(0)).current;
  const reverseSeeded = React.useRef(false);
  const snap = React.useRef(origin);

  if (origin) snap.current = origin;
  if (reverse && !reverseSeeded.current) {
    progress.setValue(1);
    reverseSeeded.current = true;
  }
  if (!reverse) reverseSeeded.current = false;
  const frame = snap.current;
  const cartMorph = affordance === "cart" && !slipOpen && Boolean(origin && frame);

  React.useEffect(() => {
    if (!cartMorph || !frame) return;
    progress.setValue(reverse ? 1 : 0);
    const anim = sheetMorph(progress, reverse ? 0 : 1);
    anim.start(({ finished }) => {
      const returning = reverse;
      clearComboMorphOrigin();
      if (!finished) return;
      if (returning) {
        clearComboMorphReturnTarget();
        exitComboFlow();
        router.setParams({ combo: "" });
      }
    });
    return () => {
      anim.stop();
      clearComboMorphOrigin();
    };
  }, [cartMorph, frame, progress, reverse, router]);

  if (!cartMorph || !frame) return null;

  const target = comboCartFabLayout(winW, winH, insets.bottom, {
    itemCount: picks.length,
    payoutLabel: picks.length >= 1 ? payoutLabel : undefined,
    safeRight: insets.right,
  });
  const startRadius = Math.min(frame.radius, frame.height / 2);
  /** Wide Build a Combo origin keeps outline chrome; fill when the morph is the cart circle or payout pill. */
  const fillDisc =
    cartStyle === "fill" &&
    frame.height <= COMBO_CART_FAB_SIZE + 1 &&
    frame.width <= comboCartFabWidth(Math.max(picks.length, 1), payoutLabel || undefined) + 1;
  const markOpacity = reverse
    ? 1
    : progress.interpolate({ inputRange: [0, 0.55], outputRange: [1, 0], extrapolate: "clamp" });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        zIndex: 72,
        overflow: "hidden",
        left: progress.interpolate({ inputRange: [0, 1], outputRange: [frame.x, target.x] }),
        top: progress.interpolate({ inputRange: [0, 1], outputRange: [frame.y, target.y] }),
        width: progress.interpolate({ inputRange: [0, 1], outputRange: [frame.width, target.width] }),
        height: progress.interpolate({ inputRange: [0, 1], outputRange: [frame.height, target.height] }),
        borderRadius: progress.interpolate({ inputRange: [0, 1], outputRange: [startRadius, target.radius] }),
        backgroundColor: fillDisc ? "transparent" : colors.surface,
      }}
    >
      {fillDisc ? (
        <ComboGradientFill animate style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
      ) : null}
      <Animated.View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          opacity: markOpacity,
        }}
      >
        <ComboMark size={16} gradient={!fillDisc} color="#111111" padded={false} />
      </Animated.View>
    </Animated.View>
  );
}

function ComboCartDropChipView({
  chip,
  onDone,
}: {
  chip: CartDropChip;
  onDone: (id: number) => void;
}) {
  const progress = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const anim = Animated.sequence([
      Animated.delay(chip.delay),
      Animated.timing(progress, {
        toValue: 1,
        duration: CART_DROP_MS,
        easing: CART_DROP_EASE,
        useNativeDriver: true,
      }),
    ]);
    anim.start(({ finished }) => {
      if (finished) onDone(chip.id);
    });
    return () => anim.stop();
  }, [chip.delay, chip.id, onDone, progress]);
  const half = CART_DROP_CHIP / 2;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: CART_DROP_CHIP,
        height: CART_DROP_CHIP,
        borderRadius: 6,
        overflow: "hidden",
        opacity: progress.interpolate({ inputRange: [0, 0.82, 1], outputRange: [1, 1, 0] }),
        transform: [
          { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [chip.fromX - half, chip.toX - half] }) },
          { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [chip.fromY - half, chip.toY - half] }) },
          { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.28] }) },
        ],
      }}
    >
      {chip.avatar ? (
        <ComboLegAvatar source={chip.avatar} pick={chip.label} size={CART_DROP_CHIP} />
      ) : (
        <View style={{ flex: 1, backgroundColor: chip.color }} />
      )}
    </Animated.View>
  );
}

function ComboCartButton() {
  const cartStyle = useComboCartStyle();
  const affordance = useComboAffordance();
  const combinationsOn = useCombinationsVisible();
  const comboFlow = useComboFlow();
  const pathname = usePathname();
  const { sports } = useGlobalSearchParams<{ sports?: string }>();
  const sportsFlag = Array.isArray(sports) ? sports[0] : sports;
  const router = useRouter();
  const slipOpen = useComboCartSlipOpen();
  const origin = useComboMorphOrigin();
  const picks = useComboPicks();
  const dropOn = useComboCartDrop();
  const reduceMotion = usePrefersReducedMotion();
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const morphing = affordance === "cart" && Boolean(origin);
  const closeScale = React.useRef(new Animated.Value(1)).current;
  const closeOpacity = React.useRef(new Animated.Value(1)).current;
  const [closeShrinking, setCloseShrinking] = React.useState(false);
  const [shownCount, setShownCount] = React.useState(picks.length);
  const [drops, setDrops] = React.useState<CartDropChip[]>([]);
  const dropWatch = React.useRef(picks.length);
  const dropSeq = React.useRef(0);
  const payoutLabel = comboPayoutMultipleLabel(picks);
  const payoutMultiple = comboPayoutMultiple(picks);
  const pillW = comboCartFabWidth(1, payoutLabel || undefined);
  const expand = React.useRef(new Animated.Value(picks.length >= 1 ? 1 : 0)).current;
  const expandReady = React.useRef(false);
  const show = comboCartFabVisible({
    affordance,
    combinationsOn,
    comboFlow,
    pathname,
    sports: sportsFlag,
    slipOpen,
    morphing,
  });

  React.useEffect(() => {
    const prev = dropWatch.current;
    const next = picks.length;
    if (next === prev) return;
    if (next <= prev) {
      dropWatch.current = next;
      setShownCount(next);
      setDrops([]);
      return;
    }
    if (!show) {
      // Carousel → Combos: hold the delta until the FAB is on screen.
      return;
    }
    const canFly = dropOn && !reduceMotion && Boolean(getComboCartDropPointer());
    if (!canFly) {
      dropWatch.current = next;
      setShownCount(next);
      return;
    }
    dropWatch.current = next;
    const pointer = getComboCartDropPointer();
    if (!pointer) {
      setShownCount(next);
      return;
    }
    const layout = comboCartFabLayout(winW, winH, insets.bottom, {
      itemCount: next,
      payoutLabel: payoutLabel || undefined,
      safeRight: insets.right,
    });
    const badge = comboCartBadgeCenter(layout);
    const toX = badge.x;
    const toY = badge.y;
    const added = getComboPicks().slice(prev);
    const batch = added.slice(0, 6).map((pick, i) => {
      dropSeq.current += 1;
      return {
        id: dropSeq.current,
        label: pick.label,
        color: pick.color,
        avatar: pick.avatar,
        fromX: pointer.x,
        fromY: pointer.y,
        toX,
        toY,
        delay: i * CART_DROP_STAGGER_MS,
      };
    });
    if (batch.length === 0) {
      setShownCount(next);
      return;
    }
    setDrops((d) => [...d, ...batch]);
  }, [picks.length, dropOn, reduceMotion, show, winW, winH, insets.bottom, insets.right, payoutLabel]);

  const onDropDone = React.useCallback((id: number) => {
    setDrops((d) => d.filter((chip) => chip.id !== id));
    setShownCount((n) => Math.min(n + 1, getComboPicks().length));
  }, []);

  React.useEffect(() => {
    if (!show) return;
    closeScale.setValue(1);
    closeOpacity.setValue(1);
    setCloseShrinking(false);
  }, [show, closeScale, closeOpacity]);

  React.useEffect(() => {
    const filled = picks.length >= 1;
    if (!expandReady.current) {
      expandReady.current = true;
      expand.setValue(filled ? 1 : 0);
      return;
    }
    const anim = Animated.timing(expand, {
      toValue: filled ? 1 : 0,
      duration: COMBO_CART_PILL_EXPAND_MS,
      easing: PILL_EXPAND_EASE,
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [picks.length, expand]);

  const dropLayer =
    drops.length > 0 ? (
      <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, zIndex: 85 }}>
        {drops.map((chip) => (
          <ComboCartDropChipView key={chip.id} chip={chip} onDone={onDropDone} />
        ))}
      </View>
    ) : null;

  if (!show) return dropLayer;

  const showExit = comboCartExitVisible(pathname);
  const count = picks.length;
  const layout = comboCartFabLayout(winW, winH, insets.bottom, {
    itemCount: count,
    payoutLabel: count >= 1 ? payoutLabel : undefined,
    safeRight: insets.right,
  });
  const closeLeading = comboCartCloseLeading(showExit);
  const restRight = layout.x + layout.width;
  const filled = count >= 1;
  const fillCart = cartStyle === "fill";
  const cartWidth = expand.interpolate({
    inputRange: [0, 1],
    outputRange: [COMBO_CART_FAB_SIZE, pillW],
  });
  const clusterLeft = expand.interpolate({
    inputRange: [0, 1],
    outputRange: [restRight - COMBO_CART_FAB_SIZE - closeLeading, restRight - pillW - closeLeading],
  });
  const clusterWidth = expand.interpolate({
    inputRange: [0, 1],
    outputRange: [COMBO_CART_FAB_SIZE + closeLeading, pillW + closeLeading],
  });
  const labelOpacity = expand.interpolate({
    inputRange: [0, 0.28, 1],
    outputRange: [0, 0, 1],
  });

  const runCloseSequence = () => {
    if (closeShrinking) return;
    setCloseShrinking(true);
    Animated.parallel([
      Animated.timing(closeScale, {
        toValue: 0,
        duration: CLOSE_SHRINK_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(closeOpacity, {
        toValue: 0,
        duration: CLOSE_SHRINK_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start(({ finished }) => {
      if (!finished) return;
      if (beginComboCartReturn()) return;
      clearComboMorphReturnTarget();
      exitComboFlow();
      router.setParams({ combo: "" });
    });
  };

  return (
    <>
      {dropLayer}
      <Animated.View
      style={{
        position: "absolute",
        left: clusterLeft,
        top: layout.y,
        width: clusterWidth,
        height: layout.height,
        zIndex: 70,
        overflow: "visible",
      }}
    >
      {showExit ? (
        <Animated.View
          pointerEvents={closeShrinking ? "none" : "auto"}
          style={{
            position: "absolute",
            left: 0,
            top: (layout.height - COMBO_CART_CLOSE_BUTTON_SIZE) / 2,
            width: COMBO_CART_CLOSE_BUTTON_SIZE,
            height: COMBO_CART_CLOSE_BUTTON_SIZE,
            zIndex: 5,
            opacity: closeOpacity,
            transform: [{ scale: closeScale }],
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Exit combo"
            onPress={runCloseSequence}
            style={({ pressed }) => ({
              opacity: pressed ? 0.88 : 1,
              width: COMBO_CART_CLOSE_BUTTON_SIZE,
              height: COMBO_CART_CLOSE_BUTTON_SIZE,
              borderRadius: COMBO_CART_CLOSE_BUTTON_SIZE / 2,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: MUTED_OUTLINE,
              alignItems: "center",
              justifyContent: "center",
              ...(Platform.OS === "web" ? ({ cursor: "pointer" } as Record<string, string>) : null),
            })}
          >
            <Icon
              name={IconName.Close}
              size={IconSize.Md}
              color={IconColor.IconInverse}
              style={{ color: "#ffffff" }}
            />
          </Pressable>
        </Animated.View>
      ) : null}
      <Animated.View
        style={{
          position: "absolute",
          left: closeLeading,
          bottom: 0,
          width: cartWidth,
          height: layout.height,
          overflow: "visible",
        }}
      >
        <Animated.View
          style={{
            width: cartWidth,
            height: layout.height,
            borderRadius: layout.radius,
            overflow: "hidden",
            backgroundColor: fillCart ? "transparent" : colors.surface,
            ...(Platform.OS === "web"
              ? ({ boxShadow: "0 8px 18px rgba(0,0,0,0.35)" } as Record<string, string>)
              : {
                  elevation: 8,
                  shadowColor: "#000",
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 6 },
                }),
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={filled ? `Combo cart, ${count} markets, ${payoutLabel}` : "Combo cart"}
            onPress={() => {
              setComboMorphOrigin({
                x: layout.x,
                y: layout.y,
                width: layout.width,
                height: layout.height,
                windowWidth: winW,
                windowHeight: winH,
                radius: layout.radius,
              });
              openComboCartSlip();
            }}
            style={({ pressed }) => ({
              opacity: pressed ? 0.88 : 1,
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              ...(Platform.OS === "web" ? ({ cursor: "pointer" } as Record<string, string>) : null),
            })}
          >
            {fillCart ? (
              <ComboGradientFill animate style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
            ) : null}
            <View
              style={{
                width: COMBO_CART_PILL_LEADING_PAD + COMBO_CART_PILL_MARK_SIZE,
                height: COMBO_CART_FAB_SIZE,
                paddingLeft: COMBO_CART_PILL_LEADING_PAD,
                alignItems: "flex-start",
                justifyContent: "center",
              }}
            >
              <ComboMark
                size={COMBO_CART_PILL_MARK_SIZE}
                color={fillCart ? "#111111" : undefined}
                gradient={!fillCart}
                padded={false}
              />
            </View>
            <Animated.View
              pointerEvents="none"
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginLeft: COMBO_CART_PILL_MARK_GAP,
                marginRight: COMBO_CART_PILL_TRAILING_PAD,
                opacity: labelOpacity,
              }}
            >
              <SlotNumber
                value={payoutMultiple}
                decimals={1}
                suffix="X payout"
                color={fillCart ? "#111111" : "#B9F302"}
                fontSize={16}
                fontFamily={geist.medium}
                lineHeight={24}
              />
              <View style={{ width: COMBO_CART_PILL_ARROW_GAP }} />
              {fillCart ? (
                <Icon
                  name={IconName.ArrowRight}
                  size={IconSize.Sm}
                  color={IconColor.IconDefault}
                  style={{ color: "#111111" }}
                />
              ) : (
                <ComboGradientArrow size={COMBO_CART_PILL_ARROW_SIZE} />
              )}
            </Animated.View>
          </Pressable>
        </Animated.View>
        {cartStyle === "outline" ? <ComboOuterGradientStroke radius={layout.radius} /> : null}
        <ComboCartCountBadge count={shownCount} />
      </Animated.View>
    </Animated.View>
    </>
  );
}

function CombinationsEntryFab() {
  const combosOn = useCombinationsVisible();
  const showHomeFab = useShowCombinationsFab();
  const comboMode = useComboMode();
  const brand = useComboBrandStyle();
  const fillInk = comboBrandOnFillInk(brand);
  const pathname = usePathname();
  const { combo, sports } = useGlobalSearchParams<{ combo?: string; sports?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const comboOn = comboParamOn(combo);
  const sportsLanding = isSportsLandingPath(pathname, Array.isArray(sports) ? sports[0] : sports);
  const sportPage = isSportCategoryPath(pathname) || sportsLanding;
  const sportDetail = isSportDetailPath(pathname);

  if (!combosOn || isComboIndexPath(pathname) || pathname === "/live" || sportDetail) return null;
  if (sportPage) {
    if (comboOn || comboMode) return null;
  } else if (!showHomeFab || comboMode) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: Math.max(insets.bottom, 12) + 12,
        alignItems: "center",
        zIndex: 70,
      }}
    >
      {sportPage ? (
        <BuildComboButton radius={24} fullWidth={false} />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Combos"
          onPress={() => {
            enterComboFlow();
            router.push("/combination");
          }}
          style={({ pressed }) => ({
            opacity: pressed ? 0.88 : 1,
            borderRadius: 999,
            overflow: "hidden",
            ...(Platform.OS === "web"
              ? ({ boxShadow: "0 8px 24px rgba(0,0,0,0.45)", cursor: "pointer" } as Record<string, string>)
              : { elevation: 8, shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }),
          })}
        >
          <ComboGradientFill
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              height: 48,
              paddingHorizontal: 18,
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <ComboMark size={16} color={fillInk} />
            <Text style={{ fontFamily: geist.medium, fontSize: 15, lineHeight: 20, color: fillInk }}>Combos</Text>
          </ComboGradientFill>
        </Pressable>
      )}
    </View>
  );
}

export function ComboFab() {
  return (
    <>
      <ComboCartMorph />
      <ComboCartButton />
      <CombinationsEntryFab />
    </>
  );
}
