"use client";

/**
 * 테마·포인트 컬러·FAB 모션·배경 효과를 편집하는 설정 화면이다.
 * 영속화와 DOM 반영은 ThemeContext에 위임하고, 이 컴포넌트는 폼 표현과
 * 미리보기 재생 상태만 관리하는 Provider 소비자 역할을 맡는다.
 */
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme, ACCENTS, Accent, FabAnim } from "../../context/ThemeContext";

export default function SettingsPage() {
  const {
    mode,
    accent,
    motion,
    fabAnim,
    glow,
    setMode,
    setAccent,
    setMotion,
    setFabAnim,
    setGlow,
    resetTheme,
  } = useTheme();

  // 미리보기 전용 상태이며 실제 전역 FAB의 열림 상태와는 의도적으로 분리합니다.
  const [prevRender, setPrevRender] = useState(false);
  const [prevOpen, setPrevOpen] = useState(false);
  const [cycleKey, setCycleKey] = useState(0); // to manually trigger replay

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const shouldReduceMotion =
      motion === "off" || (motion === "system" && motionQuery.matches);

    if (shouldReduceMotion) {
      const frame = window.requestAnimationFrame(() => {
        setPrevRender(true);
        setPrevOpen(true);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    let c1: NodeJS.Timeout;
    let c2: NodeJS.Timeout;
    let u: NodeJS.Timeout;

    const openPreview = () => {
      clearTimeout(u);
      setPrevRender(true);
      setPrevOpen(true);
    };

    const closePreview = () => {
      setPrevOpen(false);
      clearTimeout(u);
      u = setTimeout(() => {
        setPrevRender(false);
      }, 580);
    };

    const cycle = () => {
      openPreview();
      c1 = setTimeout(() => {
        closePreview();
        c2 = setTimeout(cycle, 1150);
      }, 1550);
    };

    c2 = setTimeout(cycle, 350);

    return () => {
      clearTimeout(c1);
      clearTimeout(c2);
      clearTimeout(u);
    };
  }, [fabAnim, motion, cycleKey]);

  const handleReplay = () => {
    setCycleKey((k) => k + 1);
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
  const animKeys: FabAnim[] = ["rise", "slide", "pop", "fade"];

  const animLabels: Record<FabAnim, string> = {
    rise: "솟아오르기",
    slide: "슬라이드",
    pop: "팝",
    fade: "페이드",
  };

  const animDescs: Record<FabAnim, string> = {
    rise: "아래에서 위로 솟아오름",
    slide: "오른쪽에서 미끄러져 등장",
    pop: "작게 톡 튀어나옴",
    fade: "부드럽게 페이드 인",
  };

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
            href="/"
            className="hover-footer-link"
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
            SW Song
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
            테마와 플로팅 버튼 동작을 원하는 대로 맞춰보세요. 변경 사항은 즉시 저장되어 사이트 전체에 적용됩니다.
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
              기본값인 시스템 따름은 운영체제의 모션 줄이기 설정을 존중합니다.
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

          {/* FAB Animation & Preview */}
          <section style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: "18px", padding: "clamp(20px, 3vw, 28px)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "4px" }}>
              <span style={{ fontSize: "16px", fontWeight: 700 }}>플로팅 버튼 애니메이션</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px", color: "var(--accent, #6366f1)", whiteSpace: "nowrap" }}>
                {animLabels[fabAnim] || "솟아오르기"}
              </span>
            </div>
            <div style={{ fontSize: "13.5px", color: "var(--text-mute)", marginBottom: "18px" }}>
              우하단 버튼을 열고 닫을 때의 효과예요. 닫을 땐 열기의 역순으로 재생됩니다.
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "stretch" }}>
              {/* Animation select cards */}
              <div role="radiogroup" aria-label="플로팅 버튼 애니메이션" style={{ flex: "1 1 280px", minWidth: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", alignContent: "start" }}>
                {animKeys.map((key) => {
                  const active = fabAnim === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setFabAnim(key)}
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
                        <span style={{ fontSize: "14.5px", fontWeight: 700, whiteSpace: "nowrap" }}>{animLabels[key]}</span>
                        {active && (
                          <span style={{ width: "18px", height: "18px", borderRadius: "50%", background: "var(--accent, #6366f1)", color: "var(--accent-contrast, #fff)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                        )}
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--text-mute)", lineHeight: 1.45 }}>{animDescs[key]}</span>
                    </button>
                  );
                })}
              </div>

              {/* Preview mock window */}
              <div
                style={{
                  flex: "1 1 240px",
                  minWidth: 0,
                  position: "relative",
                  border: "1px solid var(--border)",
                  borderRadius: "14px",
                  background: "linear-gradient(160deg, var(--accent-soft, rgba(99,102,241,.12)), var(--bg-elev-2))",
                  overflow: "hidden",
                  minHeight: "300px",
                }}
              >
                <div style={{ position: "absolute", left: "14px", top: "13px", fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", letterSpacing: ".12em", color: "var(--text-mute)" }}>
                  PREVIEW
                </div>
                <button
                  onClick={handleReplay}
                  aria-label="플로팅 버튼 애니메이션 미리보기 재생"
                  className="hover-reset-btn"
                  style={{
                    position: "absolute",
                    left: "12px",
                    bottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 12px",
                    borderRadius: "9px",
                    border: "1px solid var(--border-strong)",
                    background: "var(--bg-elev)",
                    color: "var(--text-dim)",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="6 4 20 12 6 20 6 4" />
                  </svg>
                  재생
                </button>
                
                {/* Simulated FAB list items */}
                <div style={{ position: "absolute", right: "18px", bottom: "18px", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "9px" }}>
                  {prevRender && (
                    <div data-fab={prevOpen ? "open" : "closing"} data-anim={fabAnim} style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "9px" }}>
                      <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "var(--bg-elev)", border: "1px solid var(--border-strong)", boxShadow: "var(--shadow)", display: "grid", placeItems: "center" }}>
                        <span style={{ width: "13px", height: "13px", borderRadius: "4px", background: "var(--accent, #6366f1)", opacity: 0.8 }} />
                      </div>
                      <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "var(--bg-elev)", border: "1px solid var(--border-strong)", boxShadow: "var(--shadow)", display: "grid", placeItems: "center" }}>
                        <span style={{ width: "13px", height: "13px", borderRadius: "4px", background: "var(--accent, #6366f1)", opacity: 0.8 }} />
                      </div>
                      <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "var(--bg-elev)", border: "1px solid var(--border-strong)", boxShadow: "var(--shadow)", display: "grid", placeItems: "center" }}>
                        <span style={{ width: "13px", height: "13px", borderRadius: "4px", background: "var(--accent, #6366f1)", opacity: 0.8 }} />
                      </div>
                      <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "var(--bg-elev)", border: "1px solid var(--border-strong)", boxShadow: "var(--shadow)", display: "grid", placeItems: "center" }}>
                        <span style={{ width: "13px", height: "13px", borderRadius: "4px", background: "var(--accent, #6366f1)", opacity: 0.8 }} />
                      </div>
                      <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "var(--bg-elev)", border: "1px solid var(--border-strong)", boxShadow: "var(--shadow)", display: "grid", placeItems: "center" }}>
                        <span style={{ width: "13px", height: "13px", borderRadius: "4px", background: "var(--accent, #6366f1)", opacity: 0.8 }} />
                      </div>
                    </div>
                  )}
                  {/* Mock FAB core button */}
                  <div
                    style={{
                      width: "46px",
                      height: "46px",
                      borderRadius: "50%",
                      background: "var(--accent, #6366f1)",
                      color: "var(--accent-contrast, #fff)",
                      display: "grid",
                      placeItems: "center",
                      boxShadow: "0 14px 30px -10px var(--accent-soft, rgba(99,102,241,.7))",
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12a8 8 0 0 1 16 0" />
                      <rect x="3" y="12" width="3.6" height="6" rx="1.6" />
                      <rect x="17.4" y="12" width="3.6" height="6" rx="1.6" />
                      <path d="M20 18a3 3 0 0 1-3 3h-3" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
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

          {/* Reset Notice */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between", padding: "6px 4px" }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px", color: "var(--text-mute)", lineHeight: 1.6 }}>
              설정은 이 브라우저에 저장되어
              <br />
              다음 방문에도 유지됩니다.
            </span>
            <button
              onClick={resetTheme}
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
              기본값으로 초기화
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
