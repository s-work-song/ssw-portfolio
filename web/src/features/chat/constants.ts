import type {
  ActionId,
  ApiAudience,
  AudienceChoice,
  ChatAnimation,
  ChatStreamAnimation,
  PageContext,
  Tone,
} from "./types";

export const GREETING =
  "안녕하세요. 포트폴리오를 안내하는 AI 챗봇입니다. 관심 있는 주제를 선택하거나 바로 질문해 주세요.";

export const TONE_STORAGE_KEY = "portfolio-chat-tone";
export const STREAMING_STORAGE_KEY = "portfolio-chat-streaming";
export const REASONING_STORAGE_KEY = "portfolio-chat-reasoning";
export const CHAT_ANIMATION_STORAGE_KEY = "portfolio-chat-animation";

/**
 * Gemma 4 사고모드 계약은 유지하되 공개 UI에서는 당분간 숨긴다.
 * 다시 노출할 때 이 값만 켜면 설정과 채팅 퀵 토글이 함께 복구된다.
 */
export const REASONING_CONTROLS_ENABLED = false;
export const DEFAULT_REASONING_ENABLED = false;

export const TONES: readonly Tone[] = ["official", "manager", "mascot"];

export const CHAT_ANIMATIONS: readonly ChatAnimation[] = [
  "none",
  "slide",
  "jelly",
];

/** 설정을 지우거나 저장소를 쓸 수 없을 때 돌아갈 기본 연출이다. */
export const DEFAULT_CHAT_ANIMATION: ChatAnimation = "jelly";

export const CHAT_ANIMATION_OPTIONS: ReadonlyArray<{
  value: ChatAnimation;
  label: string;
}> = [
  { value: "none", label: "없음" },
  { value: "slide", label: "슬라이드" },
  { value: "jelly", label: "젤리" },
];

export const STREAM_ANIMATION_STORAGE_KEY = "portfolio-chat-stream-animation";

export const CHAT_STREAM_ANIMATIONS: readonly ChatStreamAnimation[] = [
  "none",
  "typewriter",
  "word-fade",
  "token-chunks",
  "blur-focus",
  "slide-up",
  "skeleton",
  "mask-wipe",
  "scramble",
  "letter-drop",
  "highlight-trail",
];

/** 설정을 지우거나 저장소를 쓸 수 없을 때 돌아갈 기본 연출이다. */
export const DEFAULT_CHAT_STREAM_ANIMATION: ChatStreamAnimation = "word-fade";

export const CHAT_STREAM_ANIMATION_OPTIONS: ReadonlyArray<{
  value: ChatStreamAnimation;
  label: string;
  description: string;
}> = [
  { value: "none", label: "없음", description: "도착한 그대로 표시" },
  {
    value: "typewriter",
    label: "타자기",
    description: "문장 끝에서 커서가 깜빡임",
  },
  {
    value: "word-fade",
    label: "단어 페이드",
    description: "새 단어가 부드럽게 나타남",
  },
  {
    value: "token-chunks",
    label: "토큰 청크",
    description: "방금 온 조각이 옅다가 진해짐",
  },
  {
    value: "blur-focus",
    label: "블러 포커스",
    description: "흐릿하게 왔다가 또렷해짐",
  },
  {
    value: "slide-up",
    label: "슬라이드 업",
    description: "새 단어가 아래에서 올라옴",
  },
  {
    value: "skeleton",
    label: "스켈레톤",
    description: "끝에 반짝이는 자리 표시줄",
  },
  {
    value: "mask-wipe",
    label: "마스크 와이프",
    description: "글자가 훑고 지나가듯 드러남",
  },
  {
    value: "scramble",
    label: "스크램블",
    description: "끝 글자가 뒤섞였다가 정착",
  },
  {
    value: "letter-drop",
    label: "레터 드롭",
    description: "글자가 위에서 떨어져 자리 잡음",
  },
  {
    value: "highlight-trail",
    label: "하이라이트 트레일",
    description: "방금 온 글자에 잔광이 남음",
  },
];

