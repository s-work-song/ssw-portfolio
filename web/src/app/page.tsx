/**
 * 임시 진입 페이지. 메인 화면(/home)을 다듬는 동안 방문자를 소개 페이지로 보낸다.
 * 소개 페이지가 이력서·자기소개서·연구·기록으로 가는 입구를 모두 노출하므로,
 * 특정 문서로 바로 보내는 것보다 방문자가 길을 잃지 않는다.
 *
 * 정적 export에는 서버가 없어 next.config의 redirects()나 redirect()를 쓸 수 없다.
 * 그래서 meta refresh로 리디렉션하며, 이 방식은 자바스크립트가 꺼져 있어도 동작한다.
 * 링크를 함께 두어 자동 이동이 막힌 환경에서도 갈 곳이 남게 한다.
 */
import type { Metadata } from "next";

// 배포 시 basePath가 붙으므로 이동 주소에도 같은 접두사를 붙여야 한다.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const target = `${basePath}/about-me/`;

export const metadata: Metadata = {
  title: "송상운 | Software Engineer",
};

export default function RootRedirect() {
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${target}`} />
      <main style={{ fontFamily: "system-ui, sans-serif", padding: "40px", lineHeight: 1.7 }}>
        <p>소개 페이지로 이동합니다.</p>
        <a href={target}>자동으로 이동하지 않으면 여기를 눌러주세요</a>
      </main>
    </>
  );
}
