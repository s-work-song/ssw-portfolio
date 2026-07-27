import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  buildNavigationActions,
  createApp,
  getClientIp,
  OFFLINE_FALLBACK_ANSWER,
  validateAudience,
  validatePageContext,
  validateTone,
} from "../src/app.js";
import { createOpenAIClient, UpstreamError } from "../src/upstream.js";
import { DeterministicEmbeddingProvider } from "../src/rag/embedding.js";

const baseConfig = {
  baseUrl: "http://mock.invalid/v1",
  model: "mock-model",
  corsOrigin: "*",
  trustProxy: false,
  offlineFallbackEnabled: true,
  topK: 3,
  maxBodyBytes: 2048,
  maxMessageChars: 100,
  maxHistoryItems: 2,
  maxHistoryChars: 200,
  maxEvidenceChars: 2_000,
  sourceExcerptChars: 120,
  upstreamConcurrency: 1,
  maxUpstreamQueue: 1,
  rateWindowMs: 60_000,
  rateLimitPerIp: 20,
  rateLimitGlobal: 50,
  cacheTtlMs: 30_000,
  fallbackCacheTtlMs: 5_000,
};

async function listen(handler) {
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    server,
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

async function fixture(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "rag-app-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await writeFile(path.join(directory, "persona.md"), "# 정책\n근거만 답하세요.", "utf8");
  await writeFile(
    path.join(directory, "profile.md"),
    "---\nid: profile\ntitle: 프로필\ntype: profile\nindex: true\nsources:\n  - https://example.com/profile\n---\n# 기술\nNode.js 백엔드와 AI 에이전트 오케스트레이션 경험이 있습니다.",
    "utf8",
  );
  return directory;
}

test("health, OPTIONS, retrieve, chat을 제공하고 health는 upstream을 부르지 않는다", async (t) => {
  const knowledgeDir = await fixture(t);
  let calls = 0;
  let capturedMessages;
  const handler = await createApp({
    config: baseConfig,
    knowledgeDir,
    upstreamClient: {
      async chat(messages) {
        calls += 1;
        capturedMessages = messages;
        return "근거 기반 답변";
      },
    },
  });
  const api = await listen(handler);
  t.after(api.close);

  const health = await fetch(`${api.url}/health`);
  assert.equal(health.status, 200);
  const healthPayload = await health.json();
  assert.equal(healthPayload.upstreamConfigured, true);
  assert.equal(healthPayload.offlineFallbackEnabled, true);
  assert.deepEqual(healthPayload.indexDiagnostics, []);
  assert.equal(calls, 0);

  const options = await fetch(`${api.url}/api/chat`, { method: "OPTIONS" });
  assert.equal(options.status, 204);
  assert.equal(options.headers.get("access-control-allow-origin"), "*");

  const retrieved = await fetch(`${api.url}/api/retrieve`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: "에이전트 경험", topK: 2 }),
  });
  const retrievalPayload = await retrieved.json();
  assert.equal(retrieved.status, 200);
  assert.deepEqual(retrievalPayload.results, []);

  const chat = await fetch(`${api.url}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: "에이전트 경험이 있나요?" }),
  });
  const chatPayload = await chat.json();
  assert.equal(chat.status, 200);
  assert.equal(chatPayload.answer, "근거 기반 답변");
  assert.equal(chatPayload.mode, "model");
  assert.equal(chatPayload.status, "online");
  assert.equal(chatPayload.generated, true);
  assert.equal(chatPayload.audience, "default");
  assert.equal(chatPayload.tone, "official");
  assert.equal(chatPayload.pageContext, "default");
  assert.equal(chatPayload.cached, false);
  assert.match(capturedMessages[0].content, /근거만 답하세요/);
  assert.deepEqual(chatPayload.sources, []);
  assert.equal(JSON.stringify(chatPayload).includes("profile.md"), false);
  assert.equal(JSON.stringify(chatPayload).includes("Node.js 백엔드"), false);
  assert.deepEqual(chatPayload.actions, [{ id: "resume", label: "경력·기술 보기" }]);
  assert.equal(Object.hasOwn(chatPayload.actions[0], "url"), false);
  assert.equal(calls, 1);

  const cached = await fetch(`${api.url}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: "에이전트 경험이 있나요?" }),
  });
  const cachedPayload = await cached.json();
  assert.equal(cachedPayload.cached, true);
  assert.deepEqual(cachedPayload.actions, chatPayload.actions);
  assert.equal(calls, 1);
});

