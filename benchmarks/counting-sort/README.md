# Counting Sort 재구성 실험

> [!IMPORTANT]
> 포트폴리오 검토를 위한 열람용 코드이며 별도의 사용 라이선스를 부여하지
> 않습니다. [이용 고지](../NOTICE.md)를 확인해 주세요.

바이트 값 범위(0~255)에 한정된 계수 정렬(Counting Sort)을, 표준 라이브러리 기준선과 단일·2/4/8-way·병렬 구현으로 비교하기 위한 독립 실험입니다. 원본 반입물의 위험한 포인터 코드, 임시 구현, 죽은 코드는 가져오지 않고, 모든 구현이 같은 정렬 계약을 따르도록 다시 구성했습니다.

## 구성

```text
counting-sort/
├─ src/SSW.Benchmarks.CountingSort/             # 정렬 계약과 구현
├─ tests/SSW.Benchmarks.CountingSort.Tests/     # Array.Sort 동등성 테스트
├─ bench/SSW.Benchmarks.CountingSort.Benchmarks/# BenchmarkDotNet 러너
└─ SSW.Benchmarks.CountingSort.sln
```

core의 모든 구현은 `IByteArraySorter` 계약으로 바이트 배열을 제자리 오름차순 정렬합니다.

- `ArraySortByteArraySorter`: 비교 기준선입니다.
- `SingleCountingSortByteArraySorter`: 하나의 256칸 빈도 버퍼를 사용합니다.
- `TwoWay`·`FourWay`·`EightWay`: 독립 빈도 버퍼를 합산해 write-after-write 의존성을 줄입니다.
- `ParallelCountingSortByteArraySorter`: 각 구간의 로컬 버퍼를 병합합니다. unsafe 코드나 공유 버퍼의 비동기 쓰기는 사용하지 않습니다.

2/4/8-way 구현은 각각의 lane을 모두 합산하고, 블록 크기로 나누어떨어지지 않는 tail을 첫 버퍼에 반영합니다. 따라서 빈 배열, 한 원소, 홀수 길이와 2/4/8의 배수가 아닌 길이도 동일한 계약으로 처리합니다.

## 세대 관계와 선별 반입 원칙

원본의 `CountingSortSampleLegacy`는 `netcoreapp2.0` 기반의 기본 for/`Span.Fill` 계수 정렬 기준선입니다. `CountingSortExample`은 이를 unsafe·언롤링·병렬·SIMD까지 넓힌 탐색용 실험군이고, `SSW.Example.Sort`는 일부 구현을 정리한 후속군입니다.

이번 재구성은 그 계승 관계는 문서화하되 원본을 복사하지 않습니다. 특히 원본에서 확인된 2-way 값 증가 누락, 8-way 마지막 버퍼 합산 누락, 2/4/8-way tail 누락, 제자리 정렬 입력 재사용 문제를 계약·테스트·벤치 구조에서 제거했습니다. `_incoming/` 원본은 읽기 전용 참조로 유지합니다.

## 검증과 측정 상태

테스트는 모든 구현을 `Array.Sort` 결과와 비교합니다. 빈 배열, 한 원소, 반복 값, 0/255 경계 값, 3·5·9 길이, 길이 257의 결정론적 난수 입력을 포함합니다.

벤치마크는 각 iteration 전에 동일 원본을 작업 배열로 복사하고 `InvocationCount(1)`을 사용하므로, 앞선 제자리 정렬 결과를 다음 측정이 재사용하지 않습니다. 성능 수치와 새로운 비교 결과는 별도 측정과 검토가 완료되기 전까지 이 문서에 기록하지 않습니다.

SDK 빌드와 BenchmarkDotNet 산출물은 `benchmarks/artifacts/` 아래에 모입니다.
