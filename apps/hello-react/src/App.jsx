/**
 * 배포 확인용 최소 화면. 카운터는 번들된 JS가 실제로 실행되는지
 * (정적 HTML만 뜨는 게 아닌지) 눈으로 확인하기 위한 것이다.
 */
import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '40px', lineHeight: 1.6 }}>
      <h1>Hello React</h1>
      <p>GitHub Pages + Vite 배포 확인용 페이지입니다.</p>
      <button type="button" onClick={() => setCount((c) => c + 1)}>
        클릭 횟수: {count}
      </button>
    </main>
  );
}
