import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_E5_MODEL,
  TransformersEmbeddingProvider,
} from "../src/rag/transformers-embedding.js";

test("Transformers adapter가 E5 prefix, mean pooling, normalize, 384차원을 적용한다", async () => {
  const calls = [];
  const vector = Array(384).fill(0);
  vector[0] = 1;
  const moduleLoader = async () => ({
    pipeline: async (task, model, options) => {
      calls.push({ task, model, options });
      return async (texts, inferenceOptions) => {
        calls.push({ texts, inferenceOptions });
        return { tolist: () => texts.map(() => vector) };
      };
    },
  });
  const provider = new TransformersEmbeddingProvider({
    moduleLoader,
    localFilesOnly: true,
    cacheDir: "SHOULD_NOT_BE_LOGGED",
  });
  const documents = await provider.embedDocuments(["문서 하나", "문서 둘"]);
  const query = await provider.embedQuery("질문");

  assert.match(provider.identity, /intfloat\/multilingual-e5-small@main:mean-l2:384:v1/);
  assert.equal(calls[0].task, "feature-extraction");
  assert.equal(calls[0].model, DEFAULT_E5_MODEL);
  assert.equal(calls[0].options.dtype, "fp32");
  assert.deepEqual(calls[1].texts, ["passage: 문서 하나", "passage: 문서 둘"]);
  assert.deepEqual(calls[2].texts, ["query: 질문"]);
  assert.equal(calls[1].inferenceOptions.pooling, "mean");
  assert.equal(calls[1].inferenceOptions.normalize, true);
  assert.equal(calls[1].inferenceOptions.max_length, 512);
  assert.equal(documents[0].length, 384);
  assert.equal(query.length, 384);
});

test("Transformers adapter는 예상 차원이 아니면 실패한다", async () => {
  const provider = new TransformersEmbeddingProvider({
    moduleLoader: async () => ({
      pipeline: async () => async () => ({ tolist: () => [[1, 0, 0]] }),
    }),
  });
  await assert.rejects(provider.embedQuery("질문"), /dimension mismatch/);
});
