import assert from "node:assert/strict";
import test from "node:test";
import { DenseRetriever } from "../src/rag/dense-retriever.js";
import { DeterministicEmbeddingProvider } from "../src/rag/embedding.js";
import { ReciprocalRankFusion } from "../src/rag/fusion.js";
import {
  createRetriever,
  RetrieverInitializationError,
} from "../src/rag/factory.js";
import { MemoryVectorStore } from "../src/rag/vector-store.js";

const chunks = [
  {
    id: "agent.md#1",
    chunkId: "agent.md#1",
    docId: "agent",
    title: "AI 에이전트",
    type: "project",
    source: "agent.md",
    section: "협업",
    headingPath: ["협업"],
    kind: "section",
    content: "AI 에이전트 역할 분담과 결과 검증",
  },
  {
    id: "web.md#1",
    chunkId: "web.md#1",
    docId: "web",
    title: "웹 개발",
    type: "profile",
    source: "web.md",
    section: "기술",
    headingPath: ["기술"],
    kind: "section",
    content: "Spring과 Vue.js 웹 서비스 개발",
  },
  {
    id: "perf.md#1",
    chunkId: "perf.md#1",
    docId: "perf",
    title: "성능 연구",
    type: "project",
    source: "perf.md",
    section: "측정",
    headingPath: ["측정"],
    kind: "section",
    content: "CPU 메모리 병목 측정과 최적화",
  },
];

test("fake embedder와 MemoryVectorStore로 dense retrieval 원리를 재현한다", async () => {
  const provider = new DeterministicEmbeddingProvider({ dimensions: 96 });
  const store = new MemoryVectorStore({ dimensions: provider.dimensions });
  const retriever = await DenseRetriever.create({
    chunks,
    embeddingProvider: provider,
    vectorStore: store,
  });
  const results = await retriever.search("AI 에이전트 역할과 검증", { topK: 2 });
  assert.equal(results[0].docId, "agent");
  assert.ok(results[0].score >= results[1].score);
});

test("RRF는 점수 척도가 다른 순위를 reciprocal rank로 결합한다", () => {
  const fusion = new ReciprocalRankFusion({ rankConstant: 10 });
  const lexical = [
    { chunkId: "a", source: "a.md", score: 100 },
    { chunkId: "b", source: "b.md", score: 10 },
  ];
  const dense = [
    { chunkId: "b", source: "b.md", score: 0.99 },
    { chunkId: "c", source: "c.md", score: 0.9 },
  ];
  const results = fusion.fuse([lexical, dense], { topK: 3 });
  assert.equal(results[0].chunkId, "b");
  assert.deepEqual(
    new Set(results.map(({ chunkId }) => chunkId)),
    new Set(["a", "b", "c"]),
  );
});

test("factory가 lexical/dense/hybrid와 vector store를 독립 선택한다", async () => {
  const lexical = await createRetriever({ mode: "lexical", chunks, vectorStoreKind: "orama" });
  assert.match(lexical.identity, /^lexical:/u);

  for (const mode of ["dense", "hybrid"]) {
    const retriever = await createRetriever({
      mode,
      chunks,
      vectorStoreKind: "memory",
      embeddingProvider: new DeterministicEmbeddingProvider({ dimensions: 64 }),
    });
    const results = await retriever.search("에이전트 검증", { topK: 2 });
    assert.equal(results.length, 2);
    assert.match(retriever.identity, new RegExp(`^${mode}:`, "u"));
    assert.match(retriever.identity, /memory:cosine/);
  }

  const oramaDense = await createRetriever({
    mode: "dense",
    chunks,
    vectorStoreKind: "orama",
    embeddingProvider: new DeterministicEmbeddingProvider({ dimensions: 64 }),
  });
  assert.match(oramaDense.identity, /orama@3\.1\.18/);
  assert.equal((await oramaDense.search("에이전트", { topK: 1 })).length, 1);
});

test("dense 초기화 실패를 lexical로 조용히 바꾸지 않는다", async () => {
  const brokenProvider = {
    identity: "broken",
    dimensions: 3,
    embedDocuments: async () => {
      throw new Error("SECRET model/cache failure");
    },
    embedQuery: async () => [1, 0, 0],
  };
  await assert.rejects(
    createRetriever({
      mode: "dense",
      chunks,
      embeddingProvider: brokenProvider,
      vectorStoreKind: "memory",
    }),
    (error) =>
      error instanceof RetrieverInitializationError &&
      error.code === "dense_initialization_failed" &&
      !error.message.includes("SECRET"),
  );
});

test("알 수 없는 retriever/vector store 설정은 시작 단계에서 거절한다", async () => {
  await assert.rejects(
    createRetriever({ mode: "semantic-magic", chunks }),
    (error) =>
      error instanceof RetrieverInitializationError && error.code === "invalid_retriever_mode",
  );
  await assert.rejects(
    createRetriever({ mode: "dense", chunks, vectorStoreKind: "unknown" }),
    (error) => error instanceof RetrieverInitializationError && error.code === "invalid_vector_store",
  );
});
