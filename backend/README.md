# 포트폴리오 RAG 백엔드

Node.js 20+ 기반의 포트폴리오 백엔드예요. `knowledge/**/*.md`를 시작 시 읽어 검색하고,
검색 근거와 `knowledge/persona.md` 정책을 OpenAI-compatible vLLM 서버에 전달해 답변합니다.
기본 lexical 검색은 자체 구현을 유지하며, 실험 모드에서만 Orama와 Transformers.js
어댑터를 사용합니다.

> 기본값은 BM25와 한국어 문자 n-gram을 결합한 lexical RAG예요. 선택적으로 local dense
> embedding과 in-memory vector store, lexical+dense RRF hybrid를 학습·실험할 수 있습니다.
> 임베딩 모델을 받지 않아도 기본 서비스는 기존 lexical 모드로 그대로 동작합니다.

원문(`knowledge/`)은 개인 정보를 담고 있어 비공개 저장소에 따로 둡니다. 경로는
`RAG_KNOWLEDGE_DIR`로 연결하며, 원문이 없어도 서버 기동과 `npm test`는 그대로
동작합니다 — 원문·평가 데이터를 필요로 하는 테스트만 건너뜁니다.

## 실행

```powershell
cd backend
npm install
Copy-Item .env.example .env
# .env에 Colab/vLLM 주소, 모델명, 키를 입력
npm start
```

기본 주소는 `http://127.0.0.1:8787`입니다. 실제 비밀 키는 `backend/.env`에서만 읽으며,
로그나 API 오류 응답에 키 또는 업스트림 원문을 출력하지 않습니다. `.env`는 저장소에
커밋하지 마세요.

같은 Wi-Fi의 휴대폰에서 확인할 때는 `HOST=0.0.0.0`으로 바인딩하고
`CORS_ORIGIN=http://<노트북-IP>:<프런트-포트>`처럼 실제 프런트 origin만 허용하세요.
휴대폰은 `0.0.0.0`이 아니라 노트북의 IPv4 주소로 접속합니다. 내부망 확인 절차와
Windows 방화벽 주의점은 비공개 저장소의
`guides/rag/04-lan-mobile-check.md`에 정리했습니다.

샘플 화면은 별도 라이브러리 없이 Node.js 내장 HTTP 서버로 열 수 있습니다.

```powershell
$env:WEB_HOST = "0.0.0.0"
$env:WEB_PORT = "8080"
npm run serve:sample
```

테스트는 실제 Colab을 호출하지 않고 mock client와 로컬 mock HTTP 서버를 사용합니다.

```powershell
cd backend
npm test
```

## 환경 변수

