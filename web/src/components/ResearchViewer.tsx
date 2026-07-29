"use client";

/**
 * 연구 화면의 상태·탭·본문·후속 CTA를 조합하는 얇은 조정자 컴포넌트다.
 * 상태는 useResearchTabs, 탐색은 ResearchTabs, 본문은 ResearchPanels에 위임해
 * 변경 이유를 분리한다(SRP). 선택된 탭 ID를 독립된 뷰 전략에 전달하는
 * 상태 기반 Strategy 패턴을 사용한다.
 */
import Link from 'next/link';
import React from 'react';
import { researchTabs } from '@/data/research';
import type { ResearchTabId } from '@/data/research';
import ResearchPanels from '@/components/research/ResearchPanels';
import ResearchTabs from '@/components/research/ResearchTabs';
import { useResearchTabs } from '@/components/research/useResearchTabs';
import { useTheme } from '@/context/ThemeContext';

const RESEARCH_PANEL_EXIT_DURATION_MS = 150;

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
  const transitionTimerRef = React.useRef(0);

  React.useEffect(
    () => () => {
      window.clearTimeout(transitionTimerRef.current);
    },
    [],
  );

  const selectResearchTab = (targetTab: ResearchTabId) => {
    if (targetTab === activeTab) return;

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
      setAnimatedTab(null);
      selectTab(targetTab);
      return;
    }

    window.clearTimeout(transitionTimerRef.current);
    setExitingTab(activeTab);
    transitionTimerRef.current = window.setTimeout(() => {
      setAnimatedTab(targetTab);
      selectTab(targetTab);
      setExitingTab(null);
      transitionTimerRef.current = 0;
    }, RESEARCH_PANEL_EXIT_DURATION_MS);
  };

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
        tabs={researchTabs}
        activeTab={activeTab}
        onSelect={selectResearchTab}
      />

      <div className="research-panel-transition-viewport">
        <div
          key={activeTab}
          id={`research-panel-${activeTab}`}
          className={panelClassName}
          role="tabpanel"
          aria-labelledby={`research-tab-${activeTab}`}
          data-page-transition={pageTransition}
          data-page-direction={transitionDirection}
        >
          <ResearchPanels activeTab={activeTab} />
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
