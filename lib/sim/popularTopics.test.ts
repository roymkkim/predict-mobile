import {
  POPULAR_TOPIC_ROUTES,
  POPULAR_TOPIC_SLUGS,
  POPULAR_TOPICS,
  popularLabelForSlug,
  resolvePopularTopicSlug,
} from "./popularTopics";

const errors: string[] = [];

const slugs = Object.values(POPULAR_TOPIC_SLUGS);
if (new Set(slugs).size !== slugs.length) {
  errors.push("POPULAR_TOPIC_SLUGS has duplicate slugs — /trending?topic= would collide");
}

for (const label of POPULAR_TOPICS) {
  const slug = POPULAR_TOPIC_SLUGS[label];
  const route = POPULAR_TOPIC_ROUTES[label];
  if (popularLabelForSlug(slug) !== label) errors.push(`popularLabelForSlug("${slug}") !== "${label}"`);
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

if (resolvePopularTopicSlug("fed") !== "fed") {
  errors.push('tapping Fed must resolve ?topic=fed');
}
if (resolvePopularTopicSlug(undefined) !== POPULAR_TOPIC_SLUGS.Trump) {
  errors.push("resolvePopularTopicSlug(undefined) should fall back to Trump (header → /trending)");
}
if (resolvePopularTopicSlug("not-a-topic") !== POPULAR_TOPIC_SLUGS.Trump) {
  errors.push("resolvePopularTopicSlug(unknown) should fall back to Trump");
}

if (errors.length > 0) {
  console.error(`✗ popularTopics: ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✓ popularTopics: ${POPULAR_TOPICS.length} pills round-trip through /trending?topic=`);
