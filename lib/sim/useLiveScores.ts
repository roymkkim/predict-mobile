import { useState, useEffect, useRef } from "react";
import { useLiveTick } from "./LiveTickContext";
import { SCORE_CUE_MS } from "./scoreCue";
import type { Match } from "./types";

const FLASH_MS = 280;

const SCORING: Record<string, { prob: number; inc: number[] }> = {
  basketball: { prob: 0.5, inc: [2, 2, 2, 3] },
  americanFootball: { prob: 0.32, inc: [3, 7] },
  hockey: { prob: 0.22, inc: [1] },
  soccer: { prob: 0.7, inc: [1] },
  baseball: { prob: 0.22, inc: [1, 1, 2] },
  rugby: { prob: 0.3, inc: [3, 5, 7] },
  aussieRules: { prob: 0.42, inc: [1, 6] },
  esports: { prob: 0.16, inc: [1] },
};
const DEFAULT_SCORING = { prob: 0.25, inc: [1] };

// Upper bound on a team's running score for sports where unbounded ticking would
// drift unrealistically high. basketball caps at ~120 points; American football
// at ~56 points (a believable high NFL final); soccer at 6 goals.
const SCORE_CAP: Record<string, number> = {
  basketball: 120,
  americanFootball: 56,
  soccer: 6,
};

const TENNIS_PROB = 0.7;
const TENNIS_POINTS = ["0", "15", "30", "40"];

function parsePoint(s?: string): number {
  if (s === "15") return 1;
  if (s === "30") return 2;
  if (s === "40") return 3;
  if (s === "Ad" || s === "AD" || s === "AD.") return 4;
  return 0;
}

function tennisDisplay(p: number): string {
  return p === 4 ? "Ad" : TENNIS_POINTS[p] ?? "0";
}

// A set is complete once a player reaches 6 games with a 2-game lead, or 7 games
// (covering the 7-5 and tiebreak 7-6 cases). Keeps each set's game count in the
// realistic 0-7 range instead of letting the active set climb without bound.
function setComplete(a: number, b: number): boolean {
  const hi = Math.max(a, b);
  return (hi >= 6 && Math.abs(a - b) >= 2) || hi >= 7;
}

// Best-of-5: how many completed sets each side has won. Used to stop the match
// (and freeze the scoreline) once a player wins 3 sets.
function setsWon(sets: number[][]): [number, number] {
  let a = 0;
  let b = 0;
  const len = Math.max(sets[0]?.length ?? 0, sets[1]?.length ?? 0);
  for (let i = 0; i < len; i++) {
    const x = sets[0][i] ?? 0;
    const y = sets[1][i] ?? 0;
    if (!setComplete(x, y)) continue;
    if (x > y) a += 1;
    else if (y > x) b += 1;
  }
  return [a, b];
}

function awardTennisPoint(pts: number[], w: number, sets: number[][]): boolean {
  // Match already decided (someone has won 3 sets) — freeze the scoreline.
  const [wonA, wonB] = setsWon(sets);
  if (wonA >= 3 || wonB >= 3) return false;

  const l = w === 0 ? 1 : 0;
  let game = false;
  if (pts[w] === 4) {
    game = true;
  } else if (pts[w] === 3) {
    if (pts[l] < 3) game = true;
    else if (pts[l] === 3) pts[w] = 4;
    else pts[l] = 3;
  } else {
    pts[w] += 1;
  }
  if (game) {
    const last = sets[w].length - 1;
    if (last >= 0) {
      sets[w][last] += 1;
      // If that game won the set, open a fresh 0-0 set (unless the match is now
      // decided), so games never accumulate past a realistic set total.
      if (setComplete(sets[w][last], sets[l][last] ?? 0)) {
        const [a, b] = setsWon(sets);
        if (a < 3 && b < 3) {
          sets[0].push(0);
          sets[1].push(0);
        }
      }
    }
    pts[0] = 0;
    pts[1] = 0;
  }
  return game;
}

function pickWinner(pcts: number[]): number {
  const total = (pcts[0] ?? 0) + (pcts[1] ?? 0) || 1;
  return Math.random() * total < (pcts[0] ?? 0) ? 0 : 1;
}

