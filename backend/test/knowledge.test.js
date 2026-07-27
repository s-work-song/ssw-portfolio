import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { loadConfig } from "../src/config.js";
import { chunkMarkdown, loadKnowledge, splitFrontmatter } from "../src/knowledge.js";

test("frontmatter index:true와 필수 metadata가 있는 문서만 색인하고 persona를 분리한다", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "rag-knowledge-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(path.join(directory, "nested"));
  await writeFile(path.join(directory, "persona.md"), "# 정책\n근거만 답하세요.", "utf8");
  await writeFile(path.join(directory, "_template.md"), "# 템플릿\n제외", "utf8");
  await writeFile(path.join(directory, "hidden.md"), "---\nindex: false\n---\n# 비공개", "utf8");
  await writeFile(path.join(directory, "missing.md"), "# 누락\n색인하면 안 됩니다.", "utf8");
  await writeFile(
    path.join(directory, "invalid.md"),
    "---\nid: invalid\ntype: profile\nindex: true\n---\n# 제목 누락",
    "utf8",
  );
  await writeFile(
    path.join(directory, "nested", "profile.md"),
    "---\nid: profile\n title: ignored\nindex: true\ntitle: 프로필\ntype: profile\n---\n# 소개\n백엔드 개발자입니다.",
    "utf8",
  );

  const result = await loadKnowledge(directory);
  assert.match(result.persona, /근거만/);
  assert.deepEqual(result.documents.map(({ source }) => source), ["nested/profile.md"]);
  assert.equal(result.chunks.length, 1);
  assert.equal(result.chunks[0].section, "소개");
  assert.equal(result.chunks[0].docId, "profile");
  assert.ok(result.diagnostics.some(({ source, reason }) => source === "missing.md" && reason === "index_not_true"));
  assert.deepEqual(
    result.diagnostics.find(({ source }) => source === "invalid.md"),
    { source: "invalid.md", valid: false, reason: "missing_metadata", missing: ["title"] },
  );
});

test("제목 경로와 FAQ Q/A 단위로 청크를 만든다", () => {
  const markdown = `# FAQ
## 기술
**Q. 어떤 기술을 쓰나요?**
A. Node.js를 씁니다.

**Q. 배포는 어떻게 하나요?**
A. Colab에 연결합니다.`;
  const chunks = chunkMarkdown(markdown, "faq.md");
  assert.equal(chunks.length, 2);
  assert.equal(chunks[0].kind, "faq");
  assert.equal(chunks[0].section, "FAQ > 기술");
  assert.equal(chunks[0].question, "어떤 기술을 쓰나요?");
  assert.match(chunks[1].answer, /Colab/);
});

test("frontmatter가 없거나 불완전하면 본문을 보존한다", () => {
  assert.equal(splitFrontmatter("# 제목").body, "# 제목");
  assert.equal(splitFrontmatter("---\nindex: false\n# 제목").body, "---\nindex: false\n# 제목");
});

test("제한된 scalar/list frontmatter와 URL 콜론을 정확히 보존한다", () => {
  const parsed = splitFrontmatter(`---
id: sample
title: "샘플 문서"
type: project
index: true
tags:
  - rag
  - "한국어 검색"
sources:
  - https://example.com/a:b?q=one
  - knowledge/profile.md
---
# 본문`);
  assert.deepEqual(parsed.attributes, {
    id: "sample",
    title: "샘플 문서",
    type: "project",
    index: true,
    tags: ["rag", "한국어 검색"],
    sources: ["https://example.com/a:b?q=one", "knowledge/profile.md"],
  });
});

test("실제 knowledge 계약으로 12개 문서를 색인하고 persona 정책을 별도 적재한다", async (t) => {
  // knowledge 원문은 비공개 저장소에 둔다. 공개 저장소만 받은 환경에서는 원문이 없으므로
  // RAG_KNOWLEDGE_DIR(또는 backend/.env)로 연결되어 있을 때만 실제 계약을 검사한다.
  const { knowledgeDir } = await loadConfig();
  if (!existsSync(knowledgeDir)) {
    t.skip(`knowledge 원문이 없어 건너뛴다 (${knowledgeDir})`);
    return;
  }

  const actual = await loadKnowledge(knowledgeDir);
  assert.deepEqual(
    actual.documents.map(({ source }) => source),
    [
      "ai-tools-and-costs.md",
      "education-and-credentials.md",
      "employment-preferences.md",
      "faq.md",
      "profile.md",
      "projects/ai-agent-orchestration.md",
      "projects/portfolio-rag-chatbot.md",
      "retrospectives/ai-orchestration.md",
      "retrospectives/career-gap-game-development.md",
      "retrospectives/health-and-workflow-transition.md",
      "retrospectives/simd-avx2-optimization.md",
      "services.md",
    ],
  );
  assert.equal(actual.documents.length, 12);
  assert.match(actual.persona, /불법 행위의 실행, 은폐 또는 탐지 회피/);
});
