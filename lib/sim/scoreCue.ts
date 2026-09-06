// Single source of truth for the "a team just scored" cue timing. The three
// visible reactions to a score — the team-colored callout text ("<team>
// scored"), the score-glow border, and the suppression of the resting red live
// accent (which is replaced by the glow) — must all turn the scoring team's
// color, hold together, and revert TOGETHER. Sharing these constants keeps them
// from drifting out of sync.

// Crossfade duration when entering/leaving the cue (callout swap + glow fade).
export const SCORE_FADE_MS = 200;
// How long the cue stays fully on screen in the team's color. Product spec: 2s.
export const SCORE_HOLD_MS = 2000;

// The single moment everything reverts, measured from the score event. The
// callout first fades the live line out (SCORE_FADE_MS) before showing the team
// color, holds it (SCORE_HOLD_MS), then fades it back (SCORE_FADE_MS); the team
// color is therefore on screen until 3 * SCORE_FADE_MS + SCORE_HOLD_MS. The glow
// object's lifetime and the glow border's animation both run to this same total
// so the accent, glow, and callout text all change back at once.
export const SCORE_CUE_MS = 3 * SCORE_FADE_MS + SCORE_HOLD_MS;

// The celebratory shimmy/sweep is a brief flourish at the start of the cue; after
// it completes the lit border simply holds (steady) until the shared revert.
export const SCORE_FLOURISH_MS = 1400;
