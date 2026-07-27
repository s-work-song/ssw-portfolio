using System.Reflection;
using SSW.Benchmarks.StronglyTypedValues;

namespace SSW.Benchmarks.StronglyTypedValues.Tests;

/// <summary>
/// 값 객체의 의미 보존과 primitive 기준선의 동일 계산 결과를 검증한다.
/// 컴파일 실패 자체를 테스트할 수는 없으므로 공개 생성자의 정확한 매개변수 타입도 함께 확인한다.
/// </summary>
public class OrderValuesTests
{
    [Fact]
    public void All_order_representations_calculate_the_same_total()
    {
        var primitive = new PrimitiveOrder(ProductId: 7, UnitPrice: 120, Quantity: 3);
        var stronglyTyped = new StronglyTypedOrder(ProductId.Create(7), UnitPrice.Create(120), Quantity.Create(3));
        var classWrapped = new ClassWrappedOrder(
            ClassProductId.Create(7),
            ClassUnitPrice.Create(120),
            ClassQuantity.Create(3));

        Assert.Equal(primitive.CalculateTotal(), stronglyTyped.CalculateTotal());
        Assert.Equal(primitive.CalculateTotal(), classWrapped.CalculateTotal());
    }

    [Fact]
    public void Record_struct_values_have_value_equality_and_explicit_primitive_boundary()
    {
        var first = ProductId.Create(7);
        var second = ProductId.Create(7);

        Assert.Equal(first, second);
        Assert.Equal(7, first.ToPrimitive());
        Assert.NotEqual(typeof(ProductId), typeof(Quantity));
    }

    [Fact]
    public void Class_wrappers_have_value_equality()
    {
        Assert.Equal(ClassProductId.Create(7), ClassProductId.Create(7));
        Assert.Equal(ClassUnitPrice.Create(120), ClassUnitPrice.Create(120));
        Assert.Equal(ClassQuantity.Create(3), ClassQuantity.Create(3));
    }

    [Fact]
    public void Strongly_typed_order_constructor_requires_distinct_domain_types()
    {
        var constructor = typeof(StronglyTypedOrder).GetConstructors(BindingFlags.Public | BindingFlags.Instance).Single();
        var parameterTypes = constructor.GetParameters().Select(static parameter => parameter.ParameterType).ToArray();

        Assert.Equal(new[] { typeof(ProductId), typeof(UnitPrice), typeof(Quantity) }, parameterTypes);
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(0)]
    public void Product_id_rejects_non_positive_values(int value)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => ProductId.Create(value));
    }

    [Theory]
    [InlineData(-1)]
    public void Unit_price_and_quantity_reject_negative_values(int value)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => UnitPrice.Create(value));
        Assert.Throws<ArgumentOutOfRangeException>(() => Quantity.Create(value));
    }
}
