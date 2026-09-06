import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { comboOutcomeVisual, outcomeButtonVisual } from "./buttonStyle";
import { colors, MUTED_OUTLINE, ON_SURFACE_BUTTON_BG } from "./colors";

describe("regular-mode outcome buttons", () => {
  it("muted-color uses muted fill and team-colored text with no outline", () => {
    const visual = outcomeButtonVisual("default", "gray-colored", "#175e33", { mode: "muted-color" });
    assert.equal(visual.container.backgroundColor, ON_SURFACE_BUTTON_BG);
    assert.equal(visual.container.borderWidth, 0);
    assert.equal(visual.container.borderColor, "transparent");
    assert.notEqual(visual.container.borderColor, MUTED_OUTLINE);
    assert.notEqual(visual.text.color, "#131416");
    assert.notEqual(visual.text.color, colors.textAlternative);
  });

  it("fill mode uses a solid accent and dark label", () => {
    const visual = outcomeButtonVisual("default", "gray-colored", "#baf24a", { mode: "fill" });
    assert.equal(visual.container.backgroundColor, colors.green);
    assert.equal(visual.text.color, "#131416");
  });
});

describe("combo outcome chrome", () => {
  it("defaults unselected pills to outline, MUTED_OUTLINE, and TextAlternative", () => {
    const visual = comboOutcomeVisual(false, "#175e33");
    assert.equal(visual.container.backgroundColor, "transparent");
    assert.equal(visual.container.borderWidth, 1);
    assert.equal(visual.container.borderColor, MUTED_OUTLINE);
    assert.equal(visual.text.color, colors.textAlternative);
  });

  it("muted chrome keeps fill and team-colored ink when opted in", () => {
    const visual = comboOutcomeVisual(false, "#175e33", 12, { unselectedChrome: "muted" });
    assert.equal(visual.container.backgroundColor, ON_SURFACE_BUTTON_BG);
    assert.equal(visual.container.borderWidth, 0);
    assert.equal(visual.container.borderColor, "transparent");
    assert.notEqual(visual.container.borderColor, MUTED_OUTLINE);
    assert.notEqual(visual.text.color, colors.textAlternative);
  });

  it("Combos-page outline chrome is transparent fill, MUTED_OUTLINE, TextAlternative", () => {
    const visual = comboOutcomeVisual(false, "#175e33", 12, { unselectedChrome: "outline" });
    assert.equal(visual.container.backgroundColor, "transparent");
    assert.equal(visual.container.borderWidth, 1);
    assert.equal(visual.container.borderColor, MUTED_OUTLINE);
    assert.equal(visual.text.color, colors.textAlternative);
  });

  it("keeps template Add pills on muted outline and TextAlternative ink", () => {
    const visual = comboOutcomeVisual(false, "#8CE3FF", 12, { unselectedChrome: "outline" });
    assert.equal(visual.container.backgroundColor, "transparent");
    assert.equal(visual.container.borderColor, MUTED_OUTLINE);
    assert.equal(visual.text.color, colors.textAlternative);
  });

  it("does not fill a selected combo body with the team color", () => {
    const visual = comboOutcomeVisual(true, "#baf24a", 12, { mode: "muted-color" });
    assert.equal(visual.container.backgroundColor, "transparent");
  });

  it("selected combo CSS border is transparent so gradient stroke is not replaced by team color", () => {
    const visual = comboOutcomeVisual(true, "#8CE3FF", 12, { unselectedChrome: "outline" });
    assert.equal(visual.container.borderColor, "transparent");
    assert.notEqual(visual.container.borderColor, "#8CE3FF");
  });
});
