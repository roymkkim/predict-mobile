// Curated market data for the native "Version A" feed rebuild. Ported verbatim
// (values) from predict-simulator-2's data files for the cards that Version A
// renders: the live tennis StandardCard, the three World Cup VersusCards, and
// the crypto + politics PoliticsCards in Trending.
import { colors } from "./colors";
import type { BtcDailyMarket, CryptoMarket, Match, OutcomeAvatar, PoliticsMarket } from "./types";

// Real athlete headshots (Wikimedia portraits) for individual sports, shown when
// the "Athlete photos" toggle is on. Each pairs with a `photoAspect` (height/
// width of the source) so the crop can be top-anchored to keep the face.
const PHOTO = {
  hatton: { src: require("@/assets/figmaAssets/athlete-hatton.jpg"), aspect: 1.333 },
  rahm: { src: require("@/assets/figmaAssets/athlete-rahm.jpg"), aspect: 1.427 },
  alcaraz: { src: require("@/assets/figmaAssets/athlete-alcaraz.jpg"), aspect: 1.391 },
  sinner: { src: require("@/assets/figmaAssets/athlete-sinner.jpg"), aspect: 1.333 },
  verstappen: { src: require("@/assets/figmaAssets/athlete-verstappen.jpg"), aspect: 1.321 },
  norris: { src: require("@/assets/figmaAssets/athlete-norris.jpg"), aspect: 1.233 },
} as const;

// Country-flag avatar (flagcdn) for markets about a specific country — same flag
// source the team crests use. cc is an ISO 3166-1 alpha-2 code (e.g. "us", "ca").
const flag = (cc: string) => ({ uri: `https://flagcdn.com/w160/${cc}.png` });

// Per-outcome avatar helpers (see OutcomeAvatar in types.ts).
// ESPN team-logo avatar for sports-team outcomes — a transparent PNG, so it is
// rendered contained within the configured avatar frame. league e.g. "soccer" |
// "mlb" | "nfl" | "nba".
const espnLogo = (league: string, id: string, _dark = false): OutcomeAvatar => ({
  type: "image",
  source: { uri: `https://a.espncdn.com/i/teamlogos/${league}/500/${id}.png` },
  contain: true,
});
const YANKEES_LOGO =
  "https://polymarket.com/_next/image?url=https%3A%2F%2Fpolymarket-upload.s3.us-east-2.amazonaws.com%2FNew%20York%20Yankees-a2b38270a7.png&w=96&q=75";
// String team-logo URL for a match team's `logo` field (Crest "logo" variant).
const teamLogo = (league: string, id: string) => `https://a.espncdn.com/i/teamlogos/${league}/500/${id}.png`;
// Country-flag avatar for an outcome (e.g. a driver's nationality).
const flagAvatar = (cc: string): OutcomeAvatar => ({ type: "image", source: flag(cc) });
// Solid color chip for outcomes with no logo (e.g. political parties).
const swatch = (color: string): OutcomeAvatar => ({ type: "swatch", color });

// The "BTC Up or Down Daily" live-center market: a fast-resetting binary on
// whether BTC closes the period up or down, rendered as a live price chart.
export const BTC_DAILY: BtcDailyMarket = {
  title: "BTC Up or Down Daily",
  price: "$61,201",
  time: "17:40:13",
  up: { label: "Up", pct: "69%" },
  down: { label: "Down", pct: "31%" },
  category: "BTC",
  vol: "$3.1M Vol.",
  resets: "Resets every 5 minutes",
};

export const SOCCER: Match = {
  league: "FIFA World Cup",
  leagueColor: "#326295",
  sport: "soccer",
  live: { mins: "57'" },
  teams: [
    { name: "Spain", pct: "48%", color: "#c60b1e", initial: "S", abbr: "ESP", flag: "es", hasBall: true, score: 1 },
    { name: "France", pct: "29%", color: "#1d4ed8", initial: "F", abbr: "FRA", flag: "fr", score: 1 },
  ],
  draw: { pct: "23%" },
  vol: "$1.8M Vol.",
  date: "Jun 14",
  time: "12:00 PM",
  markets: 11,
};

export const SOCCER_BRA_ARG: Match = {
  league: "FIFA World Cup",
  leagueColor: "#326295",
  sport: "soccer",
  live: { mins: "72'" },
  teams: [
    { name: "Brazil", pct: "54%", color: "#009c3b", initial: "B", abbr: "BRA", flag: "br", hasBall: true, score: 2 },
    { name: "Argentina", pct: "27%", color: "#75aadb", initial: "A", abbr: "ARG", flag: "ar", score: 1 },
  ],
  draw: { pct: "19%" },
  vol: "$2.4M Vol.",
  date: "Jun 15",
  time: "3:00 PM",
  markets: 13,
};

