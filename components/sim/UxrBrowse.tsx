import React from "react";
import { Image, Pressable, ScrollView, Text, View, type ImageSourcePropType } from "react-native";
import { useRouter } from "expo-router";

import { colors, filterChipBackground, FILTER_CHIP_INACTIVE_TEXT } from "@/lib/sim/colors";
import { FeedSettingsProvider, type FeedSettings } from "@/lib/sim/FeedSettingsContext";
import { LiveTickProvider } from "@/lib/sim/LiveTickContext";
import { LiveCueColorProvider } from "@/lib/sim/LiveCueColorContext";
import type { Match } from "@/lib/sim/types";
import { GOLF, NHL, TENNIS, TENNIS_DECIDER, WORLD_CUP, F1_RACE } from "@/lib/sim/data";
import { binary, vsMatch, MatchCard, BinaryCard, NBA as NBA_GAMES, type Binary } from "@/lib/sim/topicMarkets";
import { matchDetailHref, PREDICTION_DETAIL_HREF } from "@/lib/sim/marketRoutes";
import { ChevronIcon } from "./FeedChrome";
import { LiveDot } from "./Crest";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { MaterialOutlinedSportIcon, outlinedSportId } from "@/components/sim/MaterialSportsOutline";
import { type MaterialCommunityIconName, type MaterialIconName } from "@/lib/sim/uxrIcons";
import { geist } from "@/lib/sim/geistFonts";
import { PAGE_BODY_TOP_PADDING } from "@/lib/sim/layout";

// ── UXR browse surfaces ──────────────────────────────────────────────────────
// Shared pieces for the UXR-only Categories → Sport → League drill-down
// (/uxr-categories, /uxr-sport/[slug], /uxr-league/[id]). Classic mode keeps
// the legacy /categories and /sports-leagues pages untouched.

const nflLogo = (id: string) => `https://a.espncdn.com/i/teamlogos/nfl/500/${id}.png`;

// Football fixtures from the UXR mock: Panthers/Cardinals (Thu) and
// Packers/Steelers (Fri), both live Q4. Button fills come from the team color
// via pastel() in UXR mode (CAR light blue, ARI salmon, GB lime, PIT amber).
export const PANTHERS_CARDINALS = vsMatch({
  league: "NFL",
  leagueColor: "#013369",
  sport: "americanFootball",
  home: { name: "Panthers", abbr: "CAR", color: "#0085ca", logo: nflLogo("car") },
  away: { name: "Cardinals", abbr: "ARI", color: "#97233f", logo: nflLogo("ari") },
  pct: [53, 47],
  live: { mins: "Q4 · 12:22", score: [21, 0] },
  vol: "$1.4M Vol.",
  markets: 3,
  date: "Aug 6",
});
export const PACKERS_STEELERS = vsMatch({
  league: "NFL",
  leagueColor: "#013369",
  sport: "americanFootball",
  home: { name: "Packers", abbr: "GB", color: "#84cc16", logo: nflLogo("gb") },
  away: { name: "Steelers", abbr: "PIT", color: "#eab308", logo: nflLogo("pit") },
  pct: [53, 47],
  live: { mins: "Q4 · 12:22", score: [7, 0] },
  vol: "$980K Vol.",
  markets: 3,
  date: "Aug 7",
});

// NCAAF fixtures for the Kalshi (US) region: college football matchups shown
// under the NCAAF league on the sports page. Logos come from ESPN's NCAA set.
const ncaaLogo = (id: string) => `https://a.espncdn.com/i/teamlogos/ncaa/500/${id}.png`;
export const NCAAF_GEORGIA_ALABAMA = vsMatch({
  league: "NCAAF",
  leagueColor: "#9e1b32",
  sport: "americanFootball",
  home: { name: "Georgia", abbr: "UGA", color: "#ba0c2f", logo: ncaaLogo("61") },
  away: { name: "Alabama", abbr: "ALA", color: "#9e1b32", logo: ncaaLogo("333") },
  pct: [56, 44],
  live: { mins: "Q2 · 4:18", score: [14, 10] },
  vol: "$860K Vol.",
  markets: 2,
  date: "Aug 6",
});
export const NCAAF_MICHIGAN_OSU = vsMatch({
  league: "NCAAF",
  leagueColor: "#00274c",
  sport: "americanFootball",
  home: { name: "Michigan", abbr: "MICH", color: "#00274c", logo: ncaaLogo("130") },
  away: { name: "Ohio State", abbr: "OSU", color: "#bb0000", logo: ncaaLogo("194") },
  pct: [48, 52],
  vol: "$1.1M Vol.",
  markets: 2,
  date: "Aug 8",
});

export type GameGroup = { title: string; matches: Match[] };

// ── Realistic league fixtures (user request, Aug 17 2026) ───────────────────
// Premier League, NBA, WNBA, and NFL preseason get believable matchups with
// real team logos instead of inheriting the parent sport's fallback games.
const soccerLogo = (id: string) => `https://a.espncdn.com/i/teamlogos/soccer/500/${id}.png`;
const nbaLogoU = (id: string) => `https://a.espncdn.com/i/teamlogos/nba/500/${id}.png`;
const wnbaLogo = (id: string) => `https://a.espncdn.com/i/teamlogos/wnba/500/${id}.png`;

