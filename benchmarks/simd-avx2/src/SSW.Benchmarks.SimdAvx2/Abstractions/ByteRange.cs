namespace SSW.Benchmarks.SimdAvx2.Abstractions;

/// <summary>
/// 바이트 배열에서 합산할 닫힌 범위를 나타냅니다.
/// 바이트 하나의 최대값과 배열 길이의 최대값을 곱해도 long 범위 안에 있으므로,
/// 이 실험의 모든 구현은 long 누적값을 공통 결과 형식으로 사용합니다.
/// </summary>
public readonly record struct ByteRange(byte Minimum, byte Maximum)
{
    /// <summary>범위의 순서가 유효한지 확인합니다.</summary>
    public void EnsureValid()
    {
        if (Minimum > Maximum)
        {
            throw new ArgumentOutOfRangeException(nameof(Maximum), "최솟값은 최댓값보다 클 수 없습니다.");
        }
    }
}
