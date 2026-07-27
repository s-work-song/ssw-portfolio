import { DenseRetriever } from "../src/rag/dense-retriever.js";
import { DeterministicEmbeddingProvider } from "../src/rag/embedding.js";
import { MemoryVectorStore } from "../src/rag/vector-store.js";

const documents = [
  ["intro", "소개", "웹과 데스크톱 소프트웨어를 개발한 포트폴리오입니다."],
  ["agent", "AI 에이전트", "여러 AI 에이전트의 역할을 나누고 결과를 검증합니다."],
  ["performance", "성능 연구", "CPU와 메모리 병목을 측정하고 최적화합니다."],
  ["frontend", "화면 개발", "Vue.js로 웹 사용자 화면을 구현했습니다."],
].map(([id, title, content]) => ({
  id,
  chunkId: id,
  docId: id,
  title,
  type: "demo",
  source: `${id}.md`,
  section: title,
  headingPath: [title],
  kind: "section",
  content,
}));

const embeddingProvider = new DeterministicEmbeddingProvider({ dimensions: 64 });
const vectorStore = new MemoryVectorStore({ dimensions: embeddingProvider.dimensions });
const retriever = await DenseRetriever.create({ chunks: documents, embeddingProvider, vectorStore });
const query = process.argv.slice(2).join(" ") || "AI 에이전트 협업과 검증";
const results = await retriever.search(query, { topK: 3 });

console.log(`질문: ${query}`);
for (const [index, result] of results.entries()) {
  console.log(`${index + 1}. ${result.title}  score=${result.score.toFixed(4)}`);
}
console.log(`top result: ${results[0]?.title ?? "없음"}`);
