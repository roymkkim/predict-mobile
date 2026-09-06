import React from "react";

import colors from "@/constants/colors";
import { CategoryFeed, type Section } from "@/components/CategoryFeed";
import { useTennisHidden } from "@/lib/sim/tennisHiddenStore";

const c = colors.light;

// Team imagery for the legacy sports fixtures mirrors the logo treatment used
// by the newer sports feed.
const flag = (cc: string) => `https://flagcdn.com/w80/${cc}.png`;
const teamLogo = (league: string, id: string) => `https://a.espncdn.com/i/teamlogos/${league}/500/${id}.png`;

const SECTIONS: Section[] = [
  {
    title: "Sat, May 9th",
    matches: [
      {
        league: "FIFA World Cup",
        leagueColor: c.spainRed ?? "#cf102c",
        live: { mins: "67'" },
        teams: [
          { name: "Brazil", pct: "52%", color: "#0c5b3c", initial: "BRA", logo: flag("br") },
          { name: "Argentina", pct: "36%", color: "#74acdf", initial: "ARG", logo: flag("ar") },
        ],
        draw: { pct: "12%" },
        vol: "$4.2m Vol.", date: "9 May 2026", time: "8:00 PM",
      },
      {
        league: "FIFA World Cup",
        leagueColor: c.spainRed ?? "#cf102c",
        live: { mins: "23'" },
        teams: [
          { name: "France", pct: "55%", color: "#1e58cd", initial: "FRA", logo: flag("fr") },
          { name: "Germany", pct: "31%", color: "#1c1d1f", initial: "GER", logo: flag("de") },
        ],
        draw: { pct: "14%" },
        vol: "$3.1m Vol.", date: "9 May 2026", time: "9:30 PM",
      },
      {
        league: "NBA",
        leagueColor: c.nbaBlue,
        live: { mins: "3'" },
        teams: [
          { name: "Cavaliers", pct: "72%", color: "#d61f3a", initial: "CLE", logo: teamLogo("nba", "cle") },
          { name: "Pistons", pct: "28%", color: "#cf102c", initial: "DET", logo: teamLogo("nba", "det") },
        ],
        vol: "$1.5m Vol.", date: "9 May 2026", time: "7:00 PM",
      },
      {
        league: "ABA",
        leagueColor: c.surface2,
        live: { mins: "15'" },
        teams: [
          { name: "Dubai", pct: "63%", color: "#1d3a8a", initial: "DUB" },
          { name: "Spartak", pct: "37%", color: "#1e58cd", initial: "SPK" },
        ],
        vol: "$1.5m Vol.", date: "9 May 2026", time: "6:30 PM",
      },
      {
        league: "Euroleague",
        leagueColor: c.bitcoin,
        teams: [
          { name: "Olympiacos", pct: "60%", color: "#cf102c", initial: "OLY" },
          { name: "Monaco", pct: "40%", color: "#bf2e3a", initial: "MON" },
        ],
        vol: "$1.5m Vol.", date: "9 May 2026", time: "8:45 PM",
      },
      {
        league: "Euroleague",
        leagueColor: c.bitcoin,
        teams: [
          { name: "Panathinaikos", pct: "55%", color: "#0c5b3c", initial: "PAN" },
          { name: "Valencia", pct: "45%", color: "#f7931a", initial: "VAL" },
        ],
        vol: "$1.5m Vol.", date: "9 May 2026", time: "10:00 PM",
      },
      {
        league: "NBA",
        leagueColor: c.nbaBlue,
        teams: [
          { name: "Lakers", pct: "47%", color: "#7a5cb0", initial: "LAL", logo: teamLogo("nba", "lal") },
          { name: "Thunders", pct: "53%", color: "#1e58cd", initial: "OKC", logo: teamLogo("nba", "okc") },
        ],
        vol: "$1.5m Vol.", date: "9 May 2026", time: "10:30 PM",
      },
    ],
  },
  {
    title: "Sun, May 10th",
    matches: [
      {
        league: "FIFA World Cup",
        leagueColor: c.spainRed ?? "#cf102c",
        teams: [
          { name: "Spain", pct: "48%", color: "#cf102c", initial: "ESP", logo: flag("es") },
          { name: "England", pct: "39%", color: "#1e58cd", initial: "ENG", logo: flag("gb-eng") },
        ],
        draw: { pct: "13%" },
        vol: "$2.4m Vol.", date: "10 May 2026", time: "8:00 PM",
      },
      {
        league: "FIFA World Cup",
        leagueColor: c.spainRed ?? "#cf102c",
        teams: [
          { name: "Mexico", pct: "34%", color: "#0c5b3c", initial: "MEX", logo: flag("mx") },
          { name: "USA", pct: "55%", color: "#1e58cd", initial: "USA", logo: flag("us") },
        ],
        draw: { pct: "11%" },
        vol: "$1.8m Vol.", date: "10 May 2026", time: "9:30 PM",
      },
      {
        league: "CBA",
        leagueColor: c.surface2,
        teams: [
          { name: "Sharks", pct: "41%", color: "#cf102c", initial: "SHK" },
          { name: "Kirin", pct: "59%", color: "#1e58cd", initial: "KRN" },
        ],
        vol: "$1.5m Vol.", date: "10 May 2026", time: "7:00 PM",
      },
    ],
  },
];

export { SECTIONS as SPORTS_SECTIONS };

export default function SportsV1({
  initialFilter, initialTab,
}: { initialFilter?: string; initialTab?: string }) {
  const tennisHidden = useTennisHidden();
  const topTabs = ["Soccer", "Basket", "Baseball", "E-sports", "Tennis", "Football"]
    .filter((t) => !(tennisHidden && t === "Tennis"));
  return (
    <CategoryFeed
      title="Sports"
      richTabs
      topTabs={topTabs}
      tabIcons={{
        Soccer: "football-outline",
        Basket: "basketball-outline",
        Baseball: "baseball-outline",
        "E-sports": "game-controller-outline",
        Tennis: "tennisball-outline",
        Football: "american-football-outline",
      }}
      filters={["All", "Live", "FIFA World Cup", "NBA", "Euroleague", "Serie A", "Premier"]}
      filtersByTab={{
        Soccer: ["All", "Live", "FIFA World Cup", "Premier League", "La Liga", "Serie A", "Bundesliga", "Ligue 1"],
        Basket: ["All", "Live", "NBA", "Euroleague", "ABA", "CBA", "NCAA"],
        Baseball: ["All", "Live", "MLB", "KBO", "NPB", "World Series"],
        "E-sports": ["All", "Live", "LoL", "CS:GO", "Dota 2", "Valorant", "Overwatch"],
        Tennis: ["All", "Live", "ATP", "WTA", "Grand Slam", "Masters 1000"],
        Football: ["All", "Live", "NFL", "NCAA", "Super Bowl", "Playoffs"],
      }}
      sections={SECTIONS}
      rememberSelectedCarouselItem
      initialFilter={initialFilter}
      initialTab={initialTab}
    />
  );
}
