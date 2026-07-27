using BenchmarkDotNet.Running;

namespace SSW.Benchmarks.SimdAvx2.Benchmarks;

/// <summary>명령줄 인자를 그대로 BenchmarkDotNet에 전달하는 진입점입니다.</summary>
public static class Program
{
    /// <summary>예: --list flat으로 등록된 벤치마크만 확인할 수 있습니다.</summary>
    public static void Main(string[] args) => BenchmarkSwitcher.FromAssembly(typeof(Program).Assembly).Run(args);
}
