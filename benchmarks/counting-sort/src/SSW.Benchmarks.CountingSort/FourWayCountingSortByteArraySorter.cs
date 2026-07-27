namespace SSW.Benchmarks.CountingSort;

/// <summary>
/// 네 독립 빈도 버퍼와 명시적 tail 처리를 사용하는 계수 정렬입니다.
/// </summary>
/// <remarks>
/// byte 값의 범위는 256개뿐이므로 count와 출력은 <c>O(n + k)</c>로 표현할 수 있습니다.
/// 네 버퍼는 반복 중 동일 count slot에 이어서 쓰는 의존성을 줄이기 위한 형태입니다.
/// 대신 count 배열을 더 초기화하고 마지막에 병합해야 하므로, 입력 크기와 메모리
/// 대역폭·store port 상황에 따라 이득과 비용이 달라집니다.
/// </remarks>
public sealed class FourWayCountingSortByteArraySorter : IByteArraySorter
{
    /// <summary>네 개의 빈도 버퍼를 쓰는 변형을 식별하는 이름입니다.</summary>
    public string Name => "Counting (4-way)";

    /// <summary>입력을 네 갈래로 세고 병합해 제자리 오름차순 정렬합니다.</summary>
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
        counts0.Clear();
        counts1.Clear();
        counts2.Clear();
        counts3.Clear();

        var blockLength = values.Length - (values.Length % 4);
        var index = 0;
        // 같은 버킷으로의 연속 쓰기 대신 각 lane의 독립 count를 갱신합니다.
        for (; index < blockLength; index += 4)
        {
            counts0[values[index]]++;
            counts1[values[index + 1]]++;
            counts2[values[index + 2]]++;
            counts3[values[index + 3]]++;
        }

        for (; index < values.Length; index++)
        {
            counts0[values[index]]++;
        }

        // 병합 비용은 고정된 256개 count slot에 비례합니다.
        for (var value = 0; value < 256; value++)
        {
            counts0[value] += counts1[value] + counts2[value] + counts3[value];
        }

        CountingSortWriter.WriteSorted(values, counts0);
    }
}
