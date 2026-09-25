import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Target,
  Sparkles,
  Flame,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Radio,
  Clock
} from 'lucide-react';

interface ClientDashboardProps {
  clientData: any;
  onNavigateToTab: (tab: any) => void;
}

export function ClientDashboard({ clientData, onNavigateToTab }: ClientDashboardProps) {
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
      {/* Executive Welcome & Certainty Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '24px 30px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>
                <CheckCircle size={12} />
                CERTEZA DE RESULTADO
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Atualizado em tempo real via CAPI Gateway
              </span>
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '4px 0', letterSpacing: '-0.02em' }}>
              Olá, Bruna Ortiz! Aqui está o resultado da sua operação.
            </h1>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
              Operação em ritmo acelerado! Você está a <strong>112% da velocidade ideal</strong> para atingir a meta mensal de R$ 150.000.
            </p>
          </div>
          <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.04)', padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Velocidade Atual</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-green)' }}>
              R$ {summary.currentDailyPace?.toLocaleString('pt-BR') || '3.496'}/dia
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', marginTop: '2px' }}>
              Média móvel de 7 dias
            </div>
          </div>
        </div>
      </div>

      {/* 4 Big Numbers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>FATURADO HOJE</span>
            <DollarSign size={18} color="var(--accent-green)" />
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--accent-green)', letterSpacing: '-0.02em' }}>
            R$ {summary.todayRevenue?.toLocaleString('pt-BR') || '8.970'},00
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={13} color="var(--accent-green)" />
            Vendas confirmadas no checkout Kiwify
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL ACUMULADO NO MÊS</span>
            <Sparkles size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            R$ {summary.currentRevenue?.toLocaleString('pt-BR') || '87.400'},00
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '6px' }}>
            88 pedidos aprovados (Hotmart & Kiwify)
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>META DO MÊS</span>
            <Target size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--accent-amber)', letterSpacing: '-0.02em' }}>
            R$ {summary.revenueGoal?.toLocaleString('pt-BR') || '150.000'},00
          </div>
          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
              <span>{summary.progressPct || 58}% atingido</span>
              <span>Restam R$ 62.600</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${summary.progressPct || 58}%`, height: '100%', background: 'linear-gradient(90deg, #F59E0B, #10B981)' }} />
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>RITMO NECESSÁRIO</span>
            <Clock size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--accent-cyan)', letterSpacing: '-0.02em' }}>
            R$ {summary.requiredDailyPace?.toLocaleString('pt-BR') || '12.520'}/dia
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '6px' }}>
            Para fechar em 100% até o dia 30
          </div>
        </div>
      </div>

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
              onClick={() => onNavigateToTab('crm')}
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
