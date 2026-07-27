using BenchmarkDotNet.Running;
using SSW.Benchmarks.CountingSort.Benchmarks;

BenchmarkSwitcher
    .FromAssembly(typeof(CountingSortBenchmarks).Assembly)
    .Run(args);
