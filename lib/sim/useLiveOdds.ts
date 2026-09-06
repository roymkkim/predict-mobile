import { useState, useEffect, useRef } from "react";
import { useLiveTick, TICK_MIN_MS } from "./LiveTickContext";

export type FlashDir = "up" | "down" | null;

function nudgeVals(prev: number[]): { next: number[]; dirs: FlashDir[] } {
  const n = prev.length;
  if (n < 2) return { next: prev, dirs: prev.map(() => null) };

  const i = Math.floor(Math.random() * n);
  const magnitude = 1 + Math.random() * 2.5;
  const sign = Math.random() > 0.5 ? 1 : -1;

  const newVals = [...prev];
  newVals[i] = Math.min(Math.max(prev[i] + sign * magnitude, 3), 95);
  const actualDelta = newVals[i] - prev[i];

  if (Math.abs(actualDelta) < 0.1) return { next: prev, dirs: prev.map(() => null) };

  const each = -actualDelta / (n - 1);
  for (let j = 0; j < n; j++) {
    if (j === i) continue;
    newVals[j] = Math.max(prev[j] + each, 1);
  }

  const dirs: FlashDir[] = newVals.map((v, idx) =>
    Math.abs(v - prev[idx]) < 0.05 ? null : v > prev[idx] ? "up" : "down",
  );

  return { next: newVals, dirs };
}

export const ROW_STAGGER_MS = 150;
const COUNT_STEP_MS = 16;
const MAX_CASCADE_DELAY_MS = TICK_MIN_MS - 300;

export function useLiveOdds(
  initialVals: number[],
  active: boolean,
  baseDelayMs = 0,
  staggerMs = ROW_STAGGER_MS,
) {
  const tick = useLiveTick();

  const [vals, setVals] = useState<number[]>(initialVals);
  const [displayVals, setDisplayVals] = useState<number[]>(initialVals.map(Math.round));
  const [flash, setFlash] = useState<FlashDir[]>(initialVals.map(() => null));

  const currentRef = useRef<number[]>(initialVals);
  const displayRef = useRef<number[]>(initialVals.map(Math.round));
  const allTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const allIntervals = useRef<ReturnType<typeof setInterval>[]>([]);

  const clearAll = () => {
    allTimers.current.forEach(clearTimeout);
    allIntervals.current.forEach(clearInterval);
    allTimers.current = [];
    allIntervals.current = [];
  };

  useEffect(() => {
    if (!active) {
      currentRef.current = initialVals;
      displayRef.current = initialVals.map(Math.round);
      setVals(initialVals);
      setDisplayVals(initialVals.map(Math.round));
      setFlash(initialVals.map(() => null));
      clearAll();
    }
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!active) return;

    const { next, dirs } = nudgeVals(currentRef.current);
    currentRef.current = next;
    setVals([...next]);

    clearAll();

    dirs.forEach((dir, i) => {
      if (!dir) return;

      const staggerTimer = setTimeout(() => {
        const target = Math.round(next[i]);
        const from = displayRef.current[i];
        if (from === target) return;

        const step = target > from ? 1 : -1;
        let cur = from;

        setFlash((prev) => {
          const f = [...prev];
          f[i] = dir;
          return f;
        });

        const counter = setInterval(() => {
          cur += step;
          displayRef.current[i] = cur;
          setDisplayVals((prev) => {
            const d = [...prev];
            d[i] = cur;
            return d;
          });

          if (cur === target) {
            clearInterval(counter);
            const offTimer = setTimeout(() => {
              setFlash((prev) => {
                const f = [...prev];
                f[i] = null;
                return f;
              });
            }, 150);
            allTimers.current.push(offTimer);
          }
        }, COUNT_STEP_MS);

        allIntervals.current.push(counter);
      }, Math.min(baseDelayMs + i * staggerMs, MAX_CASCADE_DELAY_MS));

      allTimers.current.push(staggerTimer);
    });

    return clearAll;
  }, [tick, active, staggerMs, baseDelayMs]); // eslint-disable-line react-hooks/exhaustive-deps

  return { vals, displayVals, flash };
}
