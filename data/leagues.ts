import colors from "@/constants/colors";
import { type Section } from "@/components/CategoryFeed";

const c = colors.light;
const flag = (cc: string) => `https://flagcdn.com/w80/${cc}.png`;
const nbaLogo = (t: string) => `https://a.espncdn.com/i/teamlogos/nba/500/${t}.png`;
const nhlLogo = (t: string) => `https://a.espncdn.com/i/teamlogos/nhl/500/${t}.png`;

export type LeagueConfig = {
  slug: string;
  label: string;
  filters: string[];
  sections: Section[];
};

export const LEAGUES: Record<string, LeagueConfig> = {
  "nba": {
    slug: "nba", label: "NBA",
    filters: ["All", "Live", "Playoffs", "Season", "Finals"],
    sections: [
      {
        title: "Sat, May 9th",
        matches: [
          { league: "NBA", leagueColor: c.nbaBlue, live: { mins: "3'" },
            teams: [
              { name: "Cavaliers", pct: "72%", color: "#d61f3a", initial: "CLE", logo: nbaLogo("cle") },
              { name: "Pistons", pct: "28%", color: "#cf102c", initial: "DET", logo: nbaLogo("det") },
            ],
            vol: "$1.5m Vol.", date: "9 May 2026", time: "7:00 PM" },
          { league: "NBA", leagueColor: c.nbaBlue, live: { mins: "18'" },
            teams: [
              { name: "Celtics", pct: "55%", color: "#0c5b3c", initial: "BOS", logo: nbaLogo("bos") },
              { name: "Heat", pct: "45%", color: "#cf102c", initial: "MIA", logo: nbaLogo("mia") },
            ],
            vol: "$2.1m Vol.", date: "9 May 2026", time: "7:30 PM" },
          { league: "NBA", leagueColor: c.nbaBlue,
            teams: [
              { name: "Lakers", pct: "47%", color: "#7a5cb0", initial: "LAL", logo: nbaLogo("lal") },
              { name: "Thunders", pct: "53%", color: "#1e58cd", initial: "OKC", logo: nbaLogo("okc") },
            ],
            vol: "$1.5m Vol.", date: "9 May 2026", time: "10:30 PM" },
          { league: "NBA", leagueColor: c.nbaBlue,
            teams: [
              { name: "Warriors", pct: "61%", color: "#1e58cd", initial: "GSW", logo: nbaLogo("gs") },
              { name: "Suns", pct: "39%", color: "#cf102c", initial: "PHX", logo: nbaLogo("phx") },
            ],
            vol: "$1.8m Vol.", date: "9 May 2026", time: "11:00 PM" },
        ],
      },
      {
        title: "Sun, May 10th",
        matches: [
          { league: "NBA", leagueColor: c.nbaBlue,
            teams: [
              { name: "Bucks", pct: "58%", color: "#0c5b3c", initial: "MIL", logo: nbaLogo("mil") },
              { name: "76ers", pct: "42%", color: "#1e58cd", initial: "PHI", logo: nbaLogo("phi") },
            ],
            vol: "$1.2m Vol.", date: "10 May 2026", time: "8:00 PM" },
          { league: "NBA", leagueColor: c.nbaBlue,
            teams: [
              { name: "Nuggets", pct: "63%", color: "#1d3a8a", initial: "DEN", logo: nbaLogo("den") },
              { name: "Mavericks", pct: "37%", color: "#1e58cd", initial: "DAL", logo: nbaLogo("dal") },
            ],
            vol: "$1.6m Vol.", date: "10 May 2026", time: "9:30 PM" },
        ],
      },
    ],
  },
  "euroleague": {
    slug: "euroleague", label: "Euroleague",
    filters: ["All", "Live", "Playoffs", "Regular", "Final Four"],
    sections: [
      {
        title: "Sat, May 9th",
        matches: [
          { league: "Euroleague", leagueColor: c.bitcoin, live: { mins: "Q2" },
            teams: [
              { name: "Olympiacos", pct: "60%", color: "#cf102c", initial: "OLY" },
              { name: "Monaco", pct: "40%", color: "#bf2e3a", initial: "MON" },
            ],
            vol: "$1.5m Vol.", date: "9 May 2026", time: "8:45 PM" },
          { league: "Euroleague", leagueColor: c.bitcoin,
            teams: [
              { name: "Panathinaikos", pct: "55%", color: "#0c5b3c", initial: "PAN" },
              { name: "Valencia", pct: "45%", color: "#f7931a", initial: "VAL" },
            ],
            vol: "$1.5m Vol.", date: "9 May 2026", time: "10:00 PM" },
          { league: "Euroleague", leagueColor: c.bitcoin,
            teams: [
              { name: "Real Madrid", pct: "67%", color: "#fff", initial: "RMA" },
              { name: "Fenerbahçe", pct: "33%", color: "#1d3a8a", initial: "FEN" },
            ],
            vol: "$2.0m Vol.", date: "10 May 2026", time: "8:30 PM" },
        ],
      },
    ],
  },
  "nhl": {
    slug: "nhl", label: "NHL",
    filters: ["All", "Live", "Playoffs", "Regular", "Stanley Cup"],
    sections: [
      {
        title: "Sat, May 9th",
        matches: [
          { league: "NHL", leagueColor: "#000",  live: { mins: "P2" },
            teams: [
              { name: "Rangers", pct: "58%", color: "#0038a8", initial: "NYR", logo: nhlLogo("nyr") },
              { name: "Bruins", pct: "42%", color: "#fcb514", initial: "BOS", logo: nhlLogo("bos") },
            ],
            vol: "$1.3m Vol.", date: "9 May 2026", time: "7:30 PM" },
          { league: "NHL", leagueColor: "#000",
            teams: [
              { name: "Maple Leafs", pct: "51%", color: "#003e7e", initial: "TOR", logo: nhlLogo("tor") },
              { name: "Panthers", pct: "49%", color: "#c8102e", initial: "FLA", logo: nhlLogo("fla") },
            ],
            vol: "$1.7m Vol.", date: "9 May 2026", time: "8:00 PM" },
          { league: "NHL", leagueColor: "#000",
            teams: [
              { name: "Oilers", pct: "63%", color: "#fc4c02", initial: "EDM", logo: nhlLogo("edm") },
              { name: "Stars", pct: "37%", color: "#006847", initial: "DAL", logo: nhlLogo("dal") },
            ],
            vol: "$1.4m Vol.", date: "10 May 2026", time: "9:00 PM" },
        ],
      },
    ],
  },
  "serie-a": {
    slug: "serie-a", label: "Serie A",
    filters: ["All", "Live", "Coppa Italia", "Season", "Super Cup"],
    sections: [
      {
        title: "Sat, May 9th",
        matches: [
          { league: "Serie A", leagueColor: "#0066b3", live: { mins: "67'" },
            teams: [
              { name: "Inter", pct: "52%", color: "#1d3a8a", initial: "INT" },
              { name: "Juventus", pct: "32%", color: "#000", initial: "JUV" },
            ],
            draw: { pct: "16%" },
            vol: "$2.4m Vol.", date: "9 May 2026", time: "8:45 PM" },
          { league: "Serie A", leagueColor: "#0066b3",
            teams: [
              { name: "AC Milan", pct: "48%", color: "#cf102c", initial: "MIL" },
              { name: "Napoli", pct: "39%", color: "#1e58cd", initial: "NAP" },
            ],
            draw: { pct: "13%" },
            vol: "$1.9m Vol.", date: "10 May 2026", time: "8:45 PM" },
          { league: "Serie A", leagueColor: "#0066b3",
            teams: [
              { name: "Roma", pct: "55%", color: "#8b0000", initial: "ROM" },
              { name: "Lazio", pct: "30%", color: "#5d9dc7", initial: "LAZ" },
            ],
            draw: { pct: "15%" },
            vol: "$1.5m Vol.", date: "10 May 2026", time: "7:00 PM" },
        ],
      },
    ],
  },
  "premier-league": {
    slug: "premier-league", label: "Premier League",
    filters: ["All", "Live", "FA Cup", "Season", "EFL Cup"],
    sections: [
      {
        title: "Sat, May 9th",
        matches: [
          { league: "Premier League", leagueColor: "#3d195b", live: { mins: "33'" },
            teams: [
              { name: "Man City", pct: "62%", color: "#6cabdd", initial: "MCI" },
              { name: "Arsenal", pct: "23%", color: "#cf102c", initial: "ARS" },
            ],
            draw: { pct: "15%" },
            vol: "$3.1m Vol.", date: "9 May 2026", time: "5:30 PM" },
          { league: "Premier League", leagueColor: "#3d195b",
            teams: [
              { name: "Liverpool", pct: "49%", color: "#cf102c", initial: "LIV" },
              { name: "Chelsea", pct: "32%", color: "#1e58cd", initial: "CHE" },
            ],
            draw: { pct: "19%" },
            vol: "$2.7m Vol.", date: "10 May 2026", time: "4:00 PM" },
          { league: "Premier League", leagueColor: "#3d195b",
            teams: [
              { name: "Tottenham", pct: "44%", color: "#fff", initial: "TOT" },
              { name: "Man United", pct: "37%", color: "#cf102c", initial: "MUN" },
            ],
            draw: { pct: "19%" },
            vol: "$2.3m Vol.", date: "10 May 2026", time: "6:30 PM" },
        ],
      },
    ],
  },
  "ligue-1": {
    slug: "ligue-1", label: "Ligue 1",
    filters: ["All", "Live", "Coupe de France", "Season", "Trophée"],
    sections: [
      {
        title: "Sat, May 9th",
        matches: [
          { league: "Ligue 1", leagueColor: "#091c3e", live: { mins: "52'" },
            teams: [
              { name: "PSG", pct: "71%", color: "#004170", initial: "PSG" },
              { name: "Marseille", pct: "18%", color: "#2fafe3", initial: "OM" },
            ],
            draw: { pct: "11%" },
            vol: "$1.9m Vol.", date: "9 May 2026", time: "9:00 PM" },
          { league: "Ligue 1", leagueColor: "#091c3e",
            teams: [
              { name: "Lyon", pct: "47%", color: "#fff", initial: "OL" },
              { name: "Monaco", pct: "36%", color: "#cf102c", initial: "ASM" },
            ],
            draw: { pct: "17%" },
            vol: "$1.1m Vol.", date: "10 May 2026", time: "5:00 PM" },
        ],
      },
    ],
  },
  "world-cup": {
    slug: "world-cup", label: "World Cup",
    filters: ["All", "Live", "Group Stage", "Knockout", "Finals"],
    sections: [
      {
        title: "Sat, May 9th",
        matches: [
          { league: "FIFA World Cup", leagueColor: c.spainRed, live: { mins: "67'" },
            teams: [
              { name: "Brazil", pct: "52%", color: "#0c5b3c", initial: "BRA", logo: flag("br") },
              { name: "Argentina", pct: "36%", color: "#74acdf", initial: "ARG", logo: flag("ar") },
            ],
            draw: { pct: "12%" },
            vol: "$4.2m Vol.", date: "9 May 2026", time: "8:00 PM" },
          { league: "FIFA World Cup", leagueColor: c.spainRed, live: { mins: "23'" },
            teams: [
              { name: "France", pct: "55%", color: "#1e58cd", initial: "FRA", logo: flag("fr") },
              { name: "Germany", pct: "31%", color: "#1c1d1f", initial: "GER", logo: flag("de") },
            ],
            draw: { pct: "14%" },
            vol: "$3.1m Vol.", date: "9 May 2026", time: "9:30 PM" },
        ],
      },
      {
        title: "Sun, May 10th",
        matches: [
          { league: "FIFA World Cup", leagueColor: c.spainRed,
            teams: [
              { name: "Spain", pct: "48%", color: "#cf102c", initial: "ESP", logo: flag("es") },
              { name: "England", pct: "39%", color: "#1e58cd", initial: "ENG", logo: flag("gb-eng") },
            ],
            draw: { pct: "13%" },
            vol: "$2.4m Vol.", date: "10 May 2026", time: "8:00 PM" },
          { league: "FIFA World Cup", leagueColor: c.spainRed,
            teams: [
              { name: "Mexico", pct: "34%", color: "#0c5b3c", initial: "MEX", logo: flag("mx") },
              { name: "USA", pct: "55%", color: "#1e58cd", initial: "USA", logo: flag("us") },
            ],
            draw: { pct: "11%" },
            vol: "$1.8m Vol.", date: "10 May 2026", time: "9:30 PM" },
        ],
      },
    ],
  },
  "cba": {
    slug: "cba", label: "CBA",
    filters: ["All", "Live", "Playoffs", "Regular", "Finals"],
    sections: [{
      title: "Sat, May 9th",
      matches: [
        { league: "CBA", leagueColor: c.surface2, live: { mins: "Q3" },
          teams: [
            { name: "Sharks", pct: "41%", color: "#cf102c", initial: "SHK" },
            { name: "Kirin", pct: "59%", color: "#1e58cd", initial: "KRN" },
          ],
          vol: "$0.9m Vol.", date: "9 May 2026", time: "7:00 PM" },
        { league: "CBA", leagueColor: c.surface2,
          teams: [
            { name: "Ducks", pct: "53%", color: "#facc15", initial: "DCK" },
            { name: "Tigers", pct: "47%", color: "#fc4c02", initial: "TGR" },
          ],
          vol: "$0.7m Vol.", date: "10 May 2026", time: "7:30 PM" },
      ],
    }],
  },
  "japan-b-league": {
    slug: "japan-b-league", label: "Japan B League",
    filters: ["All", "Live", "Playoffs", "Regular", "Finals"],
    sections: [{
      title: "Sat, May 9th",
      matches: [
        { league: "B League", leagueColor: "#bc002d", live: { mins: "Q1" },
          teams: [
            { name: "Brex", pct: "58%", color: "#facc15", initial: "BRX" },
            { name: "Alvark", pct: "42%", color: "#000", initial: "ALV" },
          ],
          vol: "$0.6m Vol.", date: "9 May 2026", time: "6:00 PM" },
        { league: "B League", leagueColor: "#bc002d",
          teams: [
            { name: "Diamond Dolphins", pct: "47%", color: "#1e58cd", initial: "DOL" },
            { name: "SeaHorses", pct: "53%", color: "#0c5b3c", initial: "SEA" },
          ],
          vol: "$0.5m Vol.", date: "10 May 2026", time: "5:00 PM" },
      ],
    }],
  },
  "lnb": {
    slug: "lnb", label: "LNB",
    filters: ["All", "Live", "Playoffs", "Regular", "Super 20"],
    sections: [{
      title: "Sat, May 9th",
      matches: [
        { league: "LNB", leagueColor: "#74acdf",
          teams: [
            { name: "Boca Juniors", pct: "55%", color: "#1e58cd", initial: "BOC" },
            { name: "Quimsa", pct: "45%", color: "#cf102c", initial: "QUI" },
          ],
          vol: "$0.4m Vol.", date: "9 May 2026", time: "9:00 PM" },
        { league: "LNB", leagueColor: "#74acdf",
          teams: [
            { name: "San Lorenzo", pct: "62%", color: "#0c5b3c", initial: "SAN" },
            { name: "Obras", pct: "38%", color: "#fff", initial: "OBR" },
          ],
          vol: "$0.3m Vol.", date: "10 May 2026", time: "10:00 PM" },
      ],
    }],
  },
  "greek-basketball": {
    slug: "greek-basketball", label: "Greek Basketball",
    filters: ["All", "Live", "Playoffs", "Regular", "Cup"],
    sections: [{
      title: "Sat, May 9th",
      matches: [
        { league: "Greek BL", leagueColor: "#0d5eaf", live: { mins: "Q2" },
          teams: [
            { name: "Olympiacos", pct: "60%", color: "#cf102c", initial: "OLY" },
            { name: "Panathinaikos", pct: "40%", color: "#0c5b3c", initial: "PAO" },
          ],
          vol: "$0.8m Vol.", date: "9 May 2026", time: "8:00 PM" },
        { league: "Greek BL", leagueColor: "#0d5eaf",
          teams: [
            { name: "PAOK", pct: "53%", color: "#000", initial: "PAOK" },
            { name: "AEK", pct: "47%", color: "#facc15", initial: "AEK" },
          ],
          vol: "$0.4m Vol.", date: "10 May 2026", time: "7:00 PM" },
      ],
    }],
  },
  "khl": {
    slug: "khl", label: "KHL",
    filters: ["All", "Live", "Playoffs", "Regular", "Gagarin Cup"],
    sections: [{
      title: "Sat, May 9th",
      matches: [
        { league: "KHL", leagueColor: "#003f87", live: { mins: "P2" },
          teams: [
            { name: "CSKA Moscow", pct: "57%", color: "#cf102c", initial: "CSKA" },
            { name: "SKA SPb", pct: "43%", color: "#1d3a8a", initial: "SKA" },
          ],
          vol: "$0.6m Vol.", date: "9 May 2026", time: "6:00 PM" },
        { league: "KHL", leagueColor: "#003f87",
          teams: [
            { name: "Ak Bars", pct: "49%", color: "#0c5b3c", initial: "AKB" },
            { name: "Metallurg", pct: "51%", color: "#facc15", initial: "MMG" },
          ],
          vol: "$0.4m Vol.", date: "10 May 2026", time: "5:30 PM" },
      ],
    }],
  },
  "shl": {
    slug: "shl", label: "SHL",
    filters: ["All", "Live", "Playoffs", "Regular", "Final"],
    sections: [{
      title: "Sat, May 9th",
      matches: [
        { league: "SHL", leagueColor: "#006aa7",
          teams: [
            { name: "Frölunda", pct: "53%", color: "#cf102c", initial: "FHC" },
            { name: "Färjestad", pct: "47%", color: "#facc15", initial: "FBK" },
          ],
          vol: "$0.3m Vol.", date: "9 May 2026", time: "7:00 PM" },
        { league: "SHL", leagueColor: "#006aa7",
          teams: [
            { name: "Skellefteå", pct: "61%", color: "#fff", initial: "SAIK" },
            { name: "Luleå", pct: "39%", color: "#000", initial: "LHF" },
          ],
          vol: "$0.5m Vol.", date: "10 May 2026", time: "6:30 PM" },
      ],
    }],
  },
  "argentina-serie-a": {
    slug: "argentina-serie-a", label: "Argentina Serie A",
    filters: ["All", "Live", "Apertura", "Clausura", "Copa Argentina"],
    sections: [{
      title: "Sat, May 9th",
      matches: [
        { league: "Liga Argentina", leagueColor: "#74acdf",
          teams: [
            { name: "River Plate", pct: "54%", color: "#cf102c", initial: "RIV", logo: flag("ar") },
            { name: "Boca Juniors", pct: "31%", color: "#1e58cd", initial: "BOC", logo: flag("ar") },
          ],
          draw: { pct: "15%" },
          vol: "$1.1m Vol.", date: "9 May 2026", time: "10:00 PM" },
        { league: "Liga Argentina", leagueColor: "#74acdf",
          teams: [
            { name: "Racing", pct: "48%", color: "#74acdf", initial: "RAC" },
            { name: "Independiente", pct: "37%", color: "#cf102c", initial: "IND" },
          ],
          draw: { pct: "15%" },
          vol: "$0.6m Vol.", date: "10 May 2026", time: "8:00 PM" },
      ],
    }],
  },
};
