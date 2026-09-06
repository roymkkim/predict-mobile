import { createContext, useContext } from "react";
import type { BodyAvatarSize, BtcLiveCarouselCard, CardStyle, CenterAccentWidth, Density, DetailTags, FooterDetail, FooterPosition, HeroBannerStyle, HeroBtcChart, HeroSectionOption, LiveFormat, MatchLayout, OddsUnit, PopularPlacement, PopularRows, PositionBannerPlacement, PossessionScope, ScoreGlowMode, StandardAccent, TeamAvatarStyle, VersusAccent, VersusCenterLive, VersusHeaderAlign, VersusLayout, VersusMode, VersusScoreSize, VersusVersion } from "./types";

// The four content sections of the feed, in display order. "trending" is the
// pre-existing mixed feed; the rest are curated single-category sections.
export type FeedSectionKey = "trending" | "sports" | "crypto" | "politics";
// Each section can be toggled on/off and capped to a card count (3-5).
export type FeedSectionConfig = { enabled: boolean; count: number };
export type FeedSections = Record<FeedSectionKey, FeedSectionConfig>;

export const FEED_SECTION_ORDER: FeedSectionKey[] = ["trending", "sports", "crypto", "politics"];
export const FEED_SECTION_TITLES: Record<FeedSectionKey, string> = {
  trending: "Trending",
  sports: "Sports",
  crypto: "Crypto",
  politics: "Politics",
};
// Allowed card counts per section.
export const FEED_SECTION_COUNTS = [3, 4, 5] as const;

