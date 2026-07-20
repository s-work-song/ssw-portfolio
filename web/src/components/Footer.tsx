/**
 * 홈 하단의 브랜드 설명·보조 탐색·연락처를 제공하는 순수 프레젠테이션 컴포넌트다.
 * 상태나 데이터 접근 없이 정적 링크 계약만 렌더링해 전역 레이아웃과 독립적으로
 * 재사용할 수 있으며, 설정 화면으로 가는 비-FAB 진입점도 보장한다.
 */
import Link from "next/link";

const footerLinks = [
  { label: "소개", href: "/about-me" },
  { label: "이력서", href: "/about-me/resume" },
  { label: "자기소개서", href: "/about-me/cover-letter" },
  { label: "연구", href: "/about-me/research" },
  { label: "기록", href: "/about-me/log" },
  { label: "설정", href: "/settings" },
];

export default function Footer() {
  return (
    <footer
      style={{
        position: "relative",
        borderTop: "1px solid var(--border)",
        background: "var(--bg-elev)",
        padding: "52px 0 34px",
      }}
    >
      <div
        style={{
          width: "min(1180px, calc(100% - 40px))",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: "42px",
          }}
        >
          <div style={{ maxWidth: "420px" }}>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "11px",
                color: "var(--text)",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              <span
                style={{
                  width: "34px",
                  height: "34px",
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "9px",
                  background: "var(--accent, #6366f1)",
                  color: "var(--accent-contrast, #fff)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                S
              </span>
              SW Song
            </Link>
            <p
              style={{
                margin: "18px 0 0",
                color: "var(--text-dim)",
                fontSize: "14px",
                lineHeight: 1.75,
                wordBreak: "keep-all",
              }}
            >
              컴퓨팅 스택의 원리를 탐구하고, 측정 가능한 개선을 제품으로
              연결하는 소프트웨어 엔지니어입니다.
            </p>
          </div>

          <nav
            aria-label="푸터 메뉴"
            style={{
              maxWidth: "480px",
              display: "flex",
              flexWrap: "wrap",
              alignContent: "flex-start",
              justifyContent: "flex-end",
              gap: "8px 22px",
            }}
          >
            {footerLinks.map((item) => (
              <Link
                className="hover-footer-link"
                href={item.href}
                key={item.href}
                style={{
                  color: "var(--text-dim)",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div
          style={{
            marginTop: "42px",
            paddingTop: "22px",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: "12px",
            borderTop: "1px solid var(--border)",
            color: "var(--text-mute)",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "11px",
          }}
        >
          <span>© 2026 SW Song</span>
          <a
            className="hover-footer-link"
            href="mailto:sworksong@gmail.com"
            style={{ textDecoration: "none" }}
          >
            sworksong@gmail.com
          </a>
        </div>
      </div>
    </footer>
  );
}