export type ScoreAnim = {
  values: string[];
  flash: boolean[];
  sets: number[][];
  activeSetIdx: number;
  /**
   * Set for ~SCORE_CUE_MS after a team scores: `team` is the scorer's index and
   * `key` is a monotonic id so a re-score retriggers the glow animation. Null
   * when no glow is active. Drives the "score glow" border cue, the team-colored
   * callout, and the suppression of the resting accent — all share this lifetime
   * so they revert together.
   */
  glow: { team: number; key: number } | null;
};

export function useLiveScores(match: Match, active: boolean): ScoreAnim {
  const tick = useLiveTick();
  const teams = match.teams;
  const sport = match.sport ?? "";
  const isTennis = sport === "tennis";
  const isInt = teams.every((t) => typeof t.score === "number");
  const animatable = active && !!match.live && (isTennis || isInt);

  const seedValues = teams.map((t) => t.scoreText ?? (t.score != null ? String(t.score) : ""));
  const seedSets = teams.map((t) => [...(t.setScores ?? [])]);

  const [values, setValues] = useState<string[]>(seedValues);
  const [flash, setFlash] = useState<boolean[]>(teams.map(() => false));
  const [sets, setSets] = useState<number[][]>(seedSets);
  const [glow, setGlow] = useState<{ team: number; key: number } | null>(null);
  const glowKey = useRef(0);

  const valuesRef = useRef<string[]>(seedValues);
  const setsRef = useRef<number[][]>(seedSets.map((a) => [...a]));
  const ptsRef = useRef<number[]>([parsePoint(teams[0]?.scoreText), parsePoint(teams[1]?.scoreText)]);
  const scoresRef = useRef<number[]>(teams.map((t) => t.score ?? 0));
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAll = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => {
    if (!active) {
      const v = teams.map((t) => t.scoreText ?? (t.score != null ? String(t.score) : ""));
      const s = teams.map((t) => [...(t.setScores ?? [])]);
      valuesRef.current = v;
      setsRef.current = s.map((a) => [...a]);
      ptsRef.current = [parsePoint(teams[0]?.scoreText), parsePoint(teams[1]?.scoreText)];
      scoresRef.current = teams.map((t) => t.score ?? 0);
      setValues(v);
      setSets(s);
      setFlash(teams.map(() => false));
      setGlow(null);
      clearAll();
    }
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!animatable) return;
    const pcts = teams.map((t) => parseFloat(t.pct) || 0);
    let changed = -1;

    if (isTennis) {
      // Once a player has won 3 sets the match is over — skip the whole update
      // so no further points, flash, or glow cues fire on a finished match.
      const [wonA, wonB] = setsWon(setsRef.current);
      const decided = wonA >= 3 || wonB >= 3;
      if (!decided && Math.random() < TENNIS_PROB) {
        const w = pickWinner(pcts);
        awardTennisPoint(ptsRef.current, w, setsRef.current);
        const nv = [tennisDisplay(ptsRef.current[0]), tennisDisplay(ptsRef.current[1])];
        valuesRef.current = nv;
        setValues(nv);
        setSets(setsRef.current.map((a) => [...a]));
        changed = w;
      }
    } else {
      const cfg = SCORING[sport] ?? DEFAULT_SCORING;
      const cap = SCORE_CAP[sport];
      if (Math.random() < cfg.prob) {
        const w = pickWinner(pcts);
        const inc = cfg.inc[Math.floor(Math.random() * cfg.inc.length)];
        const next = scoresRef.current[w] + inc;
        if (cap == null || next <= cap) {
          scoresRef.current[w] = next;
          const nv = [...valuesRef.current];
          nv[w] = String(scoresRef.current[w]);
          valuesRef.current = nv;
          setValues(nv);
          changed = w;
        }
      }
    }

    if (changed >= 0) {
      const idx = changed;
      setFlash((prev) => {
        const f = [...prev];
        f[idx] = true;
        return f;
      });
      const off = setTimeout(() => {
        setFlash((prev) => {
          const f = [...prev];
          f[idx] = false;
          return f;
        });
      }, FLASH_MS);
      timers.current.push(off);

      glowKey.current += 1;
      const gk = glowKey.current;
      setGlow({ team: idx, key: gk });
      const glowOff = setTimeout(() => {
        setGlow((prev) => (prev && prev.key === gk ? null : prev));
      }, SCORE_CUE_MS);
      timers.current.push(glowOff);
    }

    return clearAll;
  }, [tick, animatable]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeSetIdx = isTennis && (sets[0]?.length ?? 0) > 0 ? sets[0].length - 1 : -1;
  return { values, flash, sets, activeSetIdx, glow };
}
