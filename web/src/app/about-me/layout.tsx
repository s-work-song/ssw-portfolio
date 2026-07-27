"use client";

/**
 * About 하위 라우트가 공유하는 제목·뒤로가기·탭 탐색·설정 진입 셸이다.
 * usePathname으로 현재 경로만 판별하며, 각 페이지의 본문이나 콘텐츠 데이터는
 * 알지 않도록 탐색 책임을 제한한다(SRP).
 */
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AboutMeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { label: "소개 (Overview)", shortLabel: "소개", href: "/about-me" },
    { label: "이력서 (Resume)", shortLabel: "이력서", href: "/about-me/resume" },
    { label: "자기소개서 (Cover Letter)", shortLabel: "자기소개서", href: "/about-me/cover-letter" },
    { label: "연구 경험 (Research)", shortLabel: "연구", href: "/about-me/research" },
    { label: "기록 (Log)", shortLabel: "기록", href: "/about-me/log" },
  ];

  /** 중첩 로그 경로까지 올바르게 활성화하되 Overview는 정확히 일치할 때만 선택한다. */
  const isActive = (href: string) => {
    if (href === "/about-me") {
      return pathname === "/about-me";
    }
    return pathname?.startsWith(href) ?? false;
  };

  return (
    <div className="about-me-container">
      <header className="about-header">
        {/* Left: Title */}
        <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '4px' }}>
          <h1 className="about-title" style={{
            fontWeight: 700,
            color: 'var(--text)',
            margin: 0,
            lineHeight: 1.1,
            letterSpacing: '-0.02em'
          }}>
            저에 대하여
          </h1>
        </div>

        {/* Right: Back Link and Tabs */}
        <div className="about-header-right" style={{ gap: '22px' }}>
          
          {/* Back to Home Link */}
          <Link 
            href="/" 
            title="메인 페이지로 이동"
            className="about-back-link"
          >
            <span style={{ fontSize: '14px' }}>←</span>
            <span>Home</span>
          </Link>

          {/* Tabs on the right, with the settings entry pinned outside the scroll area */}
          <div className="about-header-nav-row">
            <nav className="about-header-nav">
              {tabs.map((tab) => {
                const active = isActive(tab.href);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`about-subnav-link${active ? ' active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className="about-tab-label-full">{tab.label}</span>
                    <span className="about-tab-label-short">{tab.shortLabel}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Settings entry point */}
            <Link
              href="/settings"
              className="about-settings-link"
              aria-label="사이트 설정"
              title="사이트 설정"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </Link>
          </div>
        </div>
      </header>
      <main>
        {children}
      </main>
    </div>
  );
}
