using BenchmarkDotNet.Attributes;
using SSW.Benchmarks.Shared.Benchmarking;
using SSW.Benchmarks.DuckTyping;

namespace SSW.Benchmarks.DuckTyping.Benchmarks;

/// <summary>
/// 같은 토큰 배열을 각 열거 방식으로 끝까지 소비한다.
/// 분할 비용을 섞지 않기 위해 토큰화는 GlobalSetup에서 한 번만 수행한다.
/// </summary>
[MemoryDiagnoser]
[Config(typeof(SharedBenchmarkConfig))]
public class TokenEnumerationBenchmarks
{
    private string[] _tokens = Array.Empty<string>();

    [GlobalSetup]
    public void Setup()
    {
        _tokens = Tokenization.SplitPreservingEmpty("alpha_bravo__charlie_delta_");
    }

    [Benchmark(Baseline = true)]
    public int InterfaceEnumeration() => TokenWorkload.ConsumeInterface(new InterfaceTokenSequence(_tokens));

    [Benchmark]
    public int BoxingEnumeration() => TokenWorkload.ConsumeInterface(new BoxingTokenSequence(_tokens));

    [Benchmark]
    public int PatternStructEnumeration() => TokenWorkload.ConsumePattern(new PatternTokenSequence(_tokens));

    [Benchmark]
    public int RefPatternEnumeration() => TokenWorkload.ConsumeRefPattern(new RefPatternTokenSequence(_tokens));
}
