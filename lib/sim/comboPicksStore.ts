import { useSyncExternalStore } from "react";
import type { ComboPick } from "@/components/sim/ComboSheet";
import { comboExclusiveGroupKey, toggleExclusiveComboPick, upsertExclusiveComboPick } from "@/lib/sim/comboPickEdit";

let picks: ComboPick[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getComboPicks(): ComboPick[] {
  return picks;
}

export function toggleComboPick(pick: ComboPick): void {
  picks = toggleExclusiveComboPick(picks, pick);
  emit();
}

export function removeComboPick(id: string): void {
  picks = picks.filter((p) => p.id !== id);
  emit();
}

export function replacePickInList(list: ComboPick[], id: string, next: ComboPick): ComboPick[] {
  const idx = list.findIndex((p) => p.id === id);
  if (idx < 0) return list;
  const kept = list.filter((p, i) => i === idx || p.id !== next.id);
  const at = kept.findIndex((p) => p.id === id);
  if (at < 0) return kept;
  const copy = [...kept];
  copy[at] = next;
  return copy;
}

export function replaceComboPick(id: string, next: ComboPick): void {
  picks = replacePickInList(picks, id, next);
  emit();
}

export function addComboPicks(next: ComboPick[]): void {
  let list = picks;
  let changed = false;
  for (const pick of next) {
    if (list.some((p) => p.id === pick.id)) continue;
    const merged = upsertExclusiveComboPick(list, pick);
    if (merged !== list) {
      list = merged;
      changed = true;
    }
  }
  if (!changed) return;
  picks = list;
  emit();
}

/** Load a template as a set: keep all legs, swap only vs existing exclusive conflicts. */
export function addComboTemplatePicks(legs: ComboPick[]): void {
  if (legs.length === 0) return;
  const incomingIds = new Set(legs.map((p) => p.id));
  const incomingGroups = new Set(legs.map((p) => comboExclusiveGroupKey(p)));
  const kept = picks.filter((p) => incomingIds.has(p.id) || !incomingGroups.has(comboExclusiveGroupKey(p)));
  const have = new Set(kept.map((p) => p.id));
  const appended = legs.filter((p) => !have.has(p.id));
  if (appended.length === 0 && kept.length === picks.length) return;
  picks = [...kept, ...appended];
  emit();
}

export function removeComboPicks(ids: string[]): void {
  const drop = new Set(ids);
  const next = picks.filter((p) => !drop.has(p.id));
  if (next.length === picks.length) return;
  picks = next;
  emit();
}

export function toggleComboTemplatePicks(legs: ComboPick[]): void {
  const groups = legs.map((p) => comboExclusiveGroupKey(p));
  const allIn = groups.length > 0 && groups.every((g) => picks.some((p) => comboExclusiveGroupKey(p) === g));
  if (allIn) {
    const drop = new Set(groups);
    const next = picks.filter((p) => !drop.has(comboExclusiveGroupKey(p)));
    if (next.length !== picks.length) {
      picks = next;
      emit();
    }
    return;
  }
  addComboTemplatePicks(legs);
}

export function setComboPicks(next: ComboPick[]): void {
  picks = next;
  emit();
}

export function clearComboPicks(): void {
  if (picks.length === 0) return;
  picks = [];
  emit();
}

export function useComboPicks(): ComboPick[] {
  return useSyncExternalStore(subscribe, getComboPicks, getComboPicks);
}
