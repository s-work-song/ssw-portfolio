/**
 * 단일 로그의 정적 경로·메타데이터·Markdown 본문을 조합하는 서버 컴포넌트다.
 * 콘텐츠 저장소 접근은 lib/posts의 조회 인터페이스에만 의존하며,
 * ReactMarkdown은 Markdown을 안전한 React 트리로 바꾸는 표현 어댑터로 사용한다.
 */
import React from 'react';
import Link from 'next/link';
import { getPostData, getSortedPostsData } from '@/lib/posts';
import ReactMarkdown from 'react-markdown';
import styles from './page.module.css';

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
  const relatedPosts = getSortedPostsData()
    .filter((post) => post.slug !== slug)
    .slice(0, 3);

  return (
    <article className={styles.article}>
      <div className={styles.readingSurface}>
        <header className={styles.articleHeader}>
          <div className={styles.titleRow}>
            <h1 className={styles.articleTitle}>
              {postData.title}
            </h1>
            <Link href="/about-me/log" className={styles.listButton}>
              <span aria-hidden="true">←</span>
              목록으로
            </Link>
          </div>

          {(postData.date || (postData.tags?.length ?? 0) > 0) && (
            <div className={styles.articleMeta}>
              {postData.date && <time>{postData.date}</time>}
              {(postData.tags?.length ?? 0) > 0 && (
                <div className={styles.tagList} aria-label="글 태그">
                  {postData.tags?.map((tag) => (
                    <span key={tag} className={styles.tag}>#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </header>

        {/* Markdown Content rendered via ReactMarkdown */}
        <div className={`${styles.markdownBody} markdown-content`}>
          <ReactMarkdown
            components={{
              h1: ({node, ...props}) => {
                void node;
                return <h2 className={styles.bodyH1} {...props} />;
              },
              h2: ({node, ...props}) => {
                void node;
                return <h2 className={styles.bodyH2} {...props} />;
              },
              h3: ({node, ...props}) => {
                void node;
                return <h3 className={styles.bodyH3} {...props} />;
              },
              p: ({node, ...props}) => {
                void node;
                return <p className={styles.bodyParagraph} {...props} />;
              },
              a: ({node, href, children, ...props}) => {
                void node;
                const isExternal = Boolean(href?.startsWith('http://') || href?.startsWith('https://'));
                return (
                  <a
                    className={`${styles.markdownLink}${isExternal ? ` ${styles.externalLink}` : ''}`}
                    href={href}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    {...props}
                  >
                    {children}
                  </a>
                );
              },
              ul: ({node, ...props}) => {
                void node;
                return <ul className={styles.bodyList} {...props} />;
              },
              li: ({node, ...props}) => {
                void node;
                return <li className={styles.bodyListItem} {...props} />;
              },
              blockquote: ({node, ...props}) => {
                void node;
                return <blockquote className={styles.bodyBlockquote} {...props} />;
              }
            }}
          >
            {postData.content}
          </ReactMarkdown>
        </div>
      </div>

      <footer className={styles.articleFooter}>
        {relatedPosts.length > 0 && (
          <section aria-labelledby="related-posts-title">
            <div className={styles.relatedHeader}>
              <div>
                <p className={styles.relatedEyebrow}>CONTINUE READING</p>
                <h2 id="related-posts-title" className={styles.relatedTitle}>다른 기록</h2>
              </div>
              <Link href="/about-me/log" className={styles.footerListLink}>
                전체 목록 보기
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className={styles.relatedGrid}>
              {relatedPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/about-me/log/${post.slug}`}
                  className={styles.relatedCard}
                >
                  {(post.tags?.length ?? 0) > 0 && (
                    <div className={styles.cardTagList} aria-label="글 태그">
                      {post.tags?.map((tag) => (
                        <span key={tag}>#{tag}</span>
                      ))}
                    </div>
                  )}
                  <h3>{post.title}</h3>
                  {post.summary && <p>{post.summary}</p>}
                  <span className={styles.relatedArrow} aria-hidden="true">↗</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className={styles.footerAction}>
          <Link href="/about-me/log" className={styles.listButton}>
            <span aria-hidden="true">←</span>
            목록으로 돌아가기
          </Link>
        </div>
      </footer>
    </article>
  );
}
