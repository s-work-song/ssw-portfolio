using BenchmarkDotNet.Attributes;
using SSW.Benchmarks.Shared.Benchmarking;
using SSW.Benchmarks.StronglyTypedValues;

namespace SSW.Benchmarks.StronglyTypedValues.Benchmarks;

/// <summary>
/// 준비 단계에서 같은 의미의 주문을 만들고, 측정에서는 금액 계산만 수행한다.
/// 결과의 우열은 이 클래스가 아니라 실제 BenchmarkDotNet 실행 결과로만 판단한다.
/// </summary>
[MemoryDiagnoser]
[Config(typeof(SharedBenchmarkConfig))]
public class OrderValueBenchmarks
{
    private PrimitiveOrder _primitiveOrder;
    private StronglyTypedOrder _stronglyTypedOrder;
    private ClassWrappedOrder _classWrappedOrder = null!;

    [GlobalSetup]
    public void Setup()
    {
        _primitiveOrder = new PrimitiveOrder(ProductId: 7, UnitPrice: 120, Quantity: 3);
        _stronglyTypedOrder = new StronglyTypedOrder(ProductId.Create(7), UnitPrice.Create(120), Quantity.Create(3));
        _classWrappedOrder = new ClassWrappedOrder(
            ClassProductId.Create(7),
            ClassUnitPrice.Create(120),
            ClassQuantity.Create(3));
    }

    [Benchmark(Baseline = true)]
    public int PrimitiveBaseline() => _primitiveOrder.CalculateTotal();

    [Benchmark]
    public int ReadonlyRecordStructValues() => _stronglyTypedOrder.CalculateTotal();

    [Benchmark]
    public int ClassWrapperValues() => _classWrappedOrder.CalculateTotal();
}
