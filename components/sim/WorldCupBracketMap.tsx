import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import colors from "@/constants/colors";
import { geist } from "@/lib/sim/geistFonts";

const c = colors.light;

// 1:1 mobile port of the "BracketMap" canvas mockup, as a STATIC diagram (no
// tap / no prediction card): a mini full-bracket map (R32 -> R16 -> QF -> SF ->
// Final, both halves spreading toward the center). The whole map is uniformly
// scaled down to fit the card width, so there is no horizontal scroll.

interface Team {
  name: string;
  short: string;
  code: string;
}

interface Match {
  id: string;
  half: "top" | "bottom";
  t1: Team | null;
  t2: Team | null;
  live?: boolean;
}

const t = (name: string, short: string, code: string): Team => ({ name, short, code });

const R32: Match[] = [
  { id: "m1", half: "top", t1: t("Canada", "Canada", "ca"), t2: t("Bosnia & Herzegovina", "Bosnia", "ba"), live: true },
  { id: "m2", half: "top", t1: t("USA", "USA", "us"), t2: t("Paraguay", "Paraguay", "py") },
  { id: "m3", half: "top", t1: t("Qatar", "Qatar", "qa"), t2: t("Switzerland", "Switzerland", "ch") },
  { id: "m4", half: "top", t1: t("Brazil", "Brazil", "br"), t2: t("Morocco", "Morocco", "ma") },
  { id: "m5", half: "top", t1: t("Argentina", "Argentina", "ar"), t2: t("Nigeria", "Nigeria", "ng") },
  { id: "m6", half: "top", t1: t("France", "France", "fr"), t2: t("Japan", "Japan", "jp") },
  { id: "m7", half: "top", t1: t("Spain", "Spain", "es"), t2: t("Croatia", "Croatia", "hr") },
  { id: "m8", half: "top", t1: t("Portugal", "Portugal", "pt"), t2: t("Mexico", "Mexico", "mx") },
  { id: "m9", half: "bottom", t1: t("England", "England", "gb-eng"), t2: t("Senegal", "Senegal", "sn") },
  { id: "m10", half: "bottom", t1: t("Germany", "Germany", "de"), t2: t("Ecuador", "Ecuador", "ec") },
  { id: "m11", half: "bottom", t1: t("Netherlands", "Netherlands", "nl"), t2: t("South Korea", "S. Korea", "kr") },
  { id: "m12", half: "bottom", t1: t("Belgium", "Belgium", "be"), t2: t("Australia", "Australia", "au") },
  { id: "m13", half: "bottom", t1: t("Italy", "Italy", "it"), t2: t("Ghana", "Ghana", "gh") },
  { id: "m14", half: "bottom", t1: t("Uruguay", "Uruguay", "uy"), t2: t("Iran", "Iran", "ir") },
  { id: "m15", half: "bottom", t1: t("Colombia", "Colombia", "co"), t2: t("Denmark", "Denmark", "dk") },
  { id: "m16", half: "bottom", t1: t("Norway", "Norway", "no"), t2: t("Saudi Arabia", "Saudi Arabia", "sa") },
];

const flagUrl = (code: string) => ({ uri: `https://flagcdn.com/w40/${code}.png` });

const tbd = (id: string, half: "top" | "bottom"): Match => ({ id, half, t1: null, t2: null });

const R16_LEFT = [tbd("m17", "top"), tbd("m18", "top"), tbd("m19", "top"), tbd("m20", "top")];
const R16_RIGHT = [tbd("m21", "bottom"), tbd("m22", "bottom"), tbd("m23", "bottom"), tbd("m24", "bottom")];
const QF_LEFT = [tbd("m25", "top"), tbd("m26", "top")];
const QF_RIGHT = [tbd("m27", "bottom"), tbd("m28", "bottom")];
const SF_LEFT = [tbd("m29", "top")];
const SF_RIGHT = [tbd("m30", "bottom")];
const FINAL = [tbd("m31", "top")];

// --- Geometry (single source of scale) ---
const FLAG = 18;
const NODE_W = 28;
const NODE_H = 46;
const COL_W = 44;
const ROWS = 8;
const ROW_H = 52;
const H = ROWS * ROW_H; // map height
const W = 8 * COL_W + NODE_W; // map width
const LABEL_H = 22;

const yAt = (n: number, j: number) => (H * (j + 0.5)) / n;
const colLeft = (col: number) => col * COL_W;
const colRight = (col: number) => col * COL_W + NODE_W;
const colCenter = (col: number) => col * COL_W + NODE_W / 2;

const LEFT_CHAIN = [
  { c: 0, n: 8, matches: R32.filter((m) => m.half === "top") },
  { c: 1, n: 4, matches: R16_LEFT },
  { c: 2, n: 2, matches: QF_LEFT },
  { c: 3, n: 1, matches: SF_LEFT },
];
const RIGHT_CHAIN = [
  { c: 8, n: 8, matches: R32.filter((m) => m.half === "bottom") },
  { c: 7, n: 4, matches: R16_RIGHT },
  { c: 6, n: 2, matches: QF_RIGHT },
  { c: 5, n: 1, matches: SF_RIGHT },
];

const COL_LABELS: Record<number, string> = { 0: "R32", 1: "R16", 2: "QF", 3: "SF", 4: "FINAL", 5: "SF", 6: "QF", 7: "R16", 8: "R32" };

