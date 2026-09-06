import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  clearComboTemplateAdd,
  consumeComboTemplateAdd,
  hasPendingComboTemplateAdd,
  pendingComboTemplateAddIs,
  queueComboTemplateAdd,
} from "./comboTemplateLaunch";

describe("combo template carousel launch", () => {
  it("queues one template add and consumes it once", () => {
    clearComboTemplateAdd();
    queueComboTemplateAdd("MMA");
    assert.equal(hasPendingComboTemplateAdd(), true);
    assert.equal(pendingComboTemplateAddIs("MMA"), true);
    assert.equal(pendingComboTemplateAddIs("Pro Football"), false);
    assert.equal(consumeComboTemplateAdd("Pro Football"), false);
    assert.equal(consumeComboTemplateAdd("MMA"), true);
    assert.equal(hasPendingComboTemplateAdd(), false);
    assert.equal(pendingComboTemplateAddIs("MMA"), false);
    assert.equal(consumeComboTemplateAdd("MMA"), false);
  });
});
