/**
 * 포트폴리오의 최상위 조합 루트(Composition Root)다.
 * 전역 메타데이터와 스타일을 선언하고, next-themes를 감싼 ThemeProvider와
 * 전역 FloatingMenu를 모든 라우트에 한 번만 연결한다(Provider 패턴).
 */
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "../context/ThemeContext";
import FloatingMenu from "../components/FloatingMenu";

/**
 * 플로팅 메뉴 노출 여부. 메인 화면 정비 전까지 감춰둔다.
 * DOM에서 아예 제외해 키보드 탐색·스크린리더에도 잡히지 않게 한다
 * (CSS로 숨기면 초점이 남아 접근성 문제가 생긴다).
 */
const SHOW_FLOATING_MENU = false;

export const metadata: Metadata = {
  title: {
    default: "송상운 | Software Engineer",
    template: "%s | 송상운",
  },
  description:
    "컴퓨팅 스택의 원리를 탐구하고 측정 가능한 개선을 제품으로 연결하는 소프트웨어 엔지니어 송상운의 포트폴리오입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
          {SHOW_FLOATING_MENU && <FloatingMenu />}
        </ThemeProvider>
      </body>
    </html>
  );
}
