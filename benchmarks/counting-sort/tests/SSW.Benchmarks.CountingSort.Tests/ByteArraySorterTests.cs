using SSW.Benchmarks.CountingSort;

namespace SSW.Benchmarks.CountingSort.Tests;

public sealed class ByteArraySorterTests
{
    [Fact]
    public void EveryImplementationMatchesArraySortForBoundaryAndRandomInputs()
    {
        foreach (var testCase in CreateCases())
        {
            var expected = testCase.Input.ToArray();
            Array.Sort(expected);

            foreach (var sorter in CreateSorters())
            {
                var actual = testCase.Input.ToArray();

                sorter.Sort(actual);

                Assert.Equal(expected, actual);
            }
        }
    }

    private static IEnumerable<(string Name, byte[] Input)> CreateCases()
    {
        yield return ("empty", []);
        yield return ("single", [42]);
        yield return ("repeated", [7, 7, 7, 7, 7, 7]);
        yield return ("byte-boundaries", [255, 0, 255, 0, 1, 254]);
        yield return ("length-three", [9, 3, 8]);
        yield return ("length-five", [5, 4, 3, 2, 1]);
        yield return ("length-nine", [9, 0, 8, 1, 7, 2, 6, 3, 5]);
        yield return ("deterministic-random-length-257", CreateDeterministicRandomBytes(257));
    }

    private static IEnumerable<IByteArraySorter> CreateSorters()
    {
        yield return new ArraySortByteArraySorter();
        yield return new SingleCountingSortByteArraySorter();
        yield return new TwoWayCountingSortByteArraySorter();
        yield return new FourWayCountingSortByteArraySorter();
        yield return new EightWayCountingSortByteArraySorter();
        yield return new ParallelCountingSortByteArraySorter();
    }

    private static byte[] CreateDeterministicRandomBytes(int length)
    {
        var random = new Random(20260727);
        var values = new byte[length];
        random.NextBytes(values);
        return values;
    }
}
