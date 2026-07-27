using SSW.Benchmarks.SimdAvx2.Abstractions;

namespace SSW.Benchmarks.SimdAvx2.Implementations.Scalar;

/// <summary>
/// 가장 읽기 쉬운 기준 구현입니다.
/// 데이터 분포가 예측 가능하면 CPU의 분기 예측기가 잘 동작하지만,
/// 무작위 데이터에서는 잘못 예측한 분기를 되돌리는 비용이 누적될 수 있습니다.
/// </summary>
public sealed class BranchedRangeSumCalculator : IRangeSumCalculator
{
    /// <inheritdoc />
    public long Sum(ReadOnlyMemory<byte> source, ByteRange range)
    {
        range.EnsureValid();

        long total = 0;
        foreach (byte value in source.Span)
        {
            if (value >= range.Minimum && value <= range.Maximum)
            {
                total += value;
            }
        }

        return total;
    }
}
