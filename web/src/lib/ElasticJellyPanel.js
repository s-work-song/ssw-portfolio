/**
 * 물리 기반 젤리 모핑 배경의 캔버스·타이밍·열기/닫기 생명주기를 캡슐화합니다.
 * 상위 패널은 open/close/destroy 명령만 사용하고 물리 계산과 캔버스 구현을
 * 알지 않으므로, 이 클래스는 명령형 애니메이션 엔진의 Facade 역할을 합니다.
 */

/**
 * 젤리 형태의 물리 기반 배경 애니메이션을 관리하는 클래스입니다.
 */
class ElasticJellyPanel {
  /**
   * @param {HTMLElement} fabElement - 플로팅 액션 버튼 엘리먼트
   * @param {HTMLElement} panelElement - 채팅 패널 컨테이너 엘리먼트
   */
  constructor(fabElement, panelElement) {
    this.fab = fabElement;
    this.panel = panelElement;

    // 캔버스 엘리먼트를 동적으로 생성하고 필수 스타일을 지정하여 패널 내부의 배경 레이어로 주입합니다.
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'chatPanelBg';
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.canvas.style.zIndex = '-1';
    this.canvas.style.pointerEvents = 'none';
    this.panel.insertBefore(this.canvas, this.panel.firstChild);

    this.ctx = this.canvas.getContext('2d');

    // 애니메이션 동작과 시각 매개변수를 한곳에서 조정하는 구성 객체입니다.
    this.config = {
      // 1. 열기 타이밍 및 물리 매개변수
      openDuration: 0.7,             // 열릴 때 애니메이션 소요 시간 (초, 작을수록 빠름, 기본: 0.7)
      openBounciness: 1.0,           // 열릴 때 반동(출렁임) 세기 배율 (기본: 1.0)
      contentDelay: 0.2,             // 카드 내용물이 페이드인 되기 전 대기 시간 (초)
      contentFadeInDuration: 0.3,    // 카드 내용물 페이드인에 소요되는 시간 (초)

      // 2. 닫기 타이밍 및 물리 매개변수
      closeDuration: 0.1,            // 닫힐 때 애니메이션 소요 시간 (초, 작을수록 빠름, 기본: 0.25)
      closeBounciness: 0.4,          // 닫힐 때 반동 세기 배율 (수축 시 흔들림을 최소화하기 위해 낮춤)
      contentFadeOutDelay: 0.0,      // 닫힐 때 내용물 페이드아웃 시작 전 대기 시간 (초)
      contentFadeOutDuration: 0.1,   // 카드 내용물 페이드아웃에 소요되는 시간 (초)
      jellyCloseDelay: 0.05,          // 닫힐 때 젤리가 실제로 수축을 시작하기 전 대기 시간 (초)

      // 3. 외관 스타일 매개변수
      fillColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-elev').trim() || '#1A1C29',   // 젤리 내부를 채울 색상 (불투명)
      strokeColor: 'rgba(102, 102, 102, 1)',   // 젤리 외곽 테두리 색상
      strokeWidth: 1.5,                         // 젤리 외곽 테두리 두께 (픽셀)
      cornerRadius: 12,                         // 카드 모서리의 둥글기 반경 (픽셀)

      // 4. 레이어 매개변수
      fabZIndex: 1000                           // 애니메이션 작동 시 플로팅 버튼이 젤리 위에 얹히도록 지정할 z-index 값
    };
    // ==========================================

    // 마스킹 클리핑을 적용할 콘텐츠 래퍼 엘리먼트 선택 (배경 캔버스는 잘리지 않게 제외)
    this.wrapper = panelElement.querySelector('.chat-content-wrapper');

    // 패널 내부의 입력 폼, 헤더, 메시지 영역 선택
    this.contents = panelElement.querySelectorAll('.chat-header, .chat-body, .chat-input');

    // 캔버스 자체의 페이드 효과를 위한 초기 설정
    this.canvas.style.transition = 'none';
    this.canvas.style.opacity = '1';

    // 캔버스 크기 초기 설정 및 리사이즈 이벤트 등록 (이벤트 해제를 위해 핸들러 바인딩)
    this.resize();
    this.resizeHandler = () => this.resize();
    window.addEventListener('resize', this.resizeHandler);

    // 스프링 물리 연산에 사용될 꼭짓점(앵커 포인트)들 초기화 (초기 위치는 버튼의 중심점)
    const fabCenter = this.getFabCenter();
    this.fabX = fabCenter.x;
    this.fabY = fabCenter.y;

    // 각 점의 속성: x, y (현재 위치), tx, ty (목표 위치), vx, vy (속도), k (탄성 계수), d (감쇠/마찰 계수)
    this.points = {
      tr: { x: fabCenter.x, y: fabCenter.y, tx: fabCenter.x, ty: fabCenter.y, vx: 0, vy: 0, k: 0.12, d: 0.76 }, // 우상단
      br: { x: fabCenter.x, y: fabCenter.y, tx: fabCenter.x, ty: fabCenter.y, vx: 0, vy: 0, k: 0.12, d: 0.76 }, // 우하단
      bl: { x: fabCenter.x, y: fabCenter.y, tx: fabCenter.x, ty: fabCenter.y, vx: 0, vy: 0, k: 0.08, d: 0.80 }, // 좌하단
      tl: { x: fabCenter.x, y: fabCenter.y, tx: fabCenter.x, ty: fabCenter.y, vx: 0, vy: 0, k: 0.08, d: 0.80 }, // 좌상단
      ml1: { x: fabCenter.x, y: fabCenter.y, tx: fabCenter.x, ty: fabCenter.y, vx: 0, vy: 0, k: 0.15, d: 0.70 }, // 좌측 중상단 (먼저 튕겨 나감)
      ml2: { x: fabCenter.x, y: fabCenter.y, tx: fabCenter.x, ty: fabCenter.y, vx: 0, vy: 0, k: 0.11, d: 0.72 }  // 좌측 중하단 (뒤이어 튕겨 나가며 S자 곡선 형성)
    };

    this.isOpen = false;
    this.animating = false;
    this.closeTimeout = null; // 닫기 지연(jellyCloseDelay) 처리를 위한 타이머 ID
    this.rafId = null; // 애니메이션 루프 취소 처리를 위한 requestAnimationFrame ID
  }