| 이름 | 기본값 | 설명 |
|---|---:|---|
| `OPENAI_API_KEY` | 빈 값 | vLLM 인증 키. `backend/.env`에서만 읽음 |
| `OPENAI_BASE_URL` | 빈 값 | OpenAI-compatible 서버 주소. `/v1` 포함/미포함 모두 지원 |
| `OPENAI_MODEL` | 빈 값 | vLLM이 제공하는 모델명 |
| `HOST`, `PORT` | `127.0.0.1`, `8787` | HTTP 바인딩 |
| `CORS_ORIGIN` | `*` | 허용 Origin |
| `TRUST_PROXY` | `false` | 신뢰 reverse proxy의 `X-Forwarded-For` 사용 여부 |
| `OFFLINE_FALLBACK_ENABLED` | `true` | 일시적 vLLM 장애 시 retrieval-only 안내 응답 사용 |
| `RAG_KNOWLEDGE_DIR` | `../knowledge` | 원문 폴더. 상대 경로는 `backend/` 기준으로 해석 |
| `RAG_RETRIEVER_MODE` | `lexical` | `lexical`, `dense`, `hybrid` 중 검색 모드 |
| `RAG_VECTOR_STORE` | `memory` | dense 검색 저장소 `memory` 또는 `orama` |
| `RAG_EMBEDDING_MODEL` | `intfloat/multilingual-e5-small` | local embedding 모델 ID |
| `RAG_EMBEDDING_MODEL_REVISION` | `main` | 모델 revision. cache/index identity에 포함 |
| `RAG_EMBEDDING_CACHE_DIR` | 빈 값 | 선택적 로컬 모델 캐시. 로그·health에 출력하지 않음 |
| `RAG_EMBEDDING_LOCAL_FILES_ONLY` | `false` | `true`면 로컬 캐시 밖 모델 다운로드 금지 |
| `RAG_EMBEDDING_MAX_LENGTH` | `512` | E5 tokenizer 최대 입력 토큰 길이 |
| `TOP_K` | `5` | 검색 결과 최대 개수(상한 12) |
| `RAG_DIVERSITY_MAX_PER_SOURCE` | `2` | top-K 안에서 같은 문서의 청크 최대 개수. `0`이면 상한 없음 |
| `RAG_DIVERSITY_MIN_PROMOTION_RATIO` | `0.2` | 상한으로 생긴 빈자리를 채울 청크의 최소 점수(1위 대비 비율) |
| `MAX_BODY_BYTES` | `32768` | 요청 본문 바이트 제한 |
| `MAX_MESSAGE_CHARS` | `2000` | 질문 문자수 제한 |
| `MAX_HISTORY_ITEMS` | `6` | 대화 이력 항목 제한 |
| `MAX_HISTORY_CHARS` | `6000` | 대화 이력 전체 문자수 제한 |
| `MAX_EVIDENCE_CHARS` | `12000` | 모델에 전달할 검색 근거 전체 문자수 제한 |
| `RAG_SOURCE_EXPOSURE` | `none` | 공개 API 검색 근거 노출. `none`, `metadata`, `excerpt`만 허용 |
| `SOURCE_EXCERPT_CHARS` | `280` | `excerpt` 디버그 모드의 발췌문 문자수 제한 |
| `UPSTREAM_CONCURRENCY` | `1` | 동시 모델 호출 수(상한 3) |
| `MAX_UPSTREAM_QUEUE` | `4` | 모델 호출 대기열 상한 |
| `UPSTREAM_TIMEOUT_MS` | `30000` | 모델 호출 제한 시간 |
| `UPSTREAM_STATUS_TIMEOUT_MS` | `3000` | 모델 목록을 이용한 실제 추론 서버 상태 확인 제한 시간 |
| `UPSTREAM_STATUS_CACHE_TTL_MS` | `5000` | 상태 확인 결과를 재사용하는 시간 |
| `RATE_WINDOW_MS` | `60000` | rate limit 윈도우 |
| `RATE_LIMIT_PER_IP` | `10` | IP별 윈도우 요청 수 |
| `RATE_LIMIT_GLOBAL` | `30` | 전체 윈도우 요청 수 |
| `CACHE_TTL_MS` | `15000` | 동일 검색/답변 캐시 시간 |
| `FALLBACK_CACHE_TTL_MS` | `5000` | 동일 offline fallback의 짧은 캐시 시간 |

## 단계형 retrieval 구조

검색 계층은 작은 duck-typing 계약으로 나눴습니다. 특정 DB의 클래스를 상속하지 않아 이후
pgvector나 Qdrant 어댑터를 같은 `VectorStore` 계약 아래 추가할 수 있습니다.

- `EmbeddingProvider`: 문서와 질의를 같은 벡터 공간으로 변환
- `VectorStore`: `{ id, vector, metadata }` upsert와 vector search
- `Retriever`: 질의를 RAG source 결과로 변환
- `FusionStrategy`: 서로 다른 검색 순위를 결합

### Stage 1 — 다운로드 없는 학습 예제

`DeterministicEmbeddingProvider`는 의미 모델이 아니라 토큰 hashing 기반 fake예요.
`MemoryVectorStore`는 벡터를 L2 정규화하고 전체 항목과 dot product를 계산하므로 cosine
검색 원리를 작은 코드로 볼 수 있습니다.

```powershell
npm run rag:demo
```

4개 예제 문서, 점수와 top result만 출력합니다. 테스트와 기본 평가도 모델 다운로드 없이 이
fake provider를 사용합니다.

### Stage 2 — 실제 local embedding

선택적 `@huggingface/transformers@4.2.0` 어댑터는
`intfloat/multilingual-e5-small`을 사용합니다.

