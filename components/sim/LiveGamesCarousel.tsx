import { Image, Pressable, Text, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { accessibleColor, buttonTextOnColor, colors, marketAccentColor } from "@/lib/sim/colors";
import { useThemeMode } from "@/lib/sim/dsModeStore";
import { useUxrMode } from "@/lib/sim/uxrModeStore";
import { useBetRadius } from "@/lib/sim/pillButtonsStore";
import { useFeedSettings } from "@/lib/sim/FeedSettingsContext";
import { useLiveCueColors } from "@/lib/sim/LiveCueColorContext";
import { useLiveClock } from "@/lib/sim/useLiveClock";
import { useLiveOdds } from "@/lib/sim/useLiveOdds";
import { SlotNumber } from "./SlotNumber";
import { BitcoinLogo } from "./BtcDailyCard";
import { Crest, LIVE_DOT_TEXT_GAP, LiveDot, LiveStatusStamp } from "./Crest";
import { SectionHeader } from "./FeedChrome";
import { SnapHScroll } from "./SnapHScroll";
import { matchDetailHref } from "@/lib/sim/marketRoutes";
import { NBA_OKC_HOU } from "@/components/sim/UxrBrowse";
import { NHL } from "@/lib/sim/data";
import { geist } from "@/lib/sim/geistFonts";
import { useKalshiVenue } from "@/lib/sim/kalshiMarkets";

// Native port of predict-simulator's "Trending" carousel of small game cards
// (artifacts/predict-simulator/src/components/mobile/TrendingCarousel.tsx),
// restyled with the predict-mobile palette. Titled "Live games" and toggleable
// from Display settings. Each card is a compact two-outcome game with a live
// dot / clock or scheduled time, the league, a 24x24 rounded avatar per outcome
// (team logo, player flag, or country flag), and either the live score or the
// (live-animating) probability. All text is 14px.

const nhlLogo = (t: string) => `https://a.espncdn.com/i/teamlogos/nhl/500/${t}.png`;
const nbaLogo = (t: string) => `https://a.espncdn.com/i/teamlogos/nba/500/${t}.png`;
const nflLogo = (t: string) => `https://a.espncdn.com/i/teamlogos/nfl/500/${t}.png`;
const flag = (cc: string) => `https://flagcdn.com/w80/${cc}.png`;

type Team = {
  name: string;
  abbr?: string; // short label for the full-card outcome buttons (e.g. "VGK")
  pct: string; // e.g. "41%"
  color: string;
  score?: number;
  logo?: string; // team logo (contain)
  flag?: string; // country flag image url (cover)
};

type Game = {
  league: string;
  time?: string;
  live?: { mins: string };
  drawPct?: string;
  // Color for the live dot + timestamp (defaults to the shared live cue green).
  liveColor?: string;
  // Custom header label + avatar shown in place of the time/live indicator
  // (e.g. the BTC 15-min market). When set, takes priority over time/live.
  headerLabel?: string;
  headerAvatar?: number; // require()'d image asset
  hideOutcomeAvatars?: boolean; // skip the per-outcome avatar (e.g. Up/Down)
  teams: [Team, Team];
  // Tennis-style detail (UXR full card): per-player set scores + current game
  // point, with a "SET n" label next to the LIVE badge.
  tennis?: {
    setLabel: string; // e.g. "SET 5"
    rows: [TennisRow, TennisRow];
  };
};

type TennisRow = {
  name: string;
  flag: string; // flag image url
  sets: string[]; // completed/current set scores, last one rendered bright ("6⁷")
  game: string; // current game point chip ("AD", "40")
};

// Faithful port of TRENDING_SAMPLES (a mix of live + scheduled games), with the
// avatars resolved to real logos / flags.
const GAMES: Game[] = [
  {
    league: "BTC",
    live: { mins: "BTC 15:00" },
    liveColor: colors.bitcoin,
    hideOutcomeAvatars: true,
    teams: [
      { name: "Up", abbr: "Up", pct: "56%", color: colors.green },
      { name: "Down", abbr: "Down", pct: "44%", color: colors.red },
    ],
  },
  {
    league: "NFL",
    live: { mins: "Q1 12:22" },
    teams: [
      { name: "Panthers", abbr: "CAR", pct: "53%", color: "#0085ca", logo: nflLogo("car"), score: 21 },
      { name: "Cardinals", abbr: "ARI", pct: "47%", color: "#97233f", logo: nflLogo("ari"), score: 0 },
    ],
  },
  {
    league: "ATP",
    live: { mins: "3rd set" },
    tennis: {
      setLabel: "SET 5",
      rows: [
        { name: "M. Navone", flag: flag("ar"), sets: ["7", "3", "3", "3", "6\u2077"], game: "AD" },
        { name: "F. Cobolli", flag: flag("it"), sets: ["5", "6", "6", "6", "7\u2079"], game: "40" },
      ],
    },
    teams: [
      { name: "M. Navone", abbr: "M.NAV", pct: "53%", color: "#74acdf", flag: flag("ar"), score: 0 },
      { name: "F. Cobolli", abbr: "F.COB", pct: "47%", color: "#65a30d", flag: flag("it"), score: 2 },
    ],
  },
  {
    league: "NHL",
    live: { mins: "P2 12:48" },
    teams: [
      { name: "Golden Knights", abbr: "VGK", pct: "41%", color: "#b4975a", logo: nhlLogo("vgk"), score: 2 },
      { name: "Hurricanes", abbr: "CAR", pct: "59%", color: "#cc0000", logo: nhlLogo("car"), score: 3 },
    ],
  },
  {
    league: "FIFA",
    live: { mins: "67'" },
    drawPct: "16%",
    teams: [
      { name: "Brazil", abbr: "BRA", pct: "58%", color: "#009c3b", flag: flag("br"), score: 1 },
      { name: "Argentina", abbr: "ARG", pct: "27%", color: "#74acdf", flag: flag("ar"), score: 2 },
    ],
  },
  {
    league: "NBA",
    live: { mins: "Q4 2:30" },
    teams: [
      { name: "Heat", abbr: "MIA", pct: "35%", color: "#98002e", logo: nbaLogo("mia"), score: 98 },
      { name: "Thunder", abbr: "OKC", pct: "65%", color: "#007ac1", logo: nbaLogo("okc"), score: 108 },
    ],
  },
  {
    league: "NFL",
    live: { mins: "Q3 5:42" },
    teams: [
      { name: "Chiefs", abbr: "KC", pct: "62%", color: "#e31837", logo: nflLogo("kc"), score: 21 },
      { name: "Ravens", abbr: "BAL", pct: "38%", color: "#241773", logo: nflLogo("bal"), score: 17 },
    ],
  },
];

function liveGameHref(game: Game): string {
  if (game.hideOutcomeAvatars || game.league === "BTC") return "/btc-updown";
  if (game.tennis) return "/tennis-detail";
  const [home, away] = game.teams;
  const key = `${home.abbr ?? home.name}-${away.abbr ?? away.name}`.toLowerCase();
  if (key === "vgk-car") return matchDetailHref(NHL);
  if (key === "mia-okc") return matchDetailHref(NBA_OKC_HOU);
  if (key === "car-ari") return "/game-detail";
  return `/match-detail?m=${key}`;
}

const AVATAR = 24;
const AVATAR_RADIUS = 8;

function TeamAvatar({ team }: { team: Team }) {
  if (team.flag) {
    return (
      <Image
        source={{ uri: team.flag }}
        style={{ width: AVATAR, height: AVATAR, borderRadius: AVATAR_RADIUS, backgroundColor: "rgba(255,255,255,0.06)" }}
        resizeMode="cover"
      />
    );
  }
  if (team.logo) {
    return (
      <View style={{ width: AVATAR, height: AVATAR, borderRadius: AVATAR_RADIUS, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
        <Image source={{ uri: team.logo }} style={{ width: AVATAR, height: AVATAR }} resizeMode="contain" />
      </View>
    );
  }
  return <View style={{ width: AVATAR, height: AVATAR, borderRadius: AVATAR_RADIUS, backgroundColor: "rgba(255,255,255,0.08)" }} />;
}

function GameCard({ game, liveBaseDelayMs = 0 }: { game: Game; liveBaseDelayMs?: number }) {
  const initialPcts = game.teams.map((t) => parseFloat(t.pct));
  const { displayVals } = useLiveOdds(initialPcts, true, liveBaseDelayMs);
  // Match every other live indicator on the page (default success green).
  const cue = useLiveCueColors();
  const uxr = useUxrMode() === "uxr";
  const { teamAvatars = "logo" } = useFeedSettings();
  // Live-ticking timestamp (e.g. "BTC 15:00" counts down in real time).
  const liveLabel = useLiveClock(game.live?.mins ?? "", !!game.live);
  const liveColor = game.liveColor ?? cue.color;
  // UXR header: green LIVE badge + muted detail ("3:35", "Q1 · 12:10", "SET 5").
  const uxrDetail = game.tennis
    ? game.tennis.setLabel
    : liveLabel
        .replace(/^BTC\s+/, "")
        .replace(/^([A-Z0-9]{1,3})\s+(?=\d)/i, "$1 · ");

  return (
    <View
      style={{
        width: 168,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        backgroundColor: colors.surface,
        paddingTop: 8,
        paddingHorizontal: 12,
        paddingBottom: 12,
        gap: 10,
      }}
    >
      {/* Header: live dot + clock or scheduled time on the left, league on the right */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6, minHeight: 18 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: LIVE_DOT_TEXT_GAP, flexShrink: 1 }}>
          {game.headerLabel ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 }}>
              {game.headerAvatar !== undefined && (
                <Image source={game.headerAvatar} style={{ width: 24, height: 24, borderRadius: 8 }} resizeMode="contain" />
              )}
              <Text numberOfLines={1} style={{ fontFamily: geist.regular, fontSize: 14, lineHeight: 18, color: colors.textPrimary }}>
                {game.headerLabel}
              </Text>
            </View>
          ) : game.live && uxr ? (
            <LiveStatusStamp detail={uxrDetail} color={cue.color} />
          ) : game.live ? (
            <LiveStatusStamp detail={liveLabel} color={liveColor} />
          ) : (
            <Text numberOfLines={1} style={{ fontFamily: geist.regular, fontSize: 14, lineHeight: 18, color: colors.textMuted }}>
              {game.time}
            </Text>
          )}
        </View>
      </View>

      {/* Outcome rows. UXR tennis cards swap in the set-score rows from the mock. */}
      {uxr && game.tennis ? (
        game.tennis.rows.map((row, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8, minHeight: 32 }}>
            <Image
              source={{ uri: row.flag }}
              style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.06)" }}
              resizeMode="cover"
            />
            <Text numberOfLines={1} style={{ flex: 1, fontFamily: geist.regular, fontSize: 14, lineHeight: 18, color: colors.textPrimary }}>
              {row.name}
            </Text>
            <Text style={{ fontFamily: geist.semibold, fontSize: 14, lineHeight: 18, color: colors.textPrimary }}>
              {row.sets[row.sets.length - 1]}
            </Text>
            <View
              style={{
                minWidth: 32,
                height: 32,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.18)",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 6,
              }}
            >
              <Text style={{ fontFamily: geist.medium, fontSize: 14, lineHeight: 18, color: colors.textPrimary }}>
                {row.game}
              </Text>
            </View>
          </View>
        ))
      ) : (
      game.teams.map((team, i) => {
        const showScore = !!game.live && team.score !== undefined;
        return (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8, minHeight: 32 }}>
            {uxr && game.hideOutcomeAvatars ? (
              <BitcoinLogo size={22} fill={colors.bitcoin} />
            ) : (
              !game.hideOutcomeAvatars && <TeamAvatar team={team} />
            )}
            <Text numberOfLines={1} style={{ flex: 1, fontFamily: geist.regular, fontSize: 14, lineHeight: 18, color: colors.textPrimary }}>
              {uxr && team.logo ? (team.abbr ?? team.name) : team.name}
            </Text>
            {showScore ? (
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: uxr ? "rgba(255,255,255,0.18)" : colors.cardBorder,
                }}
              >
                <Text style={{ fontFamily: geist.medium, fontSize: 14, lineHeight: 18, color: colors.textPrimary }}>
                  {team.score}
                </Text>
              </View>
            ) : (
              <SlotNumber
                value={displayVals[i]}
                suffix="%"
                color={uxr ? marketAccentColor(team.color) : accessibleColor(team.color)}
                fontSize={14}
                fontFamily={geist.bold}
              />
            )}
          </View>
        );
      })
      )}
    </View>
  );
}

