"use client";

import Link from 'next/link';
import type { MouseEvent, ReactNode } from 'react';
import { useChat } from '@/features/chat';
import {
  BENCHMARK_NOTICE_URL,
  BENCHMARK_PROJECTS,
  BENCHMARK_PROJECT_BY_ID,
  BENCHMARK_ROOT_URL,
  benchmarkReadmeUrl,
  benchmarkTreeUrl,
  type BenchmarkProject,
  type BenchmarkProjectId,
} from '@/data/benchmarks';
import styles from './BenchmarkEvidence.module.css';

function ExternalLink({
  href,
  children,
  primary = false,
}: Readonly<{
  href: string;
  children: ReactNode;
  primary?: boolean;
}>) {
  return (
    <a
      className={`${styles.link}${primary ? ` ${styles.primaryLink}` : ''}`}
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {children}
      <span aria-hidden="true">↗</span>
    </a>
  );
}

function ProjectLinks({ project }: Readonly<{ project: BenchmarkProject }>) {
  return (
    <div className={styles.links}>
      <ExternalLink
        href={benchmarkTreeUrl(project.sourcePath)}
        primary
      >
        구현 코드
      </ExternalLink>
      <ExternalLink href={benchmarkReadmeUrl(project)}>실행 방법</ExternalLink>
      <ExternalLink href={benchmarkTreeUrl(project.testPath)}>테스트</ExternalLink>
      <ExternalLink href={benchmarkTreeUrl(project.benchmarkPath)}>
        벤치마크 러너
      </ExternalLink>
    </div>
  );
}

function ResearchLink({
  href,
  children,
}: Readonly<{ href: string; children: ReactNode }>) {
  const { navigateRoute } = useChat();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    navigateRoute(href);
  };

  return (
    <Link className={styles.internalLink} href={href} onClick={handleClick}>
      {children}
      <span aria-hidden="true">→</span>
    </Link>
  );
}

export function BenchmarkEvidence({
  projectId,
}: Readonly<{ projectId: BenchmarkProjectId }>) {
  const project = BENCHMARK_PROJECT_BY_ID[projectId];

  return (
    <aside className={styles.evidence} aria-label={`${project.title} 구현 코드`}>
      <div className={styles.evidenceHeader}>
        <div>
          <span className={styles.eyebrow}>IMPLEMENTATION</span>
          <h4 className={styles.title}>{project.title}</h4>
        </div>
        <span className={styles.statusBadge}>재구성 코드</span>
      </div>

      <p className={styles.summary}>{project.summary}</p>
      <div className={styles.tags} aria-label="기술 구성">
        {project.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
        <span>테스트 프로젝트 포함</span>
      </div>

      <ProjectLinks project={project} />

      <p className={styles.statusNote}>
        화면의 기존 성능 수치와 같은 조건의 재현 여부는 아직 확인 전입니다.
        코드는 구현 방식과 정답성 검증 구조를 확인하는 용도로 공개합니다.
      </p>
    </aside>
  );
}

export function BenchmarkCatalog() {
  return (
    <section
      id="research-benchmark-code"
      tabIndex={-1}
      className={styles.catalog}
      aria-labelledby="research-benchmark-code-title"
    >
      <div className={styles.catalogHeader}>
        <div>
          <span className={styles.eyebrow}>PUBLIC BENCHMARKS</span>
          <h3 id="research-benchmark-code-title" className={styles.catalogTitle}>
            공개 벤치마크 코드
          </h3>
        </div>
        <ExternalLink href={BENCHMARK_ROOT_URL}>전체 폴더 보기</ExternalLink>
      </div>

      <p className={styles.catalogIntro}>
        연구 탭에서 설명하는 구현 일부를 독립 실행 가능한 .NET 8 솔루션으로
        재구성했습니다. 각 프로젝트에는 구현, 테스트와 BenchmarkDotNet 러너가
        분리되어 있습니다.
      </p>

      <div className={styles.catalogGrid}>
        {BENCHMARK_PROJECTS.map((project) => (
          <article key={project.id} className={styles.catalogCard}>
            <div className={styles.catalogCardHeader}>
              <h4>{project.title}</h4>
              <span>코드 공개</span>
            </div>
            <p>{project.summary}</p>
            <div className={styles.tags} aria-label={`${project.title} 기술 구성`}>
              {project.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <div className={styles.catalogCardLinks}>
              <ExternalLink
                href={benchmarkTreeUrl(project.repositoryPath)}
                primary
              >
                코드 보기
              </ExternalLink>
              {project.researchHref ? (
                <ResearchLink href={project.researchHref}>
                  {project.researchLabel ?? '연구 내용 보기'}
                </ResearchLink>
              ) : (
                <ExternalLink href={benchmarkReadmeUrl(project)}>
                  설명 보기
                </ExternalLink>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className={styles.notice}>
        <strong>열람용 공개 코드</strong>
        <span>
          별도 라이선스를 부여하지 않으며 복제·수정·재배포·상업적 사용을
          허가하지 않습니다.
        </span>
        <ExternalLink href={BENCHMARK_NOTICE_URL}>이용 고지</ExternalLink>
      </div>
    </section>
  );
}
