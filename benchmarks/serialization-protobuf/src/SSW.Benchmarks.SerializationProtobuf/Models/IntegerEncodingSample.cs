using ProtoBuf;

namespace SSW.Benchmarks.SerializationProtobuf.Models;

/// <summary>
/// 같은 정수를 Default Varint, ZigZag Varint, fixed-size 필드로 저장해
/// 음수와 값 범위가 인코딩 길이에 미치는 영향을 관찰하는 모델입니다.
/// </summary>
[ProtoContract]
public sealed class IntegerEncodingSample
{
    [ProtoMember(1)]
    public int DefaultValue { get; set; }

    [ProtoMember(2, DataFormat = DataFormat.ZigZag)]
    public int ZigZagValue { get; set; }

    [ProtoMember(3, DataFormat = DataFormat.FixedSize)]
    public int FixedValue { get; set; }
}
