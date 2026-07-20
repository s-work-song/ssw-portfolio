/**
 * About 히어로 패널이 공유하는 점 그리드 워터마크 컴포넌트다.
 * 콘텐츠·상태 의존성이 없는 장식 전용 프리미티브이며, 접근성 트리와
 * 포인터 이벤트에서 제외해 상위 패널의 의미와 상호작용을 방해하지 않는다.
 */
export default function AboutDecorativeGrid() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        opacity: 0.3,
        pointerEvents: 'none',
      }}
    />
  );
}
