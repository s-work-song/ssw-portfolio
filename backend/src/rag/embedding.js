import { createHash } from "node:crypto";
import { tokenize } from "../retriever.js";
import { normalizeVector } from "./vector-store.js";

/**
 * 다운로드 없는 학습·테스트용 임베더.
 * 토큰을 고정 차원에 hashing하므로 의미 모델은 아니지만 vector search 흐름은 재현한다.
 */
export class DeterministicEmbeddingProvider {
  constructor({ dimensions = 64, version = "v1" } = {}) {
    this.dimensions = dimensions;
    this.identity = `deterministic-hash:${dimensions}:${version}`;
  }

  embedText(text) {
    const vector = Array(this.dimensions).fill(0);
    const tokens = tokenize(text);
    if (!tokens.length) {
      // 빈 질의도 zero vector가 되지 않도록 고정 bucket을 둔다.
      vector[0] = 1;
      return vector;
    }
    for (const token of tokens) {
      const digest = createHash("sha256").update(token).digest();
      const index = digest.readUInt32BE(0) % this.dimensions;
      const sign = digest[4] % 2 === 0 ? 1 : -1;
      vector[index] += sign;
    }
    if (vector.every((value) => value === 0)) vector[0] = 1;
    return normalizeVector(vector);
  }

  async embedDocuments(texts) {
    return texts.map((text) => this.embedText(`passage: ${text}`));
  }

  async embedQuery(text) {
    // fake provider에서는 prefix 자체가 검색 신호를 오염하지 않도록 제거해 같은 토큰 공간을 쓴다.
    return this.embedText(String(text));
  }
}