- E5 입력 prefix: 질의 `query:`, 문서 `passage:`
- mean pooling과 L2 normalize
- 출력 384차원
- 최대 입력 512 tokens에서 truncation
- 모델은 저장소가 아닌 로컬 Hugging Face cache에만 저장

모델 저장소는 MIT 라이선스이며 원 저장소에 ONNX weights가 있어 불명확한 제3자 변환
저장소를 사용하지 않습니다. 최초 다운로드에는 ONNX fp32 약 470MB와 tokenizer/config가
필요해 cold start가 길고 메모리 사용량도 lexical보다 큽니다.

```powershell
# 명시적으로 real local embedding을 허용할 때만 3개 질문 smoke
npm run rag:smoke:real
```

이 명령은 local embedding만 실행하며 Gemma, vLLM, Colab에는 연결하지 않습니다.

### Stage 3 — backend 선택 모드와 vector store

- `lexical`은 기존 한글 BM25+n-gram이며 기본값입니다. embedding package/model을 로드하지
  않습니다.
- `dense`는 선택한 `EmbeddingProvider`와 `VectorStore`를 사용합니다.
- `hybrid`는 기존 lexical 순위와 dense 순위를 RRF(Reciprocal Rank Fusion)로 결합합니다.
- `memory`는 normalized vector exact cosine 전수 비교 구현입니다.
- `orama`는 Apache-2.0 `@orama/orama@3.1.18`의 vector schema/search만 사용합니다.
  한국어 text tokenizer나 Orama BM25를 호출하지 않고 vector, ID, allowlist metadata만
  메모리에 저장합니다. OramaCore(AGPL)는 사용하지 않습니다.

dense/hybrid 초기화나 384차원 검증에 실패하면 서버는 시작에 실패합니다. lexical로 조용히
대체해 잘못된 dense 결과를 내지 않습니다. 현재 단계에는 disk persistence plugin이 없어서
서버 시작 때 Markdown을 다시 임베딩하고 인덱스를 재구축합니다.

retrieval cache key에는 mode와 retriever identity가 들어갑니다. identity에는 vector store,
embedding model/revision, pooling/normalize와 adapter version이 포함되어 설정 간 캐시가
섞이지 않습니다.

### Stage 4 — local retrieval 평가

`evals/rag-cases.json`에서 `category: grounded`, 유효한 `expected_sources`, 실제 색인 문서가
있는 retrieval case만 선별합니다. policy, privacy, generation, refusal 문항을 억지로 검색
평가에 포함하지 않습니다.

```powershell
npm run rag:eval
npm run rag:eval:orama
```

두 명령은 fake embedding으로 lexical/dense/hybrid의 Hit@5, MRR, KeyFact@5, 평균 query
latency를 비교합니다. `KeyFact@5`는 각 케이스의 `expected_key_facts`가 top-5 청크 본문에
부분 문자열로 존재하는 비율의 케이스 평균이며, `expected_key_facts`가 없는 케이스는 분모에서
제외합니다. 실측 숫자는 실행 환경과 문서 변경에 따라 달라지므로 품질 보장값으로 사용하지
마세요.

### 라이선스

