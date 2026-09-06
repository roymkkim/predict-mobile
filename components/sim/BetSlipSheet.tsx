import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { useEffect, useRef, useState } from "react";
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { createSheetHeaderPan, sheetEnter, sheetExit, sheetResize, backdropIn, backdropOut } from "@/lib/sim/sheetMotion";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/lib/sim/colors";
import { buttonInteractionStyle, METAMASK_BUTTON_LABEL } from "@/lib/sim/buttonStyle";
import { useUxrMode } from "@/lib/sim/uxrModeStore";
import { useThemeMode } from "@/lib/sim/dsModeStore";
import { closeBetSlip, useBetSlip } from "@/lib/sim/betSlipStore";
import { useBetSlipSettings } from "@/lib/sim/betSlipSettingsStore";
import { OrderBookSheet } from "./OrderBookSheet";
import { PositionAvatar } from "./PositionAvatar";
import { useRouter } from "expo-router";
import { addPlacedPosition } from "@/lib/sim/positionsStore";
import { geist } from "@/lib/sim/geistFonts";
import { BuyAction } from "@/components/sim/BuyAction";
import { ChevronIcon, PayWithSummaryRow, SummaryRow } from "@/components/sim/BetSlipRows";
import { useBetRadius } from "@/lib/sim/pillButtonsStore";
import { useDisplayFont, useOswaldDataSet } from "@/lib/sim/typefaceStore";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Static demo wallet balance (mirrors the home portfolio card's "$123.12").
const BALANCE = 123.12;
const QUICK_AMOUNTS = [20, 50, 100] as const;
// Quick share-count adjustments in limit mode.
const SHARE_STEPS = [-100, -10, 10, 100] as const;
// Hairline divider between the limit-order rows.
const BET_DIVIDER_DARK = "rgba(255,255,255,0.07)";
const BET_DIVIDER_LIGHT = "rgba(0,0,0,0.08)";
const BET_BORDER_DARK = "rgba(255,255,255,0.12)";
const BET_BORDER_LIGHT = "rgba(0,0,0,0.08)";
// UXR spec: bet-slip blue accents (Max, Learn more links).
const UXR_BLUE = "#8B99FF";

function fmtCents(c: number) {
  // 76.5 -> "76.5¢", 76 -> "76¢"
  return `${Number.isInteger(c) ? c : c.toFixed(1)}¢`;
}

function titleWithCents(title: string, cents: number): string {
  const base = title
    .replace(/\s*[·•]\s*\d+(?:\.\d+)?¢\s*$/u, "")
    .replace(/\s+\d+(?:\.\d+)?¢\s*$/u, "")
    .trim();
  return `${base} \u00b7 ${fmtCents(cents)}`;
}

// The global bet slip. Mounted once at the app root; raised whenever any card's
// price/odds button calls openBetSlip(pick). Toggleable between two order modes
// via the header button (reference: Polymarket-style slip):
//   Market — Yes/No pill with inline prices, big $ amount (tap for keypad),
//            quick amounts, Pay with / Total / Max payout rows.
//   Limit  — Yes/No pill (no prices), Shares stepper row, Limit price stepper
//            row (ask-price chevron opens the order book), -100/-10/+10/+100
//            quick share pills, Total / To Win rows, always-on keypad.
// Both end in a white Buy Yes/No button + terms line. The Market/Limit button
// and the Yes/No selector are gated by the settings-sheet toggles.
export function BetSlipSheet() {
  const { open, pick } = useBetSlip();
  const router = useRouter();
  const uxr = useUxrMode() === "uxr";
  const themeMode = useThemeMode();
  const light = themeMode === "light";
  const { orderTypes, yesNoMarket } = useBetSlipSettings();
  const displayFont = useDisplayFont();
  const oswald = useOswaldDataSet();
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();

  const [render, setRender] = useState(open);
  const slide = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current; // backdrop opacity 0..1
  const dragY = useRef(new Animated.Value(0)).current;
  const headerPan = useRef(
    createSheetHeaderPan({
      dragY,
      onDismiss: () => closeBetSlip(),
    }),
  ).current;

  // Single animation driver for the sheet's height (iOS sheet motion): content
  // (Market/Limit swap, keypad, order rows) simply mounts, and the container
  // glides to fit with one 450ms expo-out tween. First measurement after a
  // fresh open snaps without animating so the enter spring owns the arrival.
  const heightAnim = useRef(new Animated.Value(0)).current;
  const measuredH = useRef(0);
  const [heightReady, setHeightReady] = useState(false);
  const snapHeight = useRef(false);
  const onSheetLayout = (e: { nativeEvent: { layout: { height: number } } }) => {
    const h = e.nativeEvent.layout.height;
    if (Math.abs(h - measuredH.current) < 1) return;
    measuredH.current = h;
    if (!heightReady || snapHeight.current) {
      snapHeight.current = false;
      heightAnim.setValue(h);
      setHeightReady(true);
      return;
    }
    sheetResize(heightAnim, h).start();
  };

  const [amountStr, setAmountStr] = useState("");
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [limitCents, setLimitCents] = useState(50);
  const [limitShares, setLimitShares] = useState(0);
  const [bookOpen, setBookOpen] = useState(false);

  // Reset transient input each time a new pick is raised.
  useEffect(() => {
    if (open && pick) {
      setAmountStr("");
      setKeypadOpen(false);
      setSide(pick.side ?? "yes");
      setOrderType("market");
      setLimitCents(clampCents(pick.oddsCents));
      setLimitShares(0);
      setBookOpen(false);
    }
  }, [open, pick]);

  // Close the child sheet whenever the bet slip itself closes.
  useEffect(() => {
    if (!open) setBookOpen(false);
  }, [open]);

  useEffect(() => {
    if (open) {
      setRender(true);
      dragY.setValue(0);
      // Main sheet rising → iOS spring enter; backdrop fades 0.2s in parallel.
      Animated.parallel([sheetEnter(slide, false), backdropIn(fade, false)]).start();
    } else {
      Animated.parallel([sheetExit(slide, false), backdropOut(fade, false)]).start(({ finished }) => {
        if (finished) {
          setRender(false);
          // Next open re-measures and snaps to the fresh content height.
          measuredH.current = 0;
          setHeightReady(false);
        }
      });
    }
  }, [open, slide, fade]);

  if (!render || !pick) return null;

  // Slide the whole sheet fully below the screen (winH) so a tall sheet can't
  // peek above the bottom edge while hidden.
  const translateY = Animated.add(
    slide.interpolate({ inputRange: [0, 1], outputRange: [winH, 0] }),
    dragY,
  );

  const yesCents = clampCents(pick.oddsCents);
  // With the Yes/No pill hidden there is no way to switch sides, so the slip
  // always trades (and labels) the Yes side even if the pick arrived as "no".
  const effSide = yesNoMarket ? side : "yes";
  const baseCents = effSide === "no" ? clampCents(100 - yesCents) : yesCents;
  const isLimit = orderTypes && orderType === "limit";
  const effCents = isLimit ? limitCents : baseCents;
  const price = effCents / 100;
  // Market orders take a dollar amount via the keypad; limit orders take a
  // share count and derive the dollar cost from shares × limit price.
  const amount = isLimit ? limitShares * price : parseFloat(amountStr) || 0;
  const shares = isLimit ? limitShares : price > 0 ? amount / price : 0;
  // Each share pays $1 on a win, so the full payout is the share count.
  const payout = shares;
  const toWin = Math.max(0, payout - amount);
  const maxShares = price > 0 ? Math.floor(BALANCE / price) : 0;
  const buyLabel = `Buy ${effSide === "yes" ? "Yes" : "No"}`;
  const dividerColor = light ? BET_DIVIDER_LIGHT : BET_DIVIDER_DARK;
  const sheetBackground = light ? "#ffffff" : uxr ? "#000000" : colors.surface;

  // Market-mode keypad edits the dollar amount.
  const pressDigit = (d: string) => {
    if (isLimit) {
      // Limit-mode keypad edits the share count (integers only).
      if (d === ".") return;
      setLimitShares((s) => {
        const next = s * 10 + Number(d);
        return next > 999999 ? s : next;
      });
      return;
    }
    setAmountStr((s) => {
      if (d === ".") {
        if (s.includes(".")) return s;
        return s === "" ? "0." : s + ".";
      }
      if (s === "0") return d;
      const next = s + d;
      // Cap to a sensible length + at most 2 decimals.
      if (next.replace(".", "").length > 7) return s;
      const dot = next.indexOf(".");
      if (dot >= 0 && next.length - dot - 1 > 2) return s;
      return next;
    });
  };
  const pressBack = () => {
    if (isLimit) {
      setLimitShares((s) => Math.floor(s / 10));
      return;
    }
    setAmountStr((s) => s.slice(0, -1));
  };

  return (
    <>
    <Modal visible={render} transparent animationType="none" onRequestClose={closeBetSlip} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <AnimatedPressable style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.6)", opacity: fade }]} onPress={closeBetSlip} />
        {/* Height wrapper: bottom-anchored + overflow hidden so the sheet's top
            edge glides while content clips cleanly during the resize tween. */}
        <Animated.View
          style={{
            transform: [{ translateY }],
            height: heightReady ? heightAnim : undefined,
            justifyContent: "flex-end",
            overflow: "hidden",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
          }}
        >
          <Pressable
            onPress={() => {}}
            onLayout={onSheetLayout}
            style={{
               backgroundColor: sheetBackground,
              borderTopWidth: uxr ? 1 : 0,
              borderLeftWidth: uxr ? 1 : 0,
              borderRightWidth: uxr ? 1 : 0,
               borderColor: light ? BET_BORDER_LIGHT : BET_BORDER_DARK,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: 20,
              paddingTop: 10,
              paddingBottom: insets.bottom + 16,
              maxHeight: winH * 0.92,
              minHeight: 0,
            }}
          >
            <View {...headerPan.panHandlers} style={{ alignItems: "center", marginBottom: 10 }}>
              <View style={{ width: 36, height: 5, borderRadius: 3, backgroundColor: colors.surface2 }} />
            </View>

            <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ gap: 16 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Header: outcome swatch + market title over the selected outcome,
                  Market/Limit swap button on the right. */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <PositionAvatar market={pick.market} title={pick.title} size={40} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontFamily: geist.medium, fontSize: 14, lineHeight: 18, color: colors.textMuted }} numberOfLines={1}>
                    {pick.market ?? `Odds ${fmtCents(baseCents)}`}
                  </Text>
                  <Text style={{ fontFamily: geist.bold, fontSize: 17, lineHeight: 24, color: colors.textPrimary }} numberOfLines={1}>
                    {titleWithCents(pick.title, baseCents)}
                  </Text>
                </View>
                {orderTypes && <OrderTypeButton value={orderType} onChange={setOrderType} />}
              </View>

              {/* Yes/No pill — inline prices in market mode only. */}
              {yesNoMarket && (
                <YesNoToggle side={side} onChange={setSide} yesCents={isLimit ? undefined : yesCents} />
              )}

              {isLimit ? (
                <>
                  {/* Limit price row: ask-price chevron opens the order book. */}
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 }}>
                    <View>
                      <Text style={{ fontFamily: geist.semibold, fontSize: 16, color: colors.textPrimary }}>Limit price</Text>
                      <Pressable onPress={() => setBookOpen(true)} hitSlop={8} style={{ flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 }}>
                        <Text style={{ fontFamily: geist.medium, fontSize: 13, color: uxr ? UXR_BLUE : colors.accent }}>
                          {`Ask price: ${fmtCents(yesCents)}`}
                        </Text>
                        <ChevronIcon size={13} color={uxr ? UXR_BLUE : colors.accent} />
                      </Pressable>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 0 }}>
                      <Stepper icon="remove" onPress={() => setLimitCents((c) => clampCents(c - 1))} />
                      <Text
                        {...oswald}
                        style={{
                          fontFamily: displayFont,
                          fontSize: 26,
                          width: 64,
                          textAlign: "center",
                          color: limitShares > 0 ? colors.textPrimary : colors.textMuted,
                        }}
                      >
                        {fmtCents(limitCents)}
                      </Text>
                      <Stepper icon="add" onPress={() => setLimitCents((c) => clampCents(c + 1))} />
                    </View>
                  </View>

                  <View style={{ height: 1, backgroundColor: dividerColor }} />

                  {/* Shares row: available balance + Max on the left, stepper on
                      the right. */}
                  <View style={{ gap: 0 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 12, paddingBottom: 16 }}>
                      <View>
                        <Text style={{ fontFamily: geist.semibold, fontSize: 16, color: colors.textPrimary }}>Shares</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                          <Text style={{ fontFamily: geist.regular, fontSize: 13, color: colors.textMuted }}>
                            {`$${BALANCE.toFixed(2)} available • `}
                          </Text>
                          <Pressable onPress={() => setLimitShares(maxShares)} hitSlop={8}>
                            <Text style={{ fontFamily: geist.medium, fontSize: 13, color: uxr ? UXR_BLUE : colors.accent }}>Max</Text>
                          </Pressable>
                        </View>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 0 }}>
                        <Stepper icon="remove" onPress={() => setLimitShares((s) => Math.max(0, s - 1))} />
                        <Pressable
                          onPress={() => {
                            snapHeight.current = true;
                            setKeypadOpen((k) => !k);
                          }}
                          hitSlop={8}
                        >
                          <Text
                            {...oswald}
                            style={{
                              fontFamily: displayFont,
                              fontSize: 26,
                              width: 64,
                              textAlign: "center",
                              color: limitShares > 0 ? colors.textPrimary : colors.textMuted,
                            }}
                          >
                            {limitShares}
                          </Text>
                        </Pressable>
                        <Stepper icon="add" onPress={() => setLimitShares((s) => s + 1)} />
                      </View>
                    </View>

                    {/* Quick share adjustments. */}
                    <View style={{ flexDirection: "row", gap: 10, paddingBottom: 12 }}>
                      {SHARE_STEPS.map((d) => (
                        <QuickBtn
                          key={d}
                          label={d > 0 ? `+${d}` : String(d)}
                          onPress={() => setLimitShares((s) => Math.max(0, s + d))}
                        />
                      ))}
                    </View>

                  </View>

                  <View style={{ height: 1, backgroundColor: dividerColor }} />

                  <View style={{ gap: 12 }}>
                    <PayWithSummaryRow />
                    <SummaryRow label="Total" info value={`$${amount.toFixed(2)}`} />
                    <SummaryRow label="To Win" info value={`$${toWin.toFixed(2)}`} valueColor={colors.greenOutline} />
                  </View>
                </>
              ) : (
                <>
                  {/* Big dollar amount — tap to reveal the keypad. */}
                  <Pressable
                    onPress={() => {
                      snapHeight.current = true;
                      setKeypadOpen((k) => !k);
                    }}
                    style={{ alignItems: "center", paddingVertical: 4, gap: 4 }}
                  >
                    <Text {...oswald} style={{ fontFamily: displayFont, fontSize: 52, lineHeight: 60, color: colors.textPrimary }}>
                      {`$${amountStr || "0"}`}
                    </Text>
                    <Text style={{ fontFamily: geist.medium, fontSize: 16, lineHeight: 24, color: colors.greenOutline }}>
                      To win ${toWin.toFixed(2)}
                    </Text>
                  </Pressable>

                  <View style={{ flexDirection: "row", gap: 10 }}>
                    {QUICK_AMOUNTS.map((q) => (
                      <QuickBtn key={q} label={`$${q}`} onPress={() => setAmountStr(String(q))} />
                    ))}
                    <QuickBtn label="Max" onPress={() => setAmountStr(String(BALANCE))} />
                  </View>

                  <View style={{ gap: 12 }}>
                    <PayWithSummaryRow />
                    <SummaryRow label="Total" info value={`$${amount.toFixed(2)}`} />
                  </View>
                </>
              )}

              {/* Numeric keypad — hidden by default; toggled by tapping the
                  shares value in limit mode (edits shares) or the big amount
                  in market mode (edits dollars). */}
              {keypadOpen && (
                <View style={{ gap: 8 }}>
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
                          style={({ pressed }) => [{ flex: 1, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface2 }, buttonInteractionStyle(pressed)]}
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
            </ScrollView>
            <View style={{ gap: 8, paddingTop: 16 }}>
              <BuyAction
                key={`${pick.title}-${pick.oddsCents}-${open}`}
                label={buyLabel}
                onConfirm={() => {
                  addPlacedPosition({
                    kind: "single",
                    market: pick.market,
                    title: pick.title,
                    color: pick.color,
                    cents: pick.oddsCents,
                    cost: amount,
                    toWin: payout,
                    orderType: isLimit ? "limit" : "market",
                    detailHref: pick.returnTo || undefined,
                  });
                  closeBetSlip();
                  router.push({
                    pathname: "/trade-submitted",
                    params: {
                      market: pick.market,
                      title: pick.title,
                      color: pick.color ?? "",
                      cost: amount.toFixed(2),
                      toWin: payout.toFixed(2),
                      orderType: isLimit ? "limit" : "market",
                      returnTo: pick.returnTo ?? "",
                    },
                  });
                }}
              />
              <Text style={{ fontFamily: geist.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted, textAlign: "center" }}>
                {"By continuing, you accept the platform terms. "}
                <Text style={{ color: uxr ? UXR_BLUE : colors.accent }}>Learn more</Text>
              </Text>
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
    <OrderBookSheet visible={bookOpen} pick={pick} onClose={() => setBookOpen(false)} />
    </>
  );
}