const EPL_PURPLE = "#3d195b";
export const EPL_ARS_LIV: Match = {
  ...vsMatch({
    league: "Premier League", leagueColor: EPL_PURPLE, sport: "soccer",
    home: { name: "Arsenal", abbr: "ARS", color: "#ef0107", logo: soccerLogo("359") },
    away: { name: "Liverpool", abbr: "LIV", color: "#c8102e", logo: soccerLogo("364") },
    pct: [41, 31], live: { mins: "64'", score: [1, 1] }, vol: "$3.1M Vol.", markets: 12, date: "Aug 17",
  }),
  draw: { pct: "28%" },
};
export const EPL_MCI_CHE: Match = {
  ...vsMatch({
    league: "Premier League", leagueColor: EPL_PURPLE, sport: "soccer",
    home: { name: "Man City", abbr: "MCI", color: "#6cabdd", logo: soccerLogo("382") },
    away: { name: "Chelsea", abbr: "CHE", color: "#034694", logo: soccerLogo("363") },
    pct: [58, 22], vol: "$2.4M Vol.", markets: 10, date: "Today", time: "12:30 PM",
  }),
  draw: { pct: "20%" },
};
export const EPL_MUN_TOT: Match = {
  ...vsMatch({
    league: "Premier League", leagueColor: EPL_PURPLE, sport: "soccer",
    home: { name: "Man United", abbr: "MUN", color: "#da291c", logo: soccerLogo("360") },
    away: { name: "Tottenham", abbr: "TOT", color: "#132257", logo: soccerLogo("367") },
    pct: [39, 37], vol: "$1.9M Vol.", markets: 9, date: "Today", time: "3:00 PM",
  }),
  draw: { pct: "24%" },
};
export const EPL_NEW_AVL: Match = {
  ...vsMatch({
    league: "Premier League", leagueColor: EPL_PURPLE, sport: "soccer",
    home: { name: "Newcastle", abbr: "NEW", color: "#241f20", logo: soccerLogo("361") },
    away: { name: "Aston Villa", abbr: "AVL", color: "#670e36", logo: soccerLogo("362") },
    pct: [46, 30], vol: "$860K Vol.", markets: 7, date: "Tomorrow", time: "10:00 AM",
  }),
  draw: { pct: "24%" },
};
export const EPL_GAMES: GameGroup[] = [
  { title: "Today", matches: [EPL_ARS_LIV, EPL_MCI_CHE, EPL_MUN_TOT] },
  { title: "Tomorrow", matches: [EPL_NEW_AVL] },
];

const NBA_BLUE = "#1d428a";
export const NBA_OKC_HOU = vsMatch({
  league: "NBA", leagueColor: NBA_BLUE, sport: "basketball",
  home: { name: "Thunder", abbr: "OKC", color: "#007ac1", logo: nbaLogoU("okc") },
  away: { name: "Rockets", abbr: "HOU", color: "#ce1141", logo: nbaLogoU("hou") },
  pct: [57, 43], live: { mins: "Q3 · 7:41", score: [78, 74] }, vol: "$2.2M Vol.", markets: 14, date: "Aug 17",
});
export const NBA_LAL_GSW = vsMatch({
  league: "NBA", leagueColor: NBA_BLUE, sport: "basketball",
  home: { name: "Lakers", abbr: "LAL", color: "#552583", logo: nbaLogoU("lal") },
  away: { name: "Warriors", abbr: "GSW", color: "#1d428a", logo: nbaLogoU("gs") },
  pct: [48, 52], vol: "$3.4M Vol.", markets: 16, date: "Today", time: "7:30 PM",
});
export const NBA_NYK_CLE = vsMatch({
  league: "NBA", leagueColor: NBA_BLUE, sport: "basketball",
  home: { name: "Knicks", abbr: "NYK", color: "#f58426", logo: nbaLogoU("ny") },
  away: { name: "Cavaliers", abbr: "CLE", color: "#860038", logo: nbaLogoU("cle") },
  pct: [45, 55], vol: "$1.7M Vol.", markets: 12, date: "Tomorrow", time: "7:00 PM",
});
export const NBA_UXR_GAMES: GameGroup[] = [
  { title: "Today", matches: [NBA_OKC_HOU, NBA_LAL_GSW] },
  { title: "Tomorrow", matches: [NBA_NYK_CLE] },
];

const WNBA_ORANGE = "#fa4d00";
export const WNBA_LVA_NYL = vsMatch({
  league: "WNBA", leagueColor: WNBA_ORANGE, sport: "basketball",
  home: { name: "Las Vegas", abbr: "LVA", color: "#a7a8aa", logo: wnbaLogo("lv") },
  away: { name: "New York", abbr: "NYL", color: "#86cebc", logo: wnbaLogo("ny") },
  pct: [55, 45], live: { mins: "Q3 · 4:12", score: [61, 58] }, vol: "$1.6M Vol.", markets: 11, date: "Aug 17",
});
export const WNBA_DAL_GSV = vsMatch({
  league: "WNBA", leagueColor: WNBA_ORANGE, sport: "basketball",
  home: { name: "Dallas", abbr: "DALW", color: "#0c2340", logo: wnbaLogo("dal") },
  away: { name: "Golden State", abbr: "GSV", color: "#5c2d91", logo: wnbaLogo("gs") },
  pct: [30, 70], vol: "$2.2M Vol.", markets: 18, date: "Today", time: "7:00 PM",
});
export const WNBA_LAS_CON = vsMatch({
  league: "WNBA", leagueColor: WNBA_ORANGE, sport: "basketball",
  home: { name: "Los Angeles", abbr: "LAS", color: "#552583", logo: wnbaLogo("la") },
  away: { name: "Connecticut", abbr: "CON", color: "#e03a3e", logo: wnbaLogo("conn") },
  pct: [52, 48], vol: "$740K Vol.", markets: 9, date: "Aug 18", time: "4:00 PM",
});
export const WNBA_MIN_SEA = vsMatch({
  league: "WNBA", leagueColor: WNBA_ORANGE, sport: "basketball",
  home: { name: "Minnesota", abbr: "MINL", color: "#0c2340", logo: wnbaLogo("min") },
  away: { name: "Seattle", abbr: "SEA", color: "#2c5234", logo: wnbaLogo("sea") },
  pct: [61, 39], vol: "$610K Vol.", markets: 8, date: "Aug 18", time: "7:00 PM",
});
export const WNBA_GAMES: GameGroup[] = [
  { title: "Today", matches: [WNBA_LVA_NYL, WNBA_DAL_GSV] },
  { title: "Tomorrow", matches: [WNBA_LAS_CON, WNBA_MIN_SEA] },
];

export const NFL_LV_HOU = vsMatch({
  league: "NFL", leagueColor: "#013369", sport: "americanFootball",
  home: { name: "Raiders", abbr: "LV", color: "#a5acaf", logo: nflLogo("lv") },
  away: { name: "Texans", abbr: "HOU", color: "#03202f", logo: nflLogo("hou") },
  pct: [50, 50], vol: "$1.2M Vol.", markets: 170, date: "Aug 20", time: "5:00 PM",
});
export const NFL_SF_LAC = vsMatch({
  league: "NFL", leagueColor: "#013369", sport: "americanFootball",
  home: { name: "49ers", abbr: "SF", color: "#aa0000", logo: nflLogo("sf") },
  away: { name: "Chargers", abbr: "LAC", color: "#0080c6", logo: nflLogo("lac") },
  pct: [55, 45], vol: "$980K Vol.", markets: 96, date: "Aug 20", time: "7:00 PM",
});

