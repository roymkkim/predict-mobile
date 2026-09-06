import { useSyncExternalStore } from "react";

export type SocialTourStepId = "latestPosts" | "socialFeed" | "liveChat" | "liveTrades";

export type TourRect = { x: number; y: number; width: number; height: number };

export const SOCIAL_TOUR_STEPS: readonly SocialTourStepId[] = [
  "latestPosts",
  "socialFeed",
  "liveChat",
  "liveTrades",
] as const;

export const SOCIAL_TOUR_COPY: Record<
  SocialTourStepId,
  { title: string; body: string; targetId: string | null }
> = {
  latestPosts: {
    title: "View latest posts",
    body: "What people are saying updates here. Tap a post to open that market’s social feed.",
    targetId: "tour-latest-posts",
  },
  socialFeed: {
    title: "Social feed",
    body: "Read posts from traders and copy a trade into the bet slip in one tap.",
    targetId: "tour-social-tab",
  },
  liveChat: {
    title: "Live chat",
    body: "A live conversation on this market. The icon pulses when new messages land.",
    targetId: "tour-chat-tab",
  },
  liveTrades: {
    title: "Live trades",
    body: "Watch trades print as they happen on this market.",
    targetId: "tour-live-tab",
  },
};

let active = false;
let stepIndex = 0;
let targets: Record<string, TourRect> = {};
const listeners = new Set<() => void>();

function makeSnapshot(): SocialTourState {
  const stepId = SOCIAL_TOUR_STEPS[Math.min(stepIndex, SOCIAL_TOUR_STEPS.length - 1)] ?? "latestPosts";
  return { active, stepIndex, stepId, targets };
}

// useSyncExternalStore requires getSnapshot to return the same reference when
// nothing changed. A fresh object every call is React minified error #185.
let cached: SocialTourState = makeSnapshot();

function emit() {
  cached = makeSnapshot();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export type SocialTourState = {
  active: boolean;
  stepIndex: number;
  stepId: SocialTourStepId;
  targets: Record<string, TourRect>;
};

export function getSocialTour(): SocialTourState {
  return cached;
}

export function useSocialTour(): SocialTourState {
  return useSyncExternalStore(subscribe, getSocialTour, getSocialTour);
}

export function startSocialTour() {
  active = true;
  stepIndex = 0;
  emit();
}

export function stopSocialTour() {
  if (!active && stepIndex === 0) return;
  active = false;
  stepIndex = 0;
  emit();
}

export function setSocialTourStep(index: number) {
  const next = Math.max(0, Math.min(index, SOCIAL_TOUR_STEPS.length - 1));
  if (!active || next === stepIndex) return;
  stepIndex = next;
  emit();
}

export function socialTourNext() {
  if (!active) return;
  if (stepIndex >= SOCIAL_TOUR_STEPS.length - 1) {
    stopSocialTour();
    return;
  }
  stepIndex += 1;
  emit();
}

export function socialTourBack() {
  if (!active) return;
  if (stepIndex <= 0) return;
  stepIndex -= 1;
  emit();
}

export function setTourTarget(id: string, rect: TourRect) {
  const prev = targets[id];
  if (
    prev &&
    Math.abs(prev.x - rect.x) < 0.5 &&
    Math.abs(prev.y - rect.y) < 0.5 &&
    Math.abs(prev.width - rect.width) < 0.5 &&
    Math.abs(prev.height - rect.height) < 0.5
  ) {
    return;
  }
  targets = { ...targets, [id]: rect };
  emit();
}

export function clearTourTarget(id: string) {
  if (!(id in targets)) return;
  const next = { ...targets };
  delete next[id];
  targets = next;
  emit();
}
