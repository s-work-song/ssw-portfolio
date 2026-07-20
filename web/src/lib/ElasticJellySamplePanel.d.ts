/**
 * ElasticJellySamplePanel 어댑터의 공개 TypeScript 계약입니다.
 * 동적 DOM 패널의 주요 참조와 생명주기 명령을 선언해 TSX 소비자가
 * JavaScript 내부 구현에 직접 결합하지 않게 합니다(DIP).
 */
import ElasticJellyPanel from './ElasticJellyPanel';

declare class ElasticJellySamplePanel {
  fab: HTMLElement;
  parent: HTMLElement;
  panel: HTMLDivElement;
  wrapper: HTMLDivElement;
  header: HTMLElement;
  body: HTMLDivElement;
  footer: HTMLElement;
  closeBtn: HTMLButtonElement | null;
  input: HTMLInputElement | null;
  sendBtn: HTMLButtonElement | null;
  jelly: ElasticJellyPanel;

  constructor(fabElement: HTMLElement, parentElement?: HTMLElement);
  createDOM(): void;
  bindEvents(): void;
  open(): void;
  close(targetElement?: HTMLElement): void;
  appendMessage(text: string, isUser: boolean): void;
  mockReply(userText: string): string;
  handleSend(): void;
  destroy(): void;
}

export default ElasticJellySamplePanel;
