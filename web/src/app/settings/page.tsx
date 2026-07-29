"use client";

/**
 * 테마·포인트 컬러·플로팅 버튼 모드·배경 효과를 편집하는 설정 화면이다.
 * 영속화와 DOM 반영은 ThemeContext에 위임하고, 이 컴포넌트는 폼 표현과
 * 미리보기 재생 상태만 관리하는 Provider 소비자 역할을 맡는다.
 */
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  useTheme,
  ACCENTS,
  Accent,
  FabAnim,
  FabMode,
  PageTransition,
} from "../../context/ThemeContext";
import {
  CHAT_ANIMATION_OPTIONS,
  CHAT_STREAM_ANIMATION_OPTIONS,
  DEFAULT_CHAT_ANIMATION,
  DEFAULT_CHAT_STREAM_ANIMATION,
  DEFAULT_REASONING_ENABLED,
  REASONING_CONTROLS_ENABLED,
  StreamingText,
  useChat,
} from "../../features/chat";

const STREAM_PREVIEW_TEXT =
  "선택한 효과로 포트폴리오 챗봇의 답변이 실시간으로 표시됩니다.";

const STREAM_PREVIEW_SPEED_OPTIONS = [
  { value: 0.5, label: "0.5×", description: "느리게" },
  { value: 1, label: "1×", description: "기본" },
  { value: 1.5, label: "1.5×", description: "빠르게" },
  { value: 2, label: "2×", description: "매우 빠르게" },
] as const;

const FAB_ANIMATION_OPTIONS: ReadonlyArray<{
  value: FabAnim;
  label: string;
  description: string;
}> = [
  {
    value: "none",
    label: "없음",
    description: "효과 없이 즉시 열고 닫기",
  },
  {
    value: "rise",
    label: "솟아오르기",
    description: "아래에서 위로 차례대로 등장",
  },
  {
    value: "slide",
    label: "슬라이드",
    description: "오른쪽에서 미끄러져 등장",
  },
  {
    value: "pop",
    label: "팝",
    description: "작게 톡 튀어나오며 등장",
  },
  {
    value: "blur",
    label: "블러 포커스",
    description: "흐릿한 상태에서 또렷하게 등장",
  },
];

const PAGE_TRANSITION_OPTIONS: ReadonlyArray<{
  value: PageTransition;
  label: string;
  description: string;
}> = [
  {
    value: "none",
    label: "없음",
    description: "페이지를 즉시 전환",
  },
  {
    value: "slide",
    label: "슬라이드",
    description: "탭 순서에 따라 좌우로 이동",
  },
  {
    value: "fade",
    label: "페이드",
    description: "부드럽게 나타나며 전환",
  },
  {
    value: "lift",
    label: "위로 전환",
    description: "아래에서 가볍게 올라오며 전환",
  },
];

type StreamPreviewSpeed =
  (typeof STREAM_PREVIEW_SPEED_OPTIONS)[number]["value"];

