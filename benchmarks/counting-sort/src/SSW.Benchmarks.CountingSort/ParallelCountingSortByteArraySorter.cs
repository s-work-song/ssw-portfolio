using System.Collections.Concurrent;
using System.Threading;

namespace SSW.Benchmarks.CountingSort;

/// <summary>
/// 입력 구간별 로컬 빈도를 병합하는 병렬 계수 정렬입니다.
/// </summary>
/// <remarks>
/// 입력을 구간으로 나누면 각 작업자는 자신의 256칸 local count만 갱신하므로 count
/// 자체를 공유하지 않습니다. 종료 시 local count를 전역 count에 병합한 뒤 공통 출력
/// 단계를 수행합니다. 이는 큰 입력에서 병렬성을 관찰하기 위한 전략이지만, 작은 입력의
/// 스레드 작업 오버헤드와 <see cref="Interlocked.Add(ref int, int)"/> 병합 비용 때문에
/// 항상 유리하지는 않습니다. 병합 방식을 바꾸더라도 local buffer와 최종 merge 비용의
/// trade-off는 남습니다.
/// </remarks>
public sealed class ParallelCountingSortByteArraySorter : IByteArraySorter
{
    /// <summary>구간별 로컬 빈도를 병합하는 변형을 식별하는 이름입니다.</summary>
    public string Name => "Counting (parallel)";

    /// <summary>입력을 분할해 세고 병합한 뒤 제자리 오름차순 정렬합니다.</summary>
    public void Sort(byte[] values)
    {
        ArgumentNullException.ThrowIfNull(values);
        if (values.Length < 2)
        {
            return;
        }

        var counts = new int[256];
        var chunkSize = Math.Max(1, values.Length / Math.Max(1, Environment.ProcessorCount * 4));

        // 작업자는 공유 count 대신 독립 local count를 누적합니다.
        Parallel.ForEach(
            Partitioner.Create(0, values.Length, chunkSize),
            () => new int[256],
            (range, _, localCounts) =>
            {
                for (var index = range.Item1; index < range.Item2; index++)
                {
                    localCounts[values[index]]++;
                }

                return localCounts;
            },
            localCounts =>
            {
                // 종료 시에만 atomic add로 local 결과를 전역 count에 합칩니다.
                for (var value = 0; value < counts.Length; value++)
                {
                    if (localCounts[value] != 0)
                    {
                        Interlocked.Add(ref counts[value], localCounts[value]);
                    }
                }
            });

        CountingSortWriter.WriteSorted(values, counts);
    }
}
