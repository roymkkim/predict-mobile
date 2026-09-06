// Broken-card-link check (bundled + run by check-market-links.mjs).
//
// Walks every navigable fixture — Feed/Kalshi sections (all Match exports in
// lib/sim/data.ts), topicMarkets match topics, UxrBrowse UXR_SPORTS +
// EXTRA_SPORT_MATCHES + league pages, and LiveCardsCarousel SPORTS_GAMES —
// and asserts its matchDetailHref key resolves in the match-detail REGISTRY
// (or is one of the bespoke routes). Also asserts every registered fixture
// declares a `sport` so the detail header picks the right treatment.

import { REGISTRY } from "../app/match-detail";
import { matchDetailHref, matchKey } from "../lib/sim/marketRoutes";
import * as DATA from "../lib/sim/data";
import { TOPICS } from "../lib/sim/topicMarkets";
import { EXTRA_SPORT_MATCHES, UXR_SPORTS, leagueGames } from "../components/sim/UxrBrowse";
import { SPORTS_GAMES } from "../components/sim/LiveCardsCarousel";
import { allEsportsGames } from "../app/esports";
import { WIMBLEDON_GAMES } from "../app/wimbledon";
import { EARLY_R16, WORLD_CUP_KNOCKOUT } from "../app/worldcup";
import { UPCOMING_GAMES } from "../app/sports-leagues";
import { LIVE_MATCHES } from "../app/live";
import { POPULAR_TOPICS, POPULAR_TOPIC_CONTENT, POPULAR_TOPIC_ROUTES, POPULAR_TOPIC_SLUGS, popularContentKey, popularLabelForSlug, resolvePopularTopicSlug } from "../components/sim/FeedChrome";
import { findPredictionMarket } from "../lib/sim/predictionRegistry";
import type { Match, PoliticsMarket } from "../lib/sim/types";

// Fully-designed dedicated pages (see lib/sim/marketRoutes.ts).
const BESPOKE_ROUTES = new Set(["/tennis-detail", "/game-detail"]);

const errors: string[] = [];
const fixtures: { src: string; m: Match }[] = [];

const isMatch = (v: unknown): v is Match => {
  const m = v as Match;
  return (
    !!m && typeof m === "object" && Array.isArray(m.teams) && m.teams.length >= 2 &&
    typeof m.teams[0]?.name === "string" && typeof m.league === "string"
  );
};

const add = (src: string, v: unknown): void => {
  if (Array.isArray(v)) v.forEach((x, i) => add(`${src}[${i}]`, x));
  else if (isMatch(v)) fixtures.push({ src, m: v });
};

// Feed + Kalshi sections: every Match export in lib/sim/data.ts is (or can
// become) a feed-navigable fixture, so sweep them all.
for (const [name, v] of Object.entries(DATA)) add(`data.${name}`, v);

// topicMarkets: match-kind topic pages (/topic/[id]) + their Trending tabs.
for (const t of Object.values(TOPICS)) if (t.kind === "match") add(`topic:${t.slug}`, t.data);

// UxrBrowse: extra-sport fixtures, every sport page's game groups, and every
// league page's fixtures (leagueGames covers the dedicated NFL/NCAAF/NBA/
// World Cup maps plus the parent-sport fallbacks).
add("UxrBrowse.EXTRA_SPORT_MATCHES", EXTRA_SPORT_MATCHES);
for (const s of UXR_SPORTS) {
  for (const g of s.games) add(`UXR_SPORTS.${s.slug}:${g.title}`, g.matches);
  for (const l of s.leagues) for (const g of leagueGames(l.name)) add(`league:${l.name}:${g.title}`, g.matches);
}

// Dedicated card pages with their own local fixtures.
add("esports.GAMES", allEsportsGames());
add("wimbledon.WIMBLEDON_GAMES", WIMBLEDON_GAMES);
add("worldcup.WORLD_CUP_KNOCKOUT", WORLD_CUP_KNOCKOUT);
add("worldcup.EARLY_R16", EARLY_R16);
add("sports-leagues.UPCOMING_GAMES", UPCOMING_GAMES);
add("live.LIVE_MATCHES", LIVE_MATCHES);

// Match fixtures must resolve through matchDetailHref → REGISTRY.
const seen = new Set<string>();
for (const { src, m } of fixtures) {
  const href = matchDetailHref(m);
  if (BESPOKE_ROUTES.has(href)) continue;
  const key = matchKey(m);
  if (!REGISTRY[key] && !seen.has(`${src}|${key}`)) {
    seen.add(`${src}|${key}`);
    errors.push(`${src}: "${m.teams[0].name} vs ${m.teams[1].name}" routes to ${href} but key "${key}" is not in the match-detail REGISTRY`);
  }
}

// LiveCardsCarousel builds its own keys with the same convention.
for (const g of SPORTS_GAMES) {
  const key = `${g.teams[0].abbr}-${g.teams[1].abbr}`.toLowerCase();
  if (key === "car-ari") continue; // bespoke /game-detail
  if (!REGISTRY[key]) errors.push(`LiveCardsCarousel SPORTS_GAMES "${g.title}": key "${key}" is not in the match-detail REGISTRY`);
}

// ── Topic links ──────────────────────────────────────────────────────────────
// Home "Popular today" pills deep-link to /trending?topic=<slug>, and the
// Trending page's own tabs key TOPICS by the same slugs. "esports" is the one
// bespoke non-TOPICS tab (opens /esports). A renamed TOPICS slug must show up
// here, not at tap time.
const topicSlugOk = (slug: string) => !!TOPICS[slug] || slug === "esports";

