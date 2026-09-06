import assert from "node:assert/strict";

const LINE_TOKEN = /[+-]?\d+(?:\.\d+)?/;
const LINE_TAIL = new RegExp(`\\s+${LINE_TOKEN.source}$`);

function comboPickRowKey(id) {
  return id
    .replace(/@[\d.]+$/, "")
    .replace(/[+-]\d+(?:\.\d+)?$/, "")
    .replace(/(@[A-Za-z]+)\d+(?:\.\d+)?/g, "$1");
}

function comboPickFamilyKey(id) {
  return comboPickRowKey(id)
    .replace(/:[^:]+$/, "")
    .replace(/:flip$/, "");
}

function matchupOf(label) {
  const sep = label.indexOf("·");
  const market = sep < 0 ? "" : label.slice(sep + 1).trim();
  const vs = market.split(/\s+vs\.?\s+/i);
  if (vs.length !== 2) return null;
  return { market };
}

function exclusiveMatchup(p) {
  const parsed = matchupOf(p.label);
  if (parsed?.market) return parsed.market.toLowerCase().replace(/\s+/g, " ");
  return comboPickFamilyKey(p.id).toLowerCase();
}

function exclusiveKind(p) {
  if (p.kind === "spread" || p.id.includes(":spread:") || p.id.startsWith("spread:")) return "spread";
  if (p.kind === "ou" || p.id.includes("total:") || p.id.includes(":ou:") || p.id.includes(":total:")) return "ou";
  if (p.kind === "ml" || p.id.startsWith("ml:") || /(?:^|:)draw$/i.test(p.id)) return "ml";
  const sep = p.label.indexOf("·");
  const headline = (sep < 0 ? p.label : p.label.slice(0, sep)).trim();
  if (/^(over|under)\b/i.test(headline) || /^[OU]\s/i.test(headline)) return "ou";
  if (LINE_TAIL.test(headline)) return "spread";
  if (sep >= 0) return "ml";
  return "bin";
}

function comboExclusiveGroupKey(p) {
  const kind = exclusiveKind(p);
  const period = (p.period ?? "").trim().toLowerCase();
  if (kind === "bin") return `bin:${comboPickFamilyKey(p.id)}`;
  return `${kind}:${exclusiveMatchup(p)}:${period}`;
}

function upsertExclusiveComboPick(list, pick) {
  const group = comboExclusiveGroupKey(pick);
  const idx = list.findIndex((p) => comboExclusiveGroupKey(p) === group);
  if (idx < 0) return [...list, pick];
  return [...list.slice(0, idx), pick, ...list.slice(idx + 1).filter((p) => comboExclusiveGroupKey(p) !== group)];
}

function toggleExclusiveComboPick(list, pick) {
  const group = comboExclusiveGroupKey(pick);
  const existing = list.find((p) => comboExclusiveGroupKey(p) === group);
  if (existing && (existing.id === pick.id || comboPickRowKey(existing.id) === comboPickRowKey(pick.id))) {
    return list.filter((p) => comboExclusiveGroupKey(p) !== group);
  }
  return upsertExclusiveComboPick(list, pick);
}

const vs = "Arsenal vs Liverpool";
const ars = { id: "epl-ars-liv:ARS", label: `ARS · ${vs}`, kind: "ml", cents: 46 };
const draw = { id: "epl-ars-liv:draw", label: `Draw · ${vs}`, kind: "ml", cents: 27 };
const liv = { id: "epl-ars-liv:LIV", label: `LIV · ${vs}`, kind: "ml", cents: 27 };

assert.equal(comboExclusiveGroupKey(ars), comboExclusiveGroupKey(draw));
assert.equal(comboExclusiveGroupKey(ars), comboExclusiveGroupKey(liv));

let picks = [];
picks = toggleExclusiveComboPick(picks, ars);
picks = toggleExclusiveComboPick(picks, draw);
picks = toggleExclusiveComboPick(picks, liv);
assert.equal(picks.length, 1);
assert.equal(picks[0].id, liv.id);

picks = toggleExclusiveComboPick(picks, liv);
assert.equal(picks.length, 0);

picks = toggleExclusiveComboPick(picks, ars);
picks = toggleExclusiveComboPick(picks, draw);
assert.equal(picks[0].id, draw.id);

const other = { id: "epl-che-mci:CHE", label: "CHE · Chelsea vs Man City", kind: "ml", cents: 40 };
picks = toggleExclusiveComboPick(picks, other);
assert.equal(picks.length, 2);

const homeSpread = {
  id: "epl-ars-liv:spread:ARS@1.5",
  label: `ARS +1.5 · ${vs}`,
  kind: "spread",
  period: "Regulation time",
};
const awaySpread = {
  id: "epl-ars-liv:spread:LIV@1.5",
  label: `LIV +1.5 · ${vs}`,
  kind: "spread",
  period: "Regulation time",
};
picks = [homeSpread];
picks = toggleExclusiveComboPick(picks, awaySpread);
assert.equal(picks.length, 1);
assert.equal(picks[0].id, awaySpread.id);

const over = { id: "total:epl-ars-liv:over:3.5", label: `Over 3.5 · ${vs}`, kind: "ou", period: "Full game", line: 3.5 };
const under = { id: "total:epl-ars-liv:under:3.5", label: `Under 3.5 · ${vs}`, kind: "ou", period: "Full game", line: 3.5 };
picks = toggleExclusiveComboPick([over], under);
assert.equal(picks.length, 1);
assert.equal(picks[0].id, under.id);

const h1 = { ...ars, period: "1st half", id: "epl-ars-liv:h1:ARS" };
picks = toggleExclusiveComboPick([ars], h1);
assert.equal(picks.length, 2);

console.log("comboExclusive.assert ok");
