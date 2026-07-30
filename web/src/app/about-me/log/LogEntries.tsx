"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { PostData } from "@/lib/posts";
import { AskAiButton } from "@/features/chat";
import styles from "./LogEntries.module.css";

type LogSummary = Omit<PostData, "content">;

type LogEntriesProps = {
  posts: LogSummary[];
};

export default function LogEntries({ posts }: LogEntriesProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const tags = useMemo(
    () => Array.from(new Set(posts.flatMap((post) => post.tags ?? []))),
    [posts],
  );
  const visiblePosts = selectedTag
    ? posts.filter((post) => post.tags?.includes(selectedTag))
    : posts;

  return (
    <section
      id="log-entries"
      tabIndex={-1}
      className={styles.section}
      aria-labelledby="log-entries-title"
    >
      <div className={styles.toolbar}>
        <div>
          <p className={styles.eyebrow}>ARCHIVE</p>
          <h2 id="log-entries-title" className={styles.heading}>전체 기록</h2>
        </div>

        {tags.length > 0 && (
          <div className={styles.filters} aria-label="기록 태그 필터">
            <button
              type="button"
              className={selectedTag === null ? styles.filterActive : styles.filter}
              aria-pressed={selectedTag === null}
              onClick={() => setSelectedTag(null)}
            >
              전체
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={selectedTag === tag ? styles.filterActive : styles.filter}
                aria-pressed={selectedTag === tag}
                onClick={() => setSelectedTag(tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {visiblePosts.length === 0 ? (
        <p className={styles.empty}>선택한 태그의 기록이 없습니다.</p>
      ) : (
        <div className={styles.list}>
          {visiblePosts.map(({ slug, title, date, tags: postTags, summary }) => (
            <article key={slug} className={styles.card}>
              <div className={styles.cardMeta}>
                {(postTags?.length ?? 0) > 0 && (
                  <div className={styles.tagList} aria-label="글 태그">
                    {postTags?.map((tag) => <span key={tag}>#{tag}</span>)}
                  </div>
                )}
                {date && <time>{date}</time>}
              </div>

              <Link href={`/about-me/log/${slug}`} className={styles.cardLink}>
                <h3>{title}</h3>
                {summary && <p>{summary}</p>}
              </Link>

              <div className={styles.actions}>
                <Link href={`/about-me/log/${slug}`} className={styles.readLink}>
                  기록 읽기
                </Link>
                <AskAiButton
                  align="end"
                  question={`기록 「${title}」의 핵심 내용과 이 경험에서 얻은 관점을 자세히 설명해 주세요.`}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
