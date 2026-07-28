"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "../../context/ThemeContext";
import { requestChat, requestChatStream, ChatApiError } from "./api";
import {
  ACTION_ROUTES,
  CHAT_ANIMATIONS,
  CHAT_ANIMATION_STORAGE_KEY,
  CHAT_STREAM_ANIMATIONS,
  DEFAULT_CHAT_ANIMATION,
  DEFAULT_CHAT_STREAM_ANIMATION,
  GREETING,
  STREAMING_STORAGE_KEY,
  STREAM_ANIMATION_STORAGE_KEY,
  TONES,
  TONE_STORAGE_KEY,
  audienceToApi,
  pageContextFromPathname,
} from "./constants";
import { ChatContext, type ChatContextValue } from "./ChatContext";
import { ChatWidget } from "./ChatWidget";
import type {
  ActionId,
  AudienceChoice,
  ChatAnimation,
  ChatHistoryItem,
  ChatMessage,
  ChatRequest,
  ChatStreamAnimation,
  Tone,
} from "./types";

const MAX_HISTORY_ITEMS = 6;
const MAX_HISTORY_CHARACTERS = 6_000;
const MOBILE_QUERY = "(max-width: 720px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const MOBILE_HISTORY_MARKER = "__portfolioChatOpen";
const MOBILE_EXIT_DURATION_MS = 260;

/**
 * PC 패널이 퇴장 연출을 끝낼 때까지 DOM을 유지할 시간이다.
 * 슬라이드는 CSS 퇴장 애니메이션 길이에 맞추고, 젤리는 스프링이 수렴하며
 * 캔버스를 정리하는 시간까지 감안해 넉넉히 잡는다.
 */
const DESKTOP_EXIT_DURATION_MS: Readonly<
  Record<Exclude<ChatAnimation, "none">, number>
> = {
  slide: 240,
  jelly: 620,
};

function initialMessages(): ChatMessage[] {
  return [
    {
      id: "chat-greeting",
      role: "assistant",
      content: GREETING,
      kind: "greeting",
    },
  ];
}

function historyFromMessages(messages: ChatMessage[]): ChatHistoryItem[] {
  const history: ChatHistoryItem[] = [];
  let characters = 0;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.kind === "greeting") continue;
    if (
      message.generationState &&
      message.generationState !== "complete"
    ) {
      continue;
    }
    if (history.length >= MAX_HISTORY_ITEMS) break;
    if (characters + message.content.length > MAX_HISTORY_CHARACTERS) break;

    characters += message.content.length;
    history.unshift({ role: message.role, content: message.content });
  }

  return history;
}

function isTone(value: string | null): value is Tone {
  return value !== null && TONES.includes(value as Tone);
}

function isChatAnimation(value: string | null): value is ChatAnimation {
  return (
    value !== null && CHAT_ANIMATIONS.includes(value as ChatAnimation)
  );
}

function isStreamAnimation(
  value: string | null,
): value is ChatStreamAnimation {
  return (
    value !== null &&
    CHAT_STREAM_ANIMATIONS.includes(value as ChatStreamAnimation)
  );
}

interface PendingRetry {
  message: string;
  history: ChatHistoryItem[];
  assistantMessageId?: string;
}

