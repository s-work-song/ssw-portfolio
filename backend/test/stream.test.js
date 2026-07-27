import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createApp, OFFLINE_FALLBACK_ANSWER } from "../src/app.js";
import { createOpenAIClient, UpstreamError } from "../src/upstream.js";

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
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

async function fixture(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "rag-stream-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await writeFile(path.join(directory, "persona.md"), "# 정책\n근거만 답하세요.", "utf8");
  await writeFile(
    path.join(directory, "profile.md"),
    "---\nid: profile\ntitle: 공개 프로필\ntype: profile\nindex: true\n---\n# 경력\nNode.js 백엔드 경험이 있습니다.",
    "utf8",
  );
  return directory;
}

function parseSse(text) {
  return text
    .split(/\r?\n\r?\n/u)
    .filter(Boolean)
    .map((block) => {
      const lines = block.split(/\r?\n/u);
      const event = lines.find((line) => line.startsWith("event: "))?.slice(7);
      const data = lines
        .filter((line) => line.startsWith("data: "))
        .map((line) => line.slice(6))
        .join("\n");
      return { event, data: JSON.parse(data) };
    });
}

async function postStream(url, body = { message: "기술 경험은?" }, options = {}) {
  const response = await fetch(`${url}/api/chat/stream`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    ...options,
  });
  return { response, events: parseSse(await response.text()) };
}

test("OpenAI SSE parser가 CRLF, 분할 JSON, 분할 UTF-8과 [DONE]을 처리한다", async () => {
  const encoded = new TextEncoder().encode(
    'data: {"choices":[{"delta":{"content":"안녕"}}]}\r\n\r\n' +
      'data: {"choices":[{"delta":{"content":"하세요"}}]}\r\n\r\n' +
      "data: [DONE]\r\n\r\n",
  );
  let requestPayload;
  const client = createOpenAIClient({
    baseUrl: "http://mock.invalid/v1",
    model: "mock-model",
    fetchImpl: async (_url, options) => {
      requestPayload = JSON.parse(options.body);
      return new Response(
        new ReadableStream({
          start(controller) {
            for (const byte of encoded) controller.enqueue(Uint8Array.of(byte));
            controller.close();
          },
        }),
        { status: 200, headers: { "content-type": "text/event-stream" } },
      );
    },
  });

  const deltas = [];
  for await (const delta of client.chatStream([{ role: "user", content: "hello" }])) {
    deltas.push(delta);
  }
  assert.deepEqual(deltas, ["안녕", "하세요"]);
  assert.equal(requestPayload.stream, true);
});

test("OpenAI SSE parser가 malformed JSON과 [DONE] 없는 partial 응답을 거절한다", async () => {
  for (const source of [
    "data: {malformed}\n\ndata: [DONE]\n\n",
    'data: {"choices":[{"delta":{"content":"partial"}}]}\n\n',
  ]) {
    const client = createOpenAIClient({
      baseUrl: "http://mock.invalid/v1",
      model: "mock-model",
      fetchImpl: async () =>
        new Response(source, {
          status: 200,
          headers: { "content-type": "text/event-stream" },
        }),
    });
    await assert.rejects(
      async () => {
        for await (const _ of client.chatStream([{ role: "user", content: "hello" }])) {
          // 끝까지 소비해야 malformed/partial 계약을 검증할 수 있다.
        }
      },
      (error) => error instanceof UpstreamError && error.code === "invalid_response",
    );
  }
});

