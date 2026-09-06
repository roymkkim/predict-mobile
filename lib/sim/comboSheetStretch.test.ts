import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  COMBO_SHEET_HALF_RATIO,
  comboSheetCompactListMaxH,
  comboSheetExpandedListMaxH,
  comboSheetListMaxH,
  comboSheetListShownH,
  comboSheetMaxStretch,
  comboSheetPageHeaderBottom,
  sheetHeaderDismissAfterStretch,
  sheetHeaderStretchFromDy,
  sheetHeaderStretchSnap,
} from "./comboSheetStretch";

const layout = {
  winH: 852,
  topH: 72,
  footerH: 88,
  ceiling: 59 + 64,
  chrome: 0.5,
};

describe("combo sheet stretch height", () => {
  it("keeps the compact list cap at half the window", () => {
    assert.equal(COMBO_SHEET_HALF_RATIO, 0.5);
    assert.equal(comboSheetCompactListMaxH(layout), 852 * 0.5 - 72 - 88);
  });

  it("lets the expanded sheet meet the page header bottom", () => {
    const list = comboSheetExpandedListMaxH(layout);
    const sheet = list + layout.topH + layout.footerH + (layout.chrome ?? 0);
    assert.equal(sheet, layout.winH - layout.ceiling);
    assert.equal(comboSheetPageHeaderBottom(59, 64), 123);
  });

  it("grows from compact toward the header as stretch increases", () => {
    const compact = comboSheetCompactListMaxH(layout);
    const expanded = comboSheetExpandedListMaxH(layout);
    const maxStretch = comboSheetMaxStretch(layout);
    assert.ok(maxStretch > 0);
    assert.equal(comboSheetListMaxH({ ...layout, stretch: 0 }), compact);
    assert.equal(comboSheetListMaxH({ ...layout, stretch: 80 }), compact + 80);
    assert.equal(comboSheetListMaxH({ ...layout, stretch: maxStretch + 40 }), expanded);
  });

  it("grows the clip on stretch even when measured content is shorter", () => {
    const max = comboSheetListMaxH({ ...layout, stretch: 120 });
    assert.equal(
      comboSheetListShownH({ expanded: true, listNatural: 80, listMaxH: max, stretch: 120 }),
      max,
    );
    assert.equal(
      comboSheetListShownH({ expanded: true, listNatural: 80, listMaxH: max, stretch: 0 }),
      80,
    );
    assert.equal(
      comboSheetListShownH({ expanded: false, listNatural: 400, listMaxH: max, stretch: 120 }),
      0,
    );
  });
});

describe("combo sheet header stretch drag", () => {
  it("grows on upward drag and shrinks before dismiss drag", () => {
    assert.deepEqual(sheetHeaderStretchFromDy(40, -60, 200), { stretch: 100, dismissDy: 0 });
    assert.deepEqual(sheetHeaderStretchFromDy(40, 25, 200), { stretch: 15, dismissDy: 0 });
    assert.deepEqual(sheetHeaderStretchFromDy(40, 90, 200), { stretch: 0, dismissDy: 50 });
    assert.deepEqual(sheetHeaderStretchFromDy(0, -500, 120), { stretch: 120, dismissDy: 0 });
  });

  it("dismisses only from the compact rest height", () => {
    assert.equal(sheetHeaderDismissAfterStretch({ startStretch: 80, stretch: 0, dy: 90, vy: 0 }), false);
    assert.equal(sheetHeaderDismissAfterStretch({ startStretch: 0, stretch: 40, dy: -40, vy: 0 }), false);
    assert.equal(sheetHeaderDismissAfterStretch({ startStretch: 0, stretch: 0, dy: 80, vy: 0 }), true);
    assert.equal(sheetHeaderDismissAfterStretch({ startStretch: 0, stretch: 0, dy: 20, vy: 1.2 }), true);
    assert.equal(sheetHeaderDismissAfterStretch({ startStretch: 0, stretch: 0, dy: 20, vy: 0.2 }), false);
  });

  it("snaps stretch to compact or full on release", () => {
    assert.equal(sheetHeaderStretchSnap(10, 200, 0), 0);
    assert.equal(sheetHeaderStretchSnap(120, 200, 0), 200);
    assert.equal(sheetHeaderStretchSnap(10, 200, -0.8), 200);
    assert.equal(sheetHeaderStretchSnap(180, 200, 0.8), 0);
  });
});
