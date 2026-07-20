/**
 * ElasticJellyPanel 명령형 애니메이션 엔진의 공개 TypeScript 계약입니다.
 * JavaScript 구현의 내부 계산은 숨기고 FloatingMenu 어댑터가 필요한
 * 생성·열기·닫기·정리 표면만 타입으로 고정합니다(ISP).
 */
declare class ElasticJellyPanel {
  fab: HTMLElement;
  panel: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D | null;
  config: {
    openDuration: number;
    openBounciness: number;
    contentDelay: number;
    contentFadeInDuration: number;
    closeDuration: number;
    closeBounciness: number;
    contentFadeOutDelay: number;
    contentFadeOutDuration: number;
    jellyCloseDelay: number;
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
    cornerRadius: number;
    fabZIndex: number;
  };
  wrapper: HTMLElement | null;

  constructor(fabElement: HTMLElement, panelElement: HTMLElement);
  open(): void;
  close(targetElement?: HTMLElement): void;
  destroy(): void;
}

export default ElasticJellyPanel;
