import React from "react";
import type { ImageSourcePropType } from "react-native";

import { StandardCard } from "@/components/sim/StandardCard";
import { VersusCard } from "@/components/sim/VersusCard";
import { useMatchLayout } from "@/lib/sim/matchLayoutStore";
import type { BaseballLiveState, Match, Team } from "@/lib/sim/types";

// Shared topic market data + card renderers. Consumed by the Trending page
// (in-place tabs) and the standalone /topic/[id] pages so the two never drift.

export const flag = (cc: string) => `https://flagcdn.com/w160/${cc}.png`;
export const nbaLogo = (abbr: string) => `https://a.espncdn.com/i/teamlogos/nba/500/${abbr}.png`;

export type Side = { name: string; abbr?: string; color: string; logo?: string; flag?: string };
export type VsSpec = {
  league: string;
  leagueColor?: string;
  sport?: string;
  home: Side;
  away: Side;
  pct: [number, number];
  vol: string;
  markets: number;
  date: string;
  time?: string;
  live?: { mins: string; score?: [number, number]; baseball?: BaseballLiveState };
};

export function vsMatch(s: VsSpec): Match {
  const mk = (t: Side, pct: number, score?: number): Team => ({
    name: t.name,
    pct: `${pct}%`,
    color: t.color,
    initial: (t.abbr ?? t.name)[0]!.toUpperCase(),
    ...(t.abbr ? { abbr: t.abbr } : {}),
    ...(t.logo ? { logo: t.logo } : {}),
    ...(t.flag ? { flag: t.flag } : {}),
    ...(score != null ? { score } : {}),
  });
  return {
    league: s.league,
    ...(s.leagueColor ? { leagueColor: s.leagueColor } : {}),
    ...(s.sport ? { sport: s.sport } : {}),
    ...(s.live
      ? {
          live: {
            mins: s.live.mins,
            ...(s.live.baseball ? { baseball: s.live.baseball } : {}),
          },
        }
      : {}),
    teams: [mk(s.home, s.pct[0], s.live?.score?.[0]), mk(s.away, s.pct[1], s.live?.score?.[1])],
    vol: s.vol,
    date: s.date,
    ...(s.time ? { time: s.time } : {}),
    markets: s.markets,
  };
}

// A binary Yes/No market rendered with the market question as the card title.
export type Binary = { title: string; match: Match; avatar?: ImageSourcePropType };

const IMG_IRAN_NUCLEAR = require("@/assets/images/events/iran-nuclear.jpg");
const IMG_FORDOW = require("@/assets/images/events/fordow.jpg");
const IMG_HORMUZ = require("@/assets/images/events/hormuz.jpg");
const IMG_FED = require("@/assets/images/events/fed-september.jpg");
const IMG_SPACEX_IPO = require("@/assets/images/events/spacex-ipo.png");
const IMG_DISCORD_IPO = require("@/assets/images/events/discord-ipo.png");
const IMG_ANTHROPIC = require("@/assets/images/events/anthropic.png");
const IMG_GAMESTOP = require("@/assets/images/events/gamestop-ebay.png");
const IMG_HOTTEST = require("@/assets/images/events/hottest-year.png");
const IMG_BAD_BUNNY = require("@/assets/images/events/bad-bunny.jpg");
const IMG_WICKED = require("@/assets/images/events/wicked.jpg");
const IMG_JESUS = require("@/assets/images/events/jesus-return.jpg");
const IMG_NVIDIA = require("@/assets/images/events/nvidia.png");
const IMG_BEST_AI = require("@/assets/images/events/best-ai-model.jpg");
const IMG_TESLA_SPACEX = require("@/assets/images/events/tesla-spacex.jpg");
const IMG_GTA6 = require("@/assets/images/events/gta6.jpg");
const IMG_SUNDAR = require("@/assets/images/events/sundar-pichai.jpg");
const IMG_CLARITY = require("@/assets/images/events/clarity-act.jpg");
const IMG_OK_PRIMARY = require("@/assets/images/events/oklahoma-primary.png");
const IMG_AK_PRIMARY = require("@/assets/images/events/alaska-primary.jpg");
const IMG_WY_PRIMARY = require("@/assets/images/events/wyoming-primary.png");

