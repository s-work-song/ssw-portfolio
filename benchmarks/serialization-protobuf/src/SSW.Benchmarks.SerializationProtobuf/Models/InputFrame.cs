using ProtoBuf;

namespace SSW.Benchmarks.SerializationProtobuf.Models;

/// <summary>
/// 입력 프레임의 예시 모델입니다.
/// 필드 번호는 Protobuf 호환 계약이므로 의미를 바꾸지 않는 한 유지해야 하며,
/// Email은 공개 fixture의 비개인 주소만 사용하는지 확인하기 위한 예시 문자열입니다.
/// </summary>
[ProtoContract]
public sealed class InputFrame
{
    [ProtoMember(1)]
    public int X { get; set; }

    [ProtoMember(2)]
    public int Y { get; set; }

    [ProtoMember(3)]
    public uint Buttons { get; set; }

    [ProtoMember(4, DataFormat = DataFormat.ZigZag)]
    public int ScrollDelta { get; set; }

    [ProtoMember(5, DataFormat = DataFormat.FixedSize)]
    public uint Tick { get; set; }

    [ProtoMember(6)]
    public string Email { get; set; } = string.Empty;
}