| 구성요소 | 고정 버전/모델 | 라이선스 |
|---|---|---|
| [Transformers.js](https://www.npmjs.com/package/@huggingface/transformers) | `@huggingface/transformers@4.2.0` | Apache-2.0 |
| [Orama JS](https://www.npmjs.com/package/@orama/orama) | `@orama/orama@3.1.18` | Apache-2.0 |
| [multilingual-e5-small](https://huggingface.co/intfloat/multilingual-e5-small) | `intfloat/multilingual-e5-small` | MIT |

패키지 버전은 `package.json`과 `package-lock.json`에 고정했습니다. 모델 파일은
`backend/.gitignore`의 cache/model 경로와 사용자 로컬 cache에만 둡니다.

## 문서 인덱싱 규칙

- `knowledge` 아래 Markdown을 재귀적으로 읽습니다.
- `persona.md`, `_template.md`, 밑줄로 시작하는 Markdown은 검색에서 제외합니다.
- frontmatter에 `index: true`가 명시된 문서만 색인합니다. 값이 없거나 `false`이면 제외합니다.
- 색인 문서에는 문자열 `id`, `title`, `type` metadata가 필수입니다. 누락 문서는 진단 목록에
  남기고 색인하지 않습니다.
- 제한된 frontmatter scalar와 `tags`, `sources` 같은 문자열 목록을 지원합니다. 중첩 객체나
  전체 YAML 문법은 지원하지 않습니다.
- `persona.md`는 검색 문서가 아니라 시스템 정책 프롬프트로 별도 로드합니다.
- 코드의 안전 baseline은 persona 유무와 무관하게 불법 행위 실행·은폐·탐지 회피 지원 및
  불법 목적 프로젝트·업무 참여를 거절합니다.
- 제목 계층을 섹션 경로로 보존하고 `**Q. ...**` / `A. ...` FAQ는 문답별로 나눕니다.

문서는 서버 시작 시 한 번 적재됩니다. 문서를 바꿨다면 서버를 재시작하세요.

## API

### `GET /health`

업스트림을 호출하지 않는 로컬 상태 확인입니다.

응답에는 `status`, 시작 시 적재한 `documents`·`chunks` 수, 색인 제외 진단
`indexDiagnostics`, `retrieverMode`, `vectorStore`, `upstreamConfigured`가 포함됩니다.
health는 upstream이나 embedding model을 추가 호출하지 않습니다. 문서 수와 청크 수는 현재
knowledge 내용에 따라 달라집니다.

### `GET /api/chat/status`

채팅창을 열기 전에 실제 추론 서버와 설정된 모델을 사용할 수 있는지 확인합니다.
OpenAI 호환 `/v1/models`를 짧게 호출하며, 정상적으로 모델을 찾으면 `online`, 연결 실패나
미설정·모델 부재 시 `offline`을 반환합니다. 업스트림 오류 상세와 모델 이름은 공개하지
않고, 반복 확인이 추론 서버에 부담을 주지 않도록 결과를 잠시 캐시합니다.

```json
{"status":"offline","checkedAt":"2026-07-29T00:00:00.000Z"}
```

### `POST /api/retrieve`

```json
{"query":"AI 에이전트 경험이 있나요?","topK":3}
```

`topK`는 1부터 서버의 `TOP_K` 상한 사이의 정수여야 합니다. 응답의 각 결과에는 문서
metadata와 `source`, `section`, `score`, `content`가 포함됩니다.

### `POST /api/chat`

```json
{
  "message":"어떤 백엔드 경험이 있나요?",
  "audience":"developer",
  "tone":"manager",
  "pageContext":"research",
  "history":[
    {"role":"user","content":"주요 기술은?"},
    {"role":"assistant","content":"C#, Java, JavaScript 경험이 있습니다."}
  ]
}
```

### `POST /api/chat/stream`

요청 JSON과 최종 `ChatResponse`는 `/api/chat`과 같습니다. 응답만
`text/event-stream; charset=utf-8` SSE로 전송합니다.

```text
event: meta
data: {"mode":"model","status":"online","audience":"developer","tone":"manager","pageContext":"research","cached":false}

event: delta
data: {"text":"답변 일부"}

event: done
data: {"mode":"model","status":"online","generated":true,"answer":"...","segments":[],"sources":[],"actions":[],"audience":"developer","tone":"manager","pageContext":"research","cached":false}
```

정상 순서는 `meta` → 1개 이상의 `delta` → `done`입니다. 캐시 hit와 offline
fallback도 같은 순서를 사용합니다. 스트림을 시작한 뒤 실패하면 내부 오류를 숨긴
`error` 이벤트를 보내고 연결을 닫으며, 부분 답변은 캐시하지 않습니다. `delta`는
OpenAI 토큰 하나와 일대일이라고 가정하면 안 됩니다. 서버는 action marker와 내부
경로가 조각난 채 노출되지 않도록 현재 비공백 단어만 보류해 정리한 뒤 전송합니다.
비정상적으로 긴 단일 토큰은 원문 대신 안전한 placeholder로 대체합니다.

`audience`는 선택 필드이며 다음 값을 지원합니다.

| 값 | 답변 깊이·강조점 |
|---|---|
| `hiring` | 역할, 경험 범위, 검증 가능한 결과와 직무 관련성 |
| `developer` | 구조, 기술 선택, 제약, 구현과 검증 방식 |
| `collaboration` | 작업 방식, 역할 분담, 소통, 범위와 산출물 |
| `casual` | 쉬운 말로 된 짧은 개요 |
| `default`, 미지정, `null`, `""` | 간결하고 비개발자 친화적인 기본 답변 |

관점은 근거 사실이나 안전 정책을 바꾸지 않고 깊이와 강조점만 조정합니다. 현재 질문에서
사용자가 “더 기술적으로”, “자세히”, “간단히”처럼 형식을 직접 요청하면 그 요청이 관점보다
우선합니다. 관점 선택에는 이름, 회사명, 연락처가 필요하지 않으며 요청해서도 안 됩니다.
지원하지 않는 값은 `400 invalid_audience`로 거절합니다. 값은 현재 요청에만 적용되고
응답 캐시 key에도 포함되므로 서로 다른 관점의 답변이 섞이지 않습니다.

챗봇은 포트폴리오 소유자 본인이나 대리 화자가 아니라 소유자를 보조하는 AI 안내자입니다.
소유자의 경력과 경험은 “포트폴리오 자료에 따르면”, “개발자는” 같은 제3자 화법으로
설명합니다. “제가 수행했습니다”처럼 소유자의 경험을 챗봇 자신의 경험으로 말하지 않으며,
1인칭은 “제가 자료를 찾아볼게요” 같은 AI 안내 행위에만 사용합니다.

`tone`은 `audience`와 독립된 선택 필드입니다.

| 값 | 말투 |
|---|---|
| `official` | 격식 있는 `입니다/합니다` 말투. 이름은 필요할 때만 쓰고 실제 회사 권한·법적 대리인 주장은 금지 |
| `manager` | 적극적으로 소개하는 영업 담당자 느낌. 이름·`개발자님` 호칭 반복과 과장·성과 생성은 금지 |
| `mascot` | 밝은 관계 표현. “저희 주인님은요…”는 선택적 예시이며 반복·과도한 아첨·허위 칭찬은 금지 |
| 미지정, `null`, `""` | `official` |

사용자가 현재 메시지에서 다른 말투를 직접 요청하면 그 요청을 선택 말투보다 우선할 수
있습니다. 다만 RAG 사실, audience 깊이, 안전·불법 행위 거절, AI 안내자 투명성, 소유자 사칭
금지는 어떤 말투에서도 바뀌지 않습니다. 지원하지 않는 값은 `400 invalid_tone`으로
거절합니다. `tone`도 현재 요청과 짧은 메모리 캐시에만 사용되며 캐시 key에 포함됩니다.
모든 말투는 대부분 이름이나 호칭 없이 답변 내용부터 시작합니다. 제3자 설명이 필요하면
“포트폴리오 자료에 따르면”, “개발자는” 같은 표현을 우선합니다.

첫 greeting은 백엔드가 생성하지 않고 프런트가 담당합니다. 기본 문구가 필요하면 이름 없이
다음을 사용합니다.

> 안녕하세요. 포트폴리오를 안내하는 AI 챗봇입니다. 관심 있는 관점을 선택하거나 바로 질문해 주세요.

`pageContext`는 사이트 전체 플로팅 챗에서 현재 공개 페이지를 알려주는 선택적 힌트입니다.

| 값 | 모호한 질문에서 먼저 볼 초점 |
|---|---|
| `overview` | 포트폴리오 전체 소개와 핵심 경험 |
| `resume` | 경력, 역할과 기술 경험 |
| `cover_letter` | 동기, 문제 해결 방식과 성장 방향 |
| `research` | 실험, 측정, 기술 탐구와 검증 경험 |
| `log` | 공개된 최근 작업 기록과 진행 맥락 |
| `default`, 미지정, `null`, `""` | 페이지 초점 없음. 기존 동작 유지 |

현재 페이지는 낮은 우선순위의 표현·초점 힌트입니다. 모호한 질문에서만 관련 섹션을 먼저
설명하고, 사용자가 다른 주제를 명확히 물으면 무시합니다. 사용자 질문, RAG 근거와 안전·
정체성 정책보다 우선할 수 없고 검색 순위나 사실을 변경하지 않습니다. 지원하지 않는 값은
`400 invalid_page_context`로 거절합니다. `pageContext`도 요청과 짧은 메모리 캐시에만
사용하고 캐시 key에 포함합니다. 프런트가 필드를 생략하면 페이지 힌트 프롬프트를 추가하지
않습니다.

```json
{
  "mode":"model",
  "status":"online",
  "generated":true,
  "audience":"developer",
  "tone":"manager",
  "pageContext":"research",
  "answer":"...",
  "segments":[
    {
      "markdown":"...",
      "actions":[{"id":"resume","label":"경력·기술 보기"}]
    }
  ],
  "sources":[],
  "actions":[
    {"id":"resume","label":"경력·기술 보기"},
    {"id":"research","label":"연구·기술 탐구 보기"}
  ],
  "cached":false
}
```

vLLM이 미구성 상태이거나 네트워크 오류, timeout, 5xx/530 응답으로 일시적으로 사용할 수
없으면 기본적으로 HTTP 200과 아래 고정 offline contract를 반환합니다. 미구성 상태는 문서
검색과 모델 호출 전에 판별해 불필요한 검색을 수행하지 않습니다.

```json
{
  "mode":"retrieval_fallback",
  "status":"upstream_offline",
  "generated":false,
  "audience":"developer",
  "tone":"manager",
  "pageContext":"research",
  "answer":"현재 데모용 챗봇 추론 서버는 오프라인이에요. 시연이 필요하면 포트폴리오에 공개된 연락처로 문의해 주세요.",
  "segments":[
    {
      "markdown":"현재 데모용 챗봇 추론 서버는 오프라인이에요. 시연이 필요하면 포트폴리오에 공개된 연락처로 문의해 주세요.",
      "actions":[]
    }
  ],
  "sources":[],
  "actions":[],
  "cached":false
}
```

`generated:false`이므로 안내문을 모델 생성 답변처럼 표시하면 안 됩니다. UI는 `mode`와
`status`를 보고 오프라인 안내로 명확히 구분해야 합니다. 오프라인 응답에서는 문서 검색
결과나 출처를 노출하지 않고 항상 `sources: []`를 반환합니다. 정상 답변 캐시와 fallback
캐시는 분리되며 fallback은 더 짧게 유지됩니다.

### 검색 근거 노출 정책

검색 근거는 답변 생성과 `actions` 계산에 서버 내부에서 계속 사용하지만, 공개 API는 기본값
`RAG_SOURCE_EXPOSURE=none`에서 `/api/chat`의 `sources`와 `/api/retrieve`의 `results`를
항상 빈 배열로 반환합니다. 프런트 채팅 UI도 출처를 렌더링하지 않습니다.

`metadata`와 `excerpt`는 로컬 디버그용 선택지입니다. `metadata`는 `title`, `section`,
`score`, `url`만 반환하고, `excerpt`는 여기에 길이가 제한된 `excerpt`만 추가합니다.
어느 모드도 로컬 파일 경로, 문서 ID 또는 chunk ID를 공개하지 않습니다. 잘못된 값은
안전하게 `none`으로 처리됩니다.

### 내부 이동 actions

정상 모델 응답에는 답변과 검색 근거에 직접 관련된 내부 이동 제안 `actions`가 포함됩니다.
불명확하거나 관련된 이동 대상이 없으면 빈 배열입니다.

- 최대 2개이며 후보 ID는 `overview`, `resume`, `cover_letter`, `research`, `log`뿐입니다.
- 각 항목은 서버가 정한 `{ "id": "...", "label": "..." }`만 포함합니다.
- URL, path, href는 포함하지 않습니다. 프런트가 ID를 실제 내부 경로로 안전하게 매핑합니다.
- 자동 이동하지 않으며 사용자가 action을 선택해야 합니다.
- 모델은 내부 근거에 함께 제공된 allowlist marker만 관련 문단 직후에 놓을 수 있습니다.
  서버는 marker를 본문에서 제거하고 검증된 항목만 `segments[].actions`로 변환합니다.
- 무효 marker와 같은 문단의 중복 marker는 제거합니다. 같은 action이 서로 다른 관련 문단에
  배치되는 것은 허용하며, 최하단 요약용 `actions`는 항상 중복을 제거합니다.
- 모델의 자유형 JSON이나 모델이 만든 URL을 action으로 파싱하지 않습니다. 검색된 문서의
  `id`, `type`, `source`, `section`과 서버 allowlist mapping으로 결정합니다.
- 현재 `pageContext`와 같은 action은 중복 제안하지 않습니다.
- fallback과 모든 오류 응답은 안전하게 `actions: []`를 반환합니다.
- 캐시 hit에서도 같은 검색 metadata로 결정하므로 동일 요청의 action은 안정적으로 같습니다.

모델 답변 본문에 생성된 Markdown·일반 HTTP(S) URL은 그대로 신뢰하지 않고 제거합니다.
공개 이동은 서버가 내부 검색 metadata에서 allowlist로 계산한 `actions`만 사용하세요.

입력 검증 4xx, API rate limit 429와 내부 오류는 fallback으로 숨기지 않습니다. vLLM의
408은 timeout으로 fallback하지만, vLLM의 429와 400·401·403·404 같은 4xx는 용량·주소·모델·
인증 설정을 운영자가 구분할 수 있도록 fallback하지 않고 상세를 숨긴
`502 upstream_unavailable`로 반환합니다.
운영에서 이 동작이 필요하지 않으면 `OFFLINE_FALLBACK_ENABLED=false`로 끌 수 있습니다.

모든 경로는 CORS와 `OPTIONS` preflight를 지원합니다. `/api/*`에는 요청 크기·문자수·이력,
IP별/전역 rate limit이 적용되고, 모델 호출에는 작은 동시성·대기열과 timeout이 적용됩니다.
429 응답은 초 단위 `Retry-After` 헤더를 제공합니다. 대화 이력은 신뢰할 수 없는 transcript로
시스템 프롬프트에 명시됩니다.

`TRUST_PROXY=false`가 기본이므로 클라이언트가 임의로 보낸 `X-Forwarded-For`는 무시하고
소켓 IP로 제한합니다. 운영 서버가 신뢰할 수 있는 reverse proxy 바로 뒤에 있고 그 프록시가
헤더를 정리·설정하는 경우에만 `TRUST_PROXY=true`를 사용하세요.

## 대화 개인정보와 저장 정책

- 질문과 대화 이력은 DB, 파일 또는 외부 분석 저장소에 영구 저장하지 않습니다.
- `audience` 선택도 현재 요청 처리와 짧은 메모리 캐시에만 사용하며 사용자 프로필로 저장하지
  않습니다.
- `tone` 선택도 동일하게 요청 단위로만 사용하며 사용자 설정으로 영구 저장하거나 로그에
  기록하지 않습니다.
- `pageContext`도 현재 요청의 표현 힌트로만 사용하며 방문 페이지 이력으로 저장하거나
  로그에 기록하지 않습니다.
- 서버의 정상 응답·오류 로그에 `message`, `history`, 원 IP, API 키를 기록하지 않습니다.
- 중복 요청 캐시는 단일 프로세스 메모리에만 있고 짧은 TTL 뒤 사라집니다. 캐시 key는 질문
  원문이 아니라 프로세스 시작 때 생성한 임시 salt 기반 HMAC-SHA-256 값입니다.
- rate limiter도 원 IP 대신 같은 방식의 별도 namespace 해시만 메모리에 유지합니다.
- 프로세스가 종료되면 메모리 캐시, rate-limit 상태와 임시 salt는 모두 사라집니다.
- 모델 답변을 생성하는 경우 질문·검색 근거·제한된 이력은 응답 생성을 위해 설정된 vLLM
  endpoint에 일시적으로 전달됩니다. 해당 서버의 운영·로그 정책은 별도로 확인해야 합니다.

향후 제한 초과나 비정상 호출 뒤 대화를 중단하고, 기록 가능성과 조건을 명시해 사용자가
동의한 경우에만 재개하는 consent flow를 검토합니다. 이는 현재 구현된 기능이 아닙니다.
동의가 도입되더라도 동의 이후의 미래 메시지에만 적용하고, 미동의 상태에서는 재개하지 않는
방향입니다. 보관 기간과 삭제 정책은 아직 정해지지 않았으며 결정 전에는 기록 기능을
활성화하지 않습니다.
