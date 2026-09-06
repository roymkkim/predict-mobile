import { useEffect, useState } from "react";

// A clock token like "7:42" or "12:00" embedded anywhere in the label.
const CLOCK_RE = /\b(\d{1,2}):(\d{2})\b/;
// A soccer-style elapsed-minute token like "57'".
const MINUTE_RE = /\b(\d{1,3})'/;

// Animates a live time label so it ticks in real time when animations are on.
export function useLiveClock(label: string, active: boolean): string {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setElapsed(0);
    if (!active) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [active, label]);

  if (!active || elapsed === 0) return label;

  const clock = label.match(CLOCK_RE);
  if (clock) {
    const total = parseInt(clock[1], 10) * 60 + parseInt(clock[2], 10);
    const remaining = Math.max(0, total - elapsed);
    const mm = Math.floor(remaining / 60);
    const ss = remaining % 60;
    return label.replace(CLOCK_RE, `${mm}:${ss.toString().padStart(2, "0")}`);
  }

  const minute = label.match(MINUTE_RE);
  if (minute) {
    const next = Math.min(120, parseInt(minute[1], 10) + Math.floor(elapsed / 60));
    return label.replace(MINUTE_RE, `${next}'`);
  }

  return label;
}
