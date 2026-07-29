import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function parseEnv(text) {
  const values = {};
  for (const rawLine of text.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function integer(value, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

function ratio(value, fallback, { min = 0, max = 1 } = {}) {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

function boolean(value, fallback = false) {
  if (typeof value !== "string") return fallback;
  if (/^(true|1|yes|on)$/iu.test(value)) return true;
  if (/^(false|0|no|off)$/iu.test(value)) return false;
  return fallback;
}

function choice(value, fallback, allowed) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return allowed.includes(normalized) ? normalized : fallback;
}

export async function loadConfig({
  envPath = path.join(backendDir, ".env"),
  environment = process.env,
} = {}) {
  let fileValues = {};
  try {
    fileValues = parseEnv(await readFile(envPath, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  // 비밀 키는 실수로 셸/프로세스 환경에서 섞이지 않도록 backend/.env만 신뢰한다.
  const value = (key, fallback = "") => fileValues[key] ?? environment[key] ?? fallback;
  const allowProcessOpenAiConfig = boolean(
    environment.ALLOW_PROCESS_OPENAI_CONFIG,
    false,
  );
  const openAiValue = (key) => {
    if (fileValues[key]) return fileValues[key];
    if (allowProcessOpenAiConfig) return environment[key] ?? "";
    return fileValues[key] ?? environment[key] ?? "";
  };

  // knowledge 원문은 비공개 저장소에 두므로 경로를 갈아끼울 수 있어야 한다.
  // 상대 경로는 backend/ 기준으로 해석하고, 미설정이면 기존 위치(backend/../knowledge)를 쓴다.
  const knowledgeDir = path.resolve(
    backendDir,
    value("RAG_KNOWLEDGE_DIR").trim() || "../knowledge",
  );

  return {
    backendDir,
    knowledgeDir,
    host: value("HOST", "127.0.0.1"),
    port: integer(value("PORT"), 8787, { min: 1, max: 65535 }),
    corsOrigin: value("CORS_ORIGIN", "*"),
    trustProxy: boolean(value("TRUST_PROXY"), false),
    offlineFallbackEnabled: boolean(value("OFFLINE_FALLBACK_ENABLED"), true),
    retrieverMode: value("RAG_RETRIEVER_MODE", "lexical").toLowerCase(),
    vectorStoreKind: value("RAG_VECTOR_STORE", "memory").toLowerCase(),
    embeddingModel: value("RAG_EMBEDDING_MODEL", "intfloat/multilingual-e5-small"),
    embeddingModelRevision: value("RAG_EMBEDDING_MODEL_REVISION", "main"),
    embeddingCacheDir: value("RAG_EMBEDDING_CACHE_DIR", ""),
    embeddingLocalFilesOnly: boolean(value("RAG_EMBEDDING_LOCAL_FILES_ONLY"), false),
    embeddingMaxLength: integer(value("RAG_EMBEDDING_MAX_LENGTH"), 512, {
      min: 32,
      max: 512,
    }),
    apiKey:
      fileValues.OPENAI_API_KEY ||
      (allowProcessOpenAiConfig ? environment.OPENAI_API_KEY ?? "" : ""),
    baseUrl: openAiValue("OPENAI_BASE_URL"),
    model: openAiValue("OPENAI_MODEL"),
    topK: integer(value("TOP_K"), 5, { min: 1, max: 12 }),
    // top-K가 한 문서의 청크로 채워져 근거 다양성이 죽는 것을 막는다. 0이면 끈다.
    diversityMaxPerSource: integer(value("RAG_DIVERSITY_MAX_PER_SOURCE"), 2, { min: 0, max: 12 }),
    // 상한으로 생긴 빈자리를 1위 점수 대비 이 비율 미만인 청크로 채우지 않는다.
    diversityMinPromotionRatio: ratio(value("RAG_DIVERSITY_MIN_PROMOTION_RATIO"), 0.2),
    maxBodyBytes: integer(value("MAX_BODY_BYTES"), 32_768, { min: 1_024, max: 262_144 }),
    maxMessageChars: integer(value("MAX_MESSAGE_CHARS"), 2_000, { min: 100, max: 10_000 }),
    maxHistoryItems: integer(value("MAX_HISTORY_ITEMS"), 6, { min: 0, max: 20 }),
    maxHistoryChars: integer(value("MAX_HISTORY_CHARS"), 6_000, { min: 0, max: 30_000 }),
    maxEvidenceChars: integer(value("MAX_EVIDENCE_CHARS"), 12_000, {
      min: 1_000,
      max: 50_000,
    }),
    sourceExposure: choice(value("RAG_SOURCE_EXPOSURE"), "none", [
      "none",
      "metadata",
      "excerpt",
    ]),
    sourceExcerptChars: integer(value("SOURCE_EXCERPT_CHARS"), 280, {
      min: 80,
      max: 1_000,
    }),
    upstreamConcurrency: integer(value("UPSTREAM_CONCURRENCY"), 1, { min: 1, max: 3 }),
    maxUpstreamQueue: integer(value("MAX_UPSTREAM_QUEUE"), 4, { min: 0, max: 20 }),
    upstreamTimeoutMs: integer(value("UPSTREAM_TIMEOUT_MS"), 30_000, {
      min: 1_000,
      max: 120_000,
    }),
    upstreamStatusTimeoutMs: integer(value("UPSTREAM_STATUS_TIMEOUT_MS"), 3_000, {
      min: 500,
      max: 10_000,
    }),
    upstreamStatusCacheTtlMs: integer(value("UPSTREAM_STATUS_CACHE_TTL_MS"), 5_000, {
      min: 0,
      max: 60_000,
    }),
    rateWindowMs: integer(value("RATE_WINDOW_MS"), 60_000, { min: 1_000, max: 3_600_000 }),
    rateLimitPerIp: integer(value("RATE_LIMIT_PER_IP"), 10, { min: 1, max: 10_000 }),
    rateLimitGlobal: integer(value("RATE_LIMIT_GLOBAL"), 30, { min: 1, max: 100_000 }),
    cacheTtlMs: integer(value("CACHE_TTL_MS"), 15_000, { min: 0, max: 300_000 }),
    fallbackCacheTtlMs: integer(value("FALLBACK_CACHE_TTL_MS"), 5_000, {
      min: 0,
      max: 60_000,
    }),
  };
}
