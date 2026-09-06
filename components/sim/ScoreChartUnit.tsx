import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

import { LIVE_DOT_SIZE, LiveDot, LiveStatusStamp } from "@/components/sim/Crest";
import { DOT, RippleDot } from "@/components/sim/RippleDot";
import { smoothAreaPath, smoothPath } from "@/lib/sim/chartPath";
import { useMmLogo } from "@/lib/sim/mmLogoStore";
import { useChartGradient } from "@/lib/sim/chartGradientStore";
import { chartGridColor, chartGridOpacity, colors, filledChipBackground, filledChipForeground } from "@/lib/sim/colors";
import { useThemeMode } from "@/lib/sim/dsModeStore";
import { geist } from "@/lib/sim/geistFonts";
import { useDisplayFont, useOswaldDataSet } from "@/lib/sim/typefaceStore";
import { useTeamAbbrUnderLogos } from "@/lib/sim/teamAbbrUnderLogosStore";

// ── Panthers vs. Cardinals scoring + chart unit ──────────────────────────────
// The EXACT score strip · probability chart · MetaMask watermark · period-pill
// unit from the approved game-detail page, extracted verbatim so every other
// detail page renders the identical component instead of a re-implementation.
//
// Usage:
//   <ScoreChartUnit
//     left={{ icon: <HelmetIcon .../>, score: 21 }}
//     right={{ icon: <HelmetIcon ... flip />, score: 17 }}
//     clock="Q3 · 5:58"
//     live
//     series={[{ color: "#7cc0ff", points: [...0..1] }, ...]}
//   />
// `children` (optional) renders between the score strip and the chart for
// pages that need extra header content.

export const PERIODS = ["LIVE", "1D", "1W", "1M", "1Y"];