test("backend dense mode를 fake provider로 주입하고 health/cache identity를 분리한다", async (t) => {
  const knowledgeDir = await fixture(t);
  const handler = await createApp({
    config: {
      ...baseConfig,
      retrieverMode: "dense",
      vectorStoreKind: "memory",
      embeddingModelRevision: "test-v1",
    },
    knowledgeDir,
    embeddingProvider: new DeterministicEmbeddingProvider({ dimensions: 64 }),
    upstreamClient: { chat: async () => "unused" },
  });
  const api = await listen(handler);
  t.after(api.close);

  const health = await fetch(`${api.url}/health`);
  const healthPayload = await health.json();
  assert.equal(healthPayload.retrieverMode, "dense");
  assert.equal(healthPayload.vectorStore, "memory");

  const first = await fetch(`${api.url}/api/retrieve`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: "에이전트 경험", topK: 1 }),
  });
  const payload = await first.json();
  assert.equal(first.status, 200);
  assert.deepEqual(payload.results, []);
});

test("audience를 요청 단위 prompt와 cache key에 반영하고 잘못된 값은 거절한다", async (t) => {
  const knowledgeDir = await fixture(t);
  const captured = [];
  const handler = await createApp({
    config: baseConfig,
    knowledgeDir,
    upstreamClient: {
      async chat(messages) {
        captured.push(messages[0].content);
        return `answer-${captured.length}`;
      },
    },
  });
  const api = await listen(handler);
  t.after(api.close);

  const chat = async (audience) => {
    const response = await fetch(`${api.url}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "경험을 설명해 주세요.", audience }),
    });
    return { response, payload: await response.json() };
  };

  const developer = await chat("developer");
  assert.equal(developer.response.status, 200);
  assert.equal(developer.payload.audience, "developer");
  assert.match(captured[0], /선택된 관점: developer/);
  assert.match(captured[0], /구조, 기술 선택, 제약/);

  const developerCached = await chat("developer");
  assert.equal(developerCached.payload.cached, true);
  assert.equal(captured.length, 1);

  const hiring = await chat("hiring");
  assert.equal(hiring.payload.audience, "hiring");
  assert.equal(hiring.payload.cached, false);
  assert.equal(captured.length, 2);
  assert.match(captured[1], /선택된 관점: hiring/);

  const invalid = await chat("recruiter");
  assert.equal(invalid.response.status, 400);
  assert.equal(invalid.payload.error, "invalid_audience");
  assert.equal(captured.length, 2);
});

test("tone을 audience와 독립적으로 prompt와 cache key에 반영한다", async (t) => {
  const knowledgeDir = await fixture(t);
  const captured = [];
  const handler = await createApp({
    config: baseConfig,
    knowledgeDir,
    upstreamClient: {
      async chat(messages) {
        captured.push(messages[0].content);
        return `answer-${captured.length}`;
      },
    },
  });
  const api = await listen(handler);
  t.after(api.close);

  const chat = async (audience, tone) => {
    const response = await fetch(`${api.url}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "프로젝트를 설명해 주세요.", audience, tone }),
    });
    return { response, payload: await response.json() };
  };

  const manager = await chat("developer", "manager");
  assert.equal(manager.response.status, 200);
  assert.equal(manager.payload.audience, "developer");
  assert.equal(manager.payload.tone, "manager");
  assert.match(captured[0], /선택된 관점: developer/);
  assert.match(captured[0], /선택된 말투: manager/);
  assert.match(captured[0], /'개발자님은'.*최대 한 번/);
  assert.match(captured[0], /소개형 해요체/);
  assert.match(captured[0], /'-해요\/-예요\/-이에요'/);
  assert.ok(
    captured[0].indexOf("<final_response_contract>") >
      captured[0].indexOf("</retrieved_evidence>"),
  );

  const managerCached = await chat("developer", "manager");
  assert.equal(managerCached.payload.cached, true);
  assert.equal(captured.length, 1);

  const mascot = await chat("developer", "mascot");
  assert.equal(mascot.payload.cached, false);
  assert.equal(mascot.payload.tone, "mascot");
  assert.equal(captured.length, 2);
  assert.match(captured[1], /'저희 주인님은요'.*최대 한 번/);
  assert.match(captured[1], /소유주 전언형 해요체/);
  assert.match(captured[1], /'-라고 하세요'.*명령처럼 들릴 문맥/);

  const differentAudience = await chat("hiring", "mascot");
  assert.equal(differentAudience.payload.cached, false);
  assert.equal(captured.length, 3);

  const invalid = await chat("developer", "friendly");
  assert.equal(invalid.response.status, 400);
  assert.equal(invalid.payload.error, "invalid_tone");
  assert.equal(captured.length, 3);
});

