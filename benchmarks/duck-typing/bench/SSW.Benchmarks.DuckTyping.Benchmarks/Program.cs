using BenchmarkDotNet.Running;

namespace SSW.Benchmarks.DuckTyping.Benchmarks;

/// <summary>
/// 실제 비교 구현을 호출하는 BenchmarkDotNet 진입점이다.
/// Console 출력은 측정 대상에 포함하지 않는다.
/// </summary>
public static class Program
{
    /// <summary>
    /// --list flat 같은 BenchmarkDotNet 인자를 보존합니다.
    /// 목록 확인과 실제 측정을 구분하려면 고정 BenchmarkRunner 호출이 아니라
    /// 명령줄 인자를 받는 switcher 진입점을 사용해야 합니다.
    /// </summary>
    public static void Main(string[] args) => BenchmarkSwitcher.FromAssembly(typeof(Program).Assembly).Run(args);
}
