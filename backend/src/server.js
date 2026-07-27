import { createServer } from "node:http";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createOpenAIClient } from "./upstream.js";

const config = await loadConfig();
let server;

try {
  const upstreamClient = createOpenAIClient({
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    model: config.model,
    timeoutMs: config.upstreamTimeoutMs,
  });
  const handler = await createApp({ config, upstreamClient });
  server = createServer(handler);
  server.listen(config.port, config.host, () => {
    // 키, 모델 캐시 경로와 전체 업스트림 URL은 출력하지 않는다.
    console.log(`Portfolio RAG backend listening on http://${config.host}:${config.port}`);
  });
} catch (error) {
  console.error(`Portfolio RAG backend startup failed: ${error.code ?? "initialization_error"}`);
  process.exitCode = 1;
}

function shutdown() {
  if (!server) return;
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5_000).unref();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
