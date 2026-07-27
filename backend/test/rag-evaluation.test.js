import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { loadConfig } from "../src/config.js";
import { evaluateRetriever, loadRetrievalCases } from "../src/rag/evaluation.js";

test("평가 loader는 generation/policy가 아닌 grounded retrieval case만 선택한다", async (t) => {
  // 평가 케이스도 knowledge와 같은 비공개 저장소에 나란히 둔다(<원문>/../evals).
  const { knowledgeDir } = await loadConfig();
  const casesPath = path.resolve(knowledgeDir, "..", "evals", "rag-cases.json");
  if (!existsSync(casesPath)) {
    t.skip(`평가 케이스가 없어 건너뛴다 (${casesPath})`);
    return;
  }

  const cases = await loadRetrievalCases(casesPath, {
    indexedSources: [
      "profile.md",
      "faq.md",
      "projects/ai-agent-orchestration.md",
      "projects/portfolio-rag-chatbot.md",
    ],
  });
  assert.ok(cases.length > 0);
  assert.ok(cases.every((entry) => entry.expectedSources.length > 0));
  assert.ok(cases.every((entry) => !entry.expectedSources.includes("persona.md")));
});

test("평가 runner가 Hit@K, MRR, latency를 계산한다", async () => {
  const fakeRetriever = {
    async search(query) {
      if (query === "hit-first") return [{ source: "a.md" }, { source: "b.md" }];
      if (query === "hit-second") return [{ source: "x.md" }, { source: "b.md" }];
      return [];
    },
  };
  const report = await evaluateRetriever(
    fakeRetriever,
    [
      { id: "one", query: "hit-first", expectedSources: ["a.md"] },
      { id: "two", query: "hit-second", expectedSources: ["b.md"] },
      { id: "three", query: "miss", expectedSources: ["c.md"] },
    ],
    { topK: 2 },
  );
  assert.equal(report.hitAtK, 2 / 3);
  assert.equal(report.mrr, 0.5);
  assert.ok(report.averageLatencyMs >= 0);
});
