using SSW.Benchmarks.SerializationProtobuf.Abstractions;
using SSW.Benchmarks.SerializationProtobuf.Analysis;
using SSW.Benchmarks.SerializationProtobuf.Models;
using SSW.Benchmarks.SerializationProtobuf.Packing;
using SSW.Benchmarks.SerializationProtobuf.Serializers;
using SSW.Benchmarks.SerializationProtobuf.TestData;

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
        InputFrame expected = InputFrameFixtures.CreateStandard();

        InputFrame actual = serializer.Deserialize(serializer.Serialize(expected));

        Assert.Equal(expected.X, actual.X);
        Assert.Equal(expected.Y, actual.Y);
        Assert.Equal(expected.Buttons, actual.Buttons);
        Assert.Equal(expected.ScrollDelta, actual.ScrollDelta);
        Assert.Equal(expected.Tick, actual.Tick);
        Assert.Equal(expected.Email, actual.Email);
    }

    [Fact]
    public void Payload_size_comparison_uses_the_actual_serialized_byte_counts()
    {
        InputFrame frame = InputFrameFixtures.CreateStandard();
        FramePayloadSizeComparison result = FramePayloadSizeAnalyzer.Compare("standard", frame);

        Assert.Equal(new JsonFrameSerializer().Serialize(frame).Length, result.JsonBytes);
        Assert.Equal(new ProtobufFrameSerializer().Serialize(frame).Length, result.ProtobufBytes);
        Assert.Equal(result.JsonBytes - result.ProtobufBytes, result.SavedBytes);
        Assert.Equal((double)result.SavedBytes / result.JsonBytes * 100, result.ReductionPercent, 10);
    }

    [Fact]
    public void Default_frame_is_more_compact_in_protobuf_than_named_json_fields()
    {
        FramePayloadSizeComparison result = FramePayloadSizeAnalyzer.Compare(
            "defaults",
            InputFrameFixtures.CreateDefaults());

        Assert.True(result.JsonBytes > 0);
        Assert.InRange(result.ProtobufBytes, 1, result.JsonBytes - 1);
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
