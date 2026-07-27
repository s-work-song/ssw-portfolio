import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../src/config.js";
import { loadKnowledge } from "../src/knowledge.js";
import { DenseRetriever } from "../src/rag/dense-retriever.js";
import { isDiversityEnabled, withDiversity } from "../src/rag/diversity.js";
import { DeterministicEmbeddingProvider } from "../src/rag/embedding.js";
import { loadRetrievalCases, evaluateRetriever } from "../src/rag/evaluation.js";
import { HybridRetriever, ReciprocalRankFusion } from "../src/rag/fusion.js";
import { TransformersEmbeddingProvider } from "../src/rag/transformers-embedding.js";
import { createVectorStore } from "../src/rag/vector-store.js";
import { LexicalRetriever } from "../src/retriever.js";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const backendDirectory = path.resolve(scriptDirectory, "..");
const repositoryDirectory = path.resolve(backendDirectory, "..");
const real = process.argv.includes("--real");
const smoke = process.argv.includes("--smoke");
const storeArgument = process.argv.find((argument) => argument.startsWith("--store="));
const vectorStoreKind = storeArgument?.slice("--store=".length) || "memory";

const knowledge = await loadKnowledge(path.join(repositoryDirectory, "knowledge"));
let cases = await loadRetrievalCases(path.join(repositoryDirectory, "evals", "rag-cases.json"), {
  indexedSources: knowledge.documents.map((document) => document.source),
});
if (smoke) cases = cases.slice(0, 3);

const provider = real
  ? new TransformersEmbeddingProvider()
  : new DeterministicEmbeddingProvider({ dimensions: 96, version: "eval-v1" });
const store = await createVectorStore({
  kind: vectorStoreKind,
  dimensions: provider.dimensions,
});
const lexical = new LexicalRetriever(knowledge.chunks);
lexical.identity = "lexical:bm25-ko-ngram:v1";
const dense = await DenseRetriever.create({
  chunks: knowledge.chunks,
  embeddingProvider: provider,
  vectorStore: store,
});
const hybrid = new HybridRetriever({
  lexicalRetriever: lexical,
  denseRetriever: dense,
  fusionStrategy: new ReciprocalRankFusion(),
});

// 문서 상한은 backend/.env 설정을 그대로 읽어 "실제 서비스 조건" 행을 함께 낸다.
const config = await loadConfig();
const diversity = {
  maxPerSource: config.diversityMaxPerSource,
  minPromotionRatio: config.diversityMinPromotionRatio,
};

console.log(
  `retrieval eval: cases=${cases.length}, embeddings=${real ? "real-local" : "deterministic-fake"}, store=${vectorStoreKind}`,
);
console.log(
  `diversity: maxPerSource=${diversity.maxPerSource}, minPromotionRatio=${diversity.minPromotionRatio}`,
);
const keyFactCases = cases.filter((entry) => entry.keyFacts?.length).length;
console.log(
  `key-fact coverage: expected_key_facts가 있는 케이스 ${keyFactCases}/${cases.length} (없는 케이스는 분모에서 제외)`,
);
console.log("mode\tHit@5\tMRR\tKeyFact@5\tavg latency(ms)");
for (const [mode, retriever] of Object.entries({ lexical, dense, hybrid })) {
  const variants = isDiversityEnabled(diversity)
    ? [
        [mode, retriever],
        [`${mode}+cap`, withDiversity(retriever, diversity)],
      ]
    : [[mode, retriever]];
  for (const [label, candidate] of variants) {
    const report = await evaluateRetriever(candidate, cases, { topK: 5 });
    console.log(
      `${label}\t${report.hitAtK.toFixed(3)}\t${report.mrr.toFixed(3)}\t${report.keyFactCoverage.toFixed(3)}\t${report.averageLatencyMs.toFixed(2)}`,
    );
  }
}
