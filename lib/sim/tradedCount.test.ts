import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { compactTraders, tradedCopy, tradedCountFromVol } from "./tradedCount";

describe("tradedCount", () => {
  it("maps $82K volume to 2K traded", () => {
    assert.equal(tradedCountFromVol("$82K Vol."), 2000);
    assert.equal(tradedCopy("$82K Vol."), "2K traded");
  });

  it("compacts thousands and millions", () => {
    assert.equal(compactTraders(850), "850");
    assert.equal(compactTraders(1500), "1.5K");
    assert.equal(compactTraders(12683), "13K");
    assert.equal(compactTraders(1_400_000), "1.4M");
  });
});
