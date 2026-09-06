// Domain data types for the native Predict feed rebuild (Version A). Ported from
// predict-simulator-2/src/data/types.ts, trimmed to what the mobile feed needs.
import type { ImageSourcePropType } from "react-native";

export type Team = {
  name: string;
  pct: string;
  color: string;
  initial: string;
  abbr?: string;
  logo?: string;
  hasBall?: boolean;
  score?: number;
  scoreText?: string;
  setScores?: number[];
  flag?: string;
  // Golf only: holes played in the current round ("thru N"), shown as a second
  // muted column beside the to-par score.
  thru?: string;
  // Racing only: time gap to the reference (e.g. "+4.2s"), shown as a second
  // muted column beside the position.
  gap?: string;
  // Individual sports (golf/tennis/racing) only: a real athlete headshot, shown
  // in place of the acronym/flag crest when the "Athlete photos" toggle is on.
  // `photoAspect` is the source image's height/width so StandardCard can
  // top-anchor the crop (keep the face) inside the square avatar.
  photo?: ImageSourcePropType;
  photoAspect?: number;
};

export type BaseballLiveState = {
  balls?: number;
  strikes?: number;
  outs?: number;
  bases?: {
    first?: "home" | "away";
    second?: "home" | "away";
    third?: "home" | "away";
  };
};

export type Match = {
  league: string;
  leagueColor?: string;
  sport?: string;
  live?: { mins: string; score?: [number, number]; baseball?: BaseballLiveState };
  teams: [Team, Team];
  draw?: { pct: string };
  vol: string;
  date: string;
  time?: string;
  markets: number;
  diamond?: { outs: string; note: string };
};

// Optional per-outcome avatar shown to the left of the outcome label in market
// cards (OutcomeRows). "image" = a flag or team logo (set `contain` for a
// transparent logo that needs padding on a backing); "swatch" = a solid color
// chip (e.g. a political party color) for outcomes that have no logo.
export type OutcomeAvatar =
  | { type: "image"; source: ImageSourcePropType; contain?: boolean; bg?: string }
  | { type: "swatch"; color: string };

export type PoliticsOutcome = {
  label: string;
  pct: string;
  multiplier: string;
  color: string;
  avatar?: OutcomeAvatar;
  // Team acronym (e.g. "LAD", "NYY") for team-based market outcomes. When the
  // team-avatar style is "acronym" (the default), the outcome renders this as a
  // colored acronym tile instead of the official logo in `avatar`.
  abbr?: string;
  // Per-outcome resolution copy shown in "{label} Market Rules" sheets.
  rules?: string[];
  // Optional per-outcome volume for nested Yes/No event markets (Polymarket).
  vol?: string;
};

export type PoliticsMarket = {
  category: string;
  date: string;
  question: string;
  outcomes: PoliticsOutcome[];
  vol: string;
  markets: number;
  avatar?: ImageSourcePropType;
  // Render an empty surface2 tile in the avatar slot (no image). Used where a
  // real league logo was retired (e.g. MLB).
  blankAvatar?: boolean;
  // Backdrop behind the avatar image (square corners around a round/transparent
  // logo). Defaults to colors.surface2 in PoliticsCard when unset.
  avatarBg?: string;
  // Zoom factor applied to the avatar image inside its clipped square. Use ~1.45
  // to crop out a baked-in white background on a round logo (the inscribed circle
  // expands past the square corners so no background shows). Defaults to 1.
  avatarScale?: number;
  // When true, the header avatar image is rendered "contain" (fully visible,
  // letterboxed) instead of "cover". Use for wide logos that would be cropped by
  // a square cover fit (e.g. the MLB batter logo). Pairs well with avatarBg.
  avatarContain?: boolean;
};

export type CryptoMarket = PoliticsMarket;

// A "BTC Up or Down Daily" live-center card: a live price area chart, a target
// line, a centered Bitcoin coin mark + title, a ticking countdown, two Up/Down
// probability buttons, and a vol / reset-cadence footer.
export type BtcDailyMarket = {
  title: string;
  price: string;
  time: string;
  up: { label: string; pct: string };
  down: { label: string; pct: string };
  category: string;
  vol: string;
  resets: string;
};