function clampCents(c: number) {
  return Math.max(1, Math.min(99, c));
}

// Single button showing the current order type with a swap glyph. Tapping
// cycles Market -> Limit -> Market (no segmented toggle).
function OrderTypeButton({ value, onChange }: { value: "market" | "limit"; onChange: (v: "market" | "limit") => void }) {
  const uxr = useUxrMode() === "uxr";
  const themeMode = useThemeMode();
  const light = themeMode === "light";
  const betR = useBetRadius();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Order type"
      onPress={() => onChange(value === "market" ? "limit" : "market")}
      style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, height: 36, borderRadius: betR, backgroundColor: light || !uxr ? colors.surface2 : "rgba(255,255,255,0.08)" }, buttonInteractionStyle(pressed)]}
    >
      <Text style={{ fontFamily: geist.semibold, fontSize: 14, color: colors.textPrimary }}>
        {value === "market" ? "Market" : "Limit"}
      </Text>
      <SwapIcon size={15} />
    </Pressable>
  );
}

// Centered outlined pill flanked by full-width hairlines (reference layout);
// selected segment gets a dark fill with green (YES) or red (NO) text. When
// `yesCents` is set (market mode), each side carries its inline price.
function YesNoToggle({ side, onChange, yesCents }: { side: "yes" | "no"; onChange: (s: "yes" | "no") => void; yesCents?: number }) {
  const betR = useBetRadius();
  const opts: { v: "yes" | "no"; tone: "green" | "red" }[] = [
    { v: "yes", tone: "green" },
    { v: "no", tone: "red" },
  ];
  // The pill row bleeds to the sheet edges so the flanking hairlines run all
  // the way out (the sheet body has 20px side padding).
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginHorizontal: -20 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.cardBorder }} />
      <View style={{ flexDirection: "row", borderRadius: betR === 999 ? 999 : 14, padding: 4, borderWidth: 1, borderColor: colors.cardBorder }}>
        {opts.map((o) => {
          const sel = o.v === side;
          const accent = o.tone === "green" ? colors.greenOutline : colors.red;
          const label =
            yesCents == null
              ? o.v === "yes" ? "YES" : "NO"
              : o.v === "yes" ? `YES ${fmtCents(yesCents)}` : `NO ${fmtCents(clampCents(100 - yesCents))}`;
          return (
            <Pressable
              key={o.v}
              onPress={() => onChange(o.v)}
              style={({ pressed }) => [{ paddingHorizontal: 18, height: 40, borderRadius: betR, alignItems: "center", justifyContent: "center", backgroundColor: sel ? colors.surface2 : "transparent" }, buttonInteractionStyle(pressed)]}
            >
              <Text style={{ fontFamily: geist.semibold, fontSize: 14, letterSpacing: 0.2, color: sel ? accent : colors.textPrimary }}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.cardBorder }} />
    </View>
  );
}

