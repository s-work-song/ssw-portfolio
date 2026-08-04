# Duck Typing: 패턴 기반 열거 비교

## 배경

이 실험은 같은 `_` 구분 토큰 배열을 네 가지 열거 경로로 끝까지 소비한다. 인터페이스 기반 열거, 값 형식 열거자가 인터페이스로 반환되어 boxing되는 경로, `GetEnumerator` 패턴을 이용한 struct 열거, `ReadOnlySpan<string>`을 보관하는 ref struct 열거를 분리했다.

C#의 foreach는 `IEnumerable<T>` 구현만이 아니라 `GetEnumerator`·`MoveNext`·`Current` 모양을 가진 타입도 사용할 수 있다. 이것은 구조적 패턴을 컴파일 시점에 찾는 기능이며, 성능 우위는 입력·런타임·호출 형태에 따라 달라진다. 이 저장소는 결과 수치를 주장하지 않고 같은 결과와 할당량을 검증할 수 있는 구조만 제공한다.

## 원본과 재구성의 범위

원본 `SSW.Example.DuckTyping`에는 pattern enumerator, ArrayPool 버퍼의 using 강제 Roslyn analyzer, 간단한 source generator가 함께 있었다. 이번 재구성은 주제를 좁혀 **열거 방식의 비교**만 core에 넣었고, analyzer/generator는 반입하지 않았다. 원본 BenchmarkDotNet 러너는 실제 변형 대신 문자열을 출력하는 활성 항목이 있어 사용하지 않았다.

## 구조

```text
duck-typing/
├─ src/SSW.Benchmarks.DuckTyping/              # 토큰화 계약과 네 열거 구현
├─ tests/SSW.Benchmarks.DuckTyping.Tests/      # 빈 입력·경계 구분자·동등 결과 검증
└─ bench/SSW.Benchmarks.DuckTyping.Benchmarks/ # 실제 구현을 소비하는 BenchmarkDotNet 러너
```

토큰화 계약은 빈 입력을 빈 토큰 시퀀스로 처리하고, 그 외 입력의 연속·시작·끝 구분자에서 생기는 빈 토큰은 보존한다. 따라서 구현 간 비교에서 의미가 달라지지 않는다.

## 실행

이 디렉터리에서 실행합니다.

```powershell
.\run-tests.ps1
.\run-benchmark.ps1 -List
.\run-benchmark.ps1
```

SDK 빌드와 BenchmarkDotNet 산출물은 `benchmarks/artifacts/` 아래에 모입니다.

측정 결과는 검증 실행 후 기록한다. 이 문서에는 수치를 미리 적지 않는다.
