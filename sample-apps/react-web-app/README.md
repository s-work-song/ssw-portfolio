# react-web-app

React 웹 샘플 애플리케이션 자리.

## 배포 방식

웹 앱이므로 GitHub Pages에 함께 배포한다. `.github/workflows/pages.yml`의
build 잡에 빌드·복사 단계를 추가하고, 번들러의 base 경로를
`/ssw-portfolio-public/react-web-app/` 으로 맞추면 아래 주소로 서빙된다.

    https://s-work-song.github.io/ssw-portfolio-public/react-web-app/

## 참고

npm 프로젝트로 만들면(`package.json` 추가) 루트 워크스페이스에 자동으로 잡힌다.
