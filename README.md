# Predict Mobile

Expo app for the Predict prediction-market prototype.

## Demo vs. dev mode

The managed workflow (`artifacts/predict-mobile: expo`) runs `pnpm run start`
(`scripts/start.js`), which picks one of two modes:

### Demo mode (default) — stable, no self-reloads

Serves the pre-built static web export (`static-build/web/`) through
`server/serve.js`. There is no Expo dev server and no HMR websocket, so the
preview stays up indefinitely (the dev-server websocket used to drop through
the Replit proxy and force full page reloads).

- `/` — phone-frame shell wrapping the web app (`/?app=1`)
- `/expo-go` — QR / deep-link landing page for phones
- After changing app code, rebuild the export and restart the workflow:

```sh
pnpm --filter @workspace/predict-mobile run export:web
```

Note: `static-build/` is committed on purpose — the demo serves it directly.

### Dev mode — live Expo dev server with HMR

For active iteration, switch the same workflow to the Expo dev server:

```sh
touch artifacts/predict-mobile/.dev-mode   # enable dev mode
# then restart the "artifacts/predict-mobile: expo" workflow
```

Delete `.dev-mode` and restart to return to the stable demo (rebuild the
export first if you changed app code). `.dev-mode` is gitignored.

## Scripts

- `start` — mode dispatcher used by the workflow (demo unless `.dev-mode` exists)
- `dev` — Expo dev server with HMR (what dev mode runs)
- `export:web` — rebuild the static web export into `static-build/web/`
- `serve` — serve `static-build/` (what demo mode runs)
- `build` — full production build (native Expo Go bundles + web export)
- `typecheck` — TypeScript check
