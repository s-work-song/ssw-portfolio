import assert from "node:assert/strict";
import test from "node:test";
import {
  dotProduct,
  MemoryVectorStore,
  normalizeVector,
  OramaVectorStore,
} from "../src/rag/vector-store.js";

test("벡터 정규화와 dot product는 cosine 검색의 기초 계약을 만족한다", () => {
  assert.deepEqual(normalizeVector([3, 4]), [0.6, 0.8]);
  assert.equal(dotProduct([1, 0], [0, 1]), 0);
  assert.equal(dotProduct([1, 0], [1, 0]), 1);
  assert.throws(() => normalizeVector([0, 0]), /zero vector/);
});

const vectorStoreFactories = {
  memory: async () => new MemoryVectorStore({ dimensions: 3 }),
  orama: async () => new OramaVectorStore({ dimensions: 3 }),
};

for (const [name, createStore] of Object.entries(vectorStoreFactories)) {
  test(`${name} VectorStore가 동일한 top-k/filter/empty 계약을 만족한다`, async () => {
    const empty = await createStore();
    assert.deepEqual(await empty.search([1, 0, 0], { topK: 3 }), []);

    const store = await createStore();
    await store.upsert([
      { id: "a", vector: [1, 0, 0], metadata: { group: "keep", title: "A" } },
      { id: "b", vector: [0.8, 0.2, 0], metadata: { group: "drop", title: "B" } },
      { id: "c", vector: [0, 1, 0], metadata: { group: "keep", title: "C" } },
    ]);
    const all = await store.search([1, 0, 0], { topK: 3 });
    assert.deepEqual(all.map(({ id }) => id), ["a", "b", "c"]);
    const filtered = await store.search([1, 0, 0], {
      topK: 2,
      filter: (metadata) => metadata.group === "keep",
    });
    assert.deepEqual(filtered.map(({ id }) => id), ["a", "c"]);
    assert.ok(filtered.every(({ metadata }) => metadata.group === "keep"));
  });
}

test("Memory와 Orama가 같은 fixture에서 같은 순서를 반환한다", async () => {
  const records = [
    { id: "one", vector: [1, 0, 0], metadata: { title: "one" } },
    { id: "two", vector: [0.7, 0.3, 0], metadata: { title: "two" } },
    { id: "three", vector: [0, 1, 0], metadata: { title: "three" } },
  ];
  const memory = new MemoryVectorStore({ dimensions: 3 });
  const orama = new OramaVectorStore({ dimensions: 3 });
  await memory.upsert(records);
  await orama.upsert(records);
  const memoryIds = (await memory.search([1, 0, 0], { topK: 3 })).map(({ id }) => id);
  const oramaIds = (await orama.search([1, 0, 0], { topK: 3 })).map(({ id }) => id);
  assert.deepEqual(oramaIds, memoryIds);
});