test("pageContext를 낮은 우선순위 prompt 힌트와 cache key에 반영한다", async (t) => {
  const knowledgeDir = await fixture(t);
  const captured = [];
  const handler = await createApp({
    config: baseConfig,
    knowledgeDir,
    upstreamClient: {
      async chat(messages) {
        captured.push(messages[0].content);
        return `answer-${captured.length}`;
      },
    },
  });
  const api = await listen(handler);
  t.after(api.close);

  const chat = async (pageContext) => {
    const response = await fetch(`${api.url}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: "이 내용을 설명해 주세요.",
        audience: "default",
        tone: "official",
        pageContext,
      }),
    });
    return { response, payload: await response.json() };
  };

  const resume = await chat("resume");
  assert.equal(resume.response.status, 200);
  assert.equal(resume.payload.pageContext, "resume");
  assert.match(captured[0], /현재 페이지: resume/);
  assert.match(captured[0], /낮은 우선순위/);

  const resumeCached = await chat("resume");
  assert.equal(resumeCached.payload.cached, true);
  assert.equal(captured.length, 1);

  const research = await chat("research");
  assert.equal(research.payload.cached, false);
  assert.equal(research.payload.pageContext, "research");
  assert.equal(captured.length, 2);
  assert.match(captured[1], /현재 페이지: research/);

  const invalid = await chat("private_admin");
  assert.equal(invalid.response.status, 400);
  assert.equal(invalid.payload.error, "invalid_page_context");
  assert.equal(captured.length, 2);
});

test("offline, timeout, 5xx, 미구성은 출처 없는 고정 안내로 명확히 반환한다", async (t) => {
  const knowledgeDir = await fixture(t);
  for (const code of ["network", "timeout", "server_error", "not_configured"]) {
    let calls = 0;
    const handler = await createApp({
      config: baseConfig,
      knowledgeDir,
      upstreamClient: {
        async chat() {
          calls += 1;
          throw new UpstreamError(code, `SECRET raw ${code}`, {
            status: code === "server_error" ? 530 : undefined,
          });
        },
      },
    });
    const api = await listen(handler);
    const response = await fetch(`${api.url}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "에이전트 경험이 있나요?" }),
    });
    const payload = await response.json();
    assert.equal(response.status, 200, code);
    assert.equal(payload.mode, "retrieval_fallback", code);
    assert.equal(payload.status, "upstream_offline", code);
    assert.equal(payload.generated, false, code);
    assert.equal(payload.answer, OFFLINE_FALLBACK_ANSWER, code);
    assert.deepEqual(payload.sources, [], code);
    assert.deepEqual(payload.actions, [], code);
    assert.equal(JSON.stringify(payload).includes("SECRET"), false, code);

    const cachedResponse = await fetch(`${api.url}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "에이전트 경험이 있나요?" }),
    });
    const cachedPayload = await cachedResponse.json();
    assert.equal(cachedPayload.mode, "retrieval_fallback");
    assert.equal(cachedPayload.cached, true);
    assert.deepEqual(cachedPayload.actions, []);
    assert.equal(calls, 1);
    await api.close();
  }
});

test("검색 hit 여부와 무관하게 sources=[]인 offline 안내를 반환한다", async (t) => {
  const knowledgeDir = await fixture(t);
  const handler = await createApp({
    config: baseConfig,
    knowledgeDir,
    upstreamClient: { chat: async () => Promise.reject(new UpstreamError("network")) },
  });
  const api = await listen(handler);
  t.after(api.close);
  const response = await fetch(`${api.url}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      message: "!!!",
      audience: "casual",
      tone: "mascot",
      pageContext: "research",
    }),
  });
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.mode, "retrieval_fallback");
  assert.equal(payload.audience, "casual");
  assert.equal(payload.tone, "mascot");
  assert.equal(payload.pageContext, "research");
  assert.deepEqual(payload.sources, []);
  assert.deepEqual(payload.actions, []);
});

