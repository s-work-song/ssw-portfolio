import { LexicalRetriever } from "../retriever.js";
import { DenseRetriever } from "./dense-retriever.js";
import { withDiversity } from "./diversity.js";
import { DeterministicEmbeddingProvider } from "./embedding.js";
import { HybridRetriever, ReciprocalRankFusion } from "./fusion.js";
import { TransformersEmbeddingProvider } from "./transformers-embedding.js";
import { createVectorStore } from "./vector-store.js";

export const RETRIEVER_MODES = new Set(["lexical", "dense", "hybrid"]);
export const VECTOR_STORE_KINDS = new Set(["memory", "orama"]);

export class RetrieverInitializationError extends Error {
  constructor(code) {
    super("RAG retriever initialization failed");
    this.name = "RetrieverInitializationError";
    this.code = code;
  }
}

export async function createRetriever({
  mode = "lexical",
  chunks,
  vectorStoreKind = "memory",
  embeddingProvider,
  vectorStore,
  fusionStrategy,
  embeddingOptions = {},
  diversity = {},
} = {}) {
  if (!RETRIEVER_MODES.has(mode)) {
    throw new RetrieverInitializationError("invalid_retriever_mode");
  }
  if (!VECTOR_STORE_KINDS.has(vectorStoreKind)) {
    throw new RetrieverInitializationError("invalid_vector_store");
  }

  const lexical = new LexicalRetriever(chunks);
  lexical.identity = "lexical:bm25-ko-ngram:v1";
  // 문서 상한은 세 모드의 최종 순위에 공통으로 씌운다.
  // hybrid에서는 fusion 결과에만 적용되고 하위 검색기는 후보 생성기로 남는다.
  if (mode === "lexical") return withDiversity(lexical, diversity);

  try {
    const provider =
      embeddingProvider ?? new TransformersEmbeddingProvider({ ...embeddingOptions });
    const store =
      vectorStore ??
      (await createVectorStore({ kind: vectorStoreKind, dimensions: provider.dimensions }));
    const dense = await DenseRetriever.create({
      chunks,
      embeddingProvider: provider,
      vectorStore: store,
    });
    if (mode === "dense") return withDiversity(dense, diversity);
    return withDiversity(
      new HybridRetriever({
        lexicalRetriever: lexical,
        denseRetriever: dense,
        fusionStrategy: fusionStrategy ?? new ReciprocalRankFusion(),
      }),
      diversity,
    );
  } catch {
    // dense/hybrid 실패를 lexical로 조용히 바꾸면 운영자가 잘못된 모드를 알아차릴 수 없다.
    throw new RetrieverInitializationError("dense_initialization_failed");
  }
}

export function createFakeEmbeddingProvider(options) {
  return new DeterministicEmbeddingProvider(options);
}
