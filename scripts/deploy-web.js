#!/usr/bin/env node
/**
 * Export the Expo web app, wrap it in the 393×852 phone frame, and deploy
 * to the Consensys Vercel project (predict-h2).
 *
 * Expo export wipes static-build/web, so this re-links the Vercel project
 * after each build.
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const webRoot = path.join(root, "static-build", "web");
const npx = process.env.NPX || "npx";

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    ...opts,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const expo = path.join(root, "node_modules", ".bin", "expo");
run(expo, ["export", "--platform", "web", "--output-dir", "static-build/web"], {
  env: { ...process.env, CI: "1" },
});
run(process.execPath, [path.join(root, "scripts", "write-phone-frame.js")]);

fs.mkdirSync(path.join(webRoot, ".vercel"), { recursive: true });
fs.writeFileSync(
  path.join(webRoot, ".vercel", "project.json"),
  `${JSON.stringify({
    projectId: "prj_2qaYnHckvEKWXcvQZJZVpvGnEd4k",
    orgId: "team_aGhvskmUjqyGVLmymWc3jJk9",
    projectName: "predict-h2",
  })}\n`,
);

run(npx, [
  "--yes",
  "vercel",
  "deploy",
  "--yes",
  "--prod",
  "--scope",
  "consensys-ddffed67",
  "--name",
  "predict-h2",
  "--cwd",
  webRoot,
]);
