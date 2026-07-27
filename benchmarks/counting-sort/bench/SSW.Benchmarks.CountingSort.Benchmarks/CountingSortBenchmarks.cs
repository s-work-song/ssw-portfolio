using BenchmarkDotNet.Attributes;
using SSW.Benchmarks.Shared.Benchmarking;
using SSW.Benchmarks.CountingSort;

namespace SSW.Benchmarks.CountingSort.Benchmarks;

[MemoryDiagnoser]
[Config(typeof(SharedBenchmarkConfig))]
[SimpleJob(warmupCount: 3, iterationCount: 10)]
[InvocationCount(1)]
public class CountingSortBenchmarks
{
    private readonly IByteArraySorter _arraySort = new ArraySortByteArraySorter();
    private readonly IByteArraySorter _singleCounting = new SingleCountingSortByteArraySorter();
    private readonly IByteArraySorter _twoWayCounting = new TwoWayCountingSortByteArraySorter();
    private readonly IByteArraySorter _fourWayCounting = new FourWayCountingSortByteArraySorter();
    private readonly IByteArraySorter _eightWayCounting = new EightWayCountingSortByteArraySorter();
    private readonly IByteArraySorter _parallelCounting = new ParallelCountingSortByteArraySorter();

    private byte[] _source = [];
    private byte[] _input = [];

    [GlobalSetup]
    public void CreateSource()
    {
        _source = new byte[32 * 1024];
        new Random(20260727).NextBytes(_source);
        _input = new byte[_source.Length];
    }

    [IterationSetup]
    public void RestoreInput()
    {
        _source.AsSpan().CopyTo(_input);
    }

    [Benchmark(Baseline = true)]
    public void ArraySort() => _arraySort.Sort(_input);

    [Benchmark]
    public void SingleCounting() => _singleCounting.Sort(_input);

    [Benchmark]
    public void TwoWayCounting() => _twoWayCounting.Sort(_input);

    [Benchmark]
    public void FourWayCounting() => _fourWayCounting.Sort(_input);

    [Benchmark]
    public void EightWayCounting() => _eightWayCounting.Sort(_input);

    [Benchmark]
    public void ParallelCounting() => _parallelCounting.Sort(_input);
}
