// Sample data for the UXR COMBO flow: the /combination page's
// category chips + market-type tabs + game cards, and the home feed's
// Combinations preview cards. Prices are static cents; the ticket math
// multiplies implied probabilities (cents/100) for the combined payout.
import type { ImageSourcePropType } from "react-native";
import { soccerDrawCents } from "@/lib/sim/soccerMoneyline";
import type { Match } from "@/lib/sim/types";
import { comboPreviewSport } from "./comboRelatedPreviews";
import { UXR_ICONS } from "./uxrIcons";

export type ComboTeam = { name: string; abbr: string; color: string; score: number; logo?: string; photo?: ImageSourcePropType };

export function comboTeamMark(team: ComboTeam): ImageSourcePropType | undefined {
  return team.photo ?? (team.logo ? { uri: team.logo } : undefined);
}

const nflLogo = (id: string) => `https://a.espncdn.com/i/teamlogos/nfl/500/${id}.png`;
const ncaaLogo = (id: string) => `https://a.espncdn.com/i/teamlogos/ncaa/500/${id}.png`;
const nbaLogo = (id: string) => `https://a.espncdn.com/i/teamlogos/nba/500/${id}.png`;
const mlbLogo = (id: string) => `https://a.espncdn.com/i/teamlogos/mlb/500/${id}.png`;
const flagUri = (cc: string) => `https://flagcdn.com/w80/${cc}.png`;

const PHOTO_ALCARAZ = require("@/assets/figmaAssets/athlete-alcaraz.jpg");
const PHOTO_SINNER = require("@/assets/figmaAssets/athlete-sinner.jpg");
const PHOTO_HATTON = require("@/assets/figmaAssets/athlete-hatton.jpg");
const PHOTO_NORRIS = require("@/assets/figmaAssets/athlete-norris.jpg");
const face = (n: number, gender: "men" | "women" = "men") =>
  ({ uri: `https://randomuser.me/api/portraits/${gender}/${n}.jpg` }) as const;

/** Both sides of a matchup — switcher must resolve the opponent’s photo/logo, not initials. */
export const COMBO_OUTCOME_MARKS: Record<string, ImageSourcePropType> = {
  Bogdan: PHOTO_HATTON,
  Buzukja: face(33),
  "Vlasto Cepo": PHOTO_NORRIS,
  Urbina: face(28),
  "Uros Medic": face(32),
  Rodriguez: face(29),
  Hill: face(45),
  Oliveira: face(36),
  Adesanya: face(12),
  "Du Plessis": face(14),
  "Red Sox": { uri: mlbLogo("bos") },
  Cubs: { uri: mlbLogo("chc") },
  Mets: { uri: mlbLogo("nym") },
  Rangers: { uri: mlbLogo("tex") },
  Giants: { uri: mlbLogo("sf") },
  Steelers: { uri: nflLogo("pit") },
  Cardinals: { uri: nflLogo("ari") },
  Ravens: { uri: nflLogo("bal") },
  Cowboys: { uri: nflLogo("dal") },
  Vikings: { uri: nflLogo("min") },
  Georgia: { uri: ncaaLogo("61") },
  Alabama: { uri: ncaaLogo("333") },
  Michigan: { uri: ncaaLogo("130") },
  "Ohio State": { uri: ncaaLogo("194") },
  Texas: { uri: ncaaLogo("251") },
  Oklahoma: { uri: ncaaLogo("201") },
  Draw: require("@/assets/images/draw-mark.svg"),
};

export type ComboGame = {
  id: string;
  league: string; // footer tag ("NFL")
  clock: string; // live clock ("Q4 · 12:22")
  vol: string; // "$X Vol"
  more: number; // "+2 more"
  teams: [ComboTeam, ComboTeam];
  sport?: string;
  homeCents?: number;
  awayCents?: number;
  /** Soccer league moneyline Draw (cents). Omitted for knockout tournaments. */
  drawCents?: number;
};

export type ComboCategory = {
  slug: string;
  label: string;
  icon?: ImageSourcePropType; // require()'d 3D icon
  emoji?: string; // fallback when no icon asset exists yet
  games: ComboGame[];
};

export const MARKET_TABS = ["Moneyline", "Spread", "Total", "RFI", "HRs", "K's"];

