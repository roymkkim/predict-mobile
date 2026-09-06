import { useSyncExternalStore } from "react";

export type LiveChatMessage = {
  id: string;
  market: string;
  author: string;
  text: string;
  createdAt: number;
  you?: boolean;
};

const CHAT_USERS = ["pengu-whale", "0x8f2a", "jijo25", "wugi95", "nova4", "kite88", "orbit", "minty", "Cented"];

const REACTIONS = ["lmao", "sending it", "fade", "cooked", "ngmi", "W", "lets go", "bruh"];
const TRADE_LINES = [
  "Up looking heavy",
  "copying Cented",
  "size incoming",
  "this tape is wild",
  "Down feels cheap",
  "filling Yes here",
  "fade the spike",
  "chart looking nasty",
  "who is buying this",
  "print it",
];

let seq = 0;
const byMarket = new Map<string, LiveChatMessage[]>();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function hashMarket(market: string): number {
  let h = 0;
  for (let i = 0; i < market.length; i++) h = (h * 31 + market.charCodeAt(i)) >>> 0;
  return h;
}

function pick<T>(items: T[], n: number): T {
  return items[n % items.length];
}

function seedFor(market: string): LiveChatMessage[] {
  const h = hashMarket(market);
  const up = /btc|bitcoin|eth|up or down/i.test(market);
  const now = Date.now();
  const lines = [
    pick(TRADE_LINES, h),
    pick(REACTIONS, h + 3),
    up ? "btc about to rip" : "Yes looking heavy",
    pick(TRADE_LINES, h + 7),
    pick(REACTIONS, h + 11),
  ];
  return lines.map((text, i) => ({
    id: `seed-${h}-${i}`,
    market,
    author: pick(CHAT_USERS, h + i * 3),
    text,
    createdAt: now - (lines.length - i) * 14000,
  }));
}

function ensure(market: string): LiveChatMessage[] {
  let rows = byMarket.get(market);
  if (!rows) {
    rows = seedFor(market);
    byMarket.set(market, rows);
  }
  return rows;
}

export function addLiveChatMessage(market: string, text: string, author = "you") {
  const trimmed = text.trim();
  if (!trimmed) return;
  const row: LiveChatMessage = {
    id: `you-${++seq}-${Date.now()}`,
    market,
    author,
    text: trimmed,
    createdAt: Date.now(),
    you: author === "you",
  };
  byMarket.set(market, [...ensure(market), row]);
  emit();
}

export function appendIncomingChat(market: string) {
  const h = hashMarket(market) + seq + Date.now();
  const tradeBias = h % 3 !== 0;
  const text = tradeBias ? pick(TRADE_LINES, h) : pick(REACTIONS, h);
  const row: LiveChatMessage = {
    id: `in-${++seq}-${Date.now()}`,
    market,
    author: pick(CHAT_USERS, h),
    text,
    createdAt: Date.now(),
  };
  byMarket.set(market, [...ensure(market), row].slice(-48));
  emit();
}

export function useLiveChat(market: string): LiveChatMessage[] {
  return useSyncExternalStore(
    subscribe,
    () => ensure(market),
    () => ensure(market),
  );
}
