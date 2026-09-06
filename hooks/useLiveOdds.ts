import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

export function useLiveOdds(
  initial: number[],
  opts?: {
    intervalMs?: number;
    durationMs?: number;
    jitter?: number;
    preserveSum?: boolean;
    minVal?: number;
    maxVal?: number;
  },
) {
  const intervalMs = opts?.intervalMs ?? 2800;
  const durationMs = opts?.durationMs ?? 900;
  const jitter = opts?.jitter ?? 1.4;
  const preserveSum = opts?.preserveSum ?? true;
  const minVal = opts?.minVal ?? 1;
  const maxVal = opts?.maxVal ?? 99;

  const animsRef = useRef<Animated.Value[] | null>(null);
  if (!animsRef.current) {
    animsRef.current = initial.map((v) => new Animated.Value(v));
  }
  const valuesRef = useRef<number[]>([...initial]);

  useEffect(() => {
    const anims = animsRef.current!;
    const listenerIds = anims.map((a, i) =>
      a.addListener(({ value }) => {
        valuesRef.current[i] = value;
      }),
    );
    const sumOrig = initial.reduce((a, b) => a + b, 0);
    const tick = () => {
      const current = [...valuesRef.current];
      const deltas = current.map(() => (Math.random() * 2 - 1) * jitter);
      let next = current.map((v, i) => v + deltas[i]);
      if (preserveSum) {
        const sumNext = next.reduce((a, b) => a + b, 0);
        const diff = sumNext - sumOrig;
        next = next.map((v) => v - diff / next.length);
      }
      next = next.map((v) => Math.max(minVal, Math.min(maxVal, v)));
      Animated.parallel(
        anims.map((a, i) =>
          Animated.timing(a, {
            toValue: next[i],
            duration: durationMs,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
        ),
      ).start();
    };
    const id = setInterval(tick, intervalMs);
    return () => {
      clearInterval(id);
      anims.forEach((a, i) => a.removeListener(listenerIds[i]));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, durationMs, jitter, preserveSum, minVal, maxVal]);

  return animsRef.current!;
}
