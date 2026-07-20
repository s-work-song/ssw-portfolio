/**
 * 경력·연구 타임라인이 공유하는 데이터 계약을 정의한다.
 * 런타임 값을 만들지 않는 순수 타입 모듈이며, 데이터 모듈과 표현 컴포넌트가
 * 서로의 구체 구현이 아닌 이 작은 인터페이스에 의존하도록 분리한다(ISP·DIP).
 */

export interface TimelineDescription {
  summary: string;
  details?: string[];
}

export interface CareerItem {
  period: string;
  periodDesc?: string;
  role: string;
  org: string;
  desc: string | TimelineDescription[];
  tags?: string[];
  color?: string;
}
