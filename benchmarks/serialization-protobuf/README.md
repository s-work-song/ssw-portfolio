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

## 실행

```powershell
dotnet test SSW.Benchmarks.SerializationProtobuf.sln -c Release
dotnet run -c Release --project bench/SSW.Benchmarks.SerializationProtobuf.Benchmarks -- --list flat
dotnet run -c Release --project bench/SSW.Benchmarks.SerializationProtobuf.Benchmarks
```

마지막 명령은 사용자가 자신의 환경에서 측정할 때만 실행합니다.

SDK 빌드와 BenchmarkDotNet 산출물은 `benchmarks/artifacts/` 아래에 모입니다.

## 범위와 결과 정책

이 실험은 JSON, protobuf-net, Varint/ZigZag/fixed-size, nibble packing까지만 다룹니다. ZSTD, GZip, 소켓 전송과 사이트에 표시된 압축·전송 수치는 이번 반입 범위 밖이므로 구현하거나 추정하지 않습니다.

BenchmarkDotNet 본실행 수치와 산출물은 저장소에 커밋하지 않습니다. 테스트는 round-trip 정확성을 보장하고, 환경별 시간·할당량은 사용자가 직접 실행해 확인합니다.