// Polymarket event images, matched by question text (most specific first).
const TITLE_AVATARS: { re: RegExp; src: ImageSourcePropType }[] = [
  { re: /fordow/i, src: IMG_FORDOW },
  { re: /hormuz/i, src: IMG_HORMUZ },
  { re: /iran/i, src: IMG_IRAN_NUCLEAR },
  { re: /clarity|h\.?r\.?\s*3633/i, src: IMG_CLARITY },
  { re: /oklahoma/i, src: IMG_OK_PRIMARY },
  { re: /alaska/i, src: IMG_AK_PRIMARY },
  { re: /wyoming/i, src: IMG_WY_PRIMARY },
  { re: /discord/i, src: IMG_DISCORD_IPO },
  { re: /tesla.*spacex|spacex.*merger/i, src: IMG_TESLA_SPACEX },
  { re: /spacex/i, src: IMG_SPACEX_IPO },
  { re: /\bfed\b|rate cuts?/i, src: IMG_FED },
  { re: /best ai model|ai model/i, src: IMG_BEST_AI },
  { re: /anthropic/i, src: IMG_ANTHROPIC },
  { re: /nvidia/i, src: IMG_NVIDIA },
  { re: /gamestop|ebay/i, src: IMG_GAMESTOP },
  { re: /wicked/i, src: IMG_WICKED },
  { re: /bad bunny/i, src: IMG_BAD_BUNNY },
  { re: /jesus/i, src: IMG_JESUS },
  { re: /hottest year/i, src: IMG_HOTTEST },
  { re: /\bgta\b|grand theft auto/i, src: IMG_GTA6 },
  { re: /sundar|pichai/i, src: IMG_SUNDAR },
];

function avatarForTitle(title: string, explicit?: ImageSourcePropType): ImageSourcePropType | undefined {
  if (explicit) return explicit;
  return TITLE_AVATARS.find((row) => row.re.test(title))?.src;
}

export function binary(p: {
  title: string;
  yes: number;
  no: number;
  colors?: [string, string];
  vol: string;
  date: string;
  avatar?: ImageSourcePropType;
}): Binary {
  const [cy, cn] = p.colors ?? ["#5b8cff", "#71717a"];
  const avatar = avatarForTitle(p.title, p.avatar);
  return {
    title: p.title,
    ...(avatar ? { avatar } : {}),
    match: {
      league: "World",
      leagueColor: "#5b8cff",
      teams: [
        { name: "Yes", pct: `${p.yes}%`, color: cy, initial: "Y" },
        { name: "No", pct: `${p.no}%`, color: cn, initial: "N" },
      ],
      vol: p.vol,
      date: p.date,
      markets: 0,
    },
  };
}

// Culture / Finance / Tech: real markets pulled from Polymarket's public
// Gamma API (Aug 13, 2026 snapshot) — titles, odds, and volumes are genuine.
export const CULTURE: Binary[] = [
  binary({ title: "Will 2026 be the hottest year on record?", yes: 68, no: 32, colors: ["#f97316", "#71717a"], vol: "$566K Vol.", date: "Dec 31" }),
  binary({ title: "Will Bad Bunny be the top artist for 2026?", yes: 74, no: 26, colors: ["#a855f7", "#71717a"], vol: "$368K Vol.", date: "Dec 31" }),
  binary({ title: "Will Wicked: For Good be the top grossing movie of 2026?", yes: 1, no: 99, colors: ["#22c55e", "#71717a"], vol: "$2.2M Vol.", date: "Dec 31" }),
  binary({ title: "Will Jesus Christ return before 2027?", yes: 2, no: 98, vol: "$65M Vol.", date: "Dec 31" }),
];

