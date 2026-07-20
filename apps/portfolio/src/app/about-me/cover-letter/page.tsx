/**
 * 자기소개서의 서사와 핵심 가치 섹션을 순서대로 표현하는 정적 서버 컴포넌트다.
 * 현재 콘텐츠가 고정된 단일 문서이므로 데이터 계층을 억지로 추가하지 않고,
 * 페이지 내부의 문서 구조와 가독성에만 책임을 둔다.
 */
import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: '자기소개서 | Cover Letter',
  description: '가치관과 걸어온 길',
};

export default function CoverLetterPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '60px' }}>
      
      {/* Hero Section */}
      <section style={{
        padding: 'clamp(22px, 5vw, 36px)',
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
          <h2 style={{ fontSize: 'clamp(1.5rem, 5.5vw, 2.25rem)', fontWeight: 800, margin: 0, color: 'var(--text)', lineHeight: 1.2 }}>
            &quot;단순히 돌아가는 코드가 아닌,<br />그 이면의 원리를 탐구합니다.&quot;
          </h2>
          <p style={{ fontSize: 'clamp(1rem, 2.6vw, 1.125rem)', color: 'var(--text-dim)', maxWidth: '850px', lineHeight: 1.6, margin: 0, wordBreak: 'keep-all' }}>
            단순히 결과물만 내는 것이 아니라, 프로덕트가 만들어지는 이면에 담긴 고민과 과정을 중요하게 생각합니다. 언제나 본질을 꿰뚫고 새로운 기준을 제시하기 위해 노력하는 메이커입니다.
          </p>
        </div>
      </section>

      {/* Narrative Section (based on the markdown) */}
      <section style={{
        padding: 'clamp(26px, 5vw, 40px) clamp(18px, 4vw, 32px)',
        background: 'var(--bg-elev)',
        borderRadius: '24px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        flexDirection: 'column',
        gap: '40px',
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

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(40px, auto) 1fr', gap: '24px', alignItems: 'start' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent, #6366f1)', opacity: 0.8, lineHeight: 1 }}>01</div>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 12px', color: 'var(--text)', lineHeight: 1.2 }}>학창 시절부터 이어진 탐구심</h3>
              <p style={{ margin: 0, fontSize: '1.03125rem', color: 'var(--text-dim)', lineHeight: 1.7, wordBreak: 'keep-all' }}>
                고등학생 때부터 컴퓨터 하드웨어에 대한 깊은 관심이 있었습니다. 단순히 이론적인 것에 그치지 않고, 직접 CPU 오버클럭을 하거나 RAID 환경을 구성하며 성능 개선을 두 눈으로 확인하고 검증하는 과정 자체에 큰 흥미를 느꼈습니다. 이러한 하드웨어에 대한 본질적인 탐구심은 이후 소프트웨어 엔지니어로 성장하는 데 강력한 밑거름이 되었습니다.
              </p>
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--border)', opacity: 0.7 }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(40px, auto) 1fr', gap: '24px', alignItems: 'start' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent, #6366f1)', opacity: 0.8, lineHeight: 1 }}>02</div>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 12px', color: 'var(--text)', lineHeight: 1.2 }}>로우레벨에서 하이레벨까지</h3>
              <p style={{ margin: 0, fontSize: '1.03125rem', color: 'var(--text-dim)', lineHeight: 1.7, wordBreak: 'keep-all' }}>
                C#과 유니티를 시작으로 프로그래밍에 입문한 이후, 프레임워크를 수동적으로 가져다 쓰는 것을 넘어 동작 원리를 파고들었습니다. Winform에서 WPF로 마이그레이션하며 MVVM 패턴을 체득했고, 더 나아가 CPU의 비순차 실행이나 분기 예측, SIMD(AVX2)와 CUDA 등 하드웨어의 물리적 특성을 고려한 소프트웨어 성능 최적화 실험에 몰두해 왔습니다.
              </p>
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--border)', opacity: 0.7 }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(40px, auto) 1fr', gap: '24px', alignItems: 'start' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent, #6366f1)', opacity: 0.8, lineHeight: 1 }}>03</div>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 12px', color: 'var(--text)', lineHeight: 1.2 }}>스스로 문제를 정의하는 메이커</h3>
              <p style={{ margin: 0, fontSize: '1.03125rem', color: 'var(--text-dim)', lineHeight: 1.7, wordBreak: 'keep-all' }}>
                이제는 데이터의 직렬화 포맷을 비교 분석하고 자체적인 코드 제너레이터(Scaffold)를 구축하는 등, 생산성과 성능이라는 두 마리 토끼를 잡기 위해 끊임없이 고민하고 있습니다. 저는 주어지는 문제를 수동적으로 푸는 사람이 아니라, 스스로 문제를 정의하고 본질부터 파고듭니다.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Mindset & Values */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, color: 'var(--text)' }}>Core Values</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          <div style={{ padding: '24px', background: 'var(--bg-elev)', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div aria-hidden="true" style={{ fontSize: '2rem', marginBottom: '16px' }}>🎯</div>
            <h4 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text)' }}>본질 추구</h4>
            <p style={{ margin: 0, color: 'var(--text-dim)', lineHeight: 1.6, fontSize: '0.9375rem' }}>
              표면적인 문제보다 그 이면에 있는 진짜 원인을 찾아 해결합니다.
            </p>
          </div>

          <div style={{ padding: '24px', background: 'var(--bg-elev)', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div aria-hidden="true" style={{ fontSize: '2rem', marginBottom: '16px' }}>⚡</div>
            <h4 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text)' }}>빠른 실행</h4>
            <p style={{ margin: 0, color: 'var(--text-dim)', lineHeight: 1.6, fontSize: '0.9375rem' }}>
              완벽함보다는 완성에 초점을 맞추며, 빠르게 검증하고 개선해 나갑니다.
            </p>
          </div>

          <div style={{ padding: '24px', background: 'var(--bg-elev)', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🤝</div>
            <h4 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text)' }}>투명한 소통</h4>
            <p style={{ margin: 0, color: 'var(--text-dim)', lineHeight: 1.6, fontSize: '0.9375rem' }}>
              솔직하게 공유하고 협력할 때 최고의 결과물이 나온다고 믿습니다.
            </p>
          </div>
        </div>
      </section>

      <section style={{ 
        padding: '40px', 
        background: 'linear-gradient(135deg, var(--bg-elev-2), var(--bg))', 
        borderRadius: '24px', 
        textAlign: 'center',
        border: '1px solid var(--border)',
        marginTop: '20px'
      }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text)' }}>하드웨어 제어 및 최적화 연구가 궁금하신가요?</h3>
        <p style={{ color: 'var(--text-dim)', marginBottom: '24px' }}>
          CPU 명령 수준 최적화부터 AI 에이전트 코딩 연구에 이르기까지, 다양한 실험과 도전 결과를 정리해 두었습니다.
        </p>
        <Link href="/about-me/research" className="hover-btn-primary" style={{
          display: 'inline-block',
          padding: '12px 24px',
          background: 'var(--text)',
          color: 'var(--bg)',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 600,
        }}>
          연구 경험(Research) 보러 가기
        </Link>
      </section>

    </div>
  );
}
