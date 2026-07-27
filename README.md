# ssw-portfolio

SW Song의 개인 포트폴리오 저장소다. 사이트(진입 페이지)와 그 사이트를 받쳐 주는
RAG 챗봇 백엔드, 그리고 언어·플랫폼별 샘플 앱 자리를 한 저장소에 모아 둔다.

- 사이트: <https://s-work-song.github.io/ssw-portfolio/>

## 구조

| 경로 | 역할 |
|---|---|
| `web/` | 진입 페이지. Next.js 정적 export로 GitHub Pages에 배포한다. 이력·연구 정리·로그와 RAG 챗봇 UI가 여기 있다 |
| `backend/` | 포트폴리오 챗봇의 RAG API 서버. Node.js 내장 모듈 위주로 만든 검색·SSE 스트리밍·레이트 리밋 구현 |
| `benchmarks/` | 사이트 연구 탭의 측정 실험 코드 자리 (.NET). 실험별 폴더 + README로 채워 나간다 — **합류 예정** |
| `sample-apps/` | 각 플랫폼 구현을 보여 주는 샘플 앱 자리. `dotnet-wpf-app`, `kotlin-android-app`, `react-web-app` |
| `services/` | Pages가 아닌 별도 런타임에 올릴 서비스 자리 |
| `packages/` | 여러 앱이 공유하게 될 코드 자리 |

각 폴더의 README에 배포 방식과 채우는 기준을 적어 뒀다. 비어 있는 자리는
"쓰게 될 때 채운다"는 원칙으로 남겨 둔 것이다.

## 로컬 실행

### web — 진입 페이지

```powershell
npm ci
npm run dev -w web
```

`http://localhost:3000`에서 열린다. 챗봇을 붙이려면 `web/.env.example`을 복사해
`web/.env.local`을 만들고 `NEXT_PUBLIC_RAG_API_BASE_URL`에 백엔드 주소를 넣는다.
주소가 비어 있으면 사이트는 그대로 뜨고 챗봇만 안내 문구로 대체된다.

정적 export 결과를 확인하려면 `npm run build -w web` 후 `npm run serve:static -w web`.

### backend — RAG API

```powershell
cd backend
npm ci
Copy-Item .env.example .env
npm start
```

기본 주소는 `http://127.0.0.1:8787`이다. 모델 서버 주소와 API 키는 브라우저가 아니라
`backend/.env`에서만 읽는다. 자세한 환경 변수와 API 계약은
[backend/README.md](backend/README.md) 참고.

### RAG 원문 연결

챗봇이 인용하는 원문(`knowledge/`)과 평가 케이스(`evals/`)는 개인 정보를 담고 있어
비공개 저장소 `ssw-portfolio-private`에 둔다. 두 저장소를 나란히 클론한 뒤
`backend/.env`에서 경로를 연결한다.

```text
<작업 폴더>/
├─ ssw-portfolio/          # 이 저장소
└─ ssw-portfolio-private/  # knowledge/, evals/
```

```dotenv
RAG_KNOWLEDGE_DIR=../../ssw-portfolio-private/knowledge
```

상대 경로는 `backend/` 기준으로 해석하고, 지정하지 않으면 `backend/../knowledge`를
쓴다. 원문이 없는 환경에서도 서버 기동과 `npm test`는 그대로 동작한다 —
원문을 필요로 하는 테스트만 건너뛴다.

## 배포

`dev`에 올린 `web/` 변경은 `.github/workflows/pages.yml`이 정적 export 해서 GitHub
Pages로 배포한다(수동 실행도 가능). 프로젝트 페이지라 빌드에
`NEXT_PUBLIC_BASE_PATH=/ssw-portfolio`를 주입한다. `backend/`는 정적 호스팅 대상이
아니므로 별도 런타임에서 돌린다.
