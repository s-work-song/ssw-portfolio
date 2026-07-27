import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.resolve(scriptDirectory, "../../sample-web/src/chat.html");
const html = await readFile(htmlPath);
const host = process.env.WEB_HOST || "127.0.0.1";
const parsedPort = Number.parseInt(process.env.WEB_PORT ?? "", 10);
const port =
  Number.isInteger(parsedPort) && parsedPort >= 1 && parsedPort <= 65_535 ? parsedPort : 8080;

const server = createServer((request, response) => {
  const url = new URL(request.url, "http://localhost");
  const allowedPath = url.pathname === "/" || url.pathname === "/chat.html";

  if (!["GET", "HEAD"].includes(request.method) || !allowedPath) {
    response.writeHead(404, {
      "content-type": "text/plain; charset=utf-8",
      "x-content-type-options": "nosniff",
    });
    response.end("Not Found");
    return;
  }

  response.writeHead(200, {
    "cache-control": "no-store",
    "content-type": "text/html; charset=utf-8",
    "x-content-type-options": "nosniff",
  });
  response.end(request.method === "HEAD" ? undefined : html);
});

server.listen(port, host, () => {
  console.log(`Sample web listening on http://${host}:${port}`);
});

function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5_000).unref();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
