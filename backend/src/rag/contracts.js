/**
 * JavaScript에서는 인터페이스 문법이 없으므로 작은 duck-typing 계약만 둔다.
 * 구현체는 특정 라이브러리를 상속하지 않아 이후 pgvector/Qdrant 어댑터로 교체할 수 있다.
 *
 * EmbeddingProvider:
 * - identity: 캐시/인덱스 버전을 구분하는 공개 식별자
 * - dimensions: 벡터 차원
 * - embedDocuments(texts): 문서 벡터 배열
 * - embedQuery(text): 질의 벡터
 *
 * VectorStore:
 * - identity
 * - upsert(records): { id, vector, metadata } 저장
 * - search(vector, { topK, filter }): exact/근사 검색 결과
 *
 * Retriever:
 * - identity
 * - search(query, { topK }): RAG 청크 검색 결과
 *
 * FusionStrategy:
 * - identity
 * - fuse(resultLists, { topK }): 여러 검색 순위 결합
 */

function requireFunction(target, name, contractName) {
  if (typeof target?.[name] !== "function") {
    throw new TypeError(`${contractName}.${name} must be a function`);
  }
}

export function assertEmbeddingProvider(provider) {
  requireFunction(provider, "embedDocuments", "EmbeddingProvider");
  requireFunction(provider, "embedQuery", "EmbeddingProvider");
  if (!Number.isInteger(provider.dimensions) || provider.dimensions < 1) {
    throw new TypeError("EmbeddingProvider.dimensions must be a positive integer");
  }
  return provider;
}

export function assertVectorStore(store) {
  requireFunction(store, "upsert", "VectorStore");
  requireFunction(store, "search", "VectorStore");
  return store;
}

export function assertRetriever(retriever) {
  requireFunction(retriever, "search", "Retriever");
  return retriever;
}

export function assertFusionStrategy(strategy) {
  requireFunction(strategy, "fuse", "FusionStrategy");
  return strategy;
}
