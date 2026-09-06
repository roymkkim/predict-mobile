import React from "react";
import { Redirect } from "expo-router";

import colors from "@/constants/colors";
import { CategoryFeed, type Section } from "@/components/CategoryFeed";
import { useTennisHidden } from "@/lib/sim/tennisHiddenStore";

const c = colors.light;

const SECTIONS: Section[] = [
  {
    title: "Live & today",
    matches: [
      {
        league: "ATP",
        leagueColor: c.nbaBlue,
        live: { mins: "2nd set" },
        teams: [
          { name: "Alcaraz", pct: "66%", color: "#cf102c", initial: "ALC" },
          { name: "Sinner", pct: "34%", color: "#1e58cd", initial: "SIN" },
        ],
        vol: "$2.8m Vol.",
        date: "Today",
      },
      {
        league: "WTA",
        leagueColor: c.doosanRed,
        teams: [
          { name: "Swiatek", pct: "71%", color: "#0c5b3c", initial: "SWI" },
          { name: "Sabalenka", pct: "29%", color: "#f7931a", initial: "SAB" },
        ],
        vol: "$1.6m Vol.",
        date: "Today",
        time: "4:00 PM",
      },
    ],
  },
  {
    title: "Wimbledon",
    matches: [
      {
        league: "Wimbledon",
        leagueColor: c.green,
        teams: [
          { name: "Djokovic", pct: "55%", color: "#1d3a8a", initial: "DJO" },
          { name: "Zverev", pct: "45%", color: "#cf102c", initial: "ZVE" },
        ],
        vol: "$920k Vol.",
        date: "Mon",
        time: "8:00 AM",
      },
      {
        league: "Wimbledon",
        leagueColor: c.green,
        teams: [
          { name: "Gauff", pct: "58%", color: "#552583", initial: "GAU" },
          { name: "Rybakina", pct: "42%", color: "#0e2240", initial: "RYB" },
        ],
        vol: "$640k Vol.",
        date: "Mon",
        time: "10:00 AM",
      },
    ],
  },
  {
    title: "US Open",
    matches: [
      {
        league: "US Open",
        leagueColor: c.bitcoin,
        teams: [
          { name: "Medvedev", pct: "52%", color: "#0051ba", initial: "MED" },
          { name: "Fritz", pct: "48%", color: "#cf102c", initial: "FRI" },
        ],
        vol: "$480k Vol.",
        date: "Aug 28",
        time: "7:00 PM",
      },
    ],
  },
];

export default function TennisScreen() {
  const tennisHidden = useTennisHidden();
  if (tennisHidden) return <Redirect href="/" />;
  return (
    <CategoryFeed
      title="Tennis"
      topTabs={[]}
      hideTopTabs
      filters={["All", "ATP", "WTA", "Wimbledon", "US Open", "Roland Garros"]}
      sections={SECTIONS}
      cardVariant="standard"
    />
  );
}
