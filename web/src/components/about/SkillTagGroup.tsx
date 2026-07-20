/**
 * 이력서 기술 분류의 제목과 태그 목록을 동일한 시각 규칙으로 렌더링한다.
 * 문자열 제목과 기술 배열만 받는 작은 props 계약을 노출해 다른 카드 구조나
 * 이력서 데이터 구현에 불필요하게 결합하지 않는다(ISP·DIP).
 */
export default function SkillTagGroup({
  title,
  skills,
}: {
  title: string;
  skills: string[];
}) {
  return (
    <div>
      <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--accent, #6366f1)', margin: '0 0 10px' }}>{title}</h4>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {skills.map((skill) => (
          <span key={skill} style={{ fontSize: '12px', fontWeight: 600, padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-elev-2)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}