export const SOCCER_POR_NED: Match = {
  league: "FIFA World Cup",
  leagueColor: "#326295",
  sport: "soccer",
  live: { mins: "31'" },
  teams: [
    { name: "Portugal", pct: "44%", color: "#006600", initial: "P", abbr: "POR", flag: "pt", hasBall: true, score: 0 },
    { name: "Netherlands", pct: "35%", color: "#ff6a13", initial: "N", abbr: "NED", flag: "nl", score: 0 },
  ],
  draw: { pct: "21%" },
  vol: "$1.6M Vol.",
  date: "Jun 16",
  time: "12:00 PM",
  markets: 9,
};

export const TENNIS: Match = {
  league: "Wimbledon",
  leagueColor: "#4f2683",
  sport: "tennis",
  live: { mins: "2nd set" },
  teams: [
    { name: "Alcaraz", pct: "63%", color: colors.green, initial: "A", abbr: "ALC", flag: "es", hasBall: true, scoreText: "40", setScores: [6, 3], photo: PHOTO.alcaraz.src, photoAspect: PHOTO.alcaraz.aspect },
    { name: "Sinner", pct: "37%", color: colors.red, initial: "S", abbr: "SIN", flag: "it", scoreText: "15", setScores: [4, 2], photo: PHOTO.sinner.src, photoAspect: PHOTO.sinner.aspect },
  ],
  vol: "$640K Vol.",
  date: "Jul 5",
  time: "2:00 PM",
  markets: 6,
};

// A second tennis match deep into a decider — three sets of game scores plus a
// live game in progress, maximizing the live score column on the standard card.
export const TENNIS_DECIDER: Match = {
  league: "WTA",
  leagueColor: "#5b2a86",
  sport: "tennis",
  live: { mins: "3rd set" },
  teams: [
    { name: "Swiatek", pct: "58%", color: colors.green, initial: "S", abbr: "SWI", flag: "pl", hasBall: true, scoreText: "40", setScores: [6, 4, 3] },
    { name: "Gauff", pct: "42%", color: colors.red, initial: "G", abbr: "GAU", flag: "us", scoreText: "30", setScores: [4, 6, 2] },
  ],
  vol: "$910K Vol.",
  date: "Jun 8",
  time: "4:00 PM",
  markets: 8,
};

// Curated World Cup section: three live FIFA World Cup matches.
export const WORLD_CUP: Match[] = [SOCCER, SOCCER_BRA_ARG, SOCCER_POR_NED];

export const POLITICS_MARKET: PoliticsMarket = {
  category: "SPACE",
  date: "Ends Jan 20, 2029",
  question: "Will the U.S. confirm that aliens exist?",
  outcomes: [
    { label: "Before Jan 20, 2029", pct: "26%", multiplier: "3.52x", color: colors.teal },
    { label: "Before 2028", pct: "21%", multiplier: "4.51x", color: colors.violet },
  ],
  vol: "$25,547,348 vol",
  markets: 5,
  avatar: require("@/assets/figmaAssets/sim-alien-avatar.png"),
};

export const CRYPTO_MARKET: CryptoMarket = {
  category: "BTC",
  date: "Ends December 31, 2026",
  question: "When will Bitcoin hit $150K",
  outcomes: [
    { label: "Before January 2027", pct: "7%", multiplier: "13.4x", color: colors.bitcoin },
    { label: "Before September 2026", pct: "1%", multiplier: "31.2x", color: colors.sky },
  ],
  vol: "$34.8M Vol.",
  markets: 4,
  avatar: require("@/assets/figmaAssets/btc-logo-orange.png"),
};

export const ETH_MARKET: CryptoMarket = {
  category: "ETH",
  date: "Ends December 31, 2026",
  question: "Will Ethereum hit $10K in 2026?",
  outcomes: [
    { label: "Yes", pct: "34%", multiplier: "2.94x", color: colors.green },
    { label: "No", pct: "66%", multiplier: "1.52x", color: colors.accent },
  ],
  vol: "$18.2M Vol.",
  markets: 6,
  avatar: require("@/assets/figmaAssets/icon-3d-crypto.png"),
};

