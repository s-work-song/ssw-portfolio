export type AudienceChoice =
  | "default"
  | "recruiter"
  | "developer"
  | "collaboration"
  | "personality"
  | "values"
  | "casual";

export type ApiAudience =
  | "default"
  | "hiring"
  | "developer"
  | "collaboration"
  | "casual";

export type Tone = "official" | "manager" | "mascot";

export type ChatAvailability = "idle" | "checking" | "online" | "offline";

/** 채팅 패널이 열리고 닫힐 때 재생할 연출이다. PC 화면에만 적용된다. */
export type ChatAnimation = "none" | "slide" | "jelly";

/**
 * 스트리밍으로 도착하는 답변 텍스트에 입히는 연출이다.
 * 전체 길이를 모르는 SSE 특성상 "도착 시점" 기준으로 재생한다.
 */
export type ChatStreamAnimation =
  | "none"
  | "typewriter"
  | "word-fade"
  | "token-chunks"
  | "blur-focus"
  | "slide-up"
  | "skeleton"
  | "mask-wipe"
  | "scramble"
  | "letter-drop"
  | "highlight-trail";

export type PageContext =
  | "default"
  | "overview"
  | "resume"
  | "cover_letter"
  | "research"
  | "log";

export type ActionId =
  | "overview"
  | "resume"
  | "cover_letter"
  | "research"
  | "log";

export interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface ChatSource {
  docId: string;
  chunkId: string;
  title: string;
  source: string;
  section: string;
  score: number;
  excerpt: string;
  url: string | null;
}

export interface ChatAction {
  id: ActionId;
  label: string;
}

export interface ChatSegment {
  markdown: string;
  actions: ChatAction[];
}

export interface ChatResponse {
  mode: "model" | "retrieval_fallback";
  status: "online" | "upstream_offline";
  generated: boolean;
  answer: string;
  segments: ChatSegment[];
  audience: ApiAudience;
  tone: Tone;
  pageContext: PageContext;
  sources: ChatSource[];
  actions: ChatAction[];
  suggestedQuestions: string[];
  cached: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  kind: "greeting" | "message" | "retrieval_fallback";
  generationState?: "streaming" | "complete" | "stopped" | "failed";
  segments?: ChatSegment[];
  sources?: ChatSource[];
  actions?: ChatAction[];
  suggestedQuestions?: string[];
}

export interface ChatRequest {
  message: string;
  history: ChatHistoryItem[];
  audience: ApiAudience;
  tone: Tone;
  pageContext: PageContext;
  reasoningEnabled: boolean;
}

export interface ChatStatusResponse {
  status: "online" | "offline";
  checkedAt: string;
}
