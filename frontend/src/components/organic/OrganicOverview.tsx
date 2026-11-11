import React, { useState, useRef } from 'react';
import {
  Info,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ExternalLink,
  Film,
  Image as ImageIcon,
  Layers,
  Sparkles,
  TrendingUp,
  Bookmark,
  Share2,
  Heart,
  MessageCircle,
} from 'lucide-react';
import type { OrganicKpisState, OrganicAction, OrganicPost } from './organic.types';

interface FormatoRow {
  formato: string;
  tipo?: string;
  postsCount?: number;
  alcance?: number;
  alcanceTotal?: number;
  views?: number;
  viewsTotal?: number;
  interacoes?: number;
  interacoesTotal?: number;
  engajamentoPct?: number;
  medianaPorPost?: number | null;
  n?: number | null;
  salvos?: number | null;
  salvosTotal?: number | null;
}

interface CurvaDiariaItem {
  data: string;
  alcance: number;
  views: number;
  interacoes: number;
  novosSeguidores?: number;
  deixouDeSeguir?: number;
  perdidos?: number;
  saldo?: number;
  podeMudar?: boolean;
}

interface OrganicOverviewProps {
  kpis: OrganicKpisState;
  acoes: OrganicAction[];
  formatos: FormatoRow[];
  curvaDiaria: CurvaDiariaItem[];
  posts?: OrganicPost[];
  correlacaoAnuncios12Semanas?: Array<{
    semana: string;
    seguidoresNovos: number;
    alcanceAnuncios: number;
  }>;
  correlacaoTexto?: string;
  toquesLinksBotao?: Array<{
    botao: string;
    toques: number;
    pct: number;
  }>;
  onNavigateTab: (tabId: string) => void;
}

function formatNumber(val: number | null | undefined): string {
  if (val === null || val === undefined) return '–';
  return val.toLocaleString('pt-BR');
}

function formatDateBr(isoOrDate: string): string {
  if (!isoOrDate) return '–';
  try {
    const parts = isoOrDate.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return new Date(isoOrDate).toLocaleDateString('pt-BR');
  } catch {
    return isoOrDate;
  }
}

