import assert from "node:assert/strict";

/** Mirrors lib/sim/comboPickEdit.ts — keep in sync (node cannot import RN). */
const LINE_TOKEN = /[+-]?\d+(?:\.\d+)?/;
const LINE_TAIL = new RegExp(`\\s+${LINE_TOKEN.source}$`);

function lineMagnitude(n) {
  return Math.abs(n);
}

function lineFromHeadline(headline) {
  const m = headline.match(new RegExp(`(${LINE_TOKEN.source})\\s*$`));
  if (!m) return undefined;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) ? lineMagnitude(n) : undefined;
}

function headlineTeamName(headline) {
  return headline.replace(LINE_TAIL, "").trim();
}

function lineIndexOf(lines, line) {
  const mag = lineMagnitude(line);
  return lines.findIndex((x) => x === mag || Math.abs(x - mag) < 1e-9);
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function rewriteLine(s, prev, next) {
  const a = String(lineMagnitude(prev));
  const b = String(lineMagnitude(next));
  if (a === b) return s;
  const signed = new RegExp(`[+-]${escapeRegExp(a)}(?!\\d)`, "g");
  if (signed.test(s)) return s.replace(new RegExp(`[+-]${escapeRegExp(a)}(?!\\d)`, "g"), `+${b}`);
  if (s.includes(`@${a}`)) return s.split(`@${a}`).join(`@${b}`);
  if (s.includes(`+${a}`)) return s.split(`+${a}`).join(`+${b}`);
  if (s.includes(` ${a}`)) return s.split(` ${a}`).join(` ${b}`);
  if (s.includes(`:${a}`)) return s.split(`:${a}`).join(`:${b}`);
  const glued = new RegExp(`([A-Za-z])${escapeRegExp(a)}(?!\\d)`, "g");
  if (glued.test(s)) return s.replace(new RegExp(`([A-Za-z])${escapeRegExp(a)}(?!\\d)`, "g"), `$1${b}`);
  return s;
}

function comboMirroredIndex(index, dividerAt, labels) {
  if (dividerAt <= 0 || dividerAt >= labels.length) return index;
  const line = labels[index];
  if (line == null) return index;
  if (index < dividerAt) {
    const j = labels.slice(dividerAt).indexOf(line);
    return j >= 0 ? dividerAt + j : dividerAt;
  }
  const j = labels.slice(0, dividerAt).lastIndexOf(line);
  return j >= 0 ? j : Math.max(0, dividerAt - 1);
}

function namesMatch(a, b) {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  if (x === y) return true;
  if (x.length <= 4 && y.startsWith(x)) return true;
  if (y.length <= 4 && x.startsWith(y)) return true;
  if (x.length <= 4 && y.slice(0, 3) === x.slice(0, 3)) return true;
  return false;
}

function isHomeSide(headlineName, home, away) {
  if (namesMatch(headlineName, away) && !namesMatch(headlineName, home)) return false;
  if (namesMatch(headlineName, home)) return true;
  return true;
}

function pickerIndex(label, line, lines) {
  const sep = label.indexOf("·");
  const headline = (sep < 0 ? label : label.slice(0, sep)).trim();
  const market = sep < 0 ? "" : label.slice(sep + 1).trim();
  const vs = market.split(/\s+vs\.?\s+/i);
  const homeLines = [...lines].reverse();
  const dividerAt = lines.length;
  const name = headlineTeamName(headline);
  const home = vs.length === 2 ? isHomeSide(name, vs[0].trim(), vs[1].trim()) : true;
  const idxIn = home ? lineIndexOf(homeLines, line) : lineIndexOf(lines, line);
  return home ? idxIn : dividerAt + idxIn;
}

const lines = [0.5, 1.5, 2.5, 3.5];
const labels = [...[...lines].reverse(), ...lines].map(String);
const dividerAt = lines.length;

assert.equal(lineFromHeadline("CAR -0.5"), 0.5);
assert.equal(headlineTeamName("CAR -0.5"), "CAR");
assert.equal(rewriteLine("CAR -0.5 · Carolina vs Arizona", 0.5, 1.5), "CAR +1.5 · Carolina vs Arizona");
assert.equal(rewriteLine("spread:car:CAR:-0.5", 0.5, 1.5), "spread:car:CAR:+1.5");
assert.equal(rewriteLine("spread:yes@ARI0.5:CAR", 0.5, 1.5), "spread:yes@ARI1.5:CAR");

const homeHalf = pickerIndex("CAR -0.5 · Carolina Panthers vs Arizona Cardinals", 0.5, lines);
assert.equal(labels[homeHalf], "0.5");
assert.ok(homeHalf < dividerAt);

const home15 = pickerIndex("CAR -1.5 · Carolina Panthers vs Arizona Cardinals", 1.5, lines);
assert.equal(labels[home15], "1.5");
assert.ok(home15 < dividerAt);
assert.notEqual(home15, dividerAt);

const awayHalf = pickerIndex("ARI +0.5 · Carolina Panthers vs Arizona Cardinals", 0.5, lines);
assert.equal(awayHalf, dividerAt);

const mirrored = comboMirroredIndex(homeHalf, dividerAt, labels);
assert.equal(mirrored, dividerAt);
assert.equal(labels[mirrored], "0.5");

console.log("comboPickEdit.assert ok");

function isDrawName(name) {
  return /^draw$/i.test(name.trim());
}

function replaceMlSideToken(id, token) {
  if (!id.includes(":")) return `${id}:${token}`;
  return id.replace(/:[^:]+$/, `:${token}`);
}

function currentMlSlot(headline, home, away) {
  if (isDrawName(headline)) return "draw";
  return isHomeSide(headline, home, away) ? "home" : "away";
}

function cycleOnce(label, id) {
  const sep = label.indexOf("·");
  const head = (sep < 0 ? label : label.slice(0, sep)).trim();
  const market = sep < 0 ? "" : label.slice(sep + 1).trim();
  const vs = market.split(/\s+vs\.?\s+/i);
  const home = vs[0].trim();
  const away = vs[1].trim();
  const order = ["home", "draw", "away"];
  const slot = currentMlSlot(head, home, away);
  const next = order[(order.indexOf(slot) + 1) % 3];
  const headline = next === "draw" ? "Draw" : next === "home" ? home : away;
  const segs = id.split(":");
  const pair = segs[segs.length - 2].match(/^([a-z0-9]+)-([a-z0-9]+)$/i);
  const last = segs[segs.length - 1];
  const homeTok = isDrawName(last) ? pair[1].toUpperCase() : namesMatch(head, home) ? last : pair[1].toUpperCase();
  const awayTok = isDrawName(last) ? pair[2].toUpperCase() : namesMatch(head, away) ? last : pair[2].toUpperCase();
  const tok = next === "draw" ? "draw" : next === "home" ? homeTok : awayTok;
  return { label: `${headline} · ${market}`, id: replaceMlSideToken(id, tok) };
}

const vsCup = "India vs. Australia";
let cycled = { label: `Draw · ${vsCup}`, id: "ml:ind-aus:draw" };
cycled = cycleOnce(cycled.label, cycled.id);
assert.equal(cycled.label, `Australia · ${vsCup}`);
assert.equal(cycled.id, "ml:ind-aus:AUS");
cycled = cycleOnce(cycled.label, cycled.id);
assert.equal(cycled.label, `India · ${vsCup}`);
assert.equal(cycled.id, "ml:ind-aus:IND");
cycled = cycleOnce(cycled.label, cycled.id);
assert.equal(cycled.label, `Draw · ${vsCup}`);
assert.equal(cycled.id, "ml:ind-aus:draw");

console.log("comboPickEdit.mlCycle.assert ok");

const totalLines = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5];
assert.equal(lineFromHeadline("Under 2.5"), 2.5);
assert.equal(rewriteLine("Under 2.5 · Man City vs Chelsea", 2.5, 3.5), "Under 3.5 · Man City vs Chelsea");
assert.equal(rewriteLine("total:mci-che:reg:under:2.5", 2.5, 3.5), "total:mci-che:reg:under:3.5");
assert.ok(rewriteLine("Under 2.5 · Man City vs Chelsea", 2.5, 1.5).startsWith("Under "));
assert.equal(lineIndexOf(totalLines, 2.5), 2);
console.log("comboPickEdit.totals.assert ok");

