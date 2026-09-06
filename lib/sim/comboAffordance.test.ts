import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  COMBO_AFFORDANCE_DEFAULT,
  COMBO_CART_BADGE_OVERLAP,
  COMBO_CART_BADGE_RADIUS,
  COMBO_CART_BADGE_SIZE,
  COMBO_CART_CLOSE_BUTTON_SIZE,
  COMBO_CART_CLOSE_GAP,
  COMBO_CART_FAB_INSET,
  COMBO_CART_FAB_SIZE,
  COMBO_CART_PILL_EXPAND_MS,
  COMBO_CART_PILL_MARK_GAP,
  COMBO_CART_PILL_MARK_SIZE,
  comboCartEmptyExitsFlow,
  comboEmptyCloseKeepsFlow,
  comboCartFabWidth,
  comboCartPayoutLabelWidth,
  comboPayoutMultipleLabel,
  COMBO_EMPTY_BODY_FROM_TITLE,
  COMBO_EMPTY_BODY_MARGIN_BOTTOM,
  COMBO_EMPTY_HEADER_PADDING_RIGHT,
  COMBO_FILLED_HEADER_PADDING_BOTTOM,
  COMBO_NEXT_FOOTER_PADDING_TOP,
  COMBO_SHEET_CLOSE_EDGE_INSET,
  comboCartCloseLeading,
  comboCartExitVisible,
  comboCartAnchorUsable,
  comboCartBadgeCenter,
  comboCartFabLayout,
  comboChatComposerInsets,
  COMBO_CHAT_COMPOSER_GAP,
  comboFlowReconcile,
  comboEmptySheetPassThrough,
  comboFilledSheetDismissesOnBackdrop,
  comboOutsideTapDismisses,
  comboCartFabVisible,
  comboCartListAlwaysExpanded,
  comboPageUnselectedChrome,
  comboCloseDropsOverlay,
  dockedComboSheetVisible,
  isComboCapablePath,
  isComboIndexPath,
  comboIndexOpensEmptySheet,
  isEventDetailPath,
  parseComboAffordance,
} from "./comboAffordance";

describe("combo affordance setting", () => {
  it("defaults to cart and keeps a persisted sheet choice", () => {
    assert.equal(COMBO_AFFORDANCE_DEFAULT, "cart");
    assert.equal(parseComboAffordance(null), "cart");
    assert.equal(parseComboAffordance("nope"), "cart");
    assert.equal(parseComboAffordance("cart"), "cart");
    assert.equal(parseComboAffordance("sheet"), "sheet");
  });
});

