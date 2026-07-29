import { createHmac, randomBytes } from "node:crypto";
import { isIP } from "node:net";
import { loadKnowledge } from "./knowledge.js";
import { FixedWindowRateLimiter, LimitError, Semaphore, TtlCache } from "./limits.js";
import { buildChatMessages } from "./prompt.js";
import { createRetriever } from "./rag/factory.js";
import { UpstreamError } from "./upstream.js";

export const OFFLINE_FALLBACK_ANSWER =
  "현재 데모용 챗봇 추론 서버는 오프라인이에요. 시연이 필요하면 포트폴리오에 공개된 연락처로 문의해 주세요.";

const ACTION_LABELS = Object.freeze({
  overview: "포트폴리오 개요 보기",
  resume: "경력·기술 보기",
  cover_letter: "자기소개서 보기",
  research: "연구·기술 탐구 보기",
  log: "작업 기록 보기",
});

class HttpError extends Error {
  constructor(status, code, message, headers = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.headers = headers;
  }
}

function json(response, status, payload, headers = {}) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    ...headers,
  });
  response.end(body);
}

async function readJson(request, maxBytes) {
  const declaredLength = Number.parseInt(request.headers["content-length"] ?? "0", 10);
  if (declaredLength > maxBytes) throw new HttpError(413, "payload_too_large", "요청이 너무 큽니다.");
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) {
      request.destroy();
      throw new HttpError(413, "payload_too_large", "요청이 너무 큽니다.");
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch {
    throw new HttpError(400, "invalid_json", "JSON 요청 형식이 올바르지 않습니다.");
  }
}

function validateQuery(value, maxChars) {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError(400, "invalid_query", "query 또는 message가 필요합니다.");
  }
  const trimmed = value.trim();
  if (trimmed.length > maxChars) {
    throw new HttpError(400, "message_too_long", `질문은 ${maxChars}자 이하여야 합니다.`);
  }
  return trimmed;
}

function validateHistory(value, config) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > config.maxHistoryItems) {
    throw new HttpError(
      400,
      "invalid_history",
      `history는 최대 ${config.maxHistoryItems}개까지 허용됩니다.`,
    );
  }
  let characterCount = 0;
  return value.map((item) => {
    if (
      !item ||
      !["user", "assistant"].includes(item.role) ||
      typeof item.content !== "string" ||
      !item.content.trim()
    ) {
      throw new HttpError(400, "invalid_history", "history 항목 형식이 올바르지 않습니다.");
    }
    characterCount += item.content.length;
    if (characterCount > config.maxHistoryChars) {
      throw new HttpError(400, "history_too_long", "history 전체 길이가 너무 깁니다.");
    }
    return { role: item.role, content: item.content.trim() };
  });
}

const SUPPORTED_AUDIENCES = new Set([
  "default",
  "hiring",
  "developer",
  "collaboration",
  "casual",
]);

export function validateAudience(value) {
  if (value === undefined || value === null || value === "") return "default";
  if (typeof value !== "string" || !SUPPORTED_AUDIENCES.has(value)) {
    throw new HttpError(
      400,
      "invalid_audience",
      "audience는 default, hiring, developer, collaboration, casual 중 하나여야 합니다.",
    );
  }
  return value;
}

const SUPPORTED_TONES = new Set(["official", "manager", "mascot"]);

export function validateTone(value) {
  if (value === undefined || value === null || value === "") return "official";
  if (typeof value !== "string" || !SUPPORTED_TONES.has(value)) {
    throw new HttpError(
      400,
      "invalid_tone",
      "tone은 official, manager, mascot 중 하나여야 합니다.",
    );
  }
  return value;
}

const SUPPORTED_PAGE_CONTEXTS = new Set([
  "default",
  "overview",
  "resume",
  "cover_letter",
  "research",
  "log",
]);

export function validatePageContext(value) {
  if (value === undefined || value === null || value === "") return "default";
  if (typeof value !== "string" || !SUPPORTED_PAGE_CONTEXTS.has(value)) {
    throw new HttpError(
      400,
      "invalid_page_context",
      "pageContext는 default, overview, resume, cover_letter, research, log 중 하나여야 합니다.",
    );
  }
  return value;
}

