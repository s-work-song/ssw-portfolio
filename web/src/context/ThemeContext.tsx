"use client";

/**
 * 색상 모드와 포트폴리오 전용 테마 옵션을 전역에 공급하는 컨텍스트 모듈이다.
 * next-themes에는 light/dark/system 적용을 위임하고, 포인트 컬러·모션 정책·
 * 페이지 전환·플로팅 버튼 모드·글로우는 이 Provider가 영속화한다. 소비자는 저장소나 DOM 구현을 몰라도 되는
 * Provider 패턴이며, ThemeContextType이 읽기/변경 계약을 한곳에 고정한다(DIP).
 */
import React, { createContext, useContext, useState, useEffect } from "react";
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";

export type Mode = "dark" | "light" | "system";
export type Accent = "indigo" | "emerald" | "amber" | "rose" | "violet";
export type FabMode = "chat" | "quick-menu";
export type FabAnim = "none" | "rise" | "slide" | "pop" | "blur";
export type MotionPreference = "system" | "on" | "off";
export type PageTransition = "none" | "slide" | "fade" | "lift";
export type ChatLayout = "floating" | "dock";

export const CHAT_DOCK_MIN_WIDTH = 340;
export const CHAT_DOCK_MAX_WIDTH = 640;
export const CHAT_DOCK_DEFAULT_WIDTH = 440;

function normalizeChatDockWidth(width: number): number {
  if (!Number.isFinite(width)) return CHAT_DOCK_DEFAULT_WIDTH;
  return Math.round(
    Math.min(CHAT_DOCK_MAX_WIDTH, Math.max(CHAT_DOCK_MIN_WIDTH, width)),
  );
}

export interface ThemeContextType {
  mode: Mode;
  accent: Accent;
  motion: MotionPreference;
  pageTransition: PageTransition;
  fabMode: FabMode;
  fabAnim: FabAnim;
  chatLayout: ChatLayout;
  chatDockWidth: number;
  glow: boolean;
  setMode: (m: Mode) => void;
  setAccent: (a: Accent) => void;
  setMotion: (m: MotionPreference) => void;
  setPageTransition: (transition: PageTransition) => void;
  setFabMode: (mode: FabMode) => void;
  setFabAnim: (animation: FabAnim) => void;
  setChatLayout: (layout: ChatLayout) => void;
  setChatDockWidth: (width: number) => void;
  setGlow: (g: boolean) => void;
  resetTheme: () => void;
}

