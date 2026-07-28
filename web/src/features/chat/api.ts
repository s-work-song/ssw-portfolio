import { ACTION_IDS, ACTION_LABELS, TONES } from "./constants";
import type {
  ActionId,
  ApiAudience,
  ChatAction,
  ChatRequest,
  ChatResponse,
  ChatSegment,
  PageContext,
} from "./types";

const API_AUDIENCES: readonly ApiAudience[] = [
  "default",
  "hiring",
  "developer",
  "collaboration",
  "casual",
];

const PAGE_CONTEXTS: readonly PageContext[] = [
  "default",
  "overview",
  "resume",
  "cover_letter",
  "research",
  "log",
];

const BUFFERED_STREAM_DELTA_INTERVAL_MS = 12;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isAllowed<T extends string>(
  value: unknown,
  allowlist: readonly T[],
): value is T {
  return isString(value) && allowlist.includes(value as T);
}

function parseAction(value: unknown): ChatAction | null {
  if (!isRecord(value) || !isAllowed(value.id, ACTION_IDS)) return null;
  if (!isString(value.label) || value.label !== ACTION_LABELS[value.id as ActionId]) {
    return null;
  }
  return { id: value.id as ActionId, label: value.label };
}

function parseSegment(value: unknown): ChatSegment | null {
  if (
    !isRecord(value) ||
    !isString(value.markdown) ||
    !Array.isArray(value.actions)
  ) {
    return null;
  }
  return {
    markdown: value.markdown,
    actions: value.actions
      .map(parseAction)
      .filter((action): action is ChatAction => action !== null)
      .slice(0, 2),
  };
}

function parseChatResponse(value: unknown): ChatResponse {
  if (!isRecord(value)) {
    throw new ChatApiError("서버 응답 형식을 확인할 수 없습니다.");
  }

  const {
    mode,
    status,
    generated,
    answer,
    segments,
    audience,
    tone,
    pageContext,
    sources,
    actions,
    cached,
  } = value;

  const validMode =
    mode === "model" || mode === "retrieval_fallback" ? mode : null;
  const validStatus =
    status === "online" || status === "upstream_offline" ? status : null;

  if (
    !validMode ||
    !validStatus ||
    typeof generated !== "boolean" ||
    !isString(answer) ||
    !Array.isArray(segments) ||
    !isAllowed(audience, API_AUDIENCES) ||
    !isAllowed(tone, TONES) ||
    !isAllowed(pageContext, PAGE_CONTEXTS) ||
    !Array.isArray(sources) ||
    !Array.isArray(actions) ||
    typeof cached !== "boolean" ||
    (validMode === "model" && generated !== true) ||
    (validMode === "retrieval_fallback" && generated !== false)
  ) {
    throw new ChatApiError("서버 응답 형식을 확인할 수 없습니다.");
  }

  return {
    mode: validMode,
    status: validStatus,
    generated,
    answer,
    segments: segments
      .map(parseSegment)
      .filter((segment): segment is ChatSegment => segment !== null),
    audience,
    tone,
    pageContext,
    // 공개 UI는 debug source exposure 설정과 무관하게 source를 보관하지 않는다.
    sources: [],
    actions: actions
      .map(parseAction)
      .filter((action): action is ChatAction => action !== null)
      .slice(0, 2),
    cached,
  };
}

function apiUrl(path = "/api/chat"): string {
  const baseUrl = process.env.NEXT_PUBLIC_RAG_API_BASE_URL?.trim();
  if (!baseUrl) {
    throw new ChatApiError(
      "채팅 서버 주소가 설정되지 않았습니다. 잠시 후 다시 이용해 주세요.",
    );
  }
  return `${baseUrl.replace(/\/+$/u, "")}${path}`;
}

export class ChatApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatApiError";
  }
}

export async function requestChat(
  request: ChatRequest,
  signal: AbortSignal,
): Promise<ChatResponse> {
  const endpoint = apiUrl();
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new ChatApiError(
      "채팅 서버에 연결하지 못했습니다. 네트워크를 확인하고 다시 시도해 주세요.",
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ChatApiError("채팅 서버의 응답을 읽지 못했습니다.");
  }

  if (!response.ok) {
    const message =
      isRecord(payload) && isString(payload.message)
        ? payload.message
        : "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
    throw new ChatApiError(message);
  }

  return parseChatResponse(payload);
}

export interface ChatStreamHandlers {
  onDelta: (text: string) => void;
  onMeta?: (meta: Readonly<Record<string, unknown>>) => void;
}

interface SseEvent {
  event: string;
  data: string;
}

