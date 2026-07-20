# ssw-portfolio

개인 포트폴리오 웹사이트. S-Work Agency 브로슈어 사이트(`ssw-brochure-site`)를 베이스로 가져와, 어바웃미(About Me) 중심의 개인 포트폴리오로 개편하는 중입니다.

## 현재 상태 (전환 작업 중)

- 원본 레포에서 통으로 복사해 왔고, 깃 이력은 제거된 상태입니다 (새 레포로 시작 예정).
- 에이전시용 콘텐츠를 솎아내고 개인 포트폴리오로 재구성하는 작업이 남아 있습니다.
- 최종적으로 개인 계정(`s-work-song`)의 새 저장소로 올라갑니다.

### 유지 대상 (포트폴리오 핵심)

- `src/app/about-me/` — 어바웃미 페이지 일체: 메인, 자기소개서(`cover-letter`), 이력서(`resume`), 리서치(`research`), 로그(`log/[slug]`)
- `src/components/CareerTimeline.tsx`, `ResearchViewer.tsx` 등 어바웃미 연관 컴포넌트
- `src/content/logs/` — 로그 콘텐츠 (마크다운 → `scripts/generate-posts.mjs`로 빌드 시 생성)
- `docs/about-me/` — 참고 자료 (최적화 포트폴리오, 공백기 타임라인 회고 등)

### 정리 대상 (에이전시 잔재)

- 에이전시 랜딩 섹션: `src/components/sections/`의 Hero / Services / Portfolio / Process / Network / FAQ / Contact
- 에이전시 명의의 문구·메타데이터, `package.json`·`wrangler.jsonc`의 `ssw-brochure-site` 네이밍
- `.temp/`, `docs/troubleshooting/` 등 원본 레포의 작업 메모

## 기술 스택

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: 순수 CSS + CSS Variables (다크/라이트 테마, `next-themes`)
- **Content**: 마크다운 로그 (`gray-matter` + `react-markdown`, 빌드 전 `scripts/generate-posts.mjs`로 인덱싱)
- **Deploy**: Cloudflare Workers (`@opennextjs/cloudflare` + `wrangler`) — 개인 계정 기준으로 재설정 필요

## 개발

```bash
npm install
npm run dev      # 로그 인덱스 생성 후 개발 서버
npm run build    # 프로덕션 빌드
npm run preview  # Cloudflare 로컬 프리뷰
```

## 에이전트 협업

이 레포는 클로드·코덱스가 함께 작업합니다. 협업 규약과 작업 인계는 [AGENTS.md](AGENTS.md)와 `.agents-ssw/ssw-communication/`을 참고하세요.
