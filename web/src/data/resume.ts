/**
 * 이력서의 경력·기술·교육·자격 콘텐츠와 최소 타입을 보관하는 데이터 모듈이다.
 * React와 시각 스타일에 의존하지 않으며, 페이지는 배열 표시만 담당하고
 * 이력 내용의 변경 이유는 이 파일에만 모이도록 분리한다(SRP·OCP).
 */

export interface WorkExperience {
  title: string;
  organization: string;
  period: string;
  bullets: string[];
}

export interface SkillGroup {
  title: string;
  skills: string[];
}

export interface ResumeFact {
  title: string;
  meta: string;
}

export const workExperiences: WorkExperience[] = [
  {
    title: '프리랜서 개발자',
    organization: '라이트소프트 (웹 SI)',
    period: '2021.02 ~ 2022.01',
    bullets: [
      '웹 SI 프로젝트(주식회사 디티스페이스)의 Swagger 문서화가 적용된 Spring Boot REST API 서버 구축',
      'Vue.js (Element UI) 및 Axios 기반의 비동기 통신을 적용한 백오피스 어드민 콘솔 개발',
      'KB금융그룹 프로젝트 계약 파견을 통한 증권 앱 클라이언트 스펙 개발 (SpiderGen 프레임워크 활용)',
    ],
  },
  {
    title: '웹 개발자',
    organization: '큐브에이 (소프트웨어 개발)',
    period: '2020.06 ~ 2020.09',
    bullets: [
      'KDI 지식협력단지 웹사이트 기능 추가 및 유지보수 (Spring 프레임워크 기반)',
      '사내 어드민 템플릿의 소스 코드 리팩토링 및 가독성 개선',
    ],
  },
  {
    title: '앱 개발자',
    organization: '너울정보 (R&D 연구소)',
    period: '2019.04 ~ 2019.08',
    bullets: [
      '안드로이드 네이티브 앱 개발을 주도적으로 담당 및 서비스 출시',
      'Java/Spring 백엔드 아키텍처의 보일러플레이트 레이어 설계 및 개발 기여',
    ],
  },
  {
    title: '시스템 운영자',
    organization: '씨엔티테크 (시스템 운영)',
    period: '2012.08 ~ 2014.09',
    bullets: [
      '호스팅 및 사내 네트워크 인프라 운영 및 모니터링, SQL 기반 서버/네트워크 점검 및 데이터 집계 자동화',
      '원인 불명의 정산 데이터 불일치 이슈를 로그 테이블 상세 분석으로 정량 추적하여, 수천만 원 규모의 부정 결제 결함을 규명하고 근본 원인 조치 및 재발 방지책 마련',
    ],
  },
];

// 첫 번째 그룹이 이력서에서 가장 먼저 읽히므로, 개별 기술 이름이 아니라
// 일하는 방식과 설계 관점을 앞세운다.
export const skillGroups: SkillGroup[] = [
  { title: 'Core Competencies', skills: ['OOP / SOLID', 'DevOps', 'Profiling', 'AI 에이전트 오케스트레이션'] },
  { title: 'Languages', skills: ['C#', 'Java', 'JavaScript'] },
  { title: 'Frameworks · Platforms', skills: ['.NET / BCL', 'WPF', 'Unity', 'Spring'] },
  { title: 'Optimization · Tools', skills: ['BenchmarkDotNet', 'xUnit', 'SIMD / AVX2', 'Protobuf', 'ZSTD'] },
];

export const educationItems: ResumeFact[] = [
  { title: 'VR/AR 콘텐츠 개발 과정', meta: '메디치이앤에스 | 2022' },
  { title: '자바 개발자 양성 과정', meta: '한국소프트웨어인재개발원 | 2018' },
  { title: '남서울대학교 (Namseoul University)', meta: '융합비즈니스학과 중퇴 | 2013 ~ 2014' },
];

export const certificationItems: ResumeFact[] = [
  { title: '대한민국 공군 만기 제대', meta: '병장 만기 전역 | 2016 ~ 2018' },
  { title: '정보처리기능사 취득', meta: '한국산업인력공단 | 2012' },
];