// ── Full Polymarket sports catalog fixtures ─────────────────────────────────
// One or two believable matches per sport so every rail tab renders the same
// Games / Props / league-picker structure as the original categories.
const espnLogo = (lg: string, id: string) => `https://a.espncdn.com/i/teamlogos/${lg}/500/${id}.png`;
const YANKEES_LOGO =
  "https://polymarket.com/_next/image?url=https%3A%2F%2Fpolymarket-upload.s3.us-east-2.amazonaws.com%2FNew%20York%20Yankees-a2b38270a7.png&w=96&q=75";

const MLB_NYY_LAD = vsMatch({
  league: "MLB",
  leagueColor: "#002d72",
  sport: "baseball",
  home: { name: "Yankees", abbr: "NYY", color: "#D71920", logo: YANKEES_LOGO },
  away: { name: "Dodgers", abbr: "LAD", color: "#005a9c", logo: espnLogo("mlb", "lad") },
  pct: [55, 45],
  live: { mins: "T5", score: [3, 2], baseball: { balls: 2, strikes: 1, outs: 1, bases: { third: "home" } } },
  vol: "$2.2M Vol.",
  markets: 8,
  date: "Aug 10",
});
const MLB_NYM_ATL = vsMatch({
  league: "MLB",
  leagueColor: "#002d72",
  sport: "baseball",
  home: { name: "Mets", abbr: "NYM", color: "#ff5910", logo: espnLogo("mlb", "nym") },
  away: { name: "Braves", abbr: "ATL", color: "#ce1141", logo: espnLogo("mlb", "atl") },
  pct: [44, 56],
  vol: "$780K Vol.",
  markets: 6,
  date: "Aug 10",
  time: "7:00 PM",
});

// NPB / KBO live fixtures so the baseball Live tab can break down by league.
const NPB_YOM_HAN = vsMatch({
  league: "NPB",
  leagueColor: "#1b1b6f",
  sport: "baseball",
  home: { name: "Giants", abbr: "YOM", color: "#f97709" },
  away: { name: "Tigers", abbr: "HAN", color: "#ffe201" },
  pct: [58, 42],
  live: { mins: "B7", score: [4, 1], baseball: { balls: 1, strikes: 2, outs: 2, bases: { first: "away" } } },
  vol: "$310K Vol.",
  markets: 5,
  date: "Aug 10",
});
const KBO_LGT_DOO = vsMatch({
  league: "KBO",
  leagueColor: "#0b1e3f",
  sport: "baseball",
  home: { name: "LG Twins", abbr: "LG", color: "#c30452" },
  away: { name: "Doosan Bears", abbr: "DOO", color: "#131c55" },
  pct: [47, 53],
  live: { mins: "T3", score: [2, 2], baseball: { balls: 3, strikes: 1, outs: 0, bases: { second: "home" } } },
  vol: "$140K Vol.",
  markets: 4,
  date: "Aug 10",
});

const UFC_MAIN: Match = {
  league: "UFC",
  leagueColor: "#d20a0a",
  sport: "mma",
  teams: [
    { name: "Makhachev", pct: "64%", color: colors.green, initial: "M", abbr: "MAK", flag: "ru" },
    { name: "Tsarukyan", pct: "36%", color: colors.red, initial: "T", abbr: "TSA", flag: "am" },
  ],
  vol: "$1.9M Vol.",
  date: "Aug 15",
  time: "10:00 PM",
  markets: 5,
};
const BOXING_BOUT: Match = {
  league: "Boxing",
  leagueColor: "#b45309",
  sport: "mma",
  teams: [
    { name: "Inoue", pct: "78%", color: colors.green, initial: "I", abbr: "INO", flag: "jp" },
    { name: "Nery", pct: "22%", color: colors.sky, initial: "N", abbr: "NER", flag: "mx" },
  ],
  vol: "$640K Vol.",
  date: "Aug 22",
  time: "9:00 PM",
  markets: 4,
};

const CRICKET_IND_AUS: Match = {
  league: "T20 World Cup",
  leagueColor: "#1e40af",
  sport: "cricket",
  live: { mins: "14.3 ov" },
  teams: [
    { name: "India", pct: "61%", color: "#1d4ed8", initial: "I", abbr: "IND", flag: "in", hasBall: true, scoreText: "142/3" },
    { name: "Australia", pct: "39%", color: "#facc15", initial: "A", abbr: "AUS", flag: "au", scoreText: "178/6" },
  ],
  vol: "$1.3M Vol.",
  date: "Aug 10",
  time: "10:30 AM",
  markets: 9,
};

const RUGBY_NZ_SA: Match = {
  league: "Rugby Championship",
  leagueColor: "#0f172a",
  sport: "rugby",
  live: { mins: "62'" },
  teams: [
    { name: "All Blacks", pct: "57%", color: "#111827", initial: "N", abbr: "NZL", flag: "nz", hasBall: true, score: 21 },
    { name: "Springboks", pct: "43%", color: "#15803d", initial: "S", abbr: "RSA", flag: "za", score: 17 },
  ],
  vol: "$420K Vol.",
  date: "Aug 10",
  time: "3:05 AM",
  markets: 5,
};

// Table tennis and pickleball reuse the tennis card structure (sets + points).
const TT_WTT_FINAL: Match = {
  league: "WTT Finals",
  leagueColor: "#0e7490",
  sport: "tennis",
  live: { mins: "4th game" },
  teams: [
    { name: "Fan Zhendong", pct: "66%", color: colors.green, initial: "F", abbr: "FAN", flag: "cn", hasBall: true, scoreText: "8", setScores: [11, 9, 7] },
    { name: "T. Harimoto", pct: "34%", color: colors.red, initial: "H", abbr: "HAR", flag: "jp", scoreText: "6", setScores: [7, 11, 11] },
  ],
  vol: "$210K Vol.",
  date: "Aug 10",
  time: "7:00 AM",
  markets: 4,
};
const PICKLE_PPA: Match = {
  league: "PPA Tour",
  leagueColor: "#65a30d",
  sport: "tennis",
  live: { mins: "Game 2" },
  teams: [
    { name: "B. Johns", pct: "72%", color: colors.green, initial: "J", abbr: "JOH", flag: "us", hasBall: true, scoreText: "7", setScores: [11] },
    { name: "F. Staksrud", pct: "28%", color: colors.sky, initial: "S", abbr: "STA", flag: "no", scoreText: "4", setScores: [6] },
  ],
  vol: "$96K Vol.",
  date: "Aug 10",
  time: "1:00 PM",
  markets: 3,
};

