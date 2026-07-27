import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// next build(output: "export") 결과물 out/ 을 그대로 제공하는 데모용 정적 서버.
// trailingSlash: true 구성에 맞춰 디렉터리 요청은 index.html로 해석하고
// SPA fallback은 하지 않는다.
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(scriptDirectory, "../out");
const host = process.env.WEB_HOST || "0.0.0.0";
const parsedPort = Number.parseInt(process.env.WEB_PORT ?? "", 10);
const port =
  Number.isInteger(parsedPort) && parsedPort >= 1 && parsedPort <= 65_535 ? parsedPort : 3000;

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json; charset=utf-8",
};

async function statOrNull(filePath) {
  try {
    return await stat(filePath);
  } catch {
    return null;
  }
}

async function resolveFile(pathname) {
  const decoded = decodeURIComponent(pathname);
  const normalized = path.normalize(path.join(rootDirectory, decoded));
  // 루트 밖으로 나가는 경로(../ 등)는 차단한다.
  if (normalized !== rootDirectory && !normalized.startsWith(rootDirectory + path.sep)) {
    return { status: 404 };
  }

  const stats = await statOrNull(normalized);
  if (stats?.isDirectory()) {
    if (!decoded.endsWith("/")) {
      return { status: 308, location: `${pathname}/` };
    }
    const indexPath = path.join(normalized, "index.html");
    if (await statOrNull(indexPath)) {
      return { status: 200, filePath: indexPath };
    }
    return { status: 404 };
  }
  if (stats?.isFile()) {
    return { status: 200, filePath: normalized };
  }
  // /foo → out/foo.html 로 내보내진 라우트 지원
  if (!path.extname(normalized)) {
    const htmlPath = `${normalized}.html`;
    if (await statOrNull(htmlPath)) {
      return { status: 200, filePath: htmlPath };
    }
  }
  return { status: 404 };
}

async function sendFile(response, method, status, filePath) {
  const body = await readFile(filePath);
  const extension = path.extname(filePath).toLowerCase();
  response.writeHead(status, {
    "cache-control": "no-store",
    "content-type": contentTypes[extension] ?? "application/octet-stream",
    "x-content-type-options": "nosniff",
  });
  response.end(method === "HEAD" ? undefined : body);
}

const server = createServer(async (request, response) => {
  try {
    if (!["GET", "HEAD"].includes(request.method)) {
      response.writeHead(405, { "content-type": "text/plain; charset=utf-8" });
      response.end("Method Not Allowed");
      return;
    }

    const url = new URL(request.url, "http://localhost");
    const resolved = await resolveFile(url.pathname);

    if (resolved.status === 308) {
      response.writeHead(308, { location: resolved.location });
      response.end();
      return;
    }
    if (resolved.status === 200) {
      await sendFile(response, request.method, 200, resolved.filePath);
      return;
    }

    const notFoundPath = path.join(rootDirectory, "404.html");
    if (await statOrNull(notFoundPath)) {
      await sendFile(response, request.method, 404, notFoundPath);
      return;
    }
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not Found");
  } catch {
    response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    response.end("Internal Server Error");
  }
});

server.listen(port, host, () => {
  console.log(`Static site listening on http://${host}:${port} (root: ${rootDirectory})`);
});

function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5_000).unref();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
