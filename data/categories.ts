import type React from "react";
import type { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import type { Href } from "expo-router";

import colors from "@/constants/colors";

const c = colors.light;

export type HomeCategory =
  | { label: string; kind: "ionicon"; name: React.ComponentProps<typeof Ionicons>["name"]; href: Href; tint?: string; bg?: string }
  | { label: string; kind: "mcicon"; name: React.ComponentProps<typeof MaterialCommunityIcons>["name"]; href: Href; tint?: string; bg?: string }
  | { label: string; kind: "flag"; cc: string; label2?: string; href: Href; tint?: string; bg?: string };

export const HOME_CATEGORIES: HomeCategory[] = [
  { label: "Politics", kind: "mcicon", name: "bank", href: "/politics" },
  { label: "Crypto", kind: "mcicon", name: "bitcoin", href: "/crypto" },
  { label: "NBA", kind: "ionicon", name: "basketball", href: { pathname: "/sport/[slug]", params: { slug: "nba", label: "NBA" } } },
  { label: "Euroleague", kind: "ionicon", name: "basketball", href: { pathname: "/sport/[slug]", params: { slug: "euroleague", label: "Euroleague" } } },
  { label: "NHL", kind: "mcicon", name: "hockey-sticks", href: { pathname: "/sport/[slug]", params: { slug: "nhl", label: "NHL" } } },
  { label: "World Cup", kind: "ionicon", name: "football", href: { pathname: "/sport/[slug]", params: { slug: "world-cup", label: "World Cup" } } },
  { label: "Premier", kind: "flag", cc: "gb-eng", href: { pathname: "/sport/[slug]", params: { slug: "premier-league", label: "Premier League" } } },
  { label: "Serie A", kind: "flag", cc: "it", href: { pathname: "/sport/[slug]", params: { slug: "serie-a", label: "Serie A" } } },
];

export const ALL_CATEGORIES_SECTIONS: { title: string; items: HomeCategory[] }[] = [
  {
    title: "Popular",
    items: [
      { label: "Politics", kind: "mcicon", name: "bank", href: "/politics" },
      { label: "Crypto", kind: "mcicon", name: "bitcoin", href: "/crypto" },
      { label: "NBA", kind: "ionicon", name: "basketball", href: { pathname: "/sport/[slug]", params: { slug: "nba", label: "NBA" } } },
      { label: "World Cup", kind: "ionicon", name: "football", href: { pathname: "/sport/[slug]", params: { slug: "world-cup", label: "World Cup" } } },
      { label: "NHL", kind: "mcicon", name: "hockey-sticks", href: { pathname: "/sport/[slug]", params: { slug: "nhl", label: "NHL" } } },
    ],
  },
  {
    title: "Politics",
    items: [
      { label: "All Politics", kind: "mcicon", name: "bank", href: "/politics" },
      { label: "US Elections", kind: "mcicon", name: "vote", href: "/politics" },
      { label: "World Leaders", kind: "ionicon", name: "earth", href: "/politics" },
    ],
  },
  {
    title: "Crypto",
    items: [
      { label: "Bitcoin", kind: "mcicon", name: "bitcoin", href: "/crypto" },
      { label: "Ethereum", kind: "mcicon", name: "ethereum", href: "/crypto" },
      { label: "All Crypto", kind: "mcicon", name: "currency-usd", href: "/crypto" },
    ],
  },
  {
    title: "Sports",
    items: [
      { label: "All sports", kind: "ionicon", name: "apps", href: "/all-sports" },
      { label: "NBA", kind: "ionicon", name: "basketball", href: { pathname: "/sport/[slug]", params: { slug: "nba", label: "NBA" } } },
      { label: "Euroleague", kind: "ionicon", name: "basketball", href: { pathname: "/sport/[slug]", params: { slug: "euroleague", label: "Euroleague" } } },
      { label: "NHL", kind: "mcicon", name: "hockey-sticks", href: { pathname: "/sport/[slug]", params: { slug: "nhl", label: "NHL" } } },
      { label: "World Cup", kind: "ionicon", name: "football", href: { pathname: "/sport/[slug]", params: { slug: "world-cup", label: "World Cup" } } },
      { label: "Premier League", kind: "flag", cc: "gb-eng", href: { pathname: "/sport/[slug]", params: { slug: "premier-league", label: "Premier League" } } },
      { label: "Serie A", kind: "flag", cc: "it", href: { pathname: "/sport/[slug]", params: { slug: "serie-a", label: "Serie A" } } },
    ],
  },
];
