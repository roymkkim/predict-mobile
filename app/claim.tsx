import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, {
  Circle as SvgCircle,
  Defs,
  Ellipse as SvgEllipse,
  LinearGradient as SvgLinearGradient,
  Polygon as SvgPolygon,
  RadialGradient as SvgRadialGradient,
  Rect as SvgRect,
  Stop as SvgStop,
  Text as SvgText,
} from "react-native-svg";

const SCREEN_W = Dimensions.get("window").width;
const SCREEN_H = Dimensions.get("window").height;
const HERO_SIZE = Math.min(SCREEN_W, 460);
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "@/lib/sim/haptics";

import colors from "@/constants/colors";
import { geist } from "@/lib/sim/geistFonts";

const c = colors.light;
const REWARD_AMOUNT = 46.12;

const BREAKDOWN: { label: string; sub: string; amount: number; color: string }[] = [
  { label: "OpenAI ≥ $200B by 2026", sub: "Position closed · won", amount: 21.03, color: c.green },
  { label: "Bitcoin Up · 5m", sub: "Streak bonus ×3", amount: 18.55, color: c.bitcoin },
  { label: "Daily login", sub: "7-day streak", amount: 6.77, color: c.accent },
];

// --- 3D coin tokens (rendered as SVG so they always look crisp + branded) ---
type CoinKind = "gold" | "btc" | "eth" | "dollar" | "gem";

const COIN_DEF: Record<
  CoinKind,
  { hi: string; mid: string; lo: string; ring: string; sym: string; symColor: string }
> = {
  gold:   { hi: "#fff2a8", mid: "#f3c83a", lo: "#7a4f08", ring: "#a87a14", sym: "¢", symColor: "#5a3a06" },
  btc:    { hi: "#ffd9a8", mid: "#f7931a", lo: "#5a3000", ring: "#a85e10", sym: "₿", symColor: "#ffffff" },
  eth:    { hi: "#bcc4ff", mid: "#4459ff", lo: "#0e1a6b", ring: "#2a3ab8", sym: "Ξ", symColor: "#ffffff" },
  dollar: { hi: "#e6ffb0", mid: c.green, lo: "#3a5810", ring: "#7fae20", sym: "$", symColor: "#2c4108" },
  gem:    { hi: "#dffaff", mid: "#4dd6ff", lo: "#0a4a5e", ring: "#2a8db0", sym: "",  symColor: "#0a4a5e" },
};

// Weighted picks: mostly coins, occasional gem
const PARTICLE_POOL: CoinKind[] = ["gold", "btc", "eth", "dollar", "gold", "btc", "dollar", "gem"];

function Coin3D({ size, kind }: { size: number; kind: CoinKind }) {
  const id = useId().replace(/:/g, "");
  const def = COIN_DEF[kind];

  if (kind === "gem") {
    const gid = `gem-${id}`;
    return (
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <SvgLinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <SvgStop offset="0" stopColor={def.hi} />
            <SvgStop offset="0.5" stopColor={def.mid} />
            <SvgStop offset="1" stopColor={def.lo} />
          </SvgLinearGradient>
        </Defs>
        <SvgPolygon points="50,8 92,40 50,94 8,40" fill={`url(#${gid})`} stroke={def.ring} strokeWidth="2" />
        <SvgPolygon points="50,8 70,40 50,55 30,40" fill="#ffffff" opacity={0.4} />
        <SvgPolygon points="50,8 92,40 70,40" fill="#ffffff" opacity={0.18} />
        <SvgPolygon points="50,55 70,40 92,40 50,94" fill="#000000" opacity={0.12} />
      </Svg>
    );
  }

  const fid = `face-${id}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <SvgRadialGradient id={fid} cx="0.35" cy="0.28" rx="0.85" ry="0.85" fx="0.35" fy="0.28">
          <SvgStop offset="0" stopColor={def.hi} />
          <SvgStop offset="0.55" stopColor={def.mid} />
          <SvgStop offset="1" stopColor={def.lo} />
        </SvgRadialGradient>
      </Defs>
      {/* outer rim */}
      <SvgCircle cx="50" cy="50" r="48" fill={def.ring} />
      {/* coin face */}
      <SvgCircle cx="50" cy="50" r="44" fill={`url(#${fid})`} />
      {/* symbol */}
      <SvgText
        x="50"
        y="72"
        fontSize="58"
        fontWeight="700"
        textAnchor="middle"
        fill={def.symColor}
        opacity={0.92}
      >
        {def.sym}
      </SvgText>
      {/* glossy highlight */}
      <SvgEllipse cx="38" cy="26" rx="20" ry="8" fill="#ffffff" opacity={0.32} />
    </Svg>
  );
}