test("upstream 미설정은 문서 검색과 모델 호출 전에 고정 offline 안내를 반환한다", async (t) => {
  const knowledgeDir = await fixture(t);
  let searches = 0;
  let calls = 0;
  const handler = await createApp({
    config: { ...baseConfig, baseUrl: "", model: "" },
    knowledgeDir,
    retriever: {
      identity: "offline-search-probe",
      async search() {
        searches += 1;
        return [];
      },
    },
    upstreamClient: {
      async chat() {
        calls += 1;
        return "호출되면 안 됨";
      },
    },
  });
  const api = await listen(handler);
  t.after(api.close);

  const response = await fetch(`${api.url}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      message: "기술 경험은?",
      audience: "hiring",
      tone: "manager",
      pageContext: "resume",
    }),
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.mode, "retrieval_fallback");
  assert.equal(payload.status, "upstream_offline");
  assert.equal(payload.generated, false);
  assert.equal(payload.answer, OFFLINE_FALLBACK_ANSWER);
  assert.equal(payload.audience, "hiring");
  assert.equal(payload.tone, "manager");
  assert.equal(payload.pageContext, "resume");
  assert.deepEqual(payload.sources, []);
  assert.deepEqual(payload.actions, []);
  assert.equal(searches, 0);
  assert.equal(calls, 0);
});

test("upstream 인증·설정 4xx와 fallback 비활성화는 offline으로 위장하지 않는다", async (t) => {
  const knowledgeDir = await fixture(t);
  for (const scenario of [
    {
      config: baseConfig,
      error: new UpstreamError("client_error", "SECRET auth body", { status: 401 }),
    },
    {
      config: baseConfig,
      error: new UpstreamError("overloaded", "SECRET rate limit body", { status: 429 }),
    },
    {
      config: { ...baseConfig, offlineFallbackEnabled: false },
      error: new UpstreamError("network", "SECRET network body"),
    },
  ]) {
    const handler = await createApp({
      config: scenario.config,
      knowledgeDir,
      upstreamClient: { chat: async () => Promise.reject(scenario.error) },
    });
    const api = await listen(handler);
    const response = await fetch(`${api.url}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "기술은?" }),
    });
    const payload = await response.json();
    assert.equal(response.status, 502);
    assert.equal(payload.error, "upstream_unavailable");
    assert.deepEqual(payload.actions, []);
    assert.equal(JSON.stringify(payload).includes("SECRET"), false);
    await api.close();
  }
});