// Full-card mode ("Live games card" = Full): one wide 192px-tall card per game
// with big scores (or the BTC coin + countdown ring), a live status line, and
// two tinted outcome buttons at the bottom (abbr + live price in cents).
const FULL_H = 192;
const FULL_AVATAR = 40;
const BTN_H = 40;

function tint(hex: string, alpha: string) {
  // hex "#rrggbb" + 2-digit alpha suffix (RN supports #rrggbbaa).
  return hex.length === 7 ? `${hex}${alpha}` : hex;
}

function DrawIcon({ color = "#15161A" }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <Circle cx={9} cy={9} r={7.25} fill="#D0D2D9" stroke={color} strokeWidth={1.5} />
      <Path d="M9 1.75A7.25 7.25 0 0 0 9 16.25Z" fill={color} />
    </Svg>
  );
}

function OutcomeButton({ label, cents, color }: { label: string; cents: number; color: string }) {
  // UXR mode swaps the translucent tint for the solid palette fill with dark
  // text and 12px corners (same treatment as the feed cards' outcome buttons).
  const uxr = useUxrMode() === "uxr";
  useThemeMode();
  const betR = useBetRadius();
  const text = uxr ? buttonTextOnColor() : accessibleColor(color);
  return (
    <Pressable
      style={{
        flex: 1,
        height: BTN_H,
        borderRadius: betR,
        backgroundColor: uxr ? marketAccentColor(color) : tint(color, "24"),
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <SlotNumber value={cents} prefix={`${label} · `} suffix="¢" color={text} fontSize={15} fontFamily={geist.semibold} />
    </Pressable>
  );
}

function DrawOutcomeButton({ cents }: { cents: number }) {
  useThemeMode();
  const betR = useBetRadius();
  const drawColor = "#15161A";
  return (
    <Pressable
      style={{
        flex: 1,
        height: BTN_H,
        borderRadius: betR,
        backgroundColor: "#D0D2D9",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <DrawIcon color={drawColor} />
        <SlotNumber value={cents} suffix="¢" color={drawColor} fontSize={15} fontFamily={geist.semibold} />
      </View>
    </Pressable>
  );
}

function FullTeamAvatar({ team }: { team: Team; sport?: string; teamAvatars?: "logo" | "acronym" | "icon" }) {
  if (team.flag) {
    return (
      <Image
        source={{ uri: team.flag }}
        style={{ width: FULL_AVATAR, height: FULL_AVATAR, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.06)" }}
        resizeMode="cover"
      />
    );
  }
  if (team.logo) {
    return (
      <View style={{ width: FULL_AVATAR, height: FULL_AVATAR, borderRadius: 8, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
        <Image source={{ uri: team.logo }} style={{ width: FULL_AVATAR, height: FULL_AVATAR }} resizeMode="contain" />
      </View>
    );
  }
  return <View style={{ width: FULL_AVATAR, height: FULL_AVATAR, borderRadius: 8, backgroundColor: team.color }} />;
}

// BTC coin with the partial countdown ring from the reference (static arc).
function BtcCoinRing() {
  const R = 19;
  const C = 2 * Math.PI * R;
  return (
    <View style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
      <Svg width={44} height={44} viewBox="0 0 44 44" style={{ position: "absolute" }}>
        <Circle cx={22} cy={22} r={R} stroke="rgba(255,255,255,0.08)" strokeWidth={2} fill="none" />
        <Circle
          cx={22}
          cy={22}
          r={R}
          stroke={colors.bitcoin}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${C * 0.72} ${C}`}
          transform="rotate(-90 22 22)"
        />
      </Svg>
      <BitcoinLogo size={30} fill={colors.bitcoin} />
    </View>
  );
}

// UXR BTC card chart: wiggly price line drifting below a dashed target line,
// with a Target pill on the line and the live price pill at the end dot.
// Normalized sample points (x 0..1, y 0..1 top-down) traced from the mock.
const BTC_SPARK: [number, number][] = [
  [0, 0.3], [0.05, 0.16], [0.09, 0.34], [0.13, 0.2], [0.17, 0.4], [0.21, 0.28],
  [0.26, 0.14], [0.3, 0.42], [0.35, 0.52], [0.4, 0.34], [0.45, 0.46], [0.5, 0.4],
  [0.55, 0.52], [0.6, 0.46], [0.65, 0.6], [0.7, 0.52], [0.75, 0.66], [0.8, 0.6],
  [0.85, 0.78], [0.88, 0.88],
];

function BtcSparkChart({ width, height, target }: { width: number; height: number; target: string }) {
  const pts = BTC_SPARK.map(([x, y]) => [x * width, y * height] as const);
  const d = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const targetY = 0.5 * height;
  const [endX, endY] = pts[pts.length - 1];
  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Line x1={0} y1={targetY} x2={width} y2={targetY} stroke="rgba(255,255,255,0.25)" strokeWidth={1} strokeDasharray="4 4" />
        <Path d={d} stroke={colors.red} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.9} />
        <Circle cx={endX} cy={endY} r={7} fill={colors.red} />
      </Svg>
      {/* Target pill sits on the dashed line */}
      <View
        style={{
          position: "absolute",
          left: 0,
          top: targetY - 12,
          height: 24,
          borderRadius: 12,
          backgroundColor: "rgba(255,255,255,0.1)",
          justifyContent: "center",
          paddingHorizontal: 8,
        }}
      >
        <Text style={{ fontFamily: geist.medium, fontSize: 12, lineHeight: 16, color: colors.textMuted }}>
          Target: {target}
        </Text>
      </View>
      {/* Live price pill trails the end dot */}
      <View
        style={{
          position: "absolute",
          right: 0,
          top: Math.min(endY - 12, height - 24),
          height: 24,
          borderRadius: 12,
          backgroundColor: colors.redSoft,
          justifyContent: "center",
          paddingHorizontal: 8,
        }}
      >
        <Text style={{ fontFamily: geist.semibold, fontSize: 12, lineHeight: 16, color: colors.red }}>{target}</Text>
      </View>
    </View>
  );
}

function FullGameCard({ game, width, liveBaseDelayMs = 0 }: { game: Game; width: number; liveBaseDelayMs?: number }) {
  const initialPcts = game.teams.map((t) => parseFloat(t.pct));
  const { displayVals } = useLiveOdds(initialPcts, true, liveBaseDelayMs);
  const cue = useLiveCueColors();
  const uxr = useUxrMode() === "uxr";
  const { teamAvatars = "logo" } = useFeedSettings();
  const isBtc = !!game.hideOutcomeAvatars;
  // BTC full card is the 5-minute market from the reference; games tick their
  // own clock label.
  const liveLabel = useLiveClock(isBtc ? "LIVE 3:35" : `LIVE ${game.live?.mins ?? ""}`, !!game.live);
  const liveColor = game.liveColor ?? cue.color;
  const [home, away] = game.teams;
  // UXR layout splits "LIVE Q3 5:42" into a LIVE badge line + the ticking
  // clock centered on its own second line.
  const liveTime = liveLabel.startsWith("LIVE ") ? liveLabel.slice(5) : liveLabel;

  return (
    <View
      style={{
        width,
        height: FULL_H,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        backgroundColor: colors.surface,
        padding: 12,
        justifyContent: "space-between",
      }}
    >
      {isBtc && uxr ? (
        <View style={{ flex: 1, gap: 4 }}>
          <Text
            numberOfLines={1}
            style={{ textAlign: "center", fontFamily: geist.semibold, fontSize: 16, lineHeight: 22, color: colors.textPrimary }}
          >
            BTC Up or Down
          </Text>
          <LiveStatusStamp detail={liveTime} color={cue.color} />
          <View style={{ flex: 1, justifyContent: "center" }}>
            <BtcSparkChart width={width - 24} height={64} target="$66,371.20" />
          </View>
        </View>
      ) : isBtc ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 4 }}>
          <BtcCoinRing />
          <LiveStatusStamp detail={liveLabel} color={liveColor} />
          <Text numberOfLines={1} style={{ fontFamily: geist.semibold, fontSize: 16, lineHeight: 22, color: colors.textPrimary }}>
            BTC Up or Down 5m
          </Text>
          <Text numberOfLines={1} style={{ fontFamily: geist.regular, fontSize: 14, lineHeight: 18, color: colors.textMuted }}>
            Resets every 5 min
          </Text>
        </View>
      ) : uxr && game.tennis ? (
        <View style={{ flex: 1, gap: 6 }}>
          <Text
            numberOfLines={1}
            style={{ textAlign: "center", fontFamily: geist.semibold, fontSize: 16, lineHeight: 22, color: colors.textPrimary }}
          >
            {home.name} vs. {away.name}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: LIVE_DOT_TEXT_GAP }}>
            <LiveDot color={liveColor} />
            <Text style={{ fontFamily: geist.semibold, fontSize: 14, lineHeight: 18, letterSpacing: 0.4, color: liveColor }}>
              LIVE
            </Text>
            <Text style={{ fontFamily: geist.semibold, fontSize: 14, lineHeight: 18, letterSpacing: 0.4, color: colors.textMuted }}>
              {game.tennis.setLabel}
            </Text>
          </View>
          <View style={{ flex: 1, justifyContent: "center", gap: 8 }}>
            {game.tennis.rows.map((row, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Image
                  source={{ uri: row.flag }}
                  style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.06)" }}
                  resizeMode="cover"
                />
                <Text numberOfLines={1} style={{ flex: 1, fontFamily: geist.medium, fontSize: 14, lineHeight: 18, color: colors.textPrimary }}>
                  {row.name}
                </Text>
                {row.sets.map((s, j) => (
                  <Text
                    key={j}
                    style={{
                      width: 16,
                      textAlign: "center",
                      fontFamily: j === row.sets.length - 1 ? geist.semibold : geist.regular,
                      fontSize: 14,
                      lineHeight: 18,
                      color: j === row.sets.length - 1 ? colors.textPrimary : colors.textMuted,
                    }}
                  >
                    {s}
                  </Text>
                ))}
                <View
                  style={{
                    minWidth: 36,
                    height: 30,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.18)",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 6,
                    marginLeft: 4,
                  }}
                >
                  <Text style={{ fontFamily: geist.semibold, fontSize: 13, lineHeight: 17, color: colors.textPrimary }}>
                    {row.game}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : uxr ? (
        <View style={{ flex: 1, gap: 10 }}>
          <Text
            numberOfLines={1}
            style={{ textAlign: "center", fontFamily: geist.semibold, fontSize: 16, lineHeight: 22, color: colors.textPrimary }}
          >
            {home.name} vs {away.name}
          </Text>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 76, alignItems: "center", gap: 4 }}>
              <FullTeamAvatar
                team={home}
                sport={game.league === "NFL" || game.league === "NCAAF" ? "americanFootball" : game.league === "MLB" ? "baseball" : undefined}
                teamAvatars={teamAvatars}
              />
              <Text numberOfLines={1} style={{ fontFamily: geist.medium, fontSize: 13, lineHeight: 17, color: colors.textMuted }}>
                {home.name}
              </Text>
            </View>
            <Text style={{ flex: 1, textAlign: "center", fontFamily: geist.bold, fontSize: 30, lineHeight: 36, color: colors.textPrimary }}>
              {home.score ?? 0}
            </Text>
            <LiveStatusStamp detail={liveTime} color={liveColor} />
            <Text style={{ flex: 1, textAlign: "center", fontFamily: geist.bold, fontSize: 30, lineHeight: 36, color: colors.textPrimary }}>
              {away.score ?? 0}
            </Text>
            <View style={{ width: 76, alignItems: "center", gap: 4 }}>
              <FullTeamAvatar
                team={away}
                sport={game.league === "NFL" || game.league === "NCAAF" ? "americanFootball" : game.league === "MLB" ? "baseball" : undefined}
                teamAvatars={teamAvatars}
              />
              <Text numberOfLines={1} style={{ fontFamily: geist.medium, fontSize: 13, lineHeight: 17, color: colors.textMuted }}>
                {away.name}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1, gap: 8 }}>
          <Text
            numberOfLines={1}
            style={{ textAlign: "center", fontFamily: geist.semibold, fontSize: 15, lineHeight: 20, color: colors.textPrimary }}
          >
            {home.name} vs. {away.name}
          </Text>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}>
              <FullTeamAvatar team={home} sport={game.league === "NFL" || game.league === "NCAAF" ? "americanFootball" : game.league === "MLB" ? "baseball" : undefined} teamAvatars={teamAvatars} />
            <Text style={{ fontFamily: geist.bold, fontSize: 28, lineHeight: 34, color: colors.textPrimary }}>
              {home.score ?? 0}
            </Text>
            <View style={{ flex: 1, alignItems: "center" }}>
              <LiveStatusStamp detail={game.league} color={liveColor} />
            </View>
            <Text style={{ fontFamily: geist.bold, fontSize: 28, lineHeight: 34, color: colors.textPrimary }}>
              {away.score ?? 0}
            </Text>
              <FullTeamAvatar team={away} sport={game.league === "NFL" || game.league === "NCAAF" ? "americanFootball" : game.league === "MLB" ? "baseball" : undefined} teamAvatars={teamAvatars} />
          </View>
        </View>
      )}

      <View style={{ flexDirection: "row", gap: 8 }}>
        <OutcomeButton label={home.abbr ?? home.name} cents={displayVals[0]} color={isBtc ? colors.green : home.color} />
        {game.drawPct ? <DrawOutcomeButton cents={Math.round(parseFloat(game.drawPct))} /> : null}
        <OutcomeButton label={away.abbr ?? away.name} cents={displayVals[1]} color={isBtc ? colors.red : away.color} />
      </View>
    </View>
  );
}

const ncaaLogo = (id: string) => `https://a.espncdn.com/i/teamlogos/ncaa/500/${id}.png`;

const KALSHI_LIVE_GAMES: Game[] = [
  {
    league: "NFL",
    live: { mins: "Q1 12:22" },
    teams: [
      { name: "Panthers", abbr: "CAR", pct: "53%", color: "#0085ca", logo: nflLogo("car"), score: 21 },
      { name: "Cardinals", abbr: "ARI", pct: "47%", color: "#97233f", logo: nflLogo("ari"), score: 0 },
    ],
  },
  {
    league: "NFL",
    live: { mins: "Q3 5:42" },
    teams: [
      { name: "Chiefs", abbr: "KC", pct: "62%", color: "#e31837", logo: nflLogo("kc"), score: 21 },
      { name: "Ravens", abbr: "BAL", pct: "38%", color: "#241773", logo: nflLogo("bal"), score: 17 },
    ],
  },
  {
    league: "NCAAF",
    live: { mins: "Q2 4:18" },
    teams: [
      { name: "Georgia", abbr: "UGA", pct: "56%", color: "#ba0c2f", logo: ncaaLogo("61"), score: 14 },
      { name: "Alabama", abbr: "ALA", pct: "44%", color: "#9e1b32", logo: ncaaLogo("333"), score: 10 },
    ],
  },
];

export function LiveGamesCarousel({ gutter = 16 }: { gutter?: number }) {
  const router = useRouter();
  const kalshi = useKalshiVenue();
  const { liveGamesCard = "full" } = useFeedSettings();
  const { width: winW } = useWindowDimensions();
  const full = liveGamesCard === "full";
  const games = kalshi ? KALSHI_LIVE_GAMES : GAMES;
  // Full cards are one feed-card wide minus a peek of the next card.
  const fullW = winW - gutter * 2 - 28;
  const compactW = 168;

  return (
    <View>
      <SectionHeader title={full ? "Live now" : "Live"} />
      <SnapHScroll gutter={gutter} interval={full ? fullW + 8 : compactW + 8} gap={8}>
        {games.map((game, i) => (
          <Pressable key={i} onPress={() => router.push(liveGameHref(game) as never)}>
            {full ? (
              <FullGameCard game={game} width={fullW} liveBaseDelayMs={i * 600} />
            ) : (
              <GameCard game={game} liveBaseDelayMs={i * 600} />
            )}
          </Pressable>
        ))}
      </SnapHScroll>
    </View>
  );
}
