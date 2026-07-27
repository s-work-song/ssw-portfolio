using SSW.Benchmarks.DuckTyping;

namespace SSW.Benchmarks.DuckTyping.Tests;

/// <summary>
/// 열거 방식이 달라도 토큰화 계약과 소비 결과가 같음을 검증한다.
/// 성능 수치가 아니라 기능적 동등성을 벤치마크의 선행 조건으로 둔다.
/// </summary>
public class TokenSequenceTests
{
    public static TheoryData<string, string[]> TokenCases => new()
    {
        { string.Empty, Array.Empty<string>() },
        { "single", new[] { "single" } },
        { "left_right", new[] { "left", "right" } },
        { "left__right", new[] { "left", string.Empty, "right" } },
        { "_edge_", new[] { string.Empty, "edge", string.Empty } },
    };

    [Theory]
    [MemberData(nameof(TokenCases))]
    public void All_sequences_preserve_the_same_tokens(string source, string[] expected)
    {
        var tokens = Tokenization.SplitPreservingEmpty(source);

        Assert.Equal(expected, Collect(new InterfaceTokenSequence(tokens)));
        Assert.Equal(expected, Collect(new BoxingTokenSequence(tokens)));
        Assert.Equal(expected, Collect(new PatternTokenSequence(tokens)));
        Assert.Equal(expected, Collect(new RefPatternTokenSequence(tokens)));
    }

    [Theory]
    [MemberData(nameof(TokenCases))]
    public void All_workloads_consume_the_same_total_token_length(string source, string[] expected)
    {
        var tokens = Tokenization.SplitPreservingEmpty(source);
        var expectedLength = expected.Sum(static token => token.Length);

        Assert.Equal(expectedLength, TokenWorkload.ConsumeInterface(new InterfaceTokenSequence(tokens)));
        Assert.Equal(expectedLength, TokenWorkload.ConsumeInterface(new BoxingTokenSequence(tokens)));
        Assert.Equal(expectedLength, TokenWorkload.ConsumePattern(new PatternTokenSequence(tokens)));
        Assert.Equal(expectedLength, TokenWorkload.ConsumeRefPattern(new RefPatternTokenSequence(tokens)));
    }

    private static string[] Collect(InterfaceTokenSequence sequence) => sequence.ToArray();

    private static string[] Collect(BoxingTokenSequence sequence) => sequence.ToArray();

    private static string[] Collect(PatternTokenSequence sequence)
    {
        var result = new List<string>();
        foreach (var token in sequence)
        {
            result.Add(token);
        }

        return result.ToArray();
    }

    private static string[] Collect(RefPatternTokenSequence sequence)
    {
        var result = new List<string>();
        foreach (var token in sequence)
        {
            result.Add(token);
        }

        return result.ToArray();
    }
}
