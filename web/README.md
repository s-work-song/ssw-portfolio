# web — 포트폴리오 진입 페이지

Next.js 정적 export로 만든 진입 페이지예요. 이력·연구 정리·로그와 함께 RAG 챗봇
UI를 담고 있고, GitHub Pages로 배포합니다.

## 로컬 실행

의존성은 저장소 루트의 npm workspaces로 관리해요.

```powershell
npm ci
npm run dev -w web
```

챗봇을 붙이려면 `.env.example`을 복사해 `.env.local`을 만들고
`NEXT_PUBLIC_RAG_API_BASE_URL`에 비공개 저장소에서 배포한 RAG 백엔드 주소를 넣습니다.
주소가 비어 있으면 사이트는 그대로 뜨고 챗봇만 안내 문구로 대체돼요.

같은 Wi-Fi의 모바일에서 확인할 때는 `.env.local`에 노트북 IPv4를 `LOCAL_DEV_IP`로
넣고 `npm run dev:lan`으로 띄운 뒤 `http://<노트북-IP>:3000/about-me/`로 접속합니다.

정적 export 결과를 그대로 확인하려면 빌드 후 내장 정적 서버를 씁니다.

```powershell
npm run build -w web
npm run serve:static -w web
```

## 챗봇 통합 범위

- 모든 라우트에 유지되는 플로팅 채팅
- 방문자 관점 선택과 세 가지 말투
- RAG `/api/chat` 연결과 검색 근거 표시
- 데스크톱 내부 이동 시 대화 유지
- 모바일 전체형 오버레이와 관련 페이지 이동
- 추론 서버 오프라인 시 retrieval fallback 구분

API 키와 모델 서버 주소는 브라우저에 두지 않고 RAG 백엔드에서만 관리해요.
브라우저에 노출되는 값은 `NEXT_PUBLIC_*` 뿐입니다.

## 배포

`.github/workflows/pages.yml`이 `NEXT_PUBLIC_BASE_PATH=/ssw-portfolio-public`을 주입해
빌드하고 `out/`을 Pages 아티팩트로 올립니다. 프로젝트 페이지 하위 경로 문제는
`next.config.ts`의 `basePath`가 처리해요.
