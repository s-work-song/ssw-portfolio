/**
 * 단일 로그의 정적 경로·메타데이터·Markdown 본문을 조합하는 서버 컴포넌트다.
 * 콘텐츠 저장소 접근은 lib/posts의 조회 인터페이스에만 의존하며,
 * ReactMarkdown은 Markdown을 안전한 React 트리로 바꾸는 표현 어댑터로 사용한다.
 */
import React from 'react';
import Link from 'next/link';
import { getPostData, getSortedPostsData } from '@/lib/posts';
import ReactMarkdown from 'react-markdown';

export const dynamicParams = false;

/** 빌드 시점에 생성할 로그 slug를 Repository의 전체 목록으로부터 결정한다. */
export function generateStaticParams() {
  const posts = getSortedPostsData();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

/** 동일 포스트 조회 결과로 문서 제목과 설명을 만들어 본문·메타데이터의 출처를 일치시킨다. */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const postData = getPostData(slug);
  return {
    title: `${postData.title} | Log`,
    description: postData.summary || '개인 기록',
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const postData = getPostData(slug);

  return (
    <article style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      <header style={{ paddingBottom: '32px', borderBottom: '1px solid var(--border)' }}>
        <Link href="/about-me/log" style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '8px', 
          color: 'var(--text-dim)', 
          textDecoration: 'none',
          marginBottom: '24px',
          fontWeight: 500
        }}>
          ← Back to List
        </Link>
        <h1 style={{ fontSize: 'clamp(1.65rem, 6vw, 2.5rem)', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text)', lineHeight: 1.2 }}>
          {postData.title}
        </h1>
        <div style={{ color: 'var(--text-mute)', fontSize: '1rem' }}>
          <time>{postData.date}</time>
        </div>
      </header>

      {/* Markdown Content rendered via ReactMarkdown */}
      <div className="markdown-content" style={{
        lineHeight: 1.8,
        color: 'var(--text)',
        fontSize: '1.125rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <ReactMarkdown
          components={{
            h1: ({node, ...props}) => {
              void node;
              return <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '24px', marginBottom: '16px' }} {...props} />;
            },
            h2: ({node, ...props}) => {
              void node;
              return <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: '24px', marginBottom: '16px' }} {...props} />;
            },
            h3: ({node, ...props}) => {
              void node;
              return <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: '20px', marginBottom: '12px' }} {...props} />;
            },
            p: ({node, ...props}) => {
              void node;
              return <p style={{ margin: '0 0 16px 0', color: 'var(--text-dim)' }} {...props} />;
            },
            a: ({node, ...props}) => {
              void node;
              return <a className="markdown-link" {...props} />;
            },
            ul: ({node, ...props}) => {
              void node;
              return <ul style={{ paddingLeft: '24px', margin: '0 0 16px 0', color: 'var(--text-dim)' }} {...props} />;
            },
            li: ({node, ...props}) => {
              void node;
              return <li style={{ marginBottom: '8px' }} {...props} />;
            },
            blockquote: ({node, ...props}) => {
              void node;
              return <blockquote style={{ borderLeft: '4px solid var(--text)', paddingLeft: '16px', margin: '16px 0', fontStyle: 'italic', color: 'var(--text-dim)' }} {...props} />;
            }
          }}
        >
          {postData.content}
        </ReactMarkdown>
      </div>
      
    </article>
  );
}