export default function SettingsPage() {
  const {
    mode,
    accent,
    motion,
    pageTransition,
    fabMode,
    fabAnim,
    glow,
    setMode,
    setAccent,
    setMotion,
    setPageTransition,
    setFabMode,
    setFabAnim,
    setGlow,
    resetTheme,
  } = useTheme();
  const {
    streamingEnabled,
    setStreamingEnabled,
    reasoningEnabled,
    setReasoningEnabled,
    chatAnimation,
    setChatAnimation,
    streamAnimation,
    effectiveStreamAnimation,
    setStreamAnimation,
  } = useChat();

  const [streamPreviewText, setStreamPreviewText] = useState("");
  const [streamPreviewRunning, setStreamPreviewRunning] = useState(false);
  const [streamPreviewCycle, setStreamPreviewCycle] = useState(0);
  const [streamPreviewSpeed, setStreamPreviewSpeed] =
    useState<StreamPreviewSpeed>(1);
  const [fabPreviewCycle, setFabPreviewCycle] = useState(0);

  useEffect(() => {
    let timer = 0;
    const characters = Array.from(STREAM_PREVIEW_TEXT);
    const frame = window.requestAnimationFrame(() => {
      if (!streamingEnabled) {
        setStreamPreviewText(STREAM_PREVIEW_TEXT);
        setStreamPreviewRunning(false);
        return;
      }

      let cursor = 0;
      setStreamPreviewText("");
      setStreamPreviewRunning(true);
      timer = window.setInterval(() => {
        cursor = Math.min(cursor + 2, characters.length);
        setStreamPreviewText(characters.slice(0, cursor).join(""));
        if (cursor === characters.length) {
          window.clearInterval(timer);
          setStreamPreviewRunning(false);
        }
      }, Math.round(75 / streamPreviewSpeed));
    });
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, [
    effectiveStreamAnimation,
    streamAnimation,
    streamingEnabled,
    streamPreviewCycle,
    streamPreviewSpeed,
  ]);

  const resetAllSettings = () => {
    resetTheme();
    setStreamingEnabled(true);
    setReasoningEnabled(DEFAULT_REASONING_ENABLED);
    setChatAnimation(DEFAULT_CHAT_ANIMATION);
    setStreamAnimation(DEFAULT_CHAT_STREAM_ANIMATION);
  };

  const getSegBtnStyle = (active: boolean): React.CSSProperties => {
    const base: React.CSSProperties = {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "7px",
      padding: "11px",
      borderRadius: "9px",
      fontSize: "14px",
      fontWeight: 700,
      cursor: "pointer",
      border: "none",
      transition: "background .2s, color .2s",
    };
    
    if (active) {
      return {
        ...base,
        background: "var(--accent, #6366f1)",
        color: "var(--accent-contrast, #fff)",
        boxShadow: "0 6px 16px -8px var(--accent-soft)",
      };
    }
    return {
      ...base,
      background: "transparent",
      color: "var(--text-dim)",
    };
  };

  const accentKeys: Accent[] = ["indigo", "emerald", "amber", "rose", "violet"];
  const fabModes: ReadonlyArray<{
    value: FabMode;
    label: string;
    description: string;
  }> = [
    {
      value: "chat",
      label: "채팅 바로 열기",
      description: "지금처럼 버튼 하나로 채팅창을 바로 엽니다. (기본)",
    },
    {
      value: "quick-menu",
      label: "빠른 메뉴",
      description: "채팅·테마·메일·설정 버튼을 먼저 펼칩니다.",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg, #0a0b12)",
        color: "var(--text, #eef0f6)",
        fontFamily: "'Pretendard', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          background: "var(--nav-bg, rgba(10,11,18,0.72))",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "840px",
            margin: "0 auto",
            padding: "0 clamp(18px, 5vw, 32px)",
            height: "62px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "14px",
          }}
        >
          <Link
            href="/about-me"
            className="hover-footer-link"
            aria-label="소개 페이지로 돌아가기"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
              color: "var(--text)",
              fontWeight: 700,
              fontSize: "14.5px",
            }}
          >
            <span
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "9px",
                border: "1px solid var(--border-strong)",
                background: "var(--bg-elev)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </span>
            소개 페이지
          </Link>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              letterSpacing: ".2em",
              color: "var(--text-mute)",
            }}
          >
            SETTINGS
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main
        style={{
          width: "100%",
          maxWidth: "840px",
          margin: "0 auto",
          padding: "clamp(28px, 5vw, 52px) clamp(18px, 5vw, 32px) 80px",
        }}
      >
        <div style={{ marginBottom: "clamp(28px, 4vw, 40px)" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", letterSpacing: ".18em", textTransform: "uppercase", color: "var(--accent, #6366f1)", marginBottom: "12px" }}>
            SITE SETTINGS
          </div>
          <h1 style={{ margin: "0 0 12px", fontSize: "clamp(28px, 4.4vw, 40px)", fontWeight: 800, letterSpacing: "-.02em" }}>사이트 설정</h1>
          <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.7, color: "var(--text-dim)", maxWidth: "560px" }}>
            테마, 플로팅 버튼과 챗봇 응답 방식을 맞춰보세요. 변경 사항은 즉시 저장되어 사이트 전체에 적용됩니다.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Theme Mode */}
          <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: "18px", padding: "clamp(20px, 3vw, 28px)" }}>
            <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>화면 모드</div>
            <div style={{ fontSize: "13.5px", color: "var(--text-mute)", marginBottom: "18px" }}>운영체제 설정을 따르거나 밝은 화면과 어두운 화면을 직접 선택하세요.</div>
            <div role="radiogroup" aria-label="화면 모드" style={{ display: "flex", gap: "8px", padding: "5px", background: "var(--bg-elev-2)", border: "1px solid var(--border)", borderRadius: "13px", maxWidth: "480px" }}>
              <button
                onClick={() => setMode("system")}
                role="radio"
                aria-checked={mode === "system"}
                style={getSegBtnStyle(mode === "system")}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="13" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                </svg>
                시스템
              </button>
              <button
                onClick={() => setMode("light")}
                role="radio"
                aria-checked={mode === "light"}
                style={getSegBtnStyle(mode === "light")}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
                </svg>
                라이트
              </button>
              <button
                onClick={() => setMode("dark")}
                role="radio"
                aria-checked={mode === "dark"}
                style={getSegBtnStyle(mode === "dark")}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5z" />
                </svg>
                다크
              </button>
            </div>
          </section>

          {/* 모션 정책 */}
          <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: "18px", padding: "clamp(20px, 3vw, 28px)" }}>
            <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>모션(애니메이션)</div>
            <div style={{ fontSize: "13.5px", color: "var(--text-mute)", marginBottom: "18px" }}>
              시스템 접근성 설정을 따르거나 사이트의 움직임을 직접 켜고 끌 수 있습니다.
            </div>
            <div role="radiogroup" aria-label="모션 애니메이션" style={{ display: "flex", gap: "8px", padding: "5px", background: "var(--bg-elev-2)", border: "1px solid var(--border)", borderRadius: "13px", maxWidth: "480px" }}>
              <button
                type="button"
                onClick={() => setMotion("system")}
                role="radio"
                aria-checked={motion === "system"}
                style={getSegBtnStyle(motion === "system")}
              >
                시스템 따름
              </button>
              <button
                type="button"
                onClick={() => setMotion("on")}
                role="radio"
                aria-checked={motion === "on"}
                style={getSegBtnStyle(motion === "on")}
              >
                항상 켬
              </button>
              <button
                type="button"
                onClick={() => setMotion("off")}
                role="radio"
                aria-checked={motion === "off"}
                style={getSegBtnStyle(motion === "off")}
              >
                항상 끔
              </button>
            </div>
            <div style={{ marginTop: "11px", fontSize: "12.5px", color: "var(--text-mute)", lineHeight: 1.55 }}>
              기본값은 항상 켬입니다. 시스템 따름을 선택하면 운영체제의 모션 줄이기 설정을 존중합니다.
            </div>
          </section>

          {/* About page transitions */}
          <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: "18px", padding: "clamp(20px, 3vw, 28px)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "4px" }}>
              <span id="page-transition-title" style={{ fontSize: "16px", fontWeight: 700 }}>
                페이지 이동 애니메이션
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px", color: "var(--accent, #6366f1)", whiteSpace: "nowrap" }}>
                {PAGE_TRANSITION_OPTIONS.find((option) => option.value === pageTransition)?.label}
              </span>
            </div>
            <div id="page-transition-description" style={{ fontSize: "13.5px", color: "var(--text-mute)", marginBottom: "18px", lineHeight: 1.6 }}>
              소개 페이지의 탭을 이동할 때 본문이 바뀌는 방식을 정합니다. 기본값은 페이드입니다.
            </div>
            <div
              role="radiogroup"
              aria-labelledby="page-transition-title"
              aria-describedby="page-transition-description"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
                gap: "9px",
              }}
            >
              {PAGE_TRANSITION_OPTIONS.map((option) => {
                const active = pageTransition === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPageTransition(option.value)}
                    role="radio"
                    aria-checked={active}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      minWidth: 0,
                      padding: "13px 14px",
                      borderRadius: "12px",
                      textAlign: "left",
                      cursor: "pointer",
                      background: active
                        ? "var(--accent-soft, rgba(99,102,241,.14))"
                        : "var(--bg-elev-2)",
                      border: active
                        ? "1.5px solid var(--accent, #6366f1)"
                        : "1.5px solid var(--border)",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "7px", width: "100%", fontSize: "13.5px", fontWeight: 700 }}>
                      {option.label}
                      {active && (
                        <span style={{ width: "17px", height: "17px", borderRadius: "50%", background: "var(--accent, #6366f1)", color: "var(--accent-contrast, #fff)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                      )}
                    </span>
                    <span style={{ fontSize: "11.5px", color: "var(--text-mute)", lineHeight: 1.45 }}>
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: "11px", fontSize: "12.5px", color: "var(--text-mute)", lineHeight: 1.55 }}>
              슬라이드는 다음 탭과 이전 탭의 방향을 구분하며, 모션을 끄면 선택값과 관계없이 즉시 전환됩니다.
            </div>
          </section>

          {/* Accent Color */}
          <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: "18px", padding: "clamp(20px, 3vw, 28px)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "4px" }}>
              <span style={{ fontSize: "16px", fontWeight: 700 }}>포인트 컬러</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px", color: "var(--accent, #6366f1)", whiteSpace: "nowrap" }}>
                {ACCENTS[accent]?.label || "인디고"}
              </span>
            </div>
            <div style={{ fontSize: "13.5px", color: "var(--text-mute)", marginBottom: "18px" }}>버튼과 강조 요소에 쓰이는 색입니다.</div>
            <div role="radiogroup" aria-label="포인트 컬러" style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              {accentKeys.map((key) => {
                const meta = ACCENTS[key];
                const active = accent === key;
                return (
                  <button
                    key={key}
                    onClick={() => setAccent(key)}
                    aria-label={meta.label}
                    role="radio"
                    aria-checked={active}
                    className="hover-accent-color"
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "50%",
                      border: "1px solid var(--border)",
                      cursor: "pointer",
                      display: "grid",
                      placeItems: "center",
                      background: meta.color,
                      transition: "transform .18s",
                    }}
                  >
                    {active && (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,.4))" }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Floating button mode */}
          <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: "18px", padding: "clamp(20px, 3vw, 28px)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "4px" }}>
              <span style={{ fontSize: "16px", fontWeight: 700 }}>플로팅 버튼</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px", color: "var(--accent, #6366f1)", whiteSpace: "nowrap" }}>
                {fabMode === "quick-menu" ? "빠른 메뉴" : "채팅 바로 열기"}
              </span>
            </div>
            <div style={{ fontSize: "13.5px", color: "var(--text-mute)", marginBottom: "18px" }}>
              우하단 버튼을 눌렀을 때 채팅을 바로 열지, 빠른 기능을 먼저 보여줄지 정합니다.
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "stretch" }}>
              <div role="radiogroup" aria-label="플로팅 버튼 동작" style={{ flex: "1 1 300px", minWidth: 0, display: "grid", gap: "10px", alignContent: "start" }}>
                {fabModes.map((option) => {
                  const active = fabMode === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFabMode(option.value)}
                      role="radio"
                      aria-checked={active}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "7px",
                        textAlign: "left",
                        padding: "14px 15px",
                        borderRadius: "13px",
                        cursor: "pointer",
                        transition: "background .2s, border-color .2s",
                        background: active ? "var(--accent-soft, rgba(99,102,241,.14))" : "var(--bg-elev-2)",
                        border: active ? "1.5px solid var(--accent, #6366f1)" : "1.5px solid var(--border)",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", width: "100%" }}>
                        <span style={{ fontSize: "14.5px", fontWeight: 700 }}>{option.label}</span>
                        {active && (
                          <span style={{ width: "18px", height: "18px", borderRadius: "50%", background: "var(--accent, #6366f1)", color: "var(--accent-contrast, #fff)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                        )}
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--text-mute)", lineHeight: 1.45 }}>{option.description}</span>
                    </button>
                  );
                })}
              </div>

              <div
                style={{
                  flex: "1 1 260px",
                  minWidth: 0,
                  position: "relative",
                  border: "1px solid var(--border)",
                  borderRadius: "14px",
                  background: "linear-gradient(160deg, var(--accent-soft, rgba(99,102,241,.12)), var(--bg-elev-2))",
                  overflow: "hidden",
                  minHeight: fabMode === "quick-menu" ? "300px" : "240px",
                  transition: "min-height .2s ease",
                }}
              >
                <div style={{ position: "absolute", left: "14px", top: "13px", fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", letterSpacing: ".12em", color: "var(--text-mute)" }}>
                  PREVIEW
                </div>
                {fabMode === "quick-menu" && (
                  <button
                    type="button"
                    onClick={() => setFabPreviewCycle((cycle) => cycle + 1)}
                    className="hover-reset-btn"
                    aria-label="빠른 메뉴 애니메이션 미리보기 다시 재생"
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "7px 9px",
                      borderRadius: "9px",
                      border: "1px solid var(--border-strong)",
                      background: "var(--bg-elev)",
                      color: "var(--text-dim)",
                      fontSize: "11.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
                      <polyline points="20 4 20 11 13 11" />
                    </svg>
                    다시 재생
                  </button>
                )}
                <div style={{ position: "absolute", right: "16px", bottom: "16px", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                  {fabMode === "quick-menu" && (
                    <div
                      key={`${fabAnim}-${fabPreviewCycle}`}
                      data-fab="open"
                      data-anim={fabAnim}
                      style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "7px" }}
                    >
                      {[
                        ["⚙", "설정"],
                        ["@", "메일"],
                        ["◐", "테마"],
                        ["AI", "채팅"],
                      ].map(([icon, label]) => (
                        <div
                          key={label}
                          data-fab-item
                          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px 6px 7px", borderRadius: "999px", background: "var(--bg-elev)", border: "1px solid var(--border-strong)", boxShadow: "var(--shadow)", fontSize: "12px", fontWeight: 700 }}
                        >
                          <span style={{ width: "25px", height: "25px", borderRadius: "50%", background: "var(--accent-soft, rgba(99,102,241,.14))", color: "var(--accent, #6366f1)", display: "grid", placeItems: "center", fontSize: "9px", fontWeight: 800 }}>
                            {icon}
                          </span>
                          {label}
                        </div>
                      ))}
                    </div>
                  )}
                  <div
                    style={{
                      minHeight: "46px",
                      padding: "6px 14px 6px 6px",
                      borderRadius: "999px",
                      background: "var(--bg-elev)",
                      color: "var(--text)",
                      border: "1px solid color-mix(in srgb, var(--accent, #6366f1) 45%, transparent)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      boxShadow: "0 14px 30px -10px rgba(10,12,28,.55)",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    <span style={{ width: "34px", height: "34px", borderRadius: "50%", background: "var(--accent, #6366f1)", color: "var(--accent-contrast, #fff)", display: "grid", placeItems: "center", fontSize: "10px", fontWeight: 800 }}>
                      {fabMode === "quick-menu" ? "•••" : "AI"}
                    </span>
                    {fabMode === "quick-menu" ? "빠른 메뉴" : "질문하기"}
                  </div>
                </div>
              </div>
            </div>

            {fabMode === "quick-menu" && (
              <div
                style={{
                  marginTop: "20px",
                  paddingTop: "18px",
                  borderTop: "1px solid var(--border)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "4px" }}>
                  <span id="fab-animation-title" style={{ fontSize: "14.5px", fontWeight: 700 }}>
                    빠른 메뉴 애니메이션
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "var(--accent, #6366f1)", whiteSpace: "nowrap" }}>
                    {FAB_ANIMATION_OPTIONS.find((option) => option.value === fabAnim)?.label}
                  </span>
                </div>
                <div id="fab-animation-description" style={{ fontSize: "12.5px", color: "var(--text-mute)", marginBottom: "14px", lineHeight: 1.55 }}>
                  빠른 기능이 열리고 닫힐 때의 효과예요. 닫을 때는 반대 순서로 재생됩니다.
                </div>
                <div
                  role="radiogroup"
                  aria-labelledby="fab-animation-title"
                  aria-describedby="fab-animation-description"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
                    gap: "9px",
                  }}
                >
                  {FAB_ANIMATION_OPTIONS.map((option) => {
                    const active = fabAnim === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFabAnim(option.value)}
                        role="radio"
                        aria-checked={active}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                          minWidth: 0,
                          padding: "12px 13px",
                          borderRadius: "12px",
                          textAlign: "left",
                          cursor: "pointer",
                          background: active
                            ? "var(--accent-soft, rgba(99,102,241,.14))"
                            : "var(--bg-elev-2)",
                          border: active
                            ? "1.5px solid var(--accent, #6366f1)"
                            : "1.5px solid var(--border)",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "7px", width: "100%", fontSize: "13.5px", fontWeight: 700 }}>
                          {option.label}
                          {active && (
                            <span style={{ width: "17px", height: "17px", borderRadius: "50%", background: "var(--accent, #6366f1)", color: "var(--accent-contrast, #fff)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </span>
                          )}
                        </span>
                        <span style={{ fontSize: "11.5px", color: "var(--text-mute)", lineHeight: 1.45 }}>
                          {option.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* Background Glow */}
          <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: "18px", padding: "clamp(20px, 3vw, 28px)" }}>
            <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>화면 효과</div>
            <div style={{ fontSize: "13.5px", color: "var(--text-mute)", marginBottom: "18px" }}>배경의 은은한 컬러 글로우를 켜거나 끕니다.</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", padding: "14px 16px", borderRadius: "13px", background: "var(--bg-elev-2)", border: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontSize: "14.5px", fontWeight: 600 }}>배경 글로우</div>
                <div style={{ fontSize: "12.5px", color: "var(--text-mute)", marginTop: "2px" }}>포인트 컬러로 은은하게 빛나는 배경</div>
              </div>
              <button
                onClick={() => setGlow(!glow)}
                aria-label="배경 글로우 전환"
                role="switch"
                aria-checked={glow}
                style={{
                  width: "48px",
                  height: "27px",
                  borderRadius: "999px",
                  position: "relative",
                  cursor: "pointer",
                  transition: "background .2s",
                  border: "1px solid var(--border-strong)",
                  flexShrink: 0,
                  background: glow ? "var(--accent, #6366f1)" : "var(--bg-elev)",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: "2px",
                    left: "2px",
                    width: "21px",
                    height: "21px",
                    borderRadius: "50%",
                    background: "#fff",
                    boxShadow: "0 1px 3px rgba(0,0,0,.3)",
                    transition: "transform .2s",
                    transform: glow ? "translateX(21px)" : "none",
                  }}
                />
              </button>
            </div>
          </section>

          {/* Chat response */}
          <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: "18px", padding: "clamp(20px, 3vw, 28px)" }}>
            <div id="chat-response-title" style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>
              챗봇 응답
            </div>
            <div id="chat-streaming-description" style={{ fontSize: "13.5px", color: "var(--text-mute)", marginBottom: "18px", lineHeight: 1.6 }}>
              응답 스트리밍을 켜면 생성되는 내용을 바로 표시하고, 끄면 완성된 답변을 한 번에 표시합니다.
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", padding: "14px 16px", borderRadius: "13px", background: "var(--bg-elev-2)", border: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontSize: "14.5px", fontWeight: 600 }}>응답 스트리밍</div>
                <div style={{ fontSize: "12.5px", color: "var(--text-mute)", marginTop: "2px" }}>
                  {streamingEnabled ? "생성되는 내용을 바로 표시" : "완성 후 한 번에 표시"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStreamingEnabled(!streamingEnabled)}
                role="switch"
                aria-checked={streamingEnabled}
                aria-labelledby="chat-response-title"
                aria-describedby="chat-streaming-description"
                style={{
                  width: "48px",
                  height: "27px",
                  borderRadius: "999px",
                  position: "relative",
                  cursor: "pointer",
                  transition: "background .2s",
                  border: "1px solid var(--border-strong)",
                  flexShrink: 0,
                  background: streamingEnabled ? "var(--accent, #6366f1)" : "var(--bg-elev)",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: "2px",
                    left: "2px",
                    width: "21px",
                    height: "21px",
                    borderRadius: "50%",
                    background: "#fff",
                    boxShadow: "0 1px 3px rgba(0,0,0,.3)",
                    transition: "transform .2s",
                    transform: streamingEnabled ? "translateX(21px)" : "none",
                  }}
                />
              </button>
            </div>
            {REASONING_CONTROLS_ENABLED && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", padding: "14px 16px", marginTop: "10px", borderRadius: "13px", background: "var(--bg-elev-2)", border: "1px solid var(--border)" }}>
                <div>
                  <div id="chat-reasoning-title" style={{ fontSize: "14.5px", fontWeight: 600 }}>사고모드</div>
                  <div id="chat-reasoning-description" style={{ fontSize: "12.5px", color: "var(--text-mute)", marginTop: "2px", lineHeight: 1.5 }}>
                    {reasoningEnabled
                      ? "복잡한 질문을 더 깊게 검토 · 응답 시간이 길어질 수 있음"
                      : "빠른 일반 응답 · 내부 추론 단계 생략"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReasoningEnabled(!reasoningEnabled)}
                  role="switch"
                  aria-checked={reasoningEnabled}
                  aria-labelledby="chat-reasoning-title"
                  aria-describedby="chat-reasoning-description"
                  style={{
                    width: "48px",
                    height: "27px",
                    borderRadius: "999px",
                    position: "relative",
                    cursor: "pointer",
                    transition: "background .2s",
                    border: "1px solid var(--border-strong)",
                    flexShrink: 0,
                    background: reasoningEnabled ? "var(--accent, #6366f1)" : "var(--bg-elev)",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      top: "2px",
                      left: "2px",
                      width: "21px",
                      height: "21px",
                      borderRadius: "50%",
                      background: "#fff",
                      boxShadow: "0 1px 3px rgba(0,0,0,.3)",
                      transition: "transform .2s",
                      transform: reasoningEnabled ? "translateX(21px)" : "none",
                    }}
                  />
                </button>
              </div>
            )}
          </section>

          {/* 응답 텍스트 애니메이션 */}
          <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: "18px", padding: "clamp(20px, 3vw, 28px)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "4px" }}>
              <span id="stream-animation-title" style={{ fontSize: "16px", fontWeight: 700 }}>응답 텍스트 애니메이션</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px", color: "var(--accent, #6366f1)", whiteSpace: "nowrap" }}>
                {CHAT_STREAM_ANIMATION_OPTIONS.find((option) => option.value === streamAnimation)?.label || "단어 페이드"}
              </span>
            </div>
            <div id="stream-animation-description" style={{ fontSize: "13.5px", color: "var(--text-mute)", marginBottom: "18px", lineHeight: 1.6 }}>
              답변이 생성되며 도착하는 글자에 입히는 효과예요. PC와 모바일 모두에 적용됩니다.
            </div>
            <div>
              <div
                role="radiogroup"
                aria-label="응답 텍스트 애니메이션"
                aria-describedby="stream-animation-description"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
                  gap: "10px",
                  opacity: streamingEnabled ? 1 : 0.5,
                  transition: "opacity .2s",
                }}
              >
                {CHAT_STREAM_ANIMATION_OPTIONS.map((option) => {
                  const active = streamAnimation === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStreamAnimation(option.value)}
                      role="radio"
                      aria-checked={active}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "7px",
                        textAlign: "left",
                        padding: "14px 15px",
                        borderRadius: "13px",
                        cursor: "pointer",
                        transition: "background .2s, border-color .2s",
                        background: active ? "var(--accent-soft, rgba(99,102,241,.14))" : "var(--bg-elev-2)",
                        border: active ? "1.5px solid var(--accent, #6366f1)" : "1.5px solid var(--border)",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", width: "100%" }}>
                        <span style={{ fontSize: "14.5px", fontWeight: 700 }}>{option.label}</span>
                        {active && (
                          <span style={{ width: "18px", height: "18px", borderRadius: "50%", background: "var(--accent, #6366f1)", color: "var(--accent-contrast, #fff)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                        )}
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--text-mute)", lineHeight: 1.45 }}>{option.description}</span>
                    </button>
                  );
                })}
              </div>
              <div
                style={{
                  marginTop: "16px",
                  padding: "16px",
                  borderRadius: "14px",
                  border: "1px solid var(--border)",
                  background: "linear-gradient(145deg, var(--bg-elev-2), var(--accent-soft, rgba(99,102,241,.10)))",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: ".12em", color: "var(--text-mute)", marginBottom: "4px" }}>
                      LIVE PREVIEW
                    </div>
                    <div style={{ fontSize: "12.5px", color: "var(--text-dim)" }}>
                      {streamingEnabled
                        ? effectiveStreamAnimation === "none" && streamAnimation !== "none"
                          ? "모션 정책에 따라 효과 없이 스트리밍"
                          : "실제 채팅과 같은 렌더러로 재생 중"
                        : "스트리밍 꺼짐 · 완성된 답변을 한 번에 표시"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStreamPreviewCycle((cycle) => cycle + 1)}
                    className="hover-reset-btn"
                    aria-label="응답 텍스트 애니메이션 미리보기 다시 재생"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 11px",
                      borderRadius: "9px",
                      border: "1px solid var(--border-strong)",
                      background: "var(--bg-elev)",
                      color: "var(--text-dim)",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
                      <polyline points="20 4 20 11 13 11" />
                    </svg>
                    다시 재생
                  </button>
                </div>
                <div
                  role="radiogroup"
                  aria-label="미리보기 재생 속도"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "14px",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      marginRight: "2px",
                      color: "var(--text-mute)",
                      fontSize: "11.5px",
                      fontWeight: 700,
                    }}
                  >
                    재생 속도
                  </span>
                  {STREAM_PREVIEW_SPEED_OPTIONS.map((option) => {
                    const active = streamPreviewSpeed === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        aria-label={`${option.label} ${option.description}`}
                        onClick={() => setStreamPreviewSpeed(option.value)}
                        style={{
                          padding: "6px 9px",
                          borderRadius: "8px",
                          border: active
                            ? "1px solid var(--accent, #6366f1)"
                            : "1px solid var(--border)",
                          background: active
                            ? "var(--accent-soft, rgba(99,102,241,.14))"
                            : "var(--bg-elev)",
                          color: active
                            ? "var(--accent, #6366f1)"
                            : "var(--text-dim)",
                          cursor: "pointer",
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "11.5px",
                          fontWeight: 700,
                        }}
                        title={option.description}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <span aria-hidden="true" style={{ width: "30px", height: "30px", flex: "0 0 30px", borderRadius: "50%", background: "var(--accent, #6366f1)", color: "var(--accent-contrast, #fff)", display: "grid", placeItems: "center", fontSize: "9px", fontWeight: 800 }}>
                    AI
                  </span>
                  <div
                    aria-hidden="true"
                    style={{
                      "--chat-accent": "var(--accent, #6366f1)",
                      "--chat-bg": "var(--bg-elev, #ffffff)",
                      "--chat-bg-soft": "var(--bg-elev-2, #f3f4fa)",
                      "--chat-text": "var(--text, #14161f)",
                      "--chat-dim": "var(--text-dim, #525872)",
                      "--chat-border":
                        "var(--border-strong, rgba(18, 20, 45, 0.15))",
                      minHeight: "58px",
                      flex: 1,
                      padding: "11px 13px",
                      borderRadius: "4px 13px 13px 13px",
                      background: "var(--chat-bg)",
                      border: "1px solid var(--chat-border)",
                      color: "var(--chat-text)",
                      fontSize: "14px",
                      lineHeight: 1.65,
                    } as React.CSSProperties}
                  >
                    <StreamingText
                      key={`${streamAnimation}-${streamingEnabled}-${streamPreviewSpeed}-${streamPreviewCycle}`}
                      text={streamPreviewText}
                      animation={
                        streamingEnabled ? effectiveStreamAnimation : "none"
                      }
                      isStreaming={
                        streamingEnabled && streamPreviewRunning
                      }
                      playbackRate={streamPreviewSpeed}
                    />
                  </div>
                </div>
                <span
                  style={{
                    position: "absolute",
                    width: "1px",
                    height: "1px",
                    padding: 0,
                    margin: "-1px",
                    overflow: "hidden",
                    clip: "rect(0, 0, 0, 0)",
                    whiteSpace: "nowrap",
                    border: 0,
                  }}
                >
                  미리보기 문장: {STREAM_PREVIEW_TEXT}
                </span>
              </div>
              <div style={{ marginTop: "11px", fontSize: "12.5px", color: "var(--text-mute)", lineHeight: 1.55 }}>
                {streamingEnabled
                  ? "모션을 끄거나 시스템이 모션 줄이기를 요청하면 이 설정과 관계없이 효과 없이 표시됩니다."
                  : "응답 스트리밍이 꺼져 있어 지금은 적용되지 않아요. 선택은 그대로 두고 스트리밍을 켜면 다시 재생됩니다."}
              </div>
            </div>
          </section>

          {/* 채팅창 애니메이션 */}
          <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: "18px", padding: "clamp(20px, 3vw, 28px)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "4px" }}>
              <span id="chat-animation-title" style={{ fontSize: "16px", fontWeight: 700 }}>채팅창 애니메이션</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px", color: "var(--accent, #6366f1)", whiteSpace: "nowrap" }}>
                {CHAT_ANIMATION_OPTIONS.find((option) => option.value === chatAnimation)?.label || "젤리"}
              </span>
            </div>
            <div id="chat-animation-description" style={{ fontSize: "13.5px", color: "var(--text-mute)", marginBottom: "18px", lineHeight: 1.6 }}>
              챗봇 창이 열리고 닫힐 때의 효과예요. PC 화면에만 적용되고, 모바일은 기존 화면 전환을 그대로 씁니다.
            </div>
            <div
              role="radiogroup"
              aria-label="채팅창 애니메이션"
              aria-describedby="chat-animation-description"
              style={{ display: "flex", gap: "8px", padding: "5px", background: "var(--bg-elev-2)", border: "1px solid var(--border)", borderRadius: "13px", maxWidth: "480px" }}
            >
              {CHAT_ANIMATION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setChatAnimation(option.value)}
                  role="radio"
                  aria-checked={chatAnimation === option.value}
                  style={getSegBtnStyle(chatAnimation === option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div style={{ marginTop: "11px", fontSize: "12.5px", color: "var(--text-mute)", lineHeight: 1.55 }}>
              모션을 끄거나 시스템이 모션 줄이기를 요청하면 이 설정과 관계없이 효과 없이 표시됩니다.
            </div>
          </section>

          {/* Reset Notice */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between", padding: "6px 4px" }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px", color: "var(--text-mute)", lineHeight: 1.6 }}>
              설정은 이 브라우저에 저장되어
              <br />
              다음 방문에도 유지됩니다.
            </span>
            <button
              onClick={resetAllSettings}
              className="hover-reset-btn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                borderRadius: "11px",
                border: "1px solid var(--border-strong)",
                background: "var(--bg-elev)",
                color: "var(--text-dim)",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 4v4h4" />
              </svg>
              테마와 챗봇 설정 초기화
            </button>
          </div>
        </div>

        {/* Back link */}
        <Link
          href="/"
          className="hover-btn-primary"
          style={{
            marginTop: "34px",
            display: "inline-flex",
            alignItems: "center",
            gap: "9px",
            padding: "13px 22px",
            borderRadius: "12px",
            background: "var(--accent, #6366f1)",
            color: "var(--accent-contrast, #fff)",
            fontSize: "14.5px",
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 16px 34px -14px var(--accent-soft)",
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          홈으로 돌아가기
        </Link>
      </main>
    </div>
  );
}
