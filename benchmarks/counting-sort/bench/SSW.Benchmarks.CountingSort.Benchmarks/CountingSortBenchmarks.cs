using BenchmarkDotNet.Attributes;
using SSW.Benchmarks.Shared.Benchmarking;
using SSW.Benchmarks.CountingSort;

namespace SSW.Benchmarks.CountingSort.Benchmarks;

[MemoryDiagnoser]
[Config(typeof(SharedBenchmarkConfig))]
[SimpleJob(warmupCount: 3, iterationCount: 10)]
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

    [Benchmark(Baseline = true)]
    public void ArraySort() => RestoreAndSort(_arraySort);

    [Benchmark]
    public void SingleCounting() => RestoreAndSort(_singleCounting);

    [Benchmark]
    public void TwoWayCounting() => RestoreAndSort(_twoWayCounting);

    [Benchmark]
    public void FourWayCounting() => RestoreAndSort(_fourWayCounting);

    [Benchmark]
    public void EightWayCounting() => RestoreAndSort(_eightWayCounting);

    [Benchmark]
    public void ParallelCounting() => RestoreAndSort(_parallelCounting);

    private void RestoreAndSort(IByteArraySorter sorter)
    {
        _source.AsSpan().CopyTo(_input);
        sorter.Sort(_input);
    }
}