// Precompute connector paths
const CONNECTORS: string[] = [];
for (let k = 0; k < LEFT_CHAIN.length - 1; k++) {
  const { c: col, n } = LEFT_CHAIN[k];
  const cp = LEFT_CHAIN[k + 1].c;
  const np = LEFT_CHAIN[k + 1].n;
  for (let j = 0; j < n; j++) {
    const xs = colRight(col), ys = yAt(n, j), xt = colLeft(cp), yt = yAt(np, Math.floor(j / 2)), mid = (xs + xt) / 2;
    CONNECTORS.push(`M ${xs} ${ys} H ${mid} V ${yt} H ${xt}`);
  }
}
CONNECTORS.push(`M ${colRight(3)} ${yAt(1, 0)} H ${colLeft(4)}`);
for (let k = 0; k < RIGHT_CHAIN.length - 1; k++) {
  const { c: col, n } = RIGHT_CHAIN[k];
  const cp = RIGHT_CHAIN[k + 1].c;
  const np = RIGHT_CHAIN[k + 1].n;
  for (let j = 0; j < n; j++) {
    const xs = colLeft(col), ys = yAt(n, j), xt = colRight(cp), yt = yAt(np, Math.floor(j / 2)), mid = (xs + xt) / 2;
    CONNECTORS.push(`M ${xs} ${ys} H ${mid} V ${yt} H ${xt}`);
  }
}
CONNECTORS.push(`M ${colLeft(5)} ${yAt(1, 0)} H ${colRight(4)}`);

interface Placed { m: Match; c: number; n: number; j: number; }
const PLACED: Placed[] = [];
LEFT_CHAIN.forEach(({ c: col, n, matches }) => matches.forEach((m, j) => PLACED.push({ m, c: col, n, j })));
PLACED.push({ m: FINAL[0], c: 4, n: 1, j: 0 });
RIGHT_CHAIN.forEach(({ c: col, n, matches }) => matches.forEach((m, j) => PLACED.push({ m, c: col, n, j })));

const MAP_W = W;
const MAP_H = H + LABEL_H;

export function WorldCupBracketMap() {
  // Measure the available content width and uniformly scale the fixed-size map
  // down to fit (never up). Scaling around the box center keeps it centered;
  // the wrapper height collapses to the scaled height so there is no dead space.
  const [availW, setAvailW] = React.useState(0);
  const scale = availW > 0 ? Math.min(1, availW / MAP_W) : 1;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Knockout bracket</Text>

      <View style={styles.mapClip} onLayout={(e) => setAvailW(e.nativeEvent.layout.width)}>
        {availW > 0 && (
          <View
            style={{
              width: availW,
              height: MAP_H * scale,
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <View style={{ width: MAP_W, height: MAP_H, transform: [{ scale }] }}>
              {/* Round labels */}
              {Object.entries(COL_LABELS).map(([col, label]) => (
                <Text
                  key={col}
                  style={[
                    styles.colLabel,
                    { left: colCenter(Number(col)) - 20, color: label === "FINAL" ? "#fff" : c.textMuted },
                  ]}
                >
                  {label}
                </Text>
              ))}

              {/* Connectors */}
              <Svg width={MAP_W} height={MAP_H} style={{ position: "absolute", top: LABEL_H, left: 0 }}>
                {CONNECTORS.map((d, i) => (
                  <Path key={i} d={d} stroke="rgba(255,255,255,0.10)" strokeWidth={1} fill="none" />
                ))}
              </Svg>

              {/* Nodes */}
              {PLACED.map(({ m, c: col, n, j }) => {
                const isLive = m.live;
                return (
                  <View
                    key={m.id}
                    style={[
                      styles.node,
                      {
                        left: colLeft(col),
                        top: LABEL_H + yAt(n, j) - NODE_H / 2,
                        borderColor: isLive ? c.green : "rgba(255,255,255,0.08)",
                        zIndex: isLive ? 20 : 10,
                      },
                    ]}
                  >
                    {isLive && <View style={styles.nodeLiveDot} />}
                    {[m.t1, m.t2].map((team, idx) =>
                      team ? (
                        <Image key={idx} source={flagUrl(team.code)} style={styles.nodeFlag} resizeMode="cover" />
                      ) : (
                        <View key={idx} style={styles.nodeFlagEmpty} />
                      ),
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: c.surface,
    borderRadius: 16,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  title: { color: c.textPrimary, fontFamily: geist.semibold, fontSize: 18, lineHeight: 24, paddingHorizontal: 4 },

  mapClip: { width: "100%" },

  colLabel: {
    position: "absolute",
    top: 0,
    width: 40,
    textAlign: "center",
    fontFamily: geist.semibold,
    fontSize: 9,
    letterSpacing: 0.6,
  },

  node: {
    position: "absolute",
    width: NODE_W,
    height: NODE_H,
    borderRadius: 7,
    borderWidth: 1,
    backgroundColor: c.surface,
    padding: 3,
    gap: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  nodeLiveDot: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: c.green,
    borderWidth: 1,
    borderColor: c.bg,
  },
  nodeFlag: { width: FLAG, height: FLAG, borderRadius: 2 },
  nodeFlagEmpty: { width: FLAG, height: FLAG, borderRadius: 2, backgroundColor: "#2c2d30" },
});
