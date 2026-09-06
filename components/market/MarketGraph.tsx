import React, { useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { colors, filledChipBackground, filledChipForeground } from "@/lib/sim/colors";
import { useThemeMode } from "@/lib/sim/dsModeStore";
import { LiveDot } from "@/components/sim/Crest";
import { geist } from "@/lib/sim/geistFonts";

export type ChartSeries = { label: string; pct?: string; color: string; points: number[] };

// Builds a staircase (stepped) SVG path from a 0..1 series: hold the previous
// value horizontally to the next x, then step vertically to the new value.
export function steppedPath(points: number[], w: number, h: number): string {
  if (points.length === 0 || w <= 0) return "";
  const n = points.length;
  const dx = n > 1 ? w / (n - 1) : w;
  const y = (v: number) => (1 - Math.max(0, Math.min(1, v))) * h;
  let d = `M 0 ${y(points[0]).toFixed(2)}`;
  for (let i = 1; i < n; i++) {
    const x = (i * dx).toFixed(2);
    d += ` H ${x} V ${y(points[i]).toFixed(2)}`;
  }
  return d;
}

const DOT = 8;

// Configurable chart area: a toolbar (live chat / placeholder logo / chart-type
// toggle) over a stepped multi-line probability chart whose end markers breathe
// on the shared app live-cue clock, then a period selector (LIVE/1D/1W/1M/1Y).
export function MarketGraph({
  series,
  periods,
  activePeriod,
  onPeriod,
}: {
  series: ChartSeries[];
  periods: string[];
  activePeriod: string;
  onPeriod: (p: string) => void;
}) {
  const [w, setW] = useState(0);
  const H = 150;
  const LABEL_W = 56;
  const chartW = Math.max(0, w - LABEL_W);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const live = activePeriod === "LIVE";
  useThemeMode();

  return (
    <View style={styles.wrap}>
      <View style={styles.toolbar}>
        <Pressable hitSlop={8} style={styles.chatBtn}>
          <Feather name="message-square" size={16} color={colors.textPrimary} />
          <Text style={styles.chatText}>Live chat</Text>
        </Pressable>
        {/* Placeholder for the partner/wallet logo (asset not available) */}
        <View style={styles.logoPlaceholder} />
        <View style={styles.toggleGroup}>
          <View style={[styles.toggleBtn, styles.toggleBtnActive]}>
            <Feather name="activity" size={16} color={colors.textPrimary} />
          </View>
          <View style={styles.toggleBtn}>
            <Feather name="play" size={16} color={colors.textMuted} />
          </View>
        </View>
      </View>

      <View style={[styles.chart, { height: H }]} onLayout={onLayout}>
        {chartW > 0 ? (
          <Svg width={chartW} height={H}>
            {series.map((s, i) => (
              <Path
                key={i}
                d={steppedPath(s.points, chartW, H)}
                stroke={s.color}
                strokeWidth={2}
                fill="none"
                strokeLinejoin="round"
              />
            ))}
          </Svg>
        ) : null}

        {/* One breathing end dot per line (the app's standard live cue). */}
        {chartW > 0
          ? series.map((s, i) => {
              const last = s.points[s.points.length - 1] ?? 0;
              return (
                <View
                  key={`d${i}`}
                  pointerEvents="none"
                  style={{ position: "absolute", left: chartW - DOT / 2, top: (1 - last) * H - DOT / 2 }}
                >
                  <LiveDot color={s.color} size={DOT} pulse={live} />
                </View>
              );
            })
          : null}

        {series.map((s, i) => {
          const last = s.points[s.points.length - 1] ?? 0;
          const top = (1 - last) * H - 10;
          return (
            <View key={i} style={[styles.labelRow, { top, width: LABEL_W }]}>
              <View style={[styles.labelDot, { backgroundColor: s.color }]} />
              <Text style={[styles.labelText, { color: s.color }]}>{`${Math.round(last * 100)}%`}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.periodRow}>
        {periods.map((p) => {
          const active = p === activePeriod;
          return (
            <Pressable
              key={p}
              onPress={() => onPeriod(p)}
              style={[styles.periodBtn, active && { backgroundColor: filledChipBackground() }]}
            >
              <Text style={[styles.periodText, { color: active ? filledChipForeground() : colors.textMuted }]}>{p}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  chatBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  chatText: { color: colors.textPrimary, fontFamily: geist.medium, fontSize: 14 },
  logoPlaceholder: { width: 64, height: 22, borderRadius: 6, backgroundColor: colors.surface2 },
  toggleGroup: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: 10, padding: 2, gap: 2 },
  toggleBtn: { width: 36, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  toggleBtnActive: { backgroundColor: colors.surface2 },

  chart: { position: "relative", justifyContent: "center" },
  labelRow: { position: "absolute", right: 0, flexDirection: "row", alignItems: "center", gap: 6 },
  labelDot: { width: 6, height: 6, borderRadius: 3 },
  labelText: { fontFamily: geist.semibold, fontSize: 14 },

  periodRow: { flexDirection: "row", gap: 8 },
  periodBtn: { flex: 1, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  periodText: { fontFamily: geist.medium, fontSize: 14 },
});
