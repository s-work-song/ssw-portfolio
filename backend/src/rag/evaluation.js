import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";

export function normalizeExpectedSource(source) {
  return String(source).replaceAll("\\", "/").replace(/^knowledge\//u, "");
}

export async function loadRetrievalCases(filePath, { indexedSources } = {}) {
  const payload = JSON.parse(await readFile(filePath, "utf8"));
  const allowed = indexedSources ? new Set(indexedSources) : undefined;
  return (payload.cases ?? [])
    .filter(
      (entry) =>
        entry.category === "grounded" &&
        typeof entry.query === "string" &&
        Array.isArray(entry.expected_sources) &&
        entry.expected_sources.length > 0,
    )
    .map((entry) => ({
      id: entry.id,
      query: entry.query,
      expectedSources: entry.expected_sources
        .map(normalizeExpectedSource)
        .filter((source) => source !== "persona.md" && (!allowed || allowed.has(source))),
      keyFacts: normalizeKeyFacts(entry.expected_key_facts),
    }))
    .filter((entry) => entry.expectedSources.length > 0);
}

function normalizeKeyFacts(keyFacts) {
  return Array.isArray(keyFacts)
    ? keyFacts.filter((fact) => typeof fact === "string" && fact.trim())
    : [];
}

// 공백만 다른 표기를 다른 사실로 세지 않도록 양쪽의 연속 공백을 하나로 접은 뒤 부분 문자열로 본다.
function collapseWhitespace(text) {
  return String(text ?? "")
    .replace(/\s+/gu, " ")
    .trim();
}

/**
 * top-K 청크 본문에 expected_key_facts가 부분 문자열로 존재하는 비율을 센다.
 * 사실이 하나도 없는 케이스는 집계 분모에서 빼기 위해 undefined를 돌려준다.
 */
export function measureKeyFactCoverage(keyFacts, results) {
  const facts = normalizeKeyFacts(keyFacts);
  if (!facts.length) return undefined;
  const haystack = collapseWhitespace(results.map((result) => result.content ?? "").join("\n"));
  const matched = facts.filter((fact) => haystack.includes(collapseWhitespace(fact))).length;
  return { facts: facts.length, matched, ratio: matched / facts.length };
}

export async function evaluateRetriever(retriever, cases, { topK = 5 } = {}) {
  let hits = 0;
  let reciprocalRankTotal = 0;
  let latencyTotalMs = 0;
  let coverageRatioTotal = 0;
  let coverageCases = 0;
  const details = [];

  for (const entry of cases) {
    const started = performance.now();
    const results = await retriever.search(entry.query, { topK });
    const latencyMs = performance.now() - started;
    const expected = new Set(entry.expectedSources);
    const rank = results.findIndex((result) => expected.has(result.source)) + 1;
    if (rank > 0) {
      hits += 1;
      reciprocalRankTotal += 1 / rank;
    }
    latencyTotalMs += latencyMs;
    const coverage = measureKeyFactCoverage(entry.keyFacts, results);
    if (coverage) {
      coverageRatioTotal += coverage.ratio;
      coverageCases += 1;
    }
    details.push({
      id: entry.id,
      hit: rank > 0,
      reciprocalRank: rank > 0 ? 1 / rank : 0,
      latencyMs,
      topSources: results.map((result) => result.source),
      keyFacts: coverage?.facts ?? 0,
      matchedKeyFacts: coverage?.matched ?? 0,
      keyFactCoverage: coverage?.ratio ?? null,
    });
  }

  const count = cases.length;
  return {
    cases: count,
    topK,
    hitAtK: count ? hits / count : 0,
    mrr: count ? reciprocalRankTotal / count : 0,
    averageLatencyMs: count ? latencyTotalMs / count : 0,
    // expected_key_facts가 없는 케이스는 분모에서 제외한 케이스 단위 평균이다.
    keyFactCoverage: coverageCases ? coverageRatioTotal / coverageCases : 0,
    keyFactCases: coverageCases,
    details,
  };
}
