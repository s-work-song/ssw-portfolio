/**
 * @file generate-posts.mjs
 * @description 빌드/개발 시작 시점에 로컬 마크다운 포스트 파일들을 읽어 단일 JSON 데이터베이스 파일(posts.json)을 자동 생성하는 Node.js 유틸리티 스크립트입니다.
 * 
 * [동작 상세 및 유지보수 가이드]
 * - 본 스크립트는 package.json의 실행 스크립트('build', 'dev') 직전에 동기식으로 호출되도록 연동되어 있습니다.
 * - Cloudflare Workers 엣지 런타임의 로컬 파일시스템(fs) 접근 불가능 제약을 해소하기 위한 빌드 전처리 파이프라인의 핵심 도구입니다.
 * - 마크다운 파일들의 메타데이터(Frontmatter) 분석에는 'gray-matter' 모듈이 사용됩니다.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

// ES Module 환경에서는 __dirname이 정의되지 않으므로 import.meta.url을 통해 계산합니다.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 원본 마크다운 로그 포스트 파일들이 들어 있는 로컬 물리적 디렉토리 경로 정의
const postsDirectory = path.join(__dirname, '../src/content/logs');

// 결과물 JSON 파일이 저장될 출력 대상 폴더 및 파일 경로 정의
const outputDir = path.join(__dirname, '../src/content');
const outputFile = path.join(outputDir, 'posts.json');

/**
 * @function generatePostsJson
 * @description logs 폴더 내의 *.md 파일을 순회하며 메타데이터와 본문을 분리 추출하고, 하나의 JSON 구조로 병합하여 파일로 영속화합니다.
 */
function generatePostsJson() {
  console.log('클라우드플레어 빌드 대비 마크다운 포스트 컴파일 작업을 시작합니다...');
  console.log(`조회 디렉토리: ${postsDirectory}`);
  
  // 마크다운 디렉토리가 없을 시 예외 방지를 위해 재귀적으로 폴더 생성 처리
  if (!fs.existsSync(postsDirectory)) {
    fs.mkdirSync(postsDirectory, { recursive: true });
  }

  // 대상 폴더 내 모든 파일 리스트업
  const fileNames = fs.readdirSync(postsDirectory);
  
  const posts = fileNames
    .filter((fileName) => fileName.endsWith('.md')) // 마크다운(.md) 파일만 스크리닝
    .map((fileName) => {
      // 파일명에서 확장자를 지워 URL 라우팅 경로용 slug를 획득 (예: 'hello-world.md' -> 'hello-world')
      const slug = fileName.replace(/\.md$/, '');
      
      // 파일 원본 읽기
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      
      // gray-matter로 마크다운 상단 정보(Frontmatter) 영역과 실제 Markdown Content 본문 영역을 파싱
      const matterResult = matter(fileContents);

      // 개별 포스트 데이터 구조체 매핑 수행
      return {
        slug,
        title: matterResult.data.title || 'Untitled', // 제목이 없는 경우 방어 기본값 부여
        date: matterResult.data.date || new Date().toISOString().split('T')[0], // 날짜 누락 시 현재 시간 할당
        summary: matterResult.data.summary || '', // 목록 요약글
        content: matterResult.content, // 실제 본문 마크다운 내용
      };
    });

  // 최종 컴파일 결과 파일이 위치할 폴더의 생성을 보장
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // JSON 포맷을 이쁘게 정렬하여 파일로 동기 쓰기 처리 (UTF-8 지정)
  fs.writeFileSync(outputFile, JSON.stringify(posts, null, 2), 'utf8');
  console.log(`성공: ${outputFile} 생성 완료 (총 ${posts.length}개의 포스트 패킹됨).`);
}

// 스크립트 실행 트리거
generatePostsJson();