export const TONE_OPTIONS: ReadonlyArray<{ value: Tone; label: string }> = [
  { value: "official", label: "공식 안내자" },
  { value: "manager", label: "개발자 매니저" },
  { value: "mascot", label: "마스코트 펫" },
];

export const AUDIENCE_OPTIONS: ReadonlyArray<{
  value: AudienceChoice;
  apiValue: ApiAudience;
  label: string;
}> = [
  { value: "recruiter", apiValue: "hiring", label: "채용·평가 관점" },
  { value: "developer", apiValue: "developer", label: "개발·기술 검토" },
  {
    value: "collaboration",
    apiValue: "collaboration",
    label: "협업·의뢰 검토",
  },
  { value: "personality", apiValue: "casual", label: "성격·취미" },
  { value: "values", apiValue: "default", label: "가치관" },
  { value: "casual", apiValue: "casual", label: "가볍게 둘러보기" },
];

/** 첫 대화에서 질문 전송과 콘텐츠 이동을 함께 시작하는 바로가기다. */
export const CHAT_QUICK_START_OPTIONS: ReadonlyArray<{
  actionId: ActionId;
  audience: AudienceChoice;
  label: string;
  prompt: string;
}> = [
  {
    actionId: "project_overview",
    audience: "casual",
    label: "대표 프로젝트 보기",
    prompt: "대표 프로젝트 4개의 목적과 차이를 간단히 소개해 주세요.",
  },
  {
    actionId: "research_optimization",
    audience: "developer",
    label: "최적화 개요 보기",
    prompt:
      "성능 최적화 연구를 CPU, 메모리·파일 I/O, 직렬화·전송 관점으로 나누어 개요를 설명해 주세요.",
  },
];

export const ACTION_ROUTES: Readonly<Record<ActionId, string>> = {
  overview: "/about-me#portfolio-overview",
  resume: "/about-me/resume#resume-experience-skills",
  cover_letter: "/about-me/cover-letter#cover-letter-story",
  research: "/about-me/research#research-experiments",
  log: "/about-me/log#log-entries-heading",
  project_overview: "/about-me#featured-projects",
  project_common_infrastructure: "/about-me#project-common-infrastructure",
  project_ecommerce_demo: "/about-me#project-ecommerce-demo",
  project_game_collection: "/about-me#project-game-collection-platform",
  project_code_archive: "/about-me#project-code-archive",
  research_timeline: "/about-me/research#research-timeline",
  research_optimization: "/about-me/research#research-optimization-overview",
  research_cpu: "/about-me/research#research-cpu-simd",
  research_memory: "/about-me/research#research-memory-layout",
  research_serialization: "/about-me/research#research-serialization-packing",
  research_tools: "/about-me/research#research-tools-ai",
  log_ai_implementation_options:
    "/about-me/log#log-card-ask-ai-for-options-before-implementation",
  log_human_hallucination:
    "/about-me/log#log-card-consider-human-hallucination-before-ai-hallucination",
  log_gray_area_responsibility:
    "/about-me/log#log-card-developer-responsibility-does-not-disappear-in-gray-areas",
  log_ai_bubble_reality:
    "/about-me/log#log-card-distinguishing-ai-bubble-from-reality-is-your-responsibility",
  log_restful_rpc:
    "/about-me/log#log-card-do-not-call-restful-and-rpc-the-same",
  log_employment_contract:
    "/about-me/log#log-card-employment-contract-that-damaged-trust-from-the-start",
  log_health_long_term_asset:
    "/about-me/log#log-card-health-as-the-most-important-long-term-asset",
  log_hobby_interview:
    "/about-me/log#log-card-interview-where-i-had-to-prove-my-hobby",
  log_license:
    "/about-me/log#log-card-license-is-not-something-to-negotiate-after-success",
  log_manual_security:
    "/about-me/log#log-card-manual-work-is-not-safe-just-because-ai-has-security-risks",
  log_mutual_respect:
    "/about-me/log#log-card-mutual-respect-creates-a-virtuous-cycle-of-knowledge",
  log_radial_nerve:
    "/about-me/log#log-card-radial-nerve-palsy-and-ai-workflow",
  log_sleep_recovery:
    "/about-me/log#log-card-recovery-after-alternate-all-nighters",
  log_rules_collaboration:
    "/about-me/log#log-card-rules-need-both-compliance-and-enforceable-structure",
  log_business_integrity:
    "/about-me/log#log-card-scale-and-appearance-do-not-guarantee-business-integrity",
  log_hardware_to_software:
    "/about-me/log#log-card-why-i-started-software-development",
};

