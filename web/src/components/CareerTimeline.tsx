/**
 * CareerItem 계약을 받아 경력·연구 항목을 여러 타임라인 배치로 표현한다.
 * 데이터 내용에는 관여하지 않고 레이아웃 선택, 모바일 강제 배치, 상세 펼침 상태만
 * 관리한다. layoutMode에 따른 렌더 분기는 동일 데이터를 교체 가능한 배치로
 * 투영하는 Strategy 패턴이며, 좁은 props 계약으로 데이터 모듈과 DIP를 유지한다.
 */
import React from 'react';
import type { CareerItem, TimelineDescription } from '@/types/career';

export default function CareerTimeline({ items }: { items: CareerItem[] }) {
  const [layoutMode, setLayoutMode] = React.useState<'right' | 'alternate' | 'center_period' | 'center_item'>('right');
  const [isMobile, setIsMobile] = React.useState(false);
  const [expandedMap, setExpandedMap] = React.useState<Record<string, boolean>>({});
  const dragStartRef = React.useRef<{ x: number; y: number } | null>(null);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 모바일에서는 가독성이 검증된 단일 축 전략을 강제하고 데스크톱에서만 선택 전략을 허용합니다.
  const activeLayout = isMobile ? 'right' : layoutMode;

  const toggleExpand = (cardIdx: number, descIdx: number) => {
    const key = `${cardIdx}_${descIdx}`;
    setExpandedMap(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = (e: React.MouseEvent, cardIdx: number, descIdx: number) => {
    if (!dragStartRef.current) return;
    const dx = Math.abs(e.clientX - dragStartRef.current.x);
    const dy = Math.abs(e.clientY - dragStartRef.current.y);
    if (dx < 5 && dy < 5) toggleExpand(cardIdx, descIdx);
    dragStartRef.current = null;
  };

  const expandPeriod = (period: string) => {
    const newMap = { ...expandedMap };
    items.forEach((item, i) => {
      if (item.period === period && Array.isArray(item.desc)) {
        (item.desc as TimelineDescription[]).forEach((d, dIdx) => {
          if (d.details && d.details.length > 0) newMap[`${i}_${dIdx}`] = true;
        });
      }
    });
    setExpandedMap(newMap);
  };

  const collapsePeriod = (period: string) => {
    const newMap = { ...expandedMap };
    items.forEach((item, i) => {
      if (item.period === period) {
        const len = Array.isArray(item.desc) ? item.desc.length : 1;
        for (let d = 0; d < len; d++) delete newMap[`${i}_${d}`];
      }
    });
    setExpandedMap(newMap);
  };

  const isPeriodAnyExpanded = (period: string) => {
    return items.some((item, i) => {
      if (item.period !== period) return false;
      const len = Array.isArray(item.desc) ? item.desc.length : 1;
      for (let d = 0; d < len; d++) {
        if (expandedMap[`${i}_${d}`]) return true;
      }
      return false;
    });
  };

  const itemGroupIndices = React.useMemo(() => {
    let gIdx = -1;
    return items.map((item, i) => {
      if (i === 0 || items[i - 1].period !== item.period) gIdx++;
      return gIdx;
    });
  }, [items]);

  // ──────────── 공통 헬퍼: 토글 버튼 렌더링 ────────────
  const renderToggleButton = (period: string, accentColor: string) => {
    const isAnyOpen = isPeriodAnyExpanded(period);
    return (
      <button
        onClick={() => isAnyOpen ? collapsePeriod(period) : expandPeriod(period)}
        style={{
          padding: '5px 12px', background: 'var(--bg-elev)', border: '1px solid var(--border)',
          borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
          color: isAnyOpen ? accentColor : 'var(--text-dim)', cursor: 'pointer',
          boxShadow: 'var(--shadow)', transition: 'all 0.15s ease',
          display: 'flex', alignItems: 'center', gap: '4px'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--bg-elev-2)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = isAnyOpen ? accentColor : 'var(--text-dim)'; e.currentTarget.style.background = 'var(--bg-elev)'; }}
      >
        <span>{isAnyOpen ? '상세 접기 ▲' : '상세 펼치기 ▼'}</span>
      </button>
    );
  };

  // ──────────── 공통 헬퍼: 기간 배지 렌더링 ────────────
  const renderPeriodBadge = (period: string, accentColor: string) => (
    <div style={{
      fontSize: '1.25rem', fontWeight: 800, color: accentColor,
      display: 'inline-flex', alignItems: 'center', padding: '5px 14px',
      background: `${accentColor}10`, borderRadius: '12px',
      border: `1px solid ${accentColor}25`, lineHeight: 1
    }}>
      {period}
    </div>
  );

  // ──────────── 공통 헬퍼: 카드 내부 설명 목록 렌더링 ────────────
  const renderDescItems = (descItems: TimelineDescription[], cardIndex: number, accentColor: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {descItems.map((descItem, dIdx) => {
        const hasDetails = descItem.details && descItem.details.length > 0;
        const isItemExpanded = !!expandedMap[`${cardIndex}_${dIdx}`];
        return (
          <div key={dIdx} style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              onMouseDown={handleMouseDown}
              onMouseUp={hasDetails ? (e) => handleMouseUp(e, cardIndex, dIdx) : undefined}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '8px',
                cursor: hasDetails ? 'pointer' : 'default', color: 'var(--text)',
                fontSize: '0.95rem', lineHeight: 1.6, fontWeight: 500, userSelect: 'text'
              }}
            >
              {hasDetails ? (
                <span style={{
                  color: accentColor, fontSize: '0.7rem',
                  transform: isItemExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.15s ease', display: 'inline-block',
                  marginTop: '3.5px', userSelect: 'none'
                }}>▼</span>
              ) : (
                <span style={{ color: 'var(--text-mute)', fontSize: '0.9rem', marginRight: '4px', userSelect: 'none' }}>•</span>
              )}
              <span style={{ color: 'var(--text-dim)' }}>{descItem.summary}</span>
            </div>
            {isItemExpanded && hasDetails && (
              <ul style={{
                margin: '6px 0 0 0', paddingLeft: '38px', display: 'flex',
                flexDirection: 'column', gap: '6px', color: 'var(--text-mute)',
                fontSize: '0.925rem', lineHeight: 1.6
              }}>
                {descItem.details!.map((bullet, idx) => (
                  <li key={idx} style={{ listStyleType: 'disc' }}>{bullet}</li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{ position: 'relative' }}>

      {/* ── 레이아웃 모드 토글 ── */}
      {!isMobile && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '28px', zIndex: 15, position: 'relative' }}>
          <div style={{
            background: 'var(--bg-elev-2, rgba(255,255,255,0.05))', padding: '3px',
            borderRadius: '10px', border: '1px solid var(--border)',
            display: 'inline-flex', gap: '2px', boxShadow: 'var(--shadow)'
          }}>
            {(['right', 'alternate', 'center_period', 'center_item'] as const).map(mode => (
              <button key={mode} onClick={() => setLayoutMode(mode)} style={{
                padding: '6px 14px', border: 'none', borderRadius: '8px',
                fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: layoutMode === mode ? 'var(--bg-elev)' : 'transparent',
                color: layoutMode === mode ? 'var(--text)' : 'var(--text-mute)',
                boxShadow: layoutMode === mode ? 'var(--shadow)' : 'none'
              }}>
                {mode === 'right' ? '한 방향' : mode === 'alternate' ? '지그재그 (연도별)' : mode === 'center_period' ? '중심선 (연도별)' : '중심선 (개별)'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 한 방향 보기: 고정 세로선 ── */}
      {activeLayout === 'right' && (
        <div style={{ position: 'absolute', left: '20px', top: '6px', bottom: '14px', width: '0', borderLeft: '2px solid var(--border)' }} />
      )}

      {/* ── 중심선 교차 보기: 고정 세로선 ── */}
      {activeLayout.startsWith('center') && (
        <div style={{ position: 'absolute', left: '50%', top: '6px', bottom: '14px', width: '0', borderLeft: '2px solid var(--border)', transform: 'translateX(-50%)', zIndex: 0 }} />
      )}

      {items.map((item, i) => {
        const showPeriodHeader = i === 0 || items[i - 1].period !== item.period;
        const accentColor = item.color || 'var(--accent, #6366f1)';

        let descItems: TimelineDescription[] = [];
        if (typeof item.desc === 'string') {
          descItems = [{ summary: item.desc, details: [] }];
        } else if (Array.isArray(item.desc)) {
          descItems = item.desc as TimelineDescription[];
        }

        const gIdx = itemGroupIndices[i];
        const isLeft = activeLayout === 'alternate' && gIdx % 2 === 1;
        const isPrevLeft = activeLayout === 'alternate' && (gIdx - 1) % 2 === 1;
        const isCenterLeft = activeLayout === 'center_item' ? i % 2 === 0 : gIdx % 2 !== 0;

        // 교차 모드에서 시작/끝 기둥선 위치 백분율 (좌/우)
        const EDGE_PERCENT = 6; // 타임라인 기둥선은 끝단에 가깝게 유지
        const CARD_SHRINK_PERCENT = 10; // 카드를 화면 중앙 쪽으로 좁히기 위한 바깥쪽 여백 (%)
        const startXCoord = isPrevLeft ? (100 - EDGE_PERCENT) * 10 : EDGE_PERCENT * 10;
        const endXCoord = isLeft ? (100 - EDGE_PERCENT) * 10 : EDGE_PERCENT * 10;
        const direction = endXCoord > 500 ? -1 : 1;
        const lineY = item.periodDesc ? 90 : 50;

        return (
          <React.Fragment key={i}>

            {/* ════════════════════════════════════════════════════════
                [첫 번째 연도 · 교차 모드 전용 헤더]
               ════════════════════════════════════════════════════════ */}
            {showPeriodHeader && activeLayout === 'alternate' && i === 0 && (
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>

                  <div style={{
                    width: '2px', height: '56px', background: 'var(--border)',
                    marginTop: '-32px', position: 'relative', zIndex: 2
                  }} />

                  <div style={{
                    position: 'relative', zIndex: 1, textAlign: 'center',
                    background: 'var(--bg)', padding: '0 24px'
                  }}>
                    {renderPeriodBadge(item.period, accentColor)}
                    {item.periodDesc && (
                      <div style={{
                        fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-mute)',
                        lineHeight: 1.5, wordBreak: 'keep-all', textAlign: 'center', marginTop: '8px'
                      }}>
                        {item.periodDesc}
                      </div>
                    )}
                  </div>

                  <div style={{ width: '2px', height: '20px', background: 'var(--border)' }} />

                  <svg
                    viewBox="0 0 1000 80"
                    style={{ width: '100%', height: '80px', display: 'block', overflow: 'visible', alignSelf: 'stretch' }}
                    preserveAspectRatio="none"
                  >
                    <path
                      d={[
                        'M 500 0',
                        `L 500 10`,
                        `Q 500 30, ${500 - 20 * direction} 30`,
                        `L ${endXCoord + 20 * direction} 30`,
                        `Q ${endXCoord} 30, ${endXCoord} 50`,
                        `L ${endXCoord} 80`
                      ].join(' ')}
                      fill="none"
                      stroke="var(--border)"
                      strokeWidth="2"
                    />
                  </svg>
                </div>

                <div style={{ position: 'absolute', right: 0, top: '28px', zIndex: 10 }}>
                  {renderToggleButton(item.period, accentColor)}
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════
                [이후 연도 헤더: 교차 보기 전용 (Z자 연결선)]
               ════════════════════════════════════════════════════════ */}
            {showPeriodHeader && activeLayout === 'alternate' && i > 0 && (
              <div style={{
                position: 'relative', width: '100%',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                height: '160px', margin: '0', paddingTop: '20px'
              }}>
                {/* 연결부의 시각적 흐름을 방해하지 않기 위해 양끝 마커 도트는 생략 */}

                <svg
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
                  viewBox="0 0 1000 160"
                  preserveAspectRatio="none"
                >
                  <path
                    d={[
                      `M ${startXCoord} 0`,
                      `L ${startXCoord} ${lineY - 20}`,
                      `Q ${startXCoord} ${lineY}, ${startXCoord > 500 ? startXCoord - 20 : startXCoord + 20} ${lineY}`,
                      `L ${endXCoord > 500 ? endXCoord - 20 : endXCoord + 20} ${lineY}`,
                      `Q ${endXCoord} ${lineY}, ${endXCoord} ${lineY + 20}`,
                      `L ${endXCoord} 160`
                    ].join(' ')}
                    fill="none" stroke="var(--border)" strokeWidth="2"
                  />
                </svg>

                <div style={{
                  position: 'relative', zIndex: 1, textAlign: 'center',
                  background: 'var(--bg)', padding: '13px 24px', borderRadius: '24px'
                }}>
                  <div style={{
                    display: 'inline-block', padding: '6px 16px',
                    borderRadius: '20px', background: 'var(--bg-elev)', border: '1px solid var(--border)',
                    color: accentColor, fontWeight: 700, fontSize: '1.25rem',
                    marginBottom: item.periodDesc ? '12px' : '0'
                  }}>
                    {item.period}
                  </div>
                  {item.periodDesc && (
                    <div style={{ color: 'var(--text-mute)', fontSize: '0.9rem', maxWidth: '600px', lineHeight: 1.6, margin: '0 auto' }}>
                      {item.periodDesc}
                    </div>
                  )}
                </div>

                {/* 토글 버튼 (가로선과 겹치지 않게 빈 공간에 배치) */}
                <div style={{
                  position: 'absolute', right: 0,
                  top: isPrevLeft ? `${lineY + 20}px` : '28px',
                  zIndex: 10
                }}>
                  {renderToggleButton(item.period, accentColor)}
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════
                [헤더: 한 방향 보기 전용]
               ════════════════════════════════════════════════════════ */}
            {showPeriodHeader && activeLayout === 'right' && (
              <div style={{
                position: 'relative',
                padding: i > 0 ? '72px 0 20px 56px' : '16px 0 20px 56px',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                textAlign: 'left',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                {/* 한 방향 보기 네온 마커 도트 */}
                <div style={{
                  position: 'absolute', left: '20px',
                  top: i > 0 ? '90px' : '34px',
                  transform: 'translate(-50%, -50%)',
                  width: '14px', height: '14px', borderRadius: '50%',
                  background: 'var(--bg)', border: '3px solid var(--accent, #6366f1)',
                  boxShadow: '0 0 14px 3px rgba(99,102,241,0.35)', zIndex: 2
                }} />

                {/* 헤더 텍스트 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  flex: '1 1 0%',
                  minWidth: '0'
                }}>
                  {renderPeriodBadge(item.period, accentColor)}
                  {item.periodDesc && (
                    <span style={{
                      fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-mute)',
                      lineHeight: 1.5, wordBreak: 'keep-all'
                    }}>
                      — {item.periodDesc}
                    </span>
                  )}
                </div>

                {/* 토글 버튼 */}
                <div style={{ zIndex: 10 }}>
                  {renderToggleButton(item.period, accentColor)}
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════
                [헤더: 중심선 교차 보기 전용]
               ════════════════════════════════════════════════════════ */}
            {showPeriodHeader && activeLayout.startsWith('center') && (
              <div style={{
                position: 'relative',
                padding: i > 0 ? '72px 0 32px 0' : '24px 0 32px 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}>
                <div style={{ zIndex: 1, background: 'var(--bg)', padding: '8px 16px', borderRadius: '24px' }}>
                  {renderPeriodBadge(item.period, accentColor)}
                </div>
                {item.periodDesc && (
                  <div style={{ zIndex: 1, background: 'var(--bg)', padding: '4px 16px', marginTop: '12px', color: 'var(--text-mute)', fontSize: '0.9rem', maxWidth: '600px', lineHeight: 1.6 }}>
                    {item.periodDesc}
                  </div>
                )}
                {/* 토글 버튼 */}
                <div style={{ position: 'absolute', right: 0, top: i > 0 ? '72px' : '24px', zIndex: 10 }}>
                  {renderToggleButton(item.period, accentColor)}
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════
                [카드 배치 컨테이너]
               ════════════════════════════════════════════════════════ */}
            <div style={{
              position: 'relative',
              padding: activeLayout === 'alternate'
                ? (isLeft 
                    ? `0 calc(${EDGE_PERCENT}% + 36px) 28px ${CARD_SHRINK_PERCENT}%` 
                    : `0 ${CARD_SHRINK_PERCENT}% 28px calc(${EDGE_PERCENT}% + 36px)`)
                : activeLayout.startsWith('center')
                  ? (isCenterLeft ? `0 calc(50% + 30px) 28px 0` : `0 0 28px calc(50% + 30px)`)
                  : '0 0 24px 56px',
              width: '100%',
              transition: 'all 0.3s ease'
            }}>

              {/* 카드 영역 세로 기둥선 */}
              {activeLayout === 'alternate' && (
                <div style={{
                  position: 'absolute',
                  left: `${isLeft ? 100 - EDGE_PERCENT : EDGE_PERCENT}%`,
                  marginLeft: '-1px', // 1px 어긋남 보정 (2px 선형의 중앙을 SVG 스트로크와 정확히 일치)
                  top: 0, bottom: 0, width: '2px',
                  background: 'var(--border)', zIndex: 0
                }} />
              )}

              {/* 중심선 교차 보기: 도트와 카드를 연결하는 짧은 가로선 */}
              {activeLayout.startsWith('center') && (
                <div style={{
                  position: 'absolute',
                  top: '26px',
                  width: '30px',
                  height: '2px',
                  background: 'var(--border)',
                  left: isCenterLeft ? 'calc(50% - 30px)' : '50%',
                  zIndex: 0
                }} />
              )}

              {/* 카드 연결 도트 */}
              <div style={{
                position: 'absolute',
                left: activeLayout === 'alternate' ? `${isLeft ? 100 - EDGE_PERCENT : EDGE_PERCENT}%` 
                      : activeLayout.startsWith('center') ? '50%' : '20px',
                top: '20px', transform: 'translateX(-50%)',
                width: '14px', height: '14px', borderRadius: '50%',
                background: 'var(--bg-elev)', border: '2px solid var(--accent, #6366f1)',
                boxShadow: '0 0 0 4px var(--bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent, #6366f1)' }} />
              </div>

              {/* 카드 */}
              <div className="hover-timeline-card" style={{
                background: 'var(--bg-elev)', border: '1px solid var(--border)',
                borderRadius: '14px', boxShadow: 'var(--shadow)',
                padding: '20px', position: 'relative', textAlign: 'left', zIndex: 2
              }}>
                {/* 제목 행 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text)', wordBreak: 'keep-all' }}>
                    {item.role}
                  </h4>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
                    background: `${accentColor}15`, color: accentColor,
                    border: `1px solid ${accentColor}20`, whiteSpace: 'nowrap'
                  }}>
                    {item.period}
                  </span>
                  {item.org && <span style={{ color: 'var(--text-mute)', fontSize: '0.95rem', fontWeight: 500 }}>{item.org}</span>}
                  {item.tags && item.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {item.tags.map(tag => (
                        <span key={tag} style={{
                          fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px',
                          background: 'var(--bg)', color: 'var(--text-dim)',
                          border: '1px solid var(--border)', whiteSpace: 'nowrap'
                        }}>{tag}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 설명 목록 */}
                {renderDescItems(descItems, i, accentColor)}
              </div>
            </div>

          </React.Fragment>
        );
      })}
    </div>
  );
}
