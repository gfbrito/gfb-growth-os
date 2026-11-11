import React, { useEffect, useState } from 'react';
import type { Launch, LaunchMetrics } from '../launchTypes';
import { fetchLaunchDashboard, updateLaunch } from '../launchApi';
import { SimpleBarChart } from '../shared/SimpleBarChart';
import { SimpleLineChart } from '../shared/SimpleLineChart';
import {
  Users,
  MousePointerClick,
  TrendingUp,
  Percent,
  ExternalLink,
  Copy,
  Check,
  Layers,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface DashboardTabProps {
  launch: Launch;
  onLaunchUpdated: (launch: Launch) => void;
}

export function DashboardTab({ launch, onLaunchUpdated }: DashboardTabProps) {
  const [metrics, setMetrics] = useState<LaunchMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [togglingStatus, setTogglingStatus] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchLaunchDashboard(launch.id);
      setMetrics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [launch.id]);

  const publicUrl = `http://localhost:3000/l/${launch.slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleToggleActive = async () => {
    try {
      setTogglingStatus(true);
      const nextStatus = launch.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      const updated = await updateLaunch(launch.id, { status: nextStatus });
      onLaunchUpdated(updated);
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status');
    } finally {
      setTogglingStatus(false);
    }
  };

  if (loading && !metrics) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        Carregando métricas do lançamento...
      </div>
    );
  }

  const m = metrics || {
    totalLeads: 0,
    activeLeads: 0,
    totalClicks: 0,
    todayClicks: 0,
    totalEntries: 0,
    todayEntries: 0,
    todayExits: 0,
    conversionRatePct: 0,
    entriesPerDay: [],
    entryRatePerDay: [],
    exitRatePerDay: [],
    totalCapacity: 0,
    totalOccupied: 0,
    totalOccupiedPct: 0,
    creationQueueCount: 0,
    publicLink: publicUrl,
    recentActivity: { entries7d: 0, clicks7d: 0 },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner / Public Link Quick Access */}
      <div
        className="glass-panel"
        style={{
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(16, 185, 129, 0.04))',
          border: '1px solid rgba(6, 182, 212, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: launch.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: launch.status === 'ACTIVE' ? 'var(--accent-green)' : 'var(--accent-amber)',
            }}
          >
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>Link Inteligente do Lançamento</span>
              <span
                className={launch.status === 'ACTIVE' ? 'badge badge-green' : 'badge badge-amber'}
                style={{ fontSize: '0.72rem' }}
              >
                {launch.status === 'ACTIVE' ? 'Recebendo Leads' : 'Pausado'}
              </span>
            </div>
            <code style={{ fontSize: '0.84rem', color: 'var(--accent-cyan)', marginTop: '2px', display: 'block' }}>
              {publicUrl}
            </code>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleToggleActive}
            disabled={togglingStatus}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            {launch.status === 'ACTIVE' ? (
              <>
                <ToggleRight size={16} color="var(--accent-green)" /> Pausar Captação
              </>
            ) : (
              <>
                <ToggleLeft size={16} color="var(--accent-amber)" /> Reativar Captação
              </>
            )}
          </button>

          <button
            onClick={handleCopyLink}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            {copiedLink ? <Check size={14} color="var(--accent-green)" /> : <Copy size={14} />}
            {copiedLink ? 'Copiado!' : 'Copiar Link'}
          </button>

          <a
            href={`/l/${launch.slug}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <ExternalLink size={14} /> Testar Link
          </a>
        </div>
      </div>

      {/* 4 Cards de KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* KPI 1: Leads */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
              Total de Leads
            </span>
            <Users size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
            {(m.totalLeads ?? 0).toLocaleString('pt-BR')}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
            <strong style={{ color: 'var(--accent-green)' }}>{m.activeLeads ?? 0}</strong> ativos nos grupos
          </div>
        </div>

        {/* KPI 2: Cliques */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
              Total de Cliques
            </span>
            <MousePointerClick size={18} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
            {(m.totalClicks ?? 0).toLocaleString('pt-BR')}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
            <strong style={{ color: 'var(--accent-cyan)' }}>+{m.todayClicks ?? 0}</strong> cliques hoje
          </div>
        </div>

        {/* KPI 3: Fluxo Hoje */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
              Movimentação Hoje
            </span>
            <TrendingUp size={18} color="var(--accent-green)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-green)' }}>
              +{m.todayEntries}
            </span>
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-rose)' }}>
              -{m.todayExits}
            </span>
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
            Saldo líquido:{' '}
            <strong style={{ color: m.todayEntries >= m.todayExits ? 'var(--accent-green)' : 'var(--accent-rose)' }}>
              {m.todayEntries - m.todayExits >= 0 ? `+${m.todayEntries - m.todayExits}` : m.todayEntries - m.todayExits}
            </strong>
          </div>
        </div>

        {/* KPI 4: Conversão */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
              Taxa de Conversão
            </span>
            <Percent size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
            {m.conversionRatePct}%
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
            Cliques que entraram no grupo
          </div>
        </div>
      </div>

      {/* Visão Geral da Capacidade */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="var(--accent-cyan)" />
            <h4 style={{ fontSize: '1rem', fontWeight: 750, color: '#fff' }}>Ocupação dos Grupos VIP</h4>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Capacidade total configurada com distribuição inteligente ({launch.fillOrder === 'PROPORTIONAL' ? 'Proporcional' : 'Sequencial'}).
          </p>

          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-dim)' }}>
                {(m.totalOccupied ?? 0).toLocaleString('pt-BR')} ocupadas de {(m.totalCapacity ?? 0).toLocaleString('pt-BR')} vagas
              </span>
              <strong style={{ color: (m.totalOccupiedPct ?? 0) > 90 ? 'var(--accent-rose)' : 'var(--accent-green)' }}>
                {m.totalOccupiedPct ?? 0}%
              </strong>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, m.totalOccupiedPct ?? 0)}%`,
                  height: '100%',
                  background: (m.totalOccupiedPct ?? 0) > 90 ? 'var(--accent-rose)' : 'linear-gradient(90deg, #10B981, #06B6D4)',
                  borderRadius: '4px',
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Fila Auto-Criação</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
              {m.creationQueueCount ?? 0} grupos
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {launch.autoCreateEnabled ? `Gera novo ao atingir ${launch.autoCreateThresholdPercent}%` : 'Desativada'}
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Atividade 7 Dias</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '4px' }}>
              {m.recentActivity?.entries7d ?? 0} entradas
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {m.recentActivity?.clicks7d ?? 0} cliques registrados
            </div>
          </div>
        </div>
      </div>

      {/* 3 Gráficos: Entradas por dia, Taxa de Entrada, Taxa de Saída */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Gráfico 1: Entradas por dia */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>Entradas por Dia (14d)</span>
            <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>Volume</span>
          </div>
          <SimpleBarChart
            data={(m.entriesPerDay || []).map((e) => ({ label: e.date, value: e.count }))}
            color="var(--accent-green)"
            height={130}
          />
        </div>

        {/* Gráfico 2: Taxa de Entrada */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>Taxa de Entrada Diária (%)</span>
            <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>Ritmo</span>
          </div>
          <SimpleLineChart
            data={(m.entryRatePerDay || []).map((e) => ({ label: e.date, value: e.rate }))}
            strokeColor="#06B6D4"
            fillColor="rgba(6, 182, 212, 0.12)"
            height={130}
            valueSuffix="%"
          />
        </div>

        {/* Gráfico 3: Taxa de Saída */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>Taxa de Saída Diária (%)</span>
            <span className="badge badge-rose" style={{ fontSize: '0.7rem' }}>Churn</span>
          </div>
          <SimpleLineChart
            data={(m.exitRatePerDay || []).map((e) => ({ label: e.date, value: e.rate }))}
            strokeColor="#F43F5E"
            fillColor="rgba(244, 63, 94, 0.12)"
            height={130}
            valueSuffix="%"
          />
        </div>
      </div>
    </div>
  );
}