// App-level feed display settings surfaced through the "Predictions" title
// bottom sheet: the layout density (compact/comfort) and a handle to open the
// sheet. The live-accent toggle is driven separately via LiveCueColorProvider.
export type FeedSettings = {
  density: Density;
  showFooter: boolean;
  // Independent on/off toggles for each footer piece (metadata tag, volume,
  // end date, "+N outcomes"). See FooterDetail.
  footerDetail: FooterDetail;
  // Per-piece tag-vs-text style for the meta detail items (category/volume/
  // outcomes). Optional so standalone page literals inherit the defaults
  // (category as a tag, volume + outcomes as plain text).
  detailTags?: DetailTags;
  versusLayout: VersusLayout;
  // Versus (head-to-head) card format. "old" keeps the normal card layout (so it
  // respects the Center/Sides "versus score" choice) but adds an explicit
  // team-name row between the score unit and the probability bar, and forces the
  // score-glow and animated border cues off. "new" is the default card.
  versusMode: VersusMode;
  // Where the versus card's accent border (and in-place score glow) sits:
  // "center" (the middle of the ring) or "corner" (top-left, like standard
  // cards). Default "corner".
  versusAccent: VersusAccent;
  // Alignment of the centered versus card's header (timestamp + title): "center"
  // (default) or "left". "left" also tightens the card's top padding to 12px.
  versusHeaderAlign: VersusHeaderAlign;
  // Centered VersusCard sub-layout: "centered" (default) or "left" (timestamp +
  // title left-aligned, left border accent, probability bar between the scores).
  // Optional; defaults to "centered" where unset (standalone pages inherit it).
  versusCenterLive?: VersusCenterLive;
  // Where footer metadata sits: "bottom" (default) or "topRight" (compact chips
  // inline with the LIVE indicator; centered VersusCard only). Optional;
  // defaults to "bottom" where unset.
  footerPosition?: FooterPosition;
  versusVersion: VersusVersion;
  // When on (default), upcoming (non-live) games render as head-to-head
  // VersusCards (subject to matchLayout). When off, only live games keep the
  // versus format and every upcoming game collapses to the stacked-row
  // StandardCard instead.
  versusUpcoming: boolean;
  // Where the standard (stacked-row) card's accent border sits: "corner"
  // (top-left, default) or "center" (middle of the top edge, like a centered
  // versus card).
  standardAccent: StandardAccent;
  // When a centered accent is in use, how wide the centered glow spans: "default"
  // (~half-width ellipse, fades before the corners) or "full" (spans the whole
  // top edge with a faded glow bleeding into both corners).
  centerAccentWidth: CenterAccentWidth;
  // Opacity multiplier for the live/inactive border accent glow (0..1). 1 = full
  // brightness (default); lower values dim the accent ring uniformly.
  accentOpacity: number;
  // Whether outcome-button odds render as a percentage ("percent", e.g.
  // "ENG 38%") or price-in-cents ("cents", e.g. "ENG 38¢"). Default "cents".
  oddsUnit: OddsUnit;
  // How game cards are laid out: "versus" uses VersusCards everywhere,
  // "standard" uses StandardCards everywhere, and "mixed" uses StandardCards
  // on Home while sports pages use VersusCards.
  matchLayout: MatchLayout;
  // When on, a live card whose team just scored flashes a border glow in that
  // team's color, anchored to the scorer's side/half of the ring.
  scoreGlow: boolean;
  // How that score glow is drawn: "sides" lights the scorer's edge; "inPlace"
  // recolors the card's normal accent to the team and shimmies it left/right.
  scoreGlowMode: ScoreGlowMode;
  // When on (and scoreGlow is on), a team scoring also replaces the live dot +
  // clock with "<team> scored" in the team color for >= 2s, then fades back.
  scorerCallout: boolean;
  // When on, a live card's border accent also blooms a very subtle glow inward
  // from the lit edge into the card interior (in the live-cue color).
  innerGlow: boolean;
  // When on, standard cards render their probability bars in white instead of
  // each team's accent color.
  whiteBars: boolean;
  // When on, the gray track behind each probability bar is shown and bars fill a
  // share of it (raw percentage). When off (default), the track is hidden and the
  // bars are normalized so the leading outcome's bar fills the full width.
  barTrack: boolean;
  // Which hero element renders at the top of the feed (World Cup card / live
  // BTC card / banner carousel / none).
  heroSection: HeroSectionOption;
  // How the hero carousel renders each promo banner: "card" (row card) or
  // "image" (full-bleed hero image with the title overlaid). Optional; defaults
  // to "image" where unset.
  heroBannerStyle?: HeroBannerStyle;
  // Which chart treatment the carousel's BTC banner uses: "chevron" (default) =
  // the line-less tag with cascading chevrons; "target" = the pre-existing
  // BtcDailyCard-style chart (dashed current line + a solid "$X target" line +
  // Bitcoin coin marker). Optional; defaults to "chevron" where unset.
  heroBtcChart?: HeroBtcChart;
  // Independent of heroBtcChart: recolors the BTC carousel chart card with the
  // #BA6600 orange theme (works with either "target" or "chevron"). Optional;
  // defaults to false (no orange theme) where unset.
  heroBtcOrange?: boolean;
  // Per-section enable + card-count config for the four feed sections.
  sections: FeedSections;
  // Where the "Popular today" chips render: their own section, or as the first
  // row inside the Trending section.
  popularPlacement: PopularPlacement;
  // When the chips are folded into Trending, whether they wrap into one row or
  // two stacked rows.
  popularRows: PopularRows;
  // How market cards are framed: filled card, no-background card, or a divided list.
  cardStyle: CardStyle;
  // Optional card fill override (e.g. the brighter rgba(255,255,255,0.08)
  // used on pure-black pages). Falls back to the theme surface when unset.
  cardBg?: string;
  // When on, the portfolio block shows the solid blue "Claim rewards" CTA.
  // Off by default — kept out of the demo unless explicitly enabled.
  showClaim: boolean;
  // When on (default), the dismissible "Active positions…" notice is shown
  // (placement controlled by positionBannerPlacement).
  showPositionBanner: boolean;
  // Where that notice renders: as the first hero-carousel slide, or inline in
  // the portfolio card between the quick-action tiles and the Claim button.
  positionBannerPlacement: PositionBannerPlacement;
  // Font size (px) for the VersusCard scores (center + sides layouts). Optional;
  // pages that omit it inherit the 24px default.
  versusScoreSize?: VersusScoreSize;
  // Avatar size (px) for StandardCard body crests ONLY. Does NOT affect
  // VersusCard crests, market OutcomeRows avatars, or the title/header market
  // avatar. Optional; pages that omit it inherit the 32px default.
  bodyAvatarSize?: BodyAvatarSize;
  // Show the header avatar on sports-related market cards (e.g. the MLB logo on
  // "Who wins the MLB World Series?"). Optional; defaults to false (hidden).
  sportsMarketAvatar?: boolean;
  // Live status format in the centered VersusCard header. Optional; pages that
  // omit it inherit the "inline" (single-line dot + clock) default.
  liveFormat?: LiveFormat;
  // Hide the accent border + bloom on the CENTERED VersusCard layout only.
  // Optional; pages that omit it inherit false (accent shown). The control is
  // surfaced only when the versus layout is "center".
  hideVersusAccent?: boolean;
  // When on (default), live match/market cards show the animated live border
  // accent ring + bloom glow (and standard cards' inactive shimmer). When off,
  // those cards fall back to the plain 1px hairline border with no accent/bloom.
  // Optional: pages that omit it inherit the on/show default.
  showLiveAccent?: boolean;
  // When on, the "Live games" carousel of compact game cards renders below the
  // Categories section. On by default at home; standalone pages set it false.
  showLiveGames: boolean;
  // Live games carousel card style: "full" (default) renders large cards with
  // scores/coin, live status, and two outcome buttons; "compact" renders the
  // original small two-row cards. Optional; pages that omit it inherit "full".
  liveGamesCard?: "compact" | "full";
  // BTC live carousel card treatment. The sports rail remains the production
  // layout; this only switches the first BTC card between the compact dial and
  // the interactive chart.
  btcLiveCarouselCard?: BtcLiveCarouselCard;
  // When on, the "Active positions" carousel section renders below the hero. On
  // by default.
  showActivePositions: boolean;
  // When on (default), the "BTC Up or Down" seek-left card renders below the
  // hero carousel on the home feed, under its own "BTC Up or Down" section
  // header (chevron links to the crypto page).
  showBtcUpDown: boolean;
  // When on (default), team/outcome avatars render on the left of each outcome
  // row in market cards (OutcomeRows) and on standard match cards. Versus
  // (head-to-head) cards always show avatars regardless of this setting.
  showTeamAvatars: boolean;
  // When on (default), standard match cards move the upcoming "Ends…" date out of
  // the card header and into the footer next to volume, freeing the header to
  // show the title across up to two lines without truncating.
  standardDateInFooter: boolean;
  // Style for team-based market outcome avatars: "logo" (default) shows the
  // official team logo; "icon" shows the approved sport rendering (helmet/mitt).
  // "acronym" keeps the neutral legacy placeholder.
  teamAvatars: TeamAvatarStyle;
  // Which sports show the live possession cue on game cards: only American
  // football (default), every sport ("all"), or none.
  possessionScope: PossessionScope;
  // Region market-source control surface (home feed only): "banner" (default)
  // shows the sticky "Displaying local markets" footer. The Kalshi/Polymarket
  // venue badge always lives in the nav header (Perps Lite/Pro-style pill).
  // `openRegion` opens the switch confirmation sheet.
  regionControl?: "banner" | "header";
  region?: "polymarket" | "kalshi";
  openRegion?: () => void;
  // When on (default), the balance + quick actions render as a compact green
  // balance pill + red positions badge in the nav header (home feed only),
  // replacing the portfolio card's quick-action tiles. Tap behavior depends on
  // balancePillStyle: the default "badge" routes to /positions; "soft"/"solid"
  // open the money (fund / withdraw) sheet via openMoney. Optional; pages that
  // omit it inherit the on/header default.
  headerBalance?: boolean;
  // Visual style of the header balance pill: "badge" (default) = dark surface
  // pill + green text with a red count badge overlapping the top-right corner,
  // tapping routes to /positions (no money sheet); "soft" = muted success
  // background + success-green text; "solid" = solid lime background + dark text.
  // "soft"/"solid" pills open the money sheet alongside a separate count badge.
  balancePillStyle?: "soft" | "solid" | "badge";
  // When on (default), the home nav header uses the large arrangement: a slim
  // nav row (back chevron + balance pill + search) with a big "Predictions"
  // title on a second line below it (mirrors the lg PageHeader on inner pages).
  // When off, the compact single-row header is used (title inline in the nav
  // row). Home feed only. Optional; omitting it inherits the on default.
  largeHeader?: boolean;
  openMoney?: () => void;
  openSearch?: () => void;
  openSettings: () => void;
};

