import { normalizeVector } from "./vector-store.js";

export const DEFAULT_E5_MODEL = "intfloat/multilingual-e5-small";

export class TransformersEmbeddingProvider {
  constructor({
    modelId = DEFAULT_E5_MODEL,
    revision = "main",
    dimensions = 384,
    maxLength = 512,
    cacheDir,
    localFilesOnly = false,
    dtype = "fp32",
    moduleLoader = () => import("@huggingface/transformers"),
  } = {}) {
    this.modelId = modelId;
    this.revision = revision;
    this.dimensions = dimensions;
    this.maxLength = maxLength;
    this.cacheDir = cacheDir;
    this.localFilesOnly = localFilesOnly;
    this.dtype = dtype;
    this.moduleLoader = moduleLoader;
    this.identity = `transformers-e5:${modelId}@${revision}:mean-l2:${dimensions}:v1`;
    this.extractorPromise = undefined;
  }

  async getExtractor() {
    if (!this.extractorPromise) {
      this.extractorPromise = this.moduleLoader().then(({ pipeline }) =>
        pipeline("feature-extraction", this.modelId, {
          revision: this.revision,
          dtype: this.dtype,
          cache_dir: this.cacheDir || undefined,
          local_files_only: this.localFilesOnly,
        }),
      );
    }
    return this.extractorPromise;
  }

  async embedPrefixed(texts, prefix) {
    if (!texts.length) return [];
    const extractor = await this.getExtractor();
    const output = await extractor(
      texts.map((text) => `${prefix}: ${String(text)}`),
      {
        pooling: "mean",
        normalize: true,
        truncation: true,
        max_length: this.maxLength,
      },
    );
    const rows = output.tolist();
    const matrix = Array.isArray(rows[0]) ? rows : [rows];
    return matrix.map((row) => {
      if (row.length !== this.dimensions) {
        throw new Error(
          `embedding dimension mismatch: expected ${this.dimensions}, received ${row.length}`,
        );
      }
      return normalizeVector(row);
    });
  }

  async embedDocuments(texts) {
    return this.embedPrefixed(texts, "passage");
  }

  async embedQuery(text) {
    return (await this.embedPrefixed([text], "query"))[0];
  }
}
