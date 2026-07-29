# ssw-portfolio-public

SW Song의 개인 포트폴리오 공개 저장소다. GitHub Pages에 정적 배포하는 프런트엔드와
사이트에서 소개하는 공개 코드만 둔다. RAG 챗봇 백엔드와 비공개 원문·평가 데이터는
`s-work-song/ssw-portfolio-private`에서 하나의 배포 단위로 관리한다.

- 사이트: <https://s-work-song.github.io/ssw-portfolio-public/>

## 구조

| 경로 | 역할 |
|---|---|
| `web/` | 진입 페이지. Next.js 정적 export로 GitHub Pages에 배포한다. 이력·연구 정리·로그와 RAG 챗봇 UI가 여기 있다 |
| `benchmarks/` | 사이트 연구 탭의 측정 실험 코드 자리 (.NET). 실험별 폴더 + README로 채워 나간다 — **합류 예정** |
| `sample-apps/` | 각 플랫폼 구현을 보여 주는 샘플 앱 자리. `dotnet-wpf-app`, `kotlin-android-app`, `react-web-app` |
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
`web/.env.local`을 만들고 `NEXT_PUBLIC_RAG_API_BASE_URL`에 배포된 백엔드 주소를 넣는다.
주소가 비어 있으면 사이트는 그대로 뜨고 챗봇만 안내 문구로 대체된다.

정적 export 결과를 확인하려면 `npm run build -w web` 후 `npm run serve:static -w web`.

## 배포

`dev`에 올린 `web/` 변경은 `.github/workflows/pages.yml`이 정적 export 해서 GitHub
Pages로 배포한다(수동 실행도 가능). 프로젝트 페이지라 빌드에
`NEXT_PUBLIC_BASE_PATH=/ssw-portfolio-public`을 주입한다. 백엔드는 이 저장소와
GitHub Pages 배포 산출물에 포함하지 않는다.