const MM_WORDMARK_PATH =
  "M27.4896 18.5169V23.7777H24.7728V20.1329L21.6768 20.4929C20.9968 20.5713 20.6976 20.7937 20.6976 21.2033C20.6976 21.8033 21.2656 22.0561 22.4832 22.0561C23.2256 22.0561 24.048 21.9457 24.7744 21.7553L23.368 23.7457C22.8 23.8721 22.2464 23.9345 21.6624 23.9345C19.1984 23.9345 17.792 22.9553 17.792 21.2177C17.792 19.6849 18.8976 18.8801 21.4096 18.5953L24.728 18.2097C24.5488 17.2449 23.8208 16.8257 22.3728 16.8257C21.0144 16.8257 19.5136 17.1729 18.1712 17.8209L18.5984 15.4673C19.8464 14.9457 21.2688 14.6769 22.7056 14.6769C25.8656 14.6769 27.4928 15.9889 27.4928 18.5153L27.4896 18.5169ZM3.04956 11.9297L0.0799561 23.7777H3.04956L4.52316 17.8241L7.07836 20.8865H10.1744L12.7296 17.8241L14.2032 23.7777H17.1728L14.2032 11.9281L8.62556 18.5521L3.04796 11.9281L3.04956 11.9297ZM14.2032 0.0800781L8.62556 6.70408L3.04956 0.0800781L0.0799561 11.9297H3.04956L4.52316 5.97608L7.07836 9.03848H10.1744L12.7296 5.97608L14.2032 11.9297H17.1728L14.2032 0.0800781ZM34.6304 18.4065L32.2288 18.0593C31.6288 17.9649 31.392 17.7745 31.392 17.4433C31.392 16.9057 31.976 16.6689 33.1776 16.6689C34.568 16.6689 35.816 16.9537 37.128 17.5697L36.7968 15.2481C35.7376 14.8689 34.5216 14.6801 33.2576 14.6801C30.304 14.6801 28.6912 15.7073 28.6912 17.5553C28.6912 18.9937 29.576 19.7985 31.456 20.0833L33.8896 20.4465C34.5056 20.5409 34.7584 20.7777 34.7584 21.1569C34.7584 21.6945 34.1904 21.9473 33.0368 21.9473C31.52 21.9473 29.8768 21.5841 28.5344 20.9361L28.8032 23.2577C29.9568 23.6849 31.4576 23.9377 32.864 23.9377C35.8976 23.9377 37.4768 22.8785 37.4768 20.9985C37.4768 19.4977 36.592 18.6913 34.6336 18.4081L34.6304 18.4065ZM38.5328 12.9873V23.7777H41.2496V12.9873H38.5328ZM44.424 18.9281L48.2016 14.8353H44.8208L41.2496 19.0689L45.0576 23.7761H48.4864L44.424 18.9265V18.9281ZM38.1536 9.36968C38.1536 11.1073 39.56 12.0865 42.024 12.0865C42.608 12.0865 43.1616 12.0225 43.7296 11.8977L45.136 9.90728C44.4096 10.0961 43.5872 10.2081 42.8448 10.2081C41.6288 10.2081 41.0592 9.95528 41.0592 9.35528C41.0592 8.94408 41.36 8.72328 42.0384 8.64488L45.1344 8.28488V11.9297H47.8512V6.66888C47.8512 4.14088 46.224 2.83048 43.064 2.83048C41.6256 2.83048 40.2048 3.09928 38.9568 3.62088L38.5296 5.97448C39.872 5.32648 41.3728 4.97928 42.7312 4.97928C44.1792 4.97928 44.9072 5.39848 45.0864 6.36328L41.768 6.74888C39.256 7.03368 38.1504 7.83848 38.1504 9.37128L38.1536 9.36968ZM30.5552 8.80168C30.5552 10.9825 31.8192 12.0881 34.3152 12.0881C35.3104 12.0881 36.1328 11.9297 36.9216 11.5665L37.2688 9.18088C36.5104 9.63848 35.736 9.87528 34.9616 9.87528C33.792 9.87528 33.2704 9.40168 33.2704 8.34248V5.18248H37.3936V2.98728H33.2704V1.12328L28.104 3.85608V5.18248H30.552V8.80008L30.5552 8.80168ZM27.8848 7.80648V8.34408H20.5424C20.8736 9.43848 21.8576 9.93928 23.6048 9.93928C24.9952 9.93928 26.2912 9.65448 27.4432 9.10248L27.112 11.4097C26.0528 11.8513 24.7104 12.0897 23.336 12.0897C19.6864 12.0897 17.696 10.4785 17.696 7.49288C17.696 4.50728 19.7184 2.83208 22.8464 2.83208C25.9744 2.83208 27.8864 4.64968 27.8864 7.80808L27.8848 7.80648ZM20.5072 6.51048H25.1504C24.9056 5.46248 24.1008 4.91528 22.8144 4.91528C21.528 4.91528 20.7648 5.44808 20.5072 6.51048Z";

export const CHART_H = 150;
const MIN_GAP = 0.18; // dot separation as a fraction of the plot
const CHART_LEFT_FADE_W = 56;

export type ScoreSide = { icon: React.ReactNode; score: string | number; abbr?: string };
export type ChartSeriesInput = { color: string; points: number[] };

// The centered LIVE + clock stamp (13pt semantic success dot/label, muted clock).
export function LiveClockStamp({ clock, live }: { clock: string; live: boolean }) {
  return (
    <View style={styles.centerClock}>
      {live && (
        <LiveStatusStamp detail={clock} />
      )}
      {!live ? (
        <Text style={[styles.clockText, { fontSize: 13, color: colors.textMuted }]}>{clock}</Text>
      ) : null}
    </View>
  );
}