export const FED_MARKET: PoliticsMarket = {
  category: "FED",
  date: "Ends Sep 18, 2026",
  question: "Will the Fed cut rates in September?",
  outcomes: [
    { label: "25 bps cut", pct: "61%", multiplier: "1.64x", color: colors.green },
    { label: "No change", pct: "33%", multiplier: "3.03x", color: colors.accent },
  ],
  vol: "$12.4M Vol.",
  markets: 3,
  avatar: require("@/assets/figmaAssets/fed-building.png"),
};

export const NBA: Match = {
  league: "NBA",
  leagueColor: "#c8102e",
  sport: "basketball",
  live: { mins: "Q3 4:21" },
  teams: [
    { name: "Lakers", pct: "58%", color: "#552583", initial: "L", abbr: "LAL", logo: teamLogo("nba", "lal"), hasBall: true, score: 108 },
    { name: "Celtics", pct: "42%", color: "#007a33", initial: "C", abbr: "BOS", logo: teamLogo("nba", "bos"), score: 74 },
  ],
  vol: "$3.2M Vol.",
  date: "Jun 9",
  time: "8:00 PM",
  markets: 8,
};

export const SPURS_KNICKS: Match = {
  league: "NBA",
  leagueColor: "#c8102e",
  sport: "basketball",
  live: { mins: "Q4 2:15" },
  teams: [
    { name: "Spurs", pct: "94%", color: "#8a8d8f", initial: "S", abbr: "SAS", logo: teamLogo("nba", "sa"), hasBall: true, score: 118 },
    { name: "Knicks", pct: "6%", color: "#006bb6", initial: "K", abbr: "NYK", logo: teamLogo("nba", "ny"), score: 105 },
  ],
  vol: "$2.4M Vol.",
  date: "Jun 11",
  time: "9:00 PM",
  markets: 8,
};

export const NHL: Match = {
  league: "NHL",
  leagueColor: "#111111",
  sport: "hockey",
  live: { mins: "P2 11:38" },
  teams: [
    { name: "Oilers", pct: "52%", color: "#ff4c00", initial: "O", abbr: "EDM", logo: teamLogo("nhl", "edm"), hasBall: true, score: 2 },
    { name: "Panthers", pct: "48%", color: "#c8102e", initial: "P", abbr: "FLA", logo: teamLogo("nhl", "fla"), score: 2 },
  ],
  vol: "$1.1M Vol.",
  date: "Jun 8",
  time: "7:30 PM",
  markets: 7,
};

// Live American football match — the default possession scope is "americanFootball",
// so this is the one card that surfaces the live ball-possession cue in the feed.
export const NFL: Match = {
  league: "NFL",
  leagueColor: "#013369",
  sport: "americanFootball",
  live: { mins: "Q3 7:42" },
  teams: [
    { name: "Chiefs", pct: "61%", color: "#e31837", initial: "K", abbr: "KC", logo: teamLogo("nfl", "kc"), hasBall: true, score: 21 },
    { name: "Bills", pct: "39%", color: "#00338d", initial: "B", abbr: "BUF", logo: teamLogo("nfl", "buf"), score: 17 },
  ],
  vol: "$2.7M Vol.",
  date: "Jun 12",
  time: "4:25 PM",
  markets: 9,
};

// Kalshi-mode home sections (NFL + NCAAF): the limited US feed shows only
// these game cards — no live carousel, category tiles, or trending.
export const NFL_GB_PIT: Match = {
  league: "NFL",
  leagueColor: "#013369",
  sport: "americanFootball",
  live: { mins: "Q4 12:22" },
  teams: [
    { name: "Packers", pct: "53%", color: "#175e33", initial: "P", abbr: "GB", logo: teamLogo("nfl", "gb"), hasBall: true, score: 7 },
    { name: "Steelers", pct: "47%", color: "#ffb612", initial: "S", abbr: "PIT", logo: teamLogo("nfl", "pit"), score: 0 },
  ],
  vol: "$1.9M Vol.",
  date: "Jun 12",
  time: "1:00 PM",
  markets: 2,
};

export const NFL_CAR_ARI: Match = {
  league: "NFL",
  leagueColor: "#013369",
  sport: "americanFootball",
  live: { mins: "Q4 12:22" },
  teams: [
    { name: "Panthers", pct: "53%", color: "#0085ca", initial: "P", abbr: "CAR", logo: teamLogo("nfl", "car"), hasBall: true, score: 21 },
    { name: "Cardinals", pct: "47%", color: "#97233f", initial: "C", abbr: "ARI", logo: teamLogo("nfl", "ari"), score: 0 },
  ],
  vol: "$1.2M Vol.",
  date: "Jun 12",
  time: "4:25 PM",
  markets: 2,
};

