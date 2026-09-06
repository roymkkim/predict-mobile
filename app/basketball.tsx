import React from "react";

import colors from "@/constants/colors";
import { CategoryFeed, type Section } from "@/components/CategoryFeed";

const c = colors.light;

const SECTIONS: Section[] = [
  {
    title: "Tonight",
    matches: [
      {
        league: "NBA",
        leagueColor: c.nbaBlue,
        live: { mins: "Q3 4:12" },
        teams: [
          { name: "Celtics", pct: "62%", color: "#0c5b3c", initial: "BOS" },
          { name: "Thunder", pct: "38%", color: "#f7931a", initial: "OKC" },
        ],
        vol: "$3.4m Vol.",
        date: "Tonight",
      },
      {
        league: "NBA",
        leagueColor: c.nbaBlue,
        teams: [
          { name: "Lakers", pct: "54%", color: "#552583", initial: "LAL" },
          { name: "Nuggets", pct: "46%", color: "#0e2240", initial: "DEN" },
        ],
        vol: "$2.1m Vol.",
        date: "Tonight",
        time: "10:30 PM",
      },
    ],
  },
  {
    title: "EuroLeague",
    matches: [
      {
        league: "EuroLeague",
        leagueColor: c.doosanRed,
        teams: [
          { name: "Real Madrid", pct: "57%", color: "#1e58cd", initial: "RMB" },
          { name: "Olympiacos", pct: "43%", color: "#cf102c", initial: "OLY" },
        ],
        vol: "$840k Vol.",
        date: "Sat",
        time: "2:00 PM",
      },
      {
        league: "EuroLeague",
        leagueColor: c.doosanRed,
        teams: [
          { name: "Fenerbahce", pct: "51%", color: "#0a1c4f", initial: "FEN" },
          { name: "Barcelona", pct: "49%", color: "#a50044", initial: "BAR" },
        ],
        vol: "$610k Vol.",
        date: "Sun",
        time: "1:30 PM",
      },
    ],
  },
  {
    title: "NCAA",
    matches: [
      {
        league: "NCAA",
        leagueColor: c.bitcoin,
        teams: [
          { name: "Duke", pct: "60%", color: "#001a57", initial: "DUKE" },
          { name: "Kansas", pct: "40%", color: "#0051ba", initial: "KU" },
        ],
        vol: "$520k Vol.",
        date: "Sat",
        time: "6:00 PM",
      },
    ],
  },
];

export default function BasketballScreen() {
  return (
    <CategoryFeed
      title="Basketball"
      topTabs={[]}
      hideTopTabs
      filters={["All", "NBA", "EuroLeague", "NCAA", "WNBA", "CBA"]}
      sections={SECTIONS}
      cardVariant="standard"
    />
  );
}