export const ACTION_LABELS: Readonly<Record<ActionId, string>> = {
  overview: "포트폴리오 개요 보기",
  resume: "경력·기술 보기",
  cover_letter: "자기소개서 보기",
  research: "연구·기술 탐구 보기",
  log: "작업 기록 보기",
  project_overview: "대표 프로젝트 보기",
  project_common_infrastructure: "공용 인프라 보기",
  project_ecommerce_demo: "이커머스 데모 보기",
  project_game_collection: "게임 모음 플랫폼 보기",
  project_code_archive: "코드 아카이브 보기",
  research_timeline: "연구 여정 보기",
  research_optimization: "최적화 개요 보기",
  research_cpu: "CPU·SIMD 연구 보기",
  research_memory: "메모리·파일 I/O 연구 보기",
  research_serialization: "직렬화·전송 연구 보기",
  research_tools: "도구·AI 연구 보기",
  log_ai_implementation_options: "AI 구현 선택지 기록 보기",
  log_human_hallucination: "사람의 환각 기록 보기",
  log_gray_area_responsibility: "회색지대 책임 기록 보기",
  log_ai_bubble_reality: "AI 거품과 실체 기록 보기",
  log_restful_rpc: "RESTful·RPC 기록 보기",
  log_employment_contract: "근로계약 신뢰 기록 보기",
  log_health_long_term_asset: "건강 장기 자산 기록 보기",
  log_hobby_interview: "취미 면접 기록 보기",
  log_license: "라이선스 기록 보기",
  log_manual_security: "AI·수작업 보안 기록 보기",
  log_mutual_respect: "지식 선순환 기록 보기",
  log_radial_nerve: "요골신경 마비 회고 보기",
  log_sleep_recovery: "격일 밤샘 회복 기록 보기",
  log_rules_collaboration: "규칙과 협업 기록 보기",
  log_business_integrity: "사업 건전성 기록 보기",
  log_hardware_to_software: "하드웨어 관심에서 소프트웨어 개발로 보기",
};

export const ACTION_IDS: readonly ActionId[] = [
  "overview",
  "resume",
  "cover_letter",
  "research",
  "log",
  "project_overview",
  "project_common_infrastructure",
  "project_ecommerce_demo",
  "project_game_collection",
  "project_code_archive",
  "research_timeline",
  "research_optimization",
  "research_cpu",
  "research_memory",
  "research_serialization",
  "research_tools",
  "log_ai_implementation_options",
  "log_human_hallucination",
  "log_gray_area_responsibility",
  "log_ai_bubble_reality",
  "log_restful_rpc",
  "log_employment_contract",
  "log_health_long_term_asset",
  "log_hobby_interview",
  "log_license",
  "log_manual_security",
  "log_mutual_respect",
  "log_radial_nerve",
  "log_sleep_recovery",
  "log_rules_collaboration",
  "log_business_integrity",
  "log_hardware_to_software",
];

export function audienceToApi(choice: AudienceChoice | null): ApiAudience {
  return (
    AUDIENCE_OPTIONS.find((option) => option.value === choice)?.apiValue ??
    "default"
  );
}

export function pageContextFromPathname(pathname: string): PageContext {
  const path = pathname.replace(/\/+$/u, "");

  if (/\/about-me\/resume$/u.test(path)) return "resume";
  if (/\/about-me\/cover-letter$/u.test(path)) return "cover_letter";
  if (/\/about-me\/research$/u.test(path)) return "research";
  if (/\/about-me\/log(?:\/.*)?$/u.test(path)) return "log";
  if (/\/about-me$/u.test(path)) return "overview";
  return "default";
}
