using BenchmarkDotNet.Running;
using SSW.Benchmarks.SerializationProtobuf.Analysis;
using SSW.Benchmarks.SerializationProtobuf.TestData;

namespace SSW.Benchmarks.SerializationProtobuf.Benchmarks;

/// <summary>명령줄 인자를 그대로 BenchmarkDotNet에 전달하는 진입점입니다.</summary>
public static class Program
{
    /// <summary>예: --list flat으로 등록된 벤치마크만 확인할 수 있습니다.</summary>
    public static void Main(string[] args)
    {
        bool sizeOnly = args.Contains("--size-only", StringComparer.OrdinalIgnoreCase);
        bool listOnly = args.Contains("--list", StringComparer.OrdinalIgnoreCase);

        if (!listOnly)
        {
            WritePayloadSizeReport();
        }

        if (!sizeOnly)
        {
            BenchmarkSwitcher.FromAssembly(typeof(Program).Assembly).Run(args);
        }
    }

    private static void WritePayloadSizeReport()
    {
        Console.WriteLine("Serialized payload size (UTF-8 JSON vs protobuf)");
        Console.WriteLine("| Scenario | JSON (B) | Protobuf (B) | Saved (B) | Reduction | ");
        Console.WriteLine("| --- | ---: | ---: | ---: | ---: |");

        foreach ((string name, var frame) in InputFrameFixtures.CreatePayloadSizeScenarios())
        {
            FramePayloadSizeComparison result = FramePayloadSizeAnalyzer.Compare(name, frame);
            Console.WriteLine(
                $"| {result.Scenario} | {result.JsonBytes} | {result.ProtobufBytes} | " +
                $"{result.SavedBytes} | {result.ReductionPercent:F1}% |");
        }

        Console.WriteLine();
    }
}
