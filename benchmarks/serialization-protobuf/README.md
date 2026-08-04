# Protobuf 직렬화와 nibble packing

## 배경과 이론

JSON은 사람이 읽기 쉬운 대신 필드명과 숫자의 텍스트 표현을 함께 전송합니다. Protobuf는 필드 번호와 이진 표현을 사용하며, 정수는 값의 범위에 따라 Varint 길이가 달라집니다. ZigZag는 음수를 작은 unsigned 값으로 재배치해 Varint에 적합하게 만들고, fixed-size는 길이를 고정하는 대신 값 범위에 따른 가변 길이 이점을 포기합니다.

Nibble packing은 0부터 15까지인 값 두 개를 한 바이트에 넣는 전처리입니다. 이는 Protobuf나 압축기를 대체하지 않으며, 원본 값 개수를 함께 보존해야 홀수 길이 입력도 정확히 복원할 수 있습니다.

## 구조

```text
src/SSW.Benchmarks.SerializationProtobuf/
  Abstractions/  # JSON/Protobuf 공통 serializer 계약
  Models/        # Protobuf 필드 번호와 정수 인코딩 모델
  Serializers/   # System.Text.Json, protobuf-net 구현
  Packing/       # nibble pack/unpack
tests/           # 형식별 round-trip과 경계값 검증
bench/           # JSON과 Protobuf의 실제 serializer 호출
```

BenchmarkDotNet의 `Allocated`는 직렬화 과정에서 관리 힙에 할당한 메모리이지, 전송되는 결과 데이터의 길이가 아닙니다. 실제 payload 크기는 별도 크기 보고서가 UTF-8 JSON과 Protobuf 결과 배열의 `Length`를 같은 입력별로 직접 비교합니다. 기본값 프레임, 일반 프레임, 256자 문자열을 포함한 프레임을 나누어 형식의 고정 오버헤드와 데이터 증가에 따른 변화를 확인할 수 있습니다.

## 실행

이 디렉터리에서 실행합니다.

```powershell
.\run-tests.ps1
.\run-size-report.ps1
.\run-benchmark.ps1 -List
.\run-benchmark.ps1
```

크기 보고서는 실제 직렬화 결과의 바이트 수·절약 바이트·JSON 대비 감소율을 즉시 출력합니다. 마지막 명령은 시간과 관리 힙 할당량을 반복 측정하므로 사용자가 자신의 환경에서 측정할 때만 실행합니다.

SDK 빌드와 BenchmarkDotNet 산출물은 `benchmarks/artifacts/` 아래에 모입니다.

## 범위와 결과 정책

이 실험은 JSON, protobuf-net, Varint/ZigZag/fixed-size, nibble packing까지만 다룹니다. ZSTD, GZip, 소켓 전송과 사이트에 표시된 압축·전송 수치는 이번 반입 범위 밖이므로 구현하거나 추정하지 않습니다.

BenchmarkDotNet 본실행 수치와 산출물은 저장소에 커밋하지 않습니다. 테스트는 round-trip 정확성을 보장하고, 환경별 시간·할당량은 사용자가 직접 실행해 확인합니다.
