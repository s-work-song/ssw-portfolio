import { assertRetriever } from "./contracts.js";

/**
 * faq처럼 방문자 어휘로 각 주제를 훑는 파생 문서는 Q&A마다 청크가 잘게 나뉘고
 * 질문 문장이 질의와 직결돼 BM25류 스코어에서 구조적으로 유리하다.
 * 그 결과 top-K가 한 문서의 청크로 채워지면 정본 문서가 근거에서 통째로 빠진다.
 *
 * 여기서는 검색기 구현이나 문서 타입 가중치를 건드리지 않고 최종 순위에만 개입한다.
 * 문서 타입을 보지 않으므로 faq 이외의 문서가 쏠릴 때도 같은 규칙이 적용되고,
 * lexical/dense/hybrid 어느 모드에도 같은 방식으로 씌울 수 있다.
 */

function resultId(result) {
  return String(result.chunkId ?? result.id ?? "");
}

function sourceKey(result) {
  return result.source ?? result.docId ?? resultId(result);
}

/**
 * 같은 문서에서 나온 청크를 top-K 안에서 maxPerSource개까지만 남긴다.
 *
 * minPromotionRatio는 "상한 때문에 생긴 빈자리를 아무거나로 채우지 않기" 위한 하한선이다.
 * 1위 점수의 이 비율에 못 미치는 청크는 승격 자격이 없고, 그 자리는 밀려난 청크가 되찾는다.
 * 상한이 결과 개수를 줄이지는 않는다 — 후보가 모자라면 초과분으로 원래 순서대로 되채운다.
 */
export function applySourceCap(results, { topK = 5, maxPerSource = 0, minPromotionRatio = 0 } = {}) {
  if (!(maxPerSource > 0)) return results.slice(0, topK);
  const threshold =
    minPromotionRatio > 0 ? (results[0]?.score ?? 0) * minPromotionRatio : Number.NEGATIVE_INFINITY;
  const counts = new Map();
  const kept = [];
  const overflow = [];
  for (const result of results) {
    const key = sourceKey(result);
    const used = counts.get(key) ?? 0;
    if (used < maxPerSource && result.score >= threshold) {
      counts.set(key, used + 1);
      kept.push(result);
    } else {
      overflow.push(result);
    }
  }
  return (kept.length >= topK ? kept : [...kept, ...overflow]).slice(0, topK);
}

export function isDiversityEnabled({ maxPerSource = 0 } = {}) {
  return maxPerSource > 0;
}

/**
 * 검색기를 감싸 top-K보다 넉넉히 후보를 받아 온 뒤 문서 상한을 적용한다.
 * 검색기 자체는 그대로 두므로 lexical/dense/hybrid 어디에나 같은 규칙을 씌울 수 있고,
 * hybrid의 경우 fusion이 끝난 최종 순위에만 개입한다(하위 검색기는 후보 생성기로 남는다).
 */
export class DiversityRerankingRetriever {
  constructor({
    retriever,
    maxPerSource = 0,
    minPromotionRatio = 0,
    candidateMultiplier = 4,
    minCandidates = 20,
  }) {
    this.inner = assertRetriever(retriever);
    this.maxPerSource = maxPerSource;
    this.minPromotionRatio = minPromotionRatio;
    this.candidateMultiplier = Math.max(1, candidateMultiplier);
    this.minCandidates = Math.max(1, minCandidates);
    const ratio = minPromotionRatio > 0 ? `:min${minPromotionRatio}` : "";
    this.identity = `${retriever.identity ?? "retriever"}+cap${maxPerSource}${ratio}:v1`;
  }

  async search(query, { topK = 5 } = {}) {
    const candidateCount = Math.max(topK * this.candidateMultiplier, this.minCandidates);
    const candidates = await this.inner.search(query, { topK: candidateCount });
    return applySourceCap(candidates, {
      topK,
      maxPerSource: this.maxPerSource,
      minPromotionRatio: this.minPromotionRatio,
    });
  }
}

export function withDiversity(retriever, options = {}) {
  return isDiversityEnabled(options)
    ? new DiversityRerankingRetriever({ retriever, ...options })
    : retriever;
}