type Particle = {
  id: number;
  x: number;
  delay: number;
  duration: number;
  drift: number;
  rotate: number;
  scale: number;
  size: number;
  kind: CoinKind;
};

function makeParticle(id: number, opts: { idle: boolean }): Particle {
  return {
    id,
    // Idle particles cluster around the box; burst particles spread across the
    // full screen width so the celebration covers everywhere.
    x: opts.idle
      ? Math.random() * 220 - 110
      : (Math.random() - 0.5) * (SCREEN_W + 60),
    // Spread burst delays across ~1.4s so the shower flows continuously instead
    // of detonating all at once.
    delay: opts.idle
      ? Math.random() * 4200
      : Math.random() * 1400,
    duration: opts.idle
      ? 2600 + Math.random() * 1800
      : 1500 + Math.random() * 1100,
    drift: (Math.random() - 0.5) * (opts.idle ? 140 : 180),
    rotate: (Math.random() - 0.5) * 720,
    scale: opts.idle
      ? 0.55 + Math.random() * 0.6
      : 0.5 + Math.random() * 0.5,
    size: opts.idle
      ? 22 + Math.random() * 14
      : 14 + Math.random() * 14,
    kind: PARTICLE_POOL[Math.floor(Math.random() * PARTICLE_POOL.length)]!,
  };
}

function playChime() {
  if (Platform.OS !== "web") return;
  try {
    const Ctor =
      (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const now = ctx.currentTime;
    // Two-note "coin pickup" — short, bright, playful (B5 → E6)
    const notes: { f: number; t: number }[] = [
      { f: 987.77, t: 0 },
      { f: 1318.51, t: 0.07 },
    ];
    notes.forEach(({ f, t }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      const start = now + t;
      const end = start + 0.16;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.16, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(end);
    });
  } catch {}
}

function IdleParticles() {
  const particles = useMemo(
    () => Array.from({ length: 14 }, (_, i) => makeParticle(i, { idle: true })),
    [],
  );
  return (
    <View pointerEvents="none" accessible={false} style={styles.particleLayer}>
      {particles.map((p) => (
        <IdleParticleBit key={p.id} p={p} />
      ))}
    </View>
  );
}

function IdleParticleBit({ p }: { p: Particle }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const seq = Animated.loop(
      Animated.sequence([
        Animated.delay(p.delay),
        Animated.timing(t, {
          toValue: 1,
          duration: p.duration,
          easing: Easing.bezier(0.2, 0.7, 0.3, 1),
          useNativeDriver: true,
        }),
        Animated.timing(t, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    seq.start();
    return () => seq.stop();
  }, [t, p.delay, p.duration]);

  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, -260] });
  const translateX = t.interpolate({ inputRange: [0, 1], outputRange: [p.x, p.x + p.drift] });
  const opacity = t.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 0.9, 0.9, 0] });
  const rotate = t.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${p.rotate}deg`] });
  const scale = t.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, p.scale, p.scale * 0.7] });

  return (
    <Animated.View
      style={[
        styles.particle,
        { opacity, transform: [{ translateX }, { translateY }, { rotate }, { scale }] },
      ]}
    >
      <Coin3D size={p.size} kind={p.kind} />
    </Animated.View>
  );
}

function BurstParticles({ trigger }: { trigger: number }) {
  const particles = useMemo(
    () => Array.from({ length: 90 }, (_, i) => makeParticle(i, { idle: false })),
    [],
  );
  return (
    <View pointerEvents="none" accessible={false} style={styles.burstLayer}>
      {particles.map((p) => (
        <BurstParticleBit key={p.id} p={p} trigger={trigger} />
      ))}
    </View>
  );
}

function BurstParticleBit({ p, trigger }: { p: Particle; trigger: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (trigger === 0) return;
    t.setValue(0);
    const anim = Animated.timing(t, {
      toValue: 1,
      duration: p.duration,
      delay: p.delay,
      easing: Easing.bezier(0.2, 0.7, 0.3, 1),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [trigger, t, p.duration, p.delay]);

  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, -(SCREEN_H + 120)] });
  const translateX = t.interpolate({ inputRange: [0, 1], outputRange: [p.x, p.x + p.drift] });
  const opacity = t.interpolate({ inputRange: [0, 0.08, 0.85, 1], outputRange: [0, 1, 1, 0] });
  const rotate = t.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${p.rotate}deg`] });
  const scale = t.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, p.scale, p.scale * 0.7] });

  return (
    <Animated.View
      style={[
        styles.particle,
        { opacity, transform: [{ translateX }, { translateY }, { rotate }, { scale }] },
      ]}
    >
      <Coin3D size={p.size} kind={p.kind} />
    </Animated.View>
  );
}

