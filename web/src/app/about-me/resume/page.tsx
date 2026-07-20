/**
 * 이력서의 프로필·경력·기술·교육·자격 섹션을 표시하는 서버 컴포넌트다.
 * 반복 콘텐츠와 타입은 data/resume에, 반복 태그 UI는 SkillTagGroup에 위임해
 * 콘텐츠 수정과 표현 수정의 변경 이유를 분리한다(SRP·OCP).
 */
import React from 'react';
import Link from 'next/link';
import AboutDecorativeGrid from '@/components/about/AboutDecorativeGrid';
import AboutPanel from '@/components/about/AboutPanel';
import SkillTagGroup from '@/components/about/SkillTagGroup';
import {
  certificationItems,
  educationItems,
  skillGroups,
  workExperiences,
} from '@/data/resume';

export const metadata = {
  title: '이력서 | Resume',
  description: '송상운 개인 이력서 및 경력 사항',
};

export default function ResumePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
      
      {/* Profile / Hero Section */}
      <AboutPanel style={{
        padding: 'clamp(20px, 5vw, 36px)',
        borderRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle grid background watermark */}
        <AboutDecorativeGrid />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.25rem)', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                송상운
              </h2>
              <p style={{ fontSize: 'clamp(1rem, 3vw, 1.125rem)', fontWeight: 600, color: 'var(--accent, #6366f1)', margin: '8px 0 0' }}>
                Software Engineer
              </p>
            </div>
            
            {/* Contact Details */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: 'clamp(0.85rem, 2vw, 0.9375rem)',
              color: 'var(--text-dim)',
              alignItems: 'flex-start',
              minWidth: '200px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span aria-hidden="true">📍</span> <span>Seoul, South Korea</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span aria-hidden="true">✉️</span> <a href="mailto:sworksong@gmail.com" style={{ color: 'var(--accent, #6366f1)', textDecoration: 'none' }}>sworksong@gmail.com</a>
              </div>
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--border)' }} />

          <p style={{
            margin: 0,
            fontSize: 'clamp(0.95rem, 2vw, 1.0625rem)',
            lineHeight: 1.7,
            color: 'var(--text-dim)',
            maxWidth: '850px',
            wordBreak: 'keep-all'
          }}>
            Spring·Vue.js 기반 웹 서비스와 Android 앱, WPF 데스크톱 도구를 개발하고 배포해 왔습니다.
            이후 BenchmarkDotNet과 프로파일링을 바탕으로 CPU·메모리·직렬화 병목을 측정하고 개선하며,
            AI 에이전트를 탐색과 검증을 돕는 개발 파트너로 활용하고 있습니다.
          </p>
        </div>
      </AboutPanel>

      {/* Main Layout Grid */}
      <div className="about-grid">
        
        {/* Left Column: Experience & Research */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* EXPERIENCE */}
          <section style={{
            padding: '32px',
            background: 'var(--bg-elev)',
            borderRadius: '24px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, borderBottom: '2px solid var(--border-strong, var(--text))', paddingBottom: '12px', margin: 0, color: 'var(--text)' }}>
              Work Experience (경력)
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {workExperiences.map((experience, index) => (
                <React.Fragment key={`${experience.organization}-${experience.period}`}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px' }}>
                      <h4 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                        {experience.title} <span style={{ fontWeight: 500, color: 'var(--text-mute)', fontSize: '0.9375rem' }}>— {experience.organization}</span>
                      </h4>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-mute)', fontFamily: 'monospace' }}>{experience.period}</span>
                    </div>
                    <ul style={{ paddingLeft: '20px', marginTop: '10px', color: 'var(--text-dim)', lineHeight: 1.6, fontSize: '0.9375rem' }}>
                      {experience.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                    </ul>
                  </div>
                  {index < workExperiences.length - 1 && (
                    <div style={{ height: '1px', background: 'var(--border)', opacity: 0.6 }} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </section>

        </div>

        {/* Right Column: Skills, Education, Certs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          {/* SKILLS */}
          <section style={{
            padding: '24px',
            background: 'var(--bg-elev)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 20px', color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', whiteSpace: 'nowrap' }}>
              Skills (기술 스택)
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {skillGroups.map((group) => (
                <SkillTagGroup key={group.title} title={group.title} skills={group.skills} />
              ))}
            </div>
          </section>

          {/* EDUCATION & TRAINING */}
          <section style={{
            padding: '24px',
            background: 'var(--bg-elev)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 20px', color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', whiteSpace: 'nowrap' }}>
              Education & Training (학력 및 수료)
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.9375rem', lineHeight: 1.5 }}>
              {educationItems.map((item) => (
                <div key={item.title}>
                  <div style={{ fontWeight: 700, color: 'var(--text)' }}>{item.title}</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>{item.meta}</div>
                </div>
              ))}
            </div>
          </section>

          {/* CERTIFICATION & SERVICE */}
          <section style={{
            padding: '24px',
            background: 'var(--bg-elev)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 20px', color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', whiteSpace: 'nowrap' }}>
              Certification & Service (기타)
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.9375rem', lineHeight: 1.5 }}>
              {certificationItems.map((item) => (
                <div key={item.title}>
                  <div style={{ fontWeight: 700, color: 'var(--text)' }}>{item.title}</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>{item.meta}</div>
                </div>
              ))}
            </div>
          </section>

        </div>

      </div>

      {/* Call to action for Cover Letter page */}
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
          성장 스토리와 가치관이 궁금하신가요?
        </h3>
        <p style={{ color: 'var(--text-dim)', marginBottom: '24px', fontSize: '0.975rem', lineHeight: 1.6, maxWidth: '650px', margin: '0 auto 24px' }}>
          단순한 기술 스택을 넘어, 어떤 가치관을 갖고 문제를 해결하는 메이커인지 자기소개서에서 확인해 보세요.
        </p>
        <Link href="/about-me/cover-letter" className="hover-btn-primary" style={{
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
          자기소개서(Cover Letter) 읽기
        </Link>
      </section>

    </div>
  );
}
