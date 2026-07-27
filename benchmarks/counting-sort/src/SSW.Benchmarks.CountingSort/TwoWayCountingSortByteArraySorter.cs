namespace SSW.Benchmarks.CountingSort;

/// <summary>
/// 두 독립 빈도 버퍼로 write-after-write 의존성을 완화하는 계수 정렬입니다.
/// </summary>
/// <remarks>
/// byte 도메인에서는 <c>k = 256</c>이므로 계수 정렬의 count와 출력은 <c>O(n + k)</c>입니다.
/// 두 버퍼는 인접 입력이 같은 count slot을 연속 갱신하는 일을 줄이려는 실험 장치입니다.
/// 하지만 추가 버퍼 초기화와 마지막 merge는 비용이며, 메모리 대역폭과 store port 제약에
/// 따라 결과가 달라질 수 있습니다.
/// </remarks>
public sealed class TwoWayCountingSortByteArraySorter : IByteArraySorter
{
    /// <summary>두 개의 빈도 버퍼를 쓰는 변형을 식별하는 이름입니다.</summary>
    public string Name => "Counting (2-way)";

    /// <summary>두 버퍼로 입력을 세고 병합해 제자리 오름차순 정렬합니다.</summary>
    public void Sort(byte[] values)
    {
        ArgumentNullException.ThrowIfNull(values);
        if (values.Length < 2)
        {
            return;
        }

        Span<int> counts0 = stackalloc int[256];
        Span<int> counts1 = stackalloc int[256];
        counts0.Clear();
        counts1.Clear();

        var pairedLength = values.Length - (values.Length % 2);
        var index = 0;
        // 독립 버퍼로 인접 count 갱신을 분산한 뒤, 뒤에서 한 번만 병합합니다.
        for (; index < pairedLength; index += 2)
        {
            counts0[values[index]]++;
            counts1[values[index + 1]]++;
        }

        for (; index < values.Length; index++)
        {
            counts0[values[index]]++;
        }

        for (var value = 0; value < 256; value++)
        {
            counts0[value] += counts1[value];
        }

        CountingSortWriter.WriteSorted(values, counts0);
    }
}