// Animated multi-orb aurora gradient + starfield — replaces the old 3-circle glow
const STAR_FIELD = Array.from({ length: 36 }, (_, i) => {
  // deterministic-ish positions so they don't reshuffle on every re-render
  const seed = (i + 1) * 9301;
  const r1 = ((seed * 1.13) % 1000) / 1000;
  const r2 = ((seed * 2.71) % 1000) / 1000;
  const r3 = ((seed * 4.17) % 1000) / 1000;
  return {
    cx: r1 * 380,
    cy: r2 * 280,
    r: 0.4 + r3 * 1.4,
    op: 0.18 + r3 * 0.55,
  };
});

function AuroraBackdrop() {
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;
  const d = useRef(new Animated.Value(0)).current;
  const twinkle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const mk = (v: Animated.Value, dur: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      );
    const anims = [mk(a, 7000), mk(b, 9500), mk(d, 11500), mk(twinkle, 1800)];
    anims.forEach((x) => x.start());
    return () => anims.forEach((x) => x.stop());
  }, [a, b, d, twinkle]);

  const lerp = (v: Animated.Value, from: number, to: number) =>
    v.interpolate({ inputRange: [0, 1], outputRange: [from, to] });

  const starOpacity = lerp(twinkle, 0.65, 1);

  return (
    <View pointerEvents="none" style={styles.glowWrap}>
      {/* starfield */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: starOpacity, alignItems: "center", justifyContent: "center" }]}>
        <Svg width={380} height={280}>
          {STAR_FIELD.map((s, i) => (
            <SvgCircle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="#ffffff" opacity={s.op} />
          ))}
        </Svg>
      </Animated.View>

      {/* purple bloom */}
      <Animated.View
        style={[
          styles.orbPurple,
          {
            transform: [
              { translateX: lerp(a, -40, 30) },
              { translateY: lerp(a, 10, -25) },
              { scale: lerp(a, 0.9, 1.15) },
            ],
          },
        ]}
      />
      {/* accent blue bloom */}
      <Animated.View
        style={[
          styles.orbAccent,
          {
            transform: [
              { translateX: lerp(b, 50, -30) },
              { translateY: lerp(b, -25, 20) },
              { scale: lerp(b, 1.05, 0.85) },
            ],
          },
        ]}
      />
      {/* green glow */}
      <Animated.View
        style={[
          styles.orbGreen,
          {
            transform: [
              { translateX: lerp(d, -60, 40) },
              { translateY: lerp(d, 25, -15) },
              { scale: lerp(d, 0.85, 1.15) },
            ],
          },
        ]}
      />
      {/* bitcoin orange spark */}
      <Animated.View
        style={[
          styles.orbBitcoin,
          {
            transform: [
              { translateX: lerp(b, 70, -10) },
              { translateY: lerp(a, -30, 35) },
              { scale: lerp(b, 0.7, 1.0) },
            ],
          },
        ]}
      />
      {/* magenta accent */}
      <Animated.View
        style={[
          styles.orbPink,
          {
            transform: [
              { translateX: lerp(d, 30, -50) },
              { translateY: lerp(b, 30, -10) },
              { scale: lerp(d, 0.75, 1.05) },
            ],
          },
        ]}
      />
    </View>
  );
}