export const COMBO_CATEGORIES: ComboCategory[] = [
  {
    slug: "football",
    label: "Pro Football",
    icon: UXR_ICONS.nfl,
    games: [
      {
        id: "gb-pit",
        league: "NFL",
        clock: "Q4 · 12:22",
        vol: "$1.8M Vol",
        more: 2,
        teams: [
          { name: "Packers", abbr: "GB", color: "#175e33", score: 7, logo: nflLogo("gb") },
          { name: "Steelers", abbr: "PIT", color: "#ffb612", score: 0, logo: nflLogo("pit") },
        ],
      },
      {
        id: "car-ari",
        league: "NFL",
        clock: "Q4 · 12:22",
        vol: "$1.2M Vol",
        more: 2,
        teams: [
          { name: "Panthers", abbr: "CAR", color: "#0085ca", score: 21, logo: nflLogo("car") },
          { name: "Cardinals", abbr: "ARI", color: "#97233f", score: 0, logo: nflLogo("ari") },
        ],
      },
    ],
  },
  {
    slug: "nfl",
    label: "NFL",
    icon: UXR_ICONS.nfl,
    games: [
      {
        id: "gb-pit",
        league: "NFL",
        clock: "Q4 \u00b7 12:22",
        vol: "$1.8M Vol",
        more: 2,
        teams: [
          { name: "Packers", abbr: "GB", color: "#175e33", score: 7, logo: nflLogo("gb") },
          { name: "Steelers", abbr: "PIT", color: "#ffb612", score: 0, logo: nflLogo("pit") },
        ],
      },
      {
        id: "car-ari",
        league: "NFL",
        clock: "Q4 \u00b7 12:22",
        vol: "$1.2M Vol",
        more: 2,
        teams: [
          { name: "Panthers", abbr: "CAR", color: "#0085ca", score: 21, logo: nflLogo("car") },
          { name: "Cardinals", abbr: "ARI", color: "#97233f", score: 0, logo: nflLogo("ari") },
        ],
      },
    ],
  },
  {
    slug: "ncaaf",
    label: "NCAAF",
    icon: UXR_ICONS.nfl,
    games: [
      {
        id: "uga-ala",
        league: "NCAAF",
        clock: "Q2 · 4:18",
        vol: "$860K Vol",
        more: 2,
        teams: [
          { name: "Georgia", abbr: "UGA", color: "#ba0c2f", score: 14, logo: ncaaLogo("61") },
          { name: "Alabama", abbr: "ALA", color: "#9e1b32", score: 10, logo: ncaaLogo("333") },
        ],
      },
      {
        id: "mich-osu",
        league: "NCAAF",
        clock: "Sat · 12:00 PM",
        vol: "$1.1M Vol",
        more: 2,
        teams: [
          { name: "Michigan", abbr: "MICH", color: "#00274c", score: 0, logo: ncaaLogo("130") },
          { name: "Ohio State", abbr: "OSU", color: "#bb0000", score: 0, logo: ncaaLogo("194") },
        ],
      },
      {
        id: "tex-ou",
        league: "NCAAF",
        clock: "Sat · 3:30 PM",
        vol: "$720K Vol",
        more: 2,
        teams: [
          { name: "Texas", abbr: "TEX", color: "#bf5700", score: 0, logo: ncaaLogo("251") },
          { name: "Oklahoma", abbr: "OU", color: "#841617", score: 0, logo: ncaaLogo("201") },
        ],
      },
    ],
  },
  {
    slug: "basketball",
    label: "Pro Basketball",
    icon: UXR_ICONS.basketball,
    games: [
      {
        id: "mia-okc",
        league: "NBA",
        clock: "Q3 · 4:18",
        vol: "$980K Vol",
        more: 3,
        teams: [
          { name: "Heat", abbr: "MIA", color: "#98002e", score: 88 },
          { name: "Thunder", abbr: "OKC", color: "#007ac1", score: 92 },
        ],
      },
      {
        id: "bos-den",
        league: "NBA",
        clock: "Q1 · 9:41",
        vol: "$640K Vol",
        more: 3,
        teams: [
          { name: "Celtics", abbr: "BOS", color: "#007a33", score: 12 },
          { name: "Nuggets", abbr: "DEN", color: "#fec524", score: 15 },
        ],
      },
    ],
  },
  {
    slug: "tennis",
    label: "Tennis",
    icon: UXR_ICONS.tennis,
    games: [
      {
        id: "nav-cob",
        league: "ATP",
        clock: "SET 5",
        vol: "$410K Vol",
        more: 1,
        teams: [
          { name: "M. Navone", abbr: "M.NAV", color: "#74acdf", score: 2 },
          { name: "F. Cobolli", abbr: "F.COB", color: "#65a30d", score: 2 },
        ],
      },
    ],
  },
  {
    slug: "mma",
    label: "MMA",
    emoji: "\u{1F94A}",
    games: [
      {
        id: "bog-buz",
        league: "MMA",
        clock: "RD 2 · 3:05",
        vol: "$520K Vol",
        more: 1,
        teams: [
          { name: "Bogdan", abbr: "BOG", color: "#e11d48", score: 0, photo: PHOTO_HATTON },
          { name: "Buzukja", abbr: "BUZ", color: "#2563eb", score: 0, photo: face(33) },
        ],
      },
    ],
  },
];