function privateMemoryKey(value, salt, namespace) {
  return createHmac("sha256", salt)
    .update(namespace)
    .update("\0")
    .update(typeof value === "string" ? value : JSON.stringify(value))
    .digest("base64url");
}

export function getClientIp(request, trustProxy = false) {
  if (trustProxy) {
    const forwarded = request.headers["x-forwarded-for"];
    const candidates = (Array.isArray(forwarded) ? forwarded.join(",") : forwarded ?? "")
      .split(",")
      .map((candidate) => candidate.trim());
    const firstValid = candidates.find((candidate) => isIP(candidate) !== 0);
    if (firstValid) return firstValid;
  }
  return request.socket.remoteAddress || "unknown";
}

function validateTopK(value, maximum) {
  if (value === undefined) return maximum;
  if (!Number.isInteger(value) || value < 1 || value > maximum) {
    throw new HttpError(400, "invalid_top_k", `topK는 1부터 ${maximum} 사이의 정수여야 합니다.`);
  }
  return value;
}

function excerpt(content, maxChars) {
  const compact = content.replace(/\s+/gu, " ").trim();
  return compact.length > maxChars ? `${compact.slice(0, maxChars - 1)}…` : compact;
}

function publicSource(source, mode, excerptChars) {
  const metadata = {
    title: source.title,
    section: source.section,
    score: source.score,
    url: source.url ?? null,
  };
  return mode === "excerpt"
    ? { ...metadata, excerpt: excerpt(source.content, excerptChars) }
    : metadata;
}

function exposeSources(sources, config) {
  const mode = config.sourceExposure ?? "none";
  if (mode === "none") return [];
  return sources.map((source) => publicSource(source, mode, config.sourceExcerptChars));
}

function actionIdForSource(source) {
  const pathValue = String(source.source ?? "").toLowerCase();
  const documentId = String(source.docId ?? "").toLowerCase();
  const section = String(source.section ?? "").toLowerCase();
  if (/cover[-_ ]letter|자기소개서/u.test(`${pathValue} ${documentId} ${section}`)) {
    return "cover_letter";
  }
  if (/portfolio-rag-chatbot/u.test(`${pathValue} ${documentId}`)) return "log";
  if (/ai-agent-orchestration|research|연구/u.test(`${pathValue} ${documentId} ${section}`)) {
    return "research";
  }
  if (source.type === "profile" || /profile|resume|경력/u.test(`${pathValue} ${documentId}`)) {
    return "resume";
  }
  if (source.type === "faq") return "overview";
  if (source.type === "project") return "research";
  return undefined;
}

export function buildNavigationActions(sources, { currentPage = "default", maximum = 2 } = {}) {
  const actions = [];
  const seen = new Set();
  for (const source of sources) {
    const id = actionIdForSource(source);
    if (!id || id === currentPage || seen.has(id) || !ACTION_LABELS[id]) continue;
    seen.add(id);
    actions.push({ id, label: ACTION_LABELS[id] });
    if (actions.length >= Math.min(2, maximum)) break;
  }
  return actions;
}

const PUBLIC_CONTACT_EMAILS = new Set(["sworksong@gmail.com"]);

