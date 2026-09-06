import { useSyncExternalStore } from "react";

export type MmProposalControls = {
  showCategories: boolean;
  showSearch: boolean;
  showLiveChip: boolean;
  showVolume: boolean;
};

const DEFAULT_CONTROLS: MmProposalControls = {
  showCategories: true,
  showSearch: true,
  showLiveChip: true,
  showVolume: true,
};

let controls: MmProposalControls = { ...DEFAULT_CONTROLS };
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function getMmProposalControls(): MmProposalControls {
  return controls;
}

export function setMmProposalControl<K extends keyof MmProposalControls>(
  key: K,
  value: MmProposalControls[K],
): void {
  if (controls[key] === value) return;
  controls = { ...controls, [key]: value };
  emit();
}

export function useMmProposalControls(): MmProposalControls {
  return useSyncExternalStore(subscribe, getMmProposalControls, getMmProposalControls);
}