export const FINANCE: Binary[] = [
  binary({ title: "Will no Fed rate cuts happen in 2026?", yes: 86, no: 14, colors: ["#2563eb", "#71717a"], vol: "$7.2M Vol.", date: "Dec 31" }),
  binary({ title: "Will SpaceX have the highest IPO market cap in 2026?", yes: 76, no: 24, colors: ["#0ea5e9", "#71717a"], vol: "$693K Vol.", date: "Dec 31" }),
  binary({ title: "Discord IPO before 2027?", yes: 28, no: 72, colors: ["#6366f1", "#71717a"], vol: "$471K Vol.", date: "Dec 31" }),
  binary({ title: "Will Anthropic's valuation hit $3.0T by December 31?", yes: 28, no: 72, colors: ["#d97706", "#71717a"], vol: "$660K Vol.", date: "Dec 31" }),
  binary({ title: "Will GameStop acquire eBay?", yes: 8, no: 92, colors: ["#dc2626", "#71717a"], vol: "$2.8M Vol.", date: "Dec 31" }),
];

export const TECH: Binary[] = [
  binary({ title: "Will NVIDIA be the largest company in the world by market cap on December 31?", yes: 72, no: 28, colors: ["#76b900", "#71717a"], vol: "$1.0M Vol.", date: "Dec 31" }),
  binary({ title: "Will Anthropic have the best AI model at the end of August 2026?", yes: 94, no: 6, colors: ["#d97706", "#71717a"], vol: "$346K Vol.", date: "Aug 31" }),
  binary({ title: "Tesla and SpaceX merger officially announced by December 31?", yes: 18, no: 82, colors: ["#e11d48", "#71717a"], vol: "$122K Vol.", date: "Dec 31" }),
  binary({ title: "GTA 6 launch postponed again?", yes: 8, no: 92, colors: ["#f59e0b", "#71717a"], vol: "$651K Vol.", date: "Nov 19" }),
  binary({ title: "Sundar Pichai out as Google CEO before 2027?", yes: 8, no: 92, colors: ["#ef4444", "#71717a"], vol: "$41K Vol.", date: "Dec 31" }),
];

export const IRAN: Binary[] = [
  binary({ title: "Iran and U.S. sign a nuclear deal by end of 2026?", yes: 38, no: 62, vol: "$1.2M Vol.", date: "Dec 31" }),
  binary({ title: "Iran reopens Fordow enrichment site in 2026?", yes: 55, no: 45, colors: ["#f7931a", "#71717a"], vol: "$640K Vol.", date: "Dec 31" }),
  binary({ title: "Strait of Hormuz closed at any point in 2026?", yes: 22, no: 78, colors: ["#ff5fa2", "#71717a"], vol: "$880K Vol.", date: "Dec 31" }),
];

export const CLARITY: Binary[] = [
  binary({ title: "Clarity Act (H.R.3633) signed into law in 2026?", yes: 18, no: 82, colors: ["#22c55e", "#71717a"], vol: "$9.81M Vol.", date: "Dec 31" }),
];

export const PRIMARIES: Binary[] = [
  binary({ title: "Oklahoma Governor Republican Primary Winner?", yes: 54, no: 46, colors: ["#dc2626", "#71717a"], vol: "$210K Vol.", date: "Aug 25" }),
  binary({ title: "Alaska At-Large Primary: incumbent advances?", yes: 61, no: 39, colors: ["#0ea5e9", "#71717a"], vol: "$94K Vol.", date: "Aug 25" }),
  binary({ title: "Wyoming Governor Republican Primary Winner?", yes: 48, no: 52, colors: ["#f59e0b", "#71717a"], vol: "$76K Vol.", date: "Aug 25" }),
];

