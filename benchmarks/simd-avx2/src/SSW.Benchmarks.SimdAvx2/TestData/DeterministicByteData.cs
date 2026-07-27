namespace SSW.Benchmarks.SimdAvx2.TestData;

/// <summary>
/// 벤치마크와 테스트가 같은 입력 분포를 반복 사용하도록 고정 시드 데이터를 만듭니다.
/// 실행 중 난수를 다시 만들면 구현 차이 대신 데이터 차이가 결과에 섞일 수 있습니다.
/// </summary>
public static class DeterministicByteData
{
    /// <summary>지정 길이와 시드로 재현 가능한 바이트 배열을 만듭니다.</summary>
    public static byte[] Create(int length, int seed = 20260727)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(length);
        byte[] data = new byte[length];
        new Random(seed).NextBytes(data);
        return data;
    }
}
