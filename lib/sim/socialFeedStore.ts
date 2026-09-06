import { useSyncExternalStore } from "react";

// Session-only posts and comments created from the Social UX composer.
export type SocialPost = {
  id: string;
  market?: string;
  title: string;
  cost: number;
  toWin: number;
  logo?: string;
  flag?: string;
  caption: string;
  gifUrl?: string;
  createdAt: number;
};

export type SocialComment = {
  id: string;
  postId: string;
  author: string;
  text: string;
  gifUrl?: string;
  createdAt: number;
};

type SocialState = {
  posts: SocialPost[];
  comments: Record<string, SocialComment[]>;
  likeCount: Record<string, number>;
  liked: Record<string, boolean>;
};

let seq = 0;
let commentSeq = 0;
let state: SocialState = {
  posts: [],
  comments: {},
  likeCount: {},
  liked: {},
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function get(): SocialState {
  return state;
}

export function addSocialPost(p: Omit<SocialPost, "id" | "createdAt">) {
  const post: SocialPost = { ...p, id: `post-${++seq}`, createdAt: Date.now() };
  state = {
    ...state,
    posts: [post, ...state.posts],
    likeCount: { ...state.likeCount, [post.id]: 0 },
    comments: { ...state.comments, [post.id]: [] },
  };
  emit();
  return post;
}

export function ensurePostMeta(postId: string, seed?: { likes?: number; comments?: Omit<SocialComment, "id" | "postId">[] }) {
  if (state.likeCount[postId] != null) return;
  const comments = (seed?.comments ?? []).map((c, i) => ({
    ...c,
    id: `seed-${postId}-${i}`,
    postId,
  }));
  state = {
    ...state,
    likeCount: { ...state.likeCount, [postId]: seed?.likes ?? 0 },
    comments: { ...state.comments, [postId]: comments },
  };
  emit();
}

export function toggleLike(postId: string) {
  const mine = !!state.liked[postId];
  const count = state.likeCount[postId] ?? 0;
  state = {
    ...state,
    liked: { ...state.liked, [postId]: !mine },
    likeCount: { ...state.likeCount, [postId]: Math.max(0, count + (mine ? -1 : 1)) },
  };
  emit();
}

export function addSocialComment(postId: string, text: string, author = "you", gifUrl?: string) {
  const comment: SocialComment = {
    id: `c-${++commentSeq}`,
    postId,
    author,
    text,
    gifUrl,
    createdAt: Date.now(),
  };
  const prev = state.comments[postId] ?? [];
  state = {
    ...state,
    comments: { ...state.comments, [postId]: [...prev, comment] },
  };
  emit();
  return comment;
}

const EMPTY_COMMENTS: SocialComment[] = [];
const snapshots = new Map<string, { comments: SocialComment[]; likeCount: number; liked: boolean }>();

function snapshotFor(postId: string) {
  const comments = state.comments[postId] ?? EMPTY_COMMENTS;
  const likeCount = state.likeCount[postId] ?? 0;
  const liked = !!state.liked[postId];
  const prev = snapshots.get(postId);
  if (prev && prev.comments === comments && prev.likeCount === likeCount && prev.liked === liked) return prev;
  const next = { comments, likeCount, liked };
  snapshots.set(postId, next);
  return next;
}

export function useSocialFeed(): SocialPost[] {
  return useSyncExternalStore(subscribe, () => get().posts, () => get().posts);
}

export function usePostSocial(postId: string) {
  return useSyncExternalStore(
    subscribe,
    () => snapshotFor(postId),
    () => snapshotFor(postId),
  );
}
