import React, { useState } from 'react';

interface LinePoint {
  label: string;
  value: number;
}

interface SimpleLineChartProps {
  data: LinePoint[];
  strokeColor?: string;
  fillColor?: string;
  height?: number;
  valueSuffix?: string;
}

export function SimpleLineChart({
  data,
  strokeColor = '#06B6D4',
  fillColor = 'rgba(6, 182, 212, 0.15)',
  height = 140,
  valueSuffix = '',
}: SimpleLineChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
        Sem dados para exibir
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const width = 500;
  const paddingX = 20;
  const paddingY = 16;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const points = data.map((d, idx) => {
    const x = paddingX + (idx / Math.max(1, data.length - 1)) * chartWidth;
    const y = height - paddingY - (d.value / maxValue) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', position: 'relative' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: `${height}px`, overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={`grad-${strokeColor.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
        <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
        <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="rgba(255,255,255,0.1)" />

        {/* Fill Area */}
        <path d={areaD} fill={`url(#grad-${strokeColor.replace(/[^a-zA-Z0-9]/g, '')})`} />

        {/* Stroke Line */}
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Interactive Points */}
        {points.map((pt, idx) => (
          <g key={idx}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r={hoveredIdx === idx ? 5 : 3}
              fill={hoveredIdx === idx ? '#fff' : strokeColor}
              stroke="#0f172a"
              strokeWidth="2"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
            />
          </g>
        ))}
      </svg>

      {/* Hover Info */}
      {hoveredIdx !== null && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '12px',
            background: 'rgba(0, 0, 0, 0.85)',
            border: '1px solid var(--border-subtle)',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.72rem',
            color: '#fff',
            display: 'flex',
            gap: '6px',
          }}
        >
          <span style={{ color: 'var(--text-dim)' }}>{points[hoveredIdx].label}:</span>
          <strong style={{ color: strokeColor }}>
            {points[hoveredIdx].value.toLocaleString('pt-BR')}{valueSuffix}
          </strong>
        </div>
      )}

      {/* Axis Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-dim)', padding: `0 ${paddingX}px` }}>
        {data.map((item, idx) => {
          const showLabel = data.length <= 14 || idx % 2 === 0 || idx === data.length - 1;
          return (
            <span key={idx} style={{ opacity: showLabel ? 1 : 0 }}>
              {item.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
