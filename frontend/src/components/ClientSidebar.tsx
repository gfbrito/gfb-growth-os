import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Users2,
  MessageSquare,
  Video,
  Radio,
  Flame,
  CheckCircle2,
  ChevronRight,
  LogOut,
  Sparkles
} from 'lucide-react';

export type ClientNavTab = 'dashboard' | 'reports' | 'crm' | 'whatsapp' | 'media' | 'tasks';

interface ClientSidebarProps {
  activeTab: ClientNavTab;
  onSelectTab: (tab: ClientNavTab) => void;
  onSwitchToAgency?: () => void;
  isReceivingLeads?: boolean;
  onToggleReceivingLeads?: () => void;
  userRole?: 'MASTER_AGENCY' | 'CLIENT_OWNER' | 'CLIENT_ATTENDANT';
}

export function ClientSidebar({
  activeTab,
  onSelectTab,
  onSwitchToAgency,
  isReceivingLeads = true,
  onToggleReceivingLeads,
  userRole = 'MASTER_AGENCY',
}: ClientSidebarProps) {
  const allMenuItems = [
    {
      id: 'dashboard' as ClientNavTab,
      label: 'DASHBOARD',
      desc: 'Certeza Executiva & Metas',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'tasks' as ClientNavTab,
      label: 'MINI CLICKUP',
      desc: 'Tarefas, Subtarefas & Sprint',
      icon: Sparkles,
      badge: 'Mini ClickUp',
    },
    {
      id: 'reports' as ClientNavTab,
      label: 'RELATÓRIOS',
      desc: 'Funil & Fluxo de Retenção',
      icon: BarChart3,
      badge: 'CAPI',
    },
    {
      id: 'crm' as ClientNavTab,
      label: 'CRM',
      desc: 'Leads, Vendas & Importador',
      icon: Users2,
      badge: '4.081',
      sub: ['Leads & RFM', 'Vendas', 'Recuperação', 'Importar CSV'],
    },
    {
      id: 'whatsapp' as ClientNavTab,
      label: 'WHATSAPP',
      desc: 'Grupos, Chat & Aquecedor',
      icon: MessageSquare,
      badge: '26 GRP',
    },
    {
      id: 'media' as ClientNavTab,
      label: 'ESTÚDIO DE MÍDIA',
      desc: 'Legenda 9:16 & Transcriber',
      icon: Video,
      badge: 'FFmpeg',
    },
  ];

  const menuItems =
    userRole === 'CLIENT_ATTENDANT'
      ? allMenuItems.filter((i) => i.id === 'whatsapp')
      : allMenuItems;

  return (
    <aside
      style={{
        width: '280px',
        minWidth: '280px',
        background: 'rgba(11, 16, 29, 0.95)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 42px)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Client Brand & Status Header */}
      <div style={{ padding: '20px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Bruna"
            alt="Bruna Ortiz"
            style={{ width: '42px', height: '42px', borderRadius: '12px', border: '2px solid var(--accent-cyan)' }}
          />
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              Bruna Ortiz — PPP
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span className="badge badge-cyan" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                ENTERPRISE
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>SaaS Dedicado</span>
            </div>
          </div>
        </div>

        {/* System Health Indicators (padrão grupovip) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '6px 10px',
            borderRadius: '8px',
            fontSize: '0.7rem',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            marginBottom: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34D399' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
            API: Conectado
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34D399' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
            Worker: Conectado
          </div>
        </div>

        {/* Toggle RECEBENDO LEADS (padrão aquecedor) */}
        <button
          onClick={onToggleReceivingLeads}
          style={{
            width: '100%',
            background: isReceivingLeads ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${isReceivingLeads ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            borderRadius: '8px',
            padding: '7px 10px',
            color: isReceivingLeads ? '#34D399' : '#F87171',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s',
          }}
        >
          <Radio size={12} className={isReceivingLeads ? 'animate-pulse' : ''} />
          {isReceivingLeads ? 'RECEBENDO LEADS: ATIVO' : 'ATRIBUIÇÃO PAUSADA'}
        </button>
      </div>

      {/* Main Navigation List */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-dim)', padding: '0 8px 6px 8px', letterSpacing: '0.06em' }}>
          MENU DO CLIENTE
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <div key={item.id} style={{ marginBottom: '2px' }}>
              <button
                onClick={() => onSelectTab(item.id)}
                style={{
                  width: '100%',
                  background: isActive ? 'linear-gradient(90deg, rgba(6, 182, 212, 0.15), rgba(16, 185, 129, 0.08))' : 'transparent',
                  border: isActive ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid transparent',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      background: isActive ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isActive ? 'var(--accent-cyan)' : 'currentColor',
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: isActive ? 800 : 600, color: isActive ? '#fff' : 'inherit' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>{item.desc}</div>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`badge ${isActive ? 'badge-cyan' : 'badge-green'}`}
                    style={{ fontSize: '0.62rem', padding: '2px 6px' }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>

              {/* Sub-item indicators */}
              {isActive && item.sub && (
                <div style={{ margin: '6px 0 8px 46px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {item.sub.map((sub, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.65rem',
                        padding: '2px 6px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '4px',
                        color: 'var(--text-dim)',
                      }}
                    >
                      • {sub}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer Profile & Agency Switcher */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(6, 9, 17, 0.6)' }}>
        <button
          onClick={onSwitchToAgency}
          style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '8px 10px',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={13} color="var(--accent-green)" />
            Ver Portal da Agência (GFB)
          </span>
          <ChevronRight size={13} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)' }} />
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>Bruna Ortiz</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Infoprodutora Master</div>
            </div>
          </div>
          <button
            onClick={onSwitchToAgency}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              padding: '4px',
            }}
            title="Voltar ao portal da agência"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