  /**
   * 컴포넌트 소멸 시 캔버스를 DOM에서 제거하고 등록했던 리사이즈 이벤트를 해제하여 메모리 누수를 완전히 차단합니다.
   */
  destroy() {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    window.removeEventListener('resize', this.resizeHandler);
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.ctx.scale(dpr, dpr);

    if (this.isOpen) {
      this.updateTargets();
      // 리사이즈 시 즉각적인 반응을 위해 애니메이션 중이 아닐 때는 즉시 배치하고 렌더링
      if (!this.animating) {
        for (let key in this.points) {
          this.points[key].x = this.points[key].tx;
          this.points[key].y = this.points[key].ty;
        }
        this.render();
      }
    }
  }

  /**
   * 플로팅 액션 버튼(FAB)의 현재 스크린 기준 중심 좌표를 계산합니다.
   * @returns {{x: number, y: number}} 버튼 중심의 X, Y 좌표
   */
  getFabCenter() {
    const rect = this.fab.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }

  /**
   * 채팅 패널 컨테이너의 현재 위치 및 크기 정보를 획득합니다.
   * @returns {DOMRect} 패널의 바운딩 박스 정보
   */
  getPanelBounds() {
    const rect = this.panel.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height
    };
  }

  /**
   * 현재 상태(열림/닫힘)에 맞추어 모든 물리 점들의 최종 목표 좌표를 업데이트합니다.
   */
  updateTargets() {
    const fabCenter = this.getFabCenter();
    this.fabX = fabCenter.x;
    this.fabY = fabCenter.y;

    if (this.isOpen) {
      // 열림 상태: 사각형 채팅창의 네 모서리 및 좌측 경계선 구간 좌표가 목표 지점
      const bounds = this.getPanelBounds();
      
      // CSS 테두리 두께, 모서리 라운드 및 현재 테마 색상 동기화
      const style = getComputedStyle(this.panel);
      const docStyle = getComputedStyle(document.body);
      
      this.config.cornerRadius = parseFloat(style.borderRadius) || 12;
      this.config.strokeWidth = parseFloat(style.borderWidth) || 2;
      
      // 테마 변경(다크모드/라이트모드) 시 즉각 반영을 위해 색상 다시 가져오기
      this.config.fillColor = docStyle.getPropertyValue('--bg-elev').trim() || '#1A1C29';
      // 외곽선은 사용자의 요청에 따라 더 진하고 선명하게 고정 색상 유지
      this.config.strokeColor = 'rgba(102, 102, 102, 1)';
      
      // box-sizing: border-box의 border와 캔버스의 stroke 위치를 완벽하게 맞추기 위해
      // 패널 외곽선 안쪽으로 strokeWidth의 절반만큼 목표 지점을 이동시킵니다 (갭 보정)
      const offset = this.config.strokeWidth / 2;

      this.points.tr.tx = bounds.right - offset;
      this.points.tr.ty = bounds.top + offset;
      this.points.br.tx = bounds.right - offset;
      this.points.br.ty = bounds.bottom - offset;
      this.points.bl.tx = bounds.left + offset;
      this.points.bl.ty = bounds.bottom - offset;
      this.points.tl.tx = bounds.left + offset;
      this.points.tl.ty = bounds.top + offset;

      const h3 = bounds.height / 3;
      this.points.ml1.tx = bounds.left + offset;
      this.points.ml1.ty = bounds.top + h3;
      this.points.ml2.tx = bounds.left + offset;
      this.points.ml2.ty = bounds.top + h3 * 2;
    } else {
      // 닫힘 상태: 모든 꼭짓점이 플로팅 버튼의 중심점을 향해 수축하도록 설정
      for (let key in this.points) {
        this.points[key].tx = this.fabX;
        this.points[key].ty = this.fabY;
      }
    }
  }

  /**
   * 채팅 패널을 활성화하고 확장 젤리 애니메이션을 가동합니다.
   */
  open() {
    this.isOpen = true;

    // 진행 중인 닫기 대기 타이머가 있다면 즉시 제거
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
    }

    // 패널 가시화 및 클릭 제어 해제, 버튼 레이어 우선순위 확보
    this.panel.style.visibility = 'visible';
    this.panel.style.pointerEvents = 'auto';
    this.fab.style.zIndex = this.config.fabZIndex;

    // 열기 시 캔버스 즉시 표시 및 패널 자체 배경 제거
    this.canvas.style.transition = 'none';
    this.canvas.style.opacity = '1';
    this.panel.classList.remove('animation-finished');

    // 설정된 시간 오프셋 딜레이를 반영하여 내용물이 정적으로 드러나도록 트랜지션 적용 (떨림 방지)
    this.wrapper.style.transition = `opacity ${this.config.contentFadeInDuration}s ease ${this.config.contentDelay}s`;
    this.wrapper.style.opacity = '1';

    // 열림 물리 속성 설정 (S자 모양으로 부드럽게 튕기는 젤리 파동 연출)
    this.points.tr.k = 0.12; this.points.tr.d = Math.min(0.98, 0.76 * this.config.openBounciness);
    this.points.br.k = 0.12; this.points.br.d = Math.min(0.98, 0.76 * this.config.openBounciness);
    this.points.bl.k = 0.08; this.points.bl.d = Math.min(0.98, 0.80 * this.config.openBounciness);
    this.points.tl.k = 0.08; this.points.tl.d = Math.min(0.98, 0.80 * this.config.openBounciness);
    this.points.ml1.k = 0.15; this.points.ml1.d = Math.min(0.98, 0.70 * this.config.openBounciness);
    this.points.ml2.k = 0.11; this.points.ml2.d = Math.min(0.98, 0.72 * this.config.openBounciness);

    this.updateTargets();
    if (!this.animating) {
      this.animating = true;
      this.tick();
    }
  }

  /**
   * 채팅 패널을 비활성화하고 수축 젤리 애니메이션을 가동합니다.
   */
  close(targetElement) {
    if (targetElement) {
      this.fab = targetElement;
    }
    this.isOpen = false;

    // 진행 중인 닫기 대기 타이머가 있다면 즉시 제거
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
    }

    // 닫기 애니메이션 시작 시 캔버스를 즉시 보이게 하고 패널 배경/테두리는 페이드아웃
    this.canvas.style.transition = 'none';
    this.canvas.style.opacity = '1';
    this.panel.classList.remove('animation-finished');

    // 내용물은 지정된 딜레이 이후에 페이드아웃 되도록 동적 트랜지션 처리
    this.wrapper.style.transition = `opacity ${this.config.contentFadeOutDuration}s ease ${this.config.contentFadeOutDelay}s`;
    this.wrapper.style.opacity = '0';

    // 닫힘 물리 속성 설정 (우측 버튼 방향으로 꼬리를 길게 늘어트려 빨려 들어가는 연출)
    // 우측 점들은 즉시 버튼으로 끌어당김
    this.points.tr.k = 0.25; this.points.tr.d = Math.min(0.98, 0.65 * this.config.closeBounciness);
    this.points.br.k = 0.25; this.points.br.d = Math.min(0.98, 0.65 * this.config.closeBounciness);

    // 좌측 점들은 느리게 꼬리를 만들며 따라오게 설정
    this.points.bl.k = 0.06; this.points.bl.d = Math.min(0.98, 0.85 * this.config.closeBounciness);
    this.points.tl.k = 0.06; this.points.tl.d = Math.min(0.98, 0.85 * this.config.closeBounciness);
    this.points.ml1.k = 0.08; this.points.ml1.d = Math.min(0.98, 0.80 * this.config.closeBounciness);
    this.points.ml2.k = 0.08; this.points.ml2.d = Math.min(0.98, 0.80 * this.config.closeBounciness);

    // 설정된 수축 지연 시간 후에 젤리 바운더리를 갱신하여 압축 시작
    const delayMs = this.config.jellyCloseDelay * 1000;
    this.closeTimeout = setTimeout(() => {
      // 대기 도중에 다시 열기 명령이 오지 않은 경우에만 젤리 수축 구동
      if (!this.isOpen) {
        this.updateTargets();
        if (!this.animating) {
          this.animating = true;
          this.tick();
        }
      }
    }, delayMs);
  }

  /**
   * 스프링 감쇠 알고리즘에 의거하여 매 프레임 좌표의 물리를 계산하고 루프를 실행합니다.
   */
  tick() {
    let active = false;
    // 현재 열림/닫힘 상태에 따른 소요 시간을 읽어와 dt(시간 흐름 속도)를 선형적으로 매핑 계산
    // 기준 매핑 공식: dt = 0.4 / duration (0.4초 소요를 기본 속도 dt = 1.0으로 지정)
    const duration = this.isOpen ? this.config.openDuration : this.config.closeDuration;
    const dt = 0.4 / Math.max(0.01, duration);

    for (let key in this.points) {
      const p = this.points[key];
      const ax = (p.tx - p.x) * p.k; // F = -kx (스프링 가속도)
      const ay = (p.ty - p.y) * p.k;

      // 물리 엔진 연산은 고정 프레임율 속도(dt=1.0)로 연산하여 스프링 고유의 탄성 형태를 깨뜨리지 않음
      p.vx = (p.vx + ax) * p.d;
      p.vy = (p.vy + ay) * p.d;

      // 위치 변화율 단계에서만 dt 배율을 곱해 모션의 형태 손상 없이 속도만 정밀 조절
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // 오차가 충분히 안정화될 때까지 활성 상태 유지 (실제 움직임 vx * dt 기준 판정)
      if (Math.abs(p.vx * dt) > 0.05 || Math.abs(p.vy * dt) > 0.05 || Math.abs(p.tx - p.x) > 0.05 || Math.abs(p.ty - p.y) > 0.05) {
        active = true;
      }
    }

    this.render();

    if (active) {
      this.rafId = requestAnimationFrame(() => this.tick());
    } else {
      this.animating = false;
      // 최종 수렴 시 완전한 오차 없는 정렬을 위해 앵커를 타겟값으로 스냅
      for (let key in this.points) {
        this.points[key].x = this.points[key].tx;
        this.points[key].y = this.points[key].ty;
      }

      // 열기 모션이 완전히 종료되었을 때 패널 배경 페이드인 및 캔버스 페이드아웃
      if (this.isOpen) {
        this.panel.classList.add('animation-finished');
        // 패널 컨테이너의 배경이 채워지는 시간(0.3s)을 고려하여
        // 캔버스의 페이드아웃 시작을 0.25초 정도 늦춰 뒷배경이 비치는 현상을 방지합니다.
        this.canvas.style.transition = 'opacity 0.2s ease 0.25s';
        this.canvas.style.opacity = '0';
      }

      // 닫기 모션이 완전히 종료되면 비활성화 처리 및 스타일 복구
      if (!this.isOpen) {
        this.panel.style.visibility = 'hidden';
        this.panel.style.pointerEvents = 'none';
        this.fab.style.zIndex = '';
      }

      this.render();
    }
  }

  /**
   * 캔버스 화면을 지우고 현재 물리 앵커 좌표에 맞춰 글래스모피즘 젤리 셰이프를 다시 그립니다.
   */
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 완전히 닫힌 고정 상태일 때는 불필요한 드로잉 방지
    if (!this.isOpen && !this.animating) {
      return;
    }

    const p = this.points;
    
    // 수축 시 꼭짓점이 모일 때 라운딩(cornerRadius) 때문에 렌더링이 꼬이는(별 모양) 현상 방지
    // 현재 꼭짓점 사이의 거리(너비/높이)를 계산하여 cornerRadius를 동적으로 줄임
    const currentWidth = Math.max(0, p.tr.x - p.tl.x);
    const currentHeight = Math.max(0, p.br.y - p.tr.y);
    const cornerRadius = Math.min(this.config.cornerRadius, currentWidth / 2, currentHeight / 2);

    ctx.beginPath();

    // 좌상단 시작
    ctx.moveTo(p.tl.x + cornerRadius, p.tl.y);

    // 우상단 이동 및 우상단 모서리 라운딩 처리
    ctx.lineTo(p.tr.x - cornerRadius, p.tr.y);
    ctx.quadraticCurveTo(p.tr.x, p.tr.y, p.tr.x, p.tr.y + cornerRadius);

    // 우하단 이동 및 우하단 모서리 라운딩 처리
    ctx.lineTo(p.br.x, p.br.y - cornerRadius);
    ctx.quadraticCurveTo(p.br.x, p.br.y, p.br.x - cornerRadius, p.br.y);

    // 좌하단 이동 및 좌하단 모서리 라운딩 처리
    ctx.lineTo(p.bl.x + cornerRadius, p.bl.y);
    ctx.quadraticCurveTo(p.bl.x, p.bl.y, p.bl.x, p.bl.y - cornerRadius);

    // 좌하단에서 좌상단으로 이어지는 경계선 (Bezier Curve 기반 S자 모핑 팽창 궤적)
    ctx.lineTo(p.bl.x, p.bl.y - cornerRadius);
    ctx.bezierCurveTo(p.ml2.x, p.ml2.y, p.ml1.x, p.ml1.y, p.tl.x, p.tl.y + cornerRadius);

    // 좌상단 모서리 마감
    ctx.quadraticCurveTo(p.tl.x, p.tl.y, p.tl.x + cornerRadius, p.tl.y);

    ctx.closePath();

    // 반투명한 화이트 오버레이 (글래스모피즘 효과 구현)
    ctx.fillStyle = this.config.fillColor;
    ctx.fill();

    // 얇고 은은한 테두리 드로잉
    ctx.strokeStyle = this.config.strokeColor;
    ctx.lineWidth = this.config.strokeWidth;
    ctx.stroke();
  }
}
export default ElasticJellyPanel;
