# 성능 실험 모음

이 폴더는 포트폴리오 사이트의 연구 탭에서 다루는 실험을 재현 가능한 .NET 8 프로젝트로 정리하는 공개 스테이징 영역입니다. 각 실험은 독립 solution을 가지므로 한 실험의 패키지나 빌드 설정이 다른 실험에 영향을 주지 않습니다.

| 실험 | 연구 탭 및 상태 | 설명 |
| --- | --- | --- |
| [SIMD AVX2 합산](simd-avx2/README.md) | CPU & SIMD 최적화 | 바이트 범위 필터 합산을 분기, 브랜치리스, AVX2, 언롤링, 병렬 처리로 비교합니다. |
| [계수 정렬](counting-sort/README.md) | CPU & SIMD 최적화 | 정렬 구현의 정답성과 계수 정렬 변형을 비교합니다. |
| [Protobuf 직렬화](serialization-protobuf/README.md) | 직렬화 & 전송 | JSON, Protobuf, Varint/ZigZag/fixed 형식, nibble packing을 비교합니다. |
| [덕 타이핑](duck-typing/README.md) | 타입 시스템 최적화 (신규 분류) | 인터페이스, boxing, 패턴 기반 열거의 비용을 같은 의미 아래에서 비교합니다. |
| [강타입 값 객체](strongly-typed-values/README.md) | 타입 시스템 최적화 (신규 분류) | primitive, readonly struct 값 객체, class wrapper의 타입 안전성과 비용을 비교합니다. |

## 실행

각 실험 폴더에는 해당 실험만 실행하는 `run-tests.ps1`과 `run-benchmark.ps1`이 있습니다. 다른 실험까지 묶어 실행하는 기본 명령은 두지 않습니다. 스크립트 내부 경로는 `$PSScriptRoot`를 기준으로 계산하므로 현재 디렉터리에 의존하지 않습니다.

```powershell
# SIMD 정확성 테스트
.\benchmarks\simd-avx2\run-tests.ps1

# SIMD에서 실행될 벤치마크 이름만 확인
.\benchmarks\simd-avx2\run-benchmark.ps1 -List

# SIMD BenchmarkDotNet 측정 실행
.\benchmarks\simd-avx2\run-benchmark.ps1

# 직렬화 결과의 실제 바이트 크기만 빠르게 비교
.\benchmarks\serialization-protobuf\run-size-report.ps1
```

이미 복원된 패키지만 사용할 때는 `-NoRestore`를 추가할 수 있습니다. BenchmarkDotNet이 측정용 프로젝트를 생성할 때 수행하는 내부 복원은 별개입니다. 각 벤치마크 스크립트는 필터를 비대화형 인자로 전달하므로 `*` 선택 프롬프트가 나타나지 않으며, 측정이 0건으로 끝난 내부 빌드 실패도 오류로 처리합니다.

## 범위와 수치 정책

- 모든 프로젝트는 `Directory.Build.props`를 통해 .NET 8, nullable, implicit usings를 공유합니다.
- `mmf-vs-stream`은 이번 반입분에 검증 가능한 원본이 없어 포함하지 않습니다.
- ZSTD, GZip, 소켓 전송은 이번 반입 범위 밖입니다. 따라서 `serialization-protobuf`은 압축 결과나 전송 수치를 주장하지 않습니다.
- README와 소스에는 벤치마크 본실행으로 새로 얻은 수치를 커밋하지 않습니다. 결과는 사용자가 자신의 환경에서 실행해 확인합니다.
- BenchmarkDotNet 산출물과 모든 `bin/`, `obj/`는 버전 관리하지 않습니다.
- SDK 빌드와 BenchmarkDotNet 산출물은 `benchmarks/artifacts/` 아래에 모입니다.
