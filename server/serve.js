/**
 * Standalone production server for Expo static builds.
 *
 * Serves the output of build.js (static-build/) with two special routes:
 * - GET / or /manifest with expo-platform header → platform manifest JSON
 * - GET / without expo-platform → landing page HTML
 * Everything else falls through to static file serving from ./static-build/.
 *
 * Zero external dependencies — uses only Node.js built-ins (http, fs, path).
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const STATIC_ROOT = path.resolve(__dirname, "..", "static-build");
const WEB_ROOT = path.join(STATIC_ROOT, "web");
const TEMPLATE_PATH = path.resolve(__dirname, "templates", "landing-page.html");
const basePath = (process.env.BASE_PATH || "/").replace(/\/+$/, "");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".map": "application/json",
};

function getAppName() {
  try {
    const appJsonPath = path.resolve(__dirname, "..", "app.json");
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf-8"));
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}

function serveManifest(platform, res) {
  const manifestPath = path.join(STATIC_ROOT, platform, "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(
      JSON.stringify({ error: `Manifest not found for platform: ${platform}` }),
    );
    return;
  }

  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.writeHead(200, {
    "content-type": "application/json",
    "expo-protocol-version": "1",
    "expo-sfv-version": "0",
  });
  res.end(manifest);
}

function serveLandingPage(req, res, landingPageTemplate, appName) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = forwardedProto || "https";
  const host = req.headers["x-forwarded-host"] || req.headers["host"];
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;

  const html = landingPageTemplate
    .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
    .replace(/EXPS_URL_PLACEHOLDER/g, expsUrl)
    .replace(/APP_NAME_PLACEHOLDER/g, appName);

  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(html);
}

function serveStaticFile(urlPath, res) {
  const safePath = path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.join(STATIC_ROOT, safePath);

  if (!filePath.startsWith(STATIC_ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const content = fs.readFileSync(filePath);
  res.writeHead(200, { "content-type": contentType });
  res.end(content);
}


// Desktop phone-frame shell: the prototype renders inside a mobile-sized
// iframe so RN Web's window dimensions match a real phone. On small screens
// the frame fills the viewport (real phones get a native-feeling full bleed).
function phoneShellHtml(appName) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${appName}</title>
<style>
  html, body { margin: 0; height: 100%; background: #0a0a0a; }
  body { display: flex; align-items: center; justify-content: center; }
  .frame {
    width: 402px;
    height: min(874px, calc(100vh - 48px));
    border-radius: 40px;
    border: 6px solid #1f1f1f;
    box-shadow: 0 24px 80px rgba(0,0,0,0.6);
    overflow: hidden;
    background: #000;
  }
  .frame iframe { width: 100%; height: 100%; border: 0; display: block; }
  @media (max-width: 500px), (max-height: 500px) {
    .frame { width: 100vw; height: 100vh; border: 0; border-radius: 0; box-shadow: none; }
  }
</style>
</head>
<body>
  <div class="frame"><iframe src="/app.html" title="${appName}" allow="clipboard-write"></iframe></div>
</body>
</html>`;
}

const landingPageTemplate = fs.readFileSync(TEMPLATE_PATH, "utf-8");
const appName = getAppName();

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  let pathname = url.pathname;

  if (basePath && pathname.startsWith(basePath)) {
    pathname = pathname.slice(basePath.length) || "/";
  }

  if (pathname === "/" || pathname === "/manifest") {
    const platform = req.headers["expo-platform"];
    if (platform === "ios" || platform === "android") {
      return serveManifest(platform, res);
    }
  }

  // Expo Go landing page (QR code) stays reachable for phone users.
  if (pathname === "/expo-go") {
    return serveLandingPage(req, res, landingPageTemplate, appName);
  }

  // Browsers get the exported web app when it exists; every extension-less
  // route falls back to the SPA's index.html (expo-router client routing).
  const hasWebBuild = fs.existsSync(path.join(WEB_ROOT, "index.html"));
  if (hasWebBuild) {
    // `/` is the phone-frame shell (index.html). The iframe loads /app.html.
    if (pathname === "/" && !url.searchParams.has("app")) {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      return res.end(fs.readFileSync(path.join(WEB_ROOT, "index.html")));
    }
    const webFile = path.join(WEB_ROOT, path.normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, ""));
    if (pathname !== "/" && webFile.startsWith(WEB_ROOT) && fs.existsSync(webFile) && !fs.statSync(webFile).isDirectory()) {
      const ext = path.extname(webFile).toLowerCase();
      res.writeHead(200, { "content-type": MIME_TYPES[ext] || "application/octet-stream" });
      return res.end(fs.readFileSync(webFile));
    }
    if (pathname === "/" || !path.extname(pathname)) {
      const appHtml = path.join(WEB_ROOT, "app.html");
      const spa = fs.existsSync(appHtml)
        ? appHtml
        : path.join(WEB_ROOT, "index.html");
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      return res.end(fs.readFileSync(spa));
    }
  } else if (pathname === "/") {
    return serveLandingPage(req, res, landingPageTemplate, appName);
  }

  serveStaticFile(pathname, res);
});

const port = parseInt(process.env.PORT || "3000", 10);
server.listen(port, "0.0.0.0", () => {
  console.log(`Serving static Expo build on port ${port}`);
});
