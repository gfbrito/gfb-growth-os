import React, { useState, useEffect } from 'react';
import type { Launch, LaunchAnalytics } from '../launchTypes';
import { fetchLaunchAnalytics } from '../launchApi';
import { SimpleBarChart } from '../shared/SimpleBarChart';
import {
  TrendingUp,
  BarChart3,
  Users,
  Compass,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface AnalyticsTabProps {
  launch: Launch;
}

export function AnalyticsTab({ launch }: AnalyticsTabProps) {
  const [period, setPeriod] = useState<string>('7d');
  const [analytics, setAnalytics] = useState<LaunchAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    fetchLaunchAnalytics(launch.id, period)
      .then((data) => setAnalytics(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [launch.id, period]);

  if (loading && !analytics) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        Carregando análise avançada...
      </div>
    );
  }

  const a = analytics || {
    leads7d: 0,
    entriesToday: 0,
    exitsToday: 0,
    conversionRatePct: 0,
    hourlyFlow: [],
    utmSources: [],
    groupPerformance: [],
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header with Period Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>Inteligência de Tráfego & Grupos</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Métricas detalhadas de captação, distribuição horária e performance de origens de tráfego.
          </p>
        </div>

        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '4px', gap: '4px' }}>
          {[
            { id: '7d', label: 'Últimos 7 dias' },
            { id: '14d', label: '14 dias' },
            { id: '30d', label: '30 dias' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                border: 'none',
                background: period === p.id ? 'var(--accent-cyan)' : 'transparent',
                color: period === p.id ? '#090d16' : 'var(--text-muted)',
                fontWeight: period === p.id ? 750 : 500,
                cursor: 'pointer',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Leads Captados</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
            {a.leads7d}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px' }}>no período selecionado</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Entradas Hoje</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-green)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUpRight size={20} /> +{a.entriesToday}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px' }}>novos participantes</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Saídas Hoje</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-rose)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowDownRight size={20} /> -{a.exitsToday}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px' }}>abandono no WhatsApp</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Conversão Média</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '4px' }}>
            {a.conversionRatePct}%
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px' }}>clique / entrada</div>
        </div>
      </div>

      {/* Hourly Flow Chart */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} color="var(--accent-cyan)" />
            <span style={{ fontSize: '0.95rem', fontWeight: 750, color: '#fff' }}>Distribuição de Entradas por Horário</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Horário de Brasília (BRT)</span>
        </div>

        <SimpleBarChart
          data={(a.hourlyFlow || []).map((h) => ({ label: h.hour, value: h.count }))}
          color="var(--accent-cyan)"
          height={150}
        />
      </div>

      {/* Two Columns: Group Performance & UTM Sources */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Table 1: Group Performance */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} color="var(--accent-green)" />
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>Desempenho por Grupo</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>Grupo</th>
                  <th style={{ padding: '8px' }}>Membros</th>
                  <th style={{ padding: '8px' }}>Ocupação</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Saídas</th>
                </tr>
              </thead>
              <tbody>
                {(a.groupPerformance || []).map((grp) => (
                  <tr key={grp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 600, color: '#fff' }}>{grp.name}</td>
                    <td style={{ padding: '10px 8px' }}>{grp.memberCount} / {grp.maxMembers}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{ color: grp.occupancyPct > 90 ? 'var(--accent-rose)' : 'var(--accent-green)', fontWeight: 700 }}>
                        {grp.occupancyPct}%
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', color: 'var(--accent-rose)' }}>
                      -{grp.exitsCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: UTM Sources */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={16} color="var(--accent-purple)" />
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>Origem UTM (Fontes de Tráfego)</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>UTM Source</th>
                  <th style={{ padding: '8px' }}>Entradas</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Participação (%)</th>
                </tr>
              </thead>
              <tbody>
                {(a.utmSources || []).map((utm, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                      {utm.source || 'Direto / Sem UTM'}
                    </td>
                    <td style={{ padding: '10px 8px', color: '#fff', fontWeight: 700 }}>{utm.count}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', color: 'var(--accent-green)' }}>
                      {utm.pct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