function sanitizePublicText(answer, { allowedActionIds, final = false } = {}) {
  const sanitized = answer
    .replace(/\[\s*\[[^\r\n]*?(?:\]\s*\]|(?=\r?\n|$))/giu, (marker) => {
      const canonical = marker.match(/^\[\[action:([a-z_]+)\]\]$/u);
      const id = canonical?.[1].toLowerCase();
      return id && allowedActionIds?.has(id) ? `[[action:${id}]]` : "";
    })
    .replace(/[ \t]*\[(?:출처|source)\s*:[^\]\r\n]*(?:\]|(?=\r?\n|$))[ \t]*/giu, "")
    .replace(/\b(?:source|chunk_?id)\s*:\s*[^\s,;]+/giu, "[내부 자료]")
    .replace(
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu,
      (email) =>
        PUBLIC_CONTACT_EMAILS.has(email.toLowerCase()) ? email : "[내부 자료]",
    )
    .replace(
      /(?:[\p{L}\p{N}_.-]+[\\/])*[\p{L}\p{N}_.-]+\.(?:md|txt|json|ya?ml|toml|ini|env|log|csv|xml|js|jsx|ts|tsx|py|java|kt|cs|c|h|cpp|sh|ps1|bat|exe|dll|so|pdf|docx?|png|jpe?g|webp)(?![.A-Z0-9_-])(?:#[^\s)\]}]+)?/giu,
      "[내부 자료]",
    )
    .replace(
      /(^|[^\p{L}\p{N}_])[A-Za-z]:[\\/](?:[^\s<>"'|]+[\\/])*[^\s<>"'|]*/gmu,
      "$1[내부 자료]",
    )
    .replace(/\\\\[^\s<>"'|]+(?:\\[^\s<>"'|]+)+/gu, "[내부 자료]")
    .replace(/\bchunk(?:[-_:][\p{L}\p{N}_.-]+)+\b/giu, "[내부 자료]")
    .replace(/\[([^\]]+)\]\(https?:\/\/[^)\s]+\)/giu, "$1")
    .replace(/https?:\/\/[^\s<>"')\]]+/giu, "[관련 자료는 아래 이동 버튼을 확인해 주세요]")
    .replace(
      /(^|[\s("'(])\/(?:[\p{L}\p{N}_.-]+\/)*[\p{L}\p{N}_.-]+/gmu,
      "$1[내부 자료]",
    )
    .replace(/\S{257,}/gu, "[내부 자료]");
  return final ? sanitized.replace(/\n{3,}/gu, "\n\n").trim() : sanitized;
}

function buildAnswerLayout(rawAnswer, actions) {
  const allowedActions = new Map(actions.map((action) => [action.id, action]));
  const sanitized = sanitizePublicText(rawAnswer, {
    allowedActionIds: new Set(allowedActions.keys()),
    final: true,
  });
  const markerPattern = /\[\[action:([a-z_]+)\]\]/giu;
  const segments = [];
  let buffer = "";
  let cursor = 0;

  for (const match of sanitized.matchAll(markerPattern)) {
    buffer += sanitized.slice(cursor, match.index);
    cursor = match.index + match[0].length;
    const action = allowedActions.get(match[1].toLowerCase());
    if (!action) continue;

    const markdown = buffer.trim();
    if (markdown) {
      segments.push({ markdown, actions: [action] });
      buffer = "";
      continue;
    }

    const previous = segments.at(-1);
    if (previous && !previous.actions.some(({ id }) => id === action.id)) {
      previous.actions.push(action);
    }
  }

  buffer += sanitized.slice(cursor);
  const trailingMarkdown = buffer.trim();
  if (trailingMarkdown) segments.push({ markdown: trailingMarkdown, actions: [] });
  if (segments.length === 0) {
    segments.push({
      markdown: "관련 내용은 아래 페이지 이동 버튼에서 확인할 수 있습니다.",
      actions: [],
    });
  }

  const answer = segments.map(({ markdown }) => markdown).join("\n\n").trim();
  return {
    answer,
    segments,
  };
}

function offlineAnswerResult() {
  return {
    mode: "retrieval_fallback",
    status: "upstream_offline",
    generated: false,
    answer: OFFLINE_FALLBACK_ANSWER,
    segments: [
      {
        markdown: OFFLINE_FALLBACK_ANSWER,
        actions: [],
      },
    ],
  };
}

function publicChatResponse({
  result,
  audience,
  tone,
  pageContext,
  sources,
  actions,
  config,
  cached,
}) {
  const isModel = result.mode === "model";
  return {
    ...result,
    audience,
    tone,
    pageContext,
    sources: isModel ? exposeSources(sources, config) : [],
    actions: isModel ? actions : [],
    cached,
  };
}

function createStreamingSanitizer() {
  const maximumTokenChars = 256;
  let token = "";
  let discardMode;
  let controlCloseCandidate = false;

  function isUnclosedControl(value) {
    return (
      /^\[\s*$/u.test(value) ||
      (/^\[\s*\[/u.test(value) && !/\]\s*\]/u.test(value)) ||
      (/^\[(?:출처|source)\s*:/iu.test(value) && !/\]/u.test(value))
    );
  }

  function isSourcePrefix(value) {
    return /^(?:source|chunk_?id)\s*:\s*$/iu.test(value);
  }

  function overflow(mode, output) {
    token = "";
    discardMode = mode;
    controlCloseCandidate = false;
    output.push("[내부 자료]");
  }

  return {
    push(text) {
      const output = [];
      for (const character of text) {
        if (discardMode === "token") {
          if (/\s/u.test(character)) {
            discardMode = undefined;
            output.push(character);
          }
          continue;
        }
        if (discardMode === "control") {
          if (character === "]" && controlCloseCandidate) {
            discardMode = undefined;
            controlCloseCandidate = false;
          } else if (character === "]") {
            controlCloseCandidate = true;
          } else if (!/\s/u.test(character)) {
            controlCloseCandidate = false;
          }
          continue;
        }

        if (/\s/u.test(character)) {
          if (isUnclosedControl(token) || isSourcePrefix(token)) {
            token += character;
            if (token.length > maximumTokenChars) overflow("control", output);
            continue;
          }
          const sanitized = sanitizePublicText(token);
          token = "";
          if (sanitized) output.push(sanitized);
          output.push(character);
          continue;
        }

        token += character;
        if (token.length > maximumTokenChars) {
          overflow(isUnclosedControl(token) ? "control" : "token", output);
        }
      }
      return output;
    },
    finish() {
      if (discardMode) {
        discardMode = undefined;
        controlCloseCandidate = false;
        return [];
      }
      const sanitized = sanitizePublicText(token);
      token = "";
      return sanitized ? [sanitized] : [];
    },
  };
}

function startSse(response) {
  response.writeHead(200, {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-cache, no-transform",
    connection: "keep-alive",
    "x-accel-buffering": "no",
  });
  response.flushHeaders?.();
}

async function writeSse(response, event, data) {
  if (response.destroyed || response.writableEnded) return false;
  const accepted = response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  if (accepted) return true;
  return new Promise((resolve) => {
    const onDrain = () => {
      cleanup();
      resolve(true);
    };
    const onClose = () => {
      cleanup();
      resolve(false);
    };
    const cleanup = () => {
      response.removeListener("drain", onDrain);
      response.removeListener("close", onClose);
    };
    response.once("drain", onDrain);
    response.once("close", onClose);
  });
}

function safeStreamError(error) {
  if (error instanceof LimitError) {
    return {
      code: "upstream_busy",
      message: "모델 서버가 처리 중입니다. 잠시 후 다시 시도해 주세요.",
    };
  }
  if (error instanceof UpstreamError) {
    return {
      code: "upstream_unavailable",
      message: "모델 서버를 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.",
    };
  }
  return {
    code: "internal_error",
    message: "요청 처리 중 오류가 발생했습니다.",
  };
}

function canUseOfflineFallback(error) {
  return (
    error instanceof UpstreamError &&
    ["not_configured", "timeout", "network", "server_error"].includes(error.code)
  );
}

export async function createApp({
  config,
  upstreamClient,
  knowledgeDir = config.knowledgeDir,
  retriever: providedRetriever,
  embeddingProvider,
  vectorStore,
}) {
  const knowledge = await loadKnowledge(knowledgeDir);
  const retriever =
    providedRetriever ??
    (await createRetriever({
      mode: config.retrieverMode ?? "lexical",
      chunks: knowledge.chunks,
      vectorStoreKind: config.vectorStoreKind ?? "memory",
      embeddingProvider,
      vectorStore,
      embeddingOptions: {
        modelId: config.embeddingModel,
        revision: config.embeddingModelRevision,
        cacheDir: config.embeddingCacheDir,
        localFilesOnly: config.embeddingLocalFilesOnly,
        maxLength: config.embeddingMaxLength,
      },
      diversity: {
        maxPerSource: config.diversityMaxPerSource ?? 0,
        minPromotionRatio: config.diversityMinPromotionRatio ?? 0,
      },
    }));
  const retrieverIdentity = retriever.identity ?? "custom-retriever";
  const rateLimiter = new FixedWindowRateLimiter({
    windowMs: config.rateWindowMs,
    perIp: config.rateLimitPerIp,
    global: config.rateLimitGlobal,
  });
  const semaphore = new Semaphore(config.upstreamConcurrency, config.maxUpstreamQueue);
  const retrieveCache = new TtlCache(config.cacheTtlMs);
  const chatCache = new TtlCache(config.cacheTtlMs);
  const fallbackCache = new TtlCache(config.fallbackCacheTtlMs ?? 5_000);
  const upstreamStatusCache = new TtlCache(
    config.upstreamStatusCacheTtlMs ?? 5_000,
    1,
  );
  let upstreamStatusInFlight = null;
  // 프로세스 재시작 때 폐기되는 salt로 원 IP/질문 원문을 메모리 키에 보관하지 않는다.
  const memoryKeySalt = randomBytes(32);
  const corsHeaders = {
    "access-control-allow-origin": config.corsOrigin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "Content-Type",
    vary: "Origin",
  };

  async function getUpstreamStatus() {
    const cached = upstreamStatusCache.get("upstream");
    if (cached) return cached;
    if (upstreamStatusInFlight) return upstreamStatusInFlight;

    upstreamStatusInFlight = (async () => {
      let status = "offline";
      try {
        if (typeof upstreamClient.checkAvailability === "function") {
          await upstreamClient.checkAvailability({
            timeoutMs: config.upstreamStatusTimeoutMs ?? 3_000,
          });
          status = "online";
        }
      } catch {
        // 공개 상태 API는 업스트림 오류 상세나 인증 정보를 노출하지 않는다.
      }
      const result = { status, checkedAt: new Date().toISOString() };
      upstreamStatusCache.set("upstream", result);
      return result;
    })();

    try {
      return await upstreamStatusInFlight;
    } finally {
      upstreamStatusInFlight = null;
    }
  }

  return async function handler(request, response) {
    Object.entries(corsHeaders).forEach(([key, value]) => response.setHeader(key, value));
    try {
      if (request.method === "OPTIONS") {
        response.writeHead(204);
        response.end();
        return;
      }
      const url = new URL(request.url, "http://localhost");
      if (request.method === "GET" && url.pathname === "/health") {
        json(response, 200, {
          status: "ok",
          documents: knowledge.documents.length,
          chunks: knowledge.chunks.length,
          indexDiagnostics: knowledge.diagnostics,
          upstreamConfigured: Boolean(config.baseUrl && config.model),
          offlineFallbackEnabled: config.offlineFallbackEnabled !== false,
          retrieverMode: config.retrieverMode ?? "lexical",
          vectorStore: config.vectorStoreKind ?? "memory",
          sourceExposure: config.sourceExposure ?? "none",
        });
        return;
      }
      if (request.method === "GET" && url.pathname === "/api/chat/status") {
        json(response, 200, await getUpstreamStatus(), {
          "cache-control": "no-store",
        });
        return;
      }
      if (
        request.method !== "POST" ||
        !["/api/retrieve", "/api/chat", "/api/chat/stream"].includes(url.pathname)
      ) {
        throw new HttpError(404, "not_found", "요청한 경로를 찾을 수 없습니다.");
      }

      const ip = getClientIp(request, config.trustProxy);
      const clientKey = privateMemoryKey(ip, memoryKeySalt, "rate-limit");
      const rate = rateLimiter.take(clientKey);
      if (!rate.allowed) {
        throw new HttpError(
          429,
          "rate_limited",
          "요청이 많습니다. 잠시 후 다시 시도해 주세요.",
          { "retry-after": String(Math.ceil(rate.retryAfterMs / 1_000)) },
        );
      }
      const body = await readJson(request, config.maxBodyBytes);

      if (url.pathname === "/api/retrieve") {
        const query = validateQuery(body.query, config.maxMessageChars);
        const topK = validateTopK(body.topK, config.topK);
        const key = privateMemoryKey(
          { query, topK, retrieverIdentity },
          memoryKeySalt,
          "retrieve-cache",
        );
        let results = retrieveCache.get(key);
        if (!results) {
          results = await retriever.search(query, { topK });
          retrieveCache.set(key, results);
        }
        json(response, 200, { query, results: exposeSources(results, config) });
        return;
      }

      const message = validateQuery(body.message, config.maxMessageChars);
      const history = validateHistory(body.history, config);
      const audience = validateAudience(body.audience);
      const tone = validateTone(body.tone);
      const pageContext = validatePageContext(body.pageContext);
      const streaming = url.pathname === "/api/chat/stream";

      const sendStreamResult = async (payload) => {
        startSse(response);
        const meta = {
          mode: payload.mode,
          status: payload.status,
          audience: payload.audience,
          tone: payload.tone,
          pageContext: payload.pageContext,
          cached: payload.cached,
        };
        if (!(await writeSse(response, "meta", meta))) return;
        if (payload.answer && !(await writeSse(response, "delta", { text: payload.answer }))) {
          return;
        }
        if (!(await writeSse(response, "done", payload))) return;
        response.end();
      };

      if (
        config.offlineFallbackEnabled !== false &&
        !(config.baseUrl && config.model)
      ) {
        const payload = publicChatResponse({
          result: offlineAnswerResult(),
          audience,
          tone,
          pageContext,
          actions: [],
          sources: [],
          config,
          cached: false,
        });
        if (streaming) await sendStreamResult(payload);
        else json(response, 200, payload);
        return;
      }

      const sources = await retriever.search(message, { topK: config.topK });
      const actions = buildNavigationActions(sources, { currentPage: pageContext });
      const actionIds = new Set(actions.map(({ id }) => id));
      const key = privateMemoryKey(
        {
          message,
          history,
          audience,
          tone,
          pageContext,
          retrieverIdentity,
          sources: sources.map(({ id }) => id),
        },
        memoryKeySalt,
        "chat-cache",
      );
      let result = chatCache.get(key);
      let cached = true;
      if (!result) result = fallbackCache.get(key);
      if (result) {
        const payload = publicChatResponse({
          result,
          audience,
          tone,
          pageContext,
          sources,
          actions,
          config,
          cached,
        });
        if (streaming) await sendStreamResult(payload);
        else json(response, 200, payload);
        return;
      }

      cached = false;
      const messages = buildChatMessages({
        persona: knowledge.persona,
        history,
        message,
        sources: sources.map((source) => {
          const actionId = actionIdForSource(source);
          return {
            ...source,
            actionId: actionId && actionIds.has(actionId) ? actionId : undefined,
          };
        }),
        audience,
        tone,
        pageContext,
        maxEvidenceChars: config.maxEvidenceChars,
      });
      const requestController = new AbortController();
      const abortRequest = () => requestController.abort();
      const abortClosedResponse = () => {
        if (!response.writableEnded) requestController.abort();
      };
      request.once("aborted", abortRequest);
      response.once("close", abortClosedResponse);

      if (streaming) {
        let streamStarted = false;
        try {
          try {
            await semaphore.run(
              async () => {
                const stream = await upstreamClient.chatStream(messages, {
                  signal: requestController.signal,
                });
                const iterator = stream[Symbol.asyncIterator]();
                const sanitizer = createStreamingSanitizer();
                let rawAnswer = "";
                try {
                  let next = await iterator.next();
                  if (next.done) throw new UpstreamError("invalid_response");

                  startSse(response);
                  streamStarted = true;
                  if (
                    !(await writeSse(response, "meta", {
                      mode: "model",
                      status: "online",
                      audience,
                      tone,
                      pageContext,
                      cached: false,
                    }))
                  ) {
                    throw new UpstreamError("cancelled");
                  }

                  while (!next.done) {
                    if (typeof next.value !== "string") {
                      throw new UpstreamError("invalid_response");
                    }
                    rawAnswer += next.value;
                    for (const text of sanitizer.push(next.value)) {
                      if (!(await writeSse(response, "delta", { text }))) {
                        throw new UpstreamError("cancelled");
                      }
                    }
                    next = await iterator.next();
                  }
                  for (const text of sanitizer.finish()) {
                    if (!(await writeSse(response, "delta", { text }))) {
                      throw new UpstreamError("cancelled");
                    }
                  }

                  const answerLayout = buildAnswerLayout(rawAnswer, actions);
                  result = {
                    mode: "model",
                    status: "online",
                    generated: true,
                    ...answerLayout,
                  };
                  chatCache.set(key, result);
                  const payload = publicChatResponse({
                    result,
                    audience,
                    tone,
                    pageContext,
                    sources,
                    actions,
                    config,
                    cached: false,
                  });
                  if (!(await writeSse(response, "done", payload))) {
                    throw new UpstreamError("cancelled");
                  }
                  response.end();
                } finally {
                  await iterator.return?.();
                }
              },
              { signal: requestController.signal },
            );
          } catch (error) {
            if (
              !streamStarted &&
              config.offlineFallbackEnabled !== false &&
              canUseOfflineFallback(error)
            ) {
              result = offlineAnswerResult();
              fallbackCache.set(key, result);
              await sendStreamResult(
                publicChatResponse({
                  result,
                  audience,
                  tone,
                  pageContext,
                  sources,
                  actions,
                  config,
                  cached: false,
                }),
              );
            } else if (streamStarted) {
              if (
                error instanceof UpstreamError &&
                error.code === "cancelled"
              ) {
                return;
              }
              if (!response.destroyed && !response.writableEnded) {
                await writeSse(response, "error", safeStreamError(error));
                response.end();
              }
            } else {
              throw error;
            }
          }
        } finally {
          request.removeListener("aborted", abortRequest);
          response.removeListener("close", abortClosedResponse);
        }
        return;
      }

      try {
        try {
          const rawAnswer = await semaphore.run(
            () => upstreamClient.chat(messages, { signal: requestController.signal }),
            { signal: requestController.signal },
          );
          const answerLayout = buildAnswerLayout(rawAnswer, actions);
          result = {
            mode: "model",
            status: "online",
            generated: true,
            ...answerLayout,
          };
          chatCache.set(key, result);
        } catch (error) {
          if (config.offlineFallbackEnabled !== false && canUseOfflineFallback(error)) {
            result = offlineAnswerResult();
            fallbackCache.set(key, result);
          } else {
            throw error;
          }
        }
      } finally {
        request.removeListener("aborted", abortRequest);
        response.removeListener("close", abortClosedResponse);
      }
      json(response, 200, publicChatResponse({
        result,
        audience,
        tone,
        pageContext,
        sources,
        actions,
        config,
        cached,
      }));
    } catch (error) {
      if (response.destroyed || response.writableEnded) return;
      if (error instanceof HttpError) {
        json(
          response,
          error.status,
          { error: error.code, message: error.message, actions: [] },
          error.headers,
        );
      } else if (error instanceof LimitError) {
        if (error.code === "cancelled") return;
        json(response, 503, {
          error: "upstream_busy",
          message: "모델 서버가 처리 중입니다. 잠시 후 다시 시도해 주세요.",
          actions: [],
        });
      } else if (error instanceof UpstreamError) {
        const status = error.code === "not_configured" ? 503 : 502;
        json(response, status, {
          error: "upstream_unavailable",
          message: "모델 서버를 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.",
          actions: [],
        });
      } else {
        // 원본 오류나 업스트림 본문은 응답에 포함하지 않는다.
        json(response, 500, {
          error: "internal_error",
          message: "요청 처리 중 오류가 발생했습니다.",
          actions: [],
        });
      }
    }
  };
}