// Deterministic pseudo-prices per game so the two sides sum to 100¢.
export function comboPrices(game: ComboGame): [number, number] {
  if (game.homeCents != null && game.awayCents != null) {
    return [game.homeCents, game.awayCents];
  }
  let h = 0;
  for (const c of game.id) h = (h * 31 + c.charCodeAt(0)) % 997;
  const a = 38 + (h % 25); // 38..62
  return [a, 100 - a];
}

export function comboMoneyline(game: ComboGame): { home: number; away: number; draw?: number } {
  const [home, away] = comboPrices(game);
  return game.drawCents != null ? { home, away, draw: game.drawCents } : { home, away };
}

export function matchToComboGame(m: Match, i = 0): ComboGame {
  const a = m.teams[0];
  const b = m.teams[1];
  const homeCents = parseInt(a.pct, 10);
  const awayCents = parseInt(b.pct, 10);
  const drawCents =
    soccerDrawCents(m) ??
    (m.sport === "cricket" && m.draw ? parseInt(m.draw.pct, 10) || undefined : undefined);
  return {
    id: `${m.league}-${a.abbr ?? a.initial}-${b.abbr ?? b.initial}-${i}`,
    league: m.league,
    clock: m.live?.mins ?? m.time ?? m.date,
    vol: m.vol,
    more: Math.max(0, m.markets - 1),
    sport: m.sport,
    homeCents: Number.isFinite(homeCents) ? homeCents : undefined,
    awayCents: Number.isFinite(awayCents) ? awayCents : undefined,
    drawCents,
    teams: [
      { name: a.name, abbr: a.abbr ?? a.initial, color: a.color, score: a.score ?? 0, logo: a.logo, photo: a.photo },
      { name: b.name, abbr: b.abbr ?? b.initial, color: b.color, score: b.score ?? 0, logo: b.logo, photo: b.photo },
    ],
  };
}

// Convert a home-feed preview bundle into bet-slip picks (deterministic cents
// per row, same hash trick as comboPrices).
export type ComboPreview = {
  label: string;
  emoji?: string;
  icon?: ImageSourcePropType;
  vol: string;
  rows: string[];
  /** Small crest / flag / headshot per leg. Missing entries fall back to initials. */
  avatars?: (ImageSourcePropType | undefined)[];
  more: number;
};

/** Templates must include at least this many legs. */
export const COMBO_PREVIEW_MIN_LEGS = 3;

/** Kalshi-only college football template — not in the Polymarket COMBO_PREVIEWS list. */
export const COMBO_PREVIEW_NCAAF: ComboPreview = {
  label: "NCAAF",
  icon: UXR_ICONS.nfl,
  vol: "$860K Vol.",
  rows: [
    "Georgia \u00b7 Georgia vs Alabama",
    "Michigan \u00b7 Michigan vs Ohio State",
    "Texas \u00b7 Texas vs Oklahoma",
  ],
  avatars: [{ uri: ncaaLogo("61") }, { uri: ncaaLogo("130") }, { uri: ncaaLogo("251") }],
  more: 0,
};

export function comboPreviewPicks(preview: ComboPreview): import("@/components/sim/ComboSheet").ComboPick[] {
  const palette = ["#8b8bf5", "#4ade80", "#7dd3fc", "#f9a8d4", "#fbbf24"];
  const sport = comboPreviewSport(preview.label);
  return preview.rows.map((label, i) => {
    let h = 0;
    for (const c of label) h = (h * 31 + c.charCodeAt(0)) % 997;
    const cents = 38 + (h % 25);
    const sep = label.indexOf("·");
    const headline = (sep < 0 ? label : label.slice(0, sep)).trim();
    const market = sep < 0 ? "" : label.slice(sep + 1).trim();
    const vs = market.split(/\s+vs\.?\s+/i);
    const otherName = vs.length === 2
      ? (headline.toLowerCase() === vs[0].trim().toLowerCase() || vs[0].toLowerCase().startsWith(headline.toLowerCase())
          ? vs[1].trim()
          : vs[0].trim())
      : undefined;
    const otherLabel = otherName && market ? `${otherName} \u00b7 ${market}` : undefined;
    return {
      id: `preview:${preview.label}:${label}`,
      category: preview.label,
      categoryIcon: preview.icon,
      categoryEmoji: preview.emoji,
      label,
      color: palette[i % palette.length],
      cents,
      avatar: preview.avatars?.[i] ?? COMBO_OUTCOME_MARKS[headline],
      kind: "ml" as const,
      sport,
      alt: otherLabel
        ? {
            id: `preview:${preview.label}:${otherLabel}`,
            label: otherLabel,
            color: palette[(i + 1) % palette.length],
            cents: Math.max(8, Math.min(92, 100 - cents)),
            avatar: COMBO_OUTCOME_MARKS[otherName],
          }
        : undefined,
    };
  });
}

