import assert from "node:assert/strict";

const TYPE_PREFIX = /^(Moneyline|Spread|Total)\s+·\s+/i;
const LINE_TAIL = /\s([+-]?\d+(?:\.\d+)?)$/;
const OU_HEAD = /^(?:O|U|Over|Under)\s+([+-]?\d+(?:\.\d+)?)$/i;

function comboTypeLabel(kind, pick = "", id = "") {
  if (kind === "spread") return "Spread";
  if (kind === "ou") return "Total";
  if (kind === "ml") return "Moneyline";
  if (id.includes(":spread:")) return "Spread";
  if (id.includes("total:") || id.includes(":ou:") || id.includes(":total:")) return "Total";
  if (/^(over|under)\b/i.test(pick) || /^[OU]\s/i.test(pick)) return "Total";
  if (LINE_TAIL.test(pick)) return "Spread";
  return "Moneyline";
}

function signedLine(raw) {
  const n = parseFloat(raw);
  if (Number.isFinite(n)) return `+${Math.abs(n)}`;
  if (raw.startsWith("+") || raw.startsWith("-")) return `+${raw.slice(1)}`;
  return `+${raw}`;
}

function sportKey(raw) {
  return (raw ?? "").toLowerCase().replace(/[^a-z]/g, "");
}

function totalUnit(opts = {}) {
  const sport = sportKey(opts.sport);
  if (sport === "soccer" || sport === "hockey") return "goals";
  if (sport === "basketball" || sport === "americanfootball") return "points";
  if (sport === "baseball") return "runs";

  const blob = [opts.sport, opts.category, opts.id].filter(Boolean).join(" ").toLowerCase();
  if (!blob.trim()) return undefined;
  if (
    /\b(soccer|epl|premier league|la liga|serie a|bundesliga|ligue 1|\bmls\b|uefa|world cup|champions league|hockey|\bnhl\b)\b/.test(
      blob,
    )
  ) {
    return "goals";
  }
  if (/\b(mlb|baseball)\b/.test(blob)) return "runs";
  if (/\b(nba|basketball|nfl|american\s*football|pro football)\b/.test(blob)) return "points";
  return undefined;
}

function parseOu(pick) {
  const m = pick.trim().match(OU_HEAD);
  if (!m) return null;
  const side = /^U/i.test(pick.trim()) ? "under" : "over";
  return { side, line: m[1] };
}

function totalPhrase(pick, opts) {
  const parsed = parseOu(pick);
  if (!parsed) {
    if (/^O\s/i.test(pick)) return pick.replace(/^O\s+/i, "Over ");
    if (/^U\s/i.test(pick)) return pick.replace(/^U\s+/i, "Under ");
    return pick;
  }
  const unit = totalUnit(opts);
  if (unit) return `Total ${unit} ${parsed.side} ${parsed.line}`;
  return `Total ${parsed.side} ${parsed.line}`;
}

function comboPeriodTag(period) {
  const t = (period ?? "").trim();
  if (!t) return undefined;
  if (/^regulation\s+time$/i.test(t)) return "Reg time";
  if (/^full\s+game$/i.test(t)) return "Reg game";
  if (/^first\s+5(\s+innings)?$/i.test(t) || /^f5$/i.test(t)) return "First 5";
  if (/^(1st|first)\s+half$/i.test(t) || /^1h$/i.test(t)) return "1H";
  if (/^(2nd|second)\s+half$/i.test(t) || /^2h$/i.test(t)) return "2H";
  if (/^q[1-4]$/i.test(t)) return t.toUpperCase();
  return undefined;
}

function comboLegCopy(label, opts = {}) {
  const sep = label.indexOf("·");
  let left = (sep < 0 ? label : label.slice(0, sep)).trim();
  left = left.replace(TYPE_PREFIX, "").trim();
  const matchup = sep < 0 ? "" : label.slice(sep + 1).trim();
  const type = comboTypeLabel(opts.kind, left, opts.id);
  const tag = comboPeriodTag(opts.period);
  const extra = tag ? { tag } : {};

  if (type === "Total") return { pick: totalPhrase(left, opts), sub: matchup, seed: left, ...extra };
  if (type === "Spread") {
    const m = left.match(/^(.*?)\s+([+-]?\d+(?:\.\d+)?)$/);
    if (m) return { pick: `${m[1]} to win by ${signedLine(m[2])}`, sub: matchup, seed: m[1], ...extra };
  }
  if (/^draw$/i.test(left)) return { pick: "Draw", sub: matchup, seed: left, ...extra };
  return { pick: `${left} to win`, sub: matchup, seed: left, ...extra };
}