test("topK 범위를 검증하고 429에 Retry-After를 제공한다", async (t) => {
  const knowledgeDir = await fixture(t);
  const handler = await createApp({
    config: { ...baseConfig, rateLimitPerIp: 4, rateLimitGlobal: 4 },
    knowledgeDir,
    upstreamClient: { chat: async () => "unused" },
  });
  const api = await listen(handler);
  t.after(api.close);

  const invalid = await fetch(`${api.url}/api/retrieve`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: "질문", topK: 0 }),
  });
  assert.equal(invalid.status, 400);
  const invalidPayload = await invalid.json();
  assert.equal(invalidPayload.error, "invalid_top_k");
  assert.deepEqual(invalidPayload.actions, []);

  for (const topK of [-1, baseConfig.topK + 1]) {
    const outOfRange = await fetch(`${api.url}/api/retrieve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: "질문", topK }),
    });
    assert.equal(outOfRange.status, 400);
    assert.equal((await outOfRange.json()).error, "invalid_top_k");
  }

  const valid = await fetch(`${api.url}/api/retrieve`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: "질문", topK: 1 }),
  });
  assert.equal(valid.status, 200);

  const limited = await fetch(`${api.url}/api/retrieve`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: "질문" }),
  });
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get("retry-after")) >= 1);
  assert.deepEqual((await limited.json()).actions, []);
});

test("X-Forwarded-For는 trust proxy가 켜진 경우에만 사용한다", () => {
  const request = {
    headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.2" },
    socket: { remoteAddress: "127.0.0.1" },
  };
  assert.equal(getClientIp(request, false), "127.0.0.1");
  assert.equal(getClientIp(request, true), "203.0.113.7");
});

test("audience 미선택과 명시적 default를 같은 기본 관점으로 정규화한다", () => {
  assert.equal(validateAudience(undefined), "default");
  assert.equal(validateAudience(null), "default");
  assert.equal(validateAudience(""), "default");
  assert.equal(validateAudience("default"), "default");
});

test("tone 미선택은 official로 정규화한다", () => {
  assert.equal(validateTone(undefined), "official");
  assert.equal(validateTone(null), "official");
  assert.equal(validateTone(""), "official");
  assert.equal(validateTone("official"), "official");
});

test("pageContext 미선택은 default로 정규화한다", () => {
  assert.equal(validatePageContext(undefined), "default");
  assert.equal(validatePageContext(null), "default");
  assert.equal(validatePageContext(""), "default");
  assert.equal(validatePageContext("default"), "default");
});

test("내부 이동 actions는 검색 metadata의 allowlist ID와 label만 최대 2개 반환한다", () => {
  const actions = buildNavigationActions(
    [
      {
        docId: "profile-song-sangwoon",
        source: "profile.md",
        type: "profile",
        section: "경력",
        content: "https://evil.example/model-url",
      },
      {
        docId: "project-ai-agent-orchestration",
        source: "projects/ai-agent-orchestration.md",
        type: "project",
        section: "연구",
      },
      {
        docId: "project-portfolio-rag-chatbot",
        source: "projects/portfolio-rag-chatbot.md",
        type: "project",
        section: "상태",
      },
    ],
    { currentPage: "overview" },
  );
  assert.deepEqual(actions, [
    { id: "resume", label: "경력·기술 보기" },
    { id: "research", label: "연구·기술 탐구 보기" },
  ]);
  assert.equal(JSON.stringify(actions).includes("http"), false);
  assert.ok(actions.every((action) => ["id", "label"].every((key) => key in action)));
});

test("model answer의 raw URL과 내부 source는 public 기본 응답에서 제거한다", async (t) => {
  const knowledgeDir = await fixture(t);
  const handler = await createApp({
    config: baseConfig,
    knowledgeDir,
    upstreamClient: {
      chat: async () =>
        "기술 경험이 있습니다. [출처: profile.md > 경력]\n\n자세한 내용은 [악성 링크](https://evil.example/redirect) 또는 https://evil.example/raw 및 projects/private.md에서 보세요.\n\n공개 문의는 sworksong@gmail.com으로 받고, 비공개 주소 private.person@example.com은 공개하지 않습니다.",
    },
  });
  const api = await listen(handler);
  t.after(api.close);
  const response = await fetch(`${api.url}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: "기술 경험은?" }),
  });
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.answer.includes("evil.example"), false);
  assert.equal(payload.answer.includes("[출처:"), false);
  assert.equal(payload.answer.includes("profile.md"), false);
  assert.equal(payload.answer.includes("private.md"), false);
  assert.equal(payload.answer.includes("sworksong@gmail.com"), true);
  assert.equal(payload.answer.includes("private.person@example.com"), false);
  assert.match(payload.answer, /비공개 주소 \[내부 자료\]/u);
  assert.deepEqual(payload.sources, []);
  assert.equal(JSON.stringify(payload).includes("profile.md"), false);
  assert.deepEqual(payload.actions, [{ id: "resume", label: "경력·기술 보기" }]);
});

