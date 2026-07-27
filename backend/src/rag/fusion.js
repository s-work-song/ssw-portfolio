import { assertFusionStrategy, assertRetriever } from "./contracts.js";

export class ReciprocalRankFusion {
  constructor({ rankConstant = 60, weights = [] } = {}) {
    this.rankConstant = rankConstant;
    this.weights = weights;
    this.identity = `rrf:k${rankConstant}:v1`;
  }

  fuse(resultLists, { topK = 5 } = {}) {
    const merged = new Map();
    resultLists.forEach((results, listIndex) => {
      const weight = this.weights[listIndex] ?? 1;
      results.forEach((result, resultIndex) => {
        const id = result.chunkId ?? result.id;
        const current = merged.get(id) ?? { result, score: 0 };
        current.score += weight / (this.rankConstant + resultIndex + 1);
        merged.set(id, current);
      });
    });
    return [...merged.values()]
      .sort(
        (left, right) =>
          right.score - left.score ||
          (left.result.chunkId ?? left.result.id).localeCompare(
            right.result.chunkId ?? right.result.id,
          ),
      )
      .slice(0, Math.max(0, topK))
      .map(({ result, score }) => ({ ...result, score: Number(score.toFixed(6)) }));
  }
}

export class HybridRetriever {
  constructor({ lexicalRetriever, denseRetriever, fusionStrategy = new ReciprocalRankFusion() }) {
    this.lexicalRetriever = assertRetriever(lexicalRetriever);
    this.denseRetriever = assertRetriever(denseRetriever);
    this.fusionStrategy = assertFusionStrategy(fusionStrategy);
    this.identity = `hybrid:${lexicalRetriever.identity ?? "lexical"}:${denseRetriever.identity}:${fusionStrategy.identity}`;
  }

  async search(query, { topK = 5 } = {}) {
    const candidateCount = Math.max(topK * 3, 12);
    const [lexical, dense] = await Promise.all([
      this.lexicalRetriever.search(query, { topK: candidateCount }),
      this.denseRetriever.search(query, { topK: candidateCount }),
    ]);
    return this.fusionStrategy.fuse([lexical, dense], { topK });
  }
}
