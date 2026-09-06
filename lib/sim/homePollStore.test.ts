import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { castHomePollVote, getHomePoll, homePollPercents, homePollTotal, type HomePollState } from "./homePollStore";

describe("home poll", () => {
  it("splits percents so they always sum to 100", () => {
    const state: HomePollState = { yes: 1284, no: 716, vote: null };
    const pct = homePollPercents(state);
    assert.equal(pct.yes + pct.no, 100);
    assert.equal(homePollTotal(state), 2000);
  });

  it("treats an empty book as a 50/50 split", () => {
    assert.deepEqual(homePollPercents({ yes: 0, no: 0, vote: null }), { yes: 50, no: 50 });
  });

  it("keeps votes on one poll from changing another", () => {
    const before = getHomePoll("gb-pit");
    castHomePollVote("car-ari", "yes");
    assert.equal(getHomePoll("car-ari").vote, "yes");
    assert.equal(getHomePoll("gb-pit").vote, before.vote);
    assert.equal(getHomePoll("gb-pit").yes, before.yes);
  });
});
