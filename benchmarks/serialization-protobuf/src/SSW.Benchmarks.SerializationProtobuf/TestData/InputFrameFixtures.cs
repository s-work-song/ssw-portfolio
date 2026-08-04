using SSW.Benchmarks.SerializationProtobuf.Models;

namespace SSW.Benchmarks.SerializationProtobuf.TestData;

/// <summary>정확성, 크기 비교, 속도 측정이 공유하는 공개 가능한 고정 입력입니다.</summary>
public static class InputFrameFixtures
{
    public static InputFrame CreateDefaults() => new();

    public static InputFrame CreateStandard() => new()
    {
        X = 120,
        Y = -45,
        Buttons = 0b1011,
        ScrollDelta = -3,
        Tick = 42,
        Email = "fixture@example.invalid",
    };

    public static InputFrame CreateTextHeavy() => new()
    {
        X = 120,
        Y = -45,
        Buttons = 0b1011,
        ScrollDelta = -3,
        Tick = 42,
        Email = $"{new string('a', 240)}@example.invalid",
    };

    public static IReadOnlyList<(string Name, InputFrame Frame)> CreatePayloadSizeScenarios() =>
    [
        ("Defaults", CreateDefaults()),
        ("Standard", CreateStandard()),
        ("Text-256", CreateTextHeavy()),
    ];
}
