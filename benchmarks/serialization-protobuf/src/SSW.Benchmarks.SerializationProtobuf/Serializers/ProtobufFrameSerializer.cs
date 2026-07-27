using ProtoBuf;
using SSW.Benchmarks.SerializationProtobuf.Abstractions;
using SSW.Benchmarks.SerializationProtobuf.Models;

namespace SSW.Benchmarks.SerializationProtobuf.Serializers;

/// <summary>
/// protobuf-net으로 같은 입력 프레임을 이진 스키마에 따라 직렬화합니다.
/// 이 구현은 압축기를 결합하지 않으며 Protobuf 자체의 필드 번호와 Varint 동작만 다룹니다.
/// </summary>
public sealed class ProtobufFrameSerializer : IFrameSerializer<InputFrame>
{
    /// <inheritdoc />
    public byte[] Serialize(InputFrame frame)
    {
        ArgumentNullException.ThrowIfNull(frame);
        using var stream = new MemoryStream();
        Serializer.Serialize(stream, frame);
        return stream.ToArray();
    }

    /// <inheritdoc />
    public InputFrame Deserialize(ReadOnlyMemory<byte> payload)
    {
        using var stream = new MemoryStream(payload.ToArray(), writable: false);
        return Serializer.Deserialize<InputFrame>(stream);
    }
}
