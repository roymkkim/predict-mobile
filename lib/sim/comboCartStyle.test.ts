import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { colors, MUTED_OUTLINE } from "./colors";
import {
  COMBO_CART_BADGE_BORDER,
  COMBO_CART_BADGE_BORDER_WIDTH,
  COMBO_CART_FILL_BADGE_BG,
  COMBO_CART_FILL_BADGE_FG,
  COMBO_CART_FLAT_BADGE_BG,
  COMBO_CART_FLAT_BADGE_FG,
  COMBO_CART_OUTLINE_BADGE_BG,
  COMBO_CART_STYLE_DEFAULT,
  comboCartBadgeColors,
  parseComboCartStyle,
} from "./comboCartStyle";

describe("combo cart FAB style", () => {
  it("defaults to the fill cart when storage is missing or invalid", () => {
    assert.equal(COMBO_CART_STYLE_DEFAULT, "fill");
    assert.equal(parseComboCartStyle(null), "fill");
    assert.equal(parseComboCartStyle(""), "fill");
    assert.equal(parseComboCartStyle("nope"), "fill");
    assert.equal(parseComboCartStyle("outline"), "outline");
    assert.equal(parseComboCartStyle("fill"), "fill");
  });

  it("uses a card-surface badge with a white numeral on Fill, lime on Outline", () => {
    assert.equal(COMBO_CART_FILL_BADGE_BG, colors.surface);
    assert.equal(COMBO_CART_FILL_BADGE_BG, "#18181B");
    assert.equal(COMBO_CART_FILL_BADGE_FG, "#ffffff");
    assert.deepEqual(comboCartBadgeColors("fill", "gradient"), {
      backgroundColor: colors.surface,
      color: "#ffffff",
    });
    assert.equal(comboCartBadgeColors("outline", "gradient").backgroundColor, COMBO_CART_OUTLINE_BADGE_BG);
    assert.notEqual(COMBO_CART_FILL_BADGE_BG.toLowerCase(), "#ff7584");
    assert.deepEqual(comboCartBadgeColors("fill"), {
      backgroundColor: COMBO_CART_FLAT_BADGE_BG,
      color: "#111111",
    });
    assert.deepEqual(comboCartBadgeColors("fill", "flat"), {
      backgroundColor: COMBO_CART_FLAT_BADGE_BG,
      color: "#111111",
    });
    assert.equal(COMBO_CART_FLAT_BADGE_FG, "#111111");
    assert.equal(COMBO_CART_BADGE_BORDER, MUTED_OUTLINE);
    assert.equal(COMBO_CART_BADGE_BORDER, "rgba(226,226,255,0.15)");
    assert.equal(COMBO_CART_BADGE_BORDER_WIDTH, 1);
  });
});