export const MARCH_MADNESS: Match[] = [
  vsMatch({ league: "NCAA · March Madness", leagueColor: "#f97316", sport: "basketball", home: { name: "Duke", abbr: "DUKE", color: "#003087" }, away: { name: "Houston", abbr: "HOU", color: "#c8102e" }, pct: [52, 48], vol: "$1.4M Vol.", markets: 8, date: "Live", live: { mins: "2H · 8:24", score: [58, 54] } }),
  vsMatch({ league: "NCAA · March Madness", leagueColor: "#f97316", sport: "basketball", home: { name: "Purdue", abbr: "PUR", color: "#b1810b" }, away: { name: "UConn", abbr: "CONN", color: "#0c2340" }, pct: [44, 56], vol: "$960K Vol.", markets: 7, date: "Tomorrow", time: "6:30 PM" }),
  vsMatch({ league: "NCAA · March Madness", leagueColor: "#f97316", sport: "basketball", home: { name: "Auburn", abbr: "AUB", color: "#0c2340" }, away: { name: "Alabama", abbr: "BAMA", color: "#9e1b32" }, pct: [49, 51], vol: "$720K Vol.", markets: 6, date: "Tomorrow", time: "9:00 PM" }),
];

export const NBA: Match[] = [
  vsMatch({ league: "NBA", leagueColor: "#c8102e", sport: "basketball", home: { name: "Lakers", abbr: "LAL", color: "#552583", logo: nbaLogo("lal") }, away: { name: "Celtics", abbr: "BOS", color: "#007a33", logo: nbaLogo("bos") }, pct: [47, 53], vol: "$2.1M Vol.", markets: 12, date: "Live", live: { mins: "3Q · 4:12", score: [108, 74] } }),
  vsMatch({ league: "NBA", leagueColor: "#c8102e", sport: "basketball", home: { name: "Nuggets", abbr: "DEN", color: "#0e2240", logo: nbaLogo("den") }, away: { name: "Warriors", abbr: "GSW", color: "#1d428a", logo: nbaLogo("gs") }, pct: [58, 42], vol: "$1.6M Vol.", markets: 10, date: "Tonight", time: "10:00 PM" }),
  vsMatch({ league: "NBA", leagueColor: "#c8102e", sport: "basketball", home: { name: "Bucks", abbr: "MIL", color: "#00471b", logo: nbaLogo("mil") }, away: { name: "Knicks", abbr: "NYK", color: "#006bb6", logo: nbaLogo("ny") }, pct: [54, 46], vol: "$1.1M Vol.", markets: 9, date: "Tomorrow", time: "7:30 PM" }),
];

export const UFC: Match[] = [
  vsMatch({ league: "UFC 312", leagueColor: "#d20a0a", sport: "mma", home: { name: "Makhachev", abbr: "MAK", color: "#239f40", flag: flag("ru") }, away: { name: "Oliveira", abbr: "OLI", color: "#009c3b", flag: flag("br") }, pct: [63, 37], vol: "$1.3M Vol.", markets: 6, date: "Sat, Jun 28", time: "10:00 PM" }),
  vsMatch({ league: "UFC 312", leagueColor: "#d20a0a", sport: "mma", home: { name: "Adesanya", abbr: "ADE", color: "#111827", flag: flag("ng") }, away: { name: "Du Plessis", abbr: "DDP", color: "#007749", flag: flag("za") }, pct: [45, 55], vol: "$940K Vol.", markets: 5, date: "Sat, Jun 28", time: "9:15 PM" }),
  vsMatch({ league: "UFC 312", leagueColor: "#d20a0a", sport: "mma", home: { name: "Pantoja", abbr: "PAN", color: "#009c3b", flag: flag("br") }, away: { name: "Royval", abbr: "ROY", color: "#3c3b6e", flag: flag("us") }, pct: [60, 40], vol: "$510K Vol.", markets: 4, date: "Sat, Jun 28", time: "8:30 PM" }),
];

// ── Topic registry ───────────────────────────────────────────────────────────
// Each home Popular pill / Trending tab maps to one of these slugs. "kind"
// selects which renderer the standalone /topic/[id] page uses.

