using SSW.Benchmarks.SimdAvx2.Abstractions;

namespace SSW.Benchmarks.SimdAvx2.Implementations.Scalar;

/// <summary>
/// 범위 밖 여부를 부호 비트로 바꾸어 값 또는 0을 더하는 scalar 구현입니다.
/// 조건 분기 자체는 줄지만, 추가 산술과 마스크 연산이 항상 수행되므로
/// 입력 분포와 CPU에 따라 기준 구현보다 빠르다는 보장은 없습니다.
/// </summary>
public sealed class BranchlessRangeSumCalculator : IRangeSumCalculator
{
    /// <inheritdoc />
    public long Sum(ReadOnlyMemory<byte> source, ByteRange range)
    {
        range.EnsureValid();

        long total = 0;
        foreach (byte value in source.Span)
        {
            int outsideRange = (value - range.Minimum) | (range.Maximum - value);
            int includeMask = ~(outsideRange >> 31);
            total += value & includeMask;
        }

        return total;
    }
}
