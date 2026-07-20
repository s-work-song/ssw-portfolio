/**
 * 홈의 집중 분야와 포트폴리오 경로 콘텐츠 계약을 보관하는 데이터 모듈이다.
 * React에 의존하지 않고 직렬화 가능한 값만 제공하며, 항목 추가가 페이지 JSX
 * 수정으로 이어지지 않도록 데이터와 프레젠테이션을 분리한다(SRP·OCP).
 */

export interface FocusArea {
  index: string;
  title: string;
  description: string;
  tags: string[];
}

export interface PortfolioPath {
  label: string;
  title: string;
  description: string;
  href: string;
}

export const focusAreas: FocusArea[] = [
  {
    index: "01",
    title: "제품을 끝까지 만드는 개발",
    description:
      "백엔드와 프론트엔드, 시스템 연동의 경계를 오가며 문제를 실제로 쓰이는 제품의 형태로 완성합니다.",
    tags: ["Full-stack", "System Integration", "Product Delivery"],
  },
  {
    index: "02",
    title: "측정에서 시작하는 최적화",
    description:
      "SIMD·AVX2·CUDA 같은 로우레벨 기법부터 직렬화와 전송 대역폭까지, 병목을 측정하고 근거로 개선합니다.",
    tags: ["Performance", "Benchmark", "Low-level"],
  },
  {
    index: "03",
    title: "AI와 함께 설계하는 작업 방식",
    description:
      "에이전트를 단순 코드 생성기가 아닌 탐색·검증 파트너로 활용해 가설, 구현, 테스트의 피드백 루프를 짧게 만듭니다.",
    tags: ["AI Orchestration", "Automation", "Verification"],
  },
];

export const portfolioPaths: PortfolioPath[] = [
  {
    label: "Resume",
    title: "경력과 기술",
    description: "실무 경험, 역할, 기술 스택을 한눈에 확인합니다.",
    href: "/about-me/resume",
  },
  {
    label: "Cover Letter",
    title: "문제를 대하는 태도",
    description: "집요하게 원인을 찾고 끝까지 해결해 온 이야기를 담았습니다.",
    href: "/about-me/cover-letter",
  },
  {
    label: "Research",
    title: "성능 탐구 기록",
    description: "하드웨어부터 소프트웨어까지 직접 측정한 실험과 연구입니다.",
    href: "/about-me/research",
  },
  {
    label: "Log",
    title: "배우고 남긴 기록",
    description: "개발 과정의 판단과 시행착오를 짧은 글로 축적합니다.",
    href: "/about-me/log",
  },
];
