using System.Text.Json;
using SSW.Benchmarks.SerializationProtobuf.Abstractions;
using SSW.Benchmarks.SerializationProtobuf.Models;

namespace SSW.Benchmarks.SerializationProtobuf.Serializers;

/// <summary>
/// 사람이 읽을 수 있는 JSON 기준 구현입니다.
/// JSON의 필드명과 숫자 텍스트 표현 비용을 Protobuf의 이진 스키마와 비교하는 기준점으로 사용합니다.
/// </summary>
public sealed class JsonFrameSerializer : IFrameSerializer<InputFrame>
{
    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    /// <inheritdoc />
    public byte[] Serialize(InputFrame frame)
    {
        ArgumentNullException.ThrowIfNull(frame);
        return JsonSerializer.SerializeToUtf8Bytes(frame, Options);
    }

    /// <inheritdoc />
    public InputFrame Deserialize(ReadOnlyMemory<byte> payload) =>
        JsonSerializer.Deserialize<InputFrame>(payload.Span, Options)
        ?? throw new InvalidDataException("JSON payload에서 입력 프레임을 복원할 수 없습니다.");
}
