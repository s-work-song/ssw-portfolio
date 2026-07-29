<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 프로젝트 컨텍스트

이 레포는 **개인 포트폴리오 공개 프런트엔드(ssw-portfolio-public)** 다. GitHub Pages 정적 배포와 공개 코드만 관리한다. RAG 백엔드와 비공개 데이터는 `s-work-song/ssw-portfolio-private`에서 함께 관리한다. 유지/정리 대상 목록은 [README.md](README.md) 참고.

## 작업 원칙

- **원격 푸시 금지(기본값)**: 새 원격 레포 생성과 푸시는 반드시 사용자 확인 후 진행한다. 대상은 개인 계정 `s-work-song`이며, 팀 계정 `s-work-agency`로는 어떤 것도 올리지 않는다. (로컬 `gh` CLI가 팀 계정으로 인증되어 있을 수 있으니 푸시 전 계정 확인 필수.)
- **어바웃미 콘텐츠가 핵심 자산**: `src/app/about-me/`, `src/content/logs/`, `docs/about-me/`는 함부로 삭제하지 않는다. 솎아내기는 에이전시 잔재가 대상이다.
- **저장소 경로 정합성**: 저장소 이름을 바꾸면 `package.json`, Pages 워크플로의 `NEXT_PUBLIC_BASE_PATH`, 문서의 공개 URL을 함께 맞춘다.
- `.agents-ssw/`는 에이전트 협업용 임시 폴더다. 결과물 레포에는 포함하지 않는다 (.gitignore 처리됨).

## 에이전트 간 소통

클로드(claude-desktop)와 코덱스(codex)는 `.agents-ssw/ssw-communication/inbox/<수신자>/`에 마크다운 파일을 넣는 방식으로 소통한다. 규약은 `.agents-ssw/ssw-communication/README.md` 참고. 작업을 시작하기 전에 자기 인박스를 먼저 확인할 것.
