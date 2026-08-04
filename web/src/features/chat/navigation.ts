/**
 * 채팅의 콘텐츠 이동 액션과 About 셸이 직접 결합되지 않도록 사용하는
 * 브라우저 이벤트 계약이다. 셸이 이벤트를 처리하면 preventDefault로
 * 처리 여부를 돌려주고, 처리하지 못한 화면에서는 ChatProvider가 라우팅한다.
 */
export const CHAT_ACTION_NAVIGATE_EVENT =
  "portfolio:chat-action-navigate";
export const CHAT_ACTION_PAGE_ENTERED_EVENT =
  "portfolio:chat-action-page-entered";

export interface ChatActionNavigateDetail {
  route: string;
  attractTab: boolean;
}

export interface ChatActionPageEnteredDetail {
  path: string;
}

export function normalizeNavigationPath(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/u, "") : path;
}

export function pathWithoutHash(route: string): string {
  const hashIndex = route.indexOf("#");
  return normalizeNavigationPath(
    hashIndex >= 0 ? route.slice(0, hashIndex) : route,
  );
}

/** 현재 경로가 속한 About 대분류 탭을 반환한다. */
export function aboutTabPathFromPath(path: string): string | null {
  const normalizedPath = normalizeNavigationPath(path);
  const belongsTo = (tabPath: string) =>
    normalizedPath === tabPath || normalizedPath.startsWith(`${tabPath}/`);
  if (belongsTo("/about-me/resume")) {
    return "/about-me/resume";
  }
  if (belongsTo("/about-me/cover-letter")) {
    return "/about-me/cover-letter";
  }
  if (belongsTo("/about-me/research")) {
    return "/about-me/research";
  }
  if (belongsTo("/about-me/log")) {
    return "/about-me/log";
  }
  if (normalizedPath === "/about-me") return "/about-me";
  return null;
}
