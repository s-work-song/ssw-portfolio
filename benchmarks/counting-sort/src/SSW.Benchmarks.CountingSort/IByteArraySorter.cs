namespace SSW.Benchmarks.CountingSort;

/// <summary>
/// 바이트 배열을 제자리 오름차순 정렬하는 구현의 공통 계약입니다.
/// </summary>
/// <remarks>
/// 구현마다 비교 정렬, 단일 계수 배열, 분할 계수 배열, 병렬 병합처럼 내부 전략은
/// 달라도 동일 입력과 출력 계약을 공유해야 교육용 비교가 가능합니다.
/// </remarks>
public interface IByteArraySorter
{
    /// <summary>벤치마크와 결과 표에서 구현을 식별하는 표시 이름입니다.</summary>
    string Name { get; }

    /// <summary>지정한 배열을 같은 배열 안에서 오름차순으로 정렬합니다.</summary>
    /// <param name="values">정렬할 바이트 배열입니다.</param>
    void Sort(byte[] values);
}
