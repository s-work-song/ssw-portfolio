"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { useTheme } from "../../context/ThemeContext";
import ElasticJellyPanel from "../../lib/ElasticJellyPanel";
import {
  AUDIENCE_OPTIONS,
  REASONING_CONTROLS_ENABLED,
  TONE_OPTIONS,
} from "./constants";
import { useChat } from "./ChatContext";
import { StreamingText } from "./StreamingText";
import type { AudienceChoice, ChatMessage } from "./types";
import styles from "./ChatWidget.module.css";

const MOBILE_QUERY = "(max-width: 720px)";
const BOTTOM_PIN_THRESHOLD_PX = 64;
const KEYBOARD_SETTLE_DELAY_MS = 220;
/** 젤리 엔진이 콘텐츠 래퍼를 찾을 때 쓰는 전역 클래스명(엔진 계약)이다. */
const JELLY_CONTENT_CLASS = "chat-content-wrapper";

const AUDIENCE_PROMPTS: Readonly<Record<AudienceChoice, string>> = {
  recruiter:
    "채용·평가 관점에서 경력, 역할과 강점을 중심으로 포트폴리오를 소개해 주세요.",
  developer:
    "개발·기술 검토 관점에서 기술 스택, 구조와 검증 방식을 중심으로 소개해 주세요.",
  collaboration:
    "협업·의뢰 관점에서 맡길 수 있는 업무, 작업 방식과 결과물을 중심으로 소개해 주세요.",
  casual: "처음 방문한 사람에게 포트폴리오의 핵심만 짧게 소개해 주세요.",
  default: "포트폴리오를 간단히 소개해 주세요.",
};

interface VisualViewportMetrics {
  top: number;
  left: number;
  width: number;
  height: number;
  exitDistance: number;
}

type VisualViewportStyle = CSSProperties &
  Record<
    | "--chat-vv-top"
    | "--chat-vv-left"
    | "--chat-vv-width"
    | "--chat-vv-height"
    | "--chat-exit-distance",
    string
  >;

function summaryActionsForMessage(message: ChatMessage) {
  const segments = message.segments ?? [];
  const lastInlineActionGroup = [...segments]
    .reverse()
    .find((segment) => segment.actions.length > 0);
  const adjacentActionIds = new Set(
    lastInlineActionGroup?.actions.map((action) => action.id) ?? [],
  );
  const seen = new Set<string>();
  return (message.actions ?? []).filter((action) => {
    if (adjacentActionIds.has(action.id) || seen.has(action.id)) return false;
    seen.add(action.id);
    return true;
  });
}

function useMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isMobile;
}

function useVisualViewportStyle(
  enabled: boolean,
): VisualViewportStyle | undefined {
  const [metrics, setMetrics] = useState<VisualViewportMetrics | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let animationFrame = 0;
    let settleTimer = 0;
    const update = () => {
      const viewport = window.visualViewport;
      const top = Math.max(0, viewport?.offsetTop ?? 0);
      const left = Math.max(0, viewport?.offsetLeft ?? 0);
      const width = Math.max(1, viewport?.width ?? window.innerWidth);
      const height = Math.max(1, viewport?.height ?? window.innerHeight);
      const requiredExitDistance =
        Math.max(
          height + top,
          window.innerHeight,
          document.documentElement.clientHeight,
          window.screen?.height ?? 0,
        ) + 96;

      setMetrics((current) => {
        const next = {
          top,
          left,
          width,
          height,
          exitDistance: Math.max(
            current?.exitDistance ?? 0,
            requiredExitDistance,
          ),
        };
        return current &&
          current.top === next.top &&
          current.left === next.left &&
          current.width === next.width &&
          current.height === next.height &&
          current.exitDistance === next.exitDistance
          ? current
          : next;
      });
    };
    const scheduleUpdate = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(update);
    };
    const updateAfterKeyboardTransition = () => {
      scheduleUpdate();
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(scheduleUpdate, 180);
    };

    scheduleUpdate();
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", scheduleUpdate);
    viewport?.addEventListener("scroll", scheduleUpdate);
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("orientationchange", updateAfterKeyboardTransition);
    document.addEventListener("focusin", updateAfterKeyboardTransition);
    document.addEventListener("focusout", updateAfterKeyboardTransition);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(settleTimer);
      viewport?.removeEventListener("resize", scheduleUpdate);
      viewport?.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener(
        "orientationchange",
        updateAfterKeyboardTransition,
      );
      document.removeEventListener("focusin", updateAfterKeyboardTransition);
      document.removeEventListener("focusout", updateAfterKeyboardTransition);
    };
  }, [enabled]);

  return useMemo(() => {
    if (!enabled || !metrics) return undefined;
    return {
      "--chat-vv-top": `${metrics.top}px`,
      "--chat-vv-left": `${metrics.left}px`,
      "--chat-vv-width": `${metrics.width}px`,
      "--chat-vv-height": `${metrics.height}px`,
      "--chat-exit-distance": `${metrics.exitDistance}px`,
    };
  }, [enabled, metrics]);
}

