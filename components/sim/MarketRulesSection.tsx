import React, { useState } from "react";
import { Pressable, Text, View, Linking } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

import { chartGridColor, chartGridOpacity, colors, ON_SURFACE_BUTTON_BG } from "@/lib/sim/colors";
import { BTC_DAILY } from "@/lib/sim/data";
import { useThemeMode } from "@/lib/sim/dsModeStore";
import { useKalshiVenue } from "@/lib/sim/kalshiMarkets";
import { useMarketRulesStyle } from "@/lib/sim/marketRulesStore";
import { findPredictionMarket } from "@/lib/sim/predictionRegistry";
import { DetailSectionHeading } from "@/components/sim/MatchPositionsSection";
import { MarketHelpSheet } from "@/components/sim/MarketHelpSheet";
import { geist } from "@/lib/sim/geistFonts";
import { VolumeText } from "@/components/sim/VolumeText";

export function SectionRule() {
  const themeMode = useThemeMode();
  return (
    <View style={{ paddingVertical: 32 }}>
      <View
        style={{
          height: 1,
          backgroundColor: chartGridColor(themeMode),
          opacity: chartGridOpacity(themeMode),
        }}
      />
    </View>
  );
}

// "Market rules" section for detail pages, placed above Positions. Three
// presentations (settings > "Market rules", default banner):
//  - banner: tappable surface card — title, 2-line truncated rules, chevron;
//    the whole card opens the full-rules detent sheet.
//  - section: heading + 2-line truncated text + "View full rules" button.
//  - about: Polymarket-style details (volume, end, resolver, full rules).
//    On Social UX market pages this lives in the About tab.

// Generic mock resolution copy, parameterized by the market's display name.
export function defaultMarketRules(subject: string): string[] {
  return [
    `This market will resolve to the outcome officially declared for ${subject} by the relevant governing body or league. The resolution source is the official final result, including any adjustments made before the result is declared final.`,
    "If the event is postponed, the market remains open and will resolve once the event completes, provided it finishes within 14 days of the originally scheduled start time. If the event is cancelled or not completed within that window, the market resolves N/A and all positions are refunded.",
    "Overtime, extra time, penalty shoot-outs, and other tie-breaking procedures count toward the final result unless the market title explicitly states otherwise (for example \u201cregulation time only\u201d markets exclude them).",
    "Any official post-game corrections announced within 24 hours of the final whistle are honored. Rulings made after a market has resolved will not reverse resolution.",
  ];
}

function aboutDefaults(subject: string): { volume: string; ends: string; resolver: string } {
  if (/btc|bitcoin/i.test(subject) && /up or down/i.test(subject)) {
    return {
      volume: BTC_DAILY.vol,
      ends: BTC_DAILY.resets,
      resolver: "Coinbase BTC-USD spot",
    };
  }
  const rec = findPredictionMarket(subject);
  const crypto = /btc|bitcoin|eth|ethereum|sol|crypto|coin/i.test(subject);
  return {
    volume: rec?.vol ?? "\u2014",
    ends: rec?.date ?? "When the event completes",
    resolver: crypto ? "CF Benchmarks / Coinbase" : "UMA optimistic oracle",
  };
}

const POLYMARKET_URL = "https://polymarket.com";
const KALSHI_URL = "https://kalshi.com";
const RESOLUTION_LINK = "#818cf8";

function compactVol(value: string) {
  return value.replace(/\s*Vol\.?$/i, "").trim();
}

function formatEndDate(raw: string) {
  const stripped = raw.replace(/^Ends\s+/i, "").trim();
  const ms = Date.parse(stripped);
  if (!Number.isFinite(ms)) return stripped;
  return new Date(ms).toDateString();
}

