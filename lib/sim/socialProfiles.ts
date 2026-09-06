import { router } from "expo-router";

const SELF = "you";

export type SocialProfile = {
  id: string;
  displayName: string;
  handle: string;
  bio: string;
  winRate: number;
  feedWr: number;
  pnl: number;
  holdTime: string;
  copies: number;
  followers: number;
  followingCount: number;
  showX: boolean;
  pinFox: boolean;
};

const BIOS = [
  "Full-time degen, part-time risk manager.",
  "Charts first, vibes second.",
  "I copy the copies.",
  "Onchain, occasionally on time.",
  "Fade me and find out.",
];

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

function slugHandle(author: string): string {
  const slug = author
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 16) || "user";
  return `@${slug}.metamask`;
}

export function isCented(author: string): boolean {
  return author.trim().toLowerCase() === "cented";
}

export function isSelfAuthor(author: string): boolean {
  return author === SELF;
}

export function profileFor(author: string): SocialProfile {
  const id = author.trim() || SELF;
  if (isCented(id)) {
    return {
      id: "Cented",
      displayName: "Cented",
      handle: "@cented.metamask",
      bio: "Full-time degen, part-time risk manager.",
      winRate: 57,
      feedWr: 51,
      pnl: 61355,
      holdTime: "5d",
      copies: 361,
      followers: 20467,
      followingCount: 98,
      showX: true,
      pinFox: true,
    };
  }
  const h = hashSeed(id);
  const pnlMag = 800 + (h % 48000);
  const pnlSign = h % 5 === 0 ? -1 : 1;
  return {
    id,
    displayName: isSelfAuthor(id) ? "You" : id,
    handle: slugHandle(isSelfAuthor(id) ? "you" : id),
    bio: BIOS[h % BIOS.length],
    winRate: 38 + (h % 42),
    feedWr: 32 + ((h >> 3) % 48),
    pnl: pnlSign * pnlMag,
    holdTime: `${1 + (h % 14)}d`,
    copies: 12 + (h % 720),
    followers: 80 + (h % 18000),
    followingCount: 12 + (h % 240),
    showX: h % 3 === 0,
    pinFox: false,
  };
}

export function openSocialProfile(author: string) {
  const profile = profileFor(author);
  router.push({
    pathname: "/social-profile",
    params: { id: profile.id },
  } as never);
}

export function formatPnl(pnl: number): string {
  const abs = Math.abs(Math.round(pnl));
  const formatted = abs.toLocaleString("en-US");
  if (pnl > 0) return `+$${formatted}`;
  if (pnl < 0) return `-$${formatted}`;
  return "$0";
}

export function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

export function demoPostsForAuthor(
  author: string,
  market = "Will Bitcoin hit $150k?",
): {
  id: string;
  market: string;
  title: string;
  cost: number;
  toWin: number;
  caption: string;
  author: string;
  timeLabel: string;
}[] {
  const profile = profileFor(author);
  if (isCented(profile.id)) {
    return [
      {
        id: `demo-profile-${profile.id}-0`,
        market,
        title: "Buy",
        cost: 25,
        toWin: 41.5,
        caption: "This one's going places 🚀",
        author: profile.displayName,
        timeLabel: "20 min ago",
      },
    ];
  }
  return [
    {
      id: `demo-profile-${profile.id}-0`,
      market,
      title: "Yes",
      cost: 25,
      toWin: 41.5,
      caption: profile.bio,
      author: profile.displayName,
      timeLabel: "2 hr ago",
    },
  ];
}

export function demoRepliesForAuthor(author: string): { id: string; text: string; ago: string }[] {
  const profile = profileFor(author);
  if (isCented(profile.id)) {
    return [
      { id: "r1", text: "size is size", ago: "1h" },
      { id: "r2", text: "cooked", ago: "4h" },
    ];
  }
  const h = hashSeed(profile.id);
  if (h % 4 === 0) return [];
  return [{ id: "r1", text: "gm", ago: "3h" }];
}

export function demoCopiesForAuthor(author: string): { id: string; who: string; ago: string }[] {
  const profile = profileFor(author);
  const n = Math.min(4, 1 + (hashSeed(profile.id) % 4));
  return Array.from({ length: n }, (_, i) => ({
    id: `copy-${i}`,
    who: ["jijo25", "wugi95", "nova4", "orbit"][i % 4],
    ago: `${i + 1}h`,
  }));
}
