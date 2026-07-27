import assert from "node:assert/strict";
import test from "node:test";
import { LexicalRetriever, tokenize } from "../src/retriever.js";

const chunks = [
  {
    id: "profile.md#1",
    docId: "profile",
    chunkId: "profile.md#1",
    title: "프로필",
    type: "profile",
    source: "profile.md",
    section: "기술",
    headingPath: ["기술"],
    kind: "section",
    content: "Spring Boot와 Vue.js로 웹 서비스를 개발했습니다.",
  },
  {
    id: "projects/agent.md#1",
    docId: "agent-project",
    chunkId: "projects/agent.md#1",
    title: "AI 에이전트",
    type: "project",
    url: "https://example.com/agent",
    source: "projects/agent.md",
    section: "AI 에이전트",
    headingPath: ["AI 에이전트"],
    kind: "section",
    content: "여러 AI 에이전트의 역할을 나누고 결과를 검증하는 오케스트레이션을 설계했습니다.",
  },
];

test("한국어 문자 n-gram과 단어 BM25로 관련 문서를 찾는다", () => {
  const retriever = new LexicalRetriever(chunks);
  const results = retriever.search("에이전트 오케스트레이션 경험", { topK: 2 });
  assert.equal(results[0].source, "projects/agent.md");
  assert.ok(results[0].score > 0);
  assert.equal(results[0].docId, "agent-project");
  assert.equal(results[0].title, "AI 에이전트");
  assert.equal(results[0].url, "https://example.com/agent");
});

test("부분 한글 표현도 문자 n-gram 토큰을 만든다", () => {
  const tokens = tokenize("오케스트레이션");
  assert.ok(tokens.includes("c2:오케"));
  assert.ok(tokens.includes("c3:오케스"));
});
