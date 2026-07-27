namespace SSW.Benchmarks.SerializationProtobuf.Packing;

/// <summary>
/// 0부터 15까지의 값 두 개를 한 바이트에 저장한 결과입니다.
/// 홀수 개 입력의 마지막 하위 nibble은 값이 아니므로 원본 길이를 함께 보존합니다.
/// </summary>
public sealed record PackedNibbles(byte[] Bytes, int ValueCount)
{
    /// <summary>패킹 결과의 길이 계약을 확인합니다.</summary>
    public void EnsureValid()
    {
        ArgumentNullException.ThrowIfNull(Bytes);
        if (ValueCount < 0 || ValueCount > Bytes.Length * 2)
        {
            throw new ArgumentOutOfRangeException(nameof(ValueCount));
        }
    }
}
