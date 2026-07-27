"use client";

/**
 * 스트리밍으로 도착하는 답변 텍스트를 연출과 함께 그리는 표현 전용 컴포넌트다.
 * SSE는 전체 길이를 모른 채 delta만 도착하므로, 데모처럼 진행률(0..1)을 쓰지 않고
 * "방금 도착한 꼬리 구간"만 애니메이션 span으로 렌더한다. 앞부분은 평범한 문자열로
 * 굳혀 두어 delta마다 전체 텍스트를 다시 쪼개지 않는다(긴 답변 성능 보호).
 *
 * 각 span의 key는 메시지 안에서의 절대 오프셋이라, 창이 밀려도 이미 붙은 span은
 * 그대로 유지된다. 그래서 새로 마운트되는 조각만 CSS 애니메이션이 한 번 재생된다.
 */
import { useEffect, useMemo, useState } from "react";
import styles from "./ChatWidget.module.css";
import type { ChatStreamAnimation } from "./types";

/** 단어 단위 연출이 애니메이션 span으로 유지하는 최근 단어 수 */
const WORD_TAIL_COUNT = 10;
/** 글자 단위 연출이 애니메이션 span으로 유지하는 최근 글자 수 */
const CHAR_TAIL_COUNT = 24;
/** 토큰 청크 연출이 유지하는 최근 글자 수 */
const CHUNK_TAIL_COUNT = 28;
/** 스크램블이 무작위 문자로 덮어 두는 최근 글자 수 */
const SCRAMBLE_TAIL_COUNT = 6;
/** 스크램블 문자를 갈아 끼우는 주기(ms) */
const SCRAMBLE_INTERVAL_MS = 70;

const SCRAMBLE_SET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#%&*+=<>";

/**
 * 토큰 청크의 경계를 오프셋만으로 결정한다. 주기 14 안에서 2·4·3·5자로 끊기며,
 * 창이 밀려도 같은 오프셋은 항상 같은 청크의 시작이라 조각이 흔들리지 않는다.
 */
const CHUNK_PERIOD = 14;
const CHUNK_STARTS = new Set([0, 2, 6, 9]);

const WORD_ANIMATIONS: ReadonlySet<ChatStreamAnimation> = new Set([
  "word-fade",
  "blur-focus",
  "slide-up",
]);

const CHAR_ANIMATIONS: ReadonlySet<ChatStreamAnimation> = new Set([
  "mask-wipe",
  "letter-drop",
  "highlight-trail",
]);

const PIECE_CLASS: Partial<Record<ChatStreamAnimation, string>> = {
  "word-fade": styles.streamWordFade,
  "blur-focus": styles.streamBlurFocus,
  "slide-up": styles.streamSlideUp,
  "token-chunks": styles.streamTokenChunk,
  "mask-wipe": styles.streamMaskWipe,
  "letter-drop": styles.streamLetterDrop,
  "highlight-trail": styles.streamHighlightTrail,
};

interface TailPiece {
  /** 메시지 안에서의 절대 오프셋. span의 key로 쓴다. */
  key: number;
  value: string;
  /** 공백·줄바꿈이라 애니메이션을 걸지 않는 조각 */
  blank: boolean;
}

interface TailSplit {
  head: string;
  pieces: TailPiece[];
}

function isSpace(character: string): boolean {
  return (
    character === " " ||
    character === "\n" ||
    character === "\t" ||
    character === "\r"
  );
}

function isChunkStart(offset: number): boolean {
  return CHUNK_STARTS.has(offset % CHUNK_PERIOD);
}

/** 서로게이트 쌍 한가운데를 자르지 않도록 경계를 한 칸 앞으로 당긴다. */
function safeStart(text: string, start: number): number {
  if (start <= 0) return 0;
  const code = text.charCodeAt(start);
  return code >= 0xdc00 && code <= 0xdfff ? start - 1 : start;
}

/**
 * 뒤에서부터 훑어 최근 maxWords개 단어가 시작되는 오프셋을 찾는다.
 * 전체 길이와 무관하게 꼬리 길이에만 비례한다.
 */
function wordTailStart(text: string, maxWords: number): number {
  let end = text.length;
  let words = 0;

  while (end > 0 && words < maxWords) {
    let cursor = end;
    while (cursor > 0 && isSpace(text[cursor - 1])) cursor -= 1;
    if (cursor === 0) return 0;
    while (cursor > 0 && !isSpace(text[cursor - 1])) cursor -= 1;
    words += 1;
    end = cursor;
  }

  return end;
}

