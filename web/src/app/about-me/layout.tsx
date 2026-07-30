"use client";

/**
 * About 하위 라우트가 공유하는 제목·탭 탐색·설정 진입 셸이다.
 * usePathname으로 현재 경로만 판별하며, 각 페이지의 본문이나 콘텐츠 데이터는
 * 알지 않도록 탐색 책임을 제한한다(SRP).
 */
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '../../context/ThemeContext';

const PAGE_EXIT_DURATION_MS = 150;

export default function AboutMeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { motion, pageTransition } = useTheme();
  const [transitionDirection, setTransitionDirection] = React.useState<
    'forward' | 'backward'
  >('forward');
  const [exitingPath, setExitingPath] = React.useState<string | null>(null);
  const navigationTimerRef = React.useRef(0);

  const tabs = [
    { label: "소개 (Overview)", shortLabel: "소개", href: "/about-me" },
    { label: "이력서 (Resume)", shortLabel: "이력서", href: "/about-me/resume" },
    { label: "자기소개서 (Cover Letter)", shortLabel: "자기소개서", href: "/about-me/cover-letter" },
    { label: "연구 경험 (Research)", shortLabel: "연구", href: "/about-me/research" },
    { label: "기록 (Log)", shortLabel: "기록", href: "/about-me/log" },
  ];

  const normalizePath = (path: string) =>
    path.length > 1 ? path.replace(/\/+$/, "") : path;
  const currentPath = normalizePath(pathname);

  /** 중첩 로그 경로까지 올바르게 활성화하되 Overview는 정확히 일치할 때만 선택한다. */
  const isActive = (href: string) => {
    const normalizedHref = normalizePath(href);
    if (href === "/about-me") {
      return currentPath === normalizedHref;
    }
    return currentPath.startsWith(normalizedHref);
  };

  const tabIndexForPath = (path: string) =>
    tabs.findIndex((tab, index) =>
      index === 0
        ? normalizePath(path) === tab.href
        : normalizePath(path).startsWith(tab.href),
    );
  React.useEffect(() => {
    window.clearTimeout(navigationTimerRef.current);
    navigationTimerRef.current = 0;
  }, [pathname]);

  React.useEffect(
    () => () => {
      window.clearTimeout(navigationTimerRef.current);
    },
    [],
  );

  const navigateTab = (
    event: React.MouseEvent<HTMLAnchorElement>,
    targetPath: string,
  ) => {
    const currentTabIndex = tabIndexForPath(pathname);
    const targetTabIndex = tabIndexForPath(targetPath);
    const nextDirection =
      targetTabIndex >= currentTabIndex ? 'forward' : 'backward';
    setTransitionDirection(nextDirection);

    const modifiedClick =
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey;
    const reduceMotion =
      motion === 'off' ||
      (motion === 'system' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (
      modifiedClick ||
      normalizePath(targetPath) === currentPath ||
      pageTransition === 'none' ||
      reduceMotion
    ) {
      return;
    }

    event.preventDefault();
    setExitingPath(pathname);
    navigationTimerRef.current = window.setTimeout(() => {
      router.push(targetPath);
    }, PAGE_EXIT_DURATION_MS);
  };

  const pageTransitionClassName = [
    'about-page-content',
    pageTransition !== 'none'
      ? `about-page-transition-${pageTransition}`
      : '',
    exitingPath === pathname ? 'about-page-content-exiting' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="about-me-container">
      <header className="about-header">
        {/* Left: Title */}
        <div className="about-header-title">
          <Link
            href="/about-me"
            className="about-title-link"
            onClick={(event) => navigateTab(event, "/about-me")}
            aria-label="소개 페이지 개요로 이동"
          >
            <h1 className="about-title" style={{
              fontWeight: 700,
              color: 'var(--text)',
              margin: 0,
              lineHeight: 1.1,
              letterSpacing: '-0.02em'
            }}>
              소개 페이지
            </h1>
          </Link>
        </div>

        {/* Right: Settings and Tabs */}
        <div className="about-header-right">
          <Link
            href="/settings"
            className="about-settings-link about-settings-link-top"
            aria-label="사이트 설정"
            title="사이트 설정"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>

          {/* Tabs on the right */}
          <div className="about-header-nav-row">
            <nav className="about-header-nav">
              {tabs.map((tab) => {
                const active = isActive(tab.href);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    onClick={(event) => navigateTab(event, tab.href)}
                    className={`about-subnav-link${active ? ' active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className="about-tab-label-full">{tab.label}</span>
                    <span className="about-tab-label-short">{tab.shortLabel}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>
      <div className="about-page-transition-viewport">
        <main
          key={pathname}
          className={pageTransitionClassName}
          data-page-transition={pageTransition}
          data-page-direction={transitionDirection}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
