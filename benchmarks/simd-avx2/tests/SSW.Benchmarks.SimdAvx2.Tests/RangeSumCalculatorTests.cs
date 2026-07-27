using SSW.Benchmarks.SimdAvx2.Abstractions;
using SSW.Benchmarks.SimdAvx2.Decorators;
using SSW.Benchmarks.SimdAvx2.Implementations.Scalar;
using SSW.Benchmarks.SimdAvx2.Implementations.Simd;
using SSW.Benchmarks.SimdAvx2.TestData;

namespace SSW.Benchmarks.SimdAvx2.Tests;

/// <summary>
/// 성능 비교 전에 모든 변형이 기준 구현과 같은 결과를 내는지 검증합니다.
/// AVX2가 없는 환경에서는 해당 구현의 scalar fallback도 같은 계약으로 검증됩니다.
/// </summary>
public sealed class RangeSumCalculatorTests
{
    public static IEnumerable<object[]> Calculators()
    {
        yield return ["branched", new BranchedRangeSumCalculator()];
        yield return ["branchless", new BranchlessRangeSumCalculator()];
        yield return ["avx2", new Avx2RangeSumCalculator()];
        yield return ["avx2-unrolled", new UnrolledAvx2RangeSumCalculator()];
        yield return ["parallel", new ParallelRangeSumCalculator()];
    }

    [Theory]
    [MemberData(nameof(Calculators))]
    public void Sum_matches_branched_baseline_for_deterministic_data(string _, IRangeSumCalculator calculator)
    {
        byte[] data = DeterministicByteData.Create(1_000_003);
        var range = new ByteRange(40, 210);
        long expected = new BranchedRangeSumCalculator().Sum(data, range);

        Assert.Equal(expected, calculator.Sum(data, range));
    }

    [Theory]
    [MemberData(nameof(Calculators))]
    public void Sum_handles_empty_and_tail_lengths(string _, IRangeSumCalculator calculator)
    {
        var range = new ByteRange(10, 200);
        Assert.Equal(0, calculator.Sum(Array.Empty<byte>(), range));

        byte[] tailData = [0, 10, 11, 199, 200, 201, 255];
        Assert.Equal(420, calculator.Sum(tailData, range));
    }

    [Theory]
    [MemberData(nameof(Calculators))]
    public void Sum_rejects_reversed_range(string _, IRangeSumCalculator calculator)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => calculator.Sum(new byte[] { 1, 2, 3 }, new ByteRange(200, 10)));
    }
}
