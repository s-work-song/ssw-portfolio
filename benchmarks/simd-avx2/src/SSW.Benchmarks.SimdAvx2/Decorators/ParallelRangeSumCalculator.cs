using System.Collections.Concurrent;
using SSW.Benchmarks.SimdAvx2.Abstractions;
using SSW.Benchmarks.SimdAvx2.Implementations.Simd;

namespace SSW.Benchmarks.SimdAvx2.Decorators;

/// <summary>
/// 큰 입력을 여러 구간으로 나누어 내부 계산기를 병렬 실행합니다.
/// 병렬화는 CPU 코어를 활용할 수 있지만 작업 분할과 합산 동기화 비용이 있으므로,
/// 작은 입력은 내부 계산기에 그대로 위임합니다.
/// </summary>
public sealed class ParallelRangeSumCalculator : IRangeSumCalculator
{
    private const int ParallelThreshold = 256 * 1024;
    private readonly IRangeSumCalculator _inner;

    /// <summary>기본 내부 구현은 AVX2 fallback 계산기입니다.</summary>
    public ParallelRangeSumCalculator(IRangeSumCalculator? inner = null)
    {
        _inner = inner ?? new Avx2RangeSumCalculator();
    }

    /// <inheritdoc />
    public long Sum(ReadOnlyMemory<byte> source, ByteRange range)
    {
        range.EnsureValid();
        if (source.Length < ParallelThreshold)
        {
            return _inner.Sum(source, range);
        }

        long total = 0;
        int chunkSize = Math.Max(ParallelThreshold, source.Length / (Environment.ProcessorCount * 2));
        Parallel.ForEach(
            Partitioner.Create(0, source.Length, chunkSize),
            () => 0L,
            (chunk, _, localTotal) => localTotal + _inner.Sum(source.Slice(chunk.Item1, chunk.Item2 - chunk.Item1), range),
            localTotal => Interlocked.Add(ref total, localTotal));

        return total;
    }
}
