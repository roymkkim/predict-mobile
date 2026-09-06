import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { comboPaysCopy, comboToWin, comboToWinCopy, fmtComboPaysAmount } from "./comboPays";

describe("combo pays copy", () => {
  it("formats integer dollars with thousands separators", () => {
    assert.equal(fmtComboPaysAmount(386), "$386");
    assert.equal(fmtComboPaysAmount(1234), "$1,234");
  });

  it("builds $10 pays copy from implied probabilities", () => {
    const picks = [{ cents: 50 }, { cents: 50 }];
    assert.equal(comboToWin(picks, 10), 30);
    assert.equal(comboPaysCopy(picks), "$10 pays $40");
    assert.equal(comboToWinCopy(picks, 10), "To win $30");
  });
});