function Stepper({ icon, onPress }: { icon: "add" | "remove"; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" }}>
      <Ionicons name={icon} size={24} color={colors.textPrimary} />
    </Pressable>
  );
}

// Exact 12x12 glyphs supplied as design assets (attached_assets/Icon*.svg) —
// swap arrows for the Market/Limit button, info circle for summary rows, and
// chevron for drill-in rows. Color/size parametrized; paths untouched.
function SwapIcon({ size = 15, color = colors.textPrimary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Path d="M3.5 10L1 7.5L3.5 5L4.2 5.7125L2.9125 7H6.5V8H2.9125L4.2 9.2875L3.5 10ZM8.5 7L7.8 6.2875L9.0875 5H5.5V4H9.0875L7.8 2.7125L8.5 2L11 4.5L8.5 7Z" fill={color} />
    </Svg>
  );
}

function QuickBtn({ label, onPress }: { label: string; onPress: () => void }) {
  const uxr = useUxrMode() === "uxr";
  const themeMode = useThemeMode();
  const light = themeMode === "light";
  const betR = useBetRadius();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ flex: 1, height: 44, borderRadius: betR, alignItems: "center", justifyContent: "center", backgroundColor: light || !uxr ? colors.surface2 : "rgba(255,255,255,0.08)" }, buttonInteractionStyle(pressed)]}>
      <Text style={[METAMASK_BUTTON_LABEL, { color: colors.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}
