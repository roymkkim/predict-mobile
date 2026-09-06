import type { ImageSourcePropType } from "react-native";

import type { ComboPreview } from "@/lib/sim/comboData";

export const EVENT_PICKS_GUTTER = 16;
export const EVENT_PICKS_CAROUSEL_CARD = 300;

/** One card fills the row (16px gutters). Two or more keep the peeking carousel. */
export function eventPicksCardWidth(winW: number, count: number, gutter = EVENT_PICKS_GUTTER): number {
  if (count <= 1) return Math.max(0, winW - gutter * 2);
  return EVENT_PICKS_CAROUSEL_CARD;
}

export type EventComboSource = {
  names: string[];
  sport?: string;
  league?: string;
  logos?: (string | undefined)[];
  vol?: string;
};

function uriAvatar(url: string | undefined): ImageSourcePropType | undefined {
  return url ? { uri: url } : undefined;
}

function vsCopy(home: string, away: string): string {
  return `${home} vs ${away}`;
}

function gameLineRows(home: string, away: string, sport: string | undefined): string[] {
  const vs = vsCopy(home, away);
  const key = (sport ?? "").toLowerCase().replace(/[^a-z]/g, "");
  if (key === "soccer") {
    return [`${home} · ${vs}`, `Draw · ${vs}`, `Over 2.5 · ${vs}`];
  }
  if (key.includes("basketball")) {
    return [`${home} · ${vs}`, `${home} -4.5 · ${vs}`, `Over 215.5 · ${vs}`];
  }
  if (key.includes("tennis")) {
    return [`${home} · ${vs}`, `${home} to win first set · ${vs}`, `Over 21.5 games · ${vs}`];
  }
  if (key.includes("baseball")) {
    return [`${home} · ${vs}`, `${home} -1.5 · ${vs}`, `Over 8.5 · ${vs}`];
  }
  if (key.includes("mma") || key.includes("ufc")) {
    return [`${home} · ${vs}`, `${home} by KO/TKO · ${vs}`, `Over 2.5 rounds · ${vs}`];
  }
  return [`${home} · ${vs}`, `${home} -3.5 · ${vs}`, `Over 44.5 · ${vs}`];
}

function propRows(home: string, away: string, sport: string | undefined): string[] {
  const vs = vsCopy(home, away);
  const key = (sport ?? "").toLowerCase().replace(/[^a-z]/g, "");
  if (key === "soccer") {
    return [`Both teams to score · ${vs}`, `${home} to score first · ${vs}`, `Over 2.5 goals · ${vs}`];
  }
  if (key.includes("tennis")) {
    return [`Match goes to a deciding set? · ${vs}`, `${home} wins first set · ${vs}`, `Any set decided by tiebreak? · ${vs}`];
  }
  return [
    `${home} wins by 5+? · ${vs}`,
    `${away} takes an early lead? · ${vs}`,
    `Lead changes 3+ times? · ${vs}`,
  ];
}

/** Game lines + props for this event only — never another match’s parlay. */
export function buildEventComboPreviews(match: EventComboSource): ComboPreview[] {
  const home = match.names[0]?.trim();
  const away = match.names[1]?.trim();
  if (!home || !away) return [];
  const sport = match.sport;
  const homeMark = uriAvatar(match.logos?.[0]);
  const awayMark = uriAvatar(match.logos?.[1]);
  const league = match.league?.trim() || "Game lines";
  return [
    {
      label: league,
      vol: match.vol ?? "$1.2M Vol.",
      rows: gameLineRows(home, away, sport),
      avatars: [homeMark, homeMark, homeMark],
      more: 0,
    },
    {
      label: "Props",
      vol: "$88K Vol.",
      rows: propRows(home, away, sport),
      avatars: [homeMark, awayMark, homeMark],
      more: 0,
    },
  ];
}