// Score strip: five units — avatar · score · live/bases · score · avatar.
// Avatars sit 16px from the screen edges; remaining space is split evenly
// between the five units (`space-between`). Score digits share one width so
// "3" and "12" don't pull the row off-center.
export function ScoreStrip({
  left,
  right,
  clock,
  live,
  centerContent,
  embedded = false,
  alwaysShowAbbr = false,
}: {
  left: ScoreSide;
  right: ScoreSide;
  clock: string;
  live: boolean;
  centerContent?: React.ReactNode;
  embedded?: boolean;
  /** Detail pages always show abbr; feed/live carousel honor Hide. */
  alwaysShowAbbr?: boolean;
}) {
  const displayFont = useDisplayFont();
  const oswald = useOswaldDataSet();
  const settingShowAbbr = useTeamAbbrUnderLogos();
  const showAbbr = alwaysShowAbbr || settingShowAbbr;
  const scoreStyle = (v: string | number) => [styles.bigScore, { fontFamily: displayFont, color: colors.textPrimary }, String(v).length > 4 && { fontSize: 26 }];
  const scoreCandidates = [String(left.score), String(right.score)];
  const renderScore = (value: string | number) => (
    <View style={styles.hugScoreCell}>
      <View pointerEvents="none" style={styles.hugScoreMeasure}>
        {scoreCandidates.map((candidate, index) => (
          <Text key={`${candidate}-${index}`} {...oswald} numberOfLines={1} style={[scoreStyle(candidate), styles.hugScoreMeasureText]}>
            {candidate}
          </Text>
        ))}
      </View>
      <Text {...oswald} numberOfLines={1} style={[scoreStyle(value), styles.hugScoreValue]}>
        {value}
      </Text>
    </View>
  );
  const sideCol = (side: ScoreSide) => (
    <View style={{ alignItems: "center", gap: showAbbr && side.abbr ? 8 : 0 }}>
      {side.icon}
      {showAbbr && side.abbr ? (
        <Text style={{ fontFamily: geist.medium, fontSize: 12, lineHeight: 16, color: colors.textAlternative }}>
          {side.abbr.toUpperCase()}
        </Text>
      ) : null}
    </View>
  );
  return (
    <View style={[styles.scoreStrip, embedded && { paddingHorizontal: 0, marginTop: 0, width: "100%" }]}>
      <View style={styles.scoreItem}>{sideCol(left)}</View>
      <View style={styles.scoreItem}>{renderScore(left.score)}</View>
      <View style={styles.scoreItem}>
        {centerContent !== undefined ? centerContent : <LiveClockStamp clock={clock} live={live} />}
      </View>
      <View style={styles.scoreItem}>{renderScore(right.score)}</View>
      <View style={styles.scoreItem}>{sideCol(right)}</View>
    </View>
  );
}

// Probability chart + MetaMask watermark + period pills. Owns the period
// state; the ripple dots animate only on LIVE.
// Linear sample of a 0..1 series at a fractional position along the plot.
function sampleAt(points: number[], frac: number): number {
  const n = points.length;
  if (n === 0) return 0;
  if (n === 1) return points[0];
  const t = Math.min(1, Math.max(0, frac)) * (n - 1);
  const i0 = Math.floor(t);
  const i1 = Math.min(n - 1, i0 + 1);
  return points[i0] + (points[i1] - points[i0]) * (t - i0);
}

// Polymarket-style scrub annotation: dashed time label at the top of the
// guide line plus a name + big-% label riding each line at the touch point.
export function ScrubOverlay({
  scrub,
  plotW,
  series,
  names,
  period,
  showTime = true,
  values,
}: {
  scrub: number;
  plotW: number;
  series: ChartSeriesInput[]; // points already in plot space (0..1)
  names: string[];
  period: string;
  // The timestamp only shows while actively scrubbing (not at the live edge).
  showTime?: boolean;
  // Original (pre-fit/pre-push) series for the % label values; defaults to
  // `series` when the chart isn't rescaled.
  values?: ChartSeriesInput[];
}) {
  const themeMode = useThemeMode();
  const x = scrub * plotW;
  // Vertical positions: center each label block on its line, then push
  // overlapping blocks apart.
  const BLOCK = 50;
  const raw = series.map((s, i) => ({
    i,
    y: 12 + (1 - sampleAt(s.points, scrub)) * (CHART_H - 24),
    v: Math.round(sampleAt((values ?? series)[i].points, scrub) * 100),
  }));
  const order = [...raw].sort((a, b) => a.y - b.y);
  for (let k = 1; k < order.length; k++) {
    if (order[k].y - order[k - 1].y < BLOCK) order[k].y = order[k - 1].y + BLOCK;
  }
  for (const r of order) r.y = Math.min(CHART_H - BLOCK / 2, Math.max(BLOCK / 2 - 6, r.y));
  return (
    <>
      {/* Everything to the right of the scrub position fades out. */}
      {scrub < 0.995 && (
        <ExpoLinearGradient
          pointerEvents="none"
          colors={
            themeMode === "light"
              ? ["rgba(255,255,255,0)", colors.bg]
              : ["rgba(9,9,10,0.62)", "rgba(9,9,10,0.62)"]
          }
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ position: "absolute", left: x + 1, right: 0, top: 0, bottom: 0 }}
        />
      )}
      {showTime && <ScrubTimeLabel scrub={scrub} plotW={plotW} period={period} />}
      {order.map((r) => (
        <View
          key={r.i}
          pointerEvents="none"
          style={{
            position: "absolute",
            // 12px gap between the dot edge and the label.
            left: x + DOT / 2 + 12,
            top: r.y - BLOCK / 2,
            alignItems: "flex-start",
          }}
        >
          <Text style={{ fontFamily: geist.semibold, fontSize: 14, color: series[r.i].color }}>
            {names[r.i] ?? ""}
          </Text>
          <Text style={{ fontFamily: geist.medium, fontSize: 24, lineHeight: 30, color: series[r.i].color }}>
            {r.v}%
          </Text>
        </View>
      ))}
    </>
  );
}

