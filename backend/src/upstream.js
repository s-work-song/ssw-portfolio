export class UpstreamError extends Error {
  constructor(code, message = "Upstream request failed", { status } = {}) {
    super(message);
    this.name = "UpstreamError";
    this.code = code;
    this.status = status;
  }
}

function completionUrl(baseUrl) {
  const normalized = baseUrl.replace(/\/+$/u, "");
  return normalized.endsWith("/v1")
    ? `${normalized}/chat/completions`
    : `${normalized}/v1/chat/completions`;
}

function classifyStatus(status) {
  return status === 408
    ? "timeout"
    : status === 429
      ? "overloaded"
      : status >= 500
        ? "server_error"
        : "client_error";
}

function createRequestController(signal, timeoutMs) {
  const controller = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener("abort", abortFromCaller, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  return {
    controller,
    wasTimedOut: () => timedOut,
    dispose() {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abortFromCaller);
    },
  };
}

function requestBody(model, messages, stream) {
  return JSON.stringify({
    model,
    messages,
    temperature: 0.2,
    max_tokens: 500,
    stream,
  });
}

function parseSseEvent(block) {
  const data = block
    .split(/\r\n|\n|\r/u)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).replace(/^ /u, ""))
    .join("\n");
  if (!data) return { kind: "ignore" };
  if (data.trim() === "[DONE]") return { kind: "done" };
  try {
    const payload = JSON.parse(data);
    const delta = payload?.choices?.[0]?.delta?.content;
    return typeof delta === "string"
      ? { kind: "delta", text: delta }
      : { kind: "ignore" };
  } catch {
    throw new UpstreamError("invalid_response");
  }
}

async function* decodeOpenAiSse(body, signal) {
  if (!body) throw new UpstreamError("invalid_response");
  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let buffer = "";
  let sawDone = false;
  let sawContent = false;

  const parseAvailable = function* (flush = false) {
    while (true) {
      const separator = buffer.match(/\r\n\r\n|\n\n|\r\r/u);
      if (!separator) break;
      const block = buffer.slice(0, separator.index);
      buffer = buffer.slice(separator.index + separator[0].length);
      yield parseSseEvent(block);
    }
    if (flush && buffer.trim()) {
      const block = buffer;
      buffer = "";
      yield parseSseEvent(block);
    }
  };

  try {
    while (!sawDone) {
      const { done, value } = await reader.read();
      if (done) {
        buffer += decoder.decode();
        for (const event of parseAvailable(true)) {
          if (event.kind === "done") {
            sawDone = true;
            break;
          }
          if (event.kind === "delta") {
            sawContent ||= Boolean(event.text.trim());
            yield event.text;
          }
        }
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      for (const event of parseAvailable()) {
        if (event.kind === "done") {
          sawDone = true;
          break;
        }
        if (event.kind === "delta") {
          sawContent ||= Boolean(event.text.trim());
          yield event.text;
        }
      }
    }
  } catch (error) {
    if (error instanceof UpstreamError) throw error;
    if (error?.name === "AbortError" || signal?.aborted) throw error;
    throw new UpstreamError("invalid_response");
  } finally {
    try {
      await reader.cancel();
    } catch {
      // 이미 닫힌 스트림이나 취소된 fetch body는 추가 조치가 필요 없다.
    }
    reader.releaseLock();
  }

  if (!sawDone || !sawContent) throw new UpstreamError("invalid_response");
}

export function createOpenAIClient({ baseUrl, apiKey, model, timeoutMs = 30_000, fetchImpl = fetch }) {
  return {
    async chat(messages, { signal } = {}) {
      if (!baseUrl || !model) throw new UpstreamError("not_configured");
      const request = createRequestController(signal, timeoutMs);
      try {
        const headers = { "content-type": "application/json" };
        if (apiKey) headers.authorization = `Bearer ${apiKey}`;
        const response = await fetchImpl(completionUrl(baseUrl), {
          method: "POST",
          headers,
          body: requestBody(model, messages, false),
          signal: request.controller.signal,
        });
        if (!response.ok) {
          throw new UpstreamError(classifyStatus(response.status), "Upstream returned an error status", {
            status: response.status,
          });
        }
        const payload = await response.json();
        const answer = payload?.choices?.[0]?.message?.content;
        if (typeof answer !== "string" || !answer.trim()) {
          throw new UpstreamError("invalid_response");
        }
        return answer.trim();
      } catch (error) {
        if (error instanceof UpstreamError) throw error;
        if (error.name === "AbortError") {
          throw new UpstreamError(request.wasTimedOut() ? "timeout" : "cancelled");
        }
        throw new UpstreamError("network");
      } finally {
        request.dispose();
      }
    },

    async *chatStream(messages, { signal } = {}) {
      if (!baseUrl || !model) throw new UpstreamError("not_configured");
      const request = createRequestController(signal, timeoutMs);
      try {
        const headers = { "content-type": "application/json" };
        if (apiKey) headers.authorization = `Bearer ${apiKey}`;
        const response = await fetchImpl(completionUrl(baseUrl), {
          method: "POST",
          headers,
          body: requestBody(model, messages, true),
          signal: request.controller.signal,
        });
        if (!response.ok) {
          throw new UpstreamError(classifyStatus(response.status), "Upstream returned an error status", {
            status: response.status,
          });
        }
        for await (const delta of decodeOpenAiSse(response.body, request.controller.signal)) {
          yield delta;
        }
      } catch (error) {
        if (error instanceof UpstreamError) throw error;
        if (error.name === "AbortError" || request.controller.signal.aborted) {
          throw new UpstreamError(request.wasTimedOut() ? "timeout" : "cancelled");
        }
        throw new UpstreamError("network");
      } finally {
        request.controller.abort();
        request.dispose();
      }
    },
  };
}
