import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { COMBO_LINE_SLIDER_DEFAULT, parseComboLineSlider } from "./comboLineSliderStore";

describe("combo line slider", () => {
  it("defaults to off and treats unknown storage as off", () => {
    assert.equal(COMBO_LINE_SLIDER_DEFAULT, false);
    assert.equal(parseComboLineSlider(null), false);
    assert.equal(parseComboLineSlider(""), false);
    assert.equal(parseComboLineSlider("1"), true);
    assert.equal(parseComboLineSlider("0"), false);
  });
});
