namespace SSW.Benchmarks.StronglyTypedValues;

/// <summary>
/// 원시 정수만으로 주문 금액을 계산하는 기준선이다.
/// 값의 의미는 호출자가 기억해야 하므로 상품 식별자와 수량을 같은 int로 넘겨도 컴파일러가 구분하지 못한다.
/// </summary>
public readonly record struct PrimitiveOrder(int ProductId, int UnitPrice, int Quantity)
{
    public int CalculateTotal() => checked(UnitPrice * Quantity);
}

/// <summary>
/// 상품 식별자를 정수와 분리하는 값 객체다.
/// 생성 지점에서 유효 범위를 확인하고 이후에는 불변 값으로 전달한다.
/// </summary>
public readonly record struct ProductId
{
    public int Value { get; }

    private ProductId(int value) => Value = value;

    public static ProductId Create(int value)
    {
        if (value <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(value), "상품 식별자는 양수여야 합니다.");
        }

        return new ProductId(value);
    }

    public int ToPrimitive() => Value;
}

/// <summary>
/// 단가를 정수와 분리하는 값 객체다.
/// 금액 단위는 이 실험에서 정수 단위로 고정하며, 통화·반올림 정책은 범위 밖이다.
/// </summary>
public readonly record struct UnitPrice
{
    public int Value { get; }

    private UnitPrice(int value) => Value = value;

    public static UnitPrice Create(int value)
    {
        if (value < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(value), "단가는 음수일 수 없습니다.");
        }

        return new UnitPrice(value);
    }

    public int ToPrimitive() => Value;
}

/// <summary>
/// 수량을 정수와 분리하는 값 객체다.
/// ProductId나 UnitPrice와 암묵 변환되지 않으므로 호출 경계에서 의미 혼용을 줄인다.
/// </summary>
public readonly record struct Quantity
{
    public int Value { get; }

    private Quantity(int value) => Value = value;

    public static Quantity Create(int value)
    {
        if (value < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(value), "수량은 음수일 수 없습니다.");
        }

        return new Quantity(value);
    }

    public int ToPrimitive() => Value;
}

/// <summary>
/// readonly record struct 값 객체만 받는 주문이다.
/// 생성자 서명이 도메인 의미를 드러내므로 ProductId 자리에 Quantity를 전달하는 코드는 컴파일되지 않는다.
/// </summary>
public readonly record struct StronglyTypedOrder(ProductId ProductId, UnitPrice UnitPrice, Quantity Quantity)
{
    public int CalculateTotal() => checked(UnitPrice.Value * Quantity.Value);
}

/// <summary>
/// 참조 형식 wrapper 비교군이다.
/// 값 객체의 의미와 유효성 검사는 유지하되, 객체 참조·힙 할당을 사용하는 설계와 동일 도메인 연산을 비교한다.
/// </summary>
public sealed class ClassProductId : IEquatable<ClassProductId>
{
    public int Value { get; }

    private ClassProductId(int value) => Value = value;

    public static ClassProductId Create(int value)
    {
        if (value <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(value), "상품 식별자는 양수여야 합니다.");
        }

        return new ClassProductId(value);
    }

    public bool Equals(ClassProductId? other) => other is not null && Value == other.Value;

    public override bool Equals(object? obj) => obj is ClassProductId other && Equals(other);

    public override int GetHashCode() => Value;
}

/// <summary>
/// 참조 형식 단가 wrapper다.
/// </summary>
public sealed class ClassUnitPrice : IEquatable<ClassUnitPrice>
{
    public int Value { get; }

    private ClassUnitPrice(int value) => Value = value;

    public static ClassUnitPrice Create(int value)
    {
        if (value < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(value), "단가는 음수일 수 없습니다.");
        }

        return new ClassUnitPrice(value);
    }

    public bool Equals(ClassUnitPrice? other) => other is not null && Value == other.Value;

    public override bool Equals(object? obj) => obj is ClassUnitPrice other && Equals(other);

    public override int GetHashCode() => Value;
}

/// <summary>
/// 참조 형식 수량 wrapper다.
/// </summary>
public sealed class ClassQuantity : IEquatable<ClassQuantity>
{
    public int Value { get; }

    private ClassQuantity(int value) => Value = value;

    public static ClassQuantity Create(int value)
    {
        if (value < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(value), "수량은 음수일 수 없습니다.");
        }

        return new ClassQuantity(value);
    }

    public bool Equals(ClassQuantity? other) => other is not null && Value == other.Value;

    public override bool Equals(object? obj) => obj is ClassQuantity other && Equals(other);

    public override int GetHashCode() => Value;
}

/// <summary>
/// class wrapper만 받는 주문 비교군이다.
/// 동일한 금액 계산을 수행해 primitive·struct·class 경로를 같은 도메인 연산으로 맞춘다.
/// </summary>
public sealed class ClassWrappedOrder
{
    public ClassWrappedOrder(ClassProductId productId, ClassUnitPrice unitPrice, ClassQuantity quantity)
    {
        ProductId = productId ?? throw new ArgumentNullException(nameof(productId));
        UnitPrice = unitPrice ?? throw new ArgumentNullException(nameof(unitPrice));
        Quantity = quantity ?? throw new ArgumentNullException(nameof(quantity));
    }

    public ClassProductId ProductId { get; }

    public ClassUnitPrice UnitPrice { get; }

    public ClassQuantity Quantity { get; }

    public int CalculateTotal() => checked(UnitPrice.Value * Quantity.Value);
}
