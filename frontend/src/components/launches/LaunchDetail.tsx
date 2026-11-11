import React, { useState, useEffect } from 'react';
import type { Launch, LaunchDetailTab } from './launchTypes';
import { getLaunch, updateLaunch } from './launchApi';
import { DashboardTab } from './tabs/DashboardTab';
import { GroupsTab } from './tabs/GroupsTab';
import { LeadsTab } from './tabs/LeadsTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import { InboxIaTab } from './tabs/InboxIaTab';
import { ActionsTab } from './tabs/ActionsTab';
import { MessagesTab } from './tabs/MessagesTab';
import { PrivateMessagesTab } from './tabs/PrivateMessagesTab';
import { IntegrationsTab } from './tabs/IntegrationsTab';
import { ConfigTab } from './tabs/ConfigTab';
import {
  ArrowLeft,
  Rocket,
  ExternalLink,
  Copy,
  Check,
  ToggleLeft,
  ToggleRight,
  LayoutDashboard,
  Users,
  BarChart3,
  Bot,
  Calendar,
  MessageSquare,
  Lock,
  Globe,
  Settings,
} from 'lucide-react';

interface LaunchDetailProps {
  launchId: string;
  onBack: () => void;
  onOpenChatWithPhone?: (phone: string, name?: string) => void;
}

export function LaunchDetail({ launchId, onBack, onOpenChatWithPhone }: LaunchDetailProps) {
  const [launch, setLaunch] = useState<Launch | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<LaunchDetailTab>(() => {
    return (sessionStorage.getItem(`launch_tab_${launchId}`) as LaunchDetailTab) || 'dashboard';
  });
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [togglingStatus, setTogglingStatus] = useState<boolean>(false);

  const loadLaunch = async () => {
    try {
      setLoading(true);
      const data = await getLaunch(launchId);
      setLaunch(data);
    } catch (e) {
      console.error(e);
      sessionStorage.removeItem('growth_selected_launch_id');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLaunch();
  }, [launchId]);

  const handleTabChange = (tab: LaunchDetailTab) => {
    setActiveTab(tab);
    sessionStorage.setItem(`launch_tab_${launchId}`, tab);
  };

  const publicUrl = launch ? `http://localhost:3000/l/${launch.slug}` : '';

  const handleCopyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleToggleStatus = async () => {
    if (!launch) return;
    try {
      setTogglingStatus(true);
      const nextStatus = launch.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      const updated = await updateLaunch(launch.id, { status: nextStatus });
      setLaunch(updated);
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status');
    } finally {
      setTogglingStatus(false);
    }
  };

  if (loading && !launch) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        Carregando lançamento...
      </div>
    );
  }

  if (!launch) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--accent-rose)', marginBottom: '16px' }}>Lançamento não encontrado ou indisponível.</p>
        <button
          onClick={() => {
            sessionStorage.removeItem('growth_selected_launch_id');
            onBack();
          }}
          className="btn btn-secondary"
        >
          Voltar para Lista
        </button>
      </div>
    );
  }

  const tabItems: Array<{ id: LaunchDetailTab; label: string; icon: any }> = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'groups', label: 'Grupos', icon: Users },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'analytics', label: 'Análise', icon: BarChart3 },
    { id: 'inbox', label: 'Atendimento IA', icon: Bot },
    { id: 'actions', label: 'Ações Agendadas', icon: Calendar },
    { id: 'messages', label: 'Mensagens', icon: MessageSquare },
    { id: 'private', label: 'Privado', icon: Lock },
    { id: 'integrations', label: 'Rastreamento & Webhooks', icon: Globe },
    { id: 'config', label: 'Configurações', icon: Settings },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '18px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          {/* Back button and title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={onBack}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '6px 12px' }}
            >
              <ArrowLeft size={15} /> Voltar aos Lançamentos
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  {launch.name}
                </h2>
                <span
                  className={launch.status === 'ACTIVE' ? 'badge badge-green' : 'badge badge-amber'}
                  style={{ fontSize: '0.72rem' }}
                >
                  {launch.status === 'ACTIVE' ? 'Recebendo Leads' : 'Pausado'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <code style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>/l/{launch.slug}</code>
                <button
                  onClick={handleCopyLink}
                  title="Copiar link"
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '2px' }}
                >
                  {copiedLink ? <Check size={13} color="var(--accent-green)" /> : <Copy size={13} />}
                </button>
                <a
                  href={`/l/${launch.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  title="Testar link público"
                  style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center' }}
                >
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </div>

          {/* Quick status switch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>Recebendo Leads</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                {launch.status === 'ACTIVE' ? 'Link rotativo aberto' : 'Página de pausa ativa'}
              </div>
            </div>

            <button
              onClick={handleToggleStatus}
              disabled={togglingStatus}
              className="btn-icon"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {launch.status === 'ACTIVE' ? (
                <ToggleRight size={34} color="var(--accent-green)" />
              ) : (
                <ToggleLeft size={34} color="var(--text-dim)" />
              )}
            </button>
          </div>
        </div>

        {/* 10 Subtabs Bar */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '12px',
          }}
        >
          {tabItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: isSelected ? 750 : 500,
                  background: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                  border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                  color: isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Active Tab */}
      <div>
        {activeTab === 'dashboard' && (
          <DashboardTab launch={launch} onLaunchUpdated={setLaunch} />
        )}
        {activeTab === 'groups' && (
          <GroupsTab launch={launch} onRefreshStats={loadLaunch} />
        )}
        {activeTab === 'leads' && (
          <LeadsTab launch={launch} onOpenChatWithPhone={onOpenChatWithPhone} />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsTab launch={launch} />
        )}
        {activeTab === 'inbox' && (
          <InboxIaTab launch={launch} onLaunchUpdated={setLaunch} />
        )}
        {activeTab === 'actions' && (
          <ActionsTab launch={launch} />
        )}
        {activeTab === 'messages' && (
          <MessagesTab launch={launch} />
        )}
        {activeTab === 'private' && (
          <PrivateMessagesTab launch={launch} />
        )}
        {activeTab === 'integrations' && (
          <IntegrationsTab launch={launch} onLaunchUpdated={setLaunch} />
        )}
        {activeTab === 'config' && (
          <ConfigTab launch={launch} onLaunchUpdated={setLaunch} onDeleted={onBack} />
        )}
      </div>
    </div>
  );
}