const ESPORTS_CS2: Match = {
  league: "CS2 Major",
  leagueColor: "#f59e0b",
  sport: "esports",
  live: { mins: "Map 3" },
  teams: [
    { name: "NaVi", pct: "54%", color: "#facc15", initial: "N", abbr: "NAVI", hasBall: true, score: 1 },
    { name: "FaZe", pct: "46%", color: colors.red, initial: "F", abbr: "FAZE", score: 1 },
  ],
  vol: "$530K Vol.",
  date: "Aug 10",
  time: "11:00 AM",
  markets: 6,
};
const ESPORTS_LOL: Match = {
  league: "LoL Worlds",
  leagueColor: "#2563eb",
  sport: "esports",
  teams: [
    { name: "T1", pct: "58%", color: colors.red, initial: "T", abbr: "T1" },
    { name: "Gen.G", pct: "42%", color: "#b45309", initial: "G", abbr: "GENG" },
  ],
  vol: "$710K Vol.",
  date: "Aug 16",
  time: "4:00 AM",
  markets: 5,
};

const CYCLING_VUELTA: Match = {
  league: "Vuelta a España",
  leagueColor: "#dc2626",
  sport: "racing",
  live: { mins: "42 km to go" },
  teams: [
    { name: "Pogačar", pct: "59%", color: colors.green, initial: "P", abbr: "POG", flag: "si", hasBall: true, scoreText: "P1", gap: "+0:48" },
    { name: "Vingegaard", pct: "41%", color: colors.red, initial: "V", abbr: "VIN", flag: "dk", scoreText: "P2", gap: "-0:48" },
  ],
  vol: "$380K Vol.",
  date: "Aug 10",
  time: "9:00 AM",
  markets: 4,
};

const POKER_WSOP: Match = {
  league: "WSOP Main Event",
  leagueColor: "#7c3aed",
  sport: "poker",
  live: { mins: "Final table" },
  teams: [
    { name: "D. Negreanu", pct: "38%", color: colors.green, initial: "N", abbr: "NEG", flag: "ca", hasBall: true, scoreText: "42.5M" },
    { name: "P. Ivey", pct: "29%", color: colors.sky, initial: "I", abbr: "IVE", flag: "us", scoreText: "31.2M" },
  ],
  vol: "$260K Vol.",
  date: "Aug 10",
  time: "6:00 PM",
  markets: 7,
};

const CHESS_WCC: Match = {
  league: "World Championship",
  leagueColor: "#334155",
  sport: "chess",
  live: { mins: "Game 7" },
  teams: [
    { name: "Gukesh D", pct: "52%", color: colors.green, initial: "G", abbr: "GUK", flag: "in", hasBall: true, scoreText: "3.5" },
    { name: "Ding Liren", pct: "48%", color: colors.red, initial: "D", abbr: "DIN", flag: "cn", scoreText: "2.5" },
  ],
  vol: "$150K Vol.",
  date: "Aug 10",
  time: "8:00 AM",
  markets: 3,
};

export type UxrSport = {
  slug: string;
  label: string;
  emoji: string; // fallback when no icon asset exists (e.g. Nascar)
  games: GameGroup[];
  props: Binary[];
  leagues: { name: string; count: number; avatar?: string }[];
};

const FOOTBALL_GAMES: GameGroup[] = [
  { title: "Thursday, August 6th", matches: [PANTHERS_CARDINALS] },
  { title: "Friday, August 7th", matches: [PACKERS_STEELERS] },
  { title: "Thursday, August 20th", matches: [NFL_LV_HOU, NFL_SF_LAC] },
];

const NCAAF_GAMES: GameGroup[] = [
  { title: "Thursday, August 6th", matches: [NCAAF_GEORGIA_ALABAMA] },
  { title: "Saturday, August 8th", matches: [NCAAF_MICHIGAN_OSU] },
];

// ESPN soccer league marks (dark variants on the black prototype surface).
const soccerLeagueLogo = (id: number, dark = true) =>
  `https://a.espncdn.com/i/leaguelogos/soccer/${dark ? "500-dark" : "500"}/${id}.png`;

const PREMIER_LEAGUE_LOGO = soccerLeagueLogo(23);
const MLS_LOGO = soccerLeagueLogo(19);

export const LEAGUE_AVATAR_SIZE = 24;

export function LeagueAvatar({ uri, size = LEAGUE_AVATAR_SIZE }: { uri?: string; size?: number }) {
  if (!uri) return null;
  return <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="contain" />;
}

export type SoccerCountrySection = {
  country: string;
  leagues: { name: string; count: number; avatar?: string }[];
};

// Soccer leagues in prediction markets, grouped by country (the league picker
// renders these as collapsible country sections).
export const SOCCER_COUNTRY_SECTIONS: SoccerCountrySection[] = [
  {
    country: "Trending",
    leagues: [
      { name: "Premier League", count: 204, avatar: PREMIER_LEAGUE_LOGO },
      { name: "MLS", count: 33, avatar: MLS_LOGO },
      { name: "UEFA Champions League", count: 156, avatar: soccerLeagueLogo(2) },
      { name: "UEFA Europa League", count: 84, avatar: soccerLeagueLogo(2310) },
      { name: "Copa Libertadores", count: 42, avatar: soccerLeagueLogo(13) },
    ],
  },
  {
    country: "England",
    leagues: [
      { name: "Premier League", count: 204, avatar: PREMIER_LEAGUE_LOGO },
      { name: "Championship", count: 58, avatar: soccerLeagueLogo(24) },
      { name: "FA Cup", count: 24, avatar: soccerLeagueLogo(40) },
    ],
  },
  {
    country: "Spain",
    leagues: [
      { name: "La Liga", count: 118, avatar: soccerLeagueLogo(15) },
      { name: "Copa del Rey", count: 21, avatar: soccerLeagueLogo(80) },
    ],
  },
  {
    country: "Italy",
    leagues: [
      { name: "Serie A", count: 92, avatar: soccerLeagueLogo(12) },
      { name: "Coppa Italia", count: 14, avatar: soccerLeagueLogo(2192, false) },
    ],
  },
  {
    country: "Germany",
    leagues: [
      { name: "Bundesliga", count: 96, avatar: soccerLeagueLogo(10) },
      { name: "2. Bundesliga", count: 28, avatar: soccerLeagueLogo(64) },
    ],
  },
  { country: "France", leagues: [{ name: "Ligue 1", count: 74, avatar: soccerLeagueLogo(9) }] },
  { country: "United States", leagues: [{ name: "MLS", count: 33, avatar: MLS_LOGO }] },
  { country: "Mexico", leagues: [{ name: "Liga MX", count: 38, avatar: soccerLeagueLogo(22) }] },
  { country: "Netherlands", leagues: [{ name: "Eredivisie", count: 26, avatar: soccerLeagueLogo(11) }] },
  { country: "Portugal", leagues: [{ name: "Primeira Liga", count: 24, avatar: soccerLeagueLogo(14) }] },
  { country: "Brazil", leagues: [{ name: "Brasileirão Série A", count: 31, avatar: soccerLeagueLogo(85) }] },
  { country: "Argentina", leagues: [{ name: "Primera División", count: 27, avatar: soccerLeagueLogo(1) }] },
  { country: "Saudi Arabia", leagues: [{ name: "Saudi Pro League", count: 29, avatar: soccerLeagueLogo(2488) }] },
];

