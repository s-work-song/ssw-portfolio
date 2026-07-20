/**
 * @file posts.ts
 * @description 블로그 포스트(Log) 데이터를 정적 파일 데이터베이스(posts.json)로부터 가져오는 데이터 접근 헬퍼 모듈입니다.
 * 
 * [유지보수 및 아키텍처 핵심 설명]
 * - 기존 Next.js 구조에서는 빌드 및 런타임에 직접 Node.js의 'fs' 및 'path' 모듈을 사용하여 마크다운(.md) 파일을 파싱했습니다.
 * - 하지만 Cloudflare Workers/Pages와 같은 V8 Isolate 기반 엣지(Edge) 환경은 파일 시스템(fs) API를 제공하지 않거나 차단합니다.
 * - 이 제약을 극복하기 위해, 빌드 시점에 모든 마크다운을 하나의 static JSON 파일('posts.json')로 사전 빌드(Pre-generate)하는 구조로 개선되었습니다.
 * - 본 파일은 런타임 시 파일 입출력(I/O) 오버헤드 없이, 메모리에 즉시 로드된 JSON 모듈 데이터를 참조하여 고속으로 필터링 및 서치 작업을 수행합니다.
 * - 페이지가 저장 형식을 알지 않도록 목록/단건 조회로 감싸는 Repository 패턴을 적용하며, 현재 저장소가 JSON이라는 사실은 이 모듈 내부에만 남깁니다.
 */
import postsData from '../content/posts.json';

/**
 * @type PostData
 * @description 블로그 포스트의 상세 필드를 정의한 타입 구조체입니다.
 */
export type PostData = {
  slug: string;     // 마크다운 파일명에서 파싱된 유니크 식별자이자 URL 라우팅 경로
  title: string;    // 포스트 제목 (Frontmatter 파싱값)
  date: string;     // 작성 일자 (YYYY-MM-DD 포맷)
  summary?: string; // 목록 화면에 노출될 포스트의 짧은 핵심 요약문 (옵션)
  content: string;  // 마크다운 문법으로 쓰여진 포스트 본문 전체
};

// 빌드 타임에 병합된 JSON 원시 데이터를 PostData 배열 타입으로 안전하게 단언(Assertion)하여 사용합니다.
const posts: PostData[] = postsData as PostData[];

/**
 * @function getSortedPostsData
 * @description 전체 포스트 목록을 조회하여 최신 등록순(날짜 내림차순)으로 정렬된 데이터를 반환합니다.
 * - 목록 화면 렌더링 최적화를 위해 용량이 큰 본문(content) 데이터는 제외(Omit)하여 응답 메모리 대역폭을 최소화합니다.
 * 
 * @returns {Omit<PostData, 'content'>[]} 본문이 생략되고 날짜 정렬이 완료된 요약 포스트 정보 배열
 */
export function getSortedPostsData(): Omit<PostData, 'content'>[] {
  return posts
    .map(({ slug, title, date, summary }) => ({
      slug,
      title,
      date,
      summary,
    }))
    .sort((a, b) => {
      // 최신 날짜순(내림차순, 큰 날짜 값이 인덱스 앞쪽으로 위치)으로 정렬합니다.
      if (a.date < b.date) {
        return 1;
      } else {
        return -1;
      }
    });
}

/**
 * @function getPostData
 * @description 특정 식별자(slug)에 매칭되는 단일 포스트의 본문을 포함한 전체 세부 데이터를 조회합니다.
 * - 주로 동적 라우팅 경로(예: /about-me/log/[slug])에서 개별 글 상세 페이지를 구성할 때 호출됩니다.
 * 
 * @param {string} slug - 조회하려는 포스트 파일 식별명 (예: 'hello-world')
 * @throws {Error} 매칭되는 식별자를 찾지 못할 경우 예외를 발생시킵니다.
 * @returns {PostData} 본문을 포함한 단일 포스트 상세 데이터 구조체
 */
export function getPostData(slug: string): PostData {
  const post = posts.find((p) => p.slug === slug);
  if (!post) {
    throw new Error(`포스트를 찾을 수 없습니다: ${slug}`);
  }
  return post;
}
