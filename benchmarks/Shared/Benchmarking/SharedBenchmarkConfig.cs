using BenchmarkDotNet.Configs;

namespace SSW.Benchmarks.Shared.Benchmarking;

/// <summary>
/// 모든 재구성 벤치마크가 공유하는 BenchmarkDotNet 설정입니다.
/// 실행 위치와 관계없이 상위 <c>Directory.Build.props</c>를 찾아
/// 결과를 <c>benchmarks/artifacts/BenchmarkDotNet</c> 아래에 모읍니다.
/// </summary>
public sealed class SharedBenchmarkConfig : ManualConfig
{
    public SharedBenchmarkConfig()
    {
        WithArtifactsPath(Path.Combine(FindBenchmarksDirectory(), "artifacts", "BenchmarkDotNet"));
    }

    private static string FindBenchmarksDirectory()
    {
        for (var directory = new DirectoryInfo(AppContext.BaseDirectory); directory is not null; directory = directory.Parent)
        {
            if (File.Exists(Path.Combine(directory.FullName, "Directory.Build.props")))
            {
                return directory.FullName;
            }
        }

        throw new DirectoryNotFoundException("benchmarks/Directory.Build.props를 찾을 수 없습니다.");
    }
}
