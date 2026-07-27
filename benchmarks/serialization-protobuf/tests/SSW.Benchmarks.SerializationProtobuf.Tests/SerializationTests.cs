using SSW.Benchmarks.SerializationProtobuf.Abstractions;
using SSW.Benchmarks.SerializationProtobuf.Models;
using SSW.Benchmarks.SerializationProtobuf.Packing;
using SSW.Benchmarks.SerializationProtobuf.Serializers;

namespace SSW.Benchmarks.SerializationProtobuf.Tests;

/// <summary>
/// 형식별 크기 우열이 아니라 데이터 보존을 먼저 확인하는 테스트입니다.
/// fixture는 공개 가능한 example.invalid 주소만 사용합니다.
/// </summary>
public sealed class SerializationTests
{
    public static IEnumerable<object[]> FrameSerializers()
    {
        yield return ["json", new JsonFrameSerializer()];
        yield return ["protobuf", new ProtobufFrameSerializer()];
    }

    [Theory]
    [MemberData(nameof(FrameSerializers))]
    public void Frame_serializer_round_trips_all_fields(string _, IFrameSerializer<InputFrame> serializer)
    {
        var expected = new InputFrame
        {
            X = 120,
            Y = -45,
            Buttons = 0b1011,
            ScrollDelta = -3,
            Tick = 42,
            Email = "fixture@example.invalid",
        };

        InputFrame actual = serializer.Deserialize(serializer.Serialize(expected));

        Assert.Equal(expected.X, actual.X);
        Assert.Equal(expected.Y, actual.Y);
        Assert.Equal(expected.Buttons, actual.Buttons);
        Assert.Equal(expected.ScrollDelta, actual.ScrollDelta);
        Assert.Equal(expected.Tick, actual.Tick);
        Assert.Equal(expected.Email, actual.Email);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(-1)]
    [InlineData(16384)]
    [InlineData(-16384)]
    [InlineData(int.MaxValue)]
    [InlineData(int.MinValue)]
    public void Integer_encoding_round_trips(int value)
    {
        var expected = new IntegerEncodingSample
        {
            DefaultValue = value,
            ZigZagValue = value,
            FixedValue = value,
        };

        IntegerEncodingSample actual = IntegerEncodingCodec.Deserialize(IntegerEncodingCodec.Serialize(expected));

        Assert.Equal(expected.DefaultValue, actual.DefaultValue);
        Assert.Equal(expected.ZigZagValue, actual.ZigZagValue);
        Assert.Equal(expected.FixedValue, actual.FixedValue);
    }

    [Fact]
    public void Nibble_packing_round_trips_odd_value_count()
    {
        byte[] values = [0, 1, 15, 4, 9];
        PackedNibbles packed = NibblePacking.Pack(values);

        Assert.Equal(values.Length, packed.ValueCount);
        Assert.Equal(values, NibblePacking.Unpack(packed));
    }

    [Fact]
    public void Nibble_packing_rejects_value_outside_four_bits()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => NibblePacking.Pack([16]));
    }
}
