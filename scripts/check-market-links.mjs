#!/usr/bin/env node
// Runs the broken-card-link check (scripts/check-market-links.entry.ts) in
// plain Node. The fixture data lives inside React Native component modules,
// so we bundle the entry with esbuild and stub every native/Expo package with
// a self-returning Proxy — the data and routing helpers are pure JS, the
// components are only defined (never rendered), so the stubs are never
// exercised beyond property access.
import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// Native / Expo / RN-ecosystem packages that can't load in Node.
const NATIVE = /^(react-native|react-native-.+|@react-native.*|expo|expo-.+|@expo\/.+|@expo-google-fonts\/.+|@react-navigation\/.+|@metamask\/.+|@stardazed\/.+|@ungap\/.+|@tanstack\/.+|@workspace\/api-client-react.*)$/;

const stubPlugin = {
  name: "native-stub",
  setup(b) {
    b.onResolve({ filter: /.*/ }, (args) => (NATIVE.test(args.path) ? { path: args.path, namespace: "native-stub" } : undefined));
    b.onLoad({ filter: /.*/, namespace: "native-stub" }, () => ({
      contents: `
        // Self-returning stub. esbuild's __toESM interop builds a fresh object
        // from Object.create(getPrototypeOf(mod)) and copies OWN keys only, so
        // dynamic props on the proxy itself would be lost — route unknown
        // lookups through a proxied prototype instead.
        const handler = {
          get: (t, p) => (p === "then" || typeof p === "symbol" ? undefined : stub),
          apply: () => stub,
          construct: () => stub,
        };
        const stub = new Proxy(function Stub() {}, handler);
        Object.setPrototypeOf(stub, new Proxy({}, { get: handler.get }));
        module.exports = stub;
      `,
      loader: "js",
    }));
  },
};

const outfile = path.join(os.tmpdir(), "predict-mobile-check-market-links.cjs");

await build({
  entryPoints: [path.join(root, "scripts/check-market-links.entry.ts")],
  bundle: true,
  platform: "node",
  format: "cjs",
  jsx: "automatic",
  tsconfig: path.join(root, "tsconfig.json"),
  outfile,
  logLevel: "warning",
  plugins: [stubPlugin],
  loader: {
    ".png": "empty", ".jpg": "empty", ".jpeg": "empty", ".webp": "empty", ".gif": "empty",
    ".ttf": "empty", ".otf": "empty", ".svg": "empty", ".mp4": "empty",
  },
});

const res = spawnSync(process.execPath, [outfile], { stdio: "inherit" });
process.exit(res.status ?? 1);
