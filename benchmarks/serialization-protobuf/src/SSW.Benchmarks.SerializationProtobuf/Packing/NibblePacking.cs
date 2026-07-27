namespace SSW.Benchmarks.SerializationProtobuf.Packing;

/// <summary>
/// 4비트 범위 값의 pack/unpack을 담당합니다.
/// 이 단계는 Protobuf나 압축기의 대체물이 아니라, 작은 도메인 값의 표현 폭을 줄이는 별도 전처리입니다.
/// </summary>
public static class NibblePacking
{
    /// <summary>0부터 15까지의 값 두 개를 한 바이트의 상·하위 nibble에 저장합니다.</summary>
    public static PackedNibbles Pack(ReadOnlySpan<byte> values)
    {
        byte[] packed = new byte[(values.Length + 1) / 2];
        for (int index = 0; index < values.Length; index++)
        {
            byte value = values[index];
            if (value > 0x0F)
            {
                throw new ArgumentOutOfRangeException(nameof(values), "nibble 값은 0부터 15까지여야 합니다.");
            }

            int outputIndex = index / 2;
            packed[outputIndex] = index % 2 == 0
                ? (byte)(value << 4)
                : (byte)(packed[outputIndex] | value);
        }

        return new PackedNibbles(packed, values.Length);
    }

    /// <summary>원본 길이 계약에 따라 상·하위 nibble을 각각 하나의 바이트 값으로 복원합니다.</summary>
    public static byte[] Unpack(PackedNibbles packed)
    {
        ArgumentNullException.ThrowIfNull(packed);
        packed.EnsureValid();

        byte[] values = new byte[packed.ValueCount];
        for (int index = 0; index < values.Length; index++)
        {
            byte source = packed.Bytes[index / 2];
            values[index] = index % 2 == 0
                ? (byte)(source >> 4)
                : (byte)(source & 0x0F);
        }

        return values;
    }
}
