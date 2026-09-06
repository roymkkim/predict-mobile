import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { expandVol } from "@/lib/formatVol";
import { splitComboPreviewVols } from "./comboPreviewVol";

const MMA = {
  label: "MMA",
  vol: "$520K Vol.",
  rows: [
    "Bogdan · Bogdan vs Buzukja",
    "Vlasto Cepo · Vlasto Cepo vs Urbina",
    "Uros Medic · Uros Medic vs Rodriguez",
    "Hill · Hill vs Oliveira",
    "Adesanya · Adesanya vs Du Plessis",
  ],
};

function dollars(vol: string): number {
  return Number(expandVol(vol).replace(/[^\d]/g, ""));
}

describe("splitComboPreviewVols", () => {
  it("splits MMA $520K across five distinct legs that sum to the card total", () => {
    const vols = splitComboPreviewVols(MMA);
    assert.equal(vols.length, 5);
    assert.equal(new Set(vols).size, vols.length);
    assert.equal(
      vols.reduce((sum, v) => sum + dollars(v), 0),
      dollars(MMA.vol),
    );
    assert.deepEqual(splitComboPreviewVols(MMA), vols);
  });
});
