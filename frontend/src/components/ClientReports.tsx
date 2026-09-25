import React, { useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  Users,
  ShieldCheck,
  ArrowRight,
  Filter,
  CheckCircle2,
  Percent,
  Calendar,
  Download,
  FileText,
  FileSpreadsheet,
  Sparkles,
  Printer,
} from 'lucide-react';

export function ClientReports() {
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

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

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    setDownloadingFormat(format);
    const url = `/api/reports/export/${format}?clientId=cli_bruna_ppp`;
    if (format === 'pdf') {
      window.open(url, '_blank');
    } else {
      window.location.href = url;
    }
    setTimeout(() => setDownloadingFormat(null), 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header with 1-Click Export Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Relatórios de Desempenho & Funil de Conversão
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Visão consolidada da jornada completa: do primeiro clique no anúncio até a compra aprovada no WhatsApp.
          </p>
        </div>

        {/* 1-Click Export Buttons (Fase 7.5) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleExport('pdf')}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
          >
            <Printer size={14} color="var(--accent-purple)" />
            {downloadingFormat === 'pdf' ? 'Gerando...' : 'Baixar PDF'}
          </button>

          <button
            onClick={() => handleExport('excel')}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
          >
            <FileSpreadsheet size={14} color="var(--accent-green)" />
            {downloadingFormat === 'excel' ? 'Exportando...' : 'Exportar Excel'}
          </button>

          <button
            onClick={() => handleExport('csv')}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
          >
            <Download size={14} color="var(--accent-cyan)" />
            {downloadingFormat === 'csv' ? 'Baixando...' : 'Exportar CSV'}
          </button>

          <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>
            <ShieldCheck size={12} />
            CAPI v3.0 Ativo
          </span>
        </div>
      </div>

      {/* 7.4 Projeção Preditiva de Faturamento com IA */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--accent-purple)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
              Projeção Preditiva com IA: Fechamento de Lançamento
            </h3>
            <span className="badge badge-purple">Confiança Estatística: 92%</span>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            Curva de Lançamento (D1: 35% • D2: 15% • D3: 10% • D4: 8% • D5-D7: 32%)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Faturamento Atual</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>R$ 87.400</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--accent-cyan)', marginTop: '2px' }}>Dia 4 de 7 aberto</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Projeção Preditiva Final</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-green)' }}>R$ 158.400</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '2px' }}>Faixa: R$ 142k a R$ 168k</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Meta Estabelecida</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-amber)' }}>R$ 150.000</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--accent-green)', marginTop: '2px' }}>+5.6% acima da meta</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Velocidade Horária</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>R$ 640/h</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '2px' }}>Média das últimas 24h</div>
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.25)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.82rem', color: '#fff', lineHeight: 1.5 }}>
          💡 <strong>Recomendação da IA:</strong> Com a taxa de conversão atual de 4.8% nos grupos VIP e retenção de 89.3%, a projeção fecha em R$ 158.400, superando a meta. Recomendamos aumentar o orçamento nos conjuntos de lookalike de compradores e ativar o disparo de recuperação de PIX pendente para resgatar ~R$ 18.000 antes do encerramento.
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
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                  Etapa {idx + 1}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff', marginBottom: '8px', minHeight: '40px' }}>
                  {step.label}
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: step.color, marginBottom: '4px' }}>
                  {step.value}
                </div>
              </div>

              <div>
                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden', margin: '8px 0' }}>
                  <div style={{ width: step.pct, height: '100%', background: step.color, borderRadius: '2px' }} />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{step.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 14-Day Member Inflow vs Outflow Chart */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Fluxo de Participantes nos Grupos VIP (Últimos 14 Dias)</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Comparativo diário de Entradas vs Saídas com taxa de retenção calculada.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '14px', fontSize: '0.78rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--accent-green)' }} />
              Entradas (Verde)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--accent-rose)' }} />
              Saídas (Vermelho)
            </span>
          </div>
        </div>

        <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '8px', paddingBottom: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
          {days.map((d, idx) => {
            const inHeight = Math.round((d.in / maxVal) * 160);
            const outHeight = Math.round((d.out / maxVal) * 160);
            return (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '170px' }}>
                  <div
                    style={{
                      width: '12px',
                      height: `${inHeight}px`,
                      background: 'var(--accent-green)',
                      borderRadius: '3px 3px 0 0',
                    }}
                    title={`Entradas: ${d.in}`}
                  />
                  <div
                    style={{
                      width: '6px',
                      height: `${outHeight}px`,
                      background: 'var(--accent-rose)',
                      borderRadius: '3px 3px 0 0',
                    }}
                    title={`Saídas: ${d.out}`}
                  />
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{d.date}</span>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          <span>Taxa de Retenção Acumulada: <strong style={{ color: 'var(--accent-green)' }}>89.3%</strong></span>
          <span>Total de Entradas: <strong style={{ color: '#fff' }}>4.766 membros</strong></span>
          <span>Total de Saídas: <strong style={{ color: 'var(--accent-rose)' }}>508 saídas</strong></span>
        </div>
      </div>
    </div>
  );
}
