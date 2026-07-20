# dotnet-wpf-app

.NET WPF 샘플 애플리케이션 자리.

## 배포 방식

WPF 실행 파일은 브라우저에서 실행할 수 없으므로 GitHub Pages로 배포하지 않는다.
CI에서 빌드한 뒤 GitHub Releases에 산출물을 올리고, 진입 페이지(`web/`)의 소개
섹션에서 스크린샷·설명과 함께 다운로드 링크로 연결한다.

## 참고

`package.json`이 없어 npm workspaces 대상에서 자동으로 제외된다.
