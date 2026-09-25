import React from 'react';
import {
  TrendingUp,
  BarChart3,
  Users,
  ShieldCheck,
  ArrowRight,
  Filter,
  CheckCircle2,
  Percent,
  Calendar
} from 'lucide-react';

export function ClientReports() {
  const funnelSteps = [
    { label: 'Cliques nos Anúncios Meta', value: '12.450', sub: 'Tráfego pago rastreado via CAPI v3.0', pct: '100%', color: 'var(--accent-cyan)' },
    { label: 'Entradas no Grupo VIP WhatsApp', value: '4.766', sub: 'Leads que abriram o link /l/bruna-vip', pct: '38.2%', color: 'var(--accent-purple)' },
    { label: 'Leads Retidos no Grupo', value: '4.258', sub: 'Aguardando abertura de carrinho', pct: '89.3%', color: 'var(--accent-green)' },
    { label: 'Checkouts Iniciados (InitiateCheckout)', value: '342', sub: 'Com token s2/s3 de intenção', pct: '8.0%', color: 'var(--accent-amber)' },
    { label: 'Compras Confirmadas (Purchase)', value: '88', sub: 'Vendas aprovadas na Kiwify & Hotmart', pct: '25.7%', color: 'var(--accent-green)' },
  ];

  const days = [
    { date: '11/09', in: 120, out: 12 },
    { date: '12/09', in: 145, out: 18 },
    { date: '13/09', in: 210, out: 14 },
    { date: '14/09', in: 340, out: 22 },
    { date: '15/09', in: 290, out: 19 },
    { date: '16/09', in: 410, out: 28 },
    { date: '17/09', in: 380, out: 25 },
    { date: '18/09', in: 490, out: 34 },
    { date: '19/09', in: 520, out: 40 },
    { date: '20/09', in: 480, out: 30 },
    { date: '21/09', in: 390, out: 21 },
    { date: '22/09', in: 310, out: 18 },
    { date: '23/09', in: 350, out: 24 },
    { date: '24/09', in: 320, out: 19 },
  ];

  const maxVal = Math.max(...days.map((d) => d.in));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Relatórios de Desempenho & Funil de Conversão
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Visão consolidada da jornada completa: do primeiro clique no anúncio até a compra aprovada no WhatsApp.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-green">
            <ShieldCheck size={12} />
            Atribuição Determinística CAPI Ativa
          </span>
        </div>
      </div>

      {/* Horizontal Conversion Funnel Card */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} color="var(--accent-green)" />
          Funil de Conversão Ponta a Ponta
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', position: 'relative' }}>
          {funnelSteps.map((step, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '16px',
                position: 'relative',
              }}
            >
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Etapa 0{idx + 1}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: step.color }}>{step.value}</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, margin: '4px 0', minHeight: '38px' }}>{step.label}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '8px' }}>{step.sub}</div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Retenção</span>
                <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>
                  {step.pct}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Graph: Entradas vs Saídas nos Grupos (padrão grupovip) */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="var(--accent-cyan)" />
              Fluxo de Participantes nos Grupos VIP (Últimos 14 dias)
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Comparativo de entradas via link inteligente contra saídas voluntárias do WhatsApp.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.75rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
              Entradas (+4.766)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} />
              Saídas (-508)
            </span>
            <span className="badge badge-cyan">89,3% Taxa de Retenção</span>
          </div>
        </div>

        {/* CSS Bar Chart */}
        <div
          style={{
            height: '200px',
            display: 'flex',
            alignItems: 'flex-end',
            gap: '8px',
            paddingTop: '20px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {days.map((d, i) => {
            const barHeight = Math.round((d.in / maxVal) * 160);
            const outHeight = Math.round((d.out / maxVal) * 160);
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', width: '100%', justifyContent: 'center' }}>
                  <div
                    title={`${d.date}: +${d.in} entradas`}
                    style={{
                      width: '60%',
                      maxWidth: '18px',
                      height: `${barHeight}px`,
                      background: 'linear-gradient(180deg, #10B981, #059669)',
                      borderRadius: '4px 4px 0 0',
                    }}
                  />
                  <div
                    title={`${d.date}: -${d.out} saídas`}
                    style={{
                      width: '30%',
                      maxWidth: '8px',
                      height: `${outHeight}px`,
                      background: '#EF4444',
                      borderRadius: '2px 2px 0 0',
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '8px' }}>{d.date}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4 Bottom Performance Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CPA MÉDIO (POR COMPRA)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-green)', margin: '4px 0' }}>R$ 38,40</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Ticket Médio: R$ 993,00</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ROAS REAL ATRIBUÍDO</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-cyan)', margin: '4px 0' }}>4.8x</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>CAPI + Webhook Kiwify</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DEDUPLICAÇÃO CAPI</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-purple)', margin: '4px 0' }}>99,98%</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Zero perda Browser/Server</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>EVENT MATCH QUALITY</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-amber)', margin: '4px 0' }}>8.8 / 10</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Classificação Excelente Meta</div>
        </div>
      </div>
    </div>
  );
}
