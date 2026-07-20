"use client";

/**
 * 모든 라우트에서 빠른 메뉴·테마 서랍·샘플 채팅 진입점을 조정하는 클라이언트 컴포넌트다.
 * 테마 값은 ThemeContext에 의존하고, 젤리 패널의 명령형 DOM 구현은
 * ElasticJellySamplePanel 어댑터 뒤에 감춘다(Adapter 패턴). 열림/렌더 상태를
 * 분리해 퇴장 애니메이션 동안 DOM을 유지하는 상태 기반 렌더링 전략을 사용한다.
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useTheme, ACCENTS, Accent, FabAnim } from "../context/ThemeContext";
import ElasticJellySamplePanel from "../lib/ElasticJellySamplePanel";

export default function FloatingMenu() {
  const {
    mode,
    accent,
    motion,
    fabAnim,
    setMode,
    setAccent,
    setMotion,
    setFabAnim,
    resetTheme,
  } = useTheme();

  const [fabOpen, setFabOpen] = useState(false);
  const [fabRender, setFabRender] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsRender, setSettingsRender] = useState(false);

  const fabTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const settingsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const settingsOpenTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatBtnRef = useRef<HTMLButtonElement>(null);
  const mainFabRef = useRef<HTMLButtonElement>(null);
  const settingsTriggerRef = useRef<HTMLButtonElement>(null);
  const settingsDialogRef = useRef<HTMLDivElement>(null);
  const settingsCloseRef = useRef<HTMLButtonElement>(null);
  const jellyPanelRef = useRef<ElasticJellySamplePanel | null>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const btn = chatBtnRef.current;
    if (btn && !jellyPanelRef.current) {
      try {
        if (!menuContainerRef.current) return;
        jellyPanelRef.current = new ElasticJellySamplePanel(btn, menuContainerRef.current as HTMLElement);
      } catch (e) {
        console.error("Failed to init chat panel", e);
      }
    }
    return () => {
      if (jellyPanelRef.current) {
        jellyPanelRef.current.destroy();
        jellyPanelRef.current = null;
      }
    };
  }, [fabRender]);
  const toggleFab = () => {
    if (fabOpen) {
      setFabOpen(false);
    } else {
      if (fabTimeoutRef.current) clearTimeout(fabTimeoutRef.current);
      setFabRender(true);
      setFabOpen(true);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        fabOpen &&
        menuContainerRef.current &&
        !menuContainerRef.current.contains(event.target as Node)
      ) {
        // 채팅 패널이 열려 있으면 바깥 영역을 클릭해도 메뉴를 유지합니다.
        if (jellyPanelRef.current && jellyPanelRef.current.panel?.classList.contains('open')) {
          return;
        }
        setFabOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [fabOpen]);

  useEffect(() => {
    if (!fabOpen || settingsOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setFabOpen(false);
      mainFabRef.current?.focus();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [fabOpen, settingsOpen]);

  useEffect(() => {
    if (!fabOpen && fabRender) {
      if (jellyPanelRef.current && jellyPanelRef.current.panel?.classList.contains('open')) {
        const mainFab = menuContainerRef.current?.querySelector('.hover-fab-main-btn') as HTMLElement;
        jellyPanelRef.current.close(mainFab);
      }
      fabTimeoutRef.current = setTimeout(() => {
        setFabRender(false);
      }, 560);
    }
    return () => {
      if (fabTimeoutRef.current) clearTimeout(fabTimeoutRef.current);
    };
  }, [fabOpen, fabRender]);

  useEffect(() => {
    if (!settingsOpen && settingsRender) {
      settingsTimeoutRef.current = setTimeout(() => {
        setSettingsRender(false);
      }, 300);
    }
    return () => {
      if (settingsTimeoutRef.current) clearTimeout(settingsTimeoutRef.current);
    };
  }, [settingsOpen, settingsRender]);

  /** 서랍을 닫은 뒤 트리거로 초점을 돌려 키보드 탐색 문맥을 보존한다. */
  const closeSettings = useCallback(() => {
    if (settingsOpenTimeoutRef.current) {
      clearTimeout(settingsOpenTimeoutRef.current);
      settingsOpenTimeoutRef.current = null;
    }
    setSettingsOpen(false);
    window.requestAnimationFrame(() => settingsTriggerRef.current?.focus());
  }, []);

  /** 렌더와 표시 상태를 분리해 서랍 진입·퇴장 전환이 잘리지 않게 한다. */
  const toggleSettings = () => {
    if (settingsOpen) {
      closeSettings();
      return;
    }

    if (settingsTimeoutRef.current) clearTimeout(settingsTimeoutRef.current);
    if (settingsOpenTimeoutRef.current) clearTimeout(settingsOpenTimeoutRef.current);
    setSettingsRender(true);
    settingsOpenTimeoutRef.current = setTimeout(() => setSettingsOpen(true), 10);
  };

  useEffect(() => {
    if (!settingsOpen) return;

    settingsCloseRef.current?.focus();

    const handleDialogKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSettings();
        return;
      }

      if (event.key !== "Tab" || !settingsDialogRef.current) return;

      const focusable = Array.from(
        settingsDialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => !element.hasAttribute("hidden"));

      if (focusable.length === 0) {
        event.preventDefault();
        settingsDialogRef.current.focus();
        return;
      }

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

    document.addEventListener("keydown", handleDialogKeyDown);
    return () => document.removeEventListener("keydown", handleDialogKeyDown);
  }, [closeSettings, settingsOpen]);

  useEffect(() => {
    return () => {
      if (settingsOpenTimeoutRef.current) clearTimeout(settingsOpenTimeoutRef.current);
    };
  }, []);

  const toggleMode = () => {
    setMode(mode === "dark" ? "light" : "dark");
  };

  const getSegBtnStyle = (active: boolean): React.CSSProperties => {
    return {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "7px",
      padding: "10px",
      borderRadius: "9px",
      fontSize: "14px",
      fontWeight: 700,
      cursor: "pointer",
      border: "none",
      transition: "background .2s, color .2s",
      flex: 1,
      background: active ? "var(--accent, #6366f1)" : "transparent",
      color: active ? "var(--accent-contrast, #fff)" : "var(--text-dim)",
      boxShadow: active ? "0 6px 16px -8px var(--accent-soft)" : "none",
    };
  };

  const accentKeys: Accent[] = ["indigo", "emerald", "amber", "rose", "violet"];
  const animKeys: FabAnim[] = ["rise", "slide", "pop", "fade"];

  const animLabels: Record<FabAnim, string> = {
    rise: "솟아오르기",
    slide: "슬라이드",
    pop: "팝",
    fade: "페이드",
  };

  return (
    <>
      {/* FAB Submenu and Toggle Button */}
      <div
        ref={menuContainerRef}
        className="floating-menu"
        style={{
          position: "fixed",
          right: "clamp(16px, 3vw, 28px)",
          bottom: "clamp(16px, 3vw, 28px)",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "13px",
        }}
      >
        {/* Submenu items */}
        {fabRender && (
          <div
            id="floating-quick-menu"
            className="fab-sub-menu"
            data-fab={fabOpen ? "open" : "closing"}
            data-anim={fabAnim}
            aria-hidden={!fabOpen}
            inert={!fabOpen}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "13px",
            }}
          >
            {/* Theme Settings */}
            <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
              <span
                className="fab-label"
                style={{
                  background: "var(--bg-elev)",
                  border: "1px solid var(--border)",
                  color: "var(--text-dim)",
                  padding: "7px 12px",
                  borderRadius: "9px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  boxShadow: "var(--shadow)",
                }}
              >
                테마 설정
              </span>
              <button
                ref={settingsTriggerRef}
                onClick={toggleSettings}
                aria-label="테마 설정"
                aria-expanded={settingsOpen}
                aria-controls="floating-theme-dialog"
                className="hover-fab-sub-btn"
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: "var(--bg-elev)",
                  color: "var(--text)",
                  border: "1px solid var(--border-strong)",
                  boxShadow: "var(--shadow)",
                  cursor: "pointer",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22a10 10 0 1 0-8-16 10 10 0 0 0 8 16c.9 0 1.5-.6 1.5-1.5 0-.4-.1-.8-.4-1.1l-1.2-1.2c-.3-.3-.5-.7-.5-1.1 0-.9.6-1.5 1.5-1.5h1.6c2.8 0 5-2.2 5-5 0-4.4-4-8-9-8z" />
                  <circle cx="7.5" cy="8.5" r="1.5" />
                  <circle cx="11.5" cy="6.5" r="1.5" />
                  <circle cx="8.5" cy="13.5" r="1.5" />
                  <circle cx="13.5" cy="14.5" r="1.5" />
                  {/* Brush Handle and Bristles Background */}
                  <path d="M11 11 L17.5 4.5 A2.5 2.5 0 1 1 21 8 L14.5 14.5 Z" fill="var(--bg-elev)" />
                  <path d="M11 11 Q8 12 7 17 Q12 16 14.5 14.5 Z" fill="var(--bg-elev)" />
                  {/* Brush Handle Outline */}
                  <path d="M11 11 L17.5 4.5 A2.5 2.5 0 1 1 21 8 L14.5 14.5 Z" />
                  {/* Ferrule Line */}
                  <path d="M13 9 L16.5 12.5" />
                  {/* Brush Bristles Fill */}
                  <path d="M11 11 Q8 12 7 17 Q12 16 14.5 14.5 Z" fill="currentColor" />
                </svg>
              </button>
            </div>

            {/* Dark/Light toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
              <span
                className="fab-label"
                style={{
                  background: "var(--bg-elev)",
                  border: "1px solid var(--border)",
                  color: "var(--text-dim)",
                  padding: "7px 12px",
                  borderRadius: "9px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  boxShadow: "var(--shadow)",
                }}
              >
                {mode === "dark" ? "라이트" : "다크"} 모드로
              </span>
              <button
                onClick={toggleMode}
                aria-label="다크/라이트 전환"
                className="hover-fab-sub-btn"
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: "var(--bg-elev)",
                  color: "var(--text)",
                  border: "1px solid var(--border-strong)",
                  boxShadow: "var(--shadow)",
                  cursor: "pointer",
                }}
              >
                {mode === "dark" ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Email inquiry */}
            <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
              <span
                className="fab-label"
                style={{
                  background: "var(--bg-elev)",
                  border: "1px solid var(--border)",
                  color: "var(--text-dim)",
                  padding: "7px 12px",
                  borderRadius: "9px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  boxShadow: "var(--shadow)",
                }}
              >
                이메일 문의
              </span>
              <a
                href="mailto:sworksong@gmail.com"
                aria-label="이메일"
                className="hover-fab-sub-btn"
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: "var(--bg-elev)",
                  color: "var(--text)",
                  border: "1px solid var(--border-strong)",
                  boxShadow: "var(--shadow)",
                  textDecoration: "none",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2.5" />
                  <path d="M3.5 7.5l8.5 5.5 8.5-5.5" />
                </svg>
              </a>
            </div>

            {/* Chat consultation */}
            <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
              <span
                className="fab-label"
                style={{
                  background: "var(--bg-elev)",
                  border: "1px solid var(--border)",
                  color: "var(--text-dim)",
                  padding: "7px 12px",
                  borderRadius: "9px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  boxShadow: "var(--shadow)",
                }}
              >
                채팅 상담
              </span>
              <button
                type="button"
                ref={chatBtnRef}
                aria-label="채팅 상담"
                className="hover-fab-sub-btn"
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: "var(--bg-elev)",
                  color: "var(--text)",
                  border: "1px solid var(--border-strong)",
                  boxShadow: "var(--shadow)",
                  cursor: "pointer",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Toggle Button Container */}
        <div style={{ position: "relative" }}>
          {!fabOpen && (
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                animation: "om-pulse 2.6s ease-out infinite",
                pointerEvents: "none",
              }}
            />
          )}
          <button
            ref={mainFabRef}
            onClick={toggleFab}
            aria-label={fabOpen ? "빠른 메뉴 닫기" : "빠른 메뉴 열기"}
            aria-expanded={fabOpen}
            aria-controls="floating-quick-menu"
            className="floating-menu__trigger hover-fab-main-btn"
            style={{
              position: "relative",
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "var(--accent, #6366f1)",
              color: "var(--accent-contrast, #fff)",
              border: "none",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              boxShadow: "0 18px 38px -12px var(--accent-soft, rgba(99, 102, 241, .7)), 0 10px 24px rgba(0, 0, 0, .28)",
            }}
          >
            {fabOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12a8 8 0 0 1 16 0" />
                <rect x="3" y="12" width="3.6" height="6" rx="1.6" />
                <rect x="17.4" y="12" width="3.6" height="6" rx="1.6" />
                <path d="M20 18a3 3 0 0 1-3 3h-3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Settings Drawer Modal */}
      {settingsRender && (
        <>
          {/* Blur Background Overlay */}
          <div
            onClick={closeSettings}
            aria-hidden="true"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 90,
              background: "rgba(4, 6, 14, 0.5)",
              backdropFilter: "blur(3px)",
              WebkitBackdropFilter: "blur(3px)",
              transition: "opacity 0.22s ease",
              opacity: settingsOpen ? 1 : 0,
            }}
          />

          {/* Drawer Sidebar */}
          <div
            ref={settingsDialogRef}
            id="floating-theme-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="floating-theme-dialog-title"
            aria-hidden={!settingsOpen}
            inert={!settingsOpen}
            tabIndex={-1}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              height: "100%",
              width: "min(366px, 100%)",
              zIndex: 91,
              background: "var(--bg-elev)",
              borderLeft: "1px solid var(--border)",
              boxShadow: "-30px 0 80px -30px rgba(0,0,0,.5)",
              transition: "transform 0.3s cubic-bezier(.22,1,.36,1)",
              transform: settingsOpen ? "translateX(0)" : "translateX(100%)",
              display: "flex",
              flexDirection: "column",
              padding: "26px 24px",
              overflowY: "auto",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "12px",
                marginBottom: "6px",
              }}
            >
              <div>
                <div id="floating-theme-dialog-title" style={{ fontSize: "19px", fontWeight: 800, letterSpacing: "-.01em" }}>테마 설정</div>
                <div style={{ fontSize: "13px", color: "var(--text-mute)", marginTop: "5px" }}>
                  사이트 어디서나 바로 적용돼요
                </div>
              </div>
              <button
                ref={settingsCloseRef}
                onClick={closeSettings}
                aria-label="닫기"
                className="hover-close-btn"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "9px",
                  border: "1px solid var(--border)",
                  background: "var(--bg-elev-2)",
                  color: "var(--text-dim)",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              </button>
            </div>

            {/* Mode selection */}
            <div style={{ marginTop: "28px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-dim)", marginBottom: "12px" }}>
                화면 모드
              </div>
              <div
                role="radiogroup"
                aria-label="화면 모드"
                style={{
                  display: "flex",
                  gap: "8px",
                  padding: "5px",
                  background: "var(--bg-elev-2)",
                  border: "1px solid var(--border)",
                  borderRadius: "13px",
                }}
              >
                <button
                  onClick={() => setMode("system")}
                  role="radio"
                  aria-checked={mode === "system"}
                  style={getSegBtnStyle(mode === "system")}
                >
                  시스템
                </button>
                <button
                  onClick={() => setMode("light")}
                  role="radio"
                  aria-checked={mode === "light"}
                  style={getSegBtnStyle(mode === "light")}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5z" />
                  </svg>
                  다크
                </button>
              </div>
            </div>

            {/* 모션 정책 */}
            <div style={{ marginTop: "28px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-dim)", marginBottom: "12px" }}>
                모션(애니메이션)
              </div>
              <div
                role="radiogroup"
                aria-label="모션 애니메이션"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: "6px",
                  padding: "5px",
                  background: "var(--bg-elev-2)",
                  border: "1px solid var(--border)",
                  borderRadius: "13px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setMotion("system")}
                  role="radio"
                  aria-checked={motion === "system"}
                  style={{ ...getSegBtnStyle(motion === "system"), padding: "10px 5px", fontSize: "12.5px" }}
                >
                  시스템 따름
                </button>
                <button
                  type="button"
                  onClick={() => setMotion("on")}
                  role="radio"
                  aria-checked={motion === "on"}
                  style={{ ...getSegBtnStyle(motion === "on"), padding: "10px 5px", fontSize: "12.5px" }}
                >
                  항상 켬
                </button>
                <button
                  type="button"
                  onClick={() => setMotion("off")}
                  role="radio"
                  aria-checked={motion === "off"}
                  style={{ ...getSegBtnStyle(motion === "off"), padding: "10px 5px", fontSize: "12.5px" }}
                >
                  항상 끔
                </button>
              </div>
              <div style={{ marginTop: "9px", fontSize: "11.5px", color: "var(--text-mute)", lineHeight: 1.5 }}>
                시스템 따름은 운영체제의 모션 줄이기 설정을 존중합니다.
              </div>
            </div>

            {/* Accent selection */}
            <div style={{ marginTop: "28px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "14px",
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-dim)" }}>포인트 컬러</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "var(--accent, #6366f1)" }}>
                  {ACCENTS[accent]?.label || "인디고"}
                </span>
              </div>
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
                        width: "46px",
                        height: "46px",
                        borderRadius: "50%",
                        border: "1px solid var(--border)",
                        cursor: "pointer",
                        display: "grid",
                        placeItems: "center",
                        background: meta.color,
                      }}
                    >
                      {active && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,.4))" }}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Animation selection */}
            <div style={{ marginTop: "28px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-dim)" }}>
                  플로팅 버튼 애니메이션
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "var(--accent, #6366f1)" }}>
                  {animLabels[fabAnim] || "솟아오르기"}
                </span>
              </div>
              <div role="radiogroup" aria-label="플로팅 버튼 애니메이션" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {animKeys.map((key) => {
                  const active = fabAnim === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setFabAnim(key)}
                      role="radio"
                      aria-checked={active}
                      style={{
                        padding: "11px 10px",
                        borderRadius: "10px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "background .18s, color .18s, border-color .18s",
                        background: active ? "var(--accent, #6366f1)" : "var(--bg-elev-2)",
                        color: active ? "var(--accent-contrast, #fff)" : "var(--text-dim)",
                        border: active ? "1px solid var(--accent, #6366f1)" : "1px solid var(--border)",
                      }}
                    >
                      {animLabels[key]}
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: "9px", fontSize: "11.5px", color: "var(--text-mute)", lineHeight: 1.5 }}>
                버튼을 열고 닫을 때 적용돼요. 닫을 땐 열기의 역순으로 재생됩니다.
              </div>
            </div>

            {/* Link to settings page */}
            <Link
              href="/settings"
              onClick={closeSettings}
              className="hover-btn-secondary"
              style={{
                marginTop: "22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                padding: "14px 16px",
                borderRadius: "12px",
                background: "var(--accent-soft, rgba(99, 102, 241, 0.14))",
                border: "1px solid var(--border)",
                textDecoration: "none",
                color: "var(--text)",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                <span
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "9px",
                    background: "var(--accent, #6366f1)",
                    color: "var(--accent-contrast, #fff)",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22a10 10 0 1 0-8-16 10 10 0 0 0 8 16c.9 0 1.5-.6 1.5-1.5 0-.4-.1-.8-.4-1.1l-1.2-1.2c-.3-.3-.5-.7-.5-1.1 0-.9.6-1.5 1.5-1.5h1.6c2.8 0 5-2.2 5-5 0-4.4-4-8-9-8z" />
                    <circle cx="7.5" cy="8.5" r="1.5" />
                    <circle cx="11.5" cy="6.5" r="1.5" />
                    <circle cx="8.5" cy="13.5" r="1.5" />
                    <circle cx="13.5" cy="14.5" r="1.5" />
                    <path d="M11 11 L17.5 4.5 A2.5 2.5 0 1 1 21 8 L14.5 14.5 Z" fill="var(--bg-elev)" />
                    <path d="M11 11 Q8 12 7 17 Q12 16 14.5 14.5 Z" fill="var(--bg-elev)" />
                    <path d="M11 11 L17.5 4.5 A2.5 2.5 0 1 1 21 8 L14.5 14.5 Z" />
                    <path d="M13 9 L16.5 12.5" />
                    <path d="M11 11 Q8 12 7 17 Q12 16 14.5 14.5 Z" fill="currentColor" />
                  </svg>
                </span>
                <span style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "14px", fontWeight: 700 }}>전체 설정 페이지</span>
                  <span style={{ fontSize: "12px", color: "var(--text-mute)" }}>더 많은 옵션 보기</span>
                </span>
              </span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-mute)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>

            {/* Reset settings */}
            <div style={{ marginTop: "30px", paddingTop: "22px", borderTop: "1px solid var(--border)" }}>
              <button
                onClick={resetTheme}
                className="hover-reset-btn"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "11px",
                  border: "1px solid var(--border-strong)",
                  background: "var(--bg-elev-2)",
                  color: "var(--text-dim)",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                  <path d="M3 4v4h4" />
                </svg>
                기본값으로 초기화
              </button>
            </div>

            {/* Footer notice */}
            <div style={{ marginTop: "auto", paddingTop: "24px", fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "var(--text-mute)", lineHeight: 1.6 }}>
              테마 설정은 이 브라우저에 저장되어<br />다음 방문에도 그대로 유지됩니다.
            </div>
          </div>
        </>
      )}
    </>
  );
}
