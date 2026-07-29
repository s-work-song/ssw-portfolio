import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { loadConfig, parseEnv } from "../src/config.js";

test("환경 파일을 파싱하고 따옴표를 제거한다", () => {
  assert.deepEqual(parseEnv("# comment\nA=one\nB=\"two words\"\n"), {
    A: "one",
    B: "two words",
  });
});

test("OPENAI_API_KEY는 프로세스 환경이 아니라 지정된 .env에서만 읽는다", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "rag-config-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const envPath = path.join(directory, ".env");
  await writeFile(
    envPath,
    "OPENAI_API_KEY=file-secret\nPORT=9000\nTRUST_PROXY=true\nOFFLINE_FALLBACK_ENABLED=false\nRAG_RETRIEVER_MODE=hybrid\nRAG_VECTOR_STORE=orama\nRAG_EMBEDDING_MODEL_REVISION=revision-1\n",
    "utf8",
  );

  const config = await loadConfig({
    envPath,
    environment: { OPENAI_API_KEY: "process-secret", PORT: "9999" },
  });
  assert.equal(config.apiKey, "file-secret");
  assert.equal(config.port, 9000);
  assert.equal(config.trustProxy, true);
  assert.equal(config.offlineFallbackEnabled, false);
  assert.equal(config.retrieverMode, "hybrid");
  assert.equal(config.vectorStoreKind, "orama");
  assert.equal(config.embeddingModelRevision, "revision-1");

  const missing = await loadConfig({
    envPath: path.join(directory, "missing.env"),
    environment: { OPENAI_API_KEY: "process-secret" },
  });
  assert.equal(missing.apiKey, "");
  assert.equal(missing.offlineFallbackEnabled, true);
  assert.equal(missing.retrieverMode, "lexical");
  assert.equal(missing.vectorStoreKind, "memory");
  assert.equal(missing.sourceExposure, "none");
  assert.equal(missing.upstreamStatusTimeoutMs, 3_000);
  assert.equal(missing.upstreamStatusCacheTtlMs, 5_000);
});

test("명시적 opt-in에서만 OpenAI 설정의 프로세스 환경 주입을 허용한다", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "rag-config-opt-in-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const envPath = path.join(directory, ".env");
  await writeFile(
    envPath,
    "OPENAI_BASE_URL=\nOPENAI_MODEL=\nOPENAI_API_KEY=\n",
    "utf8",
  );

  const config = await loadConfig({
    envPath,
    environment: {
      ALLOW_PROCESS_OPENAI_CONFIG: "true",
      OPENAI_BASE_URL: "https://example.invalid",
      OPENAI_MODEL: "test-model",
      OPENAI_API_KEY: "process-secret",
    },
  });

  assert.equal(config.baseUrl, "https://example.invalid");
  assert.equal(config.model, "test-model");
  assert.equal(config.apiKey, "process-secret");
});

test("문서 다양성 상한은 기본으로 켜지고 범위 밖 값은 기본값으로 되돌린다", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "rag-diversity-config-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const missingEnv = path.join(directory, "missing.env");

  const defaults = await loadConfig({ envPath: missingEnv, environment: {} });
  assert.equal(defaults.diversityMaxPerSource, 2);
  assert.equal(defaults.diversityMinPromotionRatio, 0.2);

  const off = await loadConfig({
    envPath: missingEnv,
    environment: { RAG_DIVERSITY_MAX_PER_SOURCE: "0", RAG_DIVERSITY_MIN_PROMOTION_RATIO: "0" },
  });
  assert.equal(off.diversityMaxPerSource, 0);
  assert.equal(off.diversityMinPromotionRatio, 0);

  const invalid = await loadConfig({
    envPath: missingEnv,
    environment: { RAG_DIVERSITY_MAX_PER_SOURCE: "-1", RAG_DIVERSITY_MIN_PROMOTION_RATIO: "2" },
  });
  assert.equal(invalid.diversityMaxPerSource, 2);
  assert.equal(invalid.diversityMinPromotionRatio, 0.2);
});

test("knowledge 경로는 RAG_KNOWLEDGE_DIR로 덮어쓸 수 있고 기본값은 backend/../knowledge다", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "rag-knowledge-config-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const missingEnv = path.join(directory, "missing.env");

  const defaults = await loadConfig({ envPath: missingEnv, environment: {} });
  assert.equal(
    defaults.knowledgeDir,
    path.resolve(defaults.backendDir, "..", "knowledge"),
  );

  const absolute = await loadConfig({
    envPath: missingEnv,
    environment: { RAG_KNOWLEDGE_DIR: directory },
  });
  assert.equal(absolute.knowledgeDir, path.resolve(directory));

  // 상대 경로는 실행 위치가 아니라 backend/ 기준으로 해석한다.
  const relative = await loadConfig({
    envPath: missingEnv,
    environment: { RAG_KNOWLEDGE_DIR: "../ssw-portfolio-private/knowledge" },
  });
  assert.equal(
    relative.knowledgeDir,
    path.resolve(relative.backendDir, "..", "ssw-portfolio-private", "knowledge"),
  );

  // 빈 값은 미설정과 같게 다룬다.
  const blank = await loadConfig({
    envPath: missingEnv,
    environment: { RAG_KNOWLEDGE_DIR: "   " },
  });
  assert.equal(blank.knowledgeDir, defaults.knowledgeDir);
});

test("RAG source exposure는 allowlist 값만 허용하고 기본값은 none이다", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "rag-source-config-"));
  t.after(() => rm(directory, { recursive: true, force: true }));

  for (const expected of ["none", "metadata", "excerpt"]) {
    const config = await loadConfig({
      envPath: path.join(directory, "missing.env"),
      environment: { RAG_SOURCE_EXPOSURE: expected },
    });
    assert.equal(config.sourceExposure, expected);
  }

  const invalid = await loadConfig({
    envPath: path.join(directory, "missing.env"),
    environment: { RAG_SOURCE_EXPOSURE: "raw" },
  });
  assert.equal(invalid.sourceExposure, "none");
});
