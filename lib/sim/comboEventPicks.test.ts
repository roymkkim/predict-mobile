import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildEventComboPreviews, EVENT_PICKS_GUTTER, eventPicksCardWidth } from "./comboEventPicks";

describe("event detail picks", () => {
  it("builds game lines and props for this matchup only", () => {
    const previews = buildEventComboPreviews({
      names: ["Raiders", "Texans"],
      sport: "americanFootball",
      league: "NFL",
      vol: "$1.2M Vol.",
    });
    assert.equal(previews.length, 2);
    assert.equal(previews[0]?.label, "NFL");
    assert.equal(previews[1]?.label, "Props");
    for (const preview of previews) {
      assert.equal(preview.rows.every((row) => /raiders|texans/i.test(row)), true);
      assert.equal(preview.rows.some((row) => /packers|steelers|panthers/i.test(row)), false);
    }
  });

  it("makes a single pick card full width with 16px gutters", () => {
    assert.equal(EVENT_PICKS_GUTTER, 16);
    assert.equal(eventPicksCardWidth(393, 1), 393 - 32);
    assert.equal(eventPicksCardWidth(393, 2), 300);
  });
});
