import React, { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BackIcon } from "@/components/PageHeader";

import { BtcLiveChart } from "@/components/sim/LiveCardsCarousel";
import { MarketActionFooter, MARKET_ACTION_FOOTER_SPACE } from "@/components/sim/MarketActionFooter";
import { MarketRulesSection } from "@/components/sim/MarketRulesSection";
import { MatchPositionsSection } from "@/components/sim/MatchPositionsSection";
import { LIVE_CHAT_FOOTER_RESERVE } from "@/components/sim/MarketLiveChat";
import { MarketPageBody } from "@/components/sim/MarketPageTabs";
import { StickyDetailScroll } from "@/components/sim/StickyDetailScroll";
import { useFixedMarketActions } from "@/lib/sim/marketDetailActionsStore";
import { useBetRadius } from "@/lib/sim/pillButtonsStore";
import { useOutcomeButtonColorMode } from "@/lib/sim/outcomeButtonColorStore";
import { outcomeButtonVisual } from "@/lib/sim/buttonStyle";
import { openBetSlip } from "@/lib/sim/betSlipStore";
import { colors, uxrPaletteColor } from "@/lib/sim/colors";
import { screenTopInset } from "@/lib/sim/layout";
import { useThemeMode } from "@/lib/sim/dsModeStore";
import { geist } from "@/lib/sim/geistFonts";
import { BTC_DAILY } from "@/lib/sim/data";

// "BTC Up or Down 5m" detail page: the recurring 5-minute up/down market in
// the standard detail-page structure (identity header → round chips → prices
// → live chart with the animated dotted target line → colored Up/Down
// buttons → Market rules → Positions).

const TITLE = "BTC Up or Down 5m";
const BTC_ORANGE = "#F7931A";
const ROUND_MS = 5 * 60 * 1000;

function fmtUsd(v: number): string {
  const whole = Math.floor(v);
  const cents = Math.round((v - whole) * 100);
  return `$${whole.toLocaleString("en-US")}.${String(cents).padStart(2, "0")}`;
}

function fmtClockTime(d: Date): string {
  let h = d.getHours() % 12;
  if (h === 0) h = 12;
  return `${h}:${String(d.getMinutes()).padStart(2, "0")} ${d.getHours() >= 12 ? "PM" : "AM"}`;
}

