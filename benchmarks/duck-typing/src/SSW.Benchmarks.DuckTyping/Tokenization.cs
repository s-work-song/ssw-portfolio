using System.Collections;

namespace SSW.Benchmarks.DuckTyping;

/// <summary>
/// 토큰 분할의 입력·출력 계약을 한 곳에 둔다.
/// 빈 입력은 토큰이 없는 것으로 처리하고, 그 외 입력의 빈 토큰은 보존한다.
/// 따라서 연속 구분자와 시작·끝 구분자도 모든 구현이 같은 결과를 반환해야 한다.
/// </summary>
public static class Tokenization
{
    public const char Delimiter = '_';

    /// <summary>
    /// 비교 대상 열거자의 공통 원본 배열을 만든다.
    /// 열거 비용만 비교할 수 있도록 벤치마크의 준비 단계에서 한 번 호출한다.
    /// </summary>
    public static string[] SplitPreservingEmpty(string source)
    {
        ArgumentNullException.ThrowIfNull(source);

        return source.Length == 0
            ? Array.Empty<string>()
            : source.Split(Delimiter, StringSplitOptions.None);
    }
}

/// <summary>
/// 인터페이스 기반 열거의 계약이다.
/// 호출자는 <see cref="IEnumerable{T}"/>를 통해 열거하므로 인터페이스 디스패치 경로를 명시적으로 갖는다.
/// </summary>
public interface ITokenSequence : IEnumerable<string>
{
}

/// <summary>
/// 배열을 <see cref="IEnumerable{T}"/> 계약으로 노출하는 기준 구현이다.
/// 구현 세부를 숨기는 대신 호출부는 인터페이스 열거 경로를 사용한다.
/// </summary>
public sealed class InterfaceTokenSequence : ITokenSequence
{
    private readonly string[] _tokens;

    public InterfaceTokenSequence(string[] tokens)
    {
        ArgumentNullException.ThrowIfNull(tokens);
        _tokens = tokens;
    }

    public IEnumerator<string> GetEnumerator() => ((IEnumerable<string>)_tokens).GetEnumerator();

    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
}

/// <summary>
/// 값 형식 열거자를 <see cref="IEnumerator{T}"/>로 반환해 boxing 경로를 분리한 구현이다.
/// boxing이 항상 느리다는 결론을 전제하지 않고, 같은 입력에서 할당과 실행 시간을 관찰할 비교군으로만 사용한다.
/// </summary>
public sealed class BoxingTokenSequence : ITokenSequence
{
    private readonly string[] _tokens;

    public BoxingTokenSequence(string[] tokens)
    {
        ArgumentNullException.ThrowIfNull(tokens);
        _tokens = tokens;
    }

    public IEnumerator<string> GetEnumerator() => new BoxingTokenEnumerator(_tokens);

    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();

    private struct BoxingTokenEnumerator : IEnumerator<string>
    {
        private readonly string[] _tokens;
        private int _index;

        public BoxingTokenEnumerator(string[] tokens)
        {
            _tokens = tokens;
            _index = -1;
        }

        public string Current => _tokens[_index];

        object IEnumerator.Current => Current;

        public bool MoveNext()
        {
            var nextIndex = _index + 1;
            if (nextIndex >= _tokens.Length)
            {
                return false;
            }

            _index = nextIndex;
            return true;
        }

        public void Reset() => _index = -1;

        public void Dispose()
        {
        }
    }
}

/// <summary>
/// <c>GetEnumerator</c>/<c>MoveNext</c>/<c>Current</c> 모양만으로 foreach가 동작하는 구조적 패턴 기반 열거다.
/// 인터페이스를 구현하지 않아 호출부가 구체 값 형식 열거자를 직접 다룰 수 있다.
/// </summary>
public readonly struct PatternTokenSequence
{
    private readonly string[] _tokens;

    public PatternTokenSequence(string[] tokens)
    {
        ArgumentNullException.ThrowIfNull(tokens);
        _tokens = tokens;
    }

    public PatternTokenEnumerator GetEnumerator() => new(_tokens);
}

/// <summary>
/// 패턴 기반 시퀀스의 값 형식 열거자다.
/// IEnumerable을 구현하지 않는 것이 의도이며, 이 형식이 바로 컴파일러가 찾는 foreach 패턴이다.
/// </summary>
public struct PatternTokenEnumerator
{
    private readonly string[] _tokens;
    private int _index;

    internal PatternTokenEnumerator(string[] tokens)
    {
        _tokens = tokens;
        _index = -1;
    }

    public string Current => _tokens[_index];

    public bool MoveNext()
    {
        var nextIndex = _index + 1;
        if (nextIndex >= _tokens.Length)
        {
            return false;
        }

        _index = nextIndex;
        return true;
    }
}

/// <summary>
/// <see cref="ReadOnlySpan{T}"/>을 보관하는 ref struct 기반 패턴 열거다.
/// ref struct는 힙 할당·인터페이스 boxing으로 이스케이프할 수 없으므로, 사용 위치의 제약도 함께 보여 준다.
/// </summary>
public readonly ref struct RefPatternTokenSequence
{
    private readonly ReadOnlySpan<string> _tokens;

    public RefPatternTokenSequence(ReadOnlySpan<string> tokens)
    {
        _tokens = tokens;
    }

    public RefPatternTokenEnumerator GetEnumerator() => new(_tokens);
}

/// <summary>
/// ref struct 시퀀스에 대응하는 열거자다.
/// 배열을 새로 만들지 않고 준비된 span의 인덱스만 이동한다.
/// </summary>
public ref struct RefPatternTokenEnumerator
{
    private readonly ReadOnlySpan<string> _tokens;
    private int _index;

    internal RefPatternTokenEnumerator(ReadOnlySpan<string> tokens)
    {
        _tokens = tokens;
        _index = -1;
    }

    public string Current => _tokens[_index];

    public bool MoveNext()
    {
        var nextIndex = _index + 1;
        if (nextIndex >= _tokens.Length)
        {
            return false;
        }

        _index = nextIndex;
        return true;
    }
}

/// <summary>
/// 각 열거 경로가 실제 토큰을 끝까지 소비하도록 만드는 공통 workload다.
/// 단순 foreach 자체가 제거되지 않도록 토큰 길이를 누적해 반환한다.
/// </summary>
public static class TokenWorkload
{
    public static int ConsumeInterface(IEnumerable<string> sequence)
    {
        ArgumentNullException.ThrowIfNull(sequence);

        var totalLength = 0;
        foreach (var token in sequence)
        {
            totalLength += token.Length;
        }

        return totalLength;
    }

    public static int ConsumePattern(PatternTokenSequence sequence)
    {
        var totalLength = 0;
        foreach (var token in sequence)
        {
            totalLength += token.Length;
        }

        return totalLength;
    }

    public static int ConsumeRefPattern(RefPatternTokenSequence sequence)
    {
        var totalLength = 0;
        foreach (var token in sequence)
        {
            totalLength += token.Length;
        }

        return totalLength;
    }
}