// Ready-made combo bundles for the home Templates rail and Combos page feed.
export const COMBO_PREVIEWS: ComboPreview[] = [
  {
    label: "MMA",
    emoji: "\u{1F94A}",
    vol: "$520K Vol.",
    rows: [
      "Bogdan \u00b7 Bogdan vs Buzukja",
      "Vlasto Cepo \u00b7 Vlasto Cepo vs Urbina",
      "Uros Medic \u00b7 Uros Medic vs Rodriguez",
      "Hill \u00b7 Hill vs Oliveira",
      "Adesanya \u00b7 Adesanya vs Du Plessis",
    ],
    avatars: [PHOTO_HATTON, PHOTO_NORRIS, face(32), face(45), face(12)],
    more: 0,
  },
  {
    label: "Pro Football",
    icon: UXR_ICONS.nfl,
    vol: "$1.8M Vol.",
    rows: [
      "Packers \u00b7 Packers vs Steelers",
      "Panthers \u00b7 Panthers vs Cardinals",
      "Chiefs \u00b7 Chiefs vs Ravens",
      "Eagles \u00b7 Eagles vs Cowboys",
      "Lions \u00b7 Lions vs Vikings",
    ],
    avatars: [
      { uri: nflLogo("gb") },
      { uri: nflLogo("car") },
      { uri: nflLogo("kc") },
      { uri: nflLogo("phi") },
      { uri: nflLogo("det") },
    ],
    more: 0,
  },
  {
    label: "Pro Basketball",
    icon: UXR_ICONS.basketball,
    vol: "$980K Vol.",
    rows: [
      "Heat \u00b7 Heat vs Thunder",
      "Celtics \u00b7 Celtics vs Nuggets",
      "Knicks \u00b7 Knicks vs Spurs",
      "Lakers \u00b7 Lakers vs Warriors",
      "Bucks \u00b7 Bucks vs 76ers",
    ],
    avatars: [
      { uri: nbaLogo("mia") },
      { uri: nbaLogo("bos") },
      { uri: nbaLogo("ny") },
      { uri: nbaLogo("lal") },
      { uri: nbaLogo("mil") },
    ],
    more: 0,
  },
  {
    label: "Soccer",
    icon: UXR_ICONS.soccer,
    vol: "$2.1M Vol.",
    rows: [
      "Brazil \u00b7 Brazil vs Argentina",
      "Portugal \u00b7 Portugal vs Netherlands",
      "France \u00b7 France vs Spain",
      "England \u00b7 England vs Germany",
      "Italy \u00b7 Italy vs Belgium",
    ],
    avatars: [
      { uri: flagUri("br") },
      { uri: flagUri("pt") },
      { uri: flagUri("fr") },
      { uri: flagUri("gb-eng") },
      { uri: flagUri("it") },
    ],
    more: 0,
  },
  {
    label: "Tennis",
    icon: UXR_ICONS.tennis,
    vol: "$410K Vol.",
    rows: [
      "Swiatek \u00b7 Swiatek vs Gauff",
      "Alcaraz \u00b7 Alcaraz vs Sinner",
      "Navone \u00b7 Navone vs Cobolli",
      "Djokovic \u00b7 Djokovic vs Medvedev",
      "Sabalenka \u00b7 Sabalenka vs Rybakina",
    ],
    avatars: [
      face(47, "women"),
      PHOTO_ALCARAZ,
      face(18),
      PHOTO_SINNER,
      face(21, "women"),
    ],
    more: 0,
  },
  {
    label: "Baseball",
    emoji: "\u26BE",
    vol: "$640K Vol.",
    rows: [
      "Yankees \u00b7 Yankees vs Red Sox",
      "Dodgers \u00b7 Dodgers vs Cubs",
      "Braves \u00b7 Braves vs Mets",
      "Astros \u00b7 Astros vs Rangers",
      "Padres \u00b7 Padres vs Giants",
    ],
    avatars: [
      { uri: mlbLogo("nyy") },
      { uri: mlbLogo("lad") },
      { uri: mlbLogo("atl") },
      { uri: mlbLogo("hou") },
      { uri: mlbLogo("sd") },
    ],
    more: 0,
  },
];

/** Polymarket rail plus the Kalshi-only NCAAF template. */
export const ALL_COMBO_PREVIEWS: ComboPreview[] = [...COMBO_PREVIEWS, COMBO_PREVIEW_NCAAF];

for (const preview of ALL_COMBO_PREVIEWS) {
  if (preview.rows.length < COMBO_PREVIEW_MIN_LEGS) {
    throw new Error(`Combo template "${preview.label}" must have at least ${COMBO_PREVIEW_MIN_LEGS} legs`);
  }
  preview.more = 0;
}
