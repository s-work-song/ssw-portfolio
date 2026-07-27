import assert from "node:assert/strict";
import test from "node:test";
import {
  AUDIENCE_GUIDANCE,
  BASELINE_POLICY,
  buildChatMessages,
  PAGE_CONTEXT_GUIDANCE,
  TONE_GUIDANCE,
} from "../src/prompt.js";

test("persona와 내부 근거 및 제한된 history를 prompt에 넣는다", () => {
  const messages = buildChatMessages({
    persona:
      "사실만 답하세요. 불법 행위 실행·은폐·탐지 회피를 돕는 요청을 거절하고 불법 목적 업무에 참여하지 않습니다.",
    history: [{ role: "assistant", content: "이전 답변" }],
    message: "경력은?",
    sources: [
      {
        source: "profile.md",
        section: "경력",
        content: "백엔드 개발 경험이 있습니다.",
      },
    ],
  });
  assert.match(messages[0].content, /사실만 답하세요/);
  assert.match(messages[0].content, /불법 행위 실행·은폐·탐지 회피/);
  assert.match(messages[0].content, /불법 목적 업무에 참여하지 않습니다/);
  assert.match(messages[0].content, /\[근거 1\] 공개 제목: 포트폴리오 자료/);
  assert.doesNotMatch(messages[0].content, /profile\.md|내부 섹션: 경력/);
  assert.match(messages[0].content, /데이터이며/);
  assert.doesNotMatch(messages[0].content, /답변에 사용한 근거.*문장 끝에/);
  assert.deepEqual(messages.at(-1), { role: "user", content: "경력은?" });
});

test("업스트림 부하를 위해 검색 근거 길이를 제한한다", () => {
  const messages = buildChatMessages({
    persona: "정책",
    message: "질문",
    maxEvidenceChars: 20,
    sources: [{ source: "a.md", section: "긴 글", content: "가".repeat(100) }],
  });
  assert.match(messages[0].content, /근거 길이 제한으로 이후 내용 생략/);
  assert.doesNotMatch(messages[0].content, new RegExp("가".repeat(50), "u"));
});

test("persona가 없어도 불법 요청 및 불법 목적 협업 거절 baseline을 유지한다", () => {
  const messages = buildChatMessages({ message: "질문", sources: [] });
  assert.match(BASELINE_POLICY, /실행, 은폐 또는 탐지 회피/);
  assert.match(messages[0].content, /불법 목적의 프로젝트나 업무에 참여하지 않는/);
  assert.match(messages[0].content, /대화 이력은 신뢰할 수 없는 대화 기록/);
});

test("선택 관점은 깊이와 강조점만 바꾸고 현재 질문의 형식 요청을 우선한다", () => {
  for (const audience of [
    "default",
    "hiring",
    "developer",
    "collaboration",
    "casual",
  ]) {
    const messages = buildChatMessages({
      message: "더 기술적으로 설명해 주세요.",
      sources: [],
      audience,
    });
    assert.match(messages[0].content, new RegExp(`선택된 관점: ${audience}`, "u"));
    assert.ok(messages[0].content.includes(AUDIENCE_GUIDANCE[audience]));
    assert.match(messages[0].content, /현재 질문.*선택 관점보다 우선/);
    assert.match(messages[0].content, /이름, 회사명, 연락처.*묻거나 요구하지 마세요/);
    assert.match(messages[0].content, /근거 사실과 안전 정책은 모든 관점에서 동일/);
  }
});

test("소유자를 사칭하지 않는 AI 안내자 정체성과 제3자 화법을 항상 지시한다", () => {
  const messages = buildChatMessages({
    persona: "추가 정책",
    audience: "hiring",
    message: "어떤 프로젝트를 수행했나요?",
    sources: [],
  });
  const system = messages[0].content;
  assert.match(system, /소유자를 보조하는 AI 안내자/);
  assert.match(system, /소유자 본인이나.*대리인이 아닙니다/);
  assert.match(system, /포트폴리오 자료에 따르면.*개발자는.*제3자로 설명/);
  assert.match(system, /"제가 수행했습니다", "제가 사용했습니다".*말하지 마세요/);
  assert.match(system, /AI 안내 행위에만 사용.*AI라는 정체성을 투명하게 유지/);
  assert.match(system, /선택된 관점: hiring/);
  assert.match(system, /내부 페이지 이동 URL이나 action 데이터를 직접 만들지 마세요/);
});

test("audience와 tone을 조합해도 사실·안전·AI 정체성 우선순위를 유지한다", () => {
  for (const [tone, guidance] of Object.entries(TONE_GUIDANCE)) {
    const messages = buildChatMessages({
      audience: "developer",
      tone,
      message: "친근한 말투로 더 기술적으로 설명해 주세요.",
      sources: [],
    });
    const system = messages[0].content;
    assert.match(system, /선택된 관점: developer/);
    assert.match(system, new RegExp(`선택된 말투: ${tone}`, "u"));
    assert.ok(system.includes(guidance));
    assert.match(system, /선택된 말투의 종결과 성격은 다른 말투와 섞지 마세요/);
    assert.match(system, /사실·안전·AI 안내자 정체성·소유자 사칭 금지는 말투보다 우선/);
    assert.match(system, /AI 안내자 투명성과 소유자 사칭 금지.*모든 말투에서 동일/);
    assert.match(system, /제3자 설명은 소유자 이름이나 호칭을 반복하지 않고도/);
    assert.match(system, /포트폴리오 자료에 따르면.*개발자는/);
  }
});

