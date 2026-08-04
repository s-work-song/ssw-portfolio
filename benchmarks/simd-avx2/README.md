# SIMD AVX2 범위 합산

## 배경과 이론

바이트 배열에서 특정 범위의 값만 골라 합산하는 작업은 작은 코드 차이로도 CPU의 실행 경로가 달라집니다. 이 실험은 조건 분기의 예측 실패, 브랜치리스 마스크 연산, AVX2의 256비트 벡터 레인, 루프 언롤링의 의존 사슬 감소, 병렬 작업 분할의 비용을 같은 결과 계약 아래에서 비교합니다.

> [!CAUTION]
> **AVX2 성능을 측정하려면 AVX2 명령어와 256비트 YMM 레지스터를 실제로 지원하는 CPU·운영체제·런타임이 반드시 필요합니다.** `Avx2.IsSupported == false`인 환경에서 나온 값은 AVX2 측정값이 아닙니다. 라이브러리 구현은 호환성을 위해 scalar 경로로 fallback할 수 있지만, 벤치마크 러너는 그런 결과가 AVX2 수치로 오인되지 않도록 실행을 중단합니다. BenchmarkDotNet의 환경 출력에 `HardwareIntrinsics=AVX2`와 `VectorSize=256`이 있는지도 확인해야 합니다. 단위 테스트가 통과했다는 사실만으로 AVX2 명령이 실행됐다고 판단하면 안 됩니다.

## 구조

```text
src/SSW.Benchmarks.SimdAvx2/
  Abstractions/          # ByteRange, IRangeSumCalculator
  Implementations/Scalar # 분기, 브랜치리스
  Implementations/Simd   # AVX2, AVX2 언롤링
  Decorators/            # 병렬 구간 분할
tests/                   # 모든 변형의 결과 동등성
bench/                   # 실제 구현을 호출하는 BenchmarkDotNet runner
```

## 실행

이 디렉터리에서 실행합니다.

```powershell
.\run-tests.ps1
.\run-benchmark.ps1 -List
.\run-benchmark.ps1
```

마지막 명령은 사용자가 자신의 CPU와 전원 설정에서 측정할 때만 실행합니다.

SDK 빌드와 BenchmarkDotNet 산출물은 `benchmarks/artifacts/` 아래에 모입니다.

## 결과 정책

이 저장소에는 본실행 결과 수치나 BenchmarkDotNet 아티팩트를 커밋하지 않습니다. 과거 사이트의 성능 표현은 이 재구성본으로 아직 재현 확인하지 않았으므로 README에 수치로 옮기지 않습니다. 구현 변형의 정답성은 테스트가, 환경별 성능은 사용자의 직접 실행이 담당합니다.