// Which hero element renders at the top of the feed: the World Cup promo card,
// the live BTC Up/Down card, a swipeable banner carousel, or nothing.
export type HeroSectionOption = "world-cup" | "btc" | "carousel" | "none";

// Carousel banner presentation: "card" = the row-style promo card (square art
// tile + title/subtitle text beside it); "image" = a full-bleed hero image with
// the title overlaid bottom-left.
export type HeroBannerStyle = "card" | "image";

// Which chart treatment the carousel's BTC banner uses: "target" = the
// pre-existing BtcDailyCard-style chart (dashed current-price line + a solid
// "$X target" line broken around its label + a Bitcoin coin marker); "chevron"
// = the alternate treatment (no lines; an accent "Target: $X" tag with looping
// cascading chevrons that flow toward the target level).
export type HeroBtcChart = "target" | "chevron";
export type BtcLiveCarouselCard = "simple" | "chart";
export type ChartLiveCardHeader = "avatar" | "score" | "minimized";
/** Which block sits on top of the live-carousel chart card. */
export type ChartLiveCardStack = "header" | "chart";

// Independent toggles for each piece of the card footer, surfaced as the
// "Footer detail" control. The header is fixed to the large-avatar treatment
// (end date above the title); only the footer pieces are composable here.
// - metadata: the league/category MetaTag pill.
// - volume: the compacted volume (formatVol, e.g. "$25.5M").
// - endDate: the end date next to volume (relocated out of the header).
// - outcomes: the "+N outcomes" count.
export type FooterDetail = {
  metadata: boolean;
  volume: boolean;
  endDate: boolean;
  outcomes: boolean;
};

// Per-piece style for the meta detail items (category/volume/outcomes): when a
// flag is true the piece renders inside a tag pill, when false as plain text.
export type DetailTags = {
  metadata: boolean;
  volume: boolean;
  outcomes: boolean;
};

// How many rows the "Popular today" chips wrap into when folded inside the
// Trending section: a single scrolling row or two stacked rows.
export type PopularRows = 1 | 2;

export type Display = "avatar" | "logo" | "name";
// Team-avatar style for team-based market outcomes: "logo" shows the official
// team logo image, "icon" shows the approved sport rendering (helmet/mitt),
// and "acronym" keeps the neutral legacy placeholder.
export type TeamAvatarStyle = "logo" | "acronym" | "icon";
export type VersusLayout = "center" | "sides";
// Versus-card format: "new" = the default card; "old" = the same card plus an
// explicit team-name row below the score unit, with score/border glow forced off.
export type VersusMode = "new" | "old";

// How the versus card's live/inactive accent border (and in-place score glow) is
// anchored: "center" lights the middle of the ring; "corner" lights the top-left
// corner like standard cards.
export type VersusAccent = "center" | "corner";

// How the standard (stacked-row) card's live/inactive accent border is anchored:
// "center" lights the middle of the top edge; "corner" lights the top-left
// corner. Mirrors VersusAccent but applies to StandardCard.
export type StandardAccent = "center" | "corner";

// When a centered accent is used, how wide the centered glow spans the top edge:
// "default" is the ~half-width ellipse that fades before the corner arcs; "full"
// spans the entire top edge and bleeds a faded glow into the left+right corners.
export type CenterAccentWidth = "default" | "full";

// Unit shown after the odds on outcome buttons: "percent" (e.g. "ENG 38%") or
// "cents" / price (e.g. "ENG 38¢"). Default "cents".
export type OddsUnit = "percent" | "cents";

// How the score-glow celebration is drawn: "sides" lights the edge nearest the
// scorer; "inPlace" recolors the card's normal accent to the team and shimmies it.
export type ScoreGlowMode = "sides" | "inPlace";