function parseSseBlock(block: string): SseEvent | null {
  let event = "";
  const data: string[] = [];

  for (const rawLine of block.replace(/^\uFEFF/u, "").split(/\r\n|\n|\r/u)) {
    if (!rawLine || rawLine.startsWith(":")) continue;
    const separator = rawLine.indexOf(":");
    const field = separator >= 0 ? rawLine.slice(0, separator) : rawLine;
    let value = separator >= 0 ? rawLine.slice(separator + 1) : "";
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "event") event = value;
    if (field === "data") data.push(value);
  }

  if (!event && data.length === 0) return null;
  if (!event || data.length === 0) {
    throw new ChatApiError("스트리밍 응답 형식을 확인할 수 없습니다.");
  }
  return { event, data: data.join("\n") };
}

function nextSseBlock(
  buffer: string,
): { block: string; rest: string } | null {
  const boundary = /\r\n\r\n|\n\n|\r\r/u.exec(buffer);
  if (!boundary || boundary.index === undefined) return null;
  return {
    block: buffer.slice(0, boundary.index),
    rest: buffer.slice(boundary.index + boundary[0].length),
  };
}

function parseEventData(data: string): unknown {
  try {
    return JSON.parse(data);
  } catch {
    throw new ChatApiError("스트리밍 응답 데이터를 읽지 못했습니다.");
  }
}

async function errorMessageFromResponse(response: Response): Promise<string> {
  try {
    const payload: unknown = await response.json();
    if (isRecord(payload) && isString(payload.message)) return payload.message;
  } catch {
    // JSON 오류 응답이 아니면 공개용 고정 문구를 사용한다.
  }
  return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

export async function requestChatStream(
  request: ChatRequest,
  signal: AbortSignal,
  handlers: ChatStreamHandlers,
): Promise<ChatResponse> {
  let response: Response;
  try {
    response = await fetch(apiUrl("/api/chat/stream"), {
      method: "POST",
      headers: {
        accept: "text/event-stream",
        "content-type": "application/json",
      },
      body: JSON.stringify(request),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new ChatApiError(
      "채팅 서버에 연결하지 못했습니다. 네트워크를 확인하고 다시 시도해 주세요.",
    );
  }

  if (!response.ok) {
    throw new ChatApiError(await errorMessageFromResponse(response));
  }
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("text/event-stream")) {
    throw new ChatApiError("채팅 서버가 스트리밍 응답을 반환하지 않았습니다.");
  }
  if (!response.body) {
    throw new ChatApiError("채팅 서버의 스트리밍 응답을 읽지 못했습니다.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let doneResponse: ChatResponse | null = null;

  const dispatch = async (block: string) => {
    const parsed = parseSseBlock(block);
    if (!parsed) return;
    if (!["meta", "delta", "done", "error"].includes(parsed.event)) {
      throw new ChatApiError("지원하지 않는 스트리밍 이벤트를 받았습니다.");
    }
    if (doneResponse) {
      throw new ChatApiError("완료 이후 잘못된 스트리밍 이벤트를 받았습니다.");
    }

    const payload = parseEventData(parsed.data);
    if (parsed.event === "meta") {
      if (!isRecord(payload)) {
        throw new ChatApiError("스트리밍 메타데이터 형식을 확인할 수 없습니다.");
      }
      handlers.onMeta?.(payload);
      return;
    }
    if (parsed.event === "delta") {
      if (!isRecord(payload) || !isString(payload.text)) {
        throw new ChatApiError("스트리밍 본문 형식을 확인할 수 없습니다.");
      }
      handlers.onDelta(payload.text);
      // Sites나 중간 프록시가 여러 SSE 이벤트를 한 네트워크 청크로
      // 합쳐도 React가 중간 상태를 그릴 수 있도록 이벤트 루프를 양보한다.
      await new Promise<void>((resolve) => {
        setTimeout(resolve, BUFFERED_STREAM_DELTA_INTERVAL_MS);
      });
      if (signal.aborted) {
        throw new DOMException("The operation was aborted.", "AbortError");
      }
      return;
    }
    if (parsed.event === "error") {
      if (!isRecord(payload)) {
        throw new ChatApiError("스트리밍 오류 형식을 확인할 수 없습니다.");
      }
      throw new ChatApiError(
        isString(payload.message)
          ? payload.message
          : "응답 생성 중 오류가 발생했습니다.",
      );
    }
    doneResponse = parseChatResponse(payload);
  };

  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    buffer += decoder.decode(chunk.value, { stream: true });
    let next = nextSseBlock(buffer);
    while (next) {
      await dispatch(next.block);
      buffer = next.rest;
      next = nextSseBlock(buffer);
    }
  }

  buffer += decoder.decode();
  if (buffer.trim()) await dispatch(buffer);
  if (!doneResponse) {
    throw new ChatApiError("완료되지 않은 스트리밍 응답을 받았습니다.");
  }
  return doneResponse;
}