export default function ClaimScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "claiming" | "done">("idle");
  const [displayAmount, setDisplayAmount] = useState(REWARD_AMOUNT);
  const [burstTrigger, setBurstTrigger] = useState(0);

  const ctaPulse = useRef(new Animated.Value(0)).current;
  const entry = useRef(new Animated.Value(0)).current;
  const amountScale = useRef(new Animated.Value(1)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;

  // Box opening animation
  const boxBob = useRef(new Animated.Value(0)).current; // idle gentle bob
  const boxScale = useRef(new Animated.Value(1)).current; // overall pop
  const boxScaleY = useRef(new Animated.Value(1)).current; // anticipation squish
  const closedOpacity = useRef(new Animated.Value(1)).current;
  const openOpacity = useRef(new Animated.Value(0)).current;
  const openScale = useRef(new Animated.Value(0.6)).current;
  const flashScale = useRef(new Animated.Value(0.2)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, []);

  // Entry stagger
  useEffect(() => {
    Animated.timing(entry, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entry]);

  // CTA pulse loop (idle only)
  useEffect(() => {
    const cp = Animated.loop(
      Animated.sequence([
        Animated.timing(ctaPulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(ctaPulse, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    cp.start();
    return () => cp.stop();
  }, [ctaPulse]);

  // Closed box gentle idle bob — runs only while idle so it stops cleanly
  // when the user taps Claim.
  useEffect(() => {
    if (phase !== "idle") return;
    const bob = Animated.loop(
      Animated.sequence([
        Animated.timing(boxBob, { toValue: 1, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(boxBob, { toValue: 0, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    bob.start();
    return () => bob.stop();
  }, [phase, boxBob]);

  const onClaim = () => {
    if (phase !== "idle") return;
    setPhase("claiming");

    // Light tap on press to acknowledge input; the heavy "pop" haptic fires
    // when the lid actually opens (~310ms in).
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      timeoutsRef.current.push(setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      }, 310));
      timeoutsRef.current.push(setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }, 900));
    }
    // Slight delay on chime so it lands with the lid pop
    timeoutsRef.current.push(setTimeout(playChime, 280));

    // ---- Box opening sequence ----------------------------------------------
    // 1. Anticipation: squish the closed box down, then spring up
    // 2. Pop: closed box scales up + fades out as the open box scales in with
    //    a flash burst behind it
    // 3. Confetti shower releases at the moment the lid pops
    Animated.sequence([
      // anticipation squish
      Animated.parallel([
        Animated.timing(boxScaleY, { toValue: 0.82, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(boxScale, { toValue: 0.96, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
      // wind-up jump
      Animated.parallel([
        Animated.timing(boxScaleY, { toValue: 1.08, duration: 160, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(boxScale, { toValue: 1.05, duration: 160, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      // POP: lid lifts off, open box pops in with flash
      Animated.parallel([
        Animated.timing(closedOpacity, { toValue: 0, duration: 140, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(openOpacity, { toValue: 1, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(openScale, { toValue: 1, friction: 5, tension: 110, useNativeDriver: true }),
        Animated.spring(boxScale, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }),
        Animated.spring(boxScaleY, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }),
        Animated.sequence([
          Animated.parallel([
            Animated.timing(flashOpacity, { toValue: 1, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(flashScale, { toValue: 1.4, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]),
          Animated.timing(flashOpacity, { toValue: 0, duration: 380, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ]),
      ]),
    ]).start();

    // Screen shake — small wobble synchronized with the lid pop
    timeoutsRef.current.push(setTimeout(() => {
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -0.8, duration: 70, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0.5, duration: 70, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -0.25, duration: 80, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();
    }, 290));

    // Confetti shower releases when the lid pops
    timeoutsRef.current.push(setTimeout(() => {
      setBurstTrigger((n) => n + 1);
    }, 300));

    Animated.sequence([
      Animated.delay(300),
      Animated.timing(amountScale, { toValue: 1.18, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(amountScale, { toValue: 1, duration: 280, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]).start();

    const start = Date.now();
    const duration = 1400;
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const k = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setDisplayAmount(REWARD_AMOUNT * (1 - eased));
      if (k >= 1) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setDisplayAmount(0);
        setPhase("done");
        Animated.spring(checkScale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
      }
    }, 40);
  };

  const shakeX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-6, 6] });
  const ctaScale = ctaPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] });

  const heroOpacity = phase === "done" ? 0.35 : 1;
  const entryOpacity = entry;
  const entryY = entry.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <Animated.View
      style={[
        styles.root,
        {
          paddingTop: insets.top,
          transform: [{ translateX: shakeX }],
        },
      ]}
    >
      <Pressable
        style={[styles.closeBtn, { top: insets.top + 8 }]}
        onPress={() => router.back()}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <Feather name="x" size={24} color="#fff" />
      </Pressable>

      {/* Full-screen confetti overlay rendered at root so particles can fly
          across the entire viewport, not just the hero region. */}
      <BurstParticles trigger={burstTrigger} />

      <View style={styles.body}>
        <View style={styles.heroStage}>
          <AuroraBackdrop />
          {phase === "idle" ? <IdleParticles /> : null}

          <Animated.View
            style={[
              styles.hero,
              {
                opacity: heroOpacity,
                transform: [
                  { translateY: boxBob.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
                  { scale: boxScale },
                  { scaleY: boxScaleY },
                ],
              },
            ]}
          >
            {/* Radial flash burst behind the box at the moment of opening */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.boxFlash,
                {
                  opacity: flashOpacity,
                  transform: [{ scale: flashScale }],
                },
              ]}
            />

            {/* Open box (reward-box.png) — fades in on claim */}
            <Animated.View
              style={[
                styles.boxLayer,
                { opacity: openOpacity, transform: [{ scale: openScale }] },
              ]}
            >
              <Image
                source={require("../assets/figmaAssets/reward-box.png")}
                style={{ width: HERO_SIZE, height: HERO_SIZE }}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Closed box — visible on idle, fades out at the moment of pop */}
            <Animated.View
              style={[styles.boxLayer, { opacity: closedOpacity }]}
            >
              <Image
                source={require("../assets/figmaAssets/closed-box.png")}
                style={{ width: HERO_SIZE * 0.78, height: HERO_SIZE * 0.78 }}
                resizeMode="contain"
              />
            </Animated.View>
          </Animated.View>
        </View>

        <Animated.View
          style={{
            alignItems: "center",
            marginTop: -32,
            opacity: entryOpacity,
            transform: [{ translateY: entryY }],
          }}
        >
          <View style={styles.eyebrowRow}>
            {phase === "done" ? (
              <Animated.View style={{ transform: [{ scale: checkScale }] }}>
                <Feather name="check-circle" size={14} color={c.green} />
              </Animated.View>
            ) : null}
            <Text style={[styles.eyebrow, phase === "done" && { color: c.green }]}>
              {phase === "done" ? "Added to wallet" : "Your rewards are ready"}
            </Text>
          </View>
          <Animated.Text
            style={[styles.amount, { transform: [{ scale: amountScale }] }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            ${displayAmount.toFixed(2)}
          </Animated.Text>
          <Text style={styles.sub}>
            {phase === "done"
              ? "Funds available to bet now"
              : "From winning positions, streaks and rewards"}
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            { opacity: entryOpacity, transform: [{ translateY: entryY }] },
          ]}
        >
          {BREAKDOWN.map((b, i) => (
            <View
              key={b.label}
              style={[
                styles.row,
                i < BREAKDOWN.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: c.surface2,
                },
              ]}
            >
              <View style={[styles.dot, { backgroundColor: b.color }]} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.rowLabel} numberOfLines={1}>{b.label}</Text>
                <Text style={styles.rowSub} numberOfLines={1}>{b.sub}</Text>
              </View>
              <Text style={[styles.rowAmount, { color: b.color, maxWidth: 120 }]} numberOfLines={1}>
                +${b.amount.toFixed(2)}
              </Text>
            </View>
          ))}
        </Animated.View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Animated.View
          style={{
            transform: [{ scale: phase === "idle" ? ctaScale : 1 }],
          }}
        >
          <Pressable
            style={[
              styles.messageBanner,
              phase === "done" && styles.messageBannerDone,
              phase === "claiming" && { opacity: 0.85 },
            ]}
            onPress={phase === "done" ? () => router.back() : onClaim}
            disabled={phase === "claiming"}
            accessibilityRole="button"
            accessibilityLabel={
              phase === "idle"
                ? `Claim ${REWARD_AMOUNT.toFixed(2)} dollars`
                : phase === "claiming"
                  ? "Claiming rewards"
                  : "Done, return home"
            }
            accessibilityState={{ disabled: phase === "claiming" }}
          >
            <View style={[styles.messageBannerIcon, phase === "done" && styles.messageBannerIconDone]}>
              <Feather
                name={phase === "done" ? "check" : "gift"}
                size={18}
                color={phase === "done" ? c.green : c.accent}
              />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.messageBannerTitle} numberOfLines={1}>
                {phase === "done" ? "Rewards claimed" : phase === "claiming" ? "Processing reward" : "Rewards are ready"}
              </Text>
              <Text style={styles.messageBannerBody} numberOfLines={1}>
                {phase === "done"
                  ? "Added to your wallet"
                  : phase === "claiming"
                    ? "Claiming…"
                    : `Claim $${REWARD_AMOUNT.toFixed(2)}`}
              </Text>
            </View>
            <Feather
              name={phase === "done" ? "check-circle" : "chevron-right"}
              size={20}
              color={phase === "done" ? c.green : c.textMuted}
            />
          </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  closeBtn: {
    position: "absolute",
    right: 16,
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    zIndex: 20,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  heroStage: {
    width: HERO_SIZE,
    height: HERO_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 0,
  },
  hero: { width: HERO_SIZE, height: HERO_SIZE, alignItems: "center", justifyContent: "center" },
  boxLayer: {
    position: "absolute",
    width: HERO_SIZE,
    height: HERO_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  boxFlash: {
    position: "absolute",
    width: HERO_SIZE * 0.9,
    height: HERO_SIZE * 0.9,
    borderRadius: HERO_SIZE * 0.45,
    backgroundColor: "rgba(255, 240, 200, 0.85)",
    filter: "blur(60px)" as any,
  },
  glowWrap: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    height: 280,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 0,
  },
  orbPurple: {
    position: "absolute",
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: "rgba(139, 92, 246, 0.55)",
    opacity: 0.55,
    filter: "blur(70px)" as any,
  },
  orbAccent: {
    position: "absolute",
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: "rgba(68, 89, 255, 0.6)",
    opacity: 0.6,
    filter: "blur(60px)" as any,
  },
  orbGreen: {
    position: "absolute",
    width: 170, height: 170, borderRadius: 85,
    backgroundColor: "rgba(186, 242, 74, 0.45)",
    opacity: 0.55,
    filter: "blur(55px)" as any,
  },
  orbBitcoin: {
    position: "absolute",
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: "rgba(247, 147, 26, 0.55)",
    opacity: 0.5,
    filter: "blur(50px)" as any,
  },
  orbPink: {
    position: "absolute",
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: "rgba(255, 117, 132, 0.45)",
    opacity: 0.45,
    filter: "blur(55px)" as any,
  },
  particleLayer: {
    position: "absolute",
    bottom: 60,
    left: "50%",
    width: 0,
    height: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  burstLayer: {
    position: "absolute",
    left: "50%",
    bottom: 0,
    width: 0,
    height: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 30,
  },
  particle: { position: "absolute" },
  eyebrowRow: {
    flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6,
  },
  eyebrow: {
    color: c.textMuted, fontFamily: geist.medium, fontSize: 14,
  },
  amount: {
    color: "#fff", fontFamily: geist.bold, fontSize: 56, lineHeight: 64, letterSpacing: -1,
  },
  sub: {
    color: c.textMuted, fontFamily: geist.regular, fontSize: 14,
    marginTop: 4, textAlign: "center", paddingHorizontal: 24,
  },
  card: {
    width: "100%", backgroundColor: c.surface, borderRadius: 16,
    marginTop: 20, paddingHorizontal: 14,
  },
  row: {
    flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 12,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  rowLabel: { color: "#fff", fontFamily: geist.medium, fontSize: 15 },
  rowSub: { color: c.textMuted, fontFamily: geist.regular, fontSize: 12, marginTop: 2 },
  rowAmount: { fontFamily: geist.semibold, fontSize: 15 },
  footer: {
    paddingHorizontal: 16, paddingTop: 12, backgroundColor: c.bg,
  },
  messageBanner: {
    width: "100%", minHeight: 72, borderRadius: 12,
    backgroundColor: c.surface2,
    borderWidth: 1, borderColor: "rgba(68,89,255,0.48)",
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  messageBannerDone: {
    borderColor: "rgba(186,242,74,0.45)",
    backgroundColor: c.greenSoft,
  },
  messageBannerIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(68,89,255,0.16)",
  },
  messageBannerIconDone: {
    backgroundColor: "rgba(186,242,74,0.16)",
  },
  messageBannerTitle: {
    color: c.textPrimary, fontFamily: geist.semibold, fontSize: 15, lineHeight: 20,
  },
  messageBannerBody: {
    color: c.textMuted, fontFamily: geist.regular, fontSize: 13, lineHeight: 18, marginTop: 1,
  },
});
