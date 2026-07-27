const WORD_PATTERN = /[\p{L}\p{N}]+/gu;

export function tokenize(input) {
  const normalized = String(input ?? "").normalize("NFKC").toLowerCase();
  const words = normalized.match(WORD_PATTERN) ?? [];
  const tokens = [...words.map((word) => `w:${word}`)];

  for (const word of words) {
    if (word.length < 2) continue;
    const maxGram = Math.min(3, word.length);
    for (let size = 2; size <= maxGram; size += 1) {
      for (let index = 0; index <= word.length - size; index += 1) {
        tokens.push(`c${size}:${word.slice(index, index + size)}`);
      }
    }
  }
  return tokens;
}

export class LexicalRetriever {
  constructor(chunks, { k1 = 1.4, b = 0.72 } = {}) {
    this.identity = "lexical:bm25-ko-ngram:v1";
    this.chunks = chunks;
    this.k1 = k1;
    this.b = b;
    this.documents = chunks.map((chunk) => {
      const tokens = tokenize(
        `${chunk.headingPath.join(" ")} ${chunk.question ?? ""} ${chunk.content}`,
      );
      const frequencies = new Map();
      for (const token of tokens) frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
      return { chunk, frequencies, length: tokens.length };
    });
    this.averageLength =
      this.documents.reduce((sum, document) => sum + document.length, 0) /
      Math.max(1, this.documents.length);
    this.documentFrequency = new Map();
    for (const document of this.documents) {
      for (const token of document.frequencies.keys()) {
        this.documentFrequency.set(token, (this.documentFrequency.get(token) ?? 0) + 1);
      }
    }
  }

  search(query, { topK = 5 } = {}) {
    const queryTokens = tokenize(query);
    if (!queryTokens.length || !this.documents.length) return [];
    const queryFrequency = new Map();
    for (const token of queryTokens) {
      queryFrequency.set(token, (queryFrequency.get(token) ?? 0) + 1);
    }
    const count = this.documents.length;

    return this.documents
      .map((document) => {
        let score = 0;
        for (const [token, queryCount] of queryFrequency) {
          const termFrequency = document.frequencies.get(token) ?? 0;
          if (!termFrequency) continue;
          const frequency = this.documentFrequency.get(token) ?? 0;
          const inverseFrequency = Math.log(1 + (count - frequency + 0.5) / (frequency + 0.5));
          const normalization =
            termFrequency +
            this.k1 *
              (1 - this.b + this.b * (document.length / Math.max(1, this.averageLength)));
          const tokenWeight = token.startsWith("w:") ? 1.8 : token.startsWith("c3:") ? 0.7 : 0.35;
          score +=
            inverseFrequency *
            ((termFrequency * (this.k1 + 1)) / normalization) *
            tokenWeight *
            Math.min(queryCount, 2);
        }
        return { document, score };
      })
      .filter(({ score }) => score > 0)
      .sort(
        (left, right) =>
          right.score - left.score || left.document.chunk.id.localeCompare(right.document.chunk.id),
      )
      .slice(0, Math.max(1, topK))
      .map(({ document, score }) => ({
        id: document.chunk.id,
        docId: document.chunk.docId,
        chunkId: document.chunk.chunkId,
        title: document.chunk.title,
        type: document.chunk.type,
        url: document.chunk.url,
        source: document.chunk.source,
        section: document.chunk.section,
        kind: document.chunk.kind,
        score: Number(score.toFixed(4)),
        content: document.chunk.content,
      }));
  }
}
