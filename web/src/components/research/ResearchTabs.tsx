"use client";

/**
 * 연구 탭 배열을 키보드·보조기술이 이해할 수 있는 tablist로 표현한다.
 * 상태를 소유하지 않는 제어 컴포넌트로서 현재 ID와 선택 콜백만 받고,
 * 탭 데이터의 구체 저장 위치에는 의존하지 않는다(ISP·DIP).
 */
import type { ResearchTab, ResearchTabId } from '@/data/research';
export default function ResearchTabs({
  tabs,
  activeTab,
  onSelect,
}: {
  tabs: ResearchTab[];
  activeTab: ResearchTabId;
  onSelect: (tab: ResearchTabId) => void;
}) {
  return (
    <nav
      aria-label="연구 세부 주제"
      role="tablist"
      style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '4px',
        gap: '8px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            id={`research-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`research-panel-${tab.id}`}
            onClick={() => onSelect(tab.id)}
            style={{
              background: isActive ? 'var(--bg-elev)' : 'transparent',
              border: '1px solid ' + (isActive ? 'var(--border-strong)' : 'transparent'),
              borderBottom: '2px solid ' + (isActive ? 'var(--accent, #6366f1)' : 'transparent'),
              color: isActive ? 'var(--text)' : 'var(--text-dim)',
              padding: '10px 16px',
              borderRadius: '8px 8px 0 0',
              fontSize: '0.9375rem',
              fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(event) => {
              if (!isActive) {
                event.currentTarget.style.color = 'var(--text)';
                event.currentTarget.style.background = 'var(--bg-elev-2)';
              }
            }}
            onMouseLeave={(event) => {
              if (!isActive) {
                event.currentTarget.style.color = 'var(--text-dim)';
                event.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <span aria-hidden="true">{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