test("chat stream은 SSE headers와 meta-delta-done 순서를 지키고 marker/path를 숨긴다", async (t) => {
  const knowledgeDir = await fixture(t);
  let capturedPrompt = "";
  let calls = 0;
  const handler = await createApp({
    config: baseConfig,
    knowledgeDir,
    upstreamClient: {
      async *chatStream(messages) {
        calls += 1;
        capturedPrompt = messages[0].content;
        yield "첫 문단입니다.\n[[act";
        yield "ion:resume]]\nprojects/private.md와 https://evil.example/path\n문의는 sworksong@gm";
        yield "ail.com으로 해 주세요.\n마지막 문단입니다.";
      },
      async chat() {
        throw new Error("JSON 경로는 호출하지 않아야 한다");
      },
    },
  });
  const api = await listen(handler);
  t.after(api.close);

  const { response, events } = await postStream(api.url);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/event-stream; charset=utf-8");
  assert.equal(response.headers.get("cache-control"), "no-cache, no-transform");
  assert.equal(response.headers.get("connection"), "keep-alive");
  assert.equal(response.headers.get("x-accel-buffering"), "no");
  assert.equal(events[0].event, "meta");
  assert.equal(events.at(-1).event, "done");
  assert.ok(events.slice(1, -1).every(({ event }) => event === "delta"));
  assert.equal(events[0].data.cached, false);
  const deltaText = events
    .filter(({ event }) => event === "delta")
    .map(({ data }) => data.text)
    .join("");
  assert.equal(/\[\[action:|private\.md|evil\.example/u.test(deltaText), false);
  assert.equal(deltaText.includes("sworksong@gmail.com"), true);
  assert.deepEqual(events.at(-1).data.segments, [
    {
      markdown: "첫 문단입니다.",
      actions: [{ id: "resume", label: "경력·기술 보기" }],
    },
    {
      markdown:
        "[내부 자료]와 [관련 자료는 아래 이동 버튼을 확인해 주세요]\n문의는 sworksong@gmail.com으로 해 주세요.\n마지막 문단입니다.",
      actions: [],
    },
  ]);
  assert.equal(capturedPrompt.includes("profile.md"), false);
  assert.equal(capturedPrompt.includes("내부 섹션: 경력"), false);
  assert.match(capturedPrompt, /공개 제목: 공개 프로필/);
  assert.equal(calls, 1);

  const cached = await postStream(api.url);
  assert.equal(cached.events[0].event, "meta");
  assert.equal(cached.events[0].data.cached, true);
  assert.equal(cached.events.at(-1).event, "done");
  assert.equal(cached.events.at(-1).data.cached, true);
  assert.equal(calls, 1);
});

test("newline 없는 답변도 upstream 완료 전에 단어 단위 delta를 전달한다", async (t) => {
  const knowledgeDir = await fixture(t);
  let releaseUpstream;
  const upstreamGate = new Promise((resolve) => {
    releaseUpstream = resolve;
  });
  let upstreamCompleted = false;
  const handler = await createApp({
    config: baseConfig,
    knowledgeDir,
    upstreamClient: {
      async *chatStream() {
        yield "첫 번째 안전한 델타 ";
        await upstreamGate;
        yield "두 번째 안전한 델타 ";
        yield "세 번째 안전한 델타";
        upstreamCompleted = true;
      },
      async chat() {
        throw new Error("unused");
      },
    },
  });
  const api = await listen(handler);
  t.after(api.close);

  const response = await fetch(`${api.url}/api/chat/stream`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: "지연 없이 설명해 주세요." }),
  });
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let wire = "";
  try {
    while (!wire.includes("event: delta")) {
      const next = await Promise.race([
        reader.read(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("첫 delta가 upstream 완료 전에 도착하지 않음")), 1_000),
        ),
      ]);
      assert.equal(next.done, false);
      wire += decoder.decode(next.value, { stream: true });
    }
    assert.equal(upstreamCompleted, false);
  } finally {
    releaseUpstream();
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    wire += decoder.decode(value, { stream: true });
  }
  wire += decoder.decode();
  const events = parseSse(wire);
  assert.ok(events.filter(({ event }) => event === "delta").length >= 2);
  assert.equal(events.at(-1).event, "done");
});

