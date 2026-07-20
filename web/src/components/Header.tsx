"use client";

/**
 * 홈의 전역 탐색, 모바일 메뉴, 읽기 진행률을 담당하는 클라이언트 헤더다.
 * 실제 스크롤 계산은 lib/scrollUtils에 위임하고, 주입 가능한 navItems 계약으로
 * 기본 메뉴와 다른 메뉴 구성을 같은 표현 컴포넌트로 확장할 수 있게 한다(OCP·ISP).
 */
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { handleSmoothScroll, scrollToTopSmoothly } from "../lib/scrollUtils";
import { usePathname } from "next/navigation";

interface HeaderProps {
  navItems?: { label: string; href: string }[];
}

export default function Header({ navItems }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const pathname = usePathname();

  const items = navItems || [
    { label: "소개", href: "#about" },
    { label: "집중 분야", href: "#focus" },
    { label: "연구", href: "#research" },
    { label: "더 보기", href: "#explore" },
  ];

  /** 현재 라우트에 따라 해시 스크롤과 일반 라우팅 중 올바른 탐색 전략을 선택한다. */
  const onSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setMenuOpen(false);
    
    // 홈 밖의 해시 링크는 브라우저가 /#... 경로로 이동한 뒤 대상 위치를 복원하게 둡니다.
    if (href.startsWith("#") && pathname !== "/") return;
    
    handleSmoothScroll(e, href);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!progressRef.current) return;
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight || 1;
      const p = Math.min(1, Math.max(0, (window.scrollY || 0) / max));
      progressRef.current.style.width = `${(p * 100).toFixed(2)}%`;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [menuOpen]);

  return (
    <>
      {/* Scroll Progress Bar */}
      <div
        ref={progressRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "3px",
          width: 0,
          background: "linear-gradient(90deg, var(--accent, #6366f1), var(--accent-2, #818cf8))",
          zIndex: 60,
          transition: "width .12s linear",
        }}
      />

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          background: "var(--nav-bg, rgba(10,11,18,0.72))",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1180px",
            margin: "0 auto",
            padding: "0 clamp(20px, 5vw, 40px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "66px",
            gap: "16px",
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            onClick={(e) => {
              if (window.location.pathname === "/") {
                e.preventDefault();
                scrollToTopSmoothly();
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "11px",
              textDecoration: "none",
              color: "var(--text)",
            }}
          >
            <span
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "9px",
                background: "var(--accent, #6366f1)",
                color: "var(--accent-contrast, #fff)",
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "17px",
                boxShadow: "0 8px 22px -8px var(--accent-soft, rgba(99, 102, 241, 0.5))",
              }}
            >
              S
            </span>
            <span
              style={{
                display: "flex",
                flexDirection: "column",
                lineHeight: 1.05,
              }}
            >
              <span style={{ fontWeight: 800, fontSize: "16px", letterSpacing: "-.01em" }}>
                송<span style={{ color: "var(--text-dim)", fontWeight: 600 }}>상운</span>
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "9px",
                  letterSpacing: ".24em",
                  color: "var(--text-mute)",
                }}
              >
                SOFTWARE ENGINEER
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav data-nav="desktop" style={{ alignItems: "center", gap: "4px" }}>
            {items.map((item, index) => {
              const finalHref = item.href.startsWith("#") && pathname !== "/" ? `/${item.href}` : item.href;
              return (
                <a
                  key={index}
                  href={finalHref}
                  onClick={(e) => onSmoothScroll(e, item.href)}
                  className="hover-nav-link"
                  style={{
                    padding: "8px 13px",
                    borderRadius: "9px",
                    fontSize: "14.5px",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    color: "var(--text-dim)",
                    textDecoration: "none",
                  }}
                >
                  {item.label}
                </a>
              );
            })}
            <Link
              href="/about-me/resume"
              onClick={() => setMenuOpen(false)}
              className="hover-btn-primary"
              style={{
                marginLeft: "10px",
                padding: "10px 17px",
                borderRadius: "10px",
                background: "var(--accent, #6366f1)",
                color: "var(--accent-contrast, #fff)",
                fontSize: "14px",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              이력서 보기
            </Link>
          </nav>

          {/* Compact Toggle Button */}
          <button
            ref={menuButtonRef}
            data-nav="compact"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={menuOpen}
            aria-controls="compact-navigation-menu"
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              border: "1px solid var(--border-strong)",
              background: "var(--bg-elev)",
              color: "var(--text)",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>

        {/* Compact Dropdown Menu */}
        <div
          id="compact-navigation-menu"
          data-nav="menu"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            width: "100%",
            borderTop: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-elev)",
            padding: "12px 0 18px",
            transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
            opacity: menuOpen ? 1 : 0,
            transform: menuOpen ? "translateY(0)" : "translateY(-15px)",
            visibility: menuOpen ? "visible" : "hidden",
            pointerEvents: menuOpen ? "auto" : "none",
            boxShadow: "var(--shadow)",
          }}
        >
          <nav
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "16px clamp(20px, 5vw, 40px)",
              gap: "12px",
            }}
          >
            {items.map((item, index) => {
              const finalHref = item.href.startsWith("#") && pathname !== "/" ? `/${item.href}` : item.href;
              return (
                <a
                  key={index}
                  href={finalHref}
                  onClick={(e) => onSmoothScroll(e, item.href)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "12px",
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "var(--text)",
                    textDecoration: "none",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {item.label}
                </a>
              );
            })}
            <Link
              href="/about-me/resume"
              onClick={() => setMenuOpen(false)}
              className="hover-btn-primary"
              style={{
                marginTop: "8px",
                padding: "14px",
                borderRadius: "11px",
                textAlign: "center",
                background: "var(--accent, #6366f1)",
                color: "var(--accent-contrast, #fff)",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              이력서 보기
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}
