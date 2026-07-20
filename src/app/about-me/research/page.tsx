/**
 * 연구 페이지의 소개 셸과 인터랙티브 ResearchViewer를 결합한다.
 * 서버 컴포넌트는 메타데이터·도입부만 소유하고, 탭 상태와 세부 패널 선택은
 * 클라이언트 조정자에 위임해 서버/클라이언트 경계를 작게 유지한다.
 */
import React from 'react';
import ResearchViewer from '@/components/ResearchViewer';

export const metadata = {
  title: '연구 경험 | Research Experience',
  description: '로우레벨 최적화 및 에이전틱 코딩 연구 경험',
};

export default function ResearchExperiencePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* Research Experience Intro */}
      <section style={{
        padding: '36px',
        background: 'var(--bg-elev)',
        borderRadius: '24px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle grid background watermark */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.3,
          pointerEvents: 'none'
        }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: 'clamp(1.45rem, 5vw, 2rem)', fontWeight: 700, margin: 0, color: 'var(--text)', lineHeight: 1.2 }}>
            연구 경험 (Research Experience)
          </h2>
          <p style={{ fontSize: 'clamp(0.98rem, 2.4vw, 1.0625rem)', color: 'var(--text-dim)', maxWidth: '850px', lineHeight: 1.6, margin: 0, wordBreak: 'keep-all' }}>
            하드웨어 최적화부터 로우레벨 제어, 소프트웨어 아키텍처 및 데이터 최적화까지 이어지는 전반적인 엔지니어링 여정의 상세 실험 보고서입니다.
          </p>
        </div>
      </section>

      {/* Interactive Research Content */}
      <ResearchViewer />

    </div>
  );
}
