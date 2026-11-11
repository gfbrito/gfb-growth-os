import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Target,
  BarChart3,
  Flame,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Radio,
  Clock,
  Layers,
} from 'lucide-react';

interface ClientDashboardProps {
  clientData: any;
  onNavigateToTab: (tab: any, subTab?: any) => void;
  clientName?: string;
}

export function ClientDashboard({ clientData, onNavigateToTab, clientName = 'Cliente' }: ClientDashboardProps) {
  const summary = clientData?.executiveSummary || {
    todayRevenue: 8970,
    currentRevenue: 87400,
    revenueGoal: 150000,
    requiredDailyPace: 12520,
    currentDailyPace: 3496,
    progressPct: 58,
    headline: 'Operação em ritmo acelerado com vendas comprovadas.',
  };

  const sales = clientData?.recentSales || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Executive Welcome & Operations Status Header */}
      <div
        className="glass-panel"
        style={{
          padding: '22px 28px',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                <CheckCircle size={11} />
                OPERAÇÃO ATIVA
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Meta CAPI v20 • Deduplicação Browser + Server
              </span>
            </div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 700, margin: '4px 0', letterSpacing: '-0.02em', color: '#F8FAFC' }}>
              Painel de Performance · {clientName}
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
              Operação em ritmo acelerado com <strong>112% da velocidade programada</strong> para atingir a meta mensal.
            </p>
          </div>
          <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.03)', padding: '10px 18px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pacing de Faturamento</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-green)', fontVariantNumeric: 'tabular-nums' }}>
              R$ {summary.currentDailyPace?.toLocaleString('pt-BR') || '3.496'}/dia
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Média móvel dos últimos 7 dias
            </div>
          </div>
        </div>
      </div>

      {/* 4 Big Numbers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>FATURADO HOJE</span>
            <DollarSign size={16} color="var(--accent-green)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--accent-green)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
            R$ {summary.todayRevenue?.toLocaleString('pt-BR') || '8.970'},00
          </div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-dim)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={13} color="var(--accent-green)" />
            Vendas confirmadas nos checkouts integrados
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL ACUMULADO NO MÊS</span>
            <Layers size={16} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
            R$ {summary.currentRevenue?.toLocaleString('pt-BR') || '87.400'},00
          </div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-dim)', marginTop: '6px' }}>
            88 pedidos aprovados (Hotmart & Kiwify)
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>META DO MÊS</span>
            <Target size={16} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--accent-amber)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
            R$ {summary.revenueGoal?.toLocaleString('pt-BR') || '150.000'},00
          </div>
          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
              <span>{summary.progressPct || 58}% atingido</span>
              <span>Restam R$ 62.600</span>
            </div>
            <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${summary.progressPct || 58}%`, height: '100%', background: 'linear-gradient(90deg, #F59E0B, #10B981)' }} />
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>RITMO DIÁRIO NECESSÁRIO</span>
            <Clock size={16} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--accent-cyan)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
            R$ {summary.requiredDailyPace?.toLocaleString('pt-BR') || '12.520'}/dia
          </div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-dim)', marginTop: '6px' }}>
            Pacing para 100% de fechamento até o fim do ciclo
          </div>
        </div>
      </div>

      {/* Projeção Estatística de Fechamento (Run-Rate Gaussiano) */}
      {clientData?.predictiveForecast && (
        <div
          className="glass-panel"
          style={{
            padding: '22px',
            border: '1px solid var(--border-default)',
            background: 'var(--bg-surface-elevated)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={17} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F1F5F9' }}>Projeção de Fechamento (Curva de Lançamento)</h3>
              <span className="badge badge-cyan" style={{ fontSize: '0.66rem' }}>
                Intervalo 92%
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              {clientData.predictiveForecast.launchDayProgress} • Velocidade: R$ {clientData.predictiveForecast.runRateHourlyVelocity}/h
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Previsão de Fechamento</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--accent-green)', fontVariantNumeric: 'tabular-nums' }}>
                R$ {clientData.predictiveForecast.expectedClosingRevenue?.toLocaleString('pt-BR')}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Faixa: R$ {clientData.predictiveForecast.confidenceBandMin?.toLocaleString('pt-BR')} a R$ {clientData.predictiveForecast.confidenceBandMax?.toLocaleString('pt-BR')}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Status contra a Meta (R$ 150k)</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: clientData.predictiveForecast.isGoalAchievedProjected ? 'var(--accent-green)' : 'var(--accent-amber)' }}>
                {clientData.predictiveForecast.isGoalAchievedProjected ? 'Meta Superada' : 'Atenção ao Ritmo'}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Delta projetado: R$ {clientData.predictiveForecast.projectedDeltaGoal?.toLocaleString('pt-BR')}
              </div>
            </div>
          </div>

          <div style={{ background: '#070B13', padding: '12px 16px', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: '#CBD5E1', lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600, color: 'var(--accent-cyan)', marginRight: '6px' }}>Diretriz Operacional:</span>
            {clientData.predictiveForecast.aiRecommendation}
          </div>
        </div>
      )}

      {/* Main Two-Column Row: Sales Feed & Leads Temperature */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
        {/* Sales Feed */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={18} color="var(--accent-green)" />
              Vendas Aprovadas em Tempo Real
            </h3>
            <button
              onClick={() => onNavigateToTab('crm', 'sales')}
              className="btn btn-secondary"
              style={{ padding: '5px 10px', fontSize: '0.75rem' }}
            >
              Ver Todas no CRM <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sales.map((sale: any) => (
              <div
                key={sale.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{sale.leadName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {sale.productName} • Origem:{' '}
                    <span style={{ color: 'var(--accent-cyan)' }}>{sale.adCampaignName || 'Tráfego Pago CAPI'}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                    R$ {sale.grossAmount?.toLocaleString('pt-BR') || (Number(sale.grossAmountCents) / 100).toLocaleString('pt-BR')}
                  </div>
                  <span className="badge badge-green" style={{ fontSize: '0.62rem' }}>
                    ✓ CAPI ENVIADO
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Temperature & RFM Overview */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={18} color="var(--accent-amber)" />
              Temperatura da Base
            </h3>
            <span className="badge badge-cyan">4.081 Leads</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, color: '#F87171', fontSize: '0.88rem' }}>🔥 Leads Quentes</span>
                <strong style={{ fontSize: '1.1rem' }}>2.418</strong>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Compraram nos últimos 30 dias ou acumulam mais de 200 pontos RFM no CRM.
              </p>
            </div>

            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, color: '#FBBF24', fontSize: '0.88rem' }}>⚡ Leads Mornos</span>
                <strong style={{ fontSize: '1.1rem' }}>1.140</strong>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Geraram PIX ou carrinho nos últimos 90 dias. Réguas de recuperação ativas.
              </p>
            </div>

            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, color: '#60A5FA', fontSize: '0.88rem' }}>❄️ Leads Frios / Inativos</span>
                <strong style={{ fontSize: '1.1rem' }}>523</strong>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Mais de 180 dias sem compras. Reativáveis via campanhas de aquecimento anti-ban.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
