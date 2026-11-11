import React, { useState } from 'react';

interface BarData {
  label: string;
  value: number;
}

interface SimpleBarChartProps {
  data: BarData[];
  color?: string;
  height?: number;
  valueSuffix?: string;
}

export function SimpleBarChart({
  data,
  color = 'var(--accent-green)',
  height = 140,
  valueSuffix = '',
}: SimpleBarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
        Sem dados para exibir
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      <div
        style={{
          height: `${height}px`,
          display: 'flex',
          alignItems: 'flex-end',
          gap: '6px',
          paddingBottom: '4px',
          borderBottom: '1px solid var(--border-subtle)',
          position: 'relative',
        }}
      >
        {data.map((item, idx) => {
          const pct = Math.max(4, Math.round((item.value / maxValue) * 100));
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                flex: 1,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                alignItems: 'center',
                position: 'relative',
                cursor: 'pointer',
              }}
            >
              {/* Tooltip */}
              {isHovered && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-32px',
                    background: 'rgba(0, 0, 0, 0.85)',
                    border: '1px solid var(--border-subtle)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                    pointerEvents: 'none',
                  }}
                >
                  {item.label}: {item.value.toLocaleString('pt-BR')}{valueSuffix}
                </div>
              )}

              <div
                style={{
                  width: '100%',
                  height: `${pct}%`,
                  background: isHovered ? '#fff' : color,
                  borderRadius: '4px 4px 0 0',
                  transition: 'all 0.2s ease',
                  opacity: isHovered ? 1 : 0.85,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-dim)' }}>
        {data.map((item, idx) => {
          // If many items, only show a subset
          const showLabel = data.length <= 14 || idx % 2 === 0 || idx === data.length - 1;
          return (
            <span key={idx} style={{ flex: 1, textAlign: 'center', opacity: showLabel ? 1 : 0 }}>
              {item.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
