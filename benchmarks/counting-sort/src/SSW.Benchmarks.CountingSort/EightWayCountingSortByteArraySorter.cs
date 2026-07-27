namespace SSW.Benchmarks.CountingSort;

/// <summary>
/// 여덟 독립 빈도 버퍼를 병합하고 남은 입력도 반영하는 계수 정렬입니다.
/// </summary>
/// <remarks>
/// byte 도메인은 <c>k = 256</c>으로 고정되어 있어 입력 길이 <c>n</c>이 커질수록
/// 비교 정렬 대신 <c>O(n + k)</c> 계수 정렬을 시험할 수 있습니다. 여덟 count 배열은
/// 같은 count slot에 연속해서 쓰는 write-after-write 의존성을 완화하려는 분할입니다.
/// 다만 추가 버퍼의 메모리 사용량, store port와 메모리 대역폭의 제약, 마지막 256칸
/// 병합 비용이 함께 생기므로 항상 더 빠르다는 뜻은 아닙니다.
/// </remarks>
public sealed class EightWayCountingSortByteArraySorter : IByteArraySorter
{
    /// <summary>여덟 개의 빈도 버퍼를 쓰는 변형을 식별하는 이름입니다.</summary>
    public string Name => "Counting (8-way)";

    /// <summary>입력 값을 세고 여덟 버퍼를 병합해 제자리 오름차순 정렬합니다.</summary>
    public void Sort(byte[] values)
    {
        ArgumentNullException.ThrowIfNull(values);
        if (values.Length < 2)
        {
            return;
        }

        Span<int> counts0 = stackalloc int[256];
        Span<int> counts1 = stackalloc int[256];
        Span<int> counts2 = stackalloc int[256];
        Span<int> counts3 = stackalloc int[256];
        Span<int> counts4 = stackalloc int[256];
        Span<int> counts5 = stackalloc int[256];
        Span<int> counts6 = stackalloc int[256];
        Span<int> counts7 = stackalloc int[256];
        counts0.Clear();
        counts1.Clear();
        counts2.Clear();
        counts3.Clear();
        counts4.Clear();
        counts5.Clear();
        counts6.Clear();
        counts7.Clear();

        var blockLength = values.Length - (values.Length % 8);
        var index = 0;
        // 서로 다른 버퍼에 기록해 같은 slot으로의 연속 쓰기를 분산합니다.
        for (; index < blockLength; index += 8)
        {
            counts0[values[index]]++;
            counts1[values[index + 1]]++;
            counts2[values[index + 2]]++;
            counts3[values[index + 3]]++;
            counts4[values[index + 4]]++;
            counts5[values[index + 5]]++;
            counts6[values[index + 6]]++;
            counts7[values[index + 7]]++;
        }

        for (; index < values.Length; index++)
        {
            counts0[values[index]]++;
        }

        // 분할 count를 합친 뒤 공통 출력 단계에서 정렬된 배열을 만듭니다.
        for (var value = 0; value < 256; value++)
        {
            counts0[value] += counts1[value] + counts2[value] + counts3[value] + counts4[value]
                + counts5[value] + counts6[value] + counts7[value];
        }

        CountingSortWriter.WriteSorted(values, counts0);
    }
}
