import React from "react";

import colors from "@/constants/colors";
import { CategoryFeed, type Section } from "@/components/CategoryFeed";

const c = colors.light;

const SECTIONS: Section[] = [
  {
    title: "This week",
    matches: [
      {
        league: "US 2028",
        leagueColor: c.nbaBlue,
        live: { mins: "2h" },
        teams: [
          { name: "J.D Vance", pct: "58%", color: "#1e58cd", initial: "JDV" },
          { name: "Marco Rubio", pct: "42%", color: "#cf102c", initial: "MAR" },
        ],
        vol: "$2.1m Vol.",
        date: "Nov 2028",
      },
      {
        league: "Senate",
        leagueColor: c.bitcoin,
        teams: [
          { name: "Democrats", pct: "47%", color: "#1d3a8a", initial: "DEM" },
          { name: "Republicans", pct: "53%", color: "#cf102c", initial: "REP" },
        ],
        vol: "$1.5m Vol.",
        date: "9 May 2026",
      },
      {
        league: "UK",
        leagueColor: c.doosanRed,
        teams: [
          { name: "Labour", pct: "61%", color: "#cf102c", initial: "LAB" },
          { name: "Conservative", pct: "39%", color: "#1e58cd", initial: "CON" },
        ],
        vol: "$900k Vol.",
        date: "9 May 2026",
      },
    ],
  },
  {
    title: "Next week",
    matches: [
      {
        league: "EU",
        leagueColor: c.nbaBlue,
        teams: [
          { name: "Macron", pct: "44%", color: "#1e58cd", initial: "MAC" },
          { name: "Le Pen", pct: "56%", color: "#0c5b3c", initial: "LEP" },
        ],
        vol: "$1.2m Vol.",
        date: "16 May 2026",
      },
      {
        league: "Brazil",
        leagueColor: c.green,
        teams: [
          { name: "Lula", pct: "52%", color: "#cf102c", initial: "LUL" },
          { name: "Bolsonaro", pct: "48%", color: "#f7931a", initial: "BOL" },
        ],
        vol: "$650k Vol.",
        date: "17 May 2026",
      },
    ],
  },
];

export default function PoliticsScreen() {
  return (
    <CategoryFeed
      title="Politics"
      topTabs={[]}
      hideTopTabs
      filters={["All", "Iran", "Trump", "Epstein", "US Elections", "UK", "EU"]}
      sections={SECTIONS}
      cardVariant="standard"
    />
  );
}
