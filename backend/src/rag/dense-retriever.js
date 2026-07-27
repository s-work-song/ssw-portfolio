import { assertEmbeddingProvider, assertVectorStore } from "./contracts.js";

export function chunkEmbeddingText(chunk) {
  return `${chunk.headingPath?.join(" ") ?? ""} ${chunk.question ?? ""} ${chunk.content}`.trim();
}

export class DenseRetriever {
  static async create({ chunks, embeddingProvider, vectorStore }) {
    const provider = assertEmbeddingProvider(embeddingProvider);
    const store = assertVectorStore(vectorStore);
    const vectors = await provider.embedDocuments(chunks.map(chunkEmbeddingText));
    if (vectors.length !== chunks.length) {
      throw new Error("embedding provider returned an unexpected document count");
    }
    await store.upsert(
      chunks.map((chunk, index) => ({
        id: chunk.chunkId ?? chunk.id,
        vector: vectors[index],
        metadata: chunk,
      })),
    );
    return new DenseRetriever({ embeddingProvider: provider, vectorStore: store });
  }

  constructor({ embeddingProvider, vectorStore }) {
    this.embeddingProvider = embeddingProvider;
    this.vectorStore = vectorStore;
    this.identity = `dense:${embeddingProvider.identity}:${vectorStore.identity}`;
  }

  async search(query, { topK = 5, filter } = {}) {
    const vector = await this.embeddingProvider.embedQuery(query);
    const hits = await this.vectorStore.search(vector, { topK, filter });
    return hits.map(({ metadata: chunk, score }) => ({
      id: chunk.id,
      docId: chunk.docId,
      chunkId: chunk.chunkId,
      title: chunk.title,
      type: chunk.type,
      url: chunk.url,
      source: chunk.source,
      section: chunk.section,
      kind: chunk.kind,
      score: Number(score.toFixed(6)),
      content: chunk.content,
    }));
  }
}
