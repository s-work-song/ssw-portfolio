using BenchmarkDotNet.Attributes;
using SSW.Benchmarks.Shared.Benchmarking;
using SSW.Benchmarks.SimdAvx2.Abstractions;
using SSW.Benchmarks.SimdAvx2.Decorators;
using SSW.Benchmarks.SimdAvx2.Implementations.Scalar;
using SSW.Benchmarks.SimdAvx2.Implementations.Simd;
using SSW.Benchmarks.SimdAvx2.TestData;

namespace SSW.Benchmarks.SimdAvx2.Benchmarks;

/// <summary>
/// 동일한 고정 입력으로 실제 구현 변형을 호출합니다.
/// MemoryDiagnoser는 병렬 작업 분할이나 의도하지 않은 할당을 함께 관찰하기 위한 도구입니다.
/// </summary>
[MemoryDiagnoser]
[Config(typeof(SharedBenchmarkConfig))]
public sealed class RangeSumBenchmarks
{
    private readonly ByteRange _range = new(40, 210);
    private readonly IRangeSumCalculator _branched = new BranchedRangeSumCalculator();
    private readonly IRangeSumCalculator _branchless = new BranchlessRangeSumCalculator();
    private readonly IRangeSumCalculator _avx2 = new Avx2RangeSumCalculator();
    private readonly IRangeSumCalculator _unrolled = new UnrolledAvx2RangeSumCalculator();
    private readonly IRangeSumCalculator _parallel = new ParallelRangeSumCalculator();
    private byte[] _data = [];

    /// <summary>반복 간 데이터 생성을 제거하기 위해 고정 입력을 준비합니다.</summary>
    [GlobalSetup]
    public void Setup() => _data = DeterministicByteData.Create(1_000_003);

    [Benchmark(Baseline = true)]
    public long Branched() => _branched.Sum(_data, _range);

    [Benchmark]
    public long Branchless() => _branchless.Sum(_data, _range);

    [Benchmark]
    public long Avx2() => _avx2.Sum(_data, _range);

    [Benchmark]
    public long Avx2Unrolled() => _unrolled.Sum(_data, _range);

    [Benchmark]
    public long ParallelAvx2() => _parallel.Sum(_data, _range);
}