export type TopicKind = "binary" | "match";
export type TopicDef =
  | { slug: string; label: string; subtitle: string; kind: "binary"; data: Binary[] }
  | { slug: string; label: string; subtitle: string; kind: "match"; data: Match[] };

export const TOPICS: Record<string, TopicDef> = {
  iran: { slug: "iran", label: "Iran", subtitle: "Geopolitics markets", kind: "binary", data: IRAN },
  clarity: { slug: "clarity", label: "Clarity Act", subtitle: "Digital asset market structure", kind: "binary", data: CLARITY },
  primaries: { slug: "primaries", label: "Primaries", subtitle: "August 25 primary markets", kind: "binary", data: PRIMARIES },
  culture: { slug: "culture", label: "Culture", subtitle: "Entertainment & pop culture markets", kind: "binary", data: CULTURE },
  finance: { slug: "finance", label: "Finance", subtitle: "Markets, rates & IPOs", kind: "binary", data: FINANCE },
  tech: { slug: "tech", label: "Tech", subtitle: "AI & technology markets", kind: "binary", data: TECH },
  "march-madness": { slug: "march-madness", label: "March Madness", subtitle: "NCAA tournament markets", kind: "match", data: MARCH_MADNESS },
  nba: { slug: "nba", label: "NBA", subtitle: "Live NBA markets", kind: "match", data: NBA },
  ufc: { slug: "ufc", label: "UFC", subtitle: "Fight night markets", kind: "match", data: UFC },
};

// ── Card renderers ───────────────────────────────────────────────────────────

export function MatchCard({
  m,
  layout,
  cardRadius,
  fillHeight,
  combo,
}: {
  m: Match;
  layout: "versus" | "standard" | "mixed" | "global";
  cardRadius?: number;
  // Stretch the VersusCard to fill a fixed-height host (live carousel rail):
  // score unit centers in the extra space, outcome buttons stay bottom-aligned.
  fillHeight?: boolean;
  combo?: boolean;
}) {
  const globalLayout = useMatchLayout();
  const effectiveLayout = layout === "global" ? globalLayout : layout;
  const possession = m.sport === "soccer" ? "icon" : "none";
  // Tennis and racing never use the head-to-head VersusCard format —
  // they always fall back to the stacked-row StandardCard (individual-athlete
  // rows with position/gap) regardless of the layout toggle.
  if (effectiveLayout === "standard" || m.sport === "tennis" || m.sport === "racing" || m.sport === "golf") {
    return (
      <StandardCard
        match={m}
        live={!!m.live}
        score="aside"
        display="avatar"
        title="show"
        possession={possession}
        asideCue="score"
        buttons="simple"
        buttonSize="md"
        buttonText="gray-colored"
        buttonStyle="default"
        buttonAnim="slot"
        metaStyle="filled"
        metaPlacement="bottom"
        cardPadding="12"
        animate={!!m.live}
        animStyle="border"
        combo={combo}
      />
    );
  }
  return (
    <VersusCard
      match={m}
      live={!!m.live}
      display="avatar"
      layout="sides"
      buttonText="gray-colored"
      buttonSize="md"
      buttonStyle="default"
      buttonAnim="slot"
      metaStyle="filled"
      metaPlacement="bottom"
      cardPadding="12"
      title="show"
      sidesLive="center"
      possession={possession}
      animate={!!m.live}
       animStyle="border"
       cardRadius={cardRadius}
       fillHeight={fillHeight}
       combo={combo}
    />
  );
}

export function BinaryCard({ item }: { item: Binary }) {
  return (
    <StandardCard
      match={item.match}
      live={false}
      score="aside"
      display="name"
      title="show"
      titleText={item.title}
      titleAvatar={item.avatar}
      possession="none"
      asideCue="score"
      buttons="simple"
      buttonSize="md"
      buttonText="gray-colored"
      buttonStyle="default"
      buttonAnim="slot"
      metaStyle="filled"
      metaPlacement="bottom"
      cardPadding="12"
      animate={false}
      animStyle="border"
      combo={false}
    />
  );
}