test("허용된 action marker만 문단 segment에 배치하고 bottom actions는 unique하게 유지한다", async (t) => {
  const knowledgeDir = await fixture(t);
  let capturedSystemPrompt = "";
  const handler = await createApp({
    config: baseConfig,
    knowledgeDir,
    upstreamClient: {
      chat: async (messages) => {
        capturedSystemPrompt = messages[0].content;
        return "첫 번째 관련 문단입니다.\n\n[[action:resume]]\n[[action:resume]]\n\n두 번째 문단입니다.\n\n[[action:not_allowed]]\n[[action:resume]]";
      },
    },
  });
  const api = await listen(handler);
  t.after(api.close);

  const response = await fetch(`${api.url}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: "기술 경험은?" }),
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.answer.includes("[[action:"), false);
  assert.deepEqual(payload.segments, [
    {
      markdown: "첫 번째 관련 문단입니다.",
      actions: [{ id: "resume", label: "경력·기술 보기" }],
    },
    {
      markdown: "두 번째 문단입니다.",
      actions: [{ id: "resume", label: "경력·기술 보기" }],
    },
  ]);
  assert.deepEqual(payload.actions, [{ id: "resume", label: "경력·기술 보기" }]);
  assert.equal(JSON.stringify(payload).includes("not_allowed"), false);
  assert.match(capturedSystemPrompt, /허용된 이동 marker: \[\[action:resume\]\]/);
  assert.doesNotMatch(capturedSystemPrompt, /허용된 이동 marker: \[\[action:not_allowed\]\]/);
});

test("debug source exposure도 로컬 path를 숨기고 명시한 수준만 반환한다", async (t) => {
  const knowledgeDir = await fixture(t);
  for (const [sourceExposure, expectedKeys] of [
    ["metadata", ["title", "section", "score", "url"]],
    ["excerpt", ["title", "section", "score", "url", "excerpt"]],
  ]) {
    const handler = await createApp({
      config: { ...baseConfig, sourceExposure },
      knowledgeDir,
      upstreamClient: { chat: async () => "근거 기반 답변" },
    });
    const api = await listen(handler);
    const response = await fetch(`${api.url}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "기술 경험은?" }),
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(Object.keys(payload.sources[0]), expectedKeys);
    assert.equal(Object.hasOwn(payload.sources[0], "source"), false);
    assert.equal(Object.hasOwn(payload.sources[0], "docId"), false);
    assert.equal(Object.hasOwn(payload.sources[0], "chunkId"), false);
    if (sourceExposure === "metadata") {
      assert.equal(Object.hasOwn(payload.sources[0], "excerpt"), false);
    }
    await api.close();
  }
});

test("입력 길이를 제한하고 내부 upstream 오류를 노출하지 않는다", async (t) => {
  const knowledgeDir = await fixture(t);
  const secretError = new Error("SECRET upstream body");
  const handler = await createApp({
    config: baseConfig,
    knowledgeDir,
    upstreamClient: { chat: async () => Promise.reject(secretError) },
  });
  const api = await listen(handler);
  t.after(api.close);

  const tooLong = await fetch(`${api.url}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: "가".repeat(101) }),
  });
  assert.equal(tooLong.status, 400);

  const failed = await fetch(`${api.url}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: "기술은?" }),
  });
  const payload = await failed.json();
  assert.equal(failed.status, 500);
  assert.equal(JSON.stringify(payload).includes("SECRET"), false);
});

test("OpenAI-compatible client가 로컬 mock /v1/chat/completions를 호출한다", async (t) => {
  let requestPath;
  let authorization;
  const mock = await listen(async (request, response) => {
    requestPath = request.url;
    authorization = request.headers.authorization;
    for await (const _ of request) {
      // 요청 본문 소비
    }
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ choices: [{ message: { content: "mock answer" } }] }));
  });
  t.after(mock.close);

  const client = createOpenAIClient({
    baseUrl: `${mock.url}/v1`,
    apiKey: "test-key",
    model: "mock-model",
    timeoutMs: 2_000,
  });
  const answer = await client.chat([{ role: "user", content: "hello" }]);
  assert.equal(answer, "mock answer");
  assert.equal(requestPath, "/v1/chat/completions");
  assert.equal(authorization, "Bearer test-key");
});

test("OpenAI-compatible client가 530을 server_error로 분류하고 본문을 숨긴다", async (t) => {
  const mock = await listen(async (request, response) => {
    for await (const _ of request) {
      // 요청 본문 소비
    }
    response.writeHead(530, { "content-type": "text/plain" });
    response.end("SECRET upstream details");
  });
  t.after(mock.close);
  const client = createOpenAIClient({
    baseUrl: `${mock.url}/v1`,
    apiKey: "test-key",
    model: "mock-model",
    timeoutMs: 2_000,
  });
  await assert.rejects(
    client.chat([{ role: "user", content: "hello" }]),
    (error) =>
      error instanceof UpstreamError &&
      error.code === "server_error" &&
      error.status === 530 &&
      !error.message.includes("SECRET"),
  );
});
