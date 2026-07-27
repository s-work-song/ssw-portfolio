using ProtoBuf;
using SSW.Benchmarks.SerializationProtobuf.Models;

namespace SSW.Benchmarks.SerializationProtobuf.Serializers;

/// <summary>
/// 정수 인코딩 전용 모델의 round-trip을 한곳에 모읍니다.
/// 테스트는 크기 수치가 아니라 Default, ZigZag, fixed-size가 값 자체를 보존하는지를 검증합니다.
/// </summary>
public static class IntegerEncodingCodec
{
    /// <summary>정수 인코딩 모델을 직렬화합니다.</summary>
    public static byte[] Serialize(IntegerEncodingSample sample)
    {
        ArgumentNullException.ThrowIfNull(sample);
        using var stream = new MemoryStream();
        Serializer.Serialize(stream, sample);
        return stream.ToArray();
    }

    /// <summary>정수 인코딩 모델을 복원합니다.</summary>
    public static IntegerEncodingSample Deserialize(ReadOnlyMemory<byte> payload)
    {
        using var stream = new MemoryStream(payload.ToArray(), writable: false);
        return Serializer.Deserialize<IntegerEncodingSample>(stream);
    }
}
