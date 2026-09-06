import type { ImageSourcePropType } from "react-native";

import { ALL_COMBO_PREVIEWS, COMBO_CATEGORIES, COMBO_OUTCOME_MARKS, comboTeamMark } from "@/lib/sim/comboData";
import * as data from "@/lib/sim/data";
import type { Match, OutcomeAvatar, PoliticsMarket, Team } from "@/lib/sim/types";

type Mark = { name: string; abbr?: string; source: ImageSourcePropType };

function outcomeSource(avatar?: OutcomeAvatar): ImageSourcePropType | undefined {
  if (avatar?.type === "image") return avatar.source;
  return undefined;
}

function teamSource(team: { logo?: string; flag?: string; photo?: ImageSourcePropType }): ImageSourcePropType | undefined {
  if (team.photo) return team.photo;
  if (team.logo) return { uri: team.logo };
  if (team.flag) {
    const f = team.flag;
    return { uri: f.startsWith("http") ? f : `https://flagcdn.com/w80/${f}.png` };
  }
  return undefined;
}

function collectMarks(): Mark[] {
  const out: Mark[] = [];
  const push = (name: string, source?: ImageSourcePropType, abbr?: string) => {
    if (!source || !name) return;
    out.push({ name, source, abbr });
  };

  for (const v of Object.values(data)) {
    if (!v || typeof v !== "object" || Array.isArray(v)) continue;
    if ("teams" in v && Array.isArray((v as Match).teams)) {
      for (const t of (v as Match).teams) {
        push(t.name, teamSource(t), t.abbr);
      }
    }
    if ("outcomes" in v && Array.isArray((v as PoliticsMarket).outcomes)) {
      for (const o of (v as PoliticsMarket).outcomes) {
        push(o.label, outcomeSource(o.avatar), o.abbr);
      }
    }
  }

  for (const cat of COMBO_CATEGORIES) {
    for (const g of cat.games) {
      for (const t of g.teams) {
        push(t.name, comboTeamMark(t) ?? teamSource(t), t.abbr);
      }
    }
  }

  for (const preview of ALL_COMBO_PREVIEWS) {
    preview.rows.forEach((row, i) => {
      const sep = row.indexOf("·");
      const headline = (sep < 0 ? row : row.slice(0, sep)).trim();
      const market = sep < 0 ? "" : row.slice(sep + 1).trim();
      const vs = market.split(/\s+vs\.?\s+/i);
      push(headline, preview.avatars?.[i] ?? COMBO_OUTCOME_MARKS[headline]);
      if (vs.length === 2) {
        push(vs[0].trim(), COMBO_OUTCOME_MARKS[vs[0].trim()]);
        push(vs[1].trim(), COMBO_OUTCOME_MARKS[vs[1].trim()]);
      }
    });
  }

  for (const [name, source] of Object.entries(COMBO_OUTCOME_MARKS)) {
    push(name, source);
  }

  return out;
}

let cache: Mark[] | undefined;

function marks(): Mark[] {
  if (!cache) cache = collectMarks();
  return cache;
}

export function comboAvatarFromTeam(team?: Pick<Team, "logo" | "flag" | "photo">): ImageSourcePropType | undefined {
  return team ? teamSource(team) : undefined;
}

export function comboHeadlineName(label: string): string {
  const sep = label.indexOf("·");
  const headline = (sep < 0 ? label : label.slice(0, sep)).trim();
  return headline.replace(/\s+[+\-]?\d+(?:\.\d+)?$/, "").trim();
}

function matchupNames(label: string): { home: string; away: string } | null {
  const sep = label.indexOf("·");
  const market = sep < 0 ? "" : label.slice(sep + 1).trim();
  const vs = market.split(/\s+vs\.?\s+/i);
  if (vs.length !== 2) return null;
  return { home: vs[0].trim(), away: vs[1].trim() };
}

function lookupMark(name: string): ImageSourcePropType | undefined {
  if (!name) return undefined;
  const lower = name.toLowerCase();
  const list = marks();
  const exact = list.find((m) => m.name.toLowerCase() === lower || m.abbr?.toLowerCase() === lower);
  if (exact) return exact.source;
  const loose = list.find((m) => {
    const n = m.name.toLowerCase();
    const a = m.abbr?.toLowerCase();
    return n.startsWith(lower) || lower.startsWith(n) || (a != null && (a.startsWith(lower) || lower.startsWith(a)));
  });
  return loose?.source;
}

export function resolveComboAvatar(label: string, source?: ImageSourcePropType): ImageSourcePropType | undefined {
  const q = comboHeadlineName(label);
  if (/^draw$/i.test(q)) return source ?? COMBO_OUTCOME_MARKS.Draw;
  if (/^(over|under|o|u)$/i.test(q)) {
    const sides = matchupNames(label);
    if (sides) {
      const fromMatchup = lookupMark(/^(over|o)$/i.test(q) ? sides.home : sides.away);
      if (fromMatchup) return fromMatchup;
    }
  }
  const fromHead = lookupMark(q);
  if (fromHead) return fromHead;
  return source;
}