const FeedSettingsContext = createContext<FeedSettings>({
  density: "compact",
  showFooter: true,
  footerDetail: { metadata: true, volume: true, endDate: false, outcomes: true },
  detailTags: { metadata: true, volume: true, outcomes: true },
  versusLayout: "sides",
  versusMode: "new",
  versusAccent: "corner",
  versusHeaderAlign: "center",
  versusCenterLive: "centered",
  footerPosition: "bottom",
  versusVersion: "a",
  versusUpcoming: true,
  standardAccent: "corner",
  centerAccentWidth: "default",
  accentOpacity: 0.54,
  versusScoreSize: 32,
  bodyAvatarSize: 32,
  sportsMarketAvatar: false,
  liveFormat: "inline",
  hideVersusAccent: false,
  showLiveAccent: true,
  oddsUnit: "cents",
  matchLayout: "versus",
  scoreGlow: false,
  scoreGlowMode: "sides",
  scorerCallout: false,
  innerGlow: false,
  whiteBars: false,
  barTrack: false,
  heroSection: "carousel",
  heroBannerStyle: "image",
  heroBtcChart: "chevron",
  heroBtcOrange: false,
  sections: {
    trending: { enabled: true, count: 5 },
    sports: { enabled: true, count: 4 },
    crypto: { enabled: true, count: 4 },
    politics: { enabled: true, count: 4 },
  },
  popularPlacement: "section",
  popularRows: 2,
  cardStyle: "card",
  showClaim: false,
  showPositionBanner: false,
  positionBannerPlacement: "carousel",
  showLiveGames: true,
  btcLiveCarouselCard: "simple",
  showActivePositions: false,
  showBtcUpDown: false,
  showTeamAvatars: true,
  standardDateInFooter: true,
  teamAvatars: "logo",
  possessionScope: "none",
  headerBalance: true,
  balancePillStyle: "badge",
  largeHeader: true,
  openSettings: () => {},
});

export const FeedSettingsProvider = FeedSettingsContext.Provider;
export const useFeedSettings = () => useContext(FeedSettingsContext);
