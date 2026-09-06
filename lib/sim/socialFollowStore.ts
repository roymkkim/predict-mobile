import { useSyncExternalStore } from "react";

let following: Record<string, boolean> = {};
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isFollowing(author: string): boolean {
  return !!following[author];
}

export function toggleFollow(author: string): boolean {
  following = { ...following, [author]: !following[author] };
  emit();
  return !!following[author];
}

export function useFollowing(author: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => isFollowing(author),
    () => isFollowing(author),
  );
}
