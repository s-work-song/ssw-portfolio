# SIMD AVX2 범위 합산

## 배경과 이론

바이트 배열에서 특정 범위의 값만 골라 합산하는 작업은 작은 코드 차이로도 CPU의 실행 경로가 달라집니다. 이 실험은 조건 분기의 예측 실패, 브랜치리스 마스크 연산, AVX2의 256비트 벡터 레인, 루프 언롤링의 의존 사슬 감소, 병렬 작업 분할의 비용을 같은 결과 계약 아래에서 비교합니다.

AVX2 구현은 지원하지 않는 CPU에서 기준 scalar 구현으로 fallback합니다. 따라서 “AVX2 사용 가능 여부”는 성능 조건일 뿐 결과의 의미를 바꾸지 않습니다.

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

```powershell
dotnet test SSW.Benchmarks.SimdAvx2.sln -c Release
dotnet run -c Release --project bench/SSW.Benchmarks.SimdAvx2.Benchmarks -- --list flat
dotnet run -c Release --project bench/SSW.Benchmarks.SimdAvx2.Benchmarks
```

마지막 명령은 사용자가 자신의 CPU와 전원 설정에서 측정할 때만 실행합니다.

SDK 빌드와 BenchmarkDotNet 산출물은 `benchmarks/artifacts/` 아래에 모입니다.

## 결과 정책

이 저장소에는 본실행 결과 수치나 BenchmarkDotNet 아티팩트를 커밋하지 않습니다. 과거 사이트의 성능 표현은 이 재구성본으로 아직 재현 확인하지 않았으므로 README에 수치로 옮기지 않습니다. 구현 변형의 정답성은 테스트가, 환경별 성능은 사용자의 직접 실행이 담당합니다.
