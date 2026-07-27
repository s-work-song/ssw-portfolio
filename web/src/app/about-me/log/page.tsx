/**
 * 로그 목록을 날짜순으로 조회해 카드 목록으로 표현하는 서버 컴포넌트다.
 * 포스트 저장 형식은 Repository 역할의 lib/posts가 감추며, 이 페이지는
 * 목록 조회 결과의 시맨틱 마크업과 이동 경로만 책임진다(DIP).
 */
import React from 'react';
import Link from 'next/link';
import AboutDecorativeGrid from '@/components/about/AboutDecorativeGrid';
import AboutPanel from '@/components/about/AboutPanel';
import { getSortedPostsData } from '@/lib/posts';

export const metadata = {
  title: '기록 | Log',
  description: '개인적인 생각과 회고',
};

export default function LogPage() {
  const allPostsData = getSortedPostsData();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
      
      {/* Log Header Section */}
      <AboutPanel style={{
        padding: '36px',
        borderRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle grid background watermark */}
        <AboutDecorativeGrid />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: 'clamp(1.45rem, 5vw, 2rem)', fontWeight: 700, margin: 0, color: 'var(--text)', lineHeight: 1.2 }}>
            기록 (Log)
          </h2>
          <p style={{ fontSize: 'clamp(0.98rem, 2.4vw, 1.0625rem)', color: 'var(--text-dim)', maxWidth: '850px', lineHeight: 1.6, margin: 0, wordBreak: 'keep-all' }}>
            개인적인 생각, 회고, 그리고 기술적 성찰의 기록들입니다.
          </p>
        </div>
      </AboutPanel>

      <section
        id="log-entries"
        tabIndex={-1}
        style={{ display: 'flex', flexDirection: 'column', gap: '24px', scrollMarginTop: '96px' }}
      >
        {allPostsData.length === 0 ? (
          <p style={{ color: 'var(--text-mute)' }}>아직 등록된 글이 없습니다.</p>
        ) : (
          allPostsData.map(({ slug, title, date, summary }) => (
            <Link href={`/about-me/log/${slug}`} key={slug} style={{ textDecoration: 'none', display: 'block' }}>
              <article style={{ 
                padding: '24px', 
                background: 'var(--bg-elev)', 
                borderRadius: '16px', 
                border: '1px solid var(--border)',
                cursor: 'pointer'
              }}
              >
                <div style={{ marginBottom: '8px' }}>
                  <time style={{ color: 'var(--text-mute)', fontSize: '0.875rem' }}>{date}</time>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 12px 0', color: 'var(--text)' }}>
                  {title}
                </h3>
                {summary && (
                  <p style={{ margin: 0, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                    {summary}
                  </p>
                )}
              </article>
            </Link>
          ))
        )}
      </section>

      <section style={{ 
        padding: '40px', 
        background: 'linear-gradient(135deg, var(--bg-elev-2), var(--bg))', 
        borderRadius: '24px', 
        textAlign: 'center',
        border: '1px solid var(--border)',
        marginTop: '40px'
      }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text)' }}>소개 페이지로 돌아가기</h3>
        <p style={{ color: 'var(--text-dim)', marginBottom: '24px' }}>
          저의 전체 프로필 및 각 영역의 자세한 요약을 다시 확인하시려면 아래 버튼을 눌러주세요.
        </p>
        <Link href="/about-me" className="hover-btn-primary" style={{
          display: 'inline-block',
          padding: '12px 24px',
          background: 'var(--text)',
          color: 'var(--bg)',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 600,
        }}>
          소개(Overview) 홈으로 가기
        </Link>
      </section>

    </div>
  );
}
