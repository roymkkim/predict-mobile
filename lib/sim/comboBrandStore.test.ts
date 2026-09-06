import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  COMBO_BRAND_FLAT,
  COMBO_BRAND_ON_FILL_FLAT,
  COMBO_BRAND_ON_FILL_GRADIENT,
  COMBO_BRAND_STYLE_DEFAULT,
  comboBrandOnFillInk,
  parseComboBrandStyle,
} from "./comboBrandStore";

describe("combo brand style", () => {
  it("defaults to flat and treats unknown storage as flat", () => {
    assert.equal(COMBO_BRAND_STYLE_DEFAULT, "flat");
    assert.equal(parseComboBrandStyle(null), "flat");
    assert.equal(parseComboBrandStyle("nope"), "flat");
    assert.equal(parseComboBrandStyle("flat"), "flat");
    assert.equal(parseComboBrandStyle("gradient"), "gradient");
  });

  it("uses white plates and dark ink when flat", () => {
    assert.equal(COMBO_BRAND_FLAT, "#ffffff");
    assert.equal(comboBrandOnFillInk("flat"), COMBO_BRAND_ON_FILL_FLAT);
    assert.equal(comboBrandOnFillInk("gradient"), COMBO_BRAND_ON_FILL_GRADIENT);
  });
});