export const NCAAF_UGA_BAMA: Match = {
  league: "NCAAF",
  leagueColor: "#9e1b32",
  sport: "americanFootball",
  live: { mins: "Q2 4:18" },
  teams: [
    { name: "Georgia", pct: "56%", color: "#ba0c2f", initial: "G", abbr: "UGA", logo: teamLogo("ncaa", "61"), hasBall: true, score: 14 },
    { name: "Alabama", pct: "44%", color: "#9e1b32", initial: "A", abbr: "ALA", logo: teamLogo("ncaa", "333"), score: 10 },
  ],
  vol: "$860K Vol.",
  date: "Jun 13",
  time: "3:30 PM",
  markets: 2,
};

export const NCAAF_MICH_OSU: Match = {
  league: "NCAAF",
  leagueColor: "#00274c",
  sport: "americanFootball",
  teams: [
    { name: "Michigan", pct: "48%", color: "#00274c", initial: "M", abbr: "MICH", logo: teamLogo("ncaa", "130") },
    { name: "Ohio State", pct: "52%", color: "#bb0000", initial: "O", abbr: "OSU", logo: teamLogo("ncaa", "194") },
  ],
  vol: "$1.1M Vol.",
  date: "Sat",
  time: "12:00 PM",
  markets: 2,
};

// Live golf matchup (final-round head-to-head). Golf has no head-to-head
// VersusCard variant, so like tennis it always renders as a stacked StandardCard.
// Scores are to-par strings (scoreText, no numeric `score`) so useLiveScores
// leaves the scoreline frozen rather than ticking it like a team-sport score.
export const GOLF: Match = {
  league: "LIV Golf",
  leagueColor: "#0b6b3a",
  sport: "golf",
  live: { mins: "Round 3" },
  teams: [
    { name: "T. Hatton", pct: "34%", color: colors.green, initial: "H", abbr: "HAT", flag: "gb", scoreText: "-6", thru: "0", photo: PHOTO.hatton.src, photoAspect: PHOTO.hatton.aspect },
    { name: "J. Rahm", pct: "11%", color: colors.sky, initial: "R", abbr: "RAH", flag: "es", scoreText: "-1", thru: "1", photo: PHOTO.rahm.src, photoAspect: PHOTO.rahm.aspect },
  ],
  vol: "$592K Vol.",
  date: "Jul 19",
  time: "8:00 AM",
  markets: 58,
};

// Live Formula 1 race (running positions). Like golf, no VersusCard variant —
// renders as a stacked StandardCard. Positions are scoreText strings ("P1"/"P2")
// so the scoreline stays frozen rather than incrementing.
export const F1_RACE: Match = {
  league: "Formula 1",
  leagueColor: "#e10600",
  sport: "racing",
  live: { mins: "Lap 52 / 78" },
  teams: [
    { name: "Verstappen", pct: "66%", color: colors.green, initial: "V", abbr: "VER", flag: "nl", hasBall: true, scoreText: "P1", gap: "+4.2s", photo: PHOTO.verstappen.src, photoAspect: PHOTO.verstappen.aspect },
    { name: "Norris", pct: "34%", color: colors.red, initial: "N", abbr: "NOR", flag: "gb", scoreText: "P2", gap: "-4.2s", photo: PHOTO.norris.src, photoAspect: PHOTO.norris.aspect },
  ],
  vol: "$2.1M Vol.",
  date: "May 25",
  time: "9:00 AM",
  markets: 7,
};

// Extra non-versus (outcome) markets folded into Trending so there are enough
// non-game cards to keep two match cards from ever sitting back-to-back.
export const ELECTION_MARKET: PoliticsMarket = {
  category: "Election",
  date: "Ends Nov 7, 2028",
  question: "Who wins the 2028 U.S. presidential election?",
  outcomes: [
    { label: "Democrat", pct: "47%", multiplier: "2.11x", color: colors.green, avatar: swatch(colors.green) },
    { label: "Republican", pct: "49%", multiplier: "2.04x", color: colors.accent, avatar: swatch(colors.accent) },
  ],
  vol: "$48.2M Vol.",
  markets: 7,
  avatar: flag("us"),
};

// 3-outcome politics market (more rows than the usual binary markets).
export const SENATE_MARKET: PoliticsMarket = {
  category: "Politics",
  date: "Ends Nov 3, 2026",
  question: "Who controls the Senate after the 2026 midterms?",
  outcomes: [
    { label: "Republicans", pct: "56%", multiplier: "1.79x", color: colors.green, avatar: swatch(colors.green) },
    { label: "Democrats", pct: "41%", multiplier: "2.44x", color: colors.accent, avatar: swatch(colors.accent) },
    { label: "50-50 split", pct: "3%", multiplier: "33.3x", color: colors.red },
  ],
  vol: "$21.7M Vol.",
  markets: 4,
  avatar: flag("us"),
};

