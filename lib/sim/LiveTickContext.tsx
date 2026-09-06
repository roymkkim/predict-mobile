import { createContext, useContext, useEffect, useState } from "react";

const LiveTickContext = createContext(0);

// Fixed delay between global ticks — price updates fire every 5s. The whole
// live-odds cascade must complete within this window, otherwise the next tick's
// clearAll() cancels any not-yet-fired stagger timers and lower cards freeze
// after the first wave. At 5s there's ample room for the full-page 150ms cascade.
export const TICK_MIN_MS = 5000;

export function LiveTickProvider({ children }: { children: React.ReactNode }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const next = () => {
      t = setTimeout(() => {
        setTick((n) => n + 1);
        next();
      }, TICK_MIN_MS);
    };
    next();
    return () => clearTimeout(t);
  }, []);
  return <LiveTickContext.Provider value={tick}>{children}</LiveTickContext.Provider>;
}

export const useLiveTick = () => useContext(LiveTickContext);
