using BenchmarkDotNet.Attributes;
using SSW.Benchmarks.Shared.Benchmarking;
using SSW.Benchmarks.SerializationProtobuf.Abstractions;
using SSW.Benchmarks.SerializationProtobuf.Models;
using SSW.Benchmarks.SerializationProtobuf.Serializers;

namespace SSW.Benchmarks.SerializationProtobuf.Benchmarks;

/// <summary>
/// JSON과 protobuf-net이 같은 프레임을 직렬화하는 경로를 비교합니다.
/// 압축기나 네트워크 I/O는 의도적으로 포함하지 않아 형식 자체의 비용만 관찰합니다.
/// </summary>
[MemoryDiagnoser]
[Config(typeof(SharedBenchmarkConfig))]
public sealed class FrameSerializationBenchmarks
{
    private readonly IFrameSerializer<InputFrame> _json = new JsonFrameSerializer();
    private readonly IFrameSerializer<InputFrame> _protobuf = new ProtobufFrameSerializer();
    private InputFrame _frame = new();

    /// <summary>두 구현이 공유할 공개 가능한 고정 fixture를 준비합니다.</summary>
    [GlobalSetup]
    public void Setup()
    {
        _frame = new InputFrame
        {
            X = 120,
            Y = -45,
            Buttons = 0b1011,
            ScrollDelta = -3,
            Tick = 42,
            Email = "fixture@example.invalid",
        };
    }

    [Benchmark(Baseline = true)]
    public byte[] Json() => _json.Serialize(_frame);

    [Benchmark]
    public byte[] Protobuf() => _protobuf.Serialize(_frame);
}
