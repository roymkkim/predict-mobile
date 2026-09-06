import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { comboPreviewsRelatedToMatch } from "./comboRelatedPreviews";

const PREVIEWS = [
  { label: "MMA", rows: ["Adesanya · Adesanya vs Du Plessis"] },
  {
    label: "Pro Football",
    rows: ["Packers · Packers vs Steelers", "Panthers · Panthers vs Cardinals"],
  },
  { label: "Soccer", rows: ["Brazil · Brazil vs Argentina"] },
  { label: "Tennis", rows: ["Alcaraz · Alcaraz vs Sinner"] },
];

describe("comboPreviewsRelatedToMatch", () => {
  it("ranks templates that name the event's teams first", () => {
    const related = comboPreviewsRelatedToMatch(
      { names: ["Panthers", "Cardinals"], sport: "americanFootball", league: "NFL" },
      PREVIEWS,
    );
    assert.equal(related[0]?.label, "Pro Football");
    assert.equal(related.every((p) => p.label === "Pro Football"), true);
  });

  it("falls back to the same-sport template when the teams are not in a pack", () => {
    const related = comboPreviewsRelatedToMatch(
      { names: ["Man United", "Tottenham"], sport: "soccer" },
      PREVIEWS,
    );
    assert.equal(related.length > 0, true);
    assert.equal(related[0]?.label, "Soccer");
  });

  it("returns nothing when the event has no matching sport or teams", () => {
    const related = comboPreviewsRelatedToMatch(
      { names: ["Faker", "Caps"], sport: "esports" },
      PREVIEWS,
    );
    assert.deepEqual(related, []);
  });
});
