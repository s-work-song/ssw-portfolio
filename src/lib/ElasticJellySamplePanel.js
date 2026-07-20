/**
 * 채팅 샘플의 DOM 생성·이벤트·응답 흐름을 ElasticJellyPanel 애니메이션과 결합합니다.
 * React의 선언형 세계에서 사용하는 FloatingMenu가 단일 인스턴스 API만 다루도록,
 * 명령형 DOM 구현을 open/close/destroy 계약으로 바꾸는 Adapter 역할을 합니다.
 */
import ElasticJellyPanel from './ElasticJellyPanel';

/**
 * 젤리 애니메이션이 적용된 샘플 패널 컴포넌트 클래스입니다.
 * (내부에 채팅 형태의 샘플 마크업 및 로직이 포함되어 있습니다.)
 */
class ElasticJellySamplePanel {
  /**
   * @param {HTMLElement} fabElement - 패널을 토글할 플로팅 액션 버튼(FAB) 엘리먼트
   * @param {HTMLElement} [parentElement=document.body] - 패널을 추가할 부모 DOM (기본값: body)
   */
  constructor(fabElement, parentElement = document.body) {
    this.fab = fabElement;
    this.parent = parentElement;

    // 1. 패널 DOM 요소들을 동적으로 생성하고 추가합니다.
    this.createDOM();

    // 2. 배경 젤리 물리 엔진 인스턴스를 초기화합니다.
    this.jelly = new ElasticJellyPanel(this.fab, this.panel);

    // 3. 패널 내부의 인터랙션 이벤트를 바인딩합니다.
    this.bindEvents();

    // 4. 타이머 등 메모리 누수 방지 리소스 추적
    this.timeouts = [];
  }

  /**
   * 패널에 필요한 DOM 트리 구조를 동적으로 구축하여 화면에 삽입합니다.
   */
  createDOM() {
    // 메인 패널 컨테이너 생성
    this.panel = document.createElement('div');
    this.panel.className = 'chat-panel';
    this.panel.id = 'chatPanel';
    this.panel.style.zIndex = '-1';
    this.panel.setAttribute('aria-hidden', 'true');

    // 콘텐츠 마스킹용 래퍼 생성
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'chat-content-wrapper';

    // 헤더 조립
    this.header = document.createElement('header');
    this.header.className = 'chat-header';
    this.header.innerHTML = `
      <h2>채팅 (샘플)</h2>
      <button class="close-btn" id="closeChatBtn" aria-label="채팅 닫기">✕</button>
    `;

    // 본문 메시지 영역 조립
    this.body = document.createElement('div');
    this.body.className = 'chat-body';
    this.body.id = 'chatBody';
    this.body.innerHTML = `<p class="chat-welcome">안녕하세요! 궁금한 점을 남겨 주세요.</p>`;

    // 푸터 입력란 조립
    this.footer = document.createElement('footer');
    this.footer.className = 'chat-input';
    this.footer.innerHTML = `
      <input type="text" id="chatInput" placeholder="메시지 입력..." />
      <button id="sendBtn">전송</button>
    `;

    // 조립 및 부모 DOM에 주입
    this.wrapper.appendChild(this.header);
    this.wrapper.appendChild(this.body);
    this.wrapper.appendChild(this.footer);
    this.panel.appendChild(this.wrapper);
    this.parent.appendChild(this.panel);

    // 중요 조작 엘리먼트 참조 보관
    this.closeBtn = this.header.querySelector('#closeChatBtn');
    this.input = this.footer.querySelector('#chatInput');
    this.sendBtn = this.footer.querySelector('#sendBtn');
  }

  /**
   * 열기, 닫기, 전송 등 모든 UI 컴포넌트의 사용자 이벤트를 연결합니다.
   */
  bindEvents() {
    // FAB 클릭 시 패널 토글
    this.fab.addEventListener('click', () => {
      if (this.panel.classList.contains('open')) {
        this.close();
      } else {
        this.open();
      }
    });

    // 닫기 버튼 클릭 시 패널 닫기
    this.closeBtn.addEventListener('click', () => this.close());

    // 입력 전송 감지
    this.sendBtn.addEventListener('click', () => this.handleSend());
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleSend();
      }
    });
  }

  /**
   * 패널을 화면에 부드럽게 펼쳐서 보여줍니다.
   */
  open() {
    this.panel.classList.add('open');
    this.panel.setAttribute('aria-hidden', 'false');
    this.fab.setAttribute('aria-label', '채팅 닫기');
    this.jelly.open();
    this.input.focus();
    this.parent.classList.add('chat-is-open');
  }

  /**
   * 패널을 부드럽게 수축하여 닫습니다.
   */
  close(targetElement) {
    this.panel.classList.remove('open');
    this.panel.setAttribute('aria-hidden', 'true');
    this.fab.setAttribute('aria-label', '채팅 열기');
    this.jelly.close(targetElement);
    this.parent.classList.remove('chat-is-open');
  }

  /**
   * 패널 본문 영역에 새로운 말풍선 메시지를 추가합니다.
   * @param {string} text - 메시지 내용
   * @param {boolean} isUser - 사용자가 입력한 메시지 여부
   */
  appendMessage(text, isUser) {
    const msgDiv = document.createElement('div');
    msgDiv.className = isUser ? 'chat-msg user' : 'chat-msg bot';
    msgDiv.textContent = text;
    this.body.appendChild(msgDiv);
    this.body.scrollTop = this.body.scrollHeight;
  }

  /**
   * 봇 답변용 가상 응답을 구성합니다.
   * @param {string} userText - 사용자가 보낸 내용
   * @returns {string} 로봇 답변 텍스트
   */
  mockReply(userText) {
    return `받은 메시지: ${userText}`;
  }

  /**
   * 전송 처리를 제어하며 봇 답변 에코를 작동시킵니다.
   */
  handleSend() {
    const text = this.input.value.trim();
    if (!text) return;
    this.appendMessage(text, true);
    this.input.value = '';
    const reply = this.mockReply(text);
    const tId = setTimeout(() => {
      if (this.panel && this.panel.parentNode) {
        this.appendMessage(reply, false);
      }
    }, 300);
    this.timeouts.push(tId);
  }

  /**
   * 컴포넌트 완전 폐기 시 내부 자원을 지우고 DOM을 삭제합니다.
   */
  destroy() {
    if (this.timeouts) {
      this.timeouts.forEach(tId => clearTimeout(tId));
      this.timeouts = [];
    }
    this.jelly.destroy();
    if (this.panel && this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }
  }
}
export default ElasticJellySamplePanel;
