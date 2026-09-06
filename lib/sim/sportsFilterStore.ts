import { useSyncExternalStore } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEFAULT_SPORT_ORDER = [
  "baseball", "combat", "soccer", "cricket", "basketball", "football", "hockey", "rugby",
  "tabletennis", "golf", "motorsports", "tennis", "pickleball", "esports", "cycling", "poker", "chess",
];
const STORAGE_KEY = "predict.sports-tab-preferences";

type SportsTabPreferences = {
  order: string[];
  hidden: string[];
};

let preferences: SportsTabPreferences = { order: DEFAULT_SPORT_ORDER, hidden: [] };
let didMutatePreferences = false;
let hydratedFromWebStorage = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((listener) => listener());
}

function storedPreferences(value: string | null): SportsTabPreferences | null {
  if (!value) return null;
  const stored = JSON.parse(value) as Partial<SportsTabPreferences>;
  if (!Array.isArray(stored.order) || !Array.isArray(stored.hidden)) return null;
  return {
    order: [
      ...stored.order.filter((slug): slug is string => DEFAULT_SPORT_ORDER.includes(slug)),
      ...DEFAULT_SPORT_ORDER.filter((slug) => !stored.order!.includes(slug)),
    ],
    hidden: stored.hidden.filter((slug): slug is string => DEFAULT_SPORT_ORDER.includes(slug)),
  };
}

function save(next: SportsTabPreferences): void {
  didMutatePreferences = true;
  preferences = next;
  notify();
  if (Platform.OS === "web") {
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
}

if (Platform.OS === "web") {
  try {
    const stored = storedPreferences(globalThis.localStorage?.getItem(STORAGE_KEY) ?? null);
    if (stored) {
      preferences = stored;
      hydratedFromWebStorage = true;
    }
  } catch {}
}

void AsyncStorage.getItem(STORAGE_KEY)
  .then((value) => {
    if (didMutatePreferences || hydratedFromWebStorage) return;
    const stored = storedPreferences(value);
    if (!stored) return;
    preferences = stored;
    notify();
  })
  .catch(() => {});

export function getSportsTabPreferences(): SportsTabPreferences {
  return preferences;
}

export function toggleSportsTab(slug: string): void {
  const hidden = preferences.hidden.includes(slug)
    ? preferences.hidden.filter((item) => item !== slug)
    : [...preferences.hidden, slug];
  save({ ...preferences, hidden });
}

export function moveSportsTabTo(slug: string, target: number): void {
  const index = preferences.order.indexOf(slug);
  if (index < 0 || target < 0 || target >= preferences.order.length || index === target) return;
  const order = [...preferences.order];
  order.splice(index, 1);
  order.splice(target, 0, slug);
  save({ ...preferences, order });
}

export function setSportsTabOrder(order: string[]): void {
  if (order.length !== preferences.order.length || order.some((slug, index) => slug !== preferences.order[index])) {
    save({ ...preferences, order });
  }
}

export function resetSportsTabs(): void {
  save({ order: DEFAULT_SPORT_ORDER, hidden: [] });
}

export function useSportsTabPreferences(): SportsTabPreferences {
  return useSyncExternalStore(subscribe, getSportsTabPreferences, getSportsTabPreferences);
}