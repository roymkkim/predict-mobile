import { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import { accessibleColor, colors } from "@/lib/sim/colors";
import { useFeedSettings } from "@/lib/sim/FeedSettingsContext";
import { useLiveCueColors } from "@/lib/sim/LiveCueColorContext";
import { SCORE_FADE_MS, SCORE_HOLD_MS } from "@/lib/sim/scoreCue";
import { useLiveClock } from "@/lib/sim/useLiveClock";
import { useUxrMode } from "@/lib/sim/uxrModeStore";
import type { Match } from "@/lib/sim/types";
import { LiveTimestamp } from "./LiveTimestamp";

// Crossfade duration for swapping between the live clock and the scorer callout.
const FADE_MS = SCORE_FADE_MS;
// Minimum time "<team> scored" stays fully on screen before transitioning back
// to the live dot + clock. Product spec: at least 2 seconds. Shared with the
// glow/accent so all three revert together.
const CALLOUT_HOLD_MS = SCORE_HOLD_MS;

type Callout = { label: string; color: string };

// The top status line of a live card: a pulsing live dot + ticking clock. When
// the "scorer callout" setting is on and a team scores (driven by `glow`), the
// dot + clock fade out and are replaced by "<team> scored" in the team color for
// >= 2s, then fade back to the live dot + clock.
export function LiveStatusLine({
  match,
  animate,
  fontSize,
  align = "left",
  glow,
  stacked = false,
  livePrefix = false,
}: {
  match: Match;
  animate: boolean;
  fontSize: number;
  // When true, render the live status as two lines: dot + "LIVE" on top, the
  // period/clock muted below (the centered-layout two-line format). When false
  // (default), render the single inline line (dot + clock).
  stacked?: boolean;
  // When true (and not stacked), prefix the inline clock with "Live • " — the
  // single-line "LIVE included" treatment used on standard cards.
  livePrefix?: boolean;
  // "center" centers the dot + text as a unit within its container. Combined with
  // tabular-nums on the clock, the centered block stays put as the clock ticks
  // (constant width); only the infrequent "<team> scored" callout swap recenters,
  // and that crossfades. The host column (VersusCard's score-row center) is
  // content-sized (flex-shrink-0) so the dot + clock never truncate.
  align?: "left" | "center";
  glow: { team: number; key: number } | null;
}) {
  const liveMins = useLiveClock(match.live?.mins ?? "", animate);
  const cue = useLiveCueColors();
  const { scorerCallout } = useFeedSettings();
  const uxr = useUxrMode() === "uxr";

  const [callout, setCallout] = useState<Callout | null>(null);
  const opacity = useRef(new Animated.Value(1)).current;
  const lastKey = useRef<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Cancellation token: every new sequence / teardown bumps `seq`, which
  // invalidates any in-flight animation/timeout callbacks from a prior run.
  const seq = useRef(0);
  const mounted = useRef(true);

  // Cancel any in-flight transition: invalidate pending callbacks, clear timers,
  // and stop the active opacity animation.
  const cancel = () => {
    seq.current += 1;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    opacity.stopAnimation();
  };

  useEffect(() => {
    if (!scorerCallout || !glow) return;
    if (glow.key === lastKey.current) return;
    lastKey.current = glow.key;
    const team = match.teams[glow.team];
    if (!team) return;
    const next: Callout = { label: `${team.name} scored`, color: accessibleColor(team.color) };

    cancel();
    const mySeq = seq.current;
    const alive = () => mounted.current && seq.current === mySeq;

    // Fade the current line out, swap to the callout, fade it in.
    Animated.timing(opacity, { toValue: 0, duration: FADE_MS, useNativeDriver: true }).start(({ finished }) => {
      if (!finished || !alive()) return;
      setCallout(next);
      Animated.timing(opacity, { toValue: 1, duration: FADE_MS, useNativeDriver: true }).start();
    });
    // After the callout has been fully visible for CALLOUT_HOLD_MS, fade it out
    // and restore the live dot + clock.
    const back = setTimeout(() => {
      if (!alive()) return;
      Animated.timing(opacity, { toValue: 0, duration: FADE_MS, useNativeDriver: true }).start(({ finished }) => {
        if (!finished || !alive()) return;
        setCallout(null);
        Animated.timing(opacity, { toValue: 1, duration: FADE_MS, useNativeDriver: true }).start();
      });
    }, 2 * FADE_MS + CALLOUT_HOLD_MS);
    timers.current.push(back);
  }, [glow?.key, scorerCallout]); // eslint-disable-line react-hooks/exhaustive-deps

  // Turning the toggle off restores the live line immediately, cancelling any
  // in-flight transition regardless of its current phase.
  useEffect(() => {
    if (scorerCallout) return;
    cancel();
    setCallout(null);
    opacity.setValue(1);
  }, [scorerCallout]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cancel();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const color = callout ? callout.color : cue.color;
  const label = callout ? callout.label : liveMins;

  if (stacked) {
    // Two-line format: dot + "LIVE" (cue color) on top, the period/clock (or the
    // scorer callout) muted below. The dot/label keep the cue color so the "LIVE"
    // label stays the live accent even while the clock line reads as metadata.
    return (
      <Animated.View style={{ opacity, alignItems: align === "center" ? "center" : "flex-start" }}>
        <LiveTimestamp
          descriptor={label}
          variant="stacked"
          liveColor={cue.color}
          descriptorColor={callout ? callout.color : colors.textMuted}
          fontSize={uxr ? 12 : fontSize}
          align={align}
          pulse={!callout}
          uppercaseDescriptor={uxr && !callout}
        />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={{
        opacity,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        // Center the dot + text as a unit when align="center".
        justifyContent: align === "center" ? "center" : "flex-start",
      }}
    >
      {uxr && !callout ? (
        <LiveTimestamp
          descriptor={label}
          variant="linear"
          liveColor={cue.color}
          descriptorColor={colors.textMuted}
          fontSize={12}
          align={align}
          pulse
          uppercaseDescriptor
        />
      ) : (
        <LiveTimestamp
          descriptor={livePrefix && !callout ? `• ${label}` : label}
          variant="linear"
          liveColor={callout ? color : cue.color}
          descriptorColor={callout ? color : colors.textMuted}
          fontSize={fontSize}
          align={align}
          pulse={!callout}
          showLiveLabel={!callout}
        />
      )}
    </Animated.View>
  );
}
