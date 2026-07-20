/**
 * 헤더가 사용하는 브라우저 스크롤 명령을 모아 둔 클라이언트 유틸리티 모듈이다.
 * 화면 컴포넌트에서 위치 계산·보간 공식을 분리하며, 선택적 완료 콜백만 노출해
 * 메뉴 상태 같은 호출자 세부사항에는 의존하지 않는다(SRP·ISP).
 */

/**
 * 같은 문서의 해시 링크를 고정 헤더 높이만큼 보정해 부드럽게 이동한다.
 * 일반 라우트 링크는 가로채지 않아 Next.js 탐색 책임과 충돌하지 않는다.
 */
export const handleSmoothScroll = (
  e: React.MouseEvent<HTMLAnchorElement>,
  href: string,
  onAfterScroll?: () => void
) => {
  if (href.startsWith("#")) {
    e.preventDefault();
    const targetId = href.substring(1);

    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      const offset = 84;
      const startPosition = window.scrollY;
      const targetPosition =
        targetElement.getBoundingClientRect().top + startPosition - offset;
      const distance = targetPosition - startPosition;
      const duration = 600; // ms
      let start: number | null = null;

      const step = (timestamp: number) => {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        const percentage = Math.min(progress / duration, 1);

        // easeInOutCubic
        const ease =
          percentage < 0.5
            ? 4 * percentage * percentage * percentage
            : 1 - Math.pow(-2 * percentage + 2, 3) / 2;

        window.scrollTo(0, startPosition + distance * ease);

        if (progress < duration) {
          window.requestAnimationFrame(step);
        } else {
           if (onAfterScroll) onAfterScroll();
        }
      };

      window.requestAnimationFrame(step);
    }
  }
};

/** 브라우저 기본 스크롤 API로 문서 시작점까지 이동한다. */
export const scrollToTopSmoothly = () => {
  const startPosition = window.scrollY;
  const distance = -startPosition;
  const duration = 600; // ms
  let start: number | null = null;

  const step = (timestamp: number) => {
    if (!start) start = timestamp;
    const progress = timestamp - start;
    const percentage = Math.min(progress / duration, 1);

    const ease =
      percentage < 0.5
        ? 4 * percentage * percentage * percentage
        : 1 - Math.pow(-2 * percentage + 2, 3) / 2;

    window.scrollTo(0, startPosition + distance * ease);

    if (progress < duration) {
      window.requestAnimationFrame(step);
    }
  };

  window.requestAnimationFrame(step);
};
