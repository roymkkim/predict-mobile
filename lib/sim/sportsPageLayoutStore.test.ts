import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  SPORTS_PAGE_LAYOUT_DEFAULT,
  SPORTS_PAGE_LAYOUT_LABELS,
  parseSportsPageLayout,
} from "./sportsPageLayoutStore";
import { sportsHubPillsFromSports, SPORTS_HUB_LEAGUE_PILLS } from "./sportsHubPills";

describe("sports page layout", () => {
  it("defaults to the category list and treats unknown storage as list", () => {
    assert.equal(SPORTS_PAGE_LAYOUT_DEFAULT, "list");
    assert.equal(parseSportsPageLayout(null), "list");
    assert.equal(parseSportsPageLayout("nope"), "list");
    assert.equal(parseSportsPageLayout("list"), "list");
    assert.equal(parseSportsPageLayout("page"), "page");
    assert.equal(SPORTS_PAGE_LAYOUT_LABELS.list, "List");
    assert.equal(SPORTS_PAGE_LAYOUT_LABELS.page, "Sports page");
  });

  it("leads the Sports page rail with MLB and NFL league shortcuts", () => {
    const pills = sportsHubPillsFromSports([
      { slug: "baseball", label: "Baseball" },
      { slug: "football", label: "Football" },
    ]);
    assert.deepEqual(
      SPORTS_HUB_LEAGUE_PILLS.map((pill) => pill.label),
      ["MLB", "NFL"],
    );
    assert.equal(pills[0].href, "/uxr-sport/baseball?league=MLB");
    assert.equal(pills[1].href, "/uxr-sport/football?league=NFL");
    assert.equal(pills[2].href, "/uxr-sport/baseball");
    assert.equal(pills[3].href, "/uxr-sport/football");
  });
});