export function ChatProvider({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { motion } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [audience, setAudience] = useState<AudienceChoice | null>(null);
  const [tone, setTone] = useState<Tone>("official");
  const [streamingEnabled, setStreamingEnabledState] = useState(true);
  const [chatAnimation, setChatAnimationState] = useState<ChatAnimation>(
    DEFAULT_CHAT_ANIMATION,
  );
  const [streamAnimation, setStreamAnimationState] =
    useState<ChatStreamAnimation>(DEFAULT_CHAT_STREAM_ANIMATION);
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);
  const idRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);
  const stopRequestedRef = useRef(false);
  const retryRef = useRef<PendingRetry | null>(null);
  const mobileHistoryEntryRef = useRef(false);
  const pendingActionRouteRef = useRef<string | null>(null);
  const pendingActionAnchorRef = useRef<string | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const actionScrollFrameRef = useRef<number | null>(null);
  const actionScrollTimerRef = useRef<number | null>(null);
  const isOpenRef = useRef(false);
  const isClosingRef = useRef(false);
  const cleanupHistoryPopRef = useRef(false);
  const consumeHistoryOnCloseRef = useRef(false);

  const nextId = useCallback((prefix: string) => {
    idRef.current += 1;
    return `${prefix}-${idRef.current}`;
  }, []);

  useEffect(() => {
    let updateTimer: number | undefined;
    try {
      const storedTone = window.localStorage.getItem(TONE_STORAGE_KEY);
      if (isTone(storedTone)) {
        updateTimer = window.setTimeout(() => setTone(storedTone), 0);
      } else if (storedTone !== null) {
        window.localStorage.setItem(TONE_STORAGE_KEY, "official");
      }
    } catch {
      // 저장소를 사용할 수 없는 브라우저에서도 기본 말투로 계속 동작한다.
    }
    return () => {
      if (updateTimer !== undefined) window.clearTimeout(updateTimer);
    };
  }, []);

  useEffect(() => {
    let updateTimer: number | undefined;
    try {
      const stored = window.localStorage.getItem(STREAMING_STORAGE_KEY);
      if (stored === "true" || stored === "false") {
        updateTimer = window.setTimeout(
          () => setStreamingEnabledState(stored === "true"),
          0,
        );
      } else if (stored !== null) {
        window.localStorage.setItem(STREAMING_STORAGE_KEY, "true");
      }
    } catch {
      // 저장소를 사용할 수 없어도 안전한 기본값인 streaming ON으로 동작한다.
    }
    return () => {
      if (updateTimer !== undefined) window.clearTimeout(updateTimer);
    };
  }, []);

  useEffect(() => {
    let updateTimer: number | undefined;
    try {
      const stored = window.localStorage.getItem(CHAT_ANIMATION_STORAGE_KEY);
      if (isChatAnimation(stored)) {
        updateTimer = window.setTimeout(
          () => setChatAnimationState(stored),
          0,
        );
      } else if (stored !== null) {
        window.localStorage.setItem(
          CHAT_ANIMATION_STORAGE_KEY,
          DEFAULT_CHAT_ANIMATION,
        );
      }
    } catch {
      // 저장소를 사용할 수 없어도 기본 연출인 젤리로 계속 동작한다.
    }
    return () => {
      if (updateTimer !== undefined) window.clearTimeout(updateTimer);
    };
  }, []);

  useEffect(() => {
    let updateTimer: number | undefined;
    try {
      const stored = window.localStorage.getItem(STREAM_ANIMATION_STORAGE_KEY);
      if (isStreamAnimation(stored)) {
        updateTimer = window.setTimeout(
          () => setStreamAnimationState(stored),
          0,
        );
      } else if (stored !== null) {
        window.localStorage.setItem(
          STREAM_ANIMATION_STORAGE_KEY,
          DEFAULT_CHAT_STREAM_ANIMATION,
        );
      }
    } catch {
      // 저장소를 사용할 수 없어도 기본 연출인 단어 페이드로 계속 동작한다.
    }
    return () => {
      if (updateTimer !== undefined) window.clearTimeout(updateTimer);
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia(REDUCED_MOTION_QUERY);
    const update = () => setSystemReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
      if (actionScrollFrameRef.current !== null) {
        window.cancelAnimationFrame(actionScrollFrameRef.current);
      }
      if (actionScrollTimerRef.current !== null) {
        window.clearTimeout(actionScrollTimerRef.current);
      }
    },
    [],
  );

  const pageContext = pageContextFromPathname(pathname);

  /**
   * 모션 정책이 꺼져 있거나 시스템이 모션 줄이기를 요구하면 연출을 생략한다.
   * 설정 화면의 모션 판정과 같은 규칙을 쓰고, 두 애니메이션 설정이 함께 따른다.
   */
  const motionSuppressed =
    motion === "off" || (motion === "system" && systemReducedMotion);

  /** 패널 연출. 모바일 구간은 기존 동작을 유지하므로 이 값을 보지 않는다. */
  const effectiveChatAnimation = useMemo<ChatAnimation>(
    () => (motionSuppressed ? "none" : chatAnimation),
    [chatAnimation, motionSuppressed],
  );

  /** 응답 텍스트 연출. 텍스트 수준이라 모바일에서도 그대로 적용된다. */
  const effectiveStreamAnimation = useMemo<ChatStreamAnimation>(
    () => (motionSuppressed ? "none" : streamAnimation),
    [motionSuppressed, streamAnimation],
  );

  const scrollToPendingActionAnchor = useCallback(() => {
    const anchor = pendingActionAnchorRef.current;
    if (!anchor) return;
    if (actionScrollFrameRef.current !== null) {
      window.cancelAnimationFrame(actionScrollFrameRef.current);
    }
    if (actionScrollTimerRef.current !== null) {
      window.clearTimeout(actionScrollTimerRef.current);
    }

    const scroll = () => {
      const target = document.getElementById(anchor);
      if (!target) return;
      pendingActionAnchorRef.current = null;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      target.focus({ preventScroll: true });
    };
    actionScrollFrameRef.current = window.requestAnimationFrame(() => {
      actionScrollFrameRef.current = window.requestAnimationFrame(scroll);
    });
    actionScrollTimerRef.current = window.setTimeout(scroll, 240);
  }, []);

  const navigateToActionTarget = useCallback(
    (route: string) => {
      const hashIndex = route.indexOf("#");
      pendingActionAnchorRef.current =
        hashIndex >= 0
          ? decodeURIComponent(route.slice(hashIndex + 1))
          : null;
      router.push(route);
      scrollToPendingActionAnchor();
    },
    [router, scrollToPendingActionAnchor],
  );

  useEffect(() => {
    scrollToPendingActionAnchor();
  }, [pathname, scrollToPendingActionAnchor]);

  const open = useCallback(() => {
    if (
      isOpenRef.current ||
      isClosingRef.current ||
      cleanupHistoryPopRef.current
    ) {
      return;
    }
    if (
      window.matchMedia(MOBILE_QUERY).matches &&
      !mobileHistoryEntryRef.current
    ) {
      window.history.pushState(
        {
          ...(window.history.state ?? {}),
          [MOBILE_HISTORY_MARKER]: true,
        },
        "",
        window.location.href,
      );
      mobileHistoryEntryRef.current = true;
    }
    isOpenRef.current = true;
    setIsOpen(true);
  }, []);

  const completeCloseAnimation = useCallback(() => {
    if (!isClosingRef.current) return;
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    const consumeHistoryEntry = consumeHistoryOnCloseRef.current;
    consumeHistoryOnCloseRef.current = false;
    isOpenRef.current = false;
    isClosingRef.current = false;
    setIsOpen(false);
    setIsClosing(false);

    if (
      consumeHistoryEntry &&
      mobileHistoryEntryRef.current &&
      window.history.state?.[MOBILE_HISTORY_MARKER] === true
    ) {
      cleanupHistoryPopRef.current = true;
      window.history.back();
      return;
    }

    const pendingRoute = pendingActionRouteRef.current;
    pendingActionRouteRef.current = null;
    if (pendingRoute) navigateToActionTarget(pendingRoute);
  }, [navigateToActionTarget]);

  const beginMobileClose = useCallback(
    (consumeHistoryEntry: boolean) => {
      if (!isOpenRef.current || isClosingRef.current) return;

      consumeHistoryOnCloseRef.current = consumeHistoryEntry;
      isClosingRef.current = true;
      setIsClosing(true);
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      closeTimerRef.current = window.setTimeout(
        completeCloseAnimation,
        reducedMotion ? 0 : MOBILE_EXIT_DURATION_MS + 300,
      );
    },
    [completeCloseAnimation],
  );

  /**
   * PC 패널의 퇴장 연출이 재생되는 동안 패널 DOM을 유지한다.
   * 슬라이드는 CSS animationend가 먼저 도착해 타이머보다 빨리 마무리한다.
   */
  const beginDesktopClose = useCallback(
    (durationMs: number) => {
      if (!isOpenRef.current || isClosingRef.current) return;

      consumeHistoryOnCloseRef.current = false;
      isClosingRef.current = true;
      setIsClosing(true);
      closeTimerRef.current = window.setTimeout(
        completeCloseAnimation,
        durationMs,
      );
    },
    [completeCloseAnimation],
  );

  const close = useCallback(() => {
    pendingActionRouteRef.current = null;
    if (window.matchMedia(MOBILE_QUERY).matches) {
      beginMobileClose(true);
      return;
    }
    if (effectiveChatAnimation !== "none") {
      beginDesktopClose(DESKTOP_EXIT_DURATION_MS[effectiveChatAnimation]);
      return;
    }

    isOpenRef.current = false;
    isClosingRef.current = false;
    setIsOpen(false);
    setIsClosing(false);
  }, [beginDesktopClose, beginMobileClose, effectiveChatAnimation]);

  const toggle = useCallback(() => {
    if (isOpenRef.current) close();
    else open();
  }, [close, open]);

  useEffect(() => {
    const handlePopState = () => {
      if (cleanupHistoryPopRef.current) {
        cleanupHistoryPopRef.current = false;
        mobileHistoryEntryRef.current = false;
        const pendingRoute = pendingActionRouteRef.current;
        pendingActionRouteRef.current = null;
        if (pendingRoute) {
          window.requestAnimationFrame(() =>
            navigateToActionTarget(pendingRoute),
          );
        }
        return;
      }

      if (!mobileHistoryEntryRef.current) return;
      mobileHistoryEntryRef.current = false;
      beginMobileClose(false);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [beginMobileClose, navigateToActionTarget]);

  const performRequest = useCallback(
    async (pending: PendingRetry) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      stopRequestedRef.current = false;
      setIsLoading(true);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;
      const request: ChatRequest = {
        message: pending.message,
        history: pending.history,
        audience: audienceToApi(audience),
        tone,
        pageContext,
      };
      const shouldStream = streamingEnabled;
      let streamingMessageId: string | undefined;
      let pendingDelta = "";
      let deltaTimer: number | null = null;

      const flushDelta = () => {
        if (deltaTimer !== null) {
          window.clearTimeout(deltaTimer);
          deltaTimer = null;
        }
        const text = pendingDelta;
        pendingDelta = "";
        if (!text || !streamingMessageId) return;
        setMessages((current) =>
          current.map((chatMessage) =>
            chatMessage.id === streamingMessageId
              ? {
                  ...chatMessage,
                  content: `${chatMessage.content}${text}`,
                }
              : chatMessage,
          ),
        );
      };

      if (shouldStream) {
        streamingMessageId = nextId("assistant");
        pending.assistantMessageId = streamingMessageId;
        setMessages((current) => [
          ...current,
          {
            id: streamingMessageId as string,
            role: "assistant",
            content: "",
            kind: "message",
            generationState: "streaming",
          },
        ]);
      }

      try {
        const response = shouldStream
          ? await requestChatStream(request, controller.signal, {
              onDelta(text) {
                pendingDelta += text;
                if (deltaTimer === null) {
                  deltaTimer = window.setTimeout(flushDelta, 32);
                }
              },
            })
          : await requestChat(request, controller.signal);
        flushDelta();
        const completedMessage: ChatMessage = {
          id: streamingMessageId ?? nextId("assistant"),
          role: "assistant",
          content: response.answer,
          kind:
            response.mode === "retrieval_fallback"
              ? "retrieval_fallback"
              : "message",
          generationState: "complete",
          segments: response.segments,
          actions: response.actions,
          suggestedQuestions: response.suggestedQuestions,
        };
        setMessages((current) =>
          streamingMessageId
            ? current.map((chatMessage) =>
                chatMessage.id === streamingMessageId
                  ? completedMessage
                  : chatMessage,
              )
            : [...current, completedMessage],
        );
        retryRef.current = null;
      } catch (requestError) {
        flushDelta();
        const requestWasAborted =
          controller.signal.aborted ||
          (requestError instanceof DOMException &&
            requestError.name === "AbortError");
        if (requestWasAborted) {
          if (stopRequestedRef.current) {
            if (streamingMessageId) {
              setMessages((current) =>
                current.map((chatMessage) =>
                  chatMessage.id === streamingMessageId
                    ? { ...chatMessage, generationState: "stopped" }
                    : chatMessage,
                ),
              );
            }
            setError(
              "응답 생성이 중단되었습니다. 원하면 다시 시도할 수 있어요.",
            );
          }
          return;
        }
        if (streamingMessageId) {
          setMessages((current) =>
            current.map((chatMessage) =>
              chatMessage.id === streamingMessageId
                ? { ...chatMessage, generationState: "failed" }
                : chatMessage,
            ),
          );
        }
        retryRef.current = pending;
        setError(
          requestError instanceof ChatApiError
            ? requestError.message
            : "요청을 처리하지 못했습니다. 다시 시도해 주세요.",
        );
      } finally {
        if (deltaTimer !== null) window.clearTimeout(deltaTimer);
        if (abortRef.current === controller) abortRef.current = null;
        stopRequestedRef.current = false;
        inFlightRef.current = false;
        setIsLoading(false);
      }
    },
    [audience, nextId, pageContext, streamingEnabled, tone],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      const message = content.trim();
      if (!message || inFlightRef.current) return;

      const history = historyFromMessages(messages);
      setMessages((current) => [
        ...current,
        {
          id: nextId("user"),
          role: "user",
          content: message,
          kind: "message",
        },
      ]);
      const pending = { message, history };
      retryRef.current = pending;
      await performRequest(pending);
    },
    [messages, nextId, performRequest],
  );

  const retry = useCallback(async () => {
    if (!retryRef.current || inFlightRef.current) return;
    const pending = retryRef.current;
    if (pending.assistantMessageId) {
      setMessages((current) =>
        current.filter(({ id }) => id !== pending.assistantMessageId),
      );
      pending.assistantMessageId = undefined;
    }
    await performRequest(pending);
  }, [performRequest]);

  const stopGenerating = useCallback(() => {
    if (!inFlightRef.current || !abortRef.current) return;
    stopRequestedRef.current = true;
    abortRef.current.abort();
  }, []);

  const setStreamingEnabled = useCallback((enabled: boolean) => {
    setStreamingEnabledState(enabled);
    try {
      window.localStorage.setItem(STREAMING_STORAGE_KEY, String(enabled));
    } catch {
      // 저장 실패가 현재 브라우저 세션의 설정 변경을 막지는 않는다.
    }
  }, []);

  const setChatAnimation = useCallback((animation: ChatAnimation) => {
    if (!CHAT_ANIMATIONS.includes(animation)) return;
    setChatAnimationState(animation);
    try {
      window.localStorage.setItem(CHAT_ANIMATION_STORAGE_KEY, animation);
    } catch {
      // 저장 실패가 현재 브라우저 세션의 설정 변경을 막지는 않는다.
    }
  }, []);

  const setStreamAnimation = useCallback((animation: ChatStreamAnimation) => {
    if (!CHAT_STREAM_ANIMATIONS.includes(animation)) return;
    setStreamAnimationState(animation);
    try {
      window.localStorage.setItem(STREAM_ANIMATION_STORAGE_KEY, animation);
    } catch {
      // 저장 실패가 현재 브라우저 세션의 설정 변경을 막지는 않는다.
    }
  }, []);

  const selectTone = useCallback((nextTone: Tone) => {
    if (!TONES.includes(nextTone)) return;
    setTone(nextTone);
    try {
      window.localStorage.setItem(TONE_STORAGE_KEY, nextTone);
    } catch {
      // 저장 실패가 현재 대화의 말투 변경을 막지는 않는다.
    }
  }, []);

  const navigateAction = useCallback(
    (id: ActionId) => {
      const route = ACTION_ROUTES[id];
      if (!route) return;
      if (
        window.matchMedia(MOBILE_QUERY).matches &&
        isOpenRef.current
      ) {
        pendingActionRouteRef.current = route;
        beginMobileClose(
          mobileHistoryEntryRef.current &&
            window.history.state?.[MOBILE_HISTORY_MARKER] === true,
        );
        return;
      }
      navigateToActionTarget(route);
    },
    [beginMobileClose, navigateToActionTarget],
  );

  const value = useMemo<ChatContextValue>(
    () => ({
      isOpen,
      isClosing,
      isLoading,
      error,
      messages,
      audience,
      tone,
      streamingEnabled,
      chatAnimation,
      effectiveChatAnimation,
      streamAnimation,
      effectiveStreamAnimation,
      open,
      close,
      completeCloseAnimation,
      toggle,
      selectAudience: setAudience,
      selectTone,
      setStreamingEnabled,
      setChatAnimation,
      setStreamAnimation,
      sendMessage,
      stopGenerating,
      retry,
      navigateAction,
    }),
    [
      audience,
      chatAnimation,
      effectiveChatAnimation,
      effectiveStreamAnimation,
      error,
      isLoading,
      isOpen,
      isClosing,
      messages,
      navigateAction,
      open,
      close,
      completeCloseAnimation,
      retry,
      setChatAnimation,
      setStreamAnimation,
      setStreamingEnabled,
      selectTone,
      sendMessage,
      stopGenerating,
      streamAnimation,
      streamingEnabled,
      toggle,
      tone,
    ],
  );

  return (
    <ChatContext.Provider value={value}>
      {children}
      <ChatWidget />
    </ChatContext.Provider>
  );
}
