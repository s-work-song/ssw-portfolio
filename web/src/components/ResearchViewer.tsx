"use client";

/**
 * 연구 화면의 상태·탭·본문·후속 CTA를 조합하는 얇은 조정자 컴포넌트다.
 * 상태는 useResearchTabs, 탐색은 ResearchTabs, 본문은 ResearchPanels에 위임해
 * 변경 이유를 분리한다(SRP). 선택된 탭 ID를 독립된 뷰 전략에 전달하는
 * 상태 기반 Strategy 패턴을 사용한다.
 */
import Link from 'next/link';
import React from 'react';
import {
  researchOptimizationTabs,
  researchPrimaryTabFromTab,
  researchPrimaryTabs,
  researchTabs,
  type ResearchTabId,
} from '@/data/research';
import ResearchPanels from '@/components/research/ResearchPanels';
import ResearchTabs from '@/components/research/ResearchTabs';
import { useResearchTabs } from '@/components/research/useResearchTabs';
import { useTheme } from '@/context/ThemeContext';

const RESEARCH_PANEL_EXIT_DURATION_MS = 150;
const RESEARCH_PANEL_ENTRY_FALLBACK_MS = 600;
const RESEARCH_TAB_ATTRACTION_MS = 520;

const RESEARCH_ACTION_TARGET_TABS: Readonly<
  Record<string, ResearchTabId>
> = {
  'research-timeline': 'overview',
  'research-optimization-overview': 'optimization',
  'research-benchmark-code': 'optimization',
  'research-cpu-simd': 'cpu',
  'research-counting-sort': 'cpu',
  'research-memory-layout': 'memory',
  'research-serialization-packing': 'serialization',
  'research-tools-ai': 'meta',
};

