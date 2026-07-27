namespace SSW.Benchmarks.SerializationProtobuf.Abstractions;

/// <summary>
/// 동일한 프레임 모델을 바이트 배열로 바꾸고 복원하는 직렬화 계약입니다.
/// 형식별 구현은 이 계약을 공유하므로 비교 대상이 전송 형식이지 호출 방식이 되도록 합니다.
/// </summary>
public interface IFrameSerializer<TFrame>
{
    /// <summary>프레임을 직렬화합니다.</summary>
    byte[] Serialize(TFrame frame);

    /// <summary>직렬화된 바이트를 프레임으로 복원합니다.</summary>
    TFrame Deserialize(ReadOnlyMemory<byte> payload);
}
