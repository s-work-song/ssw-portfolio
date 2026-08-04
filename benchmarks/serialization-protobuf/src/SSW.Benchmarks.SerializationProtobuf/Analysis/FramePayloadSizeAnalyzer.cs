using SSW.Benchmarks.SerializationProtobuf.Models;
using SSW.Benchmarks.SerializationProtobuf.Serializers;

namespace SSW.Benchmarks.SerializationProtobuf.Analysis;

/// <summary>같은 프레임을 두 형식으로 직렬화했을 때의 실제 payload 바이트 수입니다.</summary>
public readonly record struct FramePayloadSizeComparison(
    string Scenario,
    int JsonBytes,
    int ProtobufBytes)
{
    public int SavedBytes => JsonBytes - ProtobufBytes;

    public double ReductionPercent => JsonBytes == 0
        ? 0
        : (double)SavedBytes / JsonBytes * 100;
}
public static class FramePayloadSizeAnalyzer
{
    private static readonly JsonFrameSerializer Json = new();
    private static readonly ProtobufFrameSerializer Protobuf = new();

    public static FramePayloadSizeComparison Compare(string scenario, InputFrame frame)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(scenario);
        ArgumentNullException.ThrowIfNull(frame);

        return new FramePayloadSizeComparison(
            scenario,
            Json.Serialize(frame).Length,
            Protobuf.Serialize(frame).Length);
    }
}
