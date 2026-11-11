import React, { useState, useEffect } from 'react';
import type { Launch } from './launchTypes';
import { fetchLaunches } from './launchApi';
import { LaunchCreateModal } from './modals/LaunchCreateModal';
import {
  Rocket,
  Plus,
  Search,
  ExternalLink,
  Copy,
  Check,
  Users,
  Layers,
  TrendingUp,
  Percent,
  Sparkles,
} from 'lucide-react';

interface LaunchListProps {
  clientId: string;
  onSelectLaunch: (launchId: string) => void;
  userRole?: string;
}

export function LaunchList({ clientId, onSelectLaunch }: LaunchListProps) {
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadLaunches = async () => {
    try {
      setLoading(true);
      const data = await fetchLaunches(clientId);
      setLaunches(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLaunches();
  }, [clientId]);

  const handleCopy = (e: React.MouseEvent, launch: Launch) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`http://localhost:3000/l/${launch.slug}`);
    setCopiedId(launch.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = launches.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.slug.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner and Action */}
      <div
        className="glass-panel"
        style={{
          padding: '22px 26px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(6, 182, 212, 0.05))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-green)',
            }}
          >
            <Rocket size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Lançamentos & Grupos VIP
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Roteador inteligente de tráfego (/l/:slug), criação em lote e proteção anti-ban.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
        >
          <Plus size={16} /> Novo Lançamento
        </button>
      </div>

      {/* Filter Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '380px' }}>
          <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Buscar lançamento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '34px', height: '36px', fontSize: '0.82rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'ACTIVE', label: 'Recebendo Leads' },
            { id: 'PAUSED', label: 'Pausados' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                border: 'none',
                background: statusFilter === tab.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                color: statusFilter === tab.id ? '#fff' : 'var(--text-dim)',
                fontWeight: statusFilter === tab.id ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Launch Cards */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          Carregando lançamentos...
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Nenhum lançamento encontrado.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {filtered.map((l) => {
            const isReceiving = l.status === 'ACTIVE';
            const currentMembers = l.currentMembers ?? 0;
            const maxMembers = l.maxMembers ?? 0;
            const pct = maxMembers > 0 ? Math.round((currentMembers / maxMembers) * 100) : 0;

            return (
              <div
                key={l.id}
                onClick={() => onSelectLaunch(l.id)}
                className="glass-panel"
                style={{
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, border-color 0.15s ease',
                  border: isReceiving ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-subtle)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = isReceiving ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-subtle)';
                }}
              >
                {/* Top: Name & Status */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.3 }}>
                      {l.name}
                    </h4>
                    <span
                      className={isReceiving ? 'badge badge-green' : 'badge badge-amber'}
                      style={{ fontSize: '0.68rem', flexShrink: 0 }}
                    >
                      {isReceiving ? 'Recebendo Leads' : 'Pausado'}
                    </span>
                  </div>

                  {l.description && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
                      {l.description}
                    </p>
                  )}
                </div>

                {/* Public Link Box */}
                <div
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <code style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)' }}>
                    /l/{l.slug}
                  </code>
                  <button
                    onClick={(e) => handleCopy(e, l)}
                    title="Copiar Link"
                    style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '2px' }}
                  >
                    {copiedId === l.id ? <Check size={13} color="var(--accent-green)" /> : <Copy size={13} />}
                  </button>
                </div>

                {/* Capacity Progress Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-dim)' }}>
                      {currentMembers.toLocaleString('pt-BR')} / {maxMembers.toLocaleString('pt-BR')} membros
                    </span>
                    <strong style={{ color: pct > 90 ? 'var(--accent-rose)' : 'var(--accent-green)' }}>
                      {pct}%
                    </strong>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, pct)}%`,
                        height: '100%',
                        background: pct > 90 ? 'var(--accent-rose)' : 'linear-gradient(90deg, #10B981, #06B6D4)',
                        borderRadius: '3px',
                      }}
                    />
                  </div>
                </div>

                {/* Footer KPI Row */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '8px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-subtle)',
                    fontSize: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.68rem' }}>GRUPOS</div>
                    <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{l.groupCount ?? 0}</strong>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.68rem' }}>LEADS</div>
                    <strong style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>{l.totalLeads ?? 0}</strong>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.68rem' }}>CONVERSÃO</div>
                    <strong style={{ color: 'var(--accent-green)', fontSize: '0.9rem' }}>{l.conversionRatePct ?? 0}%</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <LaunchCreateModal
        clientId={clientId}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(created) => {
          loadLaunches();
          onSelectLaunch(created.id);
        }}
      />
    </div>
  );
}
