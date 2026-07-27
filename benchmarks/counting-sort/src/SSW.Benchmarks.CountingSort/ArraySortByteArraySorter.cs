namespace SSW.Benchmarks.CountingSort;

/// <summary>
/// 비교 정렬 기준선으로 사용하는 BCL 배열 정렬 구현입니다.
/// </summary>
/// <remarks>
/// 계수 정렬은 값의 범위가 충분히 작을 때 입력을 세는 방식으로 <c>O(n + k)</c>에
/// 정렬할 수 있습니다. 반면 이 구현은 일반적인 비교 정렬을 대표하므로, 값 범위가
/// 작다는 전제를 쓰지 않는 기준선으로 둡니다. 여기서 <c>n</c>은 입력 길이,
/// <c>k</c>는 가능한 값의 개수입니다.
/// </remarks>
public sealed class ArraySortByteArraySorter : IByteArraySorter
{
    /// <summary>결과 표에서 비교 정렬 기준선을 식별하는 이름입니다.</summary>
    public string Name => "Array.Sort";

    /// <summary>지정한 바이트 배열을 BCL 비교 정렬로 제자리 오름차순 정렬합니다.</summary>
    public void Sort(byte[] values)
    {
        ArgumentNullException.ThrowIfNull(values);
        Array.Sort(values);
    }
}
