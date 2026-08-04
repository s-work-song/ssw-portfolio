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
  actionTargetTab = null,
  ariaLabel = '연구 세부 주제',
  tabIdPrefix = 'research-tab',
  panelIdPrefix = 'research-panel',
  variant = 'primary',
}: {
  tabs: readonly ResearchTab[];
  activeTab: ResearchTabId;
  onSelect: (tab: ResearchTabId) => void;
  actionTargetTab?: ResearchTabId | null;
  ariaLabel?: string;
  tabIdPrefix?: string;
  panelIdPrefix?: string;
  variant?: 'primary' | 'secondary';
}) {
  const isSecondary = variant === 'secondary';

  return (
    <nav
      aria-label={ariaLabel}
      role="tablist"
      style={{
        display: 'flex',
        border: isSecondary ? '1px solid var(--border)' : 'none',
        borderBottom: isSecondary ? undefined : '1px solid var(--border)',
        borderRadius: isSecondary ? '14px' : undefined,
        // primary 탭의 강조 애니메이션은 위로 이동하며 외곽 광택을 만든다.
        // 가로 스크롤 컨테이너가 이를 자르지 않도록 효과 범위만큼 안쪽 여백을 둔다.
        padding: isSecondary ? '7px' : '9px 9px 7px',
        gap: '8px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        background: isSecondary ? 'var(--bg-elev-2)' : undefined,
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            id={`${tabIdPrefix}-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`${panelIdPrefix}-${tab.id}`}
            data-chat-action-research-tab-target={
              actionTargetTab === tab.id ? 'true' : undefined
            }
            onClick={() => onSelect(tab.id)}
            style={{
              background: isActive ? 'var(--bg-elev)' : 'transparent',
              border: '1px solid ' + (isActive ? 'var(--border-strong)' : 'transparent'),
              borderBottom: isSecondary
                ? '1px solid ' + (isActive ? 'var(--border-strong)' : 'transparent')
                : '2px solid ' + (isActive ? 'var(--accent, #6366f1)' : 'transparent'),
              color: isActive ? 'var(--text)' : 'var(--text-dim)',
              padding: isSecondary ? '9px 14px' : '10px 16px',
              borderRadius: isSecondary ? '9px' : '8px 8px 0 0',
              fontSize: isSecondary ? '0.875rem' : '0.9375rem',
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