export const F1_MARKET: PoliticsMarket = {
  category: "F1",
  date: "Ends Dec 6, 2026",
  question: "Who wins the F1 Drivers' Championship?",
  outcomes: [
    { label: "Verstappen", pct: "54%", multiplier: "1.85x", color: colors.green, avatar: flagAvatar("nl") },
    { label: "Norris", pct: "31%", multiplier: "3.22x", color: colors.accent, avatar: flagAvatar("gb") },
  ],
  vol: "$6.7M Vol.",
  markets: 9,
  avatar: require("@/assets/figmaAssets/icon-3d-f1.png"),
};

export const MLB_MARKET: PoliticsMarket = {
  category: "MLB",
  date: "Ends Oct 28, 2026",
  question: "Who wins the MLB World Series?",
  outcomes: [
    { label: "Dodgers", pct: "38%", multiplier: "2.63x", color: colors.green, abbr: "LAD", avatar: espnLogo("mlb", "lad") },
    { label: "Yankees", pct: "24%", multiplier: "4.16x", color: colors.accent, abbr: "NYY", avatar: { type: "image", source: { uri: YANKEES_LOGO }, contain: true } },
  ],
  vol: "$5.3M Vol.",
  markets: 12,
  // Use the league mark for the market header; the team outcome rows use their
  // individual logo sources when the Team logos setting is selected.
  avatar: require("@/assets/figmaAssets/mlb-logo.png"),
  avatarBg: "#fff",
  avatarContain: true,
};

// --- Sports section ---------------------------------------------------------
export const NFL_MARKET: PoliticsMarket = {
  category: "NFL",
  date: "Ends Feb 8, 2027",
  question: "Who wins Super Bowl LXI?",
  outcomes: [
    { label: "Chiefs", pct: "21%", multiplier: "4.76x", color: colors.red, abbr: "KC", avatar: espnLogo("nfl", "kc") },
    { label: "49ers", pct: "18%", multiplier: "5.55x", color: colors.amber, abbr: "SF", avatar: espnLogo("nfl", "sf") },
  ],
  vol: "$14.7M Vol.",
  markets: 14,
  avatar: require("@/assets/figmaAssets/nfl-superbowl.png"),
};

export const UCL_MARKET: PoliticsMarket = {
  category: "UCL",
  date: "Ends May 30, 2026",
  question: "Who wins the Champions League?",
  outcomes: [
    { label: "Real Madrid", pct: "27%", multiplier: "3.70x", color: colors.slate, abbr: "RMA", avatar: espnLogo("soccer", "86") },
    { label: "Man City", pct: "23%", multiplier: "4.34x", color: colors.sky, abbr: "MCI", avatar: espnLogo("soccer", "382") },
  ],
  vol: "$10.1M Vol.",
  markets: 16,
  avatar: require("@/assets/figmaAssets/ucl-logo.png"),
};

// --- Crypto section ---------------------------------------------------------
export const SOL_MARKET: CryptoMarket = {
  category: "SOL",
  date: "Ends December 31, 2026",
  question: "Will Solana hit $500 in 2026?",
  outcomes: [
    { label: "Yes", pct: "29%", multiplier: "3.44x", color: colors.solPurple },
    { label: "No", pct: "71%", multiplier: "1.40x", color: colors.solTeal },
  ],
  vol: "$9.6M Vol.",
  markets: 5,
  avatar: require("@/assets/figmaAssets/icon-solana-logo.png"),
  avatarBg: "#000",
  avatarScale: 1.45,
};

export const ETF_MARKET: CryptoMarket = {
  category: "ETF",
  date: "Ends Dec 31, 2026",
  question: "Will a spot XRP ETF be approved in 2026?",
  outcomes: [
    { label: "Yes", pct: "62%", multiplier: "1.61x", color: colors.xrpCyan },
    { label: "No", pct: "38%", multiplier: "2.63x", color: colors.indigo },
  ],
  vol: "$7.1M Vol.",
  markets: 4,
  avatar: require("@/assets/figmaAssets/xrp-logo.png"),
};

