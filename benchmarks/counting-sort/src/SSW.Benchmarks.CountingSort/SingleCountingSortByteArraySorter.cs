namespace SSW.Benchmarks.CountingSort;

/// <summary>
/// 256개 빈도 버퍼 하나를 사용하는 기본 계수 정렬입니다.
/// </summary>
/// <remarks>
/// byte는 가능한 값이 256개로 고정되어 있어 count와 출력의 합이 <c>O(n + k)</c>가 됩니다.
/// 값 범위 <c>k</c>가 입력 길이에 비해 충분히 작을 때 비교 정렬과 다른 비용 구조를
/// 관찰하기 좋습니다. 반대로 값 범위가 커지면 count 저장 공간과 초기화 비용이 커져
/// 이 전제가 약해집니다.
/// </remarks>
public sealed class SingleCountingSortByteArraySorter : IByteArraySorter
{
    /// <summary>단일 빈도 버퍼 변형을 식별하는 이름입니다.</summary>
    public string Name => "Counting (single buffer)";

    /// <summary>단일 빈도 배열을 채운 뒤 정렬된 출력으로 다시 기록합니다.</summary>
    public void Sort(byte[] values)
    {
        ArgumentNullException.ThrowIfNull(values);
        if (values.Length < 2)
        {
            return;
        }

        Span<int> counts = stackalloc int[256];
        counts.Clear();

        // 입력을 한 번 세는 단계가 O(n)이고, 출력은 CountingSortWriter가 담당합니다.
        foreach (var value in values)
        {
            counts[value]++;
        }

        CountingSortWriter.WriteSorted(values, counts);
    }
}
