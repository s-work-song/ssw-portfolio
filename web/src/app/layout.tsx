/**
 * 포트폴리오의 최상위 조합 루트(Composition Root)다.
 * 전역 메타데이터와 스타일을 선언하고, next-themes를 감싼 ThemeProvider와
 * 전역 포트폴리오 채팅을 모든 라우트에 한 번만 연결한다(Provider 패턴).
 */
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "../context/ThemeContext";
import { ChatProvider } from "../features/chat";

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
          <ChatProvider>{children}</ChatProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