describe("cart vs sheet gating", () => {
  it("keeps the docked empty sheet in sheet mode", () => {
    assert.equal(
      dockedComboSheetVisible({ affordance: "sheet", docked: true, pickCount: 0, slipOpen: false }),
      true,
    );
  });

  it("hides the event-detail empty tray when X closes the slip, in sheet or cart", () => {
    assert.equal(
      dockedComboSheetVisible({
        affordance: "sheet",
        docked: true,
        pickCount: 0,
        slipOpen: false,
        pathname: "/match-detail",
      }),
      false,
    );
    assert.equal(
      dockedComboSheetVisible({
        affordance: "sheet",
        docked: true,
        pickCount: 0,
        slipOpen: true,
        pathname: "/match-detail",
      }),
      true,
    );
    assert.equal(
      dockedComboSheetVisible({
        affordance: "cart",
        docked: true,
        pickCount: 0,
        slipOpen: false,
        pathname: "/game-detail",
      }),
      false,
    );
  });

  it("hides the empty docked sheet in cart mode until the FAB is tapped", () => {
    assert.equal(
      dockedComboSheetVisible({ affordance: "cart", docked: true, pickCount: 0, slipOpen: false }),
      false,
    );
    assert.equal(
      dockedComboSheetVisible({ affordance: "cart", docked: true, pickCount: 0, slipOpen: true }),
      true,
    );
  });

  it("shows the filled slip in cart mode only when the cart is opened", () => {
    assert.equal(
      dockedComboSheetVisible({ affordance: "cart", docked: true, pickCount: 2, slipOpen: false }),
      false,
    );
    assert.equal(
      dockedComboSheetVisible({ affordance: "cart", docked: true, pickCount: 2, slipOpen: true }),
      true,
    );
  });

  it("keeps the cart list expanded with no collapse picker", () => {
    assert.equal(comboCartListAlwaysExpanded("cart"), true);
    assert.equal(comboCartListAlwaysExpanded("sheet"), false);
  });

  it("does not gate undocked buy slips", () => {
    assert.equal(
      dockedComboSheetVisible({ affordance: "cart", docked: false, pickCount: 0, slipOpen: false }),
      true,
    );
  });

  it("drops the overlay on undocked Buy more instead of morphing to the cart FAB", () => {
    assert.equal(comboCloseDropsOverlay(false), true);
    assert.equal(comboCloseDropsOverlay(true), false);
  });

  it("shows the cart FAB on combo surfaces and hides it on live / explore", () => {
    const base = {
      affordance: "cart" as const,
      combinationsOn: true,
      comboFlow: true,
      slipOpen: false,
      morphing: false,
    };
    assert.equal(comboCartFabVisible({ ...base, pathname: "/match-detail" }), true);
    assert.equal(comboCartFabVisible({ ...base, pathname: "/uxr-sport/soccer" }), true);
    assert.equal(comboCartFabVisible({ ...base, pathname: "/live" }), false);
    assert.equal(comboCartFabVisible({ ...base, pathname: "/uxr-categories" }), false);
    assert.equal(comboCartFabVisible({ ...base, pathname: "/uxr-categories", sports: "1" }), true);
    assert.equal(comboCartFabVisible({ ...base, pathname: "/uxr-categories?sports=1" }), true);
    assert.equal(comboCartFabVisible({ ...base, pathname: "/match-detail", slipOpen: true }), false);
    assert.equal(comboCartFabVisible({ ...base, affordance: "sheet", pathname: "/match-detail" }), false);
    assert.equal(isComboCapablePath("/live"), false);
    assert.equal(isComboCapablePath("/game-detail"), true);
    assert.equal(isComboCapablePath("/combination"), true);
    assert.equal(isComboCapablePath("/"), false);
    assert.equal(isComboCapablePath("/politics"), false);
    assert.equal(isComboCapablePath("/prediction-detail"), true);
    assert.equal(isComboCapablePath("/match-detail"), true);
    assert.equal(isEventDetailPath("/match-detail"), true);
    assert.equal(isEventDetailPath("/combination"), false);
    assert.equal(isComboCapablePath("/uxr-hub/politics"), false);
    assert.equal(isComboCapablePath("/uxr-categories"), false);
    assert.equal(isComboCapablePath("/uxr-categories", "1"), true);
    assert.equal(isComboCapablePath("/uxr-categories?sports=1"), true);
    assert.equal(isComboCapablePath("/uxr-league/mlb"), true);
    assert.equal(isComboCapablePath("/kalshi-league/NFL"), true);
    assert.equal(comboCartFabVisible({ ...base, pathname: "/" }), false);
    assert.equal(comboCartFabVisible({ ...base, pathname: "/politics" }), false);
    assert.equal(comboCartFabVisible({ ...base, pathname: "/combination" }), true);
  });

  it("clears leftover combo on Home/Live so carousel-opened details stay off", () => {
    assert.equal(comboFlowReconcile(false, false), "exit");
    assert.equal(comboFlowReconcile(false, true), "exit");
    assert.equal(comboFlowReconcile(true, false), "keep");
    assert.equal(comboFlowReconcile(true, true), "enter");
    assert.equal(isComboCapablePath("/"), false);
    assert.equal(isComboCapablePath("/live"), false);
    assert.equal(isComboCapablePath("/game-detail"), true);
  });

  it("sits the chat composer 12px left of the combo cart on the same row", () => {
    const empty = comboChatComposerInsets(34);
    assert.equal(empty.bottom, COMBO_CART_FAB_INSET + 34);
    assert.equal(empty.right, COMBO_CART_FAB_INSET + COMBO_CART_FAB_SIZE + COMBO_CHAT_COMPOSER_GAP);
    const filled = comboChatComposerInsets(34, { itemCount: 2, payoutLabel: "9.6X payout" });
    assert.equal(filled.bottom, empty.bottom);
    assert.equal(filled.right, COMBO_CART_FAB_INSET + comboCartFabWidth(2, "9.6X payout") + COMBO_CHAT_COMPOSER_GAP);
    assert.ok(filled.right > empty.right);
  });

  it("places the cart 24px from the bottom-right plus the home-indicator inset", () => {
    const layout = comboCartFabLayout(390, 844, 34);
    assert.equal(layout.width, COMBO_CART_FAB_SIZE);
    assert.equal(layout.x, 390 - COMBO_CART_FAB_INSET - COMBO_CART_FAB_SIZE);
    assert.equal(layout.y, 844 - (COMBO_CART_FAB_INSET + 34) - COMBO_CART_FAB_SIZE);
  });

  it("expands the filled cart into a payout pill pinned to the same trailing edge", () => {
    const empty = comboCartFabLayout(390, 844, 34, { itemCount: 0 });
    const filled = comboCartFabLayout(390, 844, 34, { itemCount: 5 });
    const pillW = comboCartFabWidth(5);
    assert.equal(comboCartFabWidth(0), COMBO_CART_FAB_SIZE);
    assert.equal(pillW, 14 + 20 + 8 + 36 + 4 + 16 + 8);
    assert.equal(filled.width, pillW);
    assert.equal(filled.height, COMBO_CART_FAB_SIZE);
    assert.equal(filled.radius, COMBO_CART_FAB_SIZE / 2);
    assert.equal(filled.x + filled.width, empty.x + empty.width);
    assert.equal(filled.x, 390 - COMBO_CART_FAB_INSET - pillW);
    const payout = comboPayoutMultipleLabel([{ cents: 26 }, { cents: 40 }]);
    assert.equal(payout, "9.6X payout");
    const payoutW = comboCartFabWidth(2, payout);
    assert.equal(payoutW, 14 + 20 + 8 + comboCartPayoutLabelWidth(payout) + 4 + 16 + 8);
    assert.ok(payoutW > pillW);
    assert.equal(
      comboCartFabLayout(390, 844, 34, { itemCount: 2, payoutLabel: payout }).width,
      payoutW,
    );
  });

  it("rests 24px from the screen right even when a Build a Combo footer frame exists", () => {
    const corner = comboCartFabLayout(390, 844, 34);
    assert.equal(comboCartAnchorUsable(390, 844, { x: 16, y: 708, width: 358, height: 48 }), true);
    assert.equal(corner.x, 390 - COMBO_CART_FAB_INSET - COMBO_CART_FAB_SIZE);
    assert.equal(comboCartFabLayout(390, 844, 34, { safeRight: 12 }).x, 390 - COMBO_CART_FAB_INSET - 12 - COMBO_CART_FAB_SIZE);
    assert.equal(comboCartAnchorUsable(390, 844, { x: 16, y: 708, width: 0, height: 0 }), false);
    assert.equal(comboCartAnchorUsable(390, 844, { x: 820, y: 708, width: 358, height: 48 }), false);
    assert.equal(comboCartAnchorUsable(390, 844, { x: 16, y: 900, width: 358, height: 48 }), false);
  });

  it("keeps the cart 24px from the right when the leading close is visible", () => {
    const layout = comboCartFabLayout(390, 844, 34, { exitVisible: true });
    assert.equal(layout.x, 390 - COMBO_CART_FAB_INSET - COMBO_CART_FAB_SIZE);
    assert.equal(layout.y, 844 - (COMBO_CART_FAB_INSET + 34) - COMBO_CART_FAB_SIZE);
    assert.equal(comboCartCloseLeading(true), COMBO_CART_CLOSE_BUTTON_SIZE + COMBO_CART_CLOSE_GAP);
    assert.equal(comboCartCloseLeading(false), 0);
  });

  it("keeps the count badge on the cart and a 12px gap before the 32px close circle", () => {
    assert.equal(COMBO_CART_BADGE_SIZE, 16);
    assert.equal(COMBO_CART_BADGE_RADIUS, 8);
    assert.equal(COMBO_CART_BADGE_OVERLAP, 4);
    assert.equal(COMBO_CART_CLOSE_GAP, 12);
    assert.equal(COMBO_CART_CLOSE_BUTTON_SIZE, 32);
    assert.equal(COMBO_CART_FAB_SIZE, 48);
    assert.equal(COMBO_CART_PILL_MARK_SIZE, 20);
    assert.equal(COMBO_CART_PILL_MARK_GAP, 8);
    assert.ok(COMBO_CART_PILL_EXPAND_MS >= 200 && COMBO_CART_PILL_EXPAND_MS <= 280);
    const filled = comboCartFabLayout(390, 844, 34, { itemCount: 2, payoutLabel: "9.6X payout" });
    const badge = comboCartBadgeCenter(filled);
    assert.equal(badge.x, filled.x + filled.width + COMBO_CART_BADGE_OVERLAP - COMBO_CART_BADGE_SIZE / 2);
    assert.equal(badge.y, filled.y - COMBO_CART_BADGE_OVERLAP + COMBO_CART_BADGE_SIZE / 2);
  });

  it("sits the empty tray copy flush under the header with 40px below and 16px close inset", () => {
    assert.equal(COMBO_EMPTY_BODY_FROM_TITLE, 0);
    assert.equal(COMBO_EMPTY_BODY_MARGIN_BOTTOM, 40);
    assert.equal(COMBO_SHEET_CLOSE_EDGE_INSET, 16);
    assert.equal(COMBO_EMPTY_HEADER_PADDING_RIGHT, 16);
    assert.equal(COMBO_FILLED_HEADER_PADDING_BOTTOM, 12);
    assert.equal(COMBO_NEXT_FOOTER_PADDING_TOP, 16);
  });

  it("never dismisses the slip on backdrop so feed taps can add legs", () => {
    assert.equal(comboEmptySheetPassThrough({ pickCount: 0, screen: 0 }), true);
    assert.equal(comboEmptySheetPassThrough({ pickCount: 1, screen: 0 }), false);
    assert.equal(comboFilledSheetDismissesOnBackdrop({ pickCount: 1, screen: 0 }), false);
    assert.equal(comboFilledSheetDismissesOnBackdrop({ pickCount: 0, screen: 0 }), false);
    assert.equal(
      comboOutsideTapDismisses({ pickCount: 2, screen: 0, listAlwaysExpanded: true, expanded: true }),
      false,
    );
    assert.equal(
      comboOutsideTapDismisses({ pickCount: 0, screen: 0, listAlwaysExpanded: true, expanded: true }),
      false,
    );
  });

  it("never shows the FAB close control; category empty-cart exits combo flow", () => {
    assert.equal(isComboIndexPath("/combination"), true);
    assert.equal(isComboIndexPath("/combination?tab=baseball"), true);
    assert.equal(comboIndexOpensEmptySheet({ pathname: "/combination", pickCount: 0 }), false);
    assert.equal(comboIndexOpensEmptySheet({ pathname: "/combination", pickCount: 0, hasTemplate: true }), false);
    assert.equal(comboIndexOpensEmptySheet({ pathname: "/combination", pickCount: 2 }), false);
    assert.equal(comboIndexOpensEmptySheet({ pathname: "/game-detail", pickCount: 0 }), false);
    assert.equal(comboCartExitVisible("/combination"), false);
    assert.equal(comboCartExitVisible("/"), false);
    assert.equal(comboCartExitVisible("/match-detail"), false);
    assert.equal(comboCartExitVisible("/uxr-sport/soccer"), false);
    assert.equal(comboCartEmptyExitsFlow("/uxr-sport/soccer"), true);
    assert.equal(comboCartEmptyExitsFlow("/uxr-categories", "1"), true);
    assert.equal(comboCartEmptyExitsFlow("/uxr-categories"), false);
    assert.equal(comboCartEmptyExitsFlow("/kalshi-sport/nba"), true);
    assert.equal(comboCartEmptyExitsFlow("/uxr-league/mlb"), true);
    assert.equal(comboCartEmptyExitsFlow("/combination"), false);
    assert.equal(comboCartEmptyExitsFlow("/"), false);
    assert.equal(comboCartEmptyExitsFlow("/match-detail"), false);
    assert.equal(comboEmptyCloseKeepsFlow("/match-detail"), true);
    assert.equal(comboEmptyCloseKeepsFlow("/game-detail"), true);
    assert.equal(comboEmptyCloseKeepsFlow("/combination"), true);
    assert.equal(comboEmptyCloseKeepsFlow("/uxr-sport/soccer"), false);
    // Combos index never auto-opens the empty sheet; Delete all keeps it.
    // Category: Delete all keeps the empty sheet; only that sheet's X exits.
    // Combos / event detail: empty-sheet X hides the tray and keeps combo.
    assert.equal(comboCartEmptyExitsFlow("/uxr-sport/soccer"), true);
    assert.equal(comboCartFabLayout(390, 844, 34, { itemCount: 0 }).width, COMBO_CART_FAB_SIZE);
  });

  it("uses outline unselected chrome on Combos, category, and market detail", () => {
    assert.equal(comboPageUnselectedChrome("/combination"), "outline");
    assert.equal(comboPageUnselectedChrome("/combination?tab=baseball"), "outline");
    assert.equal(comboPageUnselectedChrome("/uxr-sport/football"), "outline");
    assert.equal(comboPageUnselectedChrome("/uxr-categories", "1"), "outline");
    assert.equal(comboPageUnselectedChrome("/uxr-categories"), "muted");
    assert.equal(comboPageUnselectedChrome("/uxr-league/nfl"), "outline");
    assert.equal(comboPageUnselectedChrome("/kalshi-league/nfl"), "outline");
    assert.equal(comboPageUnselectedChrome("/kalshi-sport/nba"), "outline");
    assert.equal(comboPageUnselectedChrome("/game-detail"), "outline");
    assert.equal(comboPageUnselectedChrome("/match-detail"), "outline");
    assert.equal(comboPageUnselectedChrome("/tennis-detail"), "outline");
    assert.equal(comboPageUnselectedChrome("/"), "muted");
    assert.equal(comboPageUnselectedChrome("/prediction-detail"), "outline");
  });
});
