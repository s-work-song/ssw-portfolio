"use client";

import { createContext, useContext } from "react";
import type {
  ActionId,
  AudienceChoice,
  ChatAnimation,
  ChatMessage,
  ChatStreamAnimation,
  Tone,
} from "./types";

export interface ChatContextValue {
  isOpen: boolean;
  isClosing: boolean;
  isLoading: boolean;
  error: string | null;
  messages: ChatMessage[];
  audience: AudienceChoice | null;
  tone: Tone;
  streamingEnabled: boolean;
  /** 사용자가 설정 화면에서 고른 값 그대로다. 설정 UI가 이 값을 표시한다. */
  chatAnimation: ChatAnimation;
  /** 모션 정책까지 반영한 실제 재생 값이다. 위젯은 이 값으로 연출을 고른다. */
  effectiveChatAnimation: ChatAnimation;
  /** 사용자가 설정 화면에서 고른 응답 텍스트 연출이다. */
  streamAnimation: ChatStreamAnimation;
  /** 모션 정책까지 반영한 실제 재생 값이다. */
  effectiveStreamAnimation: ChatStreamAnimation;
  open: () => void;
  close: () => void;
  completeCloseAnimation: () => void;
  toggle: () => void;
  selectAudience: (audience: AudienceChoice) => void;
  selectTone: (tone: Tone) => void;
  setStreamingEnabled: (enabled: boolean) => void;
  setChatAnimation: (animation: ChatAnimation) => void;
  setStreamAnimation: (animation: ChatStreamAnimation) => void;
  sendMessage: (message: string) => Promise<void>;
  stopGenerating: () => void;
  retry: () => Promise<void>;
  navigateAction: (id: ActionId) => void;
}

export const ChatContext = createContext<ChatContextValue | null>(null);

export function useChat(): ChatContextValue {
  const value = useContext(ChatContext);
  if (!value) {
    throw new Error("useChat은 ChatProvider 안에서 사용해야 합니다.");
  }
  return value;
}