export const BTC_DOM_MARKET: CryptoMarket = {
  category: "BTC",
  date: "Ends Jul 1, 2026",
  question: "Bitcoin dominance above 60% by July?",
  outcomes: [
    { label: "Yes", pct: "44%", multiplier: "2.27x", color: colors.bitcoin },
    { label: "No", pct: "56%", multiplier: "1.78x", color: colors.sky },
  ],
  vol: "$4.3M Vol.",
  markets: 3,
  avatar: require("@/assets/figmaAssets/btc-logo-orange.png"),
};

// --- Politics section -------------------------------------------------------
export const SHUTDOWN_MARKET: PoliticsMarket = {
  category: "Politics",
  date: "Ends Dec 31, 2026",
  question: "Will the U.S. government shut down in 2026?",
  outcomes: [
    { label: "Yes", pct: "43%", multiplier: "2.32x", color: colors.amber },
    { label: "No", pct: "57%", multiplier: "1.75x", color: colors.slate },
  ],
  vol: "$8.9M Vol.",
  markets: 4,
  avatar: require("@/assets/figmaAssets/fed-building.png"),
};

// Polymarket: Digital Asset Market Clarity Act of 2025 (H.R.3633). Snapshot
// Aug 24, 2026 — Yes 18¢ / No 82¢, $9.81M volume, resolves Dec 31, 2026.
export const CLARITY_ACT_MARKET: PoliticsMarket = {
  category: "Politics",
  date: "Ends Dec 31, 2026",
  question: "Clarity Act (H.R.3633) signed into law in 2026?",
  outcomes: [
    { label: "Yes", pct: "18%", multiplier: "5.56x", color: colors.green },
    { label: "No", pct: "82%", multiplier: "1.22x", color: colors.red },
  ],
  vol: "$9.81M Vol.",
  markets: 1,
  avatar: require("@/assets/figmaAssets/fed-building.png"),
};

export const UK_PM_MARKET: PoliticsMarket = {
  category: "UK",
  date: "Ends next election",
  question: "Who will be the next UK Prime Minister?",
  outcomes: [
    { label: "Starmer", pct: "47%", multiplier: "2.12x", color: colors.red },
    { label: "Farage", pct: "32%", multiplier: "3.12x", color: colors.cyan },
    { label: "Badenoch", pct: "15%", multiplier: "6.66x", color: colors.accent },
  ],
  vol: "$11.2M Vol.",
  markets: 6,
  avatar: require("@/assets/figmaAssets/uk-flag.png"),
};

export const NBA_TITLE_MARKET: PoliticsMarket = {
  category: "NBA",
  date: "Ends Jun 20, 2026",
  question: "Who wins the NBA Championship?",
  outcomes: [
    { label: "Celtics", pct: "31%", multiplier: "3.22x", color: colors.emerald, abbr: "BOS", avatar: espnLogo("nba", "bos") },
    { label: "Thunder", pct: "26%", multiplier: "3.84x", color: colors.amber, abbr: "OKC", avatar: espnLogo("nba", "okc") },
  ],
  vol: "$13.5M Vol.",
  markets: 11,
  avatar: require("@/assets/figmaAssets/icon-3d-sports.png"),
};

export const DOGE_MARKET: CryptoMarket = {
  category: "DOGE",
  date: "Ends December 31, 2026",
  question: "Will Dogecoin hit $1 in 2026?",
  outcomes: [
    { label: "Yes", pct: "18%", multiplier: "5.55x", color: colors.dogeGold },
    { label: "No", pct: "82%", multiplier: "1.21x", color: colors.rose },
  ],
  vol: "$6.2M Vol.",
  markets: 4,
  avatar: require("@/assets/figmaAssets/doge-logo.png"),
  avatarBg: "#000",
  avatarScale: 1.45,
};

export const MCAP_MARKET: CryptoMarket = {
  category: "CRYPTO",
  date: "Ends December 31, 2026",
  question: "Will total crypto market cap top $5T in 2026?",
  outcomes: [
    { label: "Yes", pct: "53%", multiplier: "1.88x", color: colors.violet },
    { label: "No", pct: "47%", multiplier: "2.12x", color: colors.emerald },
  ],
  vol: "$8.7M Vol.",
  markets: 5,
  avatar: require("@/assets/figmaAssets/icon-3d-altcoins.png"),
};

export const APPROVAL_MARKET: PoliticsMarket = {
  category: "Politics",
  date: "Ends Dec 31, 2026",
  question: "Will the President's approval top 50% in 2026?",
  outcomes: [
    { label: "Yes", pct: "34%", multiplier: "2.94x", color: colors.emerald },
    { label: "No", pct: "66%", multiplier: "1.51x", color: colors.rose },
  ],
  vol: "$7.8M Vol.",
  markets: 3,
  avatar: flag("us"),
};