// How match (game) cards are laid out in the feed: "mixed" uses head-to-head
// VersusCards for some games and stacked-row StandardCards for others; "standard"
// forces every game card into the stacked-row StandardCard layout.
export type MatchLayout = "versus" | "standard" | "mixed";
// How market cards are framed in the feed: "card" = filled surface, "plain" =
// same layout with no background fill, "list" = no card container, rows divided
// by hairlines.
export type CardStyle = "card" | "plain" | "list";
export type StandardScore = "aside" | "inline";
export type StandardTitle = "show" | "hide";
export type VersusTitle = "show" | "hide";
export type VersusSidesLive = "center" | "top";
export type VersusHeaderAlign = "center" | "left";

// Packaged "version" of the head-to-head VersusCard in the SIDES layout:
// "a" (default) = the current look (live status centered between the scores,
// centered title). "b" = the timestamp + title are left-aligned at the top, a
// colon glyph sits between the scores instead of the status, and the scores are
// bumped to 32/40 with a 16px gap to the team avatar.
export type VersusVersion = "a" | "b";

// Centered VersusCard sub-layout (only the "center" score layout):
// "centered" (default) = the current look (live status + title centered, the
// scores joined as "1 - 1" with the probability bar below). "left" = the live
// timestamp + title left-align at the top, the live border accent sits on the
// LEFT, and the probability bar relocates to sit horizontally BETWEEN the two
// scores (avatar + score + bar + score + avatar).
export type VersusCenterLive = "centered" | "left";

// Where a card's footer metadata (league tag, volume, "+N outcomes") sits:
// "bottom" (default) = the standard bottom MetaFooter row; "topRight" = compact
// chips pinned to the top-right of the card, inline with the LIVE indicator.
export type FooterPosition = "bottom" | "topRight";

// Font size (px) for the head-to-head VersusCard scores in both center and sides
// layouts. Default 24; lineHeight is derived as round(size * 1.25).
export type VersusScoreSize = 24 | 28 | 32;
// Avatar size (px) for card-body outcome/team avatars (StandardCard + VersusCard
// crests, market OutcomeRows). Does NOT affect the title/header market avatar.
export type BodyAvatarSize = 24 | 32 | 40;

// How the live status renders ("LIVE format" toggle). "inline" (default,
// "Truncated") = one line: pulsing dot + ticking clock ("● 3rd 12:12").
// "stacked" ("LIVE included") = the LIVE word is shown: VersusCards render two
// lines (dot + "LIVE" over the muted period/clock); StandardCards render one
// line prefixed "Live • " before the clock.
export type LiveFormat = "inline" | "stacked";
export type StandardAsideCue = "name" | "score";
export type StandardButtons = "simple" | "spreads";
export type ButtonSize = "md" | "lg";
export type PossessionMode = "dot" | "icon" | "none";
// Which sports show the live possession cue: only American football (default),
// every sport, or none.
export type PossessionScope = "americanFootball" | "all" | "none";
export type ButtonText =
  | "gray-colored"
  | "light-colored"
  | "gray-white"
  | "light-black"
  | "colored-white";
export type ButtonStyle = "default" | "polymarket" | "outline";
export type ButtonAnim = "ticker" | "slot" | "slide";
export type MetaStyle = "filled" | "outline";
export type MetaPlacement = "top" | "bottom" | "off";
export type AnimStyle = "pulse" | "corner" | "border";
export type LiveCueColor = "red" | "green";
export type Density = "compact" | "comfort";
export type BorderCuePlacement = "left" | "center";
// "Reveal on scroll" mode: off (static borders), live (only live-game cards
// reveal as they scroll in), or all (every accent border reveals on scroll).
export type RevealMode = "off" | "live" | "all";
export type CardPadding = "12" | "16";
export type MobileBg = "default" | "black";
// Where the "Popular today" chips live: their own standalone section above the
// feed, or folded in as the first row inside the Trending section.
export type PopularPlacement = "section" | "inTrending";
// Where the dismissible "Active positions…" notice renders: as the first slide
// of the hero carousel, or inline in the portfolio card between the quick-action
// tiles and the Claim button.
export type PositionBannerPlacement = "carousel" | "inline";
