export class LimitError extends Error {
  constructor(code) {
    super(code);
    this.name = "LimitError";
    this.code = code;
  }
}

export class FixedWindowRateLimiter {
  constructor({ windowMs, perIp, global }) {
    this.windowMs = windowMs;
    this.perIp = perIp;
    this.global = global;
    this.windowStart = Date.now();
    this.globalCount = 0;
    this.ipCounts = new Map();
  }

  take(ip, now = Date.now()) {
    if (now - this.windowStart >= this.windowMs) {
      this.windowStart = now;
      this.globalCount = 0;
      this.ipCounts.clear();
    }
    const ipCount = this.ipCounts.get(ip) ?? 0;
    if (this.globalCount >= this.global || ipCount >= this.perIp) {
      const retryAfterMs = Math.max(1, this.windowMs - (now - this.windowStart));
      return { allowed: false, retryAfterMs };
    }
    this.globalCount += 1;
    this.ipCounts.set(ip, ipCount + 1);
    return { allowed: true, retryAfterMs: 0 };
  }
}

export class Semaphore {
  constructor(limit, maxQueue) {
    this.limit = limit;
    this.maxQueue = maxQueue;
    this.active = 0;
    this.queue = [];
  }

  async run(operation, { signal } = {}) {
    if (signal?.aborted) throw new LimitError("cancelled");
    if (this.active < this.limit) {
      this.active += 1;
    } else {
      if (this.queue.length >= this.maxQueue) throw new LimitError("queue_full");
      await new Promise((resolve, reject) => {
        const waiter = { resolve, reject };
        const onAbort = () => {
          const index = this.queue.indexOf(waiter);
          if (index >= 0) this.queue.splice(index, 1);
          reject(new LimitError("cancelled"));
        };
        waiter.resolve = () => {
          signal?.removeEventListener("abort", onAbort);
          resolve();
        };
        if (signal) signal.addEventListener("abort", onAbort, { once: true });
        this.queue.push(waiter);
      });
    }
    try {
      return await operation();
    } finally {
      const next = this.queue.shift();
      if (next) {
        // 현재 permit을 다음 대기자에게 직접 넘겨 경합 중에도 limit을 넘지 않는다.
        next.resolve();
      } else {
        this.active -= 1;
      }
    }
  }
}

export class TtlCache {
  constructor(ttlMs, maxEntries = 100) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.entries = new Map();
  }

  get(key, now = Date.now()) {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= now) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key, value, now = Date.now()) {
    if (this.ttlMs <= 0) return;
    if (this.entries.size >= this.maxEntries) {
      this.entries.delete(this.entries.keys().next().value);
    }
    this.entries.set(key, { value, expiresAt: now + this.ttlMs });
  }
}
