// Same ordered prefix Polymarket related-tags currently returns for the
// production "Popular today" rail (`/tags/slug/all/related-tags`).
export const POPULAR_TOPICS = [
  "Trump",
  "August 18 Primaries",
  "Iran",
  "Clarity Act",
  "Fed",
  "August 25 Primaries",
  "Anthropic IPO",
  "Gaza",
  "AI",
  "Midterms",
];

const popularSlug = (label: string) =>
  label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Unique ?topic= slug for each Popular-today chip (so Trump ≠ Iran in the URL). */
export const POPULAR_TOPIC_SLUGS: Record<string, string> = Object.fromEntries(
  POPULAR_TOPICS.map((label) => [label, popularSlug(label)]),
);

/** Which topic-market feed each chip shows on /trending. */
export const POPULAR_TOPIC_CONTENT: Record<string, string> = {
  Trump: "iran",
  "August 18 Primaries": "primaries",
  Iran: "iran",
  "Clarity Act": "clarity",
  Fed: "finance",
  "August 25 Primaries": "primaries",
  "Anthropic IPO": "tech",
  Gaza: "iran",
  AI: "tech",
  Midterms: "iran",
};

export const POPULAR_TOPIC_ROUTES: Record<string, string> = Object.fromEntries(
  POPULAR_TOPICS.map((label) => [label, `/trending?topic=${POPULAR_TOPIC_SLUGS[label]}`]),
);

export function popularLabelForSlug(slug: string): string | undefined {
  return POPULAR_TOPICS.find((label) => POPULAR_TOPIC_SLUGS[label] === slug);
}

export function popularContentKey(slug: string): string | undefined {
  const label = popularLabelForSlug(slug);
  if (label) return POPULAR_TOPIC_CONTENT[label];
  return undefined;
}

/** Resolve `/trending?topic=` (expo-router may pass a string or string[]). */
export function resolvePopularTopicSlug(
  topic: string | string[] | undefined,
  fallback = POPULAR_TOPIC_SLUGS.Trump,
): string {
  const raw = Array.isArray(topic) ? topic[0] : topic;
  if (typeof raw === "string" && popularLabelForSlug(raw)) return raw;
  return fallback;
}