assert.deepEqual(comboLegCopy("Bogdan · Bogdan vs Buzukja"), {
  pick: "Bogdan to win",
  sub: "Bogdan vs Buzukja",
  seed: "Bogdan",
});
assert.deepEqual(comboLegCopy("ARS · Arsenal vs Liverpool"), {
  pick: "ARS to win",
  sub: "Arsenal vs Liverpool",
  seed: "ARS",
});
assert.deepEqual(comboLegCopy("Draw · Brazil vs Argentina"), {
  pick: "Draw",
  sub: "Brazil vs Argentina",
  seed: "Draw",
});
assert.deepEqual(comboLegCopy("CAR -0.5 · Packers vs Steelers"), {
  pick: "CAR to win by +0.5",
  sub: "Packers vs Steelers",
  seed: "CAR",
});
assert.deepEqual(comboLegCopy("ARS -0.5 · Arsenal vs Liverpool", { kind: "spread" }), {
  pick: "ARS to win by +0.5",
  sub: "Arsenal vs Liverpool",
  seed: "ARS",
});
assert.deepEqual(comboLegCopy("LIV +0.5 · Arsenal vs Liverpool", { kind: "spread" }), {
  pick: "LIV to win by +0.5",
  sub: "Arsenal vs Liverpool",
  seed: "LIV",
});
assert.deepEqual(comboLegCopy("NYY -0.5 · Yankees vs Red Sox", { kind: "spread" }), {
  pick: "NYY to win by +0.5",
  sub: "Yankees vs Red Sox",
  seed: "NYY",
});
assert.deepEqual(comboLegCopy("Over 45.5 · Packers vs Steelers", { kind: "ou" }), {
  pick: "Total over 45.5",
  sub: "Packers vs Steelers",
  seed: "Over 45.5",
});
assert.deepEqual(comboLegCopy("Over 45.5 · Packers vs Steelers", { kind: "ou", sport: "americanFootball" }), {
  pick: "Total points over 45.5",
  sub: "Packers vs Steelers",
  seed: "Over 45.5",
});
assert.deepEqual(comboLegCopy("O 45.5 · Packers vs Steelers", { kind: "ou", category: "NFL" }), {
  pick: "Total points over 45.5",
  sub: "Packers vs Steelers",
  seed: "O 45.5",
});
assert.deepEqual(comboLegCopy("Under 220.5 · Lakers vs Warriors", { kind: "ou", sport: "basketball" }), {
  pick: "Total points under 220.5",
  sub: "Lakers vs Warriors",
  seed: "Under 220.5",
});
assert.deepEqual(comboLegCopy("Over 2.5 · Arsenal vs Liverpool", { kind: "ou", sport: "soccer" }), {
  pick: "Total goals over 2.5",
  sub: "Arsenal vs Liverpool",
  seed: "Over 2.5",
});
assert.deepEqual(comboLegCopy("Under 2.5 · Arsenal vs Liverpool", { kind: "ou", category: "Soccer" }), {
  pick: "Total goals under 2.5",
  sub: "Arsenal vs Liverpool",
  seed: "Under 2.5",
});
assert.deepEqual(comboLegCopy("Over 8.5 · Yankees vs Red Sox", { kind: "ou", sport: "baseball" }), {
  pick: "Total runs over 8.5",
  sub: "Yankees vs Red Sox",
  seed: "Over 8.5",
});
assert.deepEqual(comboLegCopy("Over 5.5 · Bruins vs Rangers", { kind: "ou", sport: "hockey" }), {
  pick: "Total goals over 5.5",
  sub: "Bruins vs Rangers",
  seed: "Over 5.5",
});
assert.deepEqual(comboLegCopy("ESP +0.5 · Spain vs France", { kind: "spread", period: "Regulation time" }), {
  pick: "ESP to win by +0.5",
  sub: "Spain vs France",
  seed: "ESP",
  tag: "Reg time",
});
assert.equal(comboLegCopy("ESP +0.5 · Spain vs France", { kind: "spread", period: "Full game" }).tag, "Reg game");
assert.equal(comboPeriodTag("Full game"), "Reg game");
assert.equal(comboPeriodTag("Full Game"), "Reg game");
assert.equal(comboPeriodTag("Regulation time"), "Reg time");
assert.equal(comboPeriodTag("First 5 Innings"), "First 5");
assert.equal(comboPeriodTag("First 5"), "First 5");
assert.equal(comboPeriodTag("1st half"), "1H");
assert.equal(comboPeriodTag("Q1"), "Q1");
assert.equal(comboPeriodTag(""), undefined);
assert.equal(comboLegCopy("NYM +0.5 · Mets vs Braves", { kind: "spread", period: "First 5 Innings" }).tag, "First 5");
assert.equal(comboLegCopy("Bogdan · Bogdan vs Buzukja").tag, undefined);
assert.equal(comboLegCopy("Bogdan · Bogdan vs Buzukja").sub.includes("("), false);
assert.equal(comboLegCopy("ARS · Arsenal vs Liverpool").sub.includes("Moneyline"), false);

console.log("comboLegCopy.assert ok");
