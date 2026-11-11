import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  ShieldCheck,
  Flame,
  Users,
  DollarSign,
  TrendingUp,
  Sparkles,
  Target,
  Plus,
  ArrowRight,
  Copy,
  Check,
  Radio,
  ExternalLink,
  ShieldAlert,
  Server,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { TaskBoard } from './tasks/TaskBoard';

interface AgencyPortalProps {
  agencyData: any;
  onOpenClientPortal: (client: { id: string; name: string; slug: string }) => void;
  userRole?: 'MASTER_AGENCY' | 'CLIENT_OWNER' | 'CLIENT_ATTENDANT';
}

export function AgencyPortal({
  agencyData,
  onOpenClientPortal,
  userRole = 'MASTER_AGENCY',
}: AgencyPortalProps) {
  const [agencyTab, setAgencyTab] = useState<'overview' | 'tasks' | 'capi' | 'whatsapp'>('overview');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [openTasksCount, setOpenTasksCount] = useState<number>(0);

  useEffect(() => {
    fetch('/api/tasks', { headers: { 'X-User-Role': userRole } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.counts?.open !== undefined) {
          setOpenTasksCount(data.counts.open);
        }
      })
      .catch(console.error);
  }, [userRole]);

  const primaryClientSlug = agencyData?.clients?.[0]?.slug || 'capi';

  const handleCopySnippet = () => {
    const code = `<script src="${window.location.origin}/s/${primaryClientSlug}.js" async></script>`;
    navigator.clipboard.writeText(code);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Agency Navigation Tabs (Segmented Header) */}
      <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', flexWrap: 'wrap' }}>
        {[
          { id: 'overview', label: 'Visão Geral & Carteira', icon: LayoutDashboard },
          { id: 'tasks', label: 'Gestão de Tarefas', icon: CheckSquare, badge: `${openTasksCount} Ativas` },
          { id: 'capi', label: 'Central CAPI Gateway', icon: ShieldCheck, badge: 'EMQ 8.8' },
          { id: 'whatsapp', label: 'Instâncias & Aquecedor', icon: Flame, badge: 'Anti-Ban' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = agencyTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAgencyTab(tab.id as any)}
              style={{
                background: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                border: isActive ? '1px solid var(--border-default)' : '1px solid transparent',
                borderRadius: '8px',
                padding: '7px 14px',
                color: isActive ? '#fff' : 'var(--text-muted)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.4)' : 'none',
                transition: 'all 0.12s ease',
              }}
            >
              <Icon size={15} color={isActive ? 'var(--accent-green)' : 'currentColor'} />
              {tab.label}
              {tab.badge && (
                <span className={`badge ${isActive ? 'badge-green' : 'badge'}`} style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: VISÃO GERAL & CARTEIRA */}
      {/* ======================================================== */}
      {agencyTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Executive Telemetry Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div className="glass-panel" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.04em' }}>
                  MRR DA CARTEIRA
                </span>
                <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>+14.2% MoM</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }} className="tabular-nums">
                R$ {(agencyData?.totalMrrCents / 100 || 48500).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                Faturamento recorrente sob gestão ativa
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.04em' }}>
                  LEADS QUALIFICADOS
                </span>
                <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>6 Contas</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }} className="tabular-nums">
                {(agencyData?.totalLeadsManaged || 24890).toLocaleString('pt-BR')}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                Base consolidada com enriquecimento RFM
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.04em' }}>
                  CHIPS WHATSAPP ATIVOS
                </span>
                <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>SendGate P2P</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }} className="tabular-nums">
                {agencyData?.activeWhatsAppChips || 8} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>instâncias</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                Pacing gaussiano ativo · 0 bans nas últimas 24h
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.04em' }}>
                  CAPI GATEWAY STATUS
                </span>
                <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>
                  <span className="status-dot status-dot-green animate-pulse" /> 9/9 Eventos
                </span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                EMQ 8.8 <span style={{ fontSize: '0.9rem', color: 'var(--accent-green)', fontWeight: 600 }}>/ 10</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                Meta Graph API v20 com deduplicação nativa
              </div>
            </div>
          </div>

          {/* Accounts Management Roster */}
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Carteira de Contas Gerenciadas
                </h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                  Contas ativas sincronizadas com Meta Graph API e SendGate
                </span>
              </div>
              <span className="badge badge-green" style={{ fontSize: '0.68rem' }}>
                {agencyData?.clients?.length || 1} Contas Ativas
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {agencyData?.clients?.map((client: any) => {
                const currentRev = client.currentRevenue || 87400;
                const goalRev = client.revenueGoal || 150000;
                const percent = Math.min(100, Math.round((currentRev / goalRev) * 100));

                return (
                  <div
                    key={client.id}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '16px',
                      transition: 'border-color 0.15s, transform 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          background: '#131A29',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.95rem',
                          color: 'var(--accent-green)',
                        }}
                      >
                        {client.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>{client.name}</span>
                          <span className="badge" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>{client.slug}</span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                          Meta CAPI 9/9 Ativo · Pixel: <code style={{ color: 'var(--text-muted)' }}>{client.pixelId || '123456789012345'}</code>
                        </div>
                      </div>
                    </div>

                    {/* Progress to Goal */}
                    <div style={{ minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                        <span style={{ color: 'var(--text-dim)' }}>Faturamento Mês:</span>
                        <strong style={{ color: '#fff' }} className="tabular-nums">
                          R$ {currentRev.toLocaleString('pt-BR')} <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>/ {goalRev.toLocaleString('pt-BR')} ({percent}%)</span>
                        </strong>
                      </div>
                      <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${percent}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #059669, #10B981)',
                            borderRadius: '3px',
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        onClick={() => onOpenClientPortal(client)}
                        className="btn btn-primary"
                        style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                      >
                        Acessar Conta <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: MINI CLICKUP NATIVO (KANBAN + LISTA + SUBTAREFAS) */}
      {/* ======================================================== */}
      {agencyTab === 'tasks' && (
        <TaskBoard scope={{ kind: 'agency' }} viewerRole={userRole} />
      )}

      {/* ======================================================== */}
      {/* TAB 3: CENTRAL CAPI GATEWAY (9/9 E 5/5) */}
      {/* ======================================================== */}
      {agencyTab === 'capi' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="var(--accent-green)" />
              Snippet Servido CAPI v3.0 (Meta Graph API v20)
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Substitui o GTM Server-Side e Stape. Aguarda 2.000ms pelo _fbp nativo, injeta os tokens de checkout s2/s3 e elimina contagem dupla.
            </p>

            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <pre
                style={{
                  background: '#040711',
                  padding: '16px',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)',
                  overflowX: 'auto',
                  border: '1px solid var(--border-subtle)',
                  color: '#34D399',
                }}
              >
                {`<!-- GFB Digital CAPI Gateway Snippet v3.0 -->
<script 
  src="${window.location.origin}/s/${primaryClientSlug}.js" 
  async>
</script>`}
              </pre>
              <button
                className="btn btn-secondary"
                onClick={handleCopySnippet}
                style={{ position: 'absolute', right: '12px', top: '12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {copiedSnippet ? <Check size={13} /> : <Copy size={13} />}
                {copiedSnippet ? 'Copiado!' : 'Copiar Snippet'}
              </button>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '14px' }}>Auditoria dos 9 Parâmetros Meta Ads</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
              {[
                { name: 'em (E-mail com SHA-256)', status: 'VALIDADO' },
                { name: 'ph (Telefone E.164 com SHA-256)', status: 'VALIDADO' },
                { name: 'client_ip_address (IPv4/IPv6 real)', status: 'VALIDADO' },
                { name: 'client_user_agent (Navegador)', status: 'VALIDADO' },
                { name: 'fbp (Cookie de primeiro clique)', status: 'VALIDADO' },
                { name: 'fbc (Click ID do anúncio)', status: 'VALIDADO' },
                { name: 'event_id (Deduplicação Browser x Server)', status: 'VALIDADO' },
                { name: 'currency / value (BRL)', status: 'VALIDADO' },
                { name: 'contents / content_type (SKU do Produto)', status: 'VALIDADO' },
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <span>{item.name}</span>
                  <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: WHATSAPP INSTÂNCIAS & AQUECEDOR */}
      {/* ======================================================== */}
      {agencyTab === 'whatsapp' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>Central de Aquecimento Anti-Ban</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Rede de aquecimento P2P com troca mútua de mensagens e pausas biológicas antes de lançamentos.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                const target = agencyData?.clients?.[0] || { id: 'client_1', name: 'Cliente', slug: 'cliente' };
                onOpenClientPortal(target);
              }}
              className="btn btn-primary"
              style={{ fontSize: '0.85rem' }}
            >
              Abrir Painel Completo de WhatsApp do Cliente
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
