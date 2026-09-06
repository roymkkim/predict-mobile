import { useEffect, useState } from "react";

export function useLiveScore(
  initial: number,
  opts?: {
    intervalMs?: number;
    chance?: number;
    increment?: () => number;
  },
) {
  const intervalMs = opts?.intervalMs ?? 8000;
  const chance = opts?.chance ?? 0.5;
  const increment = opts?.increment ?? (() => 1);
  const [score, setScore] = useState(initial);
  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() < chance) setScore((s) => s + increment());
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, chance, increment]);
  return score;
}
