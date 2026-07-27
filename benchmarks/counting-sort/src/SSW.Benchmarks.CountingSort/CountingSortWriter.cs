namespace SSW.Benchmarks.CountingSort;

/// <summary>
/// 값별 빈도(count)를 정렬된 바이트 배열로 다시 펼쳐 쓰는 계수 정렬의 출력 단계입니다.
/// </summary>
/// <remarks>
/// 빈도 배열을 낮은 값부터 순회하면 각 값이 연속 구간 하나를 차지합니다.
/// <see cref="Span{T}.Fill(T)"/>은 그 구간에 같은 값을 연속으로 기록하는 의도를
/// 직접 나타내므로 원소별 대입보다 출력 단계를 읽기 쉽습니다. 빈도 수의 합은 입력
/// 길이이므로 이 단계는 출력 <c>O(n)</c>, 빈도 순회까지 포함하면 전체 알고리즘은
/// <c>O(n + k)</c>입니다.
/// </remarks>
internal static class CountingSortWriter
{
    /// <summary>
    /// 값별 빈도에 따라 <paramref name="values"/>를 제자리 정렬된 출력으로 채웁니다.
    /// </summary>
    /// <param name="values">정렬 결과를 기록할 바이트 배열입니다.</param>
    /// <param name="counts">바이트 값 순서에 대응하는 빈도 배열입니다.</param>
    public static void WriteSorted(byte[] values, ReadOnlySpan<int> counts)
    {
        var offset = 0;

        for (var value = 0; value < counts.Length; value++)
        {
            var count = counts[value];
            if (count == 0)
            {
                continue;
            }

            // 같은 값이 차지하는 연속 구간을 한 번에 기록합니다.
            values.AsSpan(offset, count).Fill((byte)value);
            offset += count;
        }
    }
}
