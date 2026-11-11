import React, { useState, useEffect } from 'react';
import type { Launch, LaunchParticipant } from '../launchTypes';
import { fetchLaunchLeads, enrichLeads } from '../launchApi';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Download,
  Flame,
  CheckCircle2,
  XCircle,
  Database,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface LeadsTabProps {
  launch: Launch;
  onOpenChatWithPhone?: (phone: string, name?: string) => void;
}

export function LeadsTab({ launch, onOpenChatWithPhone }: LeadsTabProps) {
  const [leads, setLeads] = useState<LaunchParticipant[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, active: 0, left: 0, hot: 0, enriched: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [enriching, setEnriching] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');

  const loadLeads = async () => {
    try {
      setLoading(true);
      const res = await fetchLaunchLeads(launch.id, {
        search: search || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        classification: classFilter !== 'ALL' ? classFilter : undefined,
      });
      setLeads(res.participants);
      setStats(res.stats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [launch.id, statusFilter, classFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadLeads();
  };

  const handleEnrich = async () => {
    try {
      setEnriching(true);
      const res = await enrichLeads(launch.id);
      alert(`Sincronização com CRM concluída! ${res.matchedCount} leads encontrados na base.`);
      loadLeads();
    } catch (e: any) {
      alert(e.message || 'Erro ao sincronizar com CRM');
    } finally {
      setEnriching(false);
    }
  };

  const handleExportCsv = () => {
    window.open(`/api/launches/${launch.id}/leads/export.csv`, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 5 KPI Mini Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total de Leads</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
            {(stats?.total ?? 0).toLocaleString('pt-BR')}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Leads Ativos</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-green)', marginTop: '4px' }}>
            {(stats?.active ?? 0).toLocaleString('pt-BR')}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Leads que Saíram</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-rose)', marginTop: '4px' }}>
            {(stats?.left ?? 0).toLocaleString('pt-BR')}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Leads Quentes</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '4px' }}>
            {(stats?.hot ?? 0).toLocaleString('pt-BR')}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Enriquecidos CRM</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '4px' }}>
            {(stats?.enriched ?? 0).toLocaleString('pt-BR')}
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px', maxWidth: '420px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Buscar por nome ou telefone..."
              className="input-field"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '36px', height: '38px', fontSize: '0.84rem' }}
            />
          </div>
          <button type="submit" className="btn btn-secondary" style={{ height: '38px', fontSize: '0.82rem' }}>
            Buscar
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <select
            className="input-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ height: '38px', fontSize: '0.82rem', width: 'auto' }}
          >
            <option value="ALL">Status: Todos</option>
            <option value="ACTIVE">Apenas Ativos</option>
            <option value="LEFT">Apenas Saídas</option>
          </select>

          <select
            className="input-field"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            style={{ height: '38px', fontSize: '0.82rem', width: 'auto' }}
          >
            <option value="ALL">Temperatura: Todas</option>
            <option value="HOT">🔥 Quente (HOT)</option>
            <option value="WARM">☀️ Morno (WARM)</option>
            <option value="COOL">❄️ Neutro (COOL)</option>
            <option value="COLD">🧊 Frio (COLD)</option>
          </select>

          <button
            onClick={handleEnrich}
            disabled={enriching}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', height: '38px' }}
          >
            <Database size={14} color="var(--accent-cyan)" />
            {enriching ? 'Cruzando com CRM...' : 'Sincronizar com CRM'}
          </button>

          <button
            onClick={handleExportCsv}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', height: '38px' }}
          >
            <Download size={14} /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            Carregando lista de leads...
          </div>
        ) : leads.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Nenhum lead encontrado com os filtros aplicados.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-dim)' }}>
                  <th style={{ padding: '12px 16px' }}>Lead</th>
                  <th style={{ padding: '12px 16px' }}>Temperatura</th>
                  <th style={{ padding: '12px 16px' }}>CRM Graph</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Entrada</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const isHot = lead.classification === 'HOT';
                  const isWarm = lead.classification === 'WARM';
                  const classBadge =
                    isHot ? 'badge badge-rose' : isWarm ? 'badge badge-amber' : 'badge badge-cyan';

                  return (
                    <tr key={lead.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#fff' }}>{lead.name || lead.phone}</div>
                        {lead.name && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{lead.phone}</div>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className={classBadge} style={{ fontSize: '0.7rem' }}>
                            {lead.classification}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                            {lead.engagementScore} pts
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        {lead.crmLead ? (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className="badge badge-green" style={{ fontSize: '0.68rem' }}>
                                {lead.crmLead.funnelStage || 'Cliente'}
                              </span>
                              {lead.crmLead.totalSpent && lead.crmLead.totalSpent > 0 && (
                                <span style={{ fontSize: '0.72rem', color: 'var(--accent-green)', fontWeight: 700 }}>
                                  R$ {Number(lead.crmLead.totalSpent || 0).toLocaleString('pt-BR')}
                                </span>
                              )}
                            </div>
                            {lead.crmLead.email && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                                {lead.crmLead.email}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Não vinculado</span>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span className={lead.status === 'ACTIVE' ? 'badge badge-green' : 'badge badge-rose'} style={{ fontSize: '0.7rem' }}>
                          {lead.status === 'ACTIVE' ? 'Ativo' : 'Saiu'}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                        {new Date(lead.joinedAt).toLocaleDateString('pt-BR')}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {onOpenChatWithPhone && (
                          <button
                            onClick={() => onOpenChatWithPhone(lead.phone, lead.name || undefined)}
                            title="Conversar no Chat Privado"
                            className="btn-icon"
                            style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--accent-cyan)', padding: '6px' }}
                          >
                            <MessageSquare size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
