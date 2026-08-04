/**
 * 공개 벤치마크 코드와 연구 화면의 연결 계약이다.
 * GitHub 경로·표시 상태를 한곳에서 관리해 연구 카드마다 URL과 고지 문구가
 * 달라지는 것을 막는다. 성능 수치는 이 메타데이터의 책임 범위가 아니다.
 */

export type BenchmarkProjectId =
  | 'simd-avx2'
  | 'counting-sort'
  | 'serialization-protobuf'
  | 'duck-typing'
  | 'strongly-typed-values';

export interface BenchmarkProject {
  id: BenchmarkProjectId;
  title: string;
  summary: string;
  tags: readonly string[];
  repositoryPath: string;
  sourcePath: string;
  testPath: string;
  benchmarkPath: string;
  researchHref?: string;
  researchLabel?: string;
}

const GITHUB_REPOSITORY =
  'https://github.com/s-work-song/ssw-portfolio-public';

export const BENCHMARK_NOTICE_URL = `${GITHUB_REPOSITORY}/blob/main/benchmarks/NOTICE.md`;
export const BENCHMARK_ROOT_URL = `${GITHUB_REPOSITORY}/tree/main/benchmarks`;

export const BENCHMARK_PROJECTS: readonly BenchmarkProject[] = [
  {
    id: 'simd-avx2',
    title: 'SIMD AVX2 범위 합산',
    summary:
      '동일한 범위 합산 계약을 분기, 브랜치리스, AVX2, 언롤링과 병렬 처리로 구현해 비교합니다.',
    tags: ['.NET 8', 'AVX2', 'BenchmarkDotNet'],
    repositoryPath: 'benchmarks/simd-avx2',
    sourcePath:
      'benchmarks/simd-avx2/src/SSW.Benchmarks.SimdAvx2',
    testPath:
      'benchmarks/simd-avx2/tests/SSW.Benchmarks.SimdAvx2.Tests',
    benchmarkPath:
      'benchmarks/simd-avx2/bench/SSW.Benchmarks.SimdAvx2.Benchmarks',
    researchHref: '/about-me/research#research-cpu-simd',
    researchLabel: 'SIMD 연구 내용 보기',
  },
  {
    id: 'counting-sort',
    title: '계수 정렬 재구성',
    summary:
      '바이트 정렬을 표준 라이브러리와 단일·2/4/8-way·병렬 계수 정렬로 구성하고 결과 동등성을 검증합니다.',
    tags: ['.NET 8', 'Counting Sort', 'Tests'],
    repositoryPath: 'benchmarks/counting-sort',
    sourcePath:
      'benchmarks/counting-sort/src/SSW.Benchmarks.CountingSort',
    testPath:
      'benchmarks/counting-sort/tests/SSW.Benchmarks.CountingSort.Tests',
    benchmarkPath:
      'benchmarks/counting-sort/bench/SSW.Benchmarks.CountingSort.Benchmarks',
    researchHref: '/about-me/research#research-counting-sort',
    researchLabel: '계수 정렬 연구 내용 보기',
  },
  {
    id: 'serialization-protobuf',
    title: 'Protobuf 직렬화와 Nibble Packing',
    summary:
      'JSON과 Protobuf 직렬화, 정수 인코딩, 4비트 값 패킹을 같은 데이터의 왕복 계약으로 비교합니다.',
    tags: ['.NET 8', 'Protobuf', 'Serialization'],
    repositoryPath: 'benchmarks/serialization-protobuf',
    sourcePath:
      'benchmarks/serialization-protobuf/src/SSW.Benchmarks.SerializationProtobuf',
    testPath:
      'benchmarks/serialization-protobuf/tests/SSW.Benchmarks.SerializationProtobuf.Tests',
    benchmarkPath:
      'benchmarks/serialization-protobuf/bench/SSW.Benchmarks.SerializationProtobuf.Benchmarks',
    researchHref: '/about-me/research#research-serialization-packing',
    researchLabel: '직렬화 연구 내용 보기',
  },
  {
    id: 'duck-typing',
    title: 'Duck Typing 열거 방식 비교',
    summary:
      '인터페이스, boxing, 패턴 기반 struct 열거와 ref struct 열거를 같은 토큰화 결과 아래에서 비교합니다.',
    tags: ['.NET 8', 'Enumerator', 'Allocation'],
    repositoryPath: 'benchmarks/duck-typing',
    sourcePath: 'benchmarks/duck-typing/src/SSW.Benchmarks.DuckTyping',
    testPath:
      'benchmarks/duck-typing/tests/SSW.Benchmarks.DuckTyping.Tests',
    benchmarkPath:
      'benchmarks/duck-typing/bench/SSW.Benchmarks.DuckTyping.Benchmarks',
  },
  {
    id: 'strongly-typed-values',
    title: '강타입 값 객체 표현 비교',
    summary:
      '원시 정수, readonly record struct 값 객체와 class wrapper의 타입 경계와 표현 비용을 비교합니다.',
    tags: ['.NET 8', 'Value Object', 'Type Safety'],
    repositoryPath: 'benchmarks/strongly-typed-values',
    sourcePath:
      'benchmarks/strongly-typed-values/src/SSW.Benchmarks.StronglyTypedValues',
    testPath:
      'benchmarks/strongly-typed-values/tests/SSW.Benchmarks.StronglyTypedValues.Tests',
    benchmarkPath:
      'benchmarks/strongly-typed-values/bench/SSW.Benchmarks.StronglyTypedValues.Benchmarks',
  },
] as const;

export const BENCHMARK_PROJECT_BY_ID = Object.fromEntries(
  BENCHMARK_PROJECTS.map((project) => [project.id, project]),
) as Readonly<Record<BenchmarkProjectId, BenchmarkProject>>;

export function benchmarkTreeUrl(path: string): string {
  return `${GITHUB_REPOSITORY}/tree/main/${path}`;
}

export function benchmarkReadmeUrl(project: BenchmarkProject): string {
  return `${GITHUB_REPOSITORY}/blob/main/${project.repositoryPath}/README.md`;
}