// New-sport fixtures exported for the match-detail REGISTRY so tapping these
// cards resolves a detail page (keyed by first-team abbr, like every match).
export const EXTRA_SPORT_MATCHES: Match[] = [
  MLB_NYY_LAD, MLB_NYM_ATL, NPB_YOM_HAN, KBO_LGT_DOO, UFC_MAIN, BOXING_BOUT, CRICKET_IND_AUS, RUGBY_NZ_SA,
  TT_WTT_FINAL, PICKLE_PPA, ESPORTS_CS2, ESPORTS_LOL, CYCLING_VUELTA, POKER_WSOP, CHESS_WCC,
  // Realistic league fixtures (Premier League / NBA / WNBA / NFL preseason).
  EPL_ARS_LIV, EPL_MCI_CHE, EPL_MUN_TOT, EPL_NEW_AVL,
  NBA_OKC_HOU, NBA_LAL_GSW, NBA_NYK_CLE,
  WNBA_LVA_NYL, WNBA_DAL_GSV, WNBA_LAS_CON, WNBA_MIN_SEA,
  NFL_LV_HOU, NFL_SF_LAC,
];

// Rail order mirrors Polymarket's full sports list.
export const UXR_SPORTS: UxrSport[] = [
  {
    slug: "baseball",
    label: "Baseball",
    emoji: "⚾",
    games: [{ title: "Today", matches: [MLB_NYY_LAD, MLB_NYM_ATL, NPB_YOM_HAN, KBO_LGT_DOO] }],
    props: [
      binary({ title: "Judge homers tonight?", yes: 33, no: 67, colors: ["#003087", "#71717a"], vol: "$290K Vol.", date: "Aug 10" }),
    ],
    leagues: [
      { name: "MLB", count: 142 },
      { name: "NPB", count: 24 },
      { name: "KBO", count: 18 },
    ],
  },
  {
    slug: "combat",
    label: "Combat",
    emoji: "🥊",
    games: [{ title: "Upcoming", matches: [UFC_MAIN, BOXING_BOUT] }],
    props: [
      binary({ title: "Main event ends by finish?", yes: 57, no: 43, colors: ["#d20a0a", "#71717a"], vol: "$340K Vol.", date: "Aug 15" }),
    ],
    leagues: [
      { name: "UFC", count: 96 },
      { name: "Boxing", count: 44 },
      { name: "PFL", count: 12 },
    ],
  },
  {
    slug: "soccer",
    label: "Soccer",
    emoji: "⚽",
    games: [
      { title: "Today", matches: [EPL_ARS_LIV, EPL_MCI_CHE, EPL_MUN_TOT, ...WORLD_CUP] },
      { title: "Tomorrow", matches: [EPL_NEW_AVL] },
    ],
    props: [
      binary({ title: "Mbappé scores in the final?", yes: 48, no: 52, colors: ["#1d4ed8", "#71717a"], vol: "$1.1M Vol.", date: "Aug 10" }),
      binary({ title: "Final decided on penalties?", yes: 19, no: 81, vol: "$540K Vol.", date: "Aug 10" }),
    ],
    // Dedupe by name — Trending repeats leagues that also live under a country.
    leagues: SOCCER_COUNTRY_SECTIONS.flatMap((c) => c.leagues).filter(
      (l, i, arr) => arr.findIndex((x) => x.name === l.name) === i,
    ),
  },
  {
    slug: "cricket",
    label: "Cricket",
    emoji: "🏏",
    games: [{ title: "Today", matches: [CRICKET_IND_AUS] }],
    props: [
      binary({ title: "A century scored in this match?", yes: 24, no: 76, colors: ["#1d4ed8", "#71717a"], vol: "$180K Vol.", date: "Aug 10" }),
    ],
    leagues: [
      { name: "IPL", count: 88 },
      { name: "T20 World Cup", count: 31 },
      { name: "The Hundred", count: 22 },
      { name: "Big Bash", count: 16 },
    ],
  },
  {
    slug: "basketball",
    label: "Basketball",
    emoji: "🏀",
    games: [
      { title: "Today", matches: [NBA_OKC_HOU, NBA_LAL_GSW, WNBA_LVA_NYL, WNBA_DAL_GSV] },
      { title: "Tomorrow", matches: [NBA_NYK_CLE, WNBA_LAS_CON, WNBA_MIN_SEA] },
    ],
    props: [
      binary({ title: "Any player scores 50+ tonight?", yes: 12, no: 88, colors: ["#c8102e", "#71717a"], vol: "$410K Vol.", date: "Aug 6" }),
    ],
    leagues: [
      { name: "NBA", count: 214 },
      { name: "WNBA", count: 26 },
      { name: "NCAA Basketball", count: 96 },
      { name: "EuroLeague", count: 41 },
      { name: "CBA", count: 12 },
    ],
  },
  {
    slug: "football",
    label: "Football",
    emoji: "🏈",
    games: FOOTBALL_GAMES,
    props: [
      binary({ title: "Mahomes throws 3+ TDs this week?", yes: 41, no: 59, colors: ["#e31837", "#71717a"], vol: "$620K Vol.", date: "Aug 9" }),
      binary({ title: "Any game goes to overtime this week?", yes: 27, no: 73, vol: "$310K Vol.", date: "Aug 9" }),
    ],
    leagues: [
      { name: "NFL", count: 247 },
      { name: "NCAA Football", count: 126 },
      { name: "Pro Football Preseason", count: 17 },
      { name: "CFL", count: 5 },
    ],
  },
  {
    slug: "hockey",
    label: "Hockey",
    emoji: "🏒",
    games: [{ title: "Today", matches: [NHL] }],
    props: [
      binary({ title: "Hat trick scored tonight?", yes: 9, no: 91, colors: ["#ff4c00", "#71717a"], vol: "$120K Vol.", date: "Aug 10" }),
    ],
    leagues: [
      { name: "NHL", count: 133 },
      { name: "KHL", count: 21 },
      { name: "IIHF", count: 9 },
    ],
  },
  {
    slug: "rugby",
    label: "Rugby",
    emoji: "🏉",
    games: [{ title: "Today", matches: [RUGBY_NZ_SA] }],
    props: [
      binary({ title: "Both teams score 20+ points?", yes: 46, no: 54, colors: ["#15803d", "#71717a"], vol: "$88K Vol.", date: "Aug 10" }),
    ],
    leagues: [
      { name: "Rugby Championship", count: 12 },
      { name: "Six Nations", count: 18 },
      { name: "Super Rugby", count: 26 },
    ],
  },
  {
    slug: "tabletennis",
    label: "Table tennis",
    emoji: "🏓",
    games: [{ title: "Today", matches: [TT_WTT_FINAL] }],
    props: [
      binary({ title: "Final goes the full distance?", yes: 38, no: 62, colors: ["#0e7490", "#71717a"], vol: "$54K Vol.", date: "Aug 10" }),
    ],
    leagues: [
      { name: "WTT Finals", count: 34 },
      { name: "Olympics", count: 8 },
    ],
  },
  {
    slug: "golf",
    label: "Golf",
    emoji: "⛳",
    games: [{ title: "Final round", matches: [GOLF] }],
    props: [
      binary({ title: "Winning score under -18?", yes: 35, no: 65, colors: ["#16a34a", "#71717a"], vol: "$180K Vol.", date: "Aug 9" }),
    ],
    leagues: [
      { name: "PGA Tour", count: 64 },
      { name: "LIV Golf", count: 22 },
      { name: "DP World Tour", count: 18 },
    ],
  },
  {
    slug: "motorsports",
    label: "Motorsports",
    emoji: "🏎️",
    games: [{ title: "This weekend", matches: [F1_RACE] }],
    props: [
      binary({ title: "Safety car in the first 10 laps?", yes: 44, no: 56, colors: ["#f59e0b", "#71717a"], vol: "$95K Vol.", date: "Aug 9" }),
    ],
    leagues: [
      { name: "Formula 1", count: 58 },
      { name: "Nascar Cup Series", count: 40 },
      { name: "MotoGP", count: 22 },
      { name: "IndyCar", count: 14 },
    ],
  },
  {
    slug: "tennis",
    label: "Tennis",
    emoji: "🎾",
    games: [{ title: "Today", matches: [TENNIS, TENNIS_DECIDER] }],
    props: [
      binary({ title: "Alcaraz wins in straight sets?", yes: 31, no: 69, colors: ["#16a34a", "#71717a"], vol: "$260K Vol.", date: "Aug 6" }),
    ],
    leagues: [
      { name: "ATP", count: 88 },
      { name: "WTA", count: 74 },
      { name: "Challenger Tour", count: 21 },
    ],
  },
  {
    slug: "pickleball",
    label: "Pickleball",
    emoji: "🎾",
    games: [{ title: "Today", matches: [PICKLE_PPA] }],
    props: [
      binary({ title: "Match decided in straight games?", yes: 55, no: 45, colors: ["#65a30d", "#71717a"], vol: "$21K Vol.", date: "Aug 10" }),
    ],
    leagues: [
      { name: "PPA Tour", count: 12 },
      { name: "MLP", count: 9 },
    ],
  },
  {
    slug: "esports",
    label: "E-sports",
    emoji: "🎮",
    games: [{ title: "Today", matches: [ESPORTS_CS2, ESPORTS_LOL] }],
    props: [
      binary({ title: "Any map goes to overtime?", yes: 41, no: 59, colors: ["#f59e0b", "#71717a"], vol: "$140K Vol.", date: "Aug 10" }),
    ],
    leagues: [
      { name: "CS2 Major", count: 64 },
      { name: "LoL Worlds", count: 51 },
      { name: "Dota 2", count: 38 },
      { name: "Valorant", count: 29 },
    ],
  },
  {
    slug: "cycling",
    label: "Cycling",
    emoji: "🚴",
    games: [{ title: "Today", matches: [CYCLING_VUELTA] }],
    props: [
      binary({ title: "Breakaway wins the stage?", yes: 30, no: 70, colors: ["#dc2626", "#71717a"], vol: "$47K Vol.", date: "Aug 10" }),
    ],
    leagues: [
      { name: "Vuelta a España", count: 16 },
      { name: "Tour de France", count: 41 },
      { name: "Giro d'Italia", count: 18 },
    ],
  },
  {
    slug: "poker",
    label: "Poker",
    emoji: "🃏",
    games: [{ title: "Today", matches: [POKER_WSOP] }],
    props: [
      binary({ title: "Chip leader wins the bracelet?", yes: 39, no: 61, colors: ["#7c3aed", "#71717a"], vol: "$63K Vol.", date: "Aug 10" }),
    ],
    leagues: [
      { name: "WSOP", count: 27 },
      { name: "WPT", count: 11 },
    ],
  },
  {
    slug: "chess",
    label: "Chess",
    emoji: "♟️",
    games: [{ title: "Today", matches: [CHESS_WCC] }],
    props: [
      binary({ title: "Game 7 ends in a draw?", yes: 62, no: 38, colors: ["#334155", "#71717a"], vol: "$33K Vol.", date: "Aug 10" }),
    ],
    leagues: [
      { name: "World Championship", count: 19 },
      { name: "Speed Chess", count: 8 },
    ],
  },
  {
    slug: "indices",
    label: "Indices",
    emoji: "📈",
    games: [],
    props: [
      binary({ title: "S&P 500 closes up today?", yes: 54, no: 46, colors: ["#16a34a", "#71717a"], vol: "$2.1M Vol.", date: "Aug 20" }),
      binary({ title: "Nasdaq finishes green this week?", yes: 49, no: 51, colors: ["#2563eb", "#71717a"], vol: "$880K Vol.", date: "Aug 20" }),
    ],
    leagues: [
      { name: "S&P 500", count: 18 },
      { name: "Nasdaq", count: 14 },
      { name: "Dow Jones", count: 11 },
    ],
  },
];