export function ChatWidget() {
  const { fabMode, mode, setMode } = useTheme();
  const {
    isOpen,
    isClosing,
    isLoading,
    availability,
    error,
    messages,
    audience,
    tone,
    streamingEnabled,
    reasoningEnabled,
    effectiveChatAnimation,
    effectiveStreamAnimation,
    open,
    close,
    completeCloseAnimation,
    selectAudience,
    selectTone,
    setReasoningEnabled,
    refreshAvailability,
    sendMessage,
    stopGenerating,
    retry,
    navigateAction,
  } = useChat();
  const [draft, setDraft] = useState("");
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const quickMenuEnabled = fabMode === "quick-menu";
  const quickMenuVisible = quickMenuEnabled && quickMenuOpen && !isOpen;
  const isMobile = useMobileViewport();
  const visualViewportStyle = useVisualViewportStyle(isMobile);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const jellyRef = useRef<ElasticJellyPanel | null>(null);
  const wasOpenRef = useRef(false);
  const wasOpenForScrollRef = useRef(false);
  const isBottomPinnedRef = useRef(true);
  const preservePinUntilRef = useRef(0);
  const firstPinFrameRef = useRef(0);
  const secondPinFrameRef = useRef(0);
  const pinSettleTimerRef = useRef(0);
  const showOnboarding =
    availability === "online" &&
    messages.length === 1 &&
    messages[0]?.kind === "greeting" &&
    !isLoading;
  const latestSuggestionMessageId = useMemo(() => {
    if (isLoading) return null;
    const latestMessage = messages[messages.length - 1];
    return latestMessage?.role === "assistant" &&
      latestMessage.generationState === "complete" &&
      latestMessage.suggestedQuestions?.length
      ? latestMessage.id
      : null;
  }, [isLoading, messages]);

  useEffect(() => {
    if (!quickMenuVisible) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setQuickMenuOpen(false);
      }
    };
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setQuickMenuOpen(false);
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [quickMenuVisible]);

  const cancelPinnedScroll = useCallback(() => {
    window.cancelAnimationFrame(firstPinFrameRef.current);
    window.cancelAnimationFrame(secondPinFrameRef.current);
    window.clearTimeout(pinSettleTimerRef.current);
    firstPinFrameRef.current = 0;
    secondPinFrameRef.current = 0;
    pinSettleTimerRef.current = 0;
  }, []);

  const isMessageListNearBottom = useCallback(() => {
    const list = messageListRef.current;
    if (!list) return true;
    const distance = list.scrollHeight - list.scrollTop - list.clientHeight;
    return distance <= BOTTOM_PIN_THRESHOLD_PX;
  }, []);

  const schedulePinnedScroll = useCallback(() => {
    cancelPinnedScroll();
    if (!isOpen || isClosing || !isBottomPinnedRef.current) return;

    const align = () => {
      const list = messageListRef.current;
      if (!list || !isBottomPinnedRef.current) return;
      list.scrollTop = list.scrollHeight;
    };
    const alignAcrossFrames = () => {
      align();
      firstPinFrameRef.current = window.requestAnimationFrame(() => {
        align();
        secondPinFrameRef.current = window.requestAnimationFrame(align);
      });
    };

    alignAcrossFrames();
    pinSettleTimerRef.current = window.setTimeout(
      alignAcrossFrames,
      KEYBOARD_SETTLE_DELAY_MS,
    );
  }, [cancelPinnedScroll, isClosing, isOpen]);

  const handleMessageScroll = useCallback(() => {
    if (
      isBottomPinnedRef.current &&
      Date.now() < preservePinUntilRef.current
    ) {
      return;
    }
    isBottomPinnedRef.current = isMessageListNearBottom();
    if (!isBottomPinnedRef.current) cancelPinnedScroll();
  }, [cancelPinnedScroll, isMessageListNearBottom]);

  const handleInputFocus = useCallback(() => {
    // 키보드가 viewport를 줄이기 전에 사용자가 하단을 보고 있었는지 먼저 보존한다.
    isBottomPinnedRef.current = isMessageListNearBottom();
    if (isBottomPinnedRef.current) {
      preservePinUntilRef.current = Date.now() + 500;
      schedulePinnedScroll();
    }
  }, [isMessageListNearBottom, schedulePinnedScroll]);

  const handleUserScrollIntent = useCallback(() => {
    preservePinUntilRef.current = 0;
    cancelPinnedScroll();
  }, [cancelPinnedScroll]);

  const handleInputBlur = useCallback(() => {
    if (!isBottomPinnedRef.current) return;
    preservePinUntilRef.current = Date.now() + 500;
    schedulePinnedScroll();
  }, [schedulePinnedScroll]);

  useLayoutEffect(() => {
    const justOpened = isOpen && !wasOpenForScrollRef.current;
    if (justOpened) isBottomPinnedRef.current = true;
    if (isOpen && isBottomPinnedRef.current) schedulePinnedScroll();
    wasOpenForScrollRef.current = isOpen;
  }, [error, isLoading, isOpen, messages, schedulePinnedScroll]);

  useEffect(() => {
    if (!isMobile || !isOpen || isClosing) return;

    const keepPinnedDuringViewportChange = () => {
      if (!isBottomPinnedRef.current) return;
      preservePinUntilRef.current = Date.now() + 320;
      schedulePinnedScroll();
    };
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", keepPinnedDuringViewportChange);
    viewport?.addEventListener("scroll", keepPinnedDuringViewportChange);
    window.addEventListener("resize", keepPinnedDuringViewportChange);
    window.addEventListener(
      "orientationchange",
      keepPinnedDuringViewportChange,
    );

    return () => {
      viewport?.removeEventListener("resize", keepPinnedDuringViewportChange);
      viewport?.removeEventListener("scroll", keepPinnedDuringViewportChange);
      window.removeEventListener("resize", keepPinnedDuringViewportChange);
      window.removeEventListener(
        "orientationchange",
        keepPinnedDuringViewportChange,
      );
      cancelPinnedScroll();
    };
  }, [cancelPinnedScroll, isClosing, isMobile, isOpen, schedulePinnedScroll]);

  useEffect(() => {
    if (isClosing) inputRef.current?.blur();
  }, [isClosing]);

  useEffect(() => {
    if (isOpen && !isClosing && availability === "online") {
      window.requestAnimationFrame(() => inputRef.current?.focus());
    } else if (!isOpen && wasOpenRef.current) {
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }
    wasOpenRef.current = isOpen;
  }, [availability, isClosing, isOpen]);

  // 연출 옵션은 PC 패널에만 적용하고, 모바일은 기존 미디어쿼리 동작을 그대로 둔다.
  const isJelly = !isMobile && effectiveChatAnimation === "jelly";
  const isSlide = !isMobile && effectiveChatAnimation === "slide";
  // 텍스트 연출은 모바일에도 적용하되, 스트리밍이 꺼져 있으면 재생할 대상이 없다.
  const streamAnimation = streamingEnabled ? effectiveStreamAnimation : "none";

  useLayoutEffect(() => {
    if (!isOpen || !isJelly) return;

    const panel = panelRef.current;
    const trigger = triggerRef.current;
    if (!panel || !trigger) return;

    let engine: ElasticJellyPanel | null = null;
    try {
      engine = new ElasticJellyPanel(trigger, panel);
      jellyRef.current = engine;
      engine.open();
    } catch (initError) {
      console.error("젤리 패널 애니메이션을 시작하지 못했습니다.", initError);
      engine?.destroy();
      engine = null;
      jellyRef.current = null;
    }

    return () => {
      engine?.destroy();
      jellyRef.current = null;
      // 엔진이 수축을 마치기 전에 정리되면 FAB에 남는 인라인 레이어 값을 되돌린다.
      trigger.style.zIndex = "";
    };
  }, [isJelly, isOpen]);

  useEffect(() => {
    if (!isClosing) return;
    const engine = jellyRef.current;
    if (!engine) return;

    // 수축이 재생되는 동안 패널은 화면에 남지만 조작은 받지 않게 한다.
    engine.panel.style.pointerEvents = "none";
    engine.close(triggerRef.current ?? undefined);
  }, [isClosing]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || isLoading || availability !== "online") return;
    setDraft("");
    await sendMessage(message);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape" && !isMobile) {
      event.preventDefault();
      close();
      return;
    }

    if (event.key !== "Tab" || !isMobile || !panelRef.current) return;
    const focusable = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ),
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const backdropClassName = `${styles.backdrop} ${
    isClosing ? styles.backdropClosing : ""
  }`;
  const panelClassName = [
    styles.panel,
    isClosing ? styles.panelClosing : "",
    isSlide ? styles.panelSlide : "",
    isJelly ? styles.panelJelly : "",
  ]
    .filter(Boolean)
    .join(" ");
  const contentWrapperClassName = `${styles.contentWrapper}${
    isJelly ? ` ${JELLY_CONTENT_CLASS}` : ""
  }`;
  const rootClassName = `${styles.root} ${isOpen ? styles.rootOpen : ""}`;
  const nextThemeMode =
    mode === "system" ? "light" : mode === "light" ? "dark" : "system";
  const modeLabel = {
    system: "시스템",
    light: "라이트",
    dark: "다크",
  }[mode];
  const nextModeLabel = {
    system: "시스템",
    light: "라이트",
    dark: "다크",
  }[nextThemeMode];

  const openChatFromQuickMenu = () => {
    setQuickMenuOpen(false);
    open();
  };

  const cycleThemeMode = () => {
    setMode(nextThemeMode);
    setQuickMenuOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const handleTriggerClick = () => {
    if (isOpen) {
      close();
      return;
    }
    if (quickMenuEnabled) {
      setQuickMenuOpen((current) => !current);
      return;
    }
    setQuickMenuOpen(false);
    open();
  };

  return (
    <div ref={rootRef} className={rootClassName} style={visualViewportStyle}>
      {isOpen && (
        <>
          <button
            className={backdropClassName}
            type="button"
            aria-label="채팅 닫기"
            onClick={close}
          />
          <section
            id="portfolio-chat-dialog"
            ref={panelRef}
            className={panelClassName}
            role="dialog"
            aria-modal={isMobile}
            aria-labelledby="portfolio-chat-title"
            onKeyDown={handleDialogKeyDown}
            onAnimationEnd={(event) => {
              if (isClosing && event.target === event.currentTarget) {
                completeCloseAnimation();
              }
            }}
          >
            {/* 젤리 캔버스가 패널 밖까지 그려지도록 콘텐츠 클리핑은 이 래퍼가 맡는다. */}
            <div className={contentWrapperClassName}>
              <header className={styles.header}>
                <div>
                  <span className={styles.eyebrow}>PORTFOLIO AI</span>
                  <h2 id="portfolio-chat-title">포트폴리오 챗봇</h2>
                </div>
                <div className={styles.headerControls}>
                  {availability === "online" && (
                    <label>
                      <span className={styles.visuallyHidden}>말투 선택</span>
                      <select
                        value={tone}
                        onChange={(event) =>
                          selectTone(
                            event.currentTarget.value as
                              | "official"
                              | "manager"
                              | "mascot",
                          )
                        }
                        aria-label="챗봇 말투"
                      >
                        {TONE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <button
                    className={styles.close}
                    type="button"
                    onClick={close}
                    aria-label="채팅 닫기"
                  >
                    ×
                  </button>
                </div>
              </header>

              <div
                ref={messageListRef}
                className={styles.body}
                aria-live="polite"
                aria-busy={isLoading || availability === "checking"}
                onScroll={handleMessageScroll}
                onTouchStart={handleUserScrollIntent}
                onWheel={handleUserScrollIntent}
              >
                {availability === "idle" || availability === "checking" ? (
                  <section className={styles.availabilityState} role="status">
                    <span
                      className={styles.availabilitySpinner}
                      aria-hidden="true"
                    />
                    <span className={styles.availabilityEyebrow}>
                      연결 상태 확인
                    </span>
                    <h3>챗봇을 준비하고 있어요</h3>
                    <p>
                      AI 추론 서버에 연결할 수 있는지 확인한 뒤 채팅을
                      시작합니다.
                    </p>
                  </section>
                ) : availability === "offline" ? (
                  <section
                    className={styles.availabilityState}
                    role="status"
                  >
                    <span
                      className={styles.availabilityOfflineIcon}
                      aria-hidden="true"
                    >
                      !
                    </span>
                    <span className={styles.availabilityBadge}>오프라인</span>
                    <h3>현재 챗봇을 이용할 수 없습니다</h3>
                    <p className={styles.availabilityCopy}>
                      <span>AI 추론 서버가 중지되어 있습니다.</span>
                      <span>
                        포트폴리오의 다른 내용은
                        <br />
                        정상적으로 둘러볼 수 있어요.
                      </span>
                      <span>
                        실제 생성 답변 시연이 필요하면
                        <br />
                        포트폴리오에 공개된 연락처로 문의해 주세요.
                      </span>
                    </p>
                    <button
                      type="button"
                      className={styles.availabilityRetry}
                      onClick={() => void refreshAvailability()}
                    >
                      다시 확인
                    </button>
                  </section>
                ) : (
                  <div className={styles.messages}>
                  {messages.map((message) => (
                    <Fragment key={message.id}>
                      <article
                        className={`${styles.message} ${
                          message.role === "user"
                            ? styles.userMessage
                            : styles.assistantMessage
                        }`}
                      >
                      {message.kind === "retrieval_fallback" && (
                        <strong className={styles.offlineBadge}>
                          오프라인 · 생성 답변 없음
                        </strong>
                      )}
                      {message.generationState === "streaming" && (
                        <strong className={styles.generationBadge}>
                          생성 중
                        </strong>
                      )}
                      {message.generationState === "stopped" && (
                        <strong className={styles.stoppedBadge}>
                          응답 생성이 중단되었습니다
                        </strong>
                      )}
                      {message.generationState === "failed" && (
                        <strong className={styles.failedBadge}>
                          응답 생성을 완료하지 못했습니다
                        </strong>
                      )}
                      {message.role === "assistant" &&
                      message.generationState &&
                      message.generationState !== "complete" ? (
                        <p className={`${styles.messageText} ${styles.partialText}`}>
                          {message.content ? (
                            <StreamingText
                              text={message.content}
                              animation={streamAnimation}
                              isStreaming={
                                message.generationState === "streaming"
                              }
                            />
                          ) : (
                            "응답을 생성하고 있어요…"
                          )}
                        </p>
                      ) : message.role === "assistant" ? (
                        <div className={styles.answerSegments}>
                          {(message.segments?.length
                            ? message.segments
                            : [{ markdown: message.content, actions: [] }]
                          ).map((segment, segmentIndex) => (
                            <div
                              className={styles.answerSegment}
                              key={`${message.id}-segment-${segmentIndex}`}
                            >
                              <div className={styles.markdownMessage}>
                                <ReactMarkdown
                                  skipHtml
                                  components={{
                                    a: ({ children }) => <>{children}</>,
                                    img: () => null,
                                  }}
                                >
                                  {segment.markdown}
                                </ReactMarkdown>
                              </div>
                              {segment.actions.length > 0 && (
                                <nav
                                  className={`${styles.actions} ${styles.inlineActions}`}
                                  aria-label="이 문단과 관련된 페이지"
                                >
                                  {segment.actions.map((action) => (
                                    <button
                                      key={action.id}
                                      type="button"
                                      onClick={() => navigateAction(action.id)}
                                    >
                                      {action.label}
                                    </button>
                                  ))}
                                </nav>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className={styles.messageText}>{message.content}</p>
                      )}
                      {summaryActionsForMessage(message).length > 0 && (
                        <nav
                          className={`${styles.actions} ${styles.summaryActions}`}
                          aria-label="관련 페이지"
                        >
                          {summaryActionsForMessage(message).map((action) => (
                            <button
                              key={action.id}
                              type="button"
                              onClick={() => navigateAction(action.id)}
                            >
                              {action.label}
                            </button>
                          ))}
                        </nav>
                      )}
                      {message.id === latestSuggestionMessageId &&
                        message.suggestedQuestions &&
                        message.suggestedQuestions.length > 0 && (
                          <nav
                            className={styles.suggestedQuestions}
                            aria-label="이어서 물어볼 질문"
                          >
                            <span className={styles.suggestedQuestionsLabel}>
                              이어서 물어보기
                            </span>
                            {message.suggestedQuestions.map((question) => (
                              <button
                                key={question}
                                type="button"
                                className={styles.suggestedQuestionButton}
                                onClick={() => void sendMessage(question)}
                              >
                                {question}
                              </button>
                            ))}
                          </nav>
                        )}
                      </article>
                      {message.kind === "greeting" && showOnboarding && (
                        <fieldset className={styles.onboarding}>
                          <legend>
                            어떤 관점에서 보고 계신가요? 선택하면 맞춤 소개를 시작해요.
                          </legend>
                          <div className={styles.audienceOptions}>
                            {AUDIENCE_OPTIONS.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                aria-pressed={audience === option.value}
                                className={
                                  audience === option.value
                                    ? styles.selectedOption
                                    : ""
                                }
                                onClick={() => {
                                  selectAudience(option.value);
                                  void sendMessage(
                                    AUDIENCE_PROMPTS[option.value],
                                    option.value,
                                  );
                                }}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </fieldset>
                      )}
                    </Fragment>
                  ))}
                  {isLoading && (
                    <p className={styles.loading} role="status">
                      공개 자료에서 답변을 찾고 있어요…
                    </p>
                  )}
                  {error && (
                    <div className={styles.error} role="alert">
                      <p>{error}</p>
                      <button type="button" onClick={() => void retry()}>
                        다시 시도
                      </button>
                    </div>
                  )}
                  </div>
                )}
              </div>

              {availability === "online" && (
                <>
                  {REASONING_CONTROLS_ENABLED && (
                    <div
                      className={styles.composerOptions}
                      aria-label="챗봇 응답 옵션"
                    >
                      <button
                        type="button"
                        className={styles.reasoningToggle}
                        aria-pressed={reasoningEnabled}
                        aria-label={`사고모드 ${reasoningEnabled ? "끄기" : "켜기"}`}
                        disabled={isLoading}
                        onClick={() => setReasoningEnabled(!reasoningEnabled)}
                      >
                        <span>사고모드</span>
                        <strong>{reasoningEnabled ? "ON" : "OFF"}</strong>
                      </button>
                      <span className={styles.reasoningHint}>
                        {reasoningEnabled
                          ? "깊이 검토 · 응답이 느릴 수 있음"
                          : "빠른 일반 응답"}
                      </span>
                    </div>
                  )}
                  <form className={styles.composer} onSubmit={submit}>
                    <label
                      className={styles.visuallyHidden}
                      htmlFor="chat-message"
                    >
                      포트폴리오 질문
                    </label>
                    <textarea
                      id="chat-message"
                      ref={inputRef}
                      rows={2}
                      maxLength={2_000}
                      value={draft}
                      onChange={(event) => setDraft(event.currentTarget.value)}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      onKeyDown={handleInputKeyDown}
                      placeholder="경력, 기술, 프로젝트를 질문해 보세요"
                      disabled={isLoading}
                    />
                    {isLoading ? (
                      <button
                        type="button"
                        className={styles.stopButton}
                        onClick={stopGenerating}
                        aria-label="챗봇 응답 생성 중단"
                      >
                        중단
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={draft.trim().length === 0}
                      >
                        전송
                      </button>
                    )}
                  </form>
                  <p className={styles.disclaimer}>
                    챗봇은 실수할 수 있습니다.
                    <br />
                    중요한 내용은 포트폴리오·공개 연락처로 확인해 주세요.
                  </p>
                </>
              )}
            </div>
          </section>
        </>
      )}

      {quickMenuVisible && (
        <nav
          id="portfolio-quick-menu"
          className={styles.quickMenu}
          aria-label="빠른 실행"
        >
          <Link
            href="/settings"
            className={styles.quickMenuAction}
            onClick={() => setQuickMenuOpen(false)}
          >
            <span className={styles.quickMenuIcon} aria-hidden="true">
              ⚙
            </span>
            <span className={styles.quickMenuCopy}>
              <strong>설정</strong>
              <small>사이트 옵션 열기</small>
            </span>
          </Link>
          <a
            href="mailto:sworksong@gmail.com"
            className={styles.quickMenuAction}
            onClick={() => setQuickMenuOpen(false)}
          >
            <span className={styles.quickMenuIcon} aria-hidden="true">
              @
            </span>
            <span className={styles.quickMenuCopy}>
              <strong>메일 보내기</strong>
              <small>sworksong@gmail.com</small>
            </span>
          </a>
          <button
            type="button"
            className={styles.quickMenuAction}
            onClick={cycleThemeMode}
            aria-label={`테마 변경: ${modeLabel}에서 ${nextModeLabel} 모드로`}
          >
            <span className={styles.quickMenuIcon} aria-hidden="true">
              ◐
            </span>
            <span className={styles.quickMenuCopy}>
              <strong>테마 변경</strong>
              <small>
                {modeLabel} → {nextModeLabel}
              </small>
            </span>
          </button>
          <button
            type="button"
            className={styles.quickMenuAction}
            onClick={openChatFromQuickMenu}
          >
            <span className={styles.quickMenuIcon} aria-hidden="true">
              AI
            </span>
            <span className={styles.quickMenuCopy}>
              <strong>채팅</strong>
              <small>포트폴리오에 질문하기</small>
            </span>
          </button>
        </nav>
      )}

      <button
        ref={triggerRef}
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ""} ${
          quickMenuVisible ? styles.triggerMenuOpen : ""
        }`}
        type="button"
        onClick={handleTriggerClick}
        aria-expanded={isOpen || quickMenuVisible}
        aria-controls={
          isOpen || !quickMenuEnabled
            ? "portfolio-chat-dialog"
            : "portfolio-quick-menu"
        }
        aria-label={
          isOpen
            ? "채팅 닫기"
            : quickMenuEnabled
              ? quickMenuVisible
                ? "빠른 메뉴 닫기"
                : "빠른 메뉴 열기"
              : "포트폴리오 챗봇 열기"
        }
      >
        <span aria-hidden="true">
          {quickMenuEnabled ? (quickMenuVisible ? "×" : "•••") : "AI"}
        </span>
        <span>
          {quickMenuEnabled
            ? quickMenuVisible
              ? "메뉴 닫기"
              : "빠른 메뉴"
            : "질문하기"}
        </span>
      </button>
    </div>
  );
}
