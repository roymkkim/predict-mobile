/**
 * Workflow entrypoint with two modes:
 *
 * - Demo (default): serves the static web export via server/serve.js.
 *   No Expo dev server, no HMR websocket — the preview never reloads on its
 *   own, so it stays up indefinitely through the Replit proxy.
 * - Dev (HMR): live Expo dev server with hot reload for active iteration.
 *   Enable by creating a `.dev-mode` file in this artifact directory, then
 *   restarting the workflow. Delete the file and restart to go back to demo.
 *
 * After making app changes in demo mode, rebuild the export with
 * `pnpm --filter @workspace/predict-mobile run export:web`.
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const root = path.resolve(__dirname, "..");
const devMode = fs.existsSync(path.join(root, ".dev-mode"));

if (!devMode) {
  const webIndex = path.join(root, "static-build", "web", "index.html");
  if (!fs.existsSync(webIndex)) {
    console.error(
      "No static web export found (static-build/web/index.html missing).\n" +
        "Run: pnpm --filter @workspace/predict-mobile run export:web\n" +
        "Or create a .dev-mode file to use the live Expo dev server instead.",
    );
    process.exit(1);
  }
  console.log("[start] Demo mode: serving static web export (no HMR).");
  console.log(
    "[start] To develop with hot reload: touch .dev-mode in artifacts/predict-mobile and restart the workflow.",
  );
} else {
  console.log("[start] Dev mode (.dev-mode present): live Expo dev server with HMR.");
  console.log("[start] Delete .dev-mode and restart the workflow for the stable demo.");
}

const script = devMode ? "dev" : "serve";
const child = spawn("pnpm", ["run", script], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(sig, () => {
    child.kill(sig);
  });
}

child.on("exit", (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});
