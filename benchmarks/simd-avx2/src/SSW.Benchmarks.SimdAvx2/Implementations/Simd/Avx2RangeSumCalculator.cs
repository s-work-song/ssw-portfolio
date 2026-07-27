using System.Runtime.InteropServices;
using System.Runtime.Intrinsics;
using System.Runtime.Intrinsics.X86;
using SSW.Benchmarks.SimdAvx2.Abstractions;
using SSW.Benchmarks.SimdAvx2.Implementations.Scalar;

namespace SSW.Benchmarks.SimdAvx2.Implementations.Simd;

/// <summary>
/// AVX2의 256비트 레인으로 바이트 32개를 한 번에 필터링하는 구현입니다.
/// unsigned byte 비교는 Min/Max와 CompareEqual 조합으로 만들고,
/// SumAbsoluteDifferences를 0 벡터와 수행해 필터된 바이트의 부분합을 ushort 레인으로 만듭니다.
/// AVX2가 없는 환경에서는 기준 scalar 구현으로 의미를 보존합니다.
/// </summary>
public sealed class Avx2RangeSumCalculator : IRangeSumCalculator
{
    private readonly IRangeSumCalculator _fallback;

    /// <summary>기본 fallback은 조건 분기 scalar 구현입니다.</summary>
    public Avx2RangeSumCalculator(IRangeSumCalculator? fallback = null)
    {
        _fallback = fallback ?? new BranchedRangeSumCalculator();
    }

    /// <inheritdoc />
    public long Sum(ReadOnlyMemory<byte> source, ByteRange range)
    {
        range.EnsureValid();
        if (!Avx2.IsSupported)
        {
            return _fallback.Sum(source, range);
        }

        ReadOnlySpan<byte> values = source.Span;
        int vectorSize = Vector256<byte>.Count;
        int vectorLength = values.Length - (values.Length % vectorSize);
        Vector256<byte> minimum = Vector256.Create(range.Minimum);
        Vector256<byte> maximum = Vector256.Create(range.Maximum);
        long total = 0;
        ref byte first = ref MemoryMarshal.GetReference(values);

        for (int index = 0; index < vectorLength; index += vectorSize)
        {
            Vector256<byte> value = Vector256.LoadUnsafe(ref first, (nuint)index);
            total += Vector256.Sum(SumFilteredVector(value, minimum, maximum));
        }

        for (int index = vectorLength; index < values.Length; index++)
        {
            byte value = values[index];
            if (value >= range.Minimum && value <= range.Maximum)
            {
                total += value;
            }
        }

        return total;
    }

    internal static Vector256<ushort> SumFilteredVector(
        Vector256<byte> value,
        Vector256<byte> minimum,
        Vector256<byte> maximum)
    {
        Vector256<byte> greaterThanOrEqual = Avx2.CompareEqual(Avx2.Max(value, minimum), value);
        Vector256<byte> lessThanOrEqual = Avx2.CompareEqual(Avx2.Min(value, maximum), value);
        Vector256<byte> mask = Avx2.And(greaterThanOrEqual, lessThanOrEqual);
        return Avx2.SumAbsoluteDifferences(Avx2.And(value, mask), Vector256<byte>.Zero);
    }
}
