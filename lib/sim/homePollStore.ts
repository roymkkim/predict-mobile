import { useSyncExternalStore } from "react";

export type HomePollSide = "yes" | "no";

export type HomePollState = {
  yes: number;
  no: number;
  vote: HomePollSide | null;
};

export type HomePollSeed = {
  id: string;
  yes: number;
  no: number;
};

const SEEDS: HomePollSeed[] = [
  { id: "car-ari", yes: 1284, no: 716 },
  { id: "gb-pit", yes: 1102, no: 898 },
  { id: "lal-bos", yes: 1540, no: 860 },
  { id: "kc-buf", yes: 1688, no: 812 },
];

function seedState(seed: HomePollSeed): HomePollState {
  return { yes: seed.yes, no: seed.no, vote: null };
}

const polls = new Map<string, HomePollState>(SEEDS.map((s) => [s.id, seedState(s)]));
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function homePollTotal(state: HomePollState): number {
  return Math.max(0, state.yes + state.no);
}

export function homePollPercents(state: HomePollState): { yes: number; no: number } {
  const total = homePollTotal(state);
  if (total <= 0) return { yes: 50, no: 50 };
  const yes = Math.round((state.yes / total) * 100);
  return { yes, no: 100 - yes };
}

const EMPTY: HomePollState = { yes: 0, no: 0, vote: null };

export function getHomePoll(id: string): HomePollState {
  return polls.get(id) ?? EMPTY;
}

export function castHomePollVote(id: string, side: HomePollSide): HomePollState {
  const current = getHomePoll(id);
  if (current.vote) return current;
  const next: HomePollState = {
    yes: current.yes + (side === "yes" ? 1 : 0),
    no: current.no + (side === "no" ? 1 : 0),
    vote: side,
  };
  polls.set(id, next);
  emit();
  return next;
}

export function useHomePoll(id: string): HomePollState {
  return useSyncExternalStore(subscribe, () => getHomePoll(id), () => getHomePoll(id));
}
