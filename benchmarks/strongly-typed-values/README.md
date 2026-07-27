# Strongly Typed Values: 값 객체 표현 비교

## 배경

이 실험은 같은 주문 금액 계산을 원시 정수, `readonly record struct` 값 객체, class wrapper로 표현한다. 비교의 핵심은 도메인 의미를 타입으로 드러낼 때의 호출 경계와 객체 표현 차이이며, 어느 표현이 항상 더 빠르거나 더 낫다고 전제하지 않는다.

`ProductId`, `UnitPrice`, `Quantity`는 서로 다른 타입이므로 강타입 주문 생성자에 잘못된 의미의 값을 넘기는 코드는 컴파일되지 않는다. 값 객체는 생성 시 유효 범위를 검사하고, 원시값으로 돌아가는 경계는 `ToPrimitive()`로 명시한다.

## 원본과 재구성의 범위

원본 `StronglyTypedExample`은 ASP.NET Core TempData 직렬화 예외를 재현하는 테스트였다. `readonly struct` 기반 강타입 래핑 구현은 원본에 포함되어 있지 않았다. 따라서 이 디렉터리는 원본을 그대로 이식한 결과가 아니라, 사용자 의도를 검증 가능한 값 객체 비교로 새로 설계한 실험이다. 원본 TempData 예외 코드는 반입하지 않았다.

성능 결과는 아직 기록하지 않는다. 강타입이 타입 혼용을 줄이는 API 경계와, 값 형식·참조 형식 표현의 비용은 같은 입력과 런타임에서 실제로 검증한 뒤에만 설명한다.

## 구조

```text
strongly-typed-values/
├─ src/SSW.Benchmarks.StronglyTypedValues/              # primitive·struct·class 도메인 모델
├─ tests/SSW.Benchmarks.StronglyTypedValues.Tests/      # 동등성·유효성·생성자 타입 경계 검증
└─ bench/SSW.Benchmarks.StronglyTypedValues.Benchmarks/ # 동일 주문의 금액 계산 BenchmarkDotNet 러너
```

## 실행

```powershell
dotnet test StronglyTypedValues.sln -c Release
dotnet run --project bench/SSW.Benchmarks.StronglyTypedValues.Benchmarks -c Release
```

SDK 빌드와 BenchmarkDotNet 산출물은 `benchmarks/artifacts/` 아래에 모입니다.

측정 결과는 검증 실행 후 기록한다. 이 문서에는 수치를 미리 적지 않는다.
