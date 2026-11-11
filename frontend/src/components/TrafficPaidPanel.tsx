import React, { useState } from 'react';
import {
  Info,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Play,
  RotateCcw,
  Download,
  Filter,
} from 'lucide-react';

export type TrafficPaidSubTab =
  | 'hoje'
  | 'visao_geral'
  | 'campanhas'
  | 'criativos'
  | 'publicos'
  | 'leads'
  | 'comentarios'
  | 'qualidade_leads'
  | 'pautas'
  | 'qualidade_comercial';

interface TrafficPaidPanelProps {
  client: any;
}

export function TrafficPaidPanel({ client }: TrafficPaidPanelProps) {
  const [activeTab, setActiveTab] = useState<TrafficPaidSubTab>('visao_geral');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30d');

  const navTabs = [
    { id: 'hoje', label: 'Hoje' },
    { id: 'visao_geral', label: 'Visão geral' },
    { id: 'campanhas', label: 'Campanhas' },
    { id: 'criativos', label: 'Criativos' },
    { id: 'publicos', label: 'Públicos' },
    { id: 'leads', label: 'Leads' },
    { id: 'comentarios', label: 'Comentários dos anúncios' },
    { id: 'qualidade_leads', label: 'Qualidade dos leads' },
    { id: 'pautas', label: 'Pautas das conversas' },
    { id: 'qualidade_comercial', label: 'Qualidade do comercial' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Subtabs Bar */}
      <div className="growth-subtabs-nav" style={{ margin: '-24px -24px 0 -24px', padding: '0 24px', background: '#FFFFFF' }}>
        {navTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as TrafficPaidSubTab)}
            className={`growth-subtab-item ${activeTab === t.id ? 'active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Period Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>
            PERÍODO
          </span>
          {[
            { id: 'hoje', label: 'Hoje' },
            { id: 'ontem', label: 'Ontem' },
            { id: '7d', label: '7 dias' },
            { id: '30d', label: '30 dias' },
            { id: 'este_mes', label: 'Este mês' },
            { id: 'mes_passado', label: 'Mês passado' },
            { id: 'todo', label: 'Todo o período' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPeriod(p.id)}
              className={`growth-filter-pill ${selectedPeriod === p.id ? 'active' : ''}`}
            >
              {p.label}
            </button>
          ))}
          <span className="growth-filter-pill" style={{ background: '#FFFFFF', color: '#374151', cursor: 'default' }}>
            Personalizado: <strong>12/10/2026 a 10/11/2026</strong> <span style={{ color: '#9CA3AF' }}>comparado com 12/09–11/10</span>
          </span>
        </div>
      </div>

      {/* Content depending on active tab */}
      {activeTab === 'visao_geral' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Attention Banner */}
          <div className="growth-section" style={{ border: '1px solid #BBF7D0', background: '#F0FDF4' }}>
            <div className="growth-section-header" style={{ background: '#154228' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Atenção</span>
                <Info size={13} />
              </div>
              <span className="growth-section-badge">1</span>
            </div>
            <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div style={{ fontSize: '12px', color: '#1F2937' }}>
                <span style={{ background: '#FEF3C7', color: '#92400E', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, marginRight: '8px' }}>
                  Dependência de um criativo
                </span>
                <strong>C/ HEADLINE SE VOCÊ NÃO QUER CARÊNCIA PASSE ESSE VÍDEO</strong> — Cópia trouxe 100% dos leads dos últimos 14 dias (1 criativo com gasto). Se ele cansar, o CPL sobe de uma vez: teste criativos reserva.
              </div>
              <button
                onClick={() => setActiveTab('criativos')}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#154228',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Ver
              </button>
            </div>
          </div>

          {/* 10 KPI Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div className="growth-kpi-card">
              <span className="growth-kpi-title">INVESTIMENTO <Info size={11} color="#9CA3AF" /></span>
              <div className="growth-kpi-value">R$ 5.373,95</div>
              <div className="growth-kpi-delta" style={{ color: '#DC2626' }}>
                <ArrowDownRight size={12} /> 42,1%
              </div>
            </div>

            <div className="growth-kpi-card">
              <span className="growth-kpi-title">LEADS <Info size={11} color="#9CA3AF" /></span>
              <div className="growth-kpi-value">250</div>
              <div className="growth-kpi-delta" style={{ color: '#DC2626' }}>
                <ArrowDownRight size={12} /> 25,4%
              </div>
            </div>

            <div className="growth-kpi-card">
              <span className="growth-kpi-title">CPL <Info size={11} color="#9CA3AF" /></span>
              <div className="growth-kpi-value">R$ 21,50</div>
              <div className="growth-kpi-delta" style={{ color: '#16A34A' }}>
                <ArrowDownRight size={12} /> 18,4%
              </div>
            </div>

            <div className="growth-kpi-card">
              <span className="growth-kpi-title">CTR <Info size={11} color="#9CA3AF" /></span>
              <div className="growth-kpi-value">2,77%</div>
              <div className="growth-kpi-delta" style={{ color: '#16A34A' }}>
                <ArrowUpRight size={12} /> 71,7% <span style={{ color: '#9CA3AF', fontSize: '10px' }}>campanhas de lead</span>
              </div>
            </div>

            <div className="growth-kpi-card">
              <span className="growth-kpi-title">IMPRESSÕES <Info size={11} color="#9CA3AF" /></span>
              <div className="growth-kpi-value">253,9 mil</div>
              <div className="growth-kpi-delta" style={{ color: '#DC2626' }}>
                <ArrowDownRight size={12} /> 45,3%
              </div>
            </div>

            <div className="growth-kpi-card">
              <span className="growth-kpi-title">ALCANCE <Info size={11} color="#9CA3AF" /></span>
              <div className="growth-kpi-value">141,5 mil</div>
              <div className="growth-kpi-delta" style={{ color: '#DC2626' }}>
                <ArrowDownRight size={12} /> 41,5%
              </div>
            </div>

            <div className="growth-kpi-card">
              <span className="growth-kpi-title">FREQUÊNCIA <Info size={11} color="#9CA3AF" /></span>
              <div className="growth-kpi-value">1,79</div>
              <div className="growth-kpi-delta" style={{ color: '#DC2626' }}>
                <ArrowDownRight size={12} /> 6,4%
              </div>
            </div>

            <div className="growth-kpi-card">
              <span className="growth-kpi-title">CLIQUES NO LINK <Info size={11} color="#9CA3AF" /></span>
              <div className="growth-kpi-value">7.042</div>
              <div className="growth-kpi-delta" style={{ color: '#16A34A' }}>
                <ArrowUpRight size={12} /> 3,2%
              </div>
            </div>

            <div className="growth-kpi-card">
              <span className="growth-kpi-title">CPC <Info size={11} color="#9CA3AF" /></span>
              <div className="growth-kpi-value">R$ 0,76</div>
              <div className="growth-kpi-delta" style={{ color: '#16A34A' }}>
                <ArrowDownRight size={12} /> 47,2% <span style={{ color: '#9CA3AF', fontSize: '10px' }}>campanhas de lead</span>
              </div>
            </div>

            <div className="growth-kpi-card">
              <span className="growth-kpi-title">CPM <Info size={11} color="#9CA3AF" /></span>
              <div className="growth-kpi-value">R$ 21,17</div>
              <div className="growth-kpi-delta" style={{ color: '#16A34A' }}>
                <ArrowDownRight size={12} /> 9,6% <span style={{ color: '#9CA3AF', fontSize: '10px' }}>campanhas de lead</span>
              </div>
            </div>
          </div>

          {/* Chart: Investimento x leads por dia */}
          <div className="growth-section">
            <div className="growth-section-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Investimento x leads por dia</span>
                <Info size={13} />
              </div>
              <span className="growth-section-badge">30 dias</span>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', marginBottom: '14px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '10px', height: '10px', background: '#154228', display: 'inline-block', borderRadius: '2px' }} />
                  Investimento
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '10px', height: '10px', background: '#22C55E', display: 'inline-block', borderRadius: '2px' }} />
                  Leads
                </span>
              </div>

              {/* Responsive SVG Chart */}
              <div style={{ height: '220px', width: '100%' }}>
                <svg viewBox="0 0 800 220" style={{ width: '100%', height: '100%' }}>
                  {/* Grid Lines */}
                  {[40, 90, 140, 190].map((y) => (
                    <line key={y} x1="40" y1={y} x2="780" y2={y} stroke="#E5E7EB" strokeDasharray="3 3" />
                  ))}

                  {/* Bars (Investimento) */}
                  {Array.from({ length: 30 }, (_, i) => {
                    const x = 50 + i * 24;
                    const h = 40 + Math.abs(Math.sin(i * 0.7)) * 110;
                    return (
                      <rect
                        key={`bar-${i}`}
                        x={x}
                        y={200 - h}
                        width="14"
                        height={h}
                        fill="#154228"
                        rx="2"
                        opacity={i >= 28 ? '0.6' : '0.95'}
                      />
                    );
                  })}

                  {/* Line (Leads) */}
                  <polyline
                    fill="none"
                    stroke="#22C55E"
                    strokeWidth="3"
                    points={Array.from({ length: 30 }, (_, i) => {
                      const x = 57 + i * 24;
                      const y = 180 - Math.abs(Math.sin((i + 1) * 0.7)) * 120;
                      return `${x},${y}`;
                    }).join(' ')}
                  />

                  {/* Points (Leads) */}
                  {Array.from({ length: 30 }, (_, i) => {
                    const x = 57 + i * 24;
                    const y = 180 - Math.abs(Math.sin((i + 1) * 0.7)) * 120;
                    return (
                      <circle key={`pt-${i}`} cx={x} cy={y} r="3" fill="#22C55E" />
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>

          {/* Two-column layout: Ritmo de orçamento & Por que o CPL mudou */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {/* Ritmo de orçamento */}
            <div className="growth-section">
              <div className="growth-section-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Ritmo de orçamento</span>
                  <Info size={13} />
                </div>
              </div>
              <div style={{ padding: '16px 20px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6B7280' }}>Gasto hoje:</span>
                  <span><strong>R$ 230,07</strong> de R$ 200,00 (115%) — pelo horário, esperado: ~R$ 187</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6B7280' }}>Orçamento diário ativo:</span>
                  <strong>R$ 200,00</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6B7280' }}>Gasto no mês:</span>
                  <strong>R$ 2.002,23</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6B7280' }}>Projeção do mês:</span>
                  <strong style={{ color: '#154228' }}>R$ 6.046</strong>
                </div>
              </div>
            </div>

            {/* Por que o CPL mudou */}
            <div className="growth-section">
              <div className="growth-section-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Por que o CPL mudou</span>
                  <Info size={13} />
                </div>
              </div>
              <div style={{ padding: '16px 20px', fontSize: '13px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontSize: '11px' }}>
                      <th style={{ padding: '6px 0' }}>MÉTRICA</th>
                      <th>ANTES</th>
                      <th>AGORA</th>
                      <th>VARIAÇÃO</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '8px 0', fontWeight: 600 }}>CPL</td>
                      <td>R$ 23,36</td>
                      <td>R$ 21,17</td>
                      <td style={{ color: '#16A34A', fontWeight: 600 }}>▼ 9,4%</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '8px 0', fontWeight: 600 }}>CTR</td>
                      <td>1,61%</td>
                      <td>2,77%</td>
                      <td style={{ color: '#16A34A', fontWeight: 600 }}>▲ 71,7%</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 0', fontWeight: 600 }}>CPC</td>
                      <td>R$ 1,44</td>
                      <td>R$ 0,76</td>
                      <td style={{ color: '#16A34A', fontWeight: 600 }}>▼ 47,2%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campanhas Tab */}
      {activeTab === 'campanhas' && (
        <div className="growth-section">
          <div className="growth-section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Campanhas</span>
              <Info size={13} />
            </div>
            <span className="growth-section-badge">1 campanha</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 16px' }}>CAMPANHA</th>
                  <th style={{ padding: '10px 12px' }}>STATUS</th>
                  <th style={{ padding: '10px 12px' }}>INVESTIMENTO ▼</th>
                  <th style={{ padding: '10px 12px' }}>% VERBA</th>
                  <th style={{ padding: '10px 12px' }}>LEADS</th>
                  <th style={{ padding: '10px 12px' }}>CPL</th>
                  <th style={{ padding: '10px 12px' }}>IMPRESSÕES</th>
                  <th style={{ padding: '10px 12px' }}>ALCANCE</th>
                  <th style={{ padding: '10px 12px' }}>FREQ.</th>
                  <th style={{ padding: '10px 12px' }}>CLIQUES</th>
                  <th style={{ padding: '10px 12px' }}>CTR</th>
                  <th style={{ padding: '10px 12px' }}>CPC</th>
                  <th style={{ padding: '10px 12px' }}>CPM</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                    [DBTN] FORM DÍVIDA RURAL — 03102026
                  </td>
                  <td style={{ padding: '12px 12px' }}>
                    <span style={{ background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600 }}>
                      Veiculando
                    </span>
                  </td>
                  <td style={{ padding: '12px 12px', fontWeight: 700 }}>R$ 5.373,95</td>
                  <td style={{ padding: '12px 12px' }}>100%</td>
                  <td style={{ padding: '12px 12px', fontWeight: 700 }}>250</td>
                  <td style={{ padding: '12px 12px', color: '#16A34A', fontWeight: 700 }}>R$ 21,50</td>
                  <td style={{ padding: '12px 12px' }}>253.899</td>
                  <td style={{ padding: '12px 12px' }}>141.532</td>
                  <td style={{ padding: '12px 12px' }}>1,79</td>
                  <td style={{ padding: '12px 12px' }}>7.042</td>
                  <td style={{ padding: '12px 12px', fontWeight: 600 }}>2,77%</td>
                  <td style={{ padding: '12px 12px' }}>R$ 0,76</td>
                  <td style={{ padding: '12px 12px' }}>R$ 21,17</td>
                </tr>
                <tr style={{ background: '#F9FAFB', fontWeight: 700 }}>
                  <td style={{ padding: '10px 16px' }}>Total</td>
                  <td style={{ padding: '10px 12px' }}></td>
                  <td style={{ padding: '10px 12px' }}>R$ 5.373,95</td>
                  <td style={{ padding: '10px 12px' }}></td>
                  <td style={{ padding: '10px 12px' }}>250</td>
                  <td style={{ padding: '10px 12px' }}>R$ 21,50</td>
                  <td style={{ padding: '10px 12px' }}>253.899</td>
                  <td style={{ padding: '10px 12px' }}>141.532</td>
                  <td style={{ padding: '10px 12px' }}>1,79</td>
                  <td style={{ padding: '10px 12px' }}>7.042</td>
                  <td style={{ padding: '10px 12px' }}>2,77%</td>
                  <td style={{ padding: '10px 12px' }}>R$ 0,76</td>
                  <td style={{ padding: '10px 12px' }}>R$ 21,17</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Criativos Tab */}
      {activeTab === 'criativos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="growth-section">
            <div className="growth-section-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Ranking de criativos</span>
                <Info size={13} />
              </div>
              <span className="growth-section-badge">1</span>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ maxWidth: '280px', border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden', background: '#FFFFFF', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ position: 'relative', height: '240px', background: '#1E293B' }}>
                  <img
                    src="https://images.unsplash.com/photo-1556157382-97eda2d62296?w=600&auto=format&fit=crop&q=80"
                    alt="Criativo"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <span style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.7)', color: '#FFFFFF', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>
                    Vídeo
                  </span>
                  <span style={{ position: 'absolute', top: '8px', right: '8px', background: '#22C55E', color: '#FFFFFF', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                    #1
                  </span>
                </div>
                <div style={{ padding: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    C/ HEADLINE SE VOCÊ NÃO QU...
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
                    <div>
                      <span style={{ color: '#6B7280' }}>Leads</span>
                      <div style={{ fontWeight: 700 }}>250</div>
                    </div>
                    <div>
                      <span style={{ color: '#6B7280' }}>CPL</span>
                      <div style={{ fontWeight: 700, color: '#16A34A' }}>R$ 21,50</div>
                    </div>
                    <div>
                      <span style={{ color: '#6B7280' }}>Investimento</span>
                      <div style={{ fontWeight: 700 }}>R$ 5.374</div>
                    </div>
                    <div>
                      <span style={{ color: '#6B7280' }}>CTR</span>
                      <div style={{ fontWeight: 700 }}>2,77%</div>
                    </div>
                    <div>
                      <span style={{ color: '#6B7280' }}>Gancho</span>
                      <div style={{ fontWeight: 700, color: '#154228' }}>49,4%</div>
                    </div>
                    <div>
                      <span style={{ color: '#6B7280' }}>Retenção</span>
                      <div style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
                        <span style={{ width: '8px', height: '10px', background: '#22C55E', borderRadius: '1px' }} />
                        <span style={{ width: '8px', height: '10px', background: '#22C55E', borderRadius: '1px' }} />
                        <span style={{ width: '8px', height: '10px', background: '#86EFAC', borderRadius: '1px' }} />
                        <span style={{ width: '8px', height: '10px', background: '#DCFCE7', borderRadius: '1px' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Públicos Tab */}
      {activeTab === 'publicos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="growth-section">
            <div className="growth-section-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Região</span>
                <Info size={13} />
              </div>
              <span className="growth-section-badge">30 dias</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontSize: '11px' }}>
                    <th style={{ padding: '8px 16px' }}>REGIÃO</th>
                    <th style={{ padding: '8px 12px' }}>INVESTIMENTO</th>
                    <th style={{ padding: '8px 12px' }}>% DO INVEST.</th>
                    <th style={{ padding: '8px 12px' }}>IMPRESSÕES</th>
                    <th style={{ padding: '8px 12px' }}>CLIQUES NO LINK</th>
                    <th style={{ padding: '8px 12px' }}>CTR</th>
                    <th style={{ padding: '8px 12px' }}>LEADS</th>
                    <th style={{ padding: '8px 12px' }}>CPL</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { reg: 'Goiás', inv: 'R$ 3.015,09', pct: '56,1%', imp: '122.200', clk: '3.229', ctr: '2,64%', leads: 157, cpl: 'R$ 19,20' },
                    { reg: 'São Paulo', inv: 'R$ 865,15', pct: '16,1%', imp: '57.807', clk: '1.840', ctr: '3,18%', leads: 38, cpl: 'R$ 22,77' },
                    { reg: 'Tocantins', inv: 'R$ 807,79', pct: '15,0%', imp: '33.560', clk: '735', ctr: '2,19%', leads: 31, cpl: 'R$ 26,06' },
                    { reg: 'Mato Grosso do Sul', inv: 'R$ 276,06', pct: '5,1%', imp: '10.131', clk: '336', ctr: '3,32%', leads: 6, cpl: 'R$ 46,01' },
                    { reg: 'Minas Gerais', inv: 'R$ 183,72', pct: '3,0%', imp: '10.575', clk: '349', ctr: '3,30%', leads: 10, cpl: 'R$ 18,37' },
                  ].map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '10px 16px', fontWeight: 600 }}>{r.reg}</td>
                      <td style={{ padding: '10px 12px' }}>{r.inv}</td>
                      <td style={{ padding: '10px 12px' }}>{r.pct}</td>
                      <td style={{ padding: '10px 12px' }}>{r.imp}</td>
                      <td style={{ padding: '10px 12px' }}>{r.clk}</td>
                      <td style={{ padding: '10px 12px' }}>{r.ctr}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700 }}>{r.leads}</td>
                      <td style={{ padding: '10px 12px', color: '#16A34A', fontWeight: 700 }}>{r.cpl}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrafficPaidPanel;

