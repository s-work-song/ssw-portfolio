/**
 * About 개요 카드의 콘텐츠 계약과 이동 경로를 보관하는 불변 데이터 모듈이다.
 * React와 표현 스타일에 의존하지 않으며, 개요 페이지는 배열 순회만 수행하므로
 * 섹션 추가가 기존 카드 JSX 수정으로 이어지지 않는다(OCP).
 */

export interface AboutDestination {
  title: string;
  href: string;
  desc: string;
  emoji: string;
  linkText: string;
}

export const aboutDestinations: AboutDestination[] = [
  {
    title: '이력서 (Resume)',
    href: '/about-me/resume',
    desc: '송상운의 직무 전문성, 실무 경력(라이트소프트, 큐브에이, 너울정보 등) 및 핵심 기술 스택을 정리한 공식 이력서입니다.',
    emoji: '📄',
    linkText: '이력서 확인하기 →',
  },
  {
    title: '자기소개서 (Cover Letter)',
    href: '/about-me/cover-letter',
    desc: '문제를 발견하고 집요하게 끝까지 해결해 나가는 엔지니어링 철학과 인생의 터닝포인트, 저만의 가치관이 담겨 있습니다.',
    emoji: '✍️',
    linkText: '자기소개서 읽기 →',
  },
  {
    title: '연구 경험 (Research)',
    href: '/about-me/research',
    desc: '하드웨어 한계 돌파(오버클럭, RAID 0)부터 로우레벨 소프트웨어 최적화(SIMD, AVX2, CUDA) 및 AI 에이전트 오케스트레이션 실험 로그입니다.',
    emoji: '🔬',
    linkText: '연구 경험 보러 가기 →',
  },
  {
    title: '기록 (Log)',
    href: '/about-me/log',
    desc: '개발 및 일상 속에서 얻은 기술적 깨달음과 고민, 프로젝트를 되돌아보는 사후 회고를 기록하는 로그 블로그입니다.',
    emoji: '📝',
    linkText: '로그 게시글 읽기 →',
  },
];
