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

export interface AboutProject {
  id: string;
  title: string;
  category: string;
  desc: string;
  status: string;
  links?: AboutProjectLink[];
}

export interface AboutProjectLink {
  label: string;
  href: string;
  kind: 'repository' | 'demo';
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

export const aboutProjects: AboutProject[] = [
  {
    id: 'project-common-infrastructure',
    title: '공용 인프라 프로젝트군',
    category: 'Shared Infrastructure',
    desc: '인증·채팅·파일·미디어·알림·분석과 게이트웨이·설정·스케줄링·관측 기능을 여러 프로젝트에서 재사용할 수 있도록 분리한 프로젝트군입니다.',
    status: '공개 저장소 운영 중',
    links: [
      {
        label: 'GitHub 저장소',
        href: 'https://github.com/s-work-agency/ssw-infra-public',
        kind: 'repository',
      },
    ],
  },
  {
    id: 'project-ecommerce-demo',
    title: '이커머스 데모',
    category: 'Commerce Demo',
    desc: '상품 조회, 장바구니, 주문과 관리자 흐름을 갖춘 데모입니다. 실제 결제는 포함하지 않으며 배너와 상품 이미지는 AI 도구로 제작했습니다.',
    status: '공개 데모 운영 중',
    links: [
      {
        label: 'GitHub 저장소',
        href: 'https://github.com/s-work-agency/ssw-e-commerce-demo-public',
        kind: 'repository',
      },
      {
        label: '사용자 데모',
        href: 'https://demo.ecommerce.sworkagency.com/',
        kind: 'demo',
      },
      {
        label: '관리자 데모',
        href: 'https://admin-ecommerce.sworkagency.com/',
        kind: 'demo',
      },
    ],
  },
  {
    id: 'project-game-collection-platform',
    title: '게임 모음 플랫폼',
    category: 'Game Platform',
    desc: '오목·스네이크와 Three.js·WebGL 기반 비행 시뮬레이터를 한곳에 모으고, 게임 기록 저장과 랭킹 기능을 구성한 플랫폼입니다.',
    status: '공개용 사이트 준비 중',
  },
  {
    id: 'project-code-archive',
    title: '코드 아카이브',
    category: 'Verified Code Archive',
    desc: 'AI로 구현한 코드를 테스트와 검증을 거쳐 고정 항목으로 등록하고, 주제·언어·식별 규칙에 따라 같은 검증 코드를 조회해 재사용하는 프로젝트입니다.',
    status: '공개용 사이트 준비 중',
  },
];