export const HOUSE_MARKET: PoliticsMarket = {
  category: "Politics",
  date: "Ends Jan 3, 2027",
  question: "Which party controls the House after 2026?",
  outcomes: [
    { label: "Republicans", pct: "52%", multiplier: "1.92x", color: colors.red, avatar: swatch(colors.red) },
    { label: "Democrats", pct: "48%", multiplier: "2.08x", color: colors.accent, avatar: swatch(colors.accent) },
  ],
  vol: "$19.4M Vol.",
  markets: 5,
  avatar: flag("us"),
};

export const CANADA_PM_MARKET: PoliticsMarket = {
  category: "Canada",
  date: "Ends next election",
  question: "Who will be Canada's next Prime Minister?",
  outcomes: [
    { label: "Carney", pct: "44%", multiplier: "2.27x", color: colors.red },
    { label: "Poilievre", pct: "46%", multiplier: "2.17x", color: colors.accent },
  ],
  vol: "$5.9M Vol.",
  markets: 4,
  avatar: flag("ca"),
};

// Polymarket event: who-will-trump-pick-as-the-next-press-secretary-20260812210729848
// Odds snapshot Aug 20, 2026. Each named outcome is a Yes market; leftover
// probability is rolled into Other so the stacked card sums to 100%.
const pmHeadshot = (file: string): OutcomeAvatar => ({
  type: "image",
  source: { uri: `https://polymarket-upload.s3.us-east-2.amazonaws.com/${file}` },
});

const PRESS_SEC_SHARED_RULES = [
  "A person being announced as an acting or interim Press Secretary does not count.",
  "Once a qualifying announcement has occurred, later withdrawals or replacement announcements do not change resolution.",
  "The primary resolution source is official information from the White House and Donald Trump. A consensus of credible reporting may also be used.",
];

function pressSecPersonRules(name: string): string[] {
  return [
    `This market resolves to Yes if the White House announces ${name} as Press Secretary, replacing Karoline Leavitt, by December 31, 2026, 11:59 PM ET.`,
    ...PRESS_SEC_SHARED_RULES,
    `If anyone other than ${name} is named, or if no replacement is chosen / the role is abolished by that deadline, this market resolves to No.`,
  ];
}

const PRESS_SEC_OTHER_RULES = [
  'This market resolves to Other if nobody is chosen to replace Karoline Leavitt, or the role is abolished, by December 31, 2026, 11:59 PM ET.',
  "It also resolves to Other if the announced Press Secretary is not one of the named candidates in this event.",
  ...PRESS_SEC_SHARED_RULES,
];

export const PRESS_SECRETARY_MARKET: PoliticsMarket = {
  category: "Politics",
  date: "Ends Dec 31, 2026",
  question: "Who will Trump pick as the next Press Secretary?",
  outcomes: [
    { label: "Scott Jennings", pct: "35%", multiplier: "2.86x", color: colors.accent, avatar: pmHeadshot("press-sec-scott-jennings-c7068cd81d.jpg"), rules: pressSecPersonRules("Scott Jennings") },
    { label: "Anna Kelly", pct: "24%", multiplier: "4.17x", color: colors.green, avatar: pmHeadshot("press-sec-anna-kelly-aa4510b2d7.jpg"), rules: pressSecPersonRules("Anna Kelly") },
    { label: "Alina Habba", pct: "8%", multiplier: "12.5x", color: colors.violet, avatar: pmHeadshot("will-alina-habba-be-the-next-white-house-press-secretary-uwzhw-uwMMbh.jpg"), rules: pressSecPersonRules("Alina Habba") },
    { label: "Katie Zacharia", pct: "7%", multiplier: "14.3x", color: colors.amber, avatar: pmHeadshot("will-katie-zacharia-be-the-next-white-house-press-secretary-2uK-bdeNfvK3.png"), rules: pressSecPersonRules("Katie Zacharia") },
    { label: "Natalie Harp", pct: "5%", multiplier: "20.0x", color: colors.sky, avatar: pmHeadshot("will-natalie-harp-be-the-next-white-house-press-secretary-v7cdQe2lsI62.jpg"), rules: pressSecPersonRules("Natalie Harp") },
    { label: "Lauren Bis", pct: "5%", multiplier: "20.0x", color: colors.rose, avatar: pmHeadshot("press-sec-lauren-bis-2abe7bbc91.jpg"), rules: pressSecPersonRules("Lauren Bis") },
    { label: "Margo Martin", pct: "4%", multiplier: "25.0x", color: colors.teal, avatar: pmHeadshot("will-margo-martin-be-the-next-white-house-press-secretary-20260812210720648-JzOHi2LDJY1X.jpg"), rules: pressSecPersonRules("Margo Martin") },
    { label: "Other", pct: "12%", multiplier: "8.33x", color: colors.slate, avatar: swatch(colors.slate), rules: PRESS_SEC_OTHER_RULES },
  ],
  vol: "$82K Vol.",
  markets: 20,
  avatar: {
    uri: "https://polymarket-upload.s3.us-east-2.amazonaws.com/who-will-trump-pick-for-the-next-press-secretary-20260812210720647-YVfqBRrL8DnB.jpg",
  },
};

