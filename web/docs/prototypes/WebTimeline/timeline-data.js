/* 타임라인 컴포넌트 — 데이터 & 설정 모듈
   window.TLData 로 등록 (DC 로직에서 동기 읽기). */
(function () {
  var MODES = {
    light: { bg:'#fbfbfd', surface:'#ffffff', surface2:'#f3f3f7', text:'#17171e', muted:'#6c6c79', border:'#e8e8ef', line:'#d9d9e3', shadow:'0 1px 2px rgba(20,20,45,.05), 0 1px 3px rgba(20,20,45,.04)', shadowHover:'0 16px 34px rgba(20,20,45,.13)' },
    dark:  { bg:'#0e0e13', surface:'#17171e', surface2:'#20202a', text:'#f1f1f6', muted:'#9a9aa9', border:'#2a2a35', line:'#34343f', shadow:'0 1px 2px rgba(0,0,0,.4)', shadowHover:'0 18px 40px rgba(0,0,0,.55)' }
  };
  var ACCENTS = {
    indigo:{c:'oklch(0.55 0.17 275)',on:'#ffffff'},
    blue:{c:'oklch(0.58 0.15 240)',on:'#ffffff'},
    emerald:{c:'oklch(0.60 0.12 165)',on:'#ffffff'},
    terracotta:{c:'oklch(0.63 0.15 45)',on:'#ffffff'},
    plum:{c:'oklch(0.56 0.16 330)',on:'#ffffff'},
    amber:{c:'oklch(0.78 0.13 82)',on:'#3a2c00'}
  };
  var ACCENTS_DARK = {
    indigo:{c:'oklch(0.70 0.15 275)',on:'#0d0d13'},
    blue:{c:'oklch(0.72 0.13 240)',on:'#06121c'},
    emerald:{c:'oklch(0.74 0.12 165)',on:'#04140d'},
    terracotta:{c:'oklch(0.74 0.13 45)',on:'#1a0d04'},
    plum:{c:'oklch(0.72 0.14 330)',on:'#160416'},
    amber:{c:'oklch(0.84 0.12 85)',on:'#241a00'}
  };
  var FONTS = {
    'noto-sans':{family:"'Noto Sans KR', system-ui, sans-serif", href:'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap'},
    'noto-serif':{family:"'Noto Serif KR', Georgia, serif", href:'https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;700&display=swap'},
    'gothic-a1':{family:"'Gothic A1', sans-serif", href:'https://fonts.googleapis.com/css2?family=Gothic+A1:wght@400;500;700&display=swap'},
    'plex':{family:"'IBM Plex Sans KR', sans-serif", href:'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;700&display=swap'}
  };
  function assign(o, x){ return Object.assign({}, o, x); }
  function getData() {
    var history = [
      {year:'2018', title:'창업', desc:'서울 강남, 세 명의 공동창업자가 작은 사무실에서 시작했습니다.'},
      {year:'2020', title:'시리즈 A 투자 유치', desc:'80억 원 규모 투자를 유치하고 팀을 30명으로 확장했습니다.'},
      {year:'2022', title:'글로벌 진출', desc:'일본과 동남아시아 5개국에 서비스를 출시했습니다.'},
      {year:'2024', title:'누적 사용자 100만', desc:'월간 활성 사용자 100만 명을 달성하고 흑자 전환했습니다.'},
      {year:'2026', title:'AI 플랫폼 전환', desc:'차세대 AI 기반 제품군을 공개했습니다.'}
    ].map(function (h, i) { return assign(h, { left:i%2===0, right:i%2===1 }); });
    var milestones = [
      {date:'1월', title:'킥오프', sub:'팀 구성 · 범위 확정'},
      {date:'3월', title:'요구사항 확정', sub:'스펙 문서 v1'},
      {date:'5월', title:'베타 출시', sub:'사내 테스트'},
      {date:'8월', title:'정식 출시', sub:'공개 런칭'},
      {date:'11월', title:'글로벌 확장', sub:'3개 지역'}
    ].map(function (m, i) { return assign(m, { up:i%2===0, down:i%2===1 }); });
    var brand = [
      {year:'2015', title:'첫 스케치', desc:'주방 식탁에서 그린 한 장의 냅킨 스케치에서 시작했습니다.'},
      {year:'2017', title:'첫 제품 출시', desc:'크라우드펀딩으로 1억 원을 모아 첫 제품을 만들었습니다.'},
      {year:'2019', title:'리브랜딩', desc:'새로운 로고와 비주얼 아이덴티티를 도입했습니다.'},
      {year:'2021', title:'오프라인 1호점', desc:'성수동에 플래그십 스토어를 열었습니다.'},
      {year:'2023', title:'지속가능 패키지', desc:'전 제품 포장을 100% 재활용 소재로 전환했습니다.'}
    ].map(function (b, i) { return assign(b, { left:i%2===0, right:i%2===1 }); });
    var roadmap = [
      {q:'Q1', year:'2026', status:'완료', items:['모바일 앱 리뉴얼','다크 모드','오프라인 모드']},
      {q:'Q2', year:'2026', status:'진행 중', items:['팀 협업 기능','실시간 동기화']},
      {q:'Q3', year:'2026', status:'예정', items:['AI 어시스턴트','API 공개']},
      {q:'Q4', year:'2026', status:'예정', items:['엔터프라이즈 SSO','감사 로그']}
    ].map(function (q) { return assign(q, { isDone:q.status==='완료', isActive:q.status==='진행 중', isPlanned:q.status==='예정' }); });
    var onboarding = [
      {n:'01', title:'회원가입', desc:'이메일 또는 소셜 계정으로 30초 만에 가입하세요.'},
      {n:'02', title:'프로필 설정', desc:'팀과 역할을 입력해 맞춤 환경을 구성합니다.'},
      {n:'03', title:'워크스페이스 생성', desc:'첫 프로젝트를 만들고 템플릿을 선택하세요.'},
      {n:'04', title:'팀원 초대', desc:'링크 하나로 동료를 손쉽게 초대합니다.'},
      {n:'05', title:'시작하기', desc:'대시보드에서 바로 작업을 시작하세요.'}
    ].map(function (o, i, a) { return assign(o, { notLast:i<a.length-1 }); });
    var changelog = [
      {version:'v2.4.0', date:'2026.06.20', changes:[{tag:'NEW',text:'다크 모드 지원 추가'},{tag:'개선',text:'초기 로딩 속도 40% 향상'},{tag:'수정',text:'알림이 중복 표시되던 문제 해결'}]},
      {version:'v2.3.0', date:'2026.05.12', changes:[{tag:'NEW',text:'팀 워크스페이스 출시'},{tag:'개선',text:'검색 정확도 개선'},{tag:'수정',text:'CSV 내보내기 인코딩 오류 수정'}]},
      {version:'v2.2.1', date:'2026.04.28', changes:[{tag:'수정',text:'결제 단계 간헐적 오류 수정'},{tag:'수정',text:'모바일 레이아웃 깨짐 해결'}]}
    ].map(function (en) {
      return assign(en, { changes: en.changes.map(function (c) {
        return { text:c.text, tag:c.tag, isNew:c.tag==='NEW', isImprove:c.tag==='개선', isFix:c.tag==='수정' };
      }) });
    });
    var career = [
      {period:'2019 – 2021', role:'프론트엔드 엔지니어', org:'스타트업 A', desc:'디자인 시스템을 구축하고 웹 성능을 30% 개선했습니다.', tags:['React','TypeScript','디자인 시스템']},
      {period:'2021 – 2023', role:'시니어 엔지니어', org:'테크 기업 B', desc:'결제 플랫폼 팀을 이끌며 거래액 3배 성장을 이끌었습니다.', tags:['Node.js','결제','팀 리딩']},
      {period:'2023 – 현재', role:'프로덕트 리드', org:'현재 회사 C', desc:'신규 제품을 0에서 1로, 기획부터 출시까지 총괄합니다.', tags:['프로덕트','0→1','전략']}
    ];
    return { history:history, milestones:milestones, brand:brand, roadmap:roadmap, onboarding:onboarding, changelog:changelog, career:career };
  }
  window.TLData = { MODES:MODES, ACCENTS:ACCENTS, ACCENTS_DARK:ACCENTS_DARK, FONTS:FONTS, getData:getData };
})();
