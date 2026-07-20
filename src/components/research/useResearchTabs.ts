"use client";

/**
 * 연구 탭의 선택 상태와 변경 명령만 캡슐화하는 전용 훅이다.
 * 화면 구성과 탭 메타데이터를 알지 않으므로 변경 이유가 탭 선택 규칙 하나로
 * 제한되며(SRP), 조정자는 이 반환 계약에만 의존한다.
 */
import { useState } from 'react';
import type { ResearchTabId } from '@/data/research';
export function useResearchTabs(initialTab: ResearchTabId = 'overview') {
  const [activeTab, setActiveTab] = useState<ResearchTabId>(initialTab);

  return {
    activeTab,
    selectTab: setActiveTab,
  };
}