export function sportBySlug(slug: string): UxrSport | undefined {
  const aliases: Record<string, string> = {
    mma: "combat",
    boxing: "combat",
    pga: "golf",
    racing: "motorsports",
    "e-sports": "esports",
  };
  const resolved = aliases[slug] ?? slug;
  return UXR_SPORTS.find((s) => s.slug === resolved);
}

// League page data: leagues with dedicated fixtures fall back to their parent
// sport's games so every league page shows real cards.
export function leagueGames(leagueName: string): GameGroup[] {
  const byLeague: Record<string, GameGroup[]> = {
    NFL: FOOTBALL_GAMES,
    NCAAF: NCAAF_GAMES,
    "NCAA Football": NCAAF_GAMES,
    NBA: NBA_UXR_GAMES,
    WNBA: WNBA_GAMES,
    "Premier League": EPL_GAMES,
    "FIFA World Cup": [{ title: "Today", matches: WORLD_CUP }],
  };
  if (byLeague[leagueName]) return byLeague[leagueName];
  const parent = UXR_SPORTS.find((s) => s.leagues.some((l) => l.name === leagueName));
  return parent ? parent.games : [];
}

function matchBelongsToLeague(matchLeague: string, selected: string): boolean {
  const a = matchLeague.toLowerCase();
  const b = selected.toLowerCase();
  if (a === b) return true;
  if (a.startsWith(`${b} `) || a.startsWith(`${b} ·`) || a.startsWith(`${b}·`)) return true;
  if (b === "ncaa football") return a === "ncaaf" || a.startsWith("ncaaf");
  if (b === "fifa world cup") return a.includes("world cup") || a === "fifa";
  return false;
}