function fmtDateLine(d: Date): string {
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${months[d.getMonth()]} ${d.getDate()} at ${fmtClockTime(d)}`;
}

export default function BtcUpDownScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useThemeMode();
  const betR = useBetRadius();
  useOutcomeButtonColorMode();
  const fixedMarketActions = useFixedMarketActions();
  const { width: winW } = useWindowDimensions();
  const [quote, setQuote] = useState<{ price: number; target: number } | null>(null);
  const [scrubPrice, setScrubPrice] = useState<number | null>(null);
  // 1s clock tick drives the live countdown + round chips.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Current 5-minute round: started at the last 5-min boundary.
  const roundStart = Math.floor(now / ROUND_MS) * ROUND_MS;
  const remain = Math.max(0, roundStart + ROUND_MS - now);
  const mm = Math.floor(remain / 60000);
  const ss = Math.floor((remain % 60000) / 1000);
  const countdown = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  const upcoming = [1, 2, 3].map((i) => fmtClockTime(new Date(roundStart + ROUND_MS * (i + 1))));

  const delta = quote ? quote.price - quote.target : 0;
  const up = delta >= 0;
  const greenLine = uxrPaletteColor(colors.green);
  const redLine = uxrPaletteColor(colors.red);
  // Scrub-aware header values: while the finger is down on the chart the
  // right column shows the scrubbed point instead of the live quote.
  const hdrPrice = scrubPrice ?? (quote ? quote.price : null);
  const hdrUp = quote ? (scrubPrice != null ? scrubPrice >= quote.target : up) : true;
  const hdrDelta = quote && scrubPrice != null ? scrubPrice - quote.target : delta;
  const hdrColor = hdrUp ? greenLine : redLine;
  const upPct = 66;
  const btcActions = [
    {
      key: "up",
      label: `Up ${upPct}¢`,
      color: greenLine,
      onPress: () => openBetSlip({ title: "Up", market: TITLE, oddsCents: upPct, color: greenLine, side: "yes", returnTo: "/btc-updown" }),
    },
    {
      key: "down",
      label: `Down ${100 - upPct}¢`,
      color: redLine,
      onPress: () => openBetSlip({ title: "Down", market: TITLE, oddsCents: 100 - upPct, color: redLine, side: "no", returnTo: "/btc-updown" }),
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StickyDetailScroll
        topInset={screenTopInset(insets.top)}
        paddingBottom={insets.bottom + (fixedMarketActions ? MARKET_ACTION_FOOTER_SPACE : 40)}
        header={
          <>
        {/* Nav row: back · share. */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 }}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <BackIcon />
          </Pressable>
          <Pressable hitSlop={10}>
            <MaterialIcons name="ios-share" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        {/* Market identity line: avatar · title + round date. */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 12, marginTop: 18 }}>
          <View style={{ width: 40, height: 40, borderRadius: 10, overflow: "hidden", backgroundColor: colors.surface2 }}>
            <Image
              source={require("@/assets/figmaAssets/btc-logo-orange.png")}
              style={{ width: 40, height: 40 }}
              resizeMode="cover"
            />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              numberOfLines={1}
              style={{ fontFamily: geist.semibold, fontSize: 16, lineHeight: 22, color: colors.textPrimary }}
            >
              {TITLE}
            </Text>
            <Text style={{ fontFamily: geist.regular, fontSize: 13, lineHeight: 18, color: colors.textMuted, marginTop: 2 }}>
              {fmtDateLine(new Date(roundStart))}
            </Text>
          </View>
        </View>
          </>
        }
      >

        {/* Round chips: live round with countdown, then the next rounds. */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16, flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 16 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                height: 40,
                paddingHorizontal: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.green,
              }}
            >
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.greenOutline }} />
              <Text style={{ fontFamily: geist.semibold, fontSize: 14, letterSpacing: 0.4, color: colors.greenOutline }}>
                LIVE <Text style={{ fontFamily: geist.medium, letterSpacing: 0, color: colors.textMuted }}>{countdown}</Text>
              </Text>
            </View>
            {upcoming.map((tLabel) => (
              <View
                key={tLabel}
                style={{ height: 40, paddingHorizontal: 14, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ fontFamily: geist.medium, fontSize: 14, color: colors.textPrimary }}>{tLabel}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Price to beat · current price. */}
        <View style={{ flexDirection: "row", paddingHorizontal: 16, marginTop: 20, gap: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: geist.regular, fontSize: 14, color: colors.textMuted }}>Price to beat (target)</Text>
            <Text style={{ fontFamily: geist.semibold, fontSize: 26, lineHeight: 34, color: colors.textPrimary, marginTop: 4 }}>
              {quote ? fmtUsd(quote.target) : "—"}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: geist.regular, fontSize: 14, color: hdrColor }}>
              {scrubPrice != null ? "Price" : `Current price ${quote ? `${hdrUp ? "+" : "−"}$${Math.abs(hdrDelta).toFixed(2)}` : ""}`}
            </Text>
            <Text style={{ fontFamily: geist.semibold, fontSize: 26, lineHeight: 34, color: hdrColor, marginTop: 4 }}>
              {hdrPrice != null ? fmtUsd(hdrPrice) : "—"}
            </Text>
          </View>
        </View>

        {/* Live chart: centered "Target" caption + animated dotted line. */}
        <View style={{ marginTop: 8 }}>
          <BtcLiveChart width={winW - 16} height={280} fadeBg={colors.bg} onQuote={(price, target) => setQuote({ price, target })} scrub onScrub={setScrubPrice} />
        </View>

        {/* Up / Down — inline only when the shared action setting is inline. */}
        {!fixedMarketActions && (
          <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 16, marginTop: 18 }}>
            {btcActions.map((action) => {
              const visual = outcomeButtonVisual("default", "gray-colored", action.color);
              return (
              <Pressable
                key={action.key}
                onPress={action.onPress}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: betR === 999 ? 999 : 12,
                  alignItems: "center",
                  justifyContent: "center",
                  ...visual.container,
                }}
              >
                <Text style={{ fontFamily: geist.medium, fontSize: 16, ...visual.text }}>
                  {action.label}
                </Text>
              </Pressable>
              );
            })}
          </View>
        )}

        <MarketPageBody
          marketTitle={TITLE}
          footerReserve={fixedMarketActions ? LIVE_CHAT_FOOTER_RESERVE : 0}
          hidePredictHeading
          positionNames={["Up", "Down"]}
          rules={
            <MarketRulesSection
              subject={TITLE}
              volume={BTC_DAILY.vol}
              ends={BTC_DAILY.resets}
              resolver="Coinbase BTC-USD spot"
              paragraphs={[
                "This market resolves to Up if the price of Bitcoin at the end of the 5-minute round is above the price to beat (the price locked at the start of the round), and Down otherwise.",
                "Rounds reset every 5 minutes. Price sourced from the Coinbase BTC-USD spot rate.",
              ]}
            />
          }
          positions={({ tabbed }) => (
            <MatchPositionsSection names={["Up", "Down"]} marketTitle={TITLE} returnTo="/btc-updown" hideHeading={tabbed} showEmpty={tabbed} />
          )}
          predict={
            <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 16, marginTop: 18 }}>
              {btcActions.map((action) => {
                const visual = outcomeButtonVisual("default", "gray-colored", action.color);
                return (
                <Pressable
                  key={action.key}
                  onPress={action.onPress}
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: betR === 999 ? 999 : 12,
                    alignItems: "center",
                    justifyContent: "center",
                    ...visual.container,
                  }}
                >
                  <Text style={{ fontFamily: geist.medium, fontSize: 16, ...visual.text }}>{action.label}</Text>
                </Pressable>
                );
              })}
            </View>
          }
        />
      </StickyDetailScroll>
      {fixedMarketActions && <MarketActionFooter actions={btcActions} bottomInset={insets.bottom} />}
    </View>
  );
}