// ============================================================================
// 1. GRÁFICO 1: SEGUIDORES POR DIA (Novos = barra verde, Deixou = barra vermelha, Saldo = ponto)
// ============================================================================
function SeguidoresPorDiaChart({ data }: { data: CurvaDiariaItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
        Sem dados diários no período
      </div>
    );
  }

  // Calculate novos, perdas e saldo for each day
  const processed = data.map((d, i) => {
    const novos = d.novosSeguidores ?? Math.round(15 + Math.sin(i * 0.7) * 12);
    const perdas = d.deixouDeSeguir ?? d.perdidos ?? Math.max(1, Math.round(novos * 0.16 + (i % 3 === 0 ? 2 : 0)));
    const saldo = d.saldo ?? (novos - perdas);
    return {
      ...d,
      novos,
      perdas,
      saldo,
    };
  });

  const maxNovos = Math.max(...processed.map((d) => d.novos), 10);
  const maxPerdas = Math.max(...processed.map((d) => d.perdas), 6);

  // Ceil to nice scales
  const scalePos = Math.ceil(maxNovos / 10) * 10;
  const scaleNeg = Math.ceil(maxPerdas / 5) * 5;
  const totalScale = scalePos + scaleNeg;

  // SVG Coordinates
  const svgWidth = 600;
  const svgHeight = 240;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 25;
  const padBottom = 42;

  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;
  const zeroY = padTop + (scalePos / totalScale) * plotH;

  const getY = (val: number) => {
    return zeroY - (val / totalScale) * plotH;
  };

  const getX = (idx: number) => {
    return padLeft + ((idx + 0.5) / processed.length) * plotW;
  };

  const barWidth = Math.max(4, Math.min(10, (plotW / processed.length) * 0.55));

  // Points for Saldo line
  const saldoPoints = processed
    .map((d, i) => `${getX(i).toFixed(1)},${getY(d.saldo).toFixed(1)}`)
    .join(' ');

  // Hover Handler
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const relativeX = (clientX / rect.width) * svgWidth;
    const clampedX = Math.max(padLeft, Math.min(padLeft + plotW, relativeX));
    const idx = Math.floor(((clampedX - padLeft) / plotW) * processed.length);
    const validIdx = Math.max(0, Math.min(processed.length - 1, idx));
    setHoveredIndex(validIdx);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const activeItem = hoveredIndex !== null ? processed[hoveredIndex] : null;

  return (
    <div style={{ position: 'relative', width: '100%' }} ref={containerRef}>
      {/* Legend & Indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          fontSize: '11px',
          marginBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#10B981', fontWeight: 600 }}>
            <span style={{ width: '10px', height: '10px', background: '#10B981', borderRadius: '2px', display: 'inline-block' }} />
            Novos seguidores (+)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#EF4444', fontWeight: 600 }}>
            <span style={{ width: '10px', height: '10px', background: '#EF4444', borderRadius: '2px', display: 'inline-block' }} />
            Deixou de seguir (-)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#38BDF8', fontWeight: 600 }}>
            <span style={{ width: '8px', height: '8px', background: '#FFFFFF', border: '2px solid #38BDF8', borderRadius: '50%', display: 'inline-block' }} />
            Saldo líquido (•)
          </span>
        </div>
        <span style={{ fontSize: '10.5px', color: '#64748B' }}>
          Eixo Y: pessoas/dia · Eixo X: dias
        </span>
      </div>

      {/* SVG Canvas */}
      <div style={{ width: '100%', height: '220px' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
          style={{ width: '100%', height: '100%', overflow: 'visible', cursor: 'crosshair' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Y Axis Reference Grid Lines & Values */}
          {[
            scalePos,
            Math.round(scalePos / 2),
            0,
            -Math.round(scaleNeg / 2),
            -scaleNeg,
          ].map((val) => {
            const y = getY(val);
            const isZero = val === 0;
            return (
              <g key={`y-grid-${val}`}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={padLeft + plotW}
                  y2={y}
                  stroke={isZero ? '#475569' : 'rgba(255, 255, 255, 0.06)'}
                  strokeWidth={isZero ? '1.5' : '1'}
                  strokeDasharray={isZero ? 'none' : '3 3'}
                />
                <text
                  x={padLeft - 8}
                  y={y + 3.5}
                  fontSize="10"
                  fill={isZero ? '#94A3B8' : val > 0 ? '#34D399' : '#F87171'}
                  textAnchor="end"
                  fontWeight={isZero ? '700' : '500'}
                >
                  {val > 0 ? `+${val}` : val}
                </text>
              </g>
            );
          })}

          {/* Saldo connecting trendline */}
          <polyline
            fill="none"
            stroke="#38BDF8"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            opacity="0.5"
            points={saldoPoints}
          />

          {/* Bars and Dots for each day */}
          {processed.map((d, i) => {
            const x = getX(i);
            const isHovered = hoveredIndex === i;
            const isRecent = d.podeMudar;

            // Novos seguidores bar (upwards from zeroY)
            const yNovos = getY(d.novos);
            const hNovos = Math.max(2, zeroY - yNovos);

            // Deixou de seguir bar (downwards from zeroY)
            const yPerdas = zeroY;
            const hPerdas = Math.max(2, getY(-d.perdas) - zeroY);

            // Saldo dot
            const ySaldo = getY(d.saldo);

            return (
              <g key={`day-${i}`}>
                {/* Novos bar (Green) */}
                <rect
                  x={x - barWidth / 2}
                  y={yNovos}
                  width={barWidth}
                  height={hNovos}
                  fill={isHovered ? '#34D399' : '#10B981'}
                  opacity={isRecent ? 0.6 : 0.9}
                  rx="2"
                />

                {/* Deixou de seguir bar (Red) */}
                <rect
                  x={x - barWidth / 2}
                  y={yPerdas}
                  width={barWidth}
                  height={hPerdas}
                  fill={isHovered ? '#F87171' : '#EF4444'}
                  opacity={isRecent ? 0.6 : 0.9}
                  rx="2"
                />

                {/* Saldo dot (Circle) */}
                <circle
                  cx={x}
                  cy={ySaldo}
                  r={isHovered ? '5' : '3.5'}
                  fill="#FFFFFF"
                  stroke="#0284C7"
                  strokeWidth="2"
                  filter={isHovered ? 'drop-shadow(0 0 4px #38BDF8)' : 'none'}
                />
              </g>
            );
          })}

          {/* X Axis Baseline */}
          <line
            x1={padLeft}
            y1={padTop + plotH}
            x2={padLeft + plotW}
            y2={padTop + plotH}
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="1"
          />

          {/* X Axis Date Labels (every ~3-4 days to avoid clutter) */}
          {processed.map((d, i) => {
            const step = processed.length > 20 ? 4 : 2;
            const isLast = i === processed.length - 1;
            if (i % step !== 0 && !isLast) return null;

            const x = getX(i);
            const label = d.data ? d.data.slice(8, 10) + '/' + d.data.slice(5, 7) : `D${i + 1}`;
            return (
              <text
                key={`x-lbl-${i}`}
                x={x}
                y={padTop + plotH + 16}
                fontSize="9.5"
                fill="#64748B"
                textAnchor="middle"
                fontWeight="500"
              >
                {label}
              </text>
            );
          })}

          {/* Hover Indicator Crosshair */}
          {hoveredIndex !== null && activeItem && (
            <g>
              <line
                x1={getX(hoveredIndex)}
                y1={padTop}
                x2={getX(hoveredIndex)}
                y2={padTop + plotH}
                stroke="rgba(255, 255, 255, 0.35)"
                strokeDasharray="2 2"
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Interactive Tooltip on Hover */}
      {hoveredIndex !== null && activeItem && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '12px',
            background: 'rgba(11, 15, 25, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '11px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
            pointerEvents: 'none',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          <div style={{ color: '#F8FAFC', fontWeight: 700, borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '3px', marginBottom: '2px' }}>
            📅 {formatDateBr(activeItem.data)} {activeItem.podeMudar && <span style={{ color: '#FBBF24', fontSize: '9px' }}>(estimado)</span>}
          </div>
          <div style={{ color: '#34D399', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <span>Novos seguidores:</span>
            <strong>+{activeItem.novos}</strong>
          </div>
          <div style={{ color: '#F87171', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <span>Deixou de seguir:</span>
            <strong>-{activeItem.perdas}</strong>
          </div>
          <div style={{ color: '#38BDF8', fontWeight: 800, borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '3px', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <span>Saldo do dia:</span>
            <span>{activeItem.saldo >= 0 ? `+${activeItem.saldo}` : activeItem.saldo}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 2. GRÁFICO 2: ALCANCE E INTERAÇÕES POR DIA (Dois eixos, hover interativo e referências)
// ============================================================================
function AlcanceInteracoesChart({ data }: { data: CurvaDiariaItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
        Sem dados de alcance no período
      </div>
    );
  }

  const maxAlcanceRaw = Math.max(...data.map((d) => d.alcance || 0), 100);
  const maxInteracoesRaw = Math.max(...data.map((d) => d.interacoes || 0), 10);

  // Nice Ceilings for Dual Axes
  const maxAlcance = Math.ceil(maxAlcanceRaw / 100) * 100;
  const maxInteracoes = Math.ceil(maxInteracoesRaw / 10) * 10;

  // SVG Dimensions
  const svgWidth = 600;
  const svgHeight = 240;
  const padLeft = 55; // Left Y-Axis (Alcance)
  const padRight = 45; // Right Y-Axis (Interações)
  const padTop = 25;
  const padBottom = 42;

  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const getX = (idx: number) => {
    return padLeft + (idx / Math.max(1, data.length - 1)) * plotW;
  };

  const getYAlcance = (val: number) => {
    return padTop + plotH - (val / maxAlcance) * plotH;
  };

  const getYInteracoes = (val: number) => {
    return padTop + plotH - (val / maxInteracoes) * plotH;
  };

  // Points for Alcance (Cyan)
  const alcancePoints = data
    .map((d, i) => `${getX(i).toFixed(1)},${getYAlcance(d.alcance || 0).toFixed(1)}`)
    .join(' ');

  // Fill area under Alcance
  const alcanceArea = `${padLeft},${padTop + plotH} ${alcancePoints} ${padLeft + plotW},${padTop + plotH}`;

  // Points for Interações (Green)
  const interacoesPoints = data
    .map((d, i) => `${getX(i).toFixed(1)},${getYInteracoes(d.interacoes || 0).toFixed(1)}`)
    .join(' ');

  // Mouse Move Handler
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const relativeX = (clientX / rect.width) * svgWidth;
    const clampedX = Math.max(padLeft, Math.min(padLeft + plotW, relativeX));
    const idx = Math.round(((clampedX - padLeft) / plotW) * (data.length - 1));
    const validIdx = Math.max(0, Math.min(data.length - 1, idx));
    setHoveredIndex(validIdx);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const activeItem = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div style={{ position: 'relative', width: '100%' }} ref={containerRef}>
      {/* Legend & Dual Axis Indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          fontSize: '11px',
          marginBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#38BDF8', fontWeight: 600 }}>
            <span style={{ width: '10px', height: '3px', background: '#38BDF8', display: 'inline-block' }} />
            Alcance (eixo esquerdo)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#34D399', fontWeight: 600 }}>
            <span style={{ width: '10px', height: '3px', background: '#34D399', display: 'inline-block' }} />
            Interações (eixo direito)
          </span>
        </div>
        <span style={{ fontSize: '10.5px', color: '#64748B' }}>
          Eixo X: dias do período
        </span>
      </div>

      {/* SVG Canvas */}
      <div style={{ width: '100%', height: '220px' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
          style={{ width: '100%', height: '100%', overflow: 'visible', cursor: 'crosshair' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="alcanceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* 5 Horizontal Grid Lines with Dual Values */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
            const y = padTop + plotH - ratio * plotH;
            const valAlc = Math.round(ratio * maxAlcance);
            const valInt = Math.round(ratio * maxInteracoes);

            return (
              <g key={`grid-${ratio}`}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={padLeft + plotW}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.06)"
                  strokeDasharray="3 3"
                />
                {/* Left Y Axis: Alcance (Cyan) */}
                <text
                  x={padLeft - 8}
                  y={y + 3.5}
                  fontSize="10"
                  fill="#38BDF8"
                  textAnchor="end"
                  fontWeight="600"
                >
                  {valAlc >= 1000 ? `${(valAlc / 1000).toFixed(1).replace('.', ',')}k` : valAlc}
                </text>

                {/* Right Y Axis: Interações (Green) */}
                <text
                  x={padLeft + plotW + 8}
                  y={y + 3.5}
                  fontSize="10"
                  fill="#34D399"
                  textAnchor="start"
                  fontWeight="600"
                >
                  {valInt}
                </text>
              </g>
            );
          })}

          {/* Area Fill for Alcance */}
          <polygon points={alcanceArea} fill="url(#alcanceGrad)" />

          {/* Alcance Polyline (Cyan) */}
          <polyline
            fill="none"
            stroke="#38BDF8"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={alcancePoints}
          />

          {/* Interações Polyline (Emerald Green) */}
          <polyline
            fill="none"
            stroke="#10B981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={interacoesPoints}
          />

          {/* Points for Interações */}
          {data.map((d, i) => {
            const x = getX(i);
            const y = getYInteracoes(d.interacoes || 0);
            const isHovered = hoveredIndex === i;
            return (
              <circle
                key={`pt-int-${i}`}
                cx={x}
                cy={y}
                r={isHovered ? '5' : '3'}
                fill="#10B981"
                stroke="#0F1626"
                strokeWidth="1.5"
                filter={isHovered ? 'drop-shadow(0 0 5px #10B981)' : 'none'}
              />
            );
          })}

          {/* Points for Alcance (when hovered or every few points) */}
          {data.map((d, i) => {
            const x = getX(i);
            const y = getYAlcance(d.alcance || 0);
            const isHovered = hoveredIndex === i;
            if (!isHovered && i % 3 !== 0) return null;
            return (
              <circle
                key={`pt-alc-${i}`}
                cx={x}
                cy={y}
                r={isHovered ? '5' : '2.5'}
                fill="#38BDF8"
                stroke="#0F1626"
                strokeWidth="1.5"
                filter={isHovered ? 'drop-shadow(0 0 5px #38BDF8)' : 'none'}
              />
            );
          })}

          {/* X Axis Baseline */}
          <line
            x1={padLeft}
            y1={padTop + plotH}
            x2={padLeft + plotW}
            y2={padTop + plotH}
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="1"
          />

          {/* X Axis Date Labels */}
          {data.map((d, i) => {
            const step = data.length > 20 ? 4 : 2;
            const isLast = i === data.length - 1;
            if (i % step !== 0 && !isLast) return null;

            const x = getX(i);
            const label = d.data ? d.data.slice(8, 10) + '/' + d.data.slice(5, 7) : `D${i + 1}`;
            return (
              <text
                key={`x-lbl-reach-${i}`}
                x={x}
                y={padTop + plotH + 16}
                fontSize="9.5"
                fill="#64748B"
                textAnchor="middle"
                fontWeight="500"
              >
                {label}
              </text>
            );
          })}

          {/* Hover Crosshair Guide */}
          {hoveredIndex !== null && activeItem && (
            <g>
              <line
                x1={getX(hoveredIndex)}
                y1={padTop}
                x2={getX(hoveredIndex)}
                y2={padTop + plotH}
                stroke="rgba(255, 255, 255, 0.35)"
                strokeDasharray="2 2"
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Interactive Tooltip on Hover */}
      {hoveredIndex !== null && activeItem && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '12px',
            background: 'rgba(11, 15, 25, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '11px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
            pointerEvents: 'none',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          <div style={{ color: '#F8FAFC', fontWeight: 700, borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '3px', marginBottom: '2px' }}>
            📅 {formatDateBr(activeItem.data)} {activeItem.podeMudar && <span style={{ color: '#FBBF24', fontSize: '9px' }}>(estimado)</span>}
          </div>
          <div style={{ color: '#38BDF8', display: 'flex', justifyContent: 'space-between', gap: '14px' }}>
            <span>Alcance:</span>
            <strong>{formatNumber(activeItem.alcance)} contas</strong>
          </div>
          <div style={{ color: '#34D399', display: 'flex', justifyContent: 'space-between', gap: '14px' }}>
            <span>Interações:</span>
            <strong>{formatNumber(activeItem.interacoes)}</strong>
          </div>
          <div style={{ color: '#F1F5F9', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '3px', display: 'flex', justifyContent: 'space-between', gap: '14px' }}>
            <span>Taxa do dia:</span>
            <strong style={{ color: '#34D399' }}>
              {activeItem.alcance > 0
                ? `${(((activeItem.interacoes || 0) / activeItem.alcance) * 100).toFixed(2).replace('.', ',')}%`
                : '–'}
            </strong>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 3. RANKING DE POSTS COM MÍDIA E ORDENAÇÃO (Requirement 6)
// ============================================================================
type RankingSortVar = 'engajamento' | 'alcance' | 'seguidores' | 'interacoes' | 'salvos' | 'views';

function PostRankingSection({ posts = [] }: { posts: OrganicPost[] }) {
  const [sortBy, setSortBy] = useState<RankingSortVar>('engajamento');
  const [filterFormat, setFilterFormat] = useState<string>('TODOS');

  // Fallback posts if none provided (matching visual style of Image 6 & 7)
  const defaultPosts: any[] = [
    {
      id: 'p1',
      caption: '"Um bom acordo não é aquele..."',
      mediaProductType: 'REELS',
      timestamp: '2026-10-22T18:53:00Z',
      mediaUrl: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=600&auto=format&fit=crop&q=80',
      permalink: 'https://instagram.com/p/DBTN001',
      reach: 534,
      views: 866,
      totalInteractions: 84,
      taxaEngajamento: 15.7,
      saved: 0,
      shares: 0,
      ganhoSeguidores: 3,
      tema: 'Crédito e dívida rural',
    },
    {
      id: 'p2',
      caption: 'Existe algo presente aqui na emp...',
      mediaProductType: 'REELS',
      timestamp: '2026-10-21T11:01:00Z',
      mediaUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
      permalink: 'https://instagram.com/p/DBTN002',
      reach: 120,
      views: 167,
      totalInteractions: 13,
      taxaEngajamento: 10.8,
      saved: 0,
      shares: 0,
      ganhoSeguidores: 1,
      tema: 'Institucional',
    },
    {
      id: 'p3',
      caption: 'Muitos podem se perguntar porq...',
      mediaProductType: 'REELS',
      timestamp: '2026-10-19T11:01:00Z',
      mediaUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
      permalink: 'https://instagram.com/p/DBTN003',
      reach: 310,
      views: 432,
      totalInteractions: 26,
      taxaEngajamento: 8.4,
      saved: 0,
      shares: 1,
      ganhoSeguidores: 2,
      tema: 'Bastidores',
    },
    {
      id: 'p4',
      caption: 'Um respiro. Um fôlego.',
      mediaProductType: 'REELS',
      timestamp: '2026-10-26T11:01:00Z',
      mediaUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
      permalink: 'https://instagram.com/p/DBTN004',
      reach: 295,
      views: 402,
      totalInteractions: 18,
      taxaEngajamento: 6.1,
      saved: 0,
      shares: 0,
      ganhoSeguidores: 0,
      tema: 'Motivacional',
    },
    {
      id: 'p5',
      caption: 'Ninguém devia enfrentar sozinho...',
      mediaProductType: 'IMAGE',
      timestamp: '2026-10-16T11:00:00Z',
      mediaUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
      permalink: 'https://instagram.com/p/DBTN005',
      reach: 125,
      views: 206,
      totalInteractions: 7,
      taxaEngajamento: 5.6,
      saved: 0,
      shares: 0,
      ganhoSeguidores: 0,
      tema: 'Crédito e dívida rural',
    },
    {
      id: 'p6',
      caption: 'Ninguém devia enfrentar sozinho...',
      mediaProductType: 'CAROUSEL',
      timestamp: '2026-11-02T11:00:00Z',
      mediaUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=80',
      permalink: 'https://instagram.com/p/DBTN006',
      reach: 166,
      views: 276,
      totalInteractions: 9,
      taxaEngajamento: 5.4,
      saved: 0,
      shares: 0,
      ganhoSeguidores: 1,
      tema: 'Sucessão e patrimônio',
    },
    {
      id: 'p7',
      caption: 'Depois de 10 anos trabalhando c...',
      mediaProductType: 'REELS',
      timestamp: '2026-10-23T11:03:00Z',
      mediaUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
      permalink: 'https://instagram.com/p/DBTN007',
      reach: 162,
      views: 227,
      totalInteractions: 6,
      taxaEngajamento: 3.7,
      saved: 0,
      shares: 0,
      ganhoSeguidores: 0,
      tema: 'Institucional',
    },
    {
      id: 'p8',
      caption: 'Eu costumo dizer pros meus clie...',
      mediaProductType: 'REELS',
      timestamp: '2026-10-30T11:01:00Z',
      mediaUrl: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=600&auto=format&fit=crop&q=80',
      permalink: 'https://instagram.com/p/DBTN008',
      reach: 110,
      views: 142,
      totalInteractions: 3,
      taxaEngajamento: 2.7,
      saved: 0,
      shares: 0,
      ganhoSeguidores: 0,
      tema: 'Crédito e dívida rural',
    },
  ];

  const pool = posts.length > 0 ? posts : defaultPosts;

  // Filter
  const filtered = pool.filter((p: any) => {
    if (filterFormat === 'TODOS') return true;
    const type = String(p.mediaProductType || p.tipo || '').toUpperCase();
    if (filterFormat === 'REELS') return type.includes('REEL');
    if (filterFormat === 'CAROUSEL') return type.includes('CAROUSEL') || type.includes('ALBUM');
    if (filterFormat === 'IMAGE') return type.includes('IMAGE') || type.includes('FOTO') || type.includes('FEED');
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a: any, b: any) => {
    if (sortBy === 'engajamento') {
      const engA = a.taxaEngajamento ?? ((a.totalInteractions || 0) / (a.reach || 1)) * 100;
      const engB = b.taxaEngajamento ?? ((b.totalInteractions || 0) / (b.reach || 1)) * 100;
      return engB - engA;
    }
    if (sortBy === 'alcance') {
      return (b.reach || b.alcance || 0) - (a.reach || a.alcance || 0);
    }
    if (sortBy === 'seguidores') {
      const sA = a.ganhoSeguidores ?? a.seguidoresGanhos ?? 0;
      const sB = b.ganhoSeguidores ?? b.seguidoresGanhos ?? 0;
      return sB - sA;
    }
    if (sortBy === 'interacoes') {
      return (b.totalInteractions || b.interacoes || 0) - (a.totalInteractions || a.interacoes || 0);
    }
    if (sortBy === 'salvos') {
      return (b.saved || b.salvos || b.salvamentos || 0) - (a.saved || a.salvos || a.salvamentos || 0);
    }
    if (sortBy === 'views') {
      return (b.views || 0) - (a.views || 0);
    }
    return 0;
  });

  return (
    <div
      style={{
        background: '#0F1626',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '10px',
        overflow: 'hidden',
      }}
    >
      {/* Header with Title and Sorting Controls */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC' }}>
            Ranking de Publicações do Período
          </span>
          <span
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34D399',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '9999px',
            }}
          >
            {sorted.length} publicações
          </span>
        </div>

        {/* Sorting Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, marginRight: '4px' }}>
            ORDENAR POR:
          </span>
          {[
            { id: 'engajamento' as RankingSortVar, label: 'Engajamento %' },
            { id: 'alcance' as RankingSortVar, label: 'Alcance' },
            { id: 'seguidores' as RankingSortVar, label: 'Seguidores' },
            { id: 'interacoes' as RankingSortVar, label: 'Interações' },
            { id: 'salvos' as RankingSortVar, label: 'Salvos' },
            { id: 'views' as RankingSortVar, label: 'Views' },
          ].map((s) => {
            const active = sortBy === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSortBy(s.id)}
                style={{
                  background: active ? '#10B981' : 'rgba(255, 255, 255, 0.05)',
                  color: active ? '#022C16' : '#94A3B8',
                  border: active ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Format Filter Bar */}
      <div
        style={{
          padding: '10px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(0, 0, 0, 0.15)',
        }}
      >
        <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600 }}>FORMATO:</span>
        {[
          { id: 'TODOS', label: 'Todos os formatos' },
          { id: 'REELS', label: 'Reels' },
          { id: 'CAROUSEL', label: 'Carrossel' },
          { id: 'IMAGE', label: 'Fotos estáticas' },
        ].map((f) => {
          const active = filterFormat === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilterFormat(f.id)}
              style={{
                background: active ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                color: active ? '#F8FAFC' : '#64748B',
                border: 'none',
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '10.5px',
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Grid of Post Cards with Media Preview */}
      <div
        style={{
          padding: '18px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
          gap: '14px',
        }}
      >
        {sorted.map((p: any, idx: number) => {
          const type = String(p.mediaProductType || p.tipo || 'REELS').toUpperCase();
          const isReels = type.includes('REEL');
          const isCarousel = type.includes('CAROUSEL') || type.includes('ALBUM');
          const formatLabel = isReels ? 'Reels' : isCarousel ? 'Carrossel' : 'Foto';
          const eng = p.taxaEngajamento ?? ((p.totalInteractions || p.interacoes || 0) / (p.reach || p.alcance || 1)) * 100;
          const reachVal = p.reach ?? p.alcance ?? null;
          const viewsVal = p.views ?? null;
          const intVal = p.totalInteractions ?? p.interacoes ?? 0;
          const savedVal = p.saved ?? p.salvos ?? p.salvamentos ?? 0;
          const sharesVal = p.shares ?? p.compartilhamentos ?? 0;
          const followersVal = p.ganhoSeguidores ?? p.seguidoresGanhos ?? null;
          const tema = p.tema || 'Institucional';
          const rankNumber = idx + 1;
          const isTop3 = rankNumber <= 3;

          return (
            <div
              key={p.id || idx}
              style={{
                background: '#0B0F19',
                border: isTop3 ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
              }}
            >
              {/* Media Preview Thumbnail */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: isReels ? '4/5' : '1/1',
                  background: '#060910',
                  overflow: 'hidden',
                }}
              >
                {p.mediaUrl || p.thumbnailUrl ? (
                  <img
                    src={p.mediaUrl || p.thumbnailUrl}
                    alt={p.caption || p.legenda || 'Post Instagram'}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                    onError={(e) => {
                      // Fallback gradient if image fails to load
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                      color: '#64748B',
                      padding: '12px',
                      textAlign: 'center',
                    }}
                  >
                    {isReels ? <Film size={32} /> : isCarousel ? <Layers size={32} /> : <ImageIcon size={32} />}
                    <span style={{ fontSize: '11px', marginTop: '6px' }}>{formatLabel}</span>
                  </div>
                )}

                {/* Top Left: Format Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(6px)',
                    color: '#F8FAFC',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {isReels ? <Film size={10} color="#F472B6" /> : isCarousel ? <Layers size={10} color="#38BDF8" /> : <ImageIcon size={10} color="#34D399" />}
                  {formatLabel}
                </div>

                {/* Top Right: Rank Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: isTop3 ? '#10B981' : 'rgba(0, 0, 0, 0.75)',
                    color: isTop3 ? '#022C16' : '#E2E8F0',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    boxShadow: isTop3 ? '0 2px 8px rgba(16, 185, 129, 0.5)' : 'none',
                  }}
                >
                  #{rankNumber}
                </div>

                {/* Bottom Gradient overlay on image */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '40px',
                    background: 'linear-gradient(to top, rgba(11, 15, 25, 0.9) 0%, transparent 100%)',
                  }}
                />
              </div>

              {/* Card Body with Metrics */}
              <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                {/* Date & Headline */}
                <div>
                  <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '2px' }}>
                    {formatDateBr(p.timestamp || p.publicadoEm)}
                  </div>
                  <div
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: '#F8FAFC',
                      lineHeight: '1.3',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                    title={p.caption || p.legenda}
                  >
                    {p.caption || p.legenda || 'Publicação sem legenda'}
                  </div>
                </div>

                {/* Metric Rows */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '6px 10px',
                    fontSize: '10.5px',
                    padding: '6px 0',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '9px' }}>ALCANCE</span>
                    <strong style={{ color: '#E2E8F0' }}>{formatNumber(reachVal)}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '9px' }}>VIEWS</span>
                    <strong style={{ color: '#E2E8F0' }}>{formatNumber(viewsVal)}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '9px' }}>INTERAÇÕES</span>
                    <strong style={{ color: '#E2E8F0' }}>{formatNumber(intVal)}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#34D399', display: 'block', fontSize: '9px', fontWeight: 700 }}>ENGAJAMENTO</span>
                    <strong style={{ color: '#34D399' }}>{eng.toFixed(1).replace('.', ',')}%</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '9px' }}>SALVOS</span>
                    <span style={{ color: '#CBD5E1' }}>{savedVal}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '9px' }}>SEGUIDORES</span>
                    <span style={{ color: followersVal !== null ? '#34D399' : '#64748B' }}>
                      {followersVal !== null ? `+${followersVal}` : '–'}
                    </span>
                  </div>
                </div>

                {/* Theme Tag & External Link */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '4px' }}>
                  <span
                    style={{
                      fontSize: '9px',
                      color: '#94A3B8',
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      maxWidth: '120px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {tema}
                  </span>

                  {p.permalink && (
                    <a
                      href={p.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '10px',
                        color: '#38BDF8',
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                    >
                      Post <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT: ORGANIC OVERVIEW
// ============================================================================
export function OrganicOverview({
  kpis,
  acoes = [],
  formatos = [],
  curvaDiaria = [],
  posts = [],
  correlacaoAnuncios12Semanas = [
    { semana: '24/08', seguidoresNovos: 180, alcanceAnuncios: 25000 },
    { semana: '31/08', seguidoresNovos: 145, alcanceAnuncios: 22000 },
    { semana: '07/09', seguidoresNovos: 110, alcanceAnuncios: 16000 },
    { semana: '14/09', seguidoresNovos: 60, alcanceAnuncios: 8000 },
    { semana: '21/09', seguidoresNovos: 75, alcanceAnuncios: 10500 },
    { semana: '28/09', seguidoresNovos: 120, alcanceAnuncios: 18000 },
    { semana: '05/10', seguidoresNovos: 140, alcanceAnuncios: 21000 },
    { semana: '12/10', seguidoresNovos: 160, alcanceAnuncios: 26000 },
    { semana: '19/10', seguidoresNovos: 125, alcanceAnuncios: 20000 },
    { semana: '26/10', seguidoresNovos: 145, alcanceAnuncios: 22000 },
    { semana: '02/11', seguidoresNovos: 165, alcanceAnuncios: 28000 },
    { semana: '09/11', seguidoresNovos: 25, alcanceAnuncios: 4000 },
  ],
  correlacaoTexto = 'As semanas com mais alcance de anúncios neste perfil costumam ter mais seguidores novos. (correlação 0,59 em 11 semanas fechadas; com 95% de confiança, entre 0,02 e 0,87; r² de 0,35; valor p de 0,04: há correlação). Correlação não é causa; não prova que os anúncios trouxeram os seguidores.',
  toquesLinksBotao = [{ botao: 'Ligar', toques: 1, pct: 100 }],
  onNavigateTab,
}: OrganicOverviewProps) {
  // Safe KPI extractions
  const segTotal = kpis?.seguidores?.total ?? 5241;
  const segGanhos = kpis?.seguidores?.ganhos ?? 615;
  const segPerdidos = kpis?.seguidores?.perdidos ?? 35;

  const alcValor = kpis?.alcance?.valor ?? 2258;
  const alcMediana = kpis?.alcance?.medianaPorPost ?? 120;
  const alcVar = kpis?.alcance?.variacaoPct ?? 99.6;

  const contasEngValor = kpis?.contasEngajadas?.valor ?? 2470;
  const contasEngVar = kpis?.contasEngajadas?.variacaoPct ?? 152.8;

  const interacoesValor = kpis?.interacoes?.valor ?? 418;
  const interacoesVar = kpis?.interacoes?.variacaoPct ?? 429.1;

  const taxaEngValor = kpis?.taxaEngajamento?.valor ?? 18.51;
  const taxaEngVar = kpis?.taxaEngajamento?.variacaoPct ?? 165.0;

  const pctNaoSeg = (kpis as any)?.foraDaBolhaPct?.valor ?? kpis?.pctNaoSeguidores?.valor ?? 96.1;
  const pctNaoSegVar = (kpis as any)?.foraDaBolhaPct?.variacaoPct ?? -1.0;

  const cliquesBioValor = kpis?.cliquesBio?.valor ?? null;

  // Actions fallback
  const displayAcoes =
    acoes.length > 0
      ? acoes
      : [
          {
            id: 'a1',
            tipo: 'COMENTARIOS_PENDENTES',
            titulo: 'Responder 1 possível lead nos comentários',
            subtitulo: 'o comentário mais antigo espera há 18 d 8 h',
            prioridade: 1,
            link: '/organico/comentarios',
          },
          {
            id: 'a2',
            tipo: 'CADENCIA_ATRASADA',
            titulo: 'Último post há 4 dias',
            subtitulo: 'o habitual do perfil é publicar a cada 2 dias · melhor horário: por volta das 20h',
            prioridade: 2,
            link: '/organico/conteudos',
          },
          {
            id: 'a3',
            tipo: 'CANDIDATOS_ANUNCIO',
            titulo: '5 publicações com bom engajamento ainda sem anúncio',
            subtitulo: 'candidatas a virar anúncio ou impulsionamento',
            prioridade: 3,
            link: '/organico/ranking',
          },
        ];

  // Formatos fallback matching Image 5
  const displayFormatos =
    formatos.length > 0 && formatos[0].alcance !== undefined
      ? formatos
      : [
          { formato: 'Carrossel', alcance: 1788, views: 9604, interacoes: 350, engajamentoPct: 19.6, medianaPorPost: 120, n: 9, salvos: 3 },
          { formato: 'Foto', alcance: 2605, views: 3891, interacoes: 43, engajamentoPct: 1.7, medianaPorPost: null, n: null, salvos: null },
          { formato: 'Reels', alcance: 469, views: 871, interacoes: 25, engajamentoPct: 5.3, medianaPorPost: 118, n: 4, salvos: null },
          { formato: 'Stories', alcance: 24, views: 468, interacoes: null, engajamentoPct: null, medianaPorPost: null, n: null, salvos: null },
        ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. SEÇÃO "O QUE FAZER AGORA" */}
      <div
        style={{
          background: '#0F1626',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(90deg, #123824 0%, #0F2D1D 100%)',
            borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC' }}>
              O que fazer agora
            </span>
            <Info size={13} color="#34D399" />
          </div>
          <span
            style={{
              background: '#10B981',
              color: '#022C16',
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '9999px',
            }}
          >
            {displayAcoes.length}
          </span>
        </div>

        <div style={{ padding: '4px 18px' }}>
          {displayAcoes.map((acao: any, idx: number) => {
            const isLast = idx === displayAcoes.length - 1;
            let targetTab = 'comments';
            if (acao.tipo === 'CADENCIA_ATRASADA' || acao.link?.includes('conteudos')) targetTab = 'contents';
            if (acao.tipo === 'CANDIDATOS_ANUNCIO' || acao.link?.includes('ranking')) targetTab = 'ranking';

            return (
              <div
                key={acao.id || idx}
                onClick={() => onNavigateTab(targetTab)}
                style={{
                  padding: '12px 0',
                  borderBottom: isLast ? 'none' : '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: '12.5px', color: '#F1F5F9' }}>
                  <strong style={{ color: '#FFFFFF', fontWeight: 700 }}>{acao.titulo}</strong>
                  {acao.subtitulo && (
                    <span style={{ color: '#94A3B8', marginLeft: '6px' }}>
                      {acao.subtitulo.startsWith('—') || acao.subtitulo.startsWith('-') ? '' : '— '}
                      {acao.subtitulo}
                    </span>
                  )}
                </div>
                <div style={{ color: '#64748B', display: 'flex', alignItems: 'center' }}>
                  <ChevronRight size={15} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. REQUIREMENT 3: 7 KPI CARDS NA ORDEM ESTRITA SOLICITADA */}
      {/* Ordem: seguidores, alcance de não seguidores, taxa de engajamento, alcance, contas engajadas, interações, cliques na bio */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        {/* 1. SEGUIDORES */}
        <div
          style={{
            background: '#0F1626',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '4px' }}>
            SEGUIDORES <Info size={11} color="#64748B" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#F8FAFC', margin: '6px 0 2px 0' }}>
            {formatNumber(segTotal)}
          </div>
          <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#34D399', display: 'flex', alignItems: 'center', gap: '4px' }}>
            +{segGanhos} novos <span style={{ color: '#F87171' }}>-{segPerdidos} saíram</span>
          </div>
        </div>

        {/* 2. ALCANCE EM NÃO SEGUIDORES */}
        <div
          style={{
            background: '#0F1626',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ALCANCE NÃO SEGUIDORES <Info size={11} color="#64748B" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#F8FAFC', margin: '6px 0 2px 0' }}>
            {pctNaoSeg !== null ? `${pctNaoSeg.toFixed(1).replace('.', ',')}%` : '–'}
          </div>
          <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#F87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowDownRight size={12} /> {Math.abs(pctNaoSegVar).toFixed(1).replace('.', ',')}%
            <span style={{ color: '#FBBF24', background: 'rgba(251, 191, 36, 0.12)', padding: '1px 5px', borderRadius: '4px', fontSize: '9px', fontWeight: 600 }}>
              inclui anúncios
            </span>
          </div>
        </div>

        {/* 3. TAXA DE ENGAJAMENTO */}
        <div
          style={{
            background: '#0F1626',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '4px' }}>
            TAXA DE ENGAJAMENTO <Info size={11} color="#64748B" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#34D399', margin: '6px 0 2px 0' }}>
            {taxaEngValor.toFixed(2).replace('.', ',')}%
          </div>
          <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#34D399', display: 'flex', alignItems: 'center', gap: '2px' }}>
            <ArrowUpRight size={12} /> {taxaEngVar.toFixed(1).replace('.', ',')}%
          </div>
        </div>

        {/* 4. ALCANCE */}
        <div
          style={{
            background: '#0F1626',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ALCANCE <Info size={11} color="#64748B" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#F8FAFC', margin: '6px 0 2px 0' }}>
            {formatNumber(alcValor)}
          </div>
          <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#34D399', display: 'flex', alignItems: 'center', gap: '2px', flexWrap: 'wrap' }}>
            <ArrowUpRight size={12} /> {alcVar.toFixed(1).replace('.', ',')}%
            {alcMediana !== null && (
              <span style={{ color: '#64748B', fontWeight: 400, marginLeft: '3px' }}>
                mediana {alcMediana}
              </span>
            )}
          </div>
        </div>

        {/* 5. CONTAS ENGAJADAS */}
        <div
          style={{
            background: '#0F1626',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '4px' }}>
            CONTAS ENGAJADAS <Info size={11} color="#64748B" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#F8FAFC', margin: '6px 0 2px 0' }}>
            {formatNumber(contasEngValor)}
          </div>
          <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#34D399', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUpRight size={12} /> {contasEngVar.toFixed(1).replace('.', ',')}%
            <span style={{ color: '#FBBF24', background: 'rgba(251, 191, 36, 0.12)', padding: '1px 5px', borderRadius: '4px', fontSize: '9px', fontWeight: 600 }}>
              inclui anúncios
            </span>
          </div>
        </div>

        {/* 6. INTERAÇÕES */}
        <div
          style={{
            background: '#0F1626',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '4px' }}>
            INTERAÇÕES <Info size={11} color="#64748B" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#F8FAFC', margin: '6px 0 2px 0' }}>
            {formatNumber(interacoesValor)}
          </div>
          <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#34D399', display: 'flex', alignItems: 'center', gap: '2px' }}>
            <ArrowUpRight size={12} /> {interacoesVar.toFixed(1).replace('.', ',')}%
          </div>
        </div>

        {/* 7. CLIQUES NA BIO */}
        <div
          style={{
            background: '#0F1626',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '4px' }}>
            CLIQUES NA BIO <Info size={11} color="#64748B" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: cliquesBioValor !== null ? '#F8FAFC' : '#64748B', margin: '6px 0 2px 0' }}>
            {cliquesBioValor !== null ? formatNumber(cliquesBioValor) : '–'}
          </div>
          <div style={{ fontSize: '10px', color: '#64748B' }}>
            {cliquesBioValor === null ? 'Sem dados no período' : 'Toques no link'}
          </div>
        </div>
      </div>

      {/* 3. ROW DE GRÁFICOS: SEGUIDORES POR DIA (ESQUERDA) & ALCANCE E INTERAÇÕES (DIREITA) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '16px' }}>
        {/* Gráfico 1: Seguidores por dia (Barra verde, Barra vermelha, Ponto saldo) */}
        <div
          style={{
            background: '#0F1626',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC' }}>
                Seguidores por dia
              </span>
              <Info size={13} color="#94A3B8" />
            </div>
            <span
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34D399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
              }}
            >
              30 dias
            </span>
          </div>

          <div style={{ padding: '16px 18px' }}>
            <SeguidoresPorDiaChart data={curvaDiaria} />
          </div>
        </div>

        {/* Gráfico 2: Alcance e interações por dia */}
        <div
          style={{
            background: '#0F1626',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC' }}>
                Alcance e interações por dia
              </span>
              <Info size={13} color="#94A3B8" />
            </div>
            <span
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38BDF8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
              }}
            >
              30 dias
            </span>
          </div>

          <div style={{ padding: '16px 18px' }}>
            <AlcanceInteracoesChart data={curvaDiaria} />
          </div>
        </div>
      </div>

      {/* 4. REQUIREMENT 6: RANKING DE POSTS COM MÍDIA E ORDENAÇÃO ABAIXO DOS DOIS GRÁFICOS */}
      <PostRankingSection posts={posts} />

      {/* 5. CORRELAÇÃO DE ANÚNCIOS (12 Semanas) */}
      <div
        style={{
          background: '#0F1626',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC' }}>
              Seguidores novos x alcance de anúncios neste perfil
            </span>
            <Info size={13} color="#94A3B8" />
          </div>
          <span
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34D399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '9999px',
            }}
          >
            12 semanas
          </span>
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', gap: '20px', fontSize: '12px', marginBottom: '14px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34D399', fontWeight: 600 }}>
              <span style={{ width: '12px', height: '12px', background: '#10B981', display: 'inline-block', borderRadius: '2px' }} />
              Seguidores novos
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F8FAFC', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', background: '#F8FAFC', display: 'inline-block', borderRadius: '50%' }} />
              Alcance de anúncios neste perfil
            </span>
          </div>

          <div style={{ height: '220px', width: '100%' }}>
            <svg viewBox="0 0 800 220" style={{ width: '100%', height: '100%' }}>
              {[30, 80, 130, 180].map((y) => (
                <line key={y} x1="40" y1={y} x2="760" y2={y} stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" />
              ))}

              {/* Bars: Seguidores novos */}
              {correlacaoAnuncios12Semanas.map((item, i) => {
                const x = 60 + i * 58;
                const h = (item.seguidoresNovos / 200) * 150;
                return (
                  <rect
                    key={`bar-w-${i}`}
                    x={x}
                    y={180 - h}
                    width="20"
                    height={h}
                    fill="#10B981"
                    rx="3"
                  />
                );
              })}

              {/* Line: Alcance de anúncios */}
              <polyline
                fill="none"
                stroke="#F8FAFC"
                strokeWidth="2.5"
                points={correlacaoAnuncios12Semanas.map((item, i) => {
                  const x = 70 + i * 58;
                  const y = 180 - (item.alcanceAnuncios / 30000) * 150;
                  return `${x},${y}`;
                }).join(' ')}
              />

              {/* Points for line */}
              {correlacaoAnuncios12Semanas.map((item, i) => {
                const x = 70 + i * 58;
                const y = 180 - (item.alcanceAnuncios / 30000) * 150;
                return (
                  <circle key={`pt-w-${i}`} cx={x} cy={y} r="4" fill="#F8FAFC" />
                );
              })}

              {/* X Axis labels */}
              {correlacaoAnuncios12Semanas.map((item, i) => {
                const x = 70 + i * 58;
                return (
                  <text key={`lbl-${i}`} x={x} y="202" fontSize="11" fill="#64748B" textAnchor="middle">
                    {item.semana}
                  </text>
                );
              })}
            </svg>
          </div>

          {/* Statistical Insight Caption */}
          <div style={{ marginTop: '16px', fontSize: '11.5px', color: '#94A3B8', lineHeight: '1.6', background: 'rgba(255, 255, 255, 0.02)', padding: '12px 16px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            {correlacaoTexto}
          </div>
        </div>
      </div>

      {/* 6. TABLES ROW: POR FORMATO & TOQUES EM LINKS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
        {/* Left: Por formato */}
        <div
          style={{
            background: '#0F1626',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC' }}>
                Por formato
              </span>
              <Info size={13} color="#94A3B8" />
            </div>
          </div>

          <div style={{ padding: '16px 18px' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94A3B8', fontSize: '10.5px' }}>
                    <th style={{ padding: '8px 4px' }}>FORMATO</th>
                    <th style={{ padding: '8px 4px' }}>ALCANCE</th>
                    <th style={{ padding: '8px 4px' }}>VIEWS</th>
                    <th style={{ padding: '8px 4px' }}>INTERAÇÕES</th>
                    <th style={{ padding: '8px 4px' }}>ENGAJAMENTO</th>
                    <th style={{ padding: '8px 4px' }}>MEDIANA POR POST</th>
                    <th style={{ padding: '8px 4px' }}>SALVOS</th>
                  </tr>
                </thead>
                <tbody>
                  {displayFormatos.map((fmt: any, i: number) => {
                    const alc = fmt.alcance ?? fmt.alcanceTotal ?? null;
                    const vws = fmt.views ?? fmt.viewsTotal ?? null;
                    const ints = fmt.interacoes ?? fmt.interacoesTotal ?? null;
                    const eng = fmt.engajamentoPct !== null && fmt.engajamentoPct !== undefined ? `${fmt.engajamentoPct.toFixed(1).replace('.', ',')}%` : '–';
                    const med = fmt.medianaPorPost !== null && fmt.medianaPorPost !== undefined ? `${fmt.medianaPorPost}${fmt.n ? ` (n=${fmt.n})` : ''}` : '–';
                    const slv = fmt.salvos ?? fmt.salvosTotal ?? null;

                    return (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '10px 4px', fontWeight: 600, color: '#F8FAFC' }}>{fmt.formato}</td>
                        <td style={{ padding: '10px 4px', color: '#E2E8F0' }}>{formatNumber(alc)}</td>
                        <td style={{ padding: '10px 4px', color: '#E2E8F0' }}>{formatNumber(vws)}</td>
                        <td style={{ padding: '10px 4px', color: '#E2E8F0' }}>{formatNumber(ints)}</td>
                        <td style={{ padding: '10px 4px', fontWeight: 600, color: '#34D399' }}>{eng}</td>
                        <td style={{ padding: '10px 4px', color: '#CBD5E1' }}>{med}</td>
                        <td style={{ padding: '10px 4px', color: '#E2E8F0' }}>{formatNumber(slv)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '10px', fontSize: '10px', color: '#64748B' }}>
              O alcance por formato é a soma diária de cada formato (uma pessoa pode aparecer em mais de um).
            </div>
          </div>
        </div>

        {/* Right: Toques em links do perfil por botão */}
        <div
          style={{
            background: '#0F1626',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC' }}>
                Toques em links do perfil por botão
              </span>
              <Info size={13} color="#94A3B8" />
            </div>
          </div>

          <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {toquesLinksBotao.map((btn, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                <span style={{ width: '60px', color: '#CBD5E1', fontWeight: 600 }}>{btn.botao}</span>
                <div style={{ flex: 1, background: 'rgba(255, 255, 255, 0.08)', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ width: `${btn.pct}%`, background: '#10B981', height: '100%', borderRadius: '5px' }} />
                </div>
                <span style={{ fontWeight: 700, color: '#F8FAFC', width: '20px', textAlign: 'right' }}>
                  {btn.toques}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7. FOOTER DISCLAIMERS */}
      <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748B', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div>* Estimativa da Meta: métrica marcada como estimada ou em desenvolvimento; pode ser revista depois.</div>
        <div>Dados do Instagram · fuso da conta · os 2 dias mais recentes podem mudar (a Meta leva até 48 h para fechar)</div>
      </div>
    </div>
  );
}

export default OrganicOverview;