function stripGamesSuffix(title: string): string {
  return title.replace(/\s+games$/i, "");
}

export function gamesForSelectedLeague(sport: UxrSport, leagueName: string): GameGroup[] {
  const source = leagueName === "All" ? sport.games : sport.games;
  if (leagueName === "All") {
    return source.map((group) => ({ ...group, title: stripGamesSuffix(group.title) }));
  }
  const filtered = source
    .map((group) => ({
      ...group,
      title: stripGamesSuffix(group.title),
      matches: group.matches.filter((match) => matchBelongsToLeague(match.league, leagueName)),
    }))
    .filter((group) => group.matches.length > 0);
  if (filtered.length > 0) return filtered;
  const dedicated = leagueGames(leagueName);
  if (dedicated === sport.games) return [];
  return dedicated
    .map((group) => ({
      ...group,
      title: stripGamesSuffix(group.title),
      matches: group.matches.filter((match) => matchBelongsToLeague(match.league, leagueName)),
    }))
    .filter((group) => group.matches.length > 0);
}

// League-sectioned games for a sport page's Games tab: each section is one
// league heading ("NFL >") + its date groups. Leagues without dedicated
// fixtures are skipped; if none match, the sport's games fall back under the
// primary league so the tab never renders empty.
export function sportLeagueSections(sport: UxrSport): { league: string; groups: GameGroup[] }[] {
  const dedicated: Record<string, string[]> = {
    football: ["NFL"],
    basketball: ["NBA", "WNBA"],
    soccer: ["Premier League", "FIFA World Cup"],
  };
  const names = dedicated[sport.slug];
  if (names) return names.map((league) => ({ league, groups: leagueGames(league) }));
  return [{ league: sport.leagues[0]?.name ?? sport.label, groups: sport.games }];
}

export function leagueProps(leagueName: string): Binary[] {
  const parent = UXR_SPORTS.find((s) => s.leagues.some((l) => l.name === leagueName));
  return parent ? parent.props : [];
}

// Feed display settings for the UXR standalone pages — mirrors the home feed
// defaults (see feed-cards-standalone-providers memory) so the shared cards
// render identically here.
const FEED_SETTINGS: FeedSettings = {
  density: "comfort",
  showFooter: true,
  footerDetail: { metadata: true, volume: true, endDate: false, outcomes: true },
  versusLayout: "sides",
  versusMode: "new",
  versusAccent: "corner",
  versusHeaderAlign: "center",
  versusVersion: "a",
  versusUpcoming: true,
  standardAccent: "corner",
  centerAccentWidth: "default",
  accentOpacity: 0.54,
  oddsUnit: "cents",
  matchLayout: "standard",
  // Versus cards on the sport/league pages stack the live stamp: dot + LIVE on
  // top, the period/clock centered underneath (per the UXR mock).
  liveFormat: "stacked",
  scoreGlow: false,
  scoreGlowMode: "inPlace",
  scorerCallout: false,
  innerGlow: true,
  whiteBars: false,
  barTrack: false,
  heroSection: "carousel",
  sections: {
    trending: { enabled: true, count: 5 },
    sports: { enabled: true, count: 4 },
    crypto: { enabled: true, count: 4 },
    politics: { enabled: true, count: 4 },
  },
  popularPlacement: "inTrending",
  popularRows: 1,
  cardStyle: "card",
  showClaim: false,
  showPositionBanner: false,
  positionBannerPlacement: "carousel",
  showLiveGames: false,
  showActivePositions: false,
  showBtcUpDown: false,
  showTeamAvatars: true,
  standardDateInFooter: true,
  teamAvatars: "logo",
  possessionScope: "none",
  openSettings: () => {},
};

export function UxrCardProviders({ children }: { children: React.ReactNode }) {
  return (
    <FeedSettingsProvider value={FEED_SETTINGS}>
      <LiveTickProvider>
        <LiveCueColorProvider cue="green">{children}</LiveCueColorProvider>
      </LiveTickProvider>
    </FeedSettingsProvider>
  );
}

