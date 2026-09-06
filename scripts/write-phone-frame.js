/**
 * Vercel serves index.html for `/` before rewrites, so the phone chrome
 * MUST be index.html. Expo's shell is moved to app.html and loaded in an
 * iframe sized to 393×852.
 */
const fs = require("fs");
const path = require("path");

const webRoot = path.resolve(__dirname, "..", "static-build", "web");
const appJsonPath = path.resolve(__dirname, "..", "app.json");

const PHONE_WIDTH = 393;
const PHONE_HEIGHT = 852;
const indexPath = path.join(webRoot, "index.html");
const appPath = path.join(webRoot, "app.html");

let appName = "Predict H2";
try {
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf-8"));
  appName = appJson.expo?.name || appName;
} catch {
  // keep default
}

if (!fs.existsSync(indexPath)) {
  throw new Error(`Expo web export missing at ${webRoot}`);
}

let expoHtml = fs.readFileSync(indexPath, "utf8");
if (expoHtml.includes('id="root"')) {
  if (!expoHtml.includes("history.replaceState")) {
    expoHtml = expoHtml.replace(
      '<div id="root"></div>',
      `<div id="root"></div>
  <script>
    if (location.pathname === "/app.html") {
      history.replaceState(null, "", "/" + location.search + location.hash);
    }
  </script>`,
    );
  }
  fs.writeFileSync(appPath, expoHtml);
} else if (!fs.existsSync(appPath)) {
  throw new Error("Expo app HTML missing (expected app.html after first wrap)");
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${appName}</title>
<link rel="stylesheet" href="/fonts/tap-cursor.css" />
<style>
  :root {
    --phone-w: ${PHONE_WIDTH}px;
    --phone-h: ${PHONE_HEIGHT}px;
    --bezel: 10px;
  }
  html, body { margin: 0; height: 100%; background: #0b0b0b; }
  body {
    display: grid;
    place-items: center;
    overflow: hidden;
  }
  .device {
    width: calc(var(--phone-w) + var(--bezel) * 2);
    height: calc(var(--phone-h) + var(--bezel) * 2);
    transform-origin: center center;
  }
  .bezel {
    position: relative;
    width: 100%;
    height: 100%;
    padding: var(--bezel);
    box-sizing: border-box;
    border-radius: 54px;
    background: #1a1a1a;
    box-shadow:
      0 0 0 1px #2a2a2a,
      0 24px 80px rgba(0,0,0,0.55);
  }
  .screen {
    position: relative;
    width: var(--phone-w);
    height: var(--phone-h);
    border-radius: 44px;
    overflow: hidden;
    background: #000;
  }
  .screen iframe {
    width: var(--phone-w);
    height: var(--phone-h);
    border: 0;
    display: block;
    background: #000;
  }
  .island { pointer-events: none; position: absolute; z-index: 2; }
  .island {
    top: 10px;
    left: 50%;
    width: 120px;
    height: 34px;
    margin-left: -60px;
    border-radius: 20px;
    background: #000;
  }
  @media (max-width: 480px) {
    body { display: block; }
    .device, .bezel, .screen {
      width: 100vw;
      height: 100vh;
      padding: 0;
      border-radius: 0;
      box-shadow: none;
      background: #000;
    }
    .screen iframe { width: 100vw; height: 100vh; }
    .island { display: none; }
  }
</style>
</head>
<body>
  <div class="device" id="device">
    <div class="bezel">
      <div class="screen">
        <div class="island" aria-hidden="true"></div>
        <iframe src="/app.html" title="${appName}" allow="clipboard-write"></iframe>
      </div>
    </div>
  </div>
  <script>
    (function () {
      var device = document.getElementById("device");
      var phoneW = ${PHONE_WIDTH} + 20;
      var phoneH = ${PHONE_HEIGHT} + 20;
      function fit() {
        if (window.innerWidth <= 480) {
          device.style.transform = "";
          return;
        }
        var scale = Math.min(
          1,
          (window.innerWidth - 40) / phoneW,
          (window.innerHeight - 40) / phoneH
        );
        device.style.transform = "scale(" + scale + ")";
      }
      window.addEventListener("resize", fit);
      fit();
      window.addEventListener("keydown", function (event) {
        if (event.isComposing) return;
        if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
        if (event.key !== "s" && event.key !== "S") return;
        event.preventDefault();
        var frame = document.querySelector(".screen iframe");
        if (frame && frame.contentWindow) {
          frame.contentWindow.postMessage({ type: "predict:toggle-settings-fab" }, "*");
        }
      });
    })();
  </script>
</body>
</html>
`;

fs.writeFileSync(indexPath, html);

const fontsSrc = path.resolve(__dirname, "..", "public", "fonts");
const fontsDest = path.join(webRoot, "fonts");
const requiredFonts = [
  "geist.css",
  "Geist-Regular.ttf",
  "Geist-Medium.ttf",
  "Geist-SemiBold.ttf",
  "Geist-Bold.ttf",
];
for (const file of requiredFonts) {
  if (!fs.existsSync(path.join(fontsSrc, file))) {
    throw new Error(`Missing web font ${file} in public/fonts`);
  }
}
fs.mkdirSync(fontsDest, { recursive: true });
for (const file of fs.readdirSync(fontsSrc)) {
  fs.copyFileSync(path.join(fontsSrc, file), path.join(fontsDest, file));
}

if (fs.existsSync(appPath)) {
  let appHtml = fs.readFileSync(appPath, "utf8");
  if (!appHtml.includes("/fonts/geist.css")) {
    appHtml = appHtml.replace(
      "</head>",
      `  <link rel="preload" href="/fonts/Geist-Regular.ttf" as="font" type="font/ttf" />
  <link rel="preload" href="/fonts/Geist-Medium.ttf" as="font" type="font/ttf" />
  <link rel="preload" href="/fonts/Geist-SemiBold.ttf" as="font" type="font/ttf" />
  <link rel="preload" href="/fonts/Geist-Bold.ttf" as="font" type="font/ttf" />
  <link rel="stylesheet" href="/fonts/geist.css" />
</head>`,
    );
  }
  if (!appHtml.includes("/fonts/tap-cursor.css")) {
    appHtml = appHtml.replace(
      "</head>",
      `  <link rel="stylesheet" href="/fonts/tap-cursor.css" />
</head>`,
    );
  }
  fs.writeFileSync(appPath, appHtml);
}

const vercelJson = {
  buildCommand: "",
  outputDirectory: ".",
  headers: [
    {
      source: "/fonts/(.*)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        { key: "Access-Control-Allow-Origin", value: "*" },
      ],
    },
  ],
  rewrites: [
    {
      source: "/((?!_expo/|assets/|fonts/|app\\.html).+)",
      destination: "/app.html",
    },
  ],
};
fs.writeFileSync(
  path.join(webRoot, "vercel.json"),
  `${JSON.stringify(vercelJson, null, 2)}\n`,
);

console.log(
  `Wrote ${PHONE_WIDTH}x${PHONE_HEIGHT} phone frame to index.html; app is at app.html`,
);