function splitWordTail(text: string, maxWords: number): TailSplit {
  const start = wordTailStart(text, maxWords);
  const pieces: TailPiece[] = [];
  let offset = start;

  for (const token of text.slice(start).split(/(\s+)/u)) {
    if (!token) continue;
    pieces.push({ key: offset, value: token, blank: isSpace(token[0]) });
    offset += token.length;
  }

  return { head: text.slice(0, start), pieces };
}

function splitCharTail(text: string, maxChars: number): TailSplit {
  const start = safeStart(text, Math.max(0, text.length - maxChars));
  const pieces: TailPiece[] = [];
  let offset = start;

  for (const character of text.slice(start)) {
    pieces.push({ key: offset, value: character, blank: isSpace(character) });
    offset += character.length;
  }

  return { head: text.slice(0, start), pieces };
}

/** 청크 경계에 맞춰 꼬리를 자르고 2~5자 조각으로 묶는다. */
function splitChunkTail(text: string, maxChars: number): TailSplit {
  let start = safeStart(text, Math.max(0, text.length - maxChars));
  while (start > 0 && !isChunkStart(start)) start -= 1;

  const pieces: TailPiece[] = [];
  let offset = start;

  for (const character of text.slice(start)) {
    const last = pieces[pieces.length - 1];
    if (!last || isChunkStart(offset)) {
      pieces.push({ key: offset, value: character, blank: false });
    } else {
      last.value += character;
    }
    offset += character.length;
  }

  return { head: text.slice(0, start), pieces };
}

/**
 * 오프셋과 틱만으로 무작위처럼 보이는 문자를 고른다.
 * 렌더 중 Math.random을 쓰지 않아 같은 입력이면 같은 결과가 나온다.
 */
function scrambledCharacter(offset: number, tick: number): string {
  const index = (offset * 31 + tick * 17 + 7) % SCRAMBLE_SET.length;
  return SCRAMBLE_SET[index];
}

interface StreamingTextProps {
  text: string;
  animation: ChatStreamAnimation;
  /** 아직 delta가 도착하는 중인지. 커서·스켈레톤·스크램블 타이머를 좌우한다. */
  isStreaming: boolean;
}

export function StreamingText({
  text,
  animation,
  isStreaming,
}: Readonly<StreamingTextProps>) {
  const [scrambleTick, setScrambleTick] = useState(0);
  const scrambling = animation === "scramble" && isStreaming;

  useEffect(() => {
    if (!scrambling) return;
    const timer = window.setInterval(
      () => setScrambleTick((tick) => tick + 1),
      SCRAMBLE_INTERVAL_MS,
    );
    return () => window.clearInterval(timer);
  }, [scrambling]);

  const split = useMemo<TailSplit | null>(() => {
    if (WORD_ANIMATIONS.has(animation)) {
      return splitWordTail(text, WORD_TAIL_COUNT);
    }
    if (CHAR_ANIMATIONS.has(animation)) {
      return splitCharTail(text, CHAR_TAIL_COUNT);
    }
    if (animation === "token-chunks") {
      return splitChunkTail(text, CHUNK_TAIL_COUNT);
    }
    if (animation === "scramble") {
      return splitCharTail(text, SCRAMBLE_TAIL_COUNT);
    }
    return null;
  }, [animation, text]);

  if (animation === "typewriter") {
    return (
      <>
        {text}
        {isStreaming && (
          <span className={styles.streamCursor} aria-hidden="true" />
        )}
      </>
    );
  }

  if (animation === "skeleton") {
    return (
      <>
        {text}
        {isStreaming && (
          <span className={styles.streamSkeleton} aria-hidden="true" />
        )}
      </>
    );
  }

  if (animation === "scramble" && split) {
    return (
      <>
        {split.head}
        {split.pieces.map((piece) =>
          piece.blank ? (
            <span key={piece.key}>{piece.value}</span>
          ) : (
            <span key={piece.key} className={styles.streamScramble}>
              {isStreaming
                ? scrambledCharacter(piece.key, scrambleTick)
                : piece.value}
            </span>
          ),
        )}
        {isStreaming && (
          <span className={styles.streamBlockCursor} aria-hidden="true" />
        )}
      </>
    );
  }

  if (!split) return <>{text}</>;

  const pieceClass = PIECE_CLASS[animation];

  return (
    <>
      {split.head}
      {split.pieces.map((piece) => (
        <span
          key={piece.key}
          className={piece.blank ? undefined : pieceClass}
        >
          {piece.value}
        </span>
      ))}
      {isStreaming && animation === "token-chunks" && (
        <span className={styles.streamCursor} aria-hidden="true" />
      )}
      {isStreaming && animation === "mask-wipe" && (
        <span className={styles.streamWipeEdge} aria-hidden="true" />
      )}
      {isStreaming && animation === "highlight-trail" && (
        <span className={styles.streamTrailEdge} aria-hidden="true" />
      )}
    </>
  );
}