// Pill tab row per the UXR mock: selected = white pill with dark text.
export function UxrTabs<T extends string>({
  tabs,
  active,
  onChange,
  bare = false,
  bottomSpacing = 16,
}: {
  tabs: { key: T; label: string }[];
  active: T;
  onChange: (t: T) => void;
  // Skip the built-in gutter when the caller lays the tabs out in its own row.
  bare?: boolean;
  bottomSpacing?: number;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: bare ? 0 : 16, marginBottom: bottomSpacing }}>
      {tabs.map((t) => {
        const selected = t.key === active;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            style={{
              height: 40,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 14,
              borderRadius: 12,
              flexDirection: t.key === "live" ? "row" : "column",
              gap: t.key === "live" ? 6 : 0,
              backgroundColor: filterChipBackground(selected),
            }}
          >
            {t.key === "live" && <LiveDot color={colors.green} />}
            <Text
              style={{
                fontFamily: geist.medium,
                fontSize: 16,
                lineHeight: 24,
                color: selected ? colors.textPrimary : FILTER_CHIP_INACTIVE_TEXT,
              }}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Date-grouped game card list ("Thursday, August 6th" → cards).
export function UxrGameGroups({
  groups,
  horizontalPadding = 16,
  combo = false,
}: {
  groups: GameGroup[];
  horizontalPadding?: number;
  sectionGap?: number;
  combo?: boolean;
}) {
  const router = useRouter();
  const matches = groups.flatMap((g) => g.matches);
  if (matches.length === 0) {
    return (
      <Text style={{ fontFamily: geist.medium, fontSize: 14, color: colors.textMuted, paddingHorizontal: 16, paddingTop: 24, textAlign: "center" }}>
        No games right now
      </Text>
    );
  }
  return (
    <View style={{ gap: 12, paddingHorizontal: horizontalPadding }}>
      {matches.map((m, i) => (
        <Pressable
          key={`${m.league}-${m.teams[0]?.abbr ?? i}-${m.teams[1]?.abbr ?? i}-${i}`}
          onPress={() => {
            const href = matchDetailHref(m);
            router.push((combo ? `${href}${href.includes("?") ? "&" : "?"}combo=1` : href) as never);
          }}
        >
          <MatchCard m={m} layout="global" combo={combo} />
        </Pressable>
      ))}
    </View>
  );
}

// League sections for a sport page's Games tab: "NFL >" heading drills into
// the league page. (No COMBO pill/banner — combinations are inherent.)
export function UxrLeagueSections({ sections, combo = false }: { sections: { league: string; groups: GameGroup[] }[]; combo?: boolean }) {
  const router = useRouter();
  return (
    <View style={{ gap: 20 }}>
      {sections.map((s) => (
        <View key={s.league} style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 }}>
            <Pressable
              onPress={() => {
                const parent = UXR_SPORTS.find((sp) => sp.leagues.some((l) => l.name === s.league));
                const slug = parent?.slug ?? "football";
                router.push(`/uxr-sport/${slug}?league=${encodeURIComponent(s.league)}${combo ? "&combo=1" : ""}` as never);
              }}
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Text style={{ fontFamily: geist.semibold, fontSize: 18, lineHeight: 24, color: colors.textPrimary }}>{s.league}</Text>
              <ChevronIcon size={16} color={colors.textMuted} />
            </Pressable>
          </View>
          <UxrGameGroups groups={s.groups} combo={combo} />
        </View>
      ))}
    </View>
  );
}

export function UxrPropsList({ props, combo = false }: { props: Binary[]; combo?: boolean }) {
  const router = useRouter();
  if (props.length === 0) {
    return (
      <Text style={{ fontFamily: geist.medium, fontSize: 14, color: colors.textMuted, paddingHorizontal: 16, paddingTop: 24, textAlign: "center" }}>
        No props right now
      </Text>
    );
  }
  return (
    <View style={{ gap: 12, paddingHorizontal: 16 }}>
      {props.map((p) => (
        <Pressable
          key={p.title}
          onPress={() =>
            router.push({
              pathname: PREDICTION_DETAIL_HREF,
              params: {
                t: p.title,
                yes: String(parseInt(p.match.teams[0].pct ?? "50", 10) || 50),
                vol: p.match.vol,
                ...(combo ? { combo: "1" } : {}),
              },
            } as never)
          }
        >
          <BinaryCard item={p} />
        </Pressable>
      ))}
    </View>
  );
}

// Plain browse row (icon/emoji + label + trailing detail + chevron), per the
// UXR mock's list styling — no card background, just comfortable rows. `icon`
// (final 3D render) wins over the `emoji` fallback.
export function UxrRow({
  label,
  emoji,
  icon,
  materialIcon,
  mciIcon,
  detail,
  showChevron = true,
  onPress,
}: {
  label: string;
  emoji?: string;
  icon?: ImageSourcePropType;
  // Wins over icon/emoji — used when the "Category tiles" setting is "Icons".
  materialIcon?: MaterialIconName;
  // Community-set fallback for sports the classic set lacks (e.g. chess).
  mciIcon?: MaterialCommunityIconName;
  detail?: string;
  showChevron?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 13 }}
    >
      {materialIcon != null ? (
        <View style={{ width: 26, alignItems: "center" }}>
          {outlinedSportId(materialIcon) ? (
            <MaterialOutlinedSportIcon name={materialIcon} size={22} color={colors.textPrimary} />
          ) : (
            <MaterialIcons name={materialIcon} size={22} color={colors.textPrimary} />
          )}
        </View>
      ) : mciIcon != null ? (
        <View style={{ width: 26, alignItems: "center" }}>
          <MaterialCommunityIcons name={mciIcon} size={22} color={colors.textPrimary} />
        </View>
      ) : icon != null ? (
        <Image source={icon} style={{ width: 26, height: 26 }} resizeMode="contain" />
      ) : emoji != null ? (
        <Text style={{ fontSize: 20, lineHeight: 26 }}>{emoji}</Text>
      ) : null}
      <Text style={{ flex: 1, fontFamily: geist.medium, fontSize: 15, color: colors.textPrimary }}>{label}</Text>
      {detail != null && (
        <Text style={{ fontFamily: geist.medium, fontSize: 13, color: colors.textMuted }}>{detail}</Text>
      )}
      {showChevron && <ChevronIcon size={16} />}
    </Pressable>
  );
}

export function UxrLeagueList({ leagues }: { leagues: { name: string; count: number }[] }) {
  const router = useRouter();
  return (
    <View>
      <Text style={{ fontFamily: geist.semibold, fontSize: 15, color: colors.textPrimary, paddingHorizontal: 16, marginBottom: 4 }}>
        Leagues
      </Text>
      {leagues.map((l) => (
        <UxrRow
          key={l.name}
          label={l.name}
          detail={String(l.count)}
          onPress={() => router.push(`/uxr-league/${encodeURIComponent(l.name)}` as never)}
        />
      ))}
    </View>
  );
}

// Shared scrollable page body under a PageHeader.
export function UxrPageScroll({
  children,
  contentBottomPadding,
  contentGap,
  contentTopPadding = PAGE_BODY_TOP_PADDING,
}: {
  children: React.ReactNode;
  // Extra bottom padding when a docked sheet (e.g. the combo slip) overlays
  // the scroll content.
  contentBottomPadding?: number;
  contentGap?: number;
  contentTopPadding?: number;
}) {
  return (
    <ScrollView
      style={{ flex: 1, minHeight: 0 }}
      contentContainerStyle={{ paddingTop: contentTopPadding, paddingBottom: contentBottomPadding ?? 48, gap: contentGap ?? 16 }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}
