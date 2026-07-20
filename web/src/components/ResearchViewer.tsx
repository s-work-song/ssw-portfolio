"use client";

/**
 * 연구 화면의 상태·탭·본문·후속 CTA를 조합하는 얇은 조정자 컴포넌트다.
 * 상태는 useResearchTabs, 탐색은 ResearchTabs, 본문은 ResearchPanels에 위임해
 * 변경 이유를 분리한다(SRP). 선택된 탭 ID를 독립된 뷰 전략에 전달하는
 * 상태 기반 Strategy 패턴을 사용한다.
 */
import Link from 'next/link';
import { researchTabs } from '@/data/research';
import ResearchPanels from '@/components/research/ResearchPanels';
import ResearchTabs from '@/components/research/ResearchTabs';
import { useResearchTabs } from '@/components/research/useResearchTabs';

export default function ResearchViewer() {
  const { activeTab, selectTab } = useResearchTabs();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <ResearchTabs tabs={researchTabs} activeTab={activeTab} onSelect={selectTab} />

      <div
        id={`research-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`research-tab-${activeTab}`}
      >
        <ResearchPanels activeTab={activeTab} />
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
