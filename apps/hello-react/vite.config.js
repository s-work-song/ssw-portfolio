import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * GitHub Pages 프로젝트 페이지는 사이트가 저장소 이름 하위 경로에 놓인다.
 * 이 앱은 <owner>.github.io/ssw-portfolio/hello-react/ 로 서빙되므로
 * base를 그 경로로 맞춰야 번들·자산 링크가 깨지지 않는다.
 * 로컬 개발(vite dev)에서는 루트로 서빙해 경로 부담을 없앤다.
 */
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/ssw-portfolio/hello-react/' : '/',
}));
