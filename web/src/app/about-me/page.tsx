/**
 * About 진입 화면의 소개 패널·목적지 카드·다음 행동을 조합한다.
 * 표면 UI는 공용 About 컴포넌트에, 카드 콘텐츠는 data/about에 의존해
 * 이 파일은 페이지 수준 프레젠테이션과 순서만 책임진다.
 */
import React from 'react';
import Link from 'next/link';
import AboutDecorativeGrid from '@/components/about/AboutDecorativeGrid';
import AboutPanel from '@/components/about/AboutPanel';
import { aboutDestinations, aboutProjects } from '@/data/about';

export const metadata = {
  title: '소개 | Overview',
  description: '송상운 개인 포트폴리오 소개 및 각 섹션 안내',
};

export default function OverviewPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
      
      {/* Intro Hero Section */}
      <AboutPanel id="portfolio-overview" tabIndex={-1} style={{
        padding: 'clamp(20px, 5vw, 40px)',
        borderRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden',
        scrollMarginTop: '96px'
      }}>
        {/* Subtle grid background watermark */}
        <AboutDecorativeGrid />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.25rem)', fontWeight: 800, margin: 0, color: 'var(--text)', lineHeight: 1.2 }}>
            안녕하세요, 송상운입니다.
          </h2>
          <p style={{
            margin: 0,
            fontSize: 'clamp(0.95rem, 2vw, 1.125rem)',
            lineHeight: 1.7,
            color: 'var(--text-dim)',
            maxWidth: '850px',
            wordBreak: 'keep-all'
          }}>
            저는 하드웨어 성능의 한계를 벤치마킹하는 취미에서 시작해, 전체 컴퓨팅 스택의 원리를 탐구하고 
            AI 에이전트와 긴밀하게 협업하여 생산성을 최대로 끌어올리는 소프트웨어 엔지니어입니다. 
            아래 네 개의 섹션에서 저의 경험, 철학, 그리고 탐구 기록을 확인해 보세요.
          </p>
        </div>
      </AboutPanel>
 
      {/* Grid of Sections */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px'
      }}>
        {aboutDestinations.map((section) => (
          <Link href={section.href} key={section.href} style={{ textDecoration: 'none', display: 'flex' }}>
            <div 
              className="hover-timeline-card" 
              style={{
                background: 'var(--bg-elev)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: 'clamp(20px, 4vw, 28px)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                flex: 1,
                boxShadow: 'var(--shadow)',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span aria-hidden="true" style={{ fontSize: '2rem' }}>{section.emoji}</span>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                  {section.title}
                </h4>
              </div>
              <p style={{ 
                margin: 0, 
                fontSize: '0.975rem', 
                lineHeight: 1.6, 
                color: 'var(--text-dim)',
                flex: 1,
                wordBreak: 'keep-all'
              }}>
                {section.desc}
              </p>
              <div style={{ 
                fontSize: '0.9375rem', 
                fontWeight: 600, 
                color: 'var(--accent, #6366f1)',
                display: 'inline-flex',
                alignItems: 'center'
              }}>
                {section.linkText}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <AboutPanel id="featured-projects" tabIndex={-1} style={{
        padding: 'clamp(20px, 5vw, 36px)',
        borderRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        scrollMarginTop: '96px',
      }}>
        <div>
          <p style={{ margin: '0 0 8px', color: 'var(--accent, #6366f1)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Projects
          </p>
          <h3 style={{ margin: 0, color: 'var(--text)', fontSize: 'clamp(1.35rem, 3vw, 1.75rem)' }}>
            대표 프로젝트
          </h3>
          <p style={{ margin: '10px 0 0', color: 'var(--text-dim)', lineHeight: 1.7, wordBreak: 'keep-all' }}>
            요구사항과 운영 조건에 맞춰 구조와 기술을 선택하고, AI 에이전트의 구현 결과를 리뷰·테스트하며 진행한 프로젝트입니다.
          </p>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          gap: '16px',
        }}>
          {aboutProjects.map((project) => (
            <article
              key={project.id}
              id={project.id}
              tabIndex={-1}
              style={{
                padding: '22px',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                background: 'var(--bg-elev-2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                scrollMarginTop: '96px',
              }}
            >
              <span style={{ color: 'var(--accent, #6366f1)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {project.category}
              </span>
              <h4 style={{ margin: 0, color: 'var(--text)', fontSize: '1.12rem' }}>
                {project.title}
              </h4>
              <p style={{ margin: 0, color: 'var(--text-dim)', lineHeight: 1.65, wordBreak: 'keep-all', flex: 1 }}>
                {project.desc}
              </p>
              <span style={{ color: 'var(--text-mute)', fontSize: '0.82rem' }}>
                {project.status}
              </span>
              {project.links && project.links.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '2px' }}>
                  {project.links.map((link) => {
                    const isDemo = link.kind === 'demo';
                    return (
                      <a
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${project.title} ${link.label} 새 탭에서 열기`}
                        className={isDemo ? 'hover-btn-primary' : 'hover-btn-secondary'}
                        style={{
                          minHeight: '36px',
                          padding: '7px 11px',
                          border: isDemo
                            ? '1px solid var(--accent, #6366f1)'
                            : '1px solid var(--border-strong)',
                          borderRadius: '9px',
                          background: isDemo
                            ? 'var(--accent, #6366f1)'
                            : 'var(--bg-elev)',
                          color: isDemo ? '#fff' : 'var(--text-dim)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                      >
                        {link.label}
                        <span aria-hidden="true">↗</span>
                      </a>
                    );
                  })}
                </div>
              )}
            </article>
          ))}
        </div>
      </AboutPanel>

      {/* Bottom CTA to start with Resume */}
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
          첫걸음으로 상세 이력서를 확인해 보세요
        </h3>
        <p style={{ color: 'var(--text-dim)', marginBottom: '24px', fontSize: '0.975rem', lineHeight: 1.6, maxWidth: '650px', margin: '0 auto 24px' }}>
          저의 주요 업무 역량과 백엔드, 프론트엔드 및 시스템 연동 실무 경력이 일목요연하게 요약되어 있습니다.
        </p>
        <Link href="/about-me/resume" className="hover-btn-primary" style={{
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
          이력서(Resume) 보러 가기
        </Link>
      </section>

    </div>
  );
}
