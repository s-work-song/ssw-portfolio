# services

API 서버·MCP 게이트웨이 등 백엔드 서비스 자리.

GitHub Pages는 정적 파일만 서빙하므로 이 폴더의 서비스들은 Pages가 아니라
별도 런타임(예: Cloudflare Workers)에 배포한다. Actions에서 `wrangler-action`으로
배포하되, 워크플로 트리거에 `paths: ['services/**']` 필터를 걸어 웹만 수정했을 때
서비스가 재배포되지 않게 한다.

정적 사이트에서 이 서비스들을 호출하려면 응답에
`Access-Control-Allow-Origin: https://s-work-song.github.io` 를 포함해야 한다.
