export function normalizeVector(vector) {
  if (!Array.isArray(vector) && !ArrayBuffer.isView(vector)) {
    throw new TypeError("vector must be an array or typed array");
  }
  const values = Array.from(vector, Number);
  if (!values.length || values.some((value) => !Number.isFinite(value))) {
    throw new TypeError("vector must contain finite numeric values");
  }
  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) throw new TypeError("zero vector cannot be normalized");
  return values.map((value) => value / magnitude);
}

export function dotProduct(left, right) {
  if (left.length !== right.length) throw new TypeError("vector dimensions must match");
  let score = 0;
  for (let index = 0; index < left.length; index += 1) score += left[index] * right[index];
  return score;
}

function validateRecord(record, dimensions) {
  if (!record || typeof record.id !== "string" || !record.id) {
    throw new TypeError("vector record id is required");
  }
  const vector = normalizeVector(record.vector);
  if (vector.length !== dimensions) {
    throw new TypeError(`expected ${dimensions} dimensions, received ${vector.length}`);
  }
  return { id: record.id, vector, metadata: structuredClone(record.metadata ?? {}) };
}

function rank(records, topK) {
  return records
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
    .slice(0, Math.max(0, topK));
}

export class MemoryVectorStore {
  constructor({ dimensions }) {
    if (!Number.isInteger(dimensions) || dimensions < 1) {
      throw new TypeError("dimensions must be a positive integer");
    }
    this.dimensions = dimensions;
    this.identity = `memory:cosine:${dimensions}:v1`;
    this.records = new Map();
  }

  async upsert(records) {
    for (const input of records) {
      const record = validateRecord(input, this.dimensions);
      this.records.set(record.id, record);
    }
  }

  async search(vector, { topK = 5, filter } = {}) {
    if (topK <= 0 || this.records.size === 0) return [];
    const query = normalizeVector(vector);
    if (query.length !== this.dimensions) throw new TypeError("query vector dimensions must match");
    const hits = [];
    for (const record of this.records.values()) {
      if (filter && !filter(record.metadata)) continue;
      hits.push({
        id: record.id,
        score: dotProduct(query, record.vector),
        metadata: structuredClone(record.metadata),
      });
    }
    return rank(hits, topK);
  }
}

const SAFE_METADATA_KEYS = new Set([
  "id",
  "docId",
  "chunkId",
  "title",
  "type",
  "url",
  "source",
  "section",
  "headingPath",
  "kind",
  "question",
  "answer",
  "content",
  "group",
]);

function safeMetadata(metadata) {
  return Object.fromEntries(
    Object.entries(metadata ?? {})
      .filter(([key]) => SAFE_METADATA_KEYS.has(key))
      .map(([key, value]) => [key, structuredClone(value)]),
  );
}

export class OramaVectorStore {
  constructor({ dimensions, orama, moduleLoader = () => import("@orama/orama") }) {
    if (!Number.isInteger(dimensions) || dimensions < 1) {
      throw new TypeError("dimensions must be a positive integer");
    }
    this.dimensions = dimensions;
    this.identity = `orama@3.1.18:vector:${dimensions}:v1`;
    this.orama = orama;
    this.moduleLoader = moduleLoader;
    this.records = new Map();
    this.database = undefined;
  }

  async upsert(records) {
    for (const input of records) {
      const record = validateRecord(input, this.dimensions);
      record.metadata = safeMetadata(record.metadata);
      this.records.set(record.id, record);
    }

    if (!this.orama) this.orama = await this.moduleLoader();
    // 학습 단계의 작은 인덱스라 upsert 시 재구축한다. 계약은 Orama API에 노출되지 않는다.
    this.database = await this.orama.create({
      schema: {
        recordId: "enum",
        metadata: "enum",
        embedding: `vector[${this.dimensions}]`,
      },
    });
    const documents = [...this.records.values()].map((record) => ({
      recordId: record.id,
      metadata: JSON.stringify(record.metadata),
      embedding: record.vector,
    }));
    if (documents.length) await this.orama.insertMultiple(this.database, documents);
  }

  async search(vector, { topK = 5, filter } = {}) {
    if (topK <= 0 || !this.database || this.records.size === 0) return [];
    const query = normalizeVector(vector);
    if (query.length !== this.dimensions) throw new TypeError("query vector dimensions must match");
    const result = await this.orama.search(this.database, {
      mode: "vector",
      vector: { value: query, property: "embedding" },
      similarity: -1,
      includeVectors: false,
      limit: this.records.size,
    });
    const hits = result.hits
      .map((hit) => {
        const metadata = JSON.parse(hit.document.metadata);
        return { id: hit.document.recordId, score: hit.score, metadata };
      })
      .filter((hit) => !filter || filter(hit.metadata));
    return rank(hits, topK);
  }
}

export async function createVectorStore({ kind = "memory", dimensions }) {
  if (kind === "memory") return new MemoryVectorStore({ dimensions });
  if (kind === "orama") return new OramaVectorStore({ dimensions });
  throw new TypeError(`unsupported vector store: ${kind}`);
}