export const ACCENTS = {
  indigo: { color: "#6366f1", color2: "#818cf8", soft: "rgba(99,102,241,0.14)", contrast: "#ffffff", label: "인디고" },
  emerald: { color: "#059669", color2: "#34d399", soft: "rgba(16,185,129,0.14)", contrast: "#ffffff", label: "에메랄드" },
  amber: { color: "#d97706", color2: "#fbbf24", soft: "rgba(217,119,6,0.15)", contrast: "#2a1602", label: "앰버" },
  rose: { color: "#e11d48", color2: "#fb7185", soft: "rgba(225,29,72,0.14)", contrast: "#ffffff", label: "로즈" },
  violet: { color: "#7c3aed", color2: "#a78bfa", soft: "rgba(124,58,237,0.14)", contrast: "#ffffff", label: "바이올렛" },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function CustomThemeProvider({ children }: { children: React.ReactNode }) {
  const { setTheme } = useNextTheme();
  const [mode, setModeState] = useState<Mode>("system");
  const [accent, setAccentState] = useState<Accent>("indigo");
  // 기본값 "항상 켬": OS 모션 줄이기와 무관하게 사이트 연출을 보여주고,
  // 원치 않는 방문자가 설정에서 시스템 따름/끔을 선택한다 (2026-07-27 결정).
  const [motion, setMotionState] = useState<MotionPreference>("on");
  const [pageTransition, setPageTransitionState] =
    useState<PageTransition>("fade");
  const [fabMode, setFabModeState] = useState<FabMode>("chat");
  const [fabAnim, setFabAnimState] = useState<FabAnim>("slide");
  const [chatLayout, setChatLayoutState] =
    useState<ChatLayout>("floating");
  const [chatDockWidth, setChatDockWidthState] = useState(
    CHAT_DOCK_DEFAULT_WIDTH,
  );
  const [glow, setGlowState] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  // Load initial custom settings from localStorage on client side
  /* eslint-disable react-hooks/set-state-in-effect --
   * This effect intentionally synchronizes React state from the browser's
   * persistent theme store after hydration.
   */
  useEffect(() => {
    try {
      const s = localStorage.getItem("swork-theme-custom");
      const storedMode = localStorage.getItem("theme");
      if (storedMode === "light" || storedMode === "dark" || storedMode === "system") {
        setModeState(storedMode);
      }
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed.accent) setAccentState(parsed.accent);
        // motion은 v2 스키마부터 신뢰한다. 버전 없는 블롭은 기본값이 "시스템 따름"이던
        // 구 사이트의 자동 저장이라 사용자의 명시적 선택으로 보지 않고, 새 기본값
        // "항상 켬"을 유지한 채 마이그레이션한다 (2026-07-27 결정).
        if (
          (parsed.v === 2 ||
            parsed.v === 3 ||
            parsed.v === 4 ||
            parsed.v === 5 ||
            parsed.v === 6 ||
            parsed.v === 7) &&
          (parsed.motion === "system" || parsed.motion === "on" || parsed.motion === "off")
        ) {
          setMotionState(parsed.motion);
        }
        if (
          (parsed.v === 3 ||
            parsed.v === 4 ||
            parsed.v === 5 ||
            parsed.v === 6 ||
            parsed.v === 7) &&
          (parsed.fabMode === "chat" || parsed.fabMode === "quick-menu")
        ) {
          setFabModeState(parsed.fabMode);
        }
        // v2에서 미리보기 전용이었던 선택값도 실제 빠른 메뉴 연출로 승격해 복원한다.
        if (
          (parsed.v === 2 ||
            parsed.v === 4 ||
            parsed.v === 5 ||
            parsed.v === 6 ||
            parsed.v === 7) &&
          (parsed.fabAnim === "none" ||
            parsed.fabAnim === "rise" ||
            parsed.fabAnim === "slide" ||
            parsed.fabAnim === "pop" ||
            parsed.fabAnim === "blur" ||
            parsed.fabAnim === "fade")
        ) {
          setFabAnimState(parsed.fabAnim === "fade" ? "blur" : parsed.fabAnim);
        }
        if (
          (parsed.v === 5 || parsed.v === 6 || parsed.v === 7) &&
          (parsed.pageTransition === "none" ||
            parsed.pageTransition === "slide" ||
            parsed.pageTransition === "fade" ||
            parsed.pageTransition === "lift")
        ) {
          setPageTransitionState(parsed.pageTransition);
        }
        if (
          (parsed.v === 6 || parsed.v === 7) &&
          (parsed.chatLayout === "floating" || parsed.chatLayout === "dock")
        ) {
          setChatLayoutState(parsed.chatLayout);
        }
        if (parsed.v === 7 && typeof parsed.chatDockWidth === "number") {
          setChatDockWidthState(
            normalizeChatDockWidth(parsed.chatDockWidth),
          );
        }
        if (typeof parsed.glow === "boolean") setGlowState(parsed.glow);
      }
    } catch (e) {
      console.error("Failed to load custom theme from localStorage", e);
    }
    setMounted(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const applyCustomTheme = (a: Accent) => {
    if (typeof window === "undefined") return;
    const r = document.documentElement.style;
    const aColors = ACCENTS[a] || ACCENTS.indigo;

    r.setProperty("--accent", aColors.color);
    r.setProperty("--accent-2", aColors.color2);
    r.setProperty("--accent-soft", aColors.soft);
    r.setProperty("--accent-contrast", aColors.contrast);
  };

  // Sync settings with DOM variables and localStorage
  useEffect(() => {
    if (!mounted) return;
    applyCustomTheme(accent);
    document.documentElement.dataset.motion = motion;
    document.documentElement.style.setProperty(
      "--chat-dock-width",
      `${chatDockWidth}px`,
    );
    
    try {
      localStorage.setItem(
        "swork-theme-custom",
        JSON.stringify({
          v: 7,
          accent,
          motion,
          pageTransition,
          fabMode,
          fabAnim,
          chatLayout,
          chatDockWidth,
          glow,
        })
      );
    } catch (e) {
      console.error("Failed to save custom theme to localStorage", e);
    }
  }, [
    accent,
    motion,
    pageTransition,
    fabMode,
    fabAnim,
    chatLayout,
    chatDockWidth,
    glow,
    mounted,
  ]);

  const setMode = (m: Mode) => {
    setModeState(m);
    setTheme(m);
  };
  const setAccent = (a: Accent) => setAccentState(a);
  const setMotion = (m: MotionPreference) => setMotionState(m);
  const setPageTransition = (transition: PageTransition) =>
    setPageTransitionState(transition);
  const setFabMode = (nextMode: FabMode) => setFabModeState(nextMode);
  const setFabAnim = (animation: FabAnim) => setFabAnimState(animation);
  const setChatLayout = (layout: ChatLayout) =>
    setChatLayoutState(layout);
  const setChatDockWidth = (width: number) =>
    setChatDockWidthState(normalizeChatDockWidth(width));
  const setGlow = (g: boolean) => setGlowState(g);
  
  const resetTheme = () => {
    setModeState("system");
    setTheme("system");
    setAccentState("indigo");
    setMotionState("on");
    setPageTransitionState("fade");
    setFabModeState("chat");
    setFabAnimState("slide");
    setChatLayoutState("floating");
    setChatDockWidthState(CHAT_DOCK_DEFAULT_WIDTH);
    setGlowState(true);
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        accent,
        motion,
        pageTransition,
        fabMode,
        fabAnim,
        chatLayout,
        chatDockWidth,
        glow,
        setMode,
        setAccent,
        setMotion,
        setPageTransition,
        setFabMode,
        setFabAnim,
        setChatLayout,
        setChatDockWidth,
        setGlow,
        resetTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider defaultTheme="system" enableSystem attribute="data-theme">
      <CustomThemeProvider>{children}</CustomThemeProvider>
    </NextThemesProvider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
