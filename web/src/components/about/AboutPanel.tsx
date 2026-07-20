/**
 * About 하위 페이지가 공유하는 표면·테두리·그림자 프리미티브다.
 * ReactNode와 CSSProperties만 의존하는 작은 계약(ISP)을 제공하며, 레이아웃 값은
 * 호출자가 주입하므로 기존 화면의 픽셀 배치를 바꾸지 않는다.
 */
import type { CSSProperties, ReactNode } from 'react';

export default function AboutPanel({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <section
      style={{
        background: 'var(--bg-elev)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow)',
        ...style,
      }}
    >
      {children}
    </section>
  );
}