test("stream delta와 done 및 JSON에서 path, chunk, raw source, malformed marker를 제거한다", async (t) => {
  const knowledgeDir = await fixture(t);
  const longFilename = `${"very_long_private_filename_".repeat(6)}secret.md`;
  const longToken = "LONG_NO_WHITESPACE_SECRET_".repeat(12);
  const streamChunks = [
    "공개된 정상 문단입니다.\n[[act",
    String.raw`ion:resume]]` + "\n" + String.raw`C:\sec`,
    "ret\\x.txt\n/abso",
    "lute/path\nprojects/pri",
    "vate.md\nnested/deep/pri",
    "vate-config.json\nchunk-pro",
    "file-001\n[[action:not_",
    "allowed]]\n[[action:../",
    "../secret]]\n[[ ACTION : res",
    "ume ]]\n[[Action:resume]]\nhtt",
    "ps://evil.example/private\n[출처: pro",
    "file.md > 경력]\nsour",
    "ce: projects/private",
    `.md\n${longFilename.slice(0, 70)}`,
    `${longFilename.slice(70)}\n${longToken.slice(0, 120)}`,
    `${longToken.slice(120)}\n마지막 공개 문장입니다.`,
  ];
  const rawAnswer = streamChunks.join("");
  const handler = await createApp({
    config: baseConfig,
    knowledgeDir,
    upstreamClient: {
      async *chatStream() {
        for (const chunk of streamChunks) {
          yield chunk;
        }
      },
      async chat() {
        return rawAnswer;
      },
    },
  });
  const api = await listen(handler);
  t.after(api.close);

  const streamed = await postStream(api.url, { message: "Node.js 백엔드 stream 보안 검증" });
  const deltaText = streamed.events
    .filter(({ event }) => event === "delta")
    .map(({ data }) => data.text)
    .join("");
  const done = streamed.events.at(-1).data;
  const jsonResponse = await fetch(`${api.url}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: "Node.js 백엔드 JSON 보안 검증" }),
  });
  const jsonPayload = await jsonResponse.json();

  const forbidden =
    /C:\\|secret|\/absolute\/path|projects|nested\/deep|very_long_private_filename|LONG_NO_WHITESPACE|chunk-profile-001|\[\[|not_allowed|\.\.\/|https?:\/\/|evil\.example|profile\.md|private\.md|경력\]|\bsource\s*:|\bACTION\b|\bAction\b/iu;
  assert.equal(forbidden.test(deltaText), false);
  assert.equal(forbidden.test(JSON.stringify(done)), false);
  assert.equal(forbidden.test(JSON.stringify(jsonPayload)), false);
  assert.match(deltaText, /\[내부 자료\]/u);
  assert.deepEqual(done.segments[0], {
    markdown: "공개된 정상 문단입니다.",
    actions: [{ id: "resume", label: "경력·기술 보기" }],
  });
  assert.deepEqual(jsonPayload.segments[0], done.segments[0]);
  assert.deepEqual(done.actions, [{ id: "resume", label: "경력·기술 보기" }]);
});

test("미구성과 초기 upstream 장애도 meta-delta-done fallback 계약을 사용한다", async (t) => {
  const knowledgeDir = await fixture(t);
  const unconfiguredHandler = await createApp({
    config: { ...baseConfig, baseUrl: "", model: "" },
    knowledgeDir,
    upstreamClient: { chat: async () => "unused", chatStream: async function* () {} },
  });
  const offlineApi = await listen(unconfiguredHandler);
  const offline = await postStream(offlineApi.url);
  await offlineApi.close();
  assert.deepEqual(
    offline.events.map(({ event }) => event),
    ["meta", "delta", "done"],
  );
  assert.equal(offline.events[0].data.mode, "retrieval_fallback");
  assert.equal(offline.events[1].data.text, OFFLINE_FALLBACK_ANSWER);
  assert.equal(offline.events[2].data.sources.length, 0);

  let calls = 0;
  const failingHandler = await createApp({
    config: baseConfig,
    knowledgeDir,
    upstreamClient: {
      async *chatStream() {
        calls += 1;
        throw new UpstreamError("network", "SECRET upstream");
      },
      async chat() {
        throw new Error("unused");
      },
    },
  });
  const failingApi = await listen(failingHandler);
  t.after(failingApi.close);
  const first = await postStream(failingApi.url);
  const second = await postStream(failingApi.url);
  assert.deepEqual(
    first.events.map(({ event }) => event),
    ["meta", "delta", "done"],
  );
  assert.equal(first.events[0].data.mode, "retrieval_fallback");
  assert.equal(first.events[0].data.cached, false);
  assert.equal(second.events[0].data.cached, true);
  assert.equal(JSON.stringify(first.events).includes("SECRET"), false);
  assert.equal(calls, 1);
});

test("partial stream 오류는 error로 닫고 cache에 저장하지 않는다", async (t) => {
  const knowledgeDir = await fixture(t);
  let calls = 0;
  const handler = await createApp({
    config: baseConfig,
    knowledgeDir,
    upstreamClient: {
      async *chatStream() {
        calls += 1;
        if (calls === 1) {
          yield "부분 답변\n";
          throw new UpstreamError("invalid_response", "SECRET malformed");
        }
        yield "정상 완료";
      },
      async chat() {
        throw new Error("unused");
      },
    },
  });
  const api = await listen(handler);
  t.after(api.close);

  const partial = await postStream(api.url);
  assert.equal(partial.events[0].event, "meta");
  assert.ok(partial.events.slice(1, -1).every(({ event }) => event === "delta"));
  assert.equal(partial.events.at(-1).event, "error");
  assert.equal(JSON.stringify(partial.events).includes("SECRET"), false);

  const retry = await postStream(api.url);
  assert.equal(retry.events[0].event, "meta");
  assert.ok(retry.events.slice(1, -1).every(({ event }) => event === "delta"));
  assert.equal(retry.events.at(-1).event, "done");
  assert.equal(retry.events[0].data.cached, false);
  assert.equal(calls, 2);
});

test("client disconnect는 upstream을 abort하고 semaphore permit과 partial cache를 반환한다", async (t) => {
  const knowledgeDir = await fixture(t);
  let calls = 0;
  let resolveAborted;
  const aborted = new Promise((resolve) => {
    resolveAborted = resolve;
  });
  const handler = await createApp({
    config: baseConfig,
    knowledgeDir,
    upstreamClient: {
      async *chatStream(_messages, { signal }) {
        calls += 1;
        if (calls === 1) {
          yield "연결된 답변\n";
          await new Promise((resolve) => {
            signal.addEventListener("abort", resolve, { once: true });
          });
          resolveAborted();
          throw new UpstreamError("cancelled");
        }
        yield "재시도 완료";
      },
      async chat() {
        throw new Error("unused");
      },
    },
  });
  const api = await listen(handler);
  t.after(api.close);

  const controller = new AbortController();
  const response = await fetch(`${api.url}/api/chat/stream`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: "기술 경험은?" }),
    signal: controller.signal,
  });
  const reader = response.body.getReader();
  await reader.read();
  controller.abort();
  await aborted;

  const retry = await postStream(api.url);
  assert.equal(retry.events[0].data.cached, false);
  assert.equal(retry.events.at(-1).event, "done");
  assert.equal(calls, 2);
});