export function MarketAboutContent({
  subject,
  paragraphs,
  volume,
  ends,
  resolver: _resolver,
}: {
  subject: string;
  paragraphs?: string[];
  volume?: string;
  ends?: string;
  resolver?: string;
}) {
  const kalshi = useKalshiVenue();
  const rules = paragraphs ?? defaultMarketRules(subject);
  const meta = aboutDefaults(subject);
  const vol = compactVol(volume ?? meta.volume);
  const end = formatEndDate(ends ?? meta.ends);
  const venueLabel = kalshi ? "Kalshi" : "Polymarket";
  const venueUrl = kalshi ? KALSHI_URL : POLYMARKET_URL;
  const rows: { icon: "bar-chart" | "schedule" | "apartment"; label: string; value: string; link?: boolean }[] = [
    { icon: "bar-chart", label: "Volume", value: vol },
    { icon: "schedule", label: "End date", value: end },
    { icon: "apartment", label: "Resolution details", value: venueLabel, link: true },
  ];
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}>
      {rows.map((row) => (
        <View
          key={row.label}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingVertical: 14,
          }}
        >
          <MaterialIcons name={row.icon} size={20} color={colors.textPrimary} />
          <Text style={{ flex: 1, fontFamily: geist.regular, fontSize: 16, lineHeight: 22, color: colors.textPrimary }}>
            {row.label}
          </Text>
          {row.link ? (
            <Pressable
              onPress={() => Linking.openURL(venueUrl)}
              style={{ flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 1 }}
              hitSlop={8}
            >
              <Text
                numberOfLines={1}
                style={{ fontFamily: geist.regular, fontSize: 16, lineHeight: 22, color: RESOLUTION_LINK }}
              >
                {row.value}
              </Text>
              <MaterialIcons name="open-in-new" size={16} color={RESOLUTION_LINK} />
            </Pressable>
          ) : row.label === "Volume" ? (
            <VolumeText style={{ fontSize: 16, lineHeight: 22, color: colors.textPrimary }}>{row.value}</VolumeText>
          ) : (
            <Text style={{ fontFamily: geist.regular, fontSize: 16, lineHeight: 22, color: colors.textPrimary }}>
              {row.value}
            </Text>
          )}
        </View>
      ))}
      <View style={{ height: 1, backgroundColor: colors.cardBorder, marginTop: 4, marginBottom: 20 }} />
      <View style={{ gap: 12 }}>
        {rules.map((p, i) => (
          <Text key={i} style={{ fontFamily: geist.regular, fontSize: 15, lineHeight: 22, color: colors.textMuted }}>
            {p}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function MarketRulesSection({
  subject,
  paragraphs,
  volume,
  ends,
  resolver,
}: {
  subject: string;
  paragraphs?: string[];
  volume?: string;
  ends?: string;
  resolver?: string;
}) {
  const [open, setOpen] = useState(false);
  const styleMode = useMarketRulesStyle();
  const rules = paragraphs ?? defaultMarketRules(subject);
  if (styleMode === "about") {
    return (
      <MarketAboutContent
        subject={subject}
        paragraphs={paragraphs}
        volume={volume}
        ends={ends}
        resolver={resolver}
      />
    );
  }
  if (styleMode === "banner") {
    return (
      <>
        <Pressable
          onPress={() => setOpen(true)}
          style={({ pressed }) => ({
            marginTop: 16,
            marginHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            borderRadius: 16,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            paddingVertical: 16,
            paddingLeft: 16,
            paddingRight: 12,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontFamily: geist.semibold, fontSize: 16, lineHeight: 24, color: colors.textPrimary }}>
              Market rules
            </Text>
            <Text
              numberOfLines={2}
              ellipsizeMode="tail"
              style={{ marginTop: 6, fontFamily: geist.regular, fontSize: 14, lineHeight: 22, color: colors.textMuted }}
            >
              {rules.join(" ")}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
        </Pressable>
        <MarketHelpSheet visible={open} title="Market rules" paragraphs={rules} onClose={() => setOpen(false)} />
      </>
    );
  }
  return (
    <>
      <SectionRule />
      <DetailSectionHeading marginTop={0}>Market rules</DetailSectionHeading>
      <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
        <Text
          numberOfLines={2}
          ellipsizeMode="tail"
          style={{ fontFamily: geist.regular, fontSize: 14, lineHeight: 22, color: colors.textMuted }}
        >
          {rules.join("\n\n")}
        </Text>
        <Pressable
          onPress={() => setOpen(true)}
          style={({ pressed }) => ({
            marginTop: 12,
            alignSelf: "stretch",
            height: 40,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: ON_SURFACE_BUTTON_BG,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ fontFamily: geist.medium, fontSize: 14, color: colors.textPrimary }}>View full rules</Text>
        </Pressable>
      </View>
      <MarketHelpSheet visible={open} title="Market rules" paragraphs={rules} onClose={() => setOpen(false)} />
    </>
  );
}
