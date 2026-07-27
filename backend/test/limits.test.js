import assert from "node:assert/strict";
import test from "node:test";
import { FixedWindowRateLimiter, LimitError, Semaphore } from "../src/limits.js";

test("IP별 및 전역 fixed-window 제한을 적용한다", () => {
  const limiter = new FixedWindowRateLimiter({ windowMs: 1_000, perIp: 2, global: 3 });
  const now = Date.now();
  assert.equal(limiter.take("a", now).allowed, true);
  assert.equal(limiter.take("a", now).allowed, true);
  assert.equal(limiter.take("a", now).allowed, false);
  assert.equal(limiter.take("b", now).allowed, true);
  assert.equal(limiter.take("c", now).allowed, false);
  assert.equal(limiter.take("a", now + 1_001).allowed, true);
});

test("semaphore가 동시 실행과 대기열을 제한한다", async () => {
  const semaphore = new Semaphore(1, 1);
  let release;
  let active = 0;
  let maximumActive = 0;
  const first = semaphore.run(
    () =>
      new Promise((resolve) => {
        active += 1;
        maximumActive = Math.max(maximumActive, active);
        release = () => {
          active -= 1;
          resolve("first");
        };
      }),
  );
  const second = semaphore.run(async () => {
    active += 1;
    maximumActive = Math.max(maximumActive, active);
    active -= 1;
    return "second";
  });
  await assert.rejects(
    semaphore.run(async () => "third"),
    (error) => error instanceof LimitError && error.code === "queue_full",
  );
  release();
  assert.deepEqual(await Promise.all([first, second]), ["first", "second"]);
  assert.equal(maximumActive, 1);
});

test("대기 중 요청이 취소되면 queue에서 제거한다", async () => {
  const semaphore = new Semaphore(1, 1);
  let release;
  const first = semaphore.run(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const controller = new AbortController();
  const waiting = semaphore.run(async () => "never", { signal: controller.signal });
  controller.abort();
  await assert.rejects(
    waiting,
    (error) => error instanceof LimitError && error.code === "cancelled",
  );
  release();
  await first;
  assert.equal(await semaphore.run(async () => "next"), "next");
});
