// Shared category-browse market data + subcategory definitions, used by both
// the single-category hub (app/uxr-hub/[category].tsx) and the chips-mode
// combined page (app/uxr-chips.tsx).
import { binary, type Binary } from "./topicMarkets";

export const CRYPTO_MARKETS: Binary[] = [
  binary({ title: "Bitcoin above $150K by Sept 1?", yes: 38, no: 62, colors: ["#f7931a", "#71717a"], vol: "$2.1M Vol.", date: "Sep 1" }),
  binary({ title: "Ethereum flips $6K this month?", yes: 24, no: 76, colors: ["#627eea", "#71717a"], vol: "$860K Vol.", date: "Aug 31" }),
  binary({ title: "Solana ETF approved this year?", yes: 61, no: 39, colors: ["#14f195", "#71717a"], vol: "$540K Vol.", date: "Dec 31" }),
];

export const POLITICS_MARKETS: Binary[] = [
  binary({
    title: "Government shutdown before October?",
    yes: 33,
    no: 67,
    colors: ["#dc2626", "#71717a"],
    vol: "$1.4M Vol.",
    date: "Oct 1",
    avatar: require("@/assets/images/events/govt-shutdown.jpeg"),
  }),
  binary({
    title: "Fed cuts rates in September?",
    yes: 72,
    no: 28,
    colors: ["#2563eb", "#71717a"],
    vol: "$3.2M Vol.",
    date: "Sep 18",
    avatar: require("@/assets/images/events/fed-september.jpg"),
  }),
];

export const TRENDING_SUBS = [
  { key: "nba", label: "NBA" },
  { key: "ufc", label: "UFC" },
  { key: "march-madness", label: "March Madness" },
  { key: "iran", label: "Iran" },
];
export const CRYPTO_SUBS = [
  { key: "live", label: "Live" },
  { key: "bitcoin", label: "Bitcoin" },
  { key: "ethereum", label: "Ethereum" },
];
export const POLITICS_SUBS = [
  { key: "us", label: "US" },
  { key: "geopolitics", label: "Geopolitics" },
];
