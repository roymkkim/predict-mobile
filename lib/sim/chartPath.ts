// TradingView-style line rendering for the probability charts.
//
// The old renderer drew quantized "staircase" steps with rounded corners,
// which read as wobbly noodles. This one draws a smooth monotone curve
// (Catmull-Rom → cubic bezier) through lightly resampled points — the look of
// TradingView / Robinhood line charts — plus a matching area path for a
// gradient fill under the line.

// Resample the sparse control points with mild deterministic texture so the
// line has life without the old stair jitter.
function resample(points: number[], seed = 1): number[] {
  if (points.length <= 4) return points.slice();
  const fine: number[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    for (let k = 0; k < 2; k++) {
      const t = k / 2;
      const texture = Math.sin((i * 2 + k) * 3.7 + seed) * 0.006;
      fine.push(a + (b - a) * t + texture);
    }
  }
  fine.push(points[points.length - 1]);
  return fine;
}

function xy(points: number[], w: number, h: number): [number[], number[]] {
  const n = points.length;
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < n; i++) {
    xs.push((i / (n - 1)) * w);
    ys.push((1 - Math.max(0.02, Math.min(0.98, points[i]))) * h);
  }
  return [xs, ys];
}

// Smooth open path through the points (monotone-ish Catmull-Rom → bezier).
export function smoothPath(points: number[], w: number, h: number): string {
  if (points.length === 0 || w <= 0) return "";
  const fine = resample(points);
  const [xs, ys] = xy(fine, w, h);
  const n = xs.length;
  if (n === 1) return `M 0 ${ys[0].toFixed(2)} L ${w} ${ys[0].toFixed(2)}`;
  let d = `M ${xs[0].toFixed(2)} ${ys[0].toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const x0 = xs[Math.max(0, i - 1)], y0 = ys[Math.max(0, i - 1)];
    const x1 = xs[i], y1 = ys[i];
    const x2 = xs[i + 1], y2 = ys[i + 1];
    const x3 = xs[Math.min(n - 1, i + 2)], y3 = ys[Math.min(n - 1, i + 2)];
    const c1x = x1 + (x2 - x0) / 6;
    const c1y = y1 + (y2 - y0) / 6;
    const c2x = x2 - (x3 - x1) / 6;
    const c2y = y2 - (y3 - y1) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  }
  return d;
}

// Same curve closed down to the bottom edge, for the gradient area fill.
export function smoothAreaPath(points: number[], w: number, h: number): string {
  const line = smoothPath(points, w, h);
  if (!line) return "";
  return `${line} L ${w.toFixed(2)} ${h.toFixed(2)} L 0 ${h.toFixed(2)} Z`;
}
