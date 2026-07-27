using BenchmarkDotNet.Running;

namespace SSW.Benchmarks.StronglyTypedValues.Benchmarks;

/// <summary>
/// primitive·readonly record struct·class wrapper의 동일 도메인 연산을 호출하는 진입점이다.
/// Console 출력이나 임시 문자열 처리는 측정 대상에 넣지 않는다.
/// </summary>
public static class Program
{
    /// <summary>
    /// --list flat 같은 BenchmarkDotNet 인자를 보존합니다.
    /// 목록 조회가 실제 측정을 시작하지 않도록 switcher가 인자를 직접 처리합니다.
    /// </summary>
    public static void Main(string[] args) => BenchmarkSwitcher.FromAssembly(typeof(Program).Assembly).Run(args);
}