// Compact feed card: two leaders + Other so the card shows three outcomes.
// Detail uses PRESS_SECRETARY_MARKET (exported first so findPredictionMarket
// resolves to the full list).
export const PRESS_SECRETARY_FEED: PoliticsMarket = {
  ...PRESS_SECRETARY_MARKET,
  outcomes: [
    PRESS_SECRETARY_MARKET.outcomes[0],
    PRESS_SECRETARY_MARKET.outcomes[1],
    { label: "Other", pct: "41%", multiplier: "2.44x", color: colors.slate, avatar: swatch(colors.slate), rules: PRESS_SEC_OTHER_RULES },
  ],
};

// Polymarket event: where-will-julian-alvarez-transfer-20260612230221012
// Nested Yes/No markets (snapshot Aug 24, 2026). Placeholder "Team A–J" legs
// with $0 volume are omitted. Yes prices are independent — they do not sum
// to 100%.
const ALVAREZ_SHARED_RULES = [
  "An official transfer announcement prior to the market's close date immediately resolves this market.",
  "The primary resolution sources are official announcements from Atletico Madrid and/or the acquiring team. A consensus of credible media reporting may also be used.",
];

function alvarezStayRules(): string[] {
  return [
    "This market resolves to Yes if Julian Alvarez is still contracted to Atletico Madrid and has not officially joined a new team by September 1, 2026, 11:59 PM ET.",
    ...ALVAREZ_SHARED_RULES,
    "If he officially joins any other club by that deadline, this market resolves to No.",
  ];
}

function alvarezJoinRules(club: string): string[] {
  return [
    `This market resolves to Yes if Julian Alvarez officially joins ${club} by September 1, 2026, 11:59 PM ET.`,
    ...ALVAREZ_SHARED_RULES,
    "If he stays at Atletico Madrid, joins a different club, is released, or retires by that deadline, this market resolves to No.",
  ];
}

const soccerCrest = (id: string): OutcomeAvatar => espnLogo("soccer", id);

export const JULIAN_ALVAREZ_MARKET: PoliticsMarket = {
  category: "Soccer",
  date: "Ends Sep 1, 2026",
  question: "Julian Alvarez: Next Club",
  outcomes: [
    { label: "Atletico Madrid", pct: "58%", multiplier: "1.72x", color: "#ce3524", avatar: soccerCrest("1068"), vol: "$134K Vol.", abbr: "ATM", rules: alvarezStayRules() },
    { label: "Arsenal", pct: "29%", multiplier: "3.45x", color: "#ef0107", avatar: soccerCrest("359"), vol: "$71K Vol.", abbr: "ARS", rules: alvarezJoinRules("Arsenal") },
    { label: "Barcelona", pct: "13%", multiplier: "7.69x", color: "#a50044", avatar: soccerCrest("83"), vol: "$96K Vol.", abbr: "BAR", rules: alvarezJoinRules("Barcelona") },
    { label: "Chelsea", pct: "1%", multiplier: "133x", color: "#034694", avatar: soccerCrest("363"), vol: "$23K Vol.", abbr: "CHE", rules: alvarezJoinRules("Chelsea") },
    { label: "Real Madrid", pct: "1%", multiplier: "200x", color: "#f5c518", avatar: soccerCrest("86"), vol: "$16K Vol.", abbr: "RMA", rules: alvarezJoinRules("Real Madrid") },
    { label: "Manchester City", pct: "1%", multiplier: "200x", color: "#6cabdd", avatar: soccerCrest("382"), vol: "$13K Vol.", abbr: "MCI", rules: alvarezJoinRules("Manchester City") },
  ],
  vol: "$353K Vol.",
  markets: 6,
  avatar: {
    uri: "https://polymarket-upload.s3.us-east-2.amazonaws.com/where-will-julian-alvarez-transfer-20260612230221012-Pm_vdvir4u2g.jpg",
  },
};
