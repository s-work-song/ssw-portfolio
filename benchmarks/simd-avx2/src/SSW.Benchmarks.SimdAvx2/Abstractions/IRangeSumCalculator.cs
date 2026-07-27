namespace SSW.Benchmarks.SimdAvx2.Abstractions;

/// <summary>
/// 연속 바이트 버퍼에서 지정 범위에 속하는 값만 합산하는 공통 계약입니다.
/// ReadOnlyMemory를 사용해 병렬 구현도 복사 없이 안전하게 구간을 나눌 수 있습니다.
/// </summary>
public interface IRangeSumCalculator
{
    /// <summary>범위 조건을 만족하는 바이트의 합계를 반환합니다.</summary>
    long Sum(ReadOnlyMemory<byte> source, ByteRange range);
}