// Scrub timestamp pinned under the chart — shared by ScrubOverlay and charts
// that scrub without per-series labels (e.g. prediction detail).
export function ScrubTimeLabel({ scrub, plotW, period }: { scrub: number; plotW: number; period: string }) {
  const x = scrub * plotW;
  return (
    <Text
      style={{
        position: "absolute",
        bottom: -20,
        left: Math.min(Math.max(x - 60, 0), plotW - 90),
        width: 120,
        textAlign: "center",
        fontFamily: geist.semibold,
        fontSize: 13,
        color: colors.textMuted,
      }}
    >
      {scrubTimeLabel(scrub, period)}
    </Text>
  );
}

// Human time label for a scrub position, scaled to the active period.
// (Mock data — deterministic labels, "now" = the right edge.)
export function scrubTimeLabel(frac: number, period: string): string {
  const f = Math.min(1, Math.max(0, frac));
  if (period === "LIVE") {
    // A 45-minute live window: Q1..Q3, 15 min per quarter.
    const total = f * 45;
    const q = Math.min(3, Math.floor(total / 15) + 1);
    const inQ = total - (q - 1) * 15;
    const mm = Math.floor(inQ);
    const ss = Math.floor((inQ - mm) * 60);
    return `Q${q} \u00b7 ${mm}:${String(ss).padStart(2, "0")}`;
  }
  if (period === "1D") {
    const h = Math.round(f * 24); // hours into the day
    const hr12 = ((h + 11) % 12) + 1;
    return `Aug ${h < 24 ? 9 : 10} ${hr12}${h % 24 < 12 ? "AM" : "PM"}`;
  }
  if (period === "1W") {
    const days = ["Aug 3", "Aug 4", "Aug 5", "Aug 6", "Aug 7", "Aug 8", "Aug 9", "Aug 10"];
    return days[Math.round(f * (days.length - 1))];
  }
  if (period === "1M") {
    const day = Math.round(f * 30);
    return day < 20 ? `Jul ${11 + day}` : `Aug ${day - 20 || 1}`;
  }
  const months = ["Aug '25", "Oct '25", "Dec '25", "Feb '26", "Apr '26", "Jun '26", "Aug '26"];
  return months[Math.round(f * (months.length - 1))];
}