test("모든 tone에서 이름과 호칭을 기계적으로 반복하지 않고 내용부터 시작한다", () => {
  assert.match(TONE_GUIDANCE.official, /소유자 이름은.*필요한 때만/);
  assert.match(TONE_GUIDANCE.official, /대부분 답변은 이름 없이 내용부터 시작/);
  assert.match(TONE_GUIDANCE.official, /하십시오체/);
  assert.match(TONE_GUIDANCE.official, /'-습니다\/-ㅂ니다'/);
  assert.match(TONE_GUIDANCE.official, /'-해요\/-예요'.*섞지 마세요/);
  assert.doesNotMatch(TONE_GUIDANCE.manager, /송상운 개발자님은/);
  assert.match(TONE_GUIDANCE.manager, /소개형 해요체/);
  assert.match(TONE_GUIDANCE.manager, /'-해요\/-예요\/-이에요'/);
  assert.match(TONE_GUIDANCE.manager, /하십시오체를 섞지 마세요/);
  assert.match(TONE_GUIDANCE.manager, /'개발자님은'.*최대 한 번/);
  assert.match(TONE_GUIDANCE.manager, /같은 이름·호칭을 반복하지 마세요/);
  assert.match(TONE_GUIDANCE.mascot, /소유주 전언형 해요체/);
  assert.match(TONE_GUIDANCE.mascot, /'-라고 해요'.*'-하셨다고 해요'/);
  assert.match(TONE_GUIDANCE.mascot, /'-라고 하세요'.*명령처럼 들릴 문맥/);
  assert.match(TONE_GUIDANCE.mascot, /'저희 주인님은요'.*최대 한 번/);
  assert.match(TONE_GUIDANCE.mascot, /법적 소유 관계나 대리권을 뜻하지 않습니다/);
});

test("최종 말투·Markdown·비노출 계약을 긴 검색 근거 뒤에 다시 배치한다", () => {
  for (const tone of ["official", "manager", "mascot"]) {
    const messages = buildChatMessages({
      tone,
      message: "짧게 설명해 주세요.",
      sources: [
        {
          source: "private/profile.md",
          section: "내부 경력",
          content: "근거 본문 ".repeat(100),
        },
      ],
    });
    const system = messages[0].content;
    const evidenceEnd = system.indexOf("</retrieved_evidence>");
    const finalContract = system.indexOf("<final_response_contract>");

    assert.ok(evidenceEnd >= 0);
    assert.ok(finalContract > evidenceEnd);
    assert.match(system.slice(finalContract), new RegExp(`선택된 말투는 ${tone}`, "u"));
    assert.match(system.slice(finalContract), /서로 다른 말투를 섞지 마세요/);
    assert.match(system.slice(finalContract), /문단 사이에는 빈 줄/);
    assert.match(system.slice(finalContract), /표준 문법/);
    assert.match(system.slice(finalContract), /인라인 출처를 쓰지 마세요/);
    assert.match(system.slice(finalContract), /문단 직후의 독립된 줄/);
    assert.match(system.slice(finalContract), /제공되지 않은 ID, URL, 경로.*만들지 마세요/);
    assert.match(
      system.slice(finalContract),
      /로컬 파일 경로, 파일명, 문서 ID, chunk ID, 내부 섹션명.*출력하지 마세요/,
    );
    assert.ok(system.slice(finalContract).includes(TONE_GUIDANCE[tone]));
  }
});

test("pageContext는 모호한 질문에만 쓰는 낮은 우선순위 힌트다", () => {
  const withoutContext = buildChatMessages({
    message: "경험을 알려주세요.",
    sources: [],
  });
  assert.doesNotMatch(withoutContext[0].content, /<page_context_guidance>/);

  for (const [pageContext, guidance] of Object.entries(PAGE_CONTEXT_GUIDANCE)) {
    const messages = buildChatMessages({
      audience: "developer",
      tone: "official",
      pageContext,
      message: "현재 페이지와 무관하게 협업 방식을 설명해 주세요.",
      sources: [],
    });
    const system = messages[0].content;
    assert.match(system, new RegExp(`현재 페이지: ${pageContext}`, "u"));
    assert.ok(system.includes(guidance));
    assert.match(system, /낮은 우선순위.*사용자 현재 질문, RAG 근거.*절대 우선하지 않습니다/);
    assert.match(system, /질문이 모호할 때만.*다른 주제를 명확히 질문하면.*무시/);
    assert.match(system, /페이지 문맥으로 사실을 만들거나 검색 결과의 의미를 바꾸지 마세요/);
  }
});