function researchTabFromHash(hash: string): ResearchTabId | null {
  const anchor = decodeURIComponent(hash.replace(/^#/u, ''));
  if (RESEARCH_ACTION_TARGET_TABS[anchor]) {
    return RESEARCH_ACTION_TARGET_TABS[anchor];
  }
  const prefix = 'research-panel-';
  if (!anchor.startsWith(prefix)) return null;
  const requestedId = anchor.slice(prefix.length);
  return researchTabs.find(({ id }) => id === requestedId)?.id ?? null;
}

export default function ResearchViewer() {
  const { activeTab, selectTab } = useResearchTabs();
  const { motion, pageTransition } = useTheme();
  const [transitionDirection, setTransitionDirection] = React.useState<
    'forward' | 'backward'
  >('forward');
  const [exitingTab, setExitingTab] = React.useState<ResearchTabId | null>(
    null,
  );
  const [animatedTab, setAnimatedTab] = React.useState<ResearchTabId | null>(
    null,
  );
  const [actionTargetTab, setActionTargetTab] =
    React.useState<ResearchTabId | null>(null);
  const transitionTimerRef = React.useRef(0);
  const entryTimerRef = React.useRef(0);
  const attractionTimerRef = React.useRef(0);

  React.useEffect(
    () => () => {
      window.clearTimeout(transitionTimerRef.current);
      window.clearTimeout(entryTimerRef.current);
      window.clearTimeout(attractionTimerRef.current);
    },
    [],
  );

  const completePanelEntry = React.useCallback(() => {
    window.clearTimeout(entryTimerRef.current);
    entryTimerRef.current = 0;
    setExitingTab(null);
    setAnimatedTab(null);
  }, []);

  const selectResearchTab = React.useCallback((targetTab: ResearchTabId) => {
    if (targetTab === activeTab) return;

    const targetHash = `#research-panel-${targetTab}`;
    // 채팅 액션의 세부 앵커는 해당 탭을 고르는 정보까지 포함한다. 이 경우
    // panel 해시로 덮어쓰지 않아야 최종 카드 위치와 새로고침 주소가 보존된다.
    if (
      window.location.hash !== targetHash &&
      researchTabFromHash(window.location.hash) !== targetTab
    ) {
      const targetUrl = new URL(window.location.href);
      targetUrl.hash = targetHash;
      window.history.replaceState(
        window.history.state,
        '',
        `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`,
      );
    }

    const currentIndex = researchTabs.findIndex((tab) => tab.id === activeTab);
    const targetIndex = researchTabs.findIndex((tab) => tab.id === targetTab);
    setTransitionDirection(
      targetIndex >= currentIndex ? 'forward' : 'backward',
    );

    const reduceMotion =
      motion === 'off' ||
      (motion === 'system' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (pageTransition === 'none' || reduceMotion) {
      window.clearTimeout(entryTimerRef.current);
      setAnimatedTab(null);
      selectTab(targetTab);
      return;
    }

    window.clearTimeout(transitionTimerRef.current);
    setExitingTab(activeTab);
    transitionTimerRef.current = window.setTimeout(() => {
      setAnimatedTab(targetTab);
      selectTab(targetTab);
      transitionTimerRef.current = 0;
      window.clearTimeout(entryTimerRef.current);
      entryTimerRef.current = window.setTimeout(
        completePanelEntry,
        RESEARCH_PANEL_ENTRY_FALLBACK_MS,
      );
    }, RESEARCH_PANEL_EXIT_DURATION_MS);
  }, [activeTab, completePanelEntry, motion, pageTransition, selectTab]);

  const selectResearchTabRef = React.useRef(selectResearchTab);

  React.useEffect(() => {
    selectResearchTabRef.current = selectResearchTab;
  }, [selectResearchTab]);

  React.useEffect(() => {
    const selectHashTarget = () => {
      const requestedTab = researchTabFromHash(window.location.hash);
      if (!requestedTab) return;
      window.clearTimeout(attractionTimerRef.current);
      setActionTargetTab(requestedTab);
      attractionTimerRef.current = window.setTimeout(() => {
        attractionTimerRef.current = 0;
        setActionTargetTab(null);
      }, RESEARCH_TAB_ATTRACTION_MS);
      selectResearchTabRef.current(requestedTab);
    };

    selectHashTarget();
    window.addEventListener('hashchange', selectHashTarget);
    return () => window.removeEventListener('hashchange', selectHashTarget);
  }, []);

  const activePrimaryTab = researchPrimaryTabFromTab(activeTab);
  const actionTargetPrimaryTab = actionTargetTab
    ? researchPrimaryTabFromTab(actionTargetTab)
    : null;
  const isOptimizationSection = activePrimaryTab === 'optimization';

  const selectPrimaryResearchTab = React.useCallback(
    (targetTab: ResearchTabId) => {
      if (targetTab === activePrimaryTab) return;
      selectResearchTab(targetTab);
    },
    [activePrimaryTab, selectResearchTab],
  );

  const panelClassName = [
    'research-panel-content',
    pageTransition !== 'none' && animatedTab === activeTab
      ? `research-panel-transition-${pageTransition}`
      : '',
    exitingTab === activeTab ? 'research-panel-content-exiting' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      id="research-experiments"
      tabIndex={-1}
      style={{ display: 'flex', flexDirection: 'column', gap: '32px', scrollMarginTop: '96px' }}
    >
      <ResearchTabs
        tabs={researchPrimaryTabs}
        activeTab={activePrimaryTab}
        onSelect={selectPrimaryResearchTab}
        actionTargetTab={actionTargetPrimaryTab}
        ariaLabel="연구 대분류"
        tabIdPrefix="research-primary-tab"
        panelIdPrefix="research-section"
      />

      <div
        id={`research-section-${activePrimaryTab}`}
        role="tabpanel"
        aria-labelledby={`research-primary-tab-${activePrimaryTab}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isOptimizationSection ? '20px' : 0,
          minWidth: 0,
        }}
      >
        {isOptimizationSection && (
          <ResearchTabs
            tabs={researchOptimizationTabs}
            activeTab={activeTab}
            onSelect={selectResearchTab}
            actionTargetTab={actionTargetTab}
            ariaLabel="성능 최적화 세부 주제"
            tabIdPrefix="research-optimization-tab"
            panelIdPrefix="research-panel"
            variant="secondary"
          />
        )}

        <div className="research-panel-transition-viewport">
          <div
            key={activeTab}
            id={`research-panel-${activeTab}`}
            className={panelClassName}
            role={isOptimizationSection ? 'tabpanel' : undefined}
            aria-labelledby={
              isOptimizationSection
                ? `research-optimization-tab-${activeTab}`
                : undefined
            }
            data-page-transition={pageTransition}
            data-page-direction={transitionDirection}
            onAnimationEnd={(event) => {
              if (
                event.currentTarget === event.target &&
                exitingTab !== activeTab
              ) {
                completePanelEntry();
              }
            }}
          >
            <ResearchPanels activeTab={activeTab} />
          </div>
        </div>
      </div>

      <section style={{
        padding: '36px',
        background: 'linear-gradient(135deg, var(--bg-elev-2), var(--bg))',
        borderRadius: '24px',
        textAlign: 'center',
        border: '1px solid var(--border)',
        marginTop: '20px',
        boxShadow: 'var(--shadow)'
      }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text)' }}>
          더 많은 고민과 개발 일지를 기록합니다
        </h3>
        <p style={{ color: 'var(--text-dim)', marginBottom: '24px', fontSize: '0.975rem', lineHeight: 1.6, maxWidth: '650px', margin: '0 auto 24px' }}>
          저의 일상적인 생각, 기술적 고민, 그리고 프로젝트 사후 회고를 Log에서 편하게 읽어보세요.
        </p>
        <Link href="/about-me/log" className="hover-btn-primary" style={{
          display: 'inline-block',
          padding: '12px 28px',
          background: 'var(--text)',
          color: 'var(--bg)',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 600,
          boxShadow: 'var(--shadow)',
          transition: 'all 0.15s ease'
        }}>
          기록(Log) 보러 가기
        </Link>
      </section>
    </div>
  );
}
