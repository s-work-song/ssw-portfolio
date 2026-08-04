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
import {
  CHAT_ACTION_NAVIGATE_EVENT,
  CHAT_ACTION_PAGE_ENTERED_EVENT,
  aboutTabPathFromPath,
  normalizeNavigationPath,
  pathWithoutHash,
  type ChatActionNavigateDetail,
  type ChatActionPageEnteredDetail,
} from '../../features/chat/navigation';

const PAGE_EXIT_DURATION_MS = 150;
const PAGE_ENTRY_FALLBACK_MS = 600;
const CHAT_ACTION_TAB_ATTRACTION_MS = 240;

const ABOUT_TABS = [
  { label: "소개 (Overview)", shortLabel: "소개", href: "/about-me" },
  { label: "이력서 (Resume)", shortLabel: "이력서", href: "/about-me/resume" },
  { label: "자기소개서 (Cover Letter)", shortLabel: "자기소개서", href: "/about-me/cover-letter" },
  { label: "연구 경험 (Research)", shortLabel: "연구", href: "/about-me/research" },
  { label: "기록 (Log)", shortLabel: "기록", href: "/about-me/log" },
] as const;

function tabIndexForPath(path: string): number {
  const tabPath = aboutTabPathFromPath(path);
  return ABOUT_TABS.findIndex((tab) => tab.href === tabPath);
}

function announceChatActionPageEntry(path: string): void {
  window.dispatchEvent(
    new CustomEvent<ChatActionPageEnteredDetail>(
      CHAT_ACTION_PAGE_ENTERED_EVENT,
      { detail: { path } },
    ),
  );
}

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
  const [actionTargetTab, setActionTargetTab] = React.useState<string | null>(
    null,
  );
  const navigationTimerRef = React.useRef(0);
  const entryTimerRef = React.useRef(0);
  const actionAttractionTimerRef = React.useRef(0);
  const currentPath = normalizeNavigationPath(pathname);
  const [settledPath, setSettledPath] = React.useState(currentPath);

  /** 중첩 로그 경로까지 올바르게 활성화하되 Overview는 정확히 일치할 때만 선택한다. */
  const isActive = (href: string) => {
    const normalizedHref = normalizeNavigationPath(href);
    if (href === "/about-me") {
      return currentPath === normalizedHref;
    }
    return currentPath.startsWith(normalizedHref);
  };

  const completePageEntry = React.useCallback(() => {
    if (exitingPath === pathname || settledPath === currentPath) return;
    window.clearTimeout(entryTimerRef.current);
    entryTimerRef.current = 0;
    setSettledPath(currentPath);
    announceChatActionPageEntry(currentPath);
  }, [currentPath, exitingPath, pathname, settledPath]);

  React.useEffect(() => {
    window.clearTimeout(navigationTimerRef.current);
    navigationTimerRef.current = 0;

    window.clearTimeout(entryTimerRef.current);
    if (settledPath === currentPath) {
      entryTimerRef.current = 0;
      return;
    }

    entryTimerRef.current = window.setTimeout(() => {
      setSettledPath(currentPath);
      entryTimerRef.current = 0;
      announceChatActionPageEntry(currentPath);
    }, PAGE_ENTRY_FALLBACK_MS);
  }, [currentPath, settledPath]);

  React.useEffect(
    () => () => {
      window.clearTimeout(navigationTimerRef.current);
      window.clearTimeout(entryTimerRef.current);
      window.clearTimeout(actionAttractionTimerRef.current);
    },
    [],
  );

  const reduceMotion = React.useCallback(
    () =>
      motion === 'off' ||
      (motion === 'system' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches),
    [motion],
  );

  const startTabNavigation = React.useCallback(
    (targetRoute: string, scroll: boolean) => {
      const targetPath = pathWithoutHash(targetRoute);
      const currentTabIndex = tabIndexForPath(pathname);
      const targetTabIndex = tabIndexForPath(targetPath);
      if (currentTabIndex >= 0 && targetTabIndex >= 0) {
        setTransitionDirection(
          targetTabIndex >= currentTabIndex ? 'forward' : 'backward',
        );
      }

      if (pageTransition === 'none' || reduceMotion()) {
        setActionTargetTab(null);
        router.push(targetRoute, { scroll });
        return;
      }

      setExitingPath(pathname);
      window.clearTimeout(navigationTimerRef.current);
      navigationTimerRef.current = window.setTimeout(() => {
        setExitingPath(null);
        setActionTargetTab(null);
        router.push(targetRoute, { scroll });
      }, PAGE_EXIT_DURATION_MS);
    },
    [pageTransition, pathname, reduceMotion, router],
  );

  React.useEffect(() => {
    const handleChatActionNavigation = (rawEvent: Event) => {
      const event = rawEvent as CustomEvent<ChatActionNavigateDetail>;
      const route = event.detail?.route;
      if (!route) return;

      const targetPath = pathWithoutHash(route);
      const targetTabPath = aboutTabPathFromPath(targetPath);
      if (!targetTabPath) return;

      event.preventDefault();
      window.clearTimeout(actionAttractionTimerRef.current);

      if (
        !event.detail.attractTab ||
        pageTransition === 'none' ||
        reduceMotion()
      ) {
        setActionTargetTab(null);
        startTabNavigation(route, false);
        return;
      }

      setActionTargetTab(targetTabPath);
      window.requestAnimationFrame(() => {
        const targetTab = document.querySelector<HTMLElement>(
          `[data-about-tab-path="${targetTabPath}"]`,
        );
        targetTab?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      });
      actionAttractionTimerRef.current = window.setTimeout(() => {
        actionAttractionTimerRef.current = 0;
        startTabNavigation(route, false);
      }, CHAT_ACTION_TAB_ATTRACTION_MS);
    };

    window.addEventListener(
      CHAT_ACTION_NAVIGATE_EVENT,
      handleChatActionNavigation,
    );
    return () =>
      window.removeEventListener(
        CHAT_ACTION_NAVIGATE_EVENT,
        handleChatActionNavigation,
      );
  }, [pageTransition, reduceMotion, startTabNavigation]);

  const navigateTab = (
    event: React.MouseEvent<HTMLAnchorElement>,
    targetPath: string,
  ) => {
    const modifiedClick =
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey;
    if (
      modifiedClick ||
      normalizeNavigationPath(targetPath) === currentPath ||
      pageTransition === 'none' ||
      reduceMotion()
    ) {
      return;
    }

    event.preventDefault();
    startTabNavigation(targetPath, true);
  };

  const pageTransitionClassName = [
    'about-page-content',
    pageTransition !== 'none' && settledPath !== currentPath
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
              {ABOUT_TABS.map((tab) => {
                const active = isActive(tab.href);
                const actionTarget = actionTargetTab === tab.href;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    onClick={(event) => navigateTab(event, tab.href)}
                    className={`about-subnav-link${active ? ' active' : ''}`}
                    data-about-tab-path={tab.href}
                    data-chat-action-tab-target={
                      actionTarget ? 'true' : undefined
                    }
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
          onAnimationEnd={(event) => {
            if (event.currentTarget === event.target) completePageEntry();
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
