import assert from "node:assert/strict";
import test from "node:test";
import { applySourceCap, withDiversity } from "../src/rag/diversity.js";
import { createRetriever } from "../src/rag/factory.js";

function result(chunkId, source, score, type = "faq") {
  return { id: chunkId, chunkId, source, docId: source, type, score, content: chunkId };
}

test("문서 상한이 한 문서의 청크 독점을 끊고 다음 문서를 top-K에 올린다", () => {
  const candidates = [
    result("faq.md#1", "faq.md", 17.5),
    result("faq.md#2", "faq.md", 16.8),
    result("faq.md#3", "faq.md", 15.5),
    result("faq.md#4", "faq.md", 13.9),
    result("gap.md#1", "retrospectives/career-gap.md", 11.0, "retrospective"),
    result("gap.md#2", "retrospectives/career-gap.md", 10.1, "retrospective"),
  ];

  const capped = applySourceCap(candidates, { topK: 5, maxPerSource: 2 });
  assert.deepEqual(
    capped.map(({ chunkId }) => chunkId),
    ["faq.md#1", "faq.md#2", "gap.md#1", "gap.md#2", "faq.md#3"],
  );
  // 상한이 결과 개수를 줄이지는 않는다. 밀려난 청크가 남은 자리를 순서대로 되찾는다.
  assert.equal(capped.length, 5);

  // 상한을 끄면 원래 순위를 그대로 돌려준다 — faq 청크가 top-5를 독점한다.
  assert.deepEqual(
    applySourceCap(candidates, { topK: 4, maxPerSource: 0 }).map(({ source }) => source),
    Array(4).fill("faq.md"),
  );
});

test("승격 하한선 미만인 약한 청크는 빈자리를 차지하지 못한다", () => {
  const candidates = [
    result("emp.md#1", "employment.md", 21.8, "preferences"),
    result("emp.md#2", "employment.md", 9.0, "preferences"),
    result("faq.md#1", "faq.md", 2.9),
    result("faq.md#2", "faq.md", 2.8),
    result("faq.md#3", "faq.md", 2.3),
    result("noise.md#1", "noise.md", 1.4, "project"),
  ];

  // 하한선이 없으면 1위의 6%밖에 안 되는 청크가 근거 자리를 가져간다.
  assert.equal(applySourceCap(candidates, { topK: 5, maxPerSource: 2 })[4].source, "noise.md");
  // 하한선을 두면 밀려난 faq 청크가 그 자리를 되찾는다.
  const guarded = applySourceCap(candidates, {
    topK: 5,
    maxPerSource: 2,
    minPromotionRatio: 0.2,
  });
  assert.equal(guarded[4].chunkId, "faq.md#3");
  assert.equal(guarded.length, 5);
});

test("문서 상한은 검색기 구현과 무관하게 세 모드 최종 순위에 씌워진다", async () => {
  const chunks = [
    "faq.md#1",
    "faq.md#2",
    "faq.md#3",
    "faq.md#4",
    "faq.md#5",
    "faq.md#6",
  ].map((id) => ({
    id,
    chunkId: id,
    docId: "faq",
    title: "FAQ",
    type: "faq",
    source: "faq.md",
    section: "부업",
    headingPath: ["부업"],
    kind: "faq",
    question: "부업 해본 적 있나요",
    content: "공백기에 부업으로 수익 활동을 했습니다.",
  }));
  chunks.push({
    id: "gap.md#1",
    chunkId: "gap.md#1",
    docId: "career-gap",
    title: "경력 공백기",
    type: "retrospective",
    source: "retrospectives/career-gap.md",
    section: "부업",
    headingPath: ["부업"],
    kind: "section",
    content: "공백기에 부업으로 수익 활동을 했습니다.",
  });

  const plain = await createRetriever({ mode: "lexical", chunks });
  const plainSources = new Set(
    (await plain.search("부업 해본 적 있나요", { topK: 5 })).map(({ source }) => source),
  );
  assert.deepEqual([...plainSources], ["faq.md"]);

  const capped = await createRetriever({
    mode: "lexical",
    chunks,
    diversity: { maxPerSource: 2 },
  });
  const results = await capped.search("부업 해본 적 있나요", { topK: 5 });
  assert.equal(results.length, 5);
  assert.ok(results.some(({ source }) => source === "retrospectives/career-gap.md"));
  assert.match(capped.identity, /^lexical:.*\+cap2:v1$/u);

  // 상한을 끄면 검색기를 감싸지 않는다 (identity와 응답이 그대로).
  const off = withDiversity(plain, { maxPerSource: 0 });
  assert.equal(off, plain);
});
