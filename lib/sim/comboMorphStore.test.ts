import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  beginComboCartReturn,
  clearComboMorphOrigin,
  clearComboMorphReturnTarget,
  getComboMorphOrigin,
  getComboMorphReturnTarget,
  getComboMorphReverse,
  setComboMorphOrigin,
  setComboMorphReturnTarget,
} from "./comboMorphStore";

const button = {
  x: 10,
  y: 20,
  width: 200,
  height: 48,
  windowWidth: 390,
  windowHeight: 844,
  radius: 12,
};

const fab = {
  x: 318,
  y: 772,
  width: 48,
  height: 48,
  windowWidth: 390,
  windowHeight: 844,
  radius: 24,
};

describe("combo morph return target", () => {
  it("remembers Build a combo bounds when entering, and FAB↔sheet does not overwrite them", () => {
    clearComboMorphOrigin();
    clearComboMorphReturnTarget();
    setComboMorphOrigin(button, { rememberReturn: true });
    assert.equal(getComboMorphReturnTarget(), button);
    setComboMorphOrigin(fab);
    assert.equal(getComboMorphOrigin(), fab);
    assert.equal(getComboMorphReturnTarget(), button);
    assert.equal(getComboMorphReverse(), false);
  });

  it("can refresh the return slot without starting a morph", () => {
    clearComboMorphOrigin();
    clearComboMorphReturnTarget();
    setComboMorphOrigin(fab);
    const detail = { ...button, y: 700 };
    setComboMorphReturnTarget(detail);
    assert.equal(getComboMorphOrigin(), fab);
    assert.equal(getComboMorphReturnTarget(), detail);
    assert.equal(getComboMorphReverse(), false);
  });

  it("replays the shared morph backward from cart to Build a combo", () => {
    clearComboMorphOrigin();
    clearComboMorphReturnTarget();
    setComboMorphOrigin(button, { rememberReturn: true });
    clearComboMorphOrigin();
    assert.equal(getComboMorphOrigin(), null);
    assert.equal(beginComboCartReturn(), true);
    assert.equal(getComboMorphOrigin(), button);
    assert.equal(getComboMorphReverse(), true);
    clearComboMorphOrigin();
    assert.equal(getComboMorphReverse(), false);
  });
});
