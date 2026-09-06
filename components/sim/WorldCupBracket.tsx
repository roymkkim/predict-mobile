import { Image, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import colors from "@/constants/colors";
import type { Match } from "@/lib/sim/types";
import { geist } from "@/lib/sim/geistFonts";

const c = colors.light;

// Knockout bracket: the complete tree R32(16) -> R16(8) -> QF(4) -> SF(2) ->
// Final(1) spreading downward. R32 nodes show the two team flags; the live match
// gets a green ring + dot. R16+ are uniform TBD placeholders.

// ----- Tree geometry -----
const NODE_W = 52;
const NODE_H = 27;
const R32_GAP = 8;
// 5 columns wide. COL_GAP=17 keeps BRACKET_W (328) within the card's inner
// content width on a 393pt device (393 - 32 margin - 32 padding = 329) so the
// Final column never clips; it also fits the wider preview.
const COL_GAP = 17;
const TOP_PAD = 8;

// Column left edges (5 columns: R32, R16, QF, SF, Final).
const COL_X = [0, 1, 2, 3, 4].map((i) => i * (NODE_W + COL_GAP));
const BRACKET_W = COL_X[4] + NODE_W;

// Each later round sits midway between the two nodes that feed it.
const pairMid = (arr: number[]) =>
  Array.from({ length: arr.length / 2 }, (_, j) => (arr[2 * j] + arr[2 * j + 1]) / 2);

const C32 = Array.from({ length: 16 }, (_, i) => TOP_PAD + i * (NODE_H + R32_GAP) + NODE_H / 2);
const C16 = pairMid(C32); // 8
const CQF = pairMid(C16); // 4
const CSF = pairMid(CQF); // 2
const CFINAL = pairMid(CSF); // 1
const BRACKET_H = C32[15] + NODE_H / 2;

// Elbow connectors from a round's nodes into the next round's node.
function connectors(rightX: number, parents: number[], leftX: number, children: number[]): string[] {
  const midX = (rightX + leftX) / 2;
  const out: string[] = [];
  children.forEach((cy, j) => {
    out.push(`M ${rightX} ${parents[2 * j]} H ${midX} V ${cy} H ${leftX}`);
    out.push(`M ${rightX} ${parents[2 * j + 1]} H ${midX} V ${cy} H ${leftX}`);
  });
  return out;
}

const PATHS = [
  ...connectors(COL_X[0] + NODE_W, C32, COL_X[1], C16),
  ...connectors(COL_X[1] + NODE_W, C16, COL_X[2], CQF),
  ...connectors(COL_X[2] + NODE_W, CQF, COL_X[3], CSF),
  ...connectors(COL_X[3] + NODE_W, CSF, COL_X[4], CFINAL),
];

const flagUri = (cc: string) => ({ uri: `https://flagcdn.com/w40/${cc}.png` });

function FlagChip({ cc }: { cc?: string }) {
  if (!cc) return <View style={styles.flagEmpty} />;
  return <Image source={flagUri(cc)} style={styles.flag} resizeMode="cover" />;
}

function MatchNode({ match }: { match: Match }) {
  const live = !!match.live;
  return (
    <View style={[styles.node, live && styles.nodeLive]}>
      {live && <View style={styles.liveDot} />}
      <View style={styles.flagRow}>
        <FlagChip cc={match.teams[0]?.flag} />
        <FlagChip cc={match.teams[1]?.flag} />
      </View>
    </View>
  );
}

function EmptyNode() {
  return (
    <View style={styles.node}>
      <View style={styles.flagRow}>
        <View style={styles.flagEmpty} />
        <View style={styles.flagEmpty} />
      </View>
    </View>
  );
}

export function WorldCupBracket({ matches }: { matches: Match[] }) {
  const r32 = matches.slice(0, 16);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Knockout bracket</Text>
      </View>

      <View style={styles.labelRow}>
        {["R32", "R16", "QF", "SF", "FINAL"].map((l) => (
          <Text key={l} style={styles.colLabel}>
            {l}
          </Text>
        ))}
      </View>

      <View style={{ width: BRACKET_W, height: BRACKET_H, alignSelf: "center" }}>
        <Svg width={BRACKET_W} height={BRACKET_H} style={StyleSheet.absoluteFill}>
          {PATHS.map((d, i) => (
            <Path key={i} d={d} stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} fill="none" />
          ))}
        </Svg>

        {r32.map((m, i) => (
          <View key={`r32-${i}`} style={[styles.nodePos, { left: COL_X[0], top: C32[i] - NODE_H / 2 }]}>
            <MatchNode match={m} />
          </View>
        ))}
        {C16.map((cy, j) => (
          <View key={`r16-${j}`} style={[styles.nodePos, { left: COL_X[1], top: cy - NODE_H / 2 }]}>
            <EmptyNode />
          </View>
        ))}
        {CQF.map((cy, k) => (
          <View key={`qf-${k}`} style={[styles.nodePos, { left: COL_X[2], top: cy - NODE_H / 2 }]}>
            <EmptyNode />
          </View>
        ))}
        {CSF.map((cy, s) => (
          <View key={`sf-${s}`} style={[styles.nodePos, { left: COL_X[3], top: cy - NODE_H / 2 }]}>
            <EmptyNode />
          </View>
        ))}
        {CFINAL.map((cy, f) => (
          <View key={`final-${f}`} style={[styles.nodePos, { left: COL_X[4], top: cy - NODE_H / 2 }]}>
            <EmptyNode />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: c.surface,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  header: { flexDirection: "row", alignItems: "center" },
  title: { color: c.textPrimary, fontFamily: geist.semibold, fontSize: 15, lineHeight: 20 },

  labelRow: { flexDirection: "row", gap: COL_GAP, width: BRACKET_W, alignSelf: "center" },
  colLabel: {
    width: NODE_W,
    textAlign: "center",
    color: c.textMuted,
    fontFamily: geist.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  nodePos: { position: "absolute", width: NODE_W, height: NODE_H },
  node: {
    width: NODE_W,
    height: NODE_H,
    borderRadius: 6,
    backgroundColor: c.surface2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  nodeLive: { borderColor: c.green },
  liveDot: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: c.green,
    borderWidth: 2,
    borderColor: c.bg,
  },
  flagRow: { flexDirection: "row", gap: 2, alignItems: "center" },
  flag: { width: 18, height: 18, borderRadius: 3, backgroundColor: c.bg },
  flagEmpty: { width: 18, height: 18, borderRadius: 3, backgroundColor: c.bg },
});