export function ChartWithPeriods({
  series,
  live,
  marginTop = 18,
  horizontalPadding = 0,
  fitTop = false,
  showGrid = true,
  onScrub,
  scrubNames,
}: {
  series: ChartSeriesInput[];
  live: boolean;
  marginTop?: number;
  // Detail pages use the shared 16px content gutter; standalone chart cards
  // keep the historical edge-to-edge default.
  horizontalPadding?: number;
  // Rescale so the highest point touches the top edge of the plot (used by
  // multi-outcome markets where no line reaches 100%).
  fitTop?: boolean;
  // Detail pages can omit the faint horizontal guides when the market lines
  // should read cleanly without a dotted chart grid.
  showGrid?: boolean;
  // Tap/drag scrubbing: reports each ORIGINAL series' 0..1 value at the
  // touched position (null when the scrub returns to the live edge).
  onScrub?: (values: number[] | null) => void;
  // When set, scrubbing shows Polymarket-style name + % labels on the lines.
  scrubNames?: string[];
}) {
  const [chartW, setChartW] = useState(0);
  const [period, setPeriod] = useState("LIVE");
  const mmLogo = useMmLogo();
  const showChartGradient = useChartGradient();
  const themeMode = useThemeMode();
  const gridColor = chartGridColor(themeMode);
  const gridOpacity = chartGridOpacity(themeMode);
  // Scrub position as a fraction of the plot width; null = pinned to the end.
  const [scrub, setScrub] = useState<number | null>(null);
  // Lines/dots end 40px in from the right edge.
  const plotW = chartW - (scrubNames ? 116 : 40);
  const handleTouch = (x: number) => {
    const frac = Math.min(1, Math.max(0, x / Math.max(1, plotW)));
    // Snap back to live when the finger reaches the right edge.
    const next = frac >= 0.985 ? null : frac;
    setScrub(next);
    onScrub?.(next == null ? null : series.map((s) => sampleAt(s.points, next)));
  };

  // Push the final points apart when a close market would overlap the dots
  // (visual-only, same rule as the Panthers page).
  const liveSeries = useMemo(() => {
    let src = series;
    // Scrub-labelled (sports) charts lift the lines so the top of the highest
    // line sits near the top of the chart bounds; % labels keep raw values.
    const lift = fitTop || !!scrubNames;
    if (lift) {
      const max = Math.max(0.01, ...series.flatMap((s) => s.points));
      src = series.map((s) => ({ ...s, points: s.points.map((v) => v / max) }));
    }
    const copy = src.map((s) => ({ ...s, points: [...s.points] }));
    if (copy.length === 2) {
      const [a, b] = [copy[0].points, copy[1].points];
      const va = a[a.length - 1];
      const vb = b[b.length - 1];
      const gap = Math.abs(va - vb);
      if (gap < MIN_GAP) {
        const push = (MIN_GAP - gap) / 2;
        const hi = va >= vb ? a : b;
        const lo = va >= vb ? b : a;
        hi[hi.length - 1] = Math.min(0.95, hi[hi.length - 1] + push);
        lo[lo.length - 1] = Math.max(0.05, lo[lo.length - 1] - push);
      }
    }
    return copy;
  }, [series, fitTop, scrubNames]);

  return (
    <>
      <View
        style={{
          height: CHART_H,
          marginTop: scrubNames ? Math.max(marginTop, 36) : marginTop,
          marginBottom: 24,
        }}
        onLayout={(e) => setChartW(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => handleTouch(e.nativeEvent.locationX)}
        onResponderMove={(e) => handleTouch(e.nativeEvent.locationX)}
      >
        {chartW > 0 ? (
          <Svg width={chartW} height={CHART_H}>
            <Defs>
              {liveSeries.map((s, i) => (
                <LinearGradient
                  key={`edge${i}`}
                  id={`edgeFade${i}`}
                  gradientUnits="userSpaceOnUse"
                  x1="0"
                  y1="0"
                  x2={String(CHART_LEFT_FADE_W)}
                  y2="0"
                >
                  <Stop offset="0" stopColor={s.color} stopOpacity="0" />
                  <Stop offset="1" stopColor={s.color} stopOpacity="1" />
                </LinearGradient>
              ))}
              {showChartGradient
                ? liveSeries.map((s, i) => (
                    <LinearGradient key={`a${i}`} id={`area${i}`} x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor={s.color} stopOpacity="0.16" />
                      <Stop offset="1" stopColor={s.color} stopOpacity="0" />
                    </LinearGradient>
                  ))
                : null}
            </Defs>
            {showGrid &&
              [0.25, 0.5, 0.75].map((t) => (
                <Path
                  key={`grid${t}`}
                  d={`M 0 ${(12 + t * (CHART_H - 24)).toFixed(1)} H ${chartW}`}
                  stroke={gridColor}
                  strokeOpacity={gridOpacity}
                  strokeWidth={1}
                  strokeDasharray="3 5"
                />
              ))}
            {liveSeries.map((s, i) => (
              <React.Fragment key={i}>
                {showChartGradient ? <Path d={smoothAreaPath(s.points, plotW, CHART_H - 24)} fill={`url(#area${i})`} transform="translate(0 12)" /> : null}
                <Path
                  d={smoothPath(s.points, plotW, CHART_H - 24)}
                  stroke={`url(#edgeFade${i})`}
                  strokeWidth={2}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  transform="translate(0 12)"
                />
              </React.Fragment>
            ))}
          </Svg>
        ) : null}
        <ExpoLinearGradient
          pointerEvents="none"
          colors={[colors.bg, "transparent"]}
          locations={[0, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: CHART_LEFT_FADE_W }}
        />
        {chartW > 0 && scrub != null ? (
          <View pointerEvents="none" style={{ position: "absolute", left: scrub * plotW, top: 6, bottom: 6, width: 1, backgroundColor: "rgba(255,255,255,0.18)" }} />
        ) : null}
        {chartW > 0 && scrubNames ? (
          <ScrubOverlay scrub={scrub ?? 1} plotW={plotW} series={liveSeries} values={series} names={scrubNames} period={period} showTime={scrub != null} />
        ) : null}
        {chartW > 0 && !scrubNames && scrub != null ? (
          <ScrubTimeLabel scrub={scrub} plotW={plotW} period={period} />
        ) : null}
        {chartW > 0
          ? liveSeries.map((s, i) => {
              const v = scrub == null ? s.points[s.points.length - 1] ?? 0 : sampleAt(s.points, scrub);
              const x = scrub == null ? plotW : scrub * plotW;
              return (
                <View
                  key={`d${i}`}
                  pointerEvents="none"
                  style={{ position: "absolute", left: x - DOT / 2, top: 12 + (1 - v) * (CHART_H - 24) - DOT / 2 }}
                >
                  <RippleDot color={s.color} size={DOT} active={live && period === "LIVE" && scrub == null} />
                </View>
              );
            })
          : null}
      </View>

      <View style={[styles.periodRow, horizontalPadding > 0 && { marginHorizontal: horizontalPadding, paddingHorizontal: 0 }]}>
        {mmLogo && (
          /* 18px wrapper margin + the row's 6px gap = 24px before LIVE. */
          <View style={{ marginRight: 18 }}>
            <Svg width={49} height={24} viewBox="0 0 49 24">
              <Path d={MM_WORDMARK_PATH} fill="#48484E" />
            </Svg>
          </View>
        )}
        {PERIODS.map((p) => {
          const active = p === period;
          return (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              style={[styles.periodBtn, active && { backgroundColor: filledChipBackground() }]}
            >
              <Text style={[styles.periodText, { color: active ? filledChipForeground() : colors.textMuted }]}>{p}</Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

export function ScoreChartUnit({
  left,
  right,
  clock,
  live,
  series,
  children,
}: {
  left: ScoreSide;
  right: ScoreSide;
  clock: string;
  live: boolean;
  series: ChartSeriesInput[];
  children?: React.ReactNode;
}) {
  return (
    <>
      <ScoreStrip left={left} right={right} clock={clock} live={live} alwaysShowAbbr />
      {children}
      <ChartWithPeriods series={series} live={live} />
    </>
  );
}

const styles = StyleSheet.create({
  scoreStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 8,
  },
  scoreItem: { flexGrow: 0, flexShrink: 0, alignItems: "center", justifyContent: "center" },
  hugScoreCell: { position: "relative", height: 40, overflow: "hidden" },
  hugScoreMeasure: { height: 40, overflow: "hidden" },
  hugScoreMeasureText: { opacity: 0 },
  hugScoreValue: { position: "absolute", top: 0, left: 0, right: 0, textAlign: "center" },
  bigScore: { fontFamily: geist.semibold, fontSize: 32, lineHeight: 40 },
  centerClock: { alignItems: "center" },
  clockText: { fontFamily: geist.medium },
  // Chart already carries a 12px internal bottom inset — 4px more lands the
  // pills 16px below the plotted lines.
  periodRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, marginTop: 4 },
  periodBtn: { flex: 1, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  periodText: { fontFamily: geist.medium, fontSize: 14 },
});