// Home "Popular today" pills follow production related-tags. Some deep-link
// into existing topic pages; others open a category hub.
const POPULAR_ROUTE_OK = (route: string) =>
  route.startsWith("/politics") ||
  route.startsWith("/topic/") ||
  route.startsWith("/crypto") ||
  route.startsWith("/trending");

for (const label of POPULAR_TOPICS) {
  const route = POPULAR_TOPIC_ROUTES[label];
  if (!route) {
    errors.push(`FeedChrome POPULAR_TOPICS "${label}" has no POPULAR_TOPIC_ROUTES entry (would silently fall back to /trending)`);
    continue;
  }
  if (!POPULAR_ROUTE_OK(route)) {
    errors.push(`FeedChrome POPULAR_TOPIC_ROUTES["${label}"] = "${route}" is not a known popular-today destination`);
    continue;
  }
  const slug = /[?&]topic=([^&]+)/.exec(route)?.[1];
  if (slug && !topicSlugOk(popularContentKey(slug) ?? slug)) {
    errors.push(`FeedChrome pill "${label}" routes to topic "${slug}" which does not map to a TOPICS feed`);
  }
}
for (const label of Object.keys(POPULAR_TOPIC_ROUTES)) {
  if (!POPULAR_TOPICS.includes(label)) errors.push(`FeedChrome POPULAR_TOPIC_ROUTES has entry "${label}" with no matching POPULAR_TOPICS pill`);
}

// Trending reads `?topic=` via resolvePopularTopicSlug so a Home pill (e.g. Fed)
// lands on the matching filter chip. Slugs must be unique and round-trip.
{
  const slugs = Object.values(POPULAR_TOPIC_SLUGS);
  if (new Set(slugs).size !== slugs.length) {
    errors.push("FeedChrome POPULAR_TOPIC_SLUGS has duplicate slugs — /trending?topic= would collide");
  }
  for (const label of POPULAR_TOPICS) {
    const slug = POPULAR_TOPIC_SLUGS[label];
    const route = POPULAR_TOPIC_ROUTES[label];
    if (popularLabelForSlug(slug) !== label) {
      errors.push(`popularLabelForSlug("${slug}") !== "${label}"`);
    }
    if (resolvePopularTopicSlug(slug) !== slug) {
      errors.push(`resolvePopularTopicSlug("${slug}") did not keep the Home deep-link`);
    }
    if (resolvePopularTopicSlug([slug]) !== slug) {
      errors.push(`resolvePopularTopicSlug(["${slug}"]) did not unwrap expo-router arrays`);
    }
    if (route !== `/trending?topic=${slug}`) {
      errors.push(`POPULAR_TOPIC_ROUTES["${label}"] should be /trending?topic=${slug}, got "${route}"`);
    }
  }
  if (resolvePopularTopicSlug(undefined) !== POPULAR_TOPIC_SLUGS.Trump) {
    errors.push("resolvePopularTopicSlug(undefined) should fall back to Trump (header → /trending)");
  }
  if (resolvePopularTopicSlug("not-a-topic") !== POPULAR_TOPIC_SLUGS.Trump) {
    errors.push("resolvePopularTopicSlug(unknown) should fall back to Trump");
  }
}

// Trending chips are the same Popular-today set. Content is mapped through
// POPULAR_TOPIC_CONTENT onto an existing TOPICS feed.
for (const label of POPULAR_TOPICS) {
  const content = POPULAR_TOPIC_CONTENT[label];
  if (!content || !topicSlugOk(content)) {
    errors.push(`Popular-today chip "${label}" maps to content "${content}" which is not in TOPICS`);
  }
}

// TOPICS map keys must equal each entry's slug — /topic/[id] looks up TOPICS[id]
// with the slug from the route.
for (const [key, t] of Object.entries(TOPICS)) {
  if (key !== t.slug) errors.push(`TOPICS["${key}"] has mismatched slug "${t.slug}" — /topic/${t.slug} would 404`);
}

// ── Prediction links ─────────────────────────────────────────────────────────
// Feed binary/prediction cards push /prediction-detail?pm=<question>; the page
// resolves the question via predictionRegistry (which itself sweeps data.ts by
// shape). Assert every question-shaped market export resolves back to itself —
// this catches duplicate question strings resolving to the wrong market.
const isPredictionMarket = (v: unknown): v is PoliticsMarket =>
  !!v && typeof v === "object" && !Array.isArray(v) && "question" in (v as object) && "outcomes" in (v as object);
let predictionCount = 0;
for (const [name, v] of Object.entries(DATA)) {
  if (!isPredictionMarket(v)) continue;
  predictionCount++;
  const resolved = findPredictionMarket(v.question);
  if (!resolved) errors.push(`data.${name}: question "${v.question}" does not resolve in the prediction registry`);
  else if (resolved !== v) errors.push(`data.${name}: question "${v.question}" resolves to a DIFFERENT market — duplicate question strings in data.ts`);
}
if (predictionCount === 0) errors.push("prediction registry sweep found 0 question-shaped markets in data.ts — the shape filter is broken");

// Every registered fixture needs a sport so headerKind picks the right layout.
for (const [key, m] of Object.entries(REGISTRY)) {
  if (!m.sport) errors.push(`REGISTRY["${key}"] (${m.teams[0].name} vs ${m.teams[1].name}) is missing its "sport" field`);
}

if (errors.length > 0) {
  console.error(`✗ check-market-links found ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `✓ check-market-links: ${fixtures.length} fixtures + ${SPORTS_GAMES.length} carousel games resolve; ${POPULAR_TOPICS.length} pills hit valid topics; ${predictionCount} prediction markets resolve; all ${Object.keys(REGISTRY).length} registered fixtures declare a sport.`,
);
