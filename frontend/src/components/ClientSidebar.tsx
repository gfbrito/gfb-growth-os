import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Users2,
  Users,
  ShoppingBag,
  DollarSign,
  RotateCcw,
  Zap,
  MessageSquare,
  Megaphone,
  Upload,
  Repeat,
  Bell,
  Settings,
  Video,
  Radio,
  Flame,
  CheckCircle2,
  CheckSquare,
  Target,
  ChevronRight,
  ChevronDown,
  LogOut,
  Search,
  ArrowLeft,
} from 'lucide-react';
import type { CrmSubTab, WhatsAppSubTab } from '../types/crm';

function InstagramIcon({ size = 16, color = '#E1306C' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );
}

export type ClientNavTab = 'dashboard' | 'reports' | 'organic' | 'crm' | 'whatsapp' | 'media' | 'tasks';

interface ClientSidebarProps {
  activeTab: ClientNavTab;
  onSelectTab: (tab: ClientNavTab) => void;
  crmSubTab?: CrmSubTab;
  onSelectCrmSubTab?: (subTab: CrmSubTab) => void;
  whatsappSubTab?: WhatsAppSubTab;
  onSelectWhatsAppSubTab?: (subTab: WhatsAppSubTab) => void;
  onSwitchToAgency?: () => void;
  isReceivingLeads?: boolean;
  onToggleReceivingLeads?: () => void;
  userRole?: 'MASTER_AGENCY' | 'CLIENT_OWNER' | 'CLIENT_ATTENDANT';
  totalLeadsCount?: number;
  unreadNotificationsCount?: number;
  clientName?: string;
}

export const CRM_SUB_ITEMS: { id: CrmSubTab; label: string; icon: React.ComponentType<{ size?: number; color?: string; className?: string }>; badge?: string }[] = [
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'products', label: 'Produtos', icon: ShoppingBag },
  { id: 'sales', label: 'Vendas', icon: DollarSign },
  { id: 'recovery', label: 'Recuperação', icon: RotateCcw },
  { id: 'automations', label: 'Automações', icon: Zap },
  { id: 'conversionRules', label: 'Gatilhos de Conversão', icon: Target },
  { id: 'chat', label: 'Chat WhatsApp', icon: MessageSquare },
  { id: 'broadcasts', label: 'Mensagens em Massa', icon: Megaphone },
  { id: 'import', label: 'Importar CSV', icon: Upload },
  { id: 'subscriptions', label: 'Assinaturas', icon: Repeat },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export const WHATSAPP_SUB_ITEMS: { id: WhatsAppSubTab; label: string; icon: React.ComponentType<{ size?: number; color?: string; className?: string }>; badge?: string }[] = [
  { id: 'groups', label: 'Lançamentos', icon: Users },
  { id: 'chat', label: 'Chat WhatsApp (Inbox)', icon: MessageSquare },
  { id: 'heater', label: 'Chips & Anti-Ban SendGate', icon: Flame },
  { id: 'warming', label: 'Aquecimento P2P (Warming)', icon: Radio },
  { id: 'radar', label: 'LeadRadar B2B', icon: Search },
];

export function ClientSidebar({
  activeTab,
  onSelectTab,
  crmSubTab = 'leads',
  onSelectCrmSubTab,
  whatsappSubTab = 'groups',
  onSelectWhatsAppSubTab,
  onSwitchToAgency,
  isReceivingLeads = true,
  onToggleReceivingLeads,
  userRole = 'MASTER_AGENCY',
  totalLeadsCount,
  unreadNotificationsCount = 0,
  clientName = 'Cliente',
}: ClientSidebarProps) {
  const [isCrmExpanded, setIsCrmExpanded] = useState<boolean>(activeTab === 'crm');
  const [isWhatsAppExpanded, setIsWhatsAppExpanded] = useState<boolean>(activeTab === 'whatsapp');

  useEffect(() => {
    if (activeTab === 'crm') {
      setIsCrmExpanded(true);
      setIsWhatsAppExpanded(false);
    } else if (activeTab === 'whatsapp') {
      setIsWhatsAppExpanded(true);
      setIsCrmExpanded(false);
    } else {
      setIsCrmExpanded(false);
      setIsWhatsAppExpanded(false);
    }
  }, [activeTab]);

  const allMenuItems = [
    {
      id: 'dashboard' as ClientNavTab,
      label: 'VISÃO GERAL',
      desc: 'Performance & Metas',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'organic' as ClientNavTab,
      label: 'ORGÂNICO (IG)',
      desc: 'Métricas, Postagens & Fila',
      icon: InstagramIcon,
      badge: 'NOVO',
    },
    {
      id: 'tasks' as ClientNavTab,
      label: 'TAREFAS & SPRINT',
      desc: 'Quadro Operacional & Entregáveis',
      icon: CheckSquare,
      badge: null,
    },
    {
      id: 'reports' as ClientNavTab,
      label: 'RELATÓRIOS',
      desc: 'Funil & Atribuição CAPI',
      icon: BarChart3,
      badge: 'CAPI',
    },
    {
      id: 'crm' as ClientNavTab,
      label: 'CRM & VENDAS',
      desc: 'Funil, Automações & Disparos',
      icon: Users2,
      badge: totalLeadsCount !== undefined ? `${totalLeadsCount.toLocaleString('pt-BR')}` : undefined,
    },
    {
      id: 'whatsapp' as ClientNavTab,
      label: 'WHATSAPP',
      desc: 'Grupos, Chat & Aquecedor',
      icon: MessageSquare,
    },
    {
      id: 'media' as ClientNavTab,
      label: 'ESTÚDIO DE MÍDIA',
      desc: 'Legenda 9:16 & Transcrição',
      icon: Video,
      badge: 'FFmpeg',
    },
  ];

  const menuItems =
    userRole === 'CLIENT_ATTENDANT'
      ? allMenuItems.filter((i) => i.id === 'whatsapp')
      : allMenuItems;

  const handleMainMenuClick = (itemId: ClientNavTab) => {
    if (itemId === 'crm') {
      if (activeTab !== 'crm') {
        onSelectTab('crm');
        setIsCrmExpanded(true);
        setIsWhatsAppExpanded(false);
      } else {
        setIsCrmExpanded(!isCrmExpanded);
      }
    } else if (itemId === 'whatsapp') {
      if (activeTab !== 'whatsapp') {
        onSelectTab('whatsapp');
        setIsWhatsAppExpanded(true);
        setIsCrmExpanded(false);
      } else {
        setIsWhatsAppExpanded(!isWhatsAppExpanded);
      }
    } else {
      setIsCrmExpanded(false);
      setIsWhatsAppExpanded(false);
      onSelectTab(itemId);
    }
  };

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
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(clientName)}`}
            alt={clientName}
            style={{ width: '42px', height: '42px', borderRadius: '12px', border: '2px solid var(--accent-cyan)' }}
          />
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {clientName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span className="badge badge-cyan" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                ENTERPRISE
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>SaaS Dedicado</span>
            </div>
          </div>
        </div>

        {/* CAPI & WhatsApp Operational Status Chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              fontSize: '0.72rem',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
              <Radio size={12} color="var(--accent-green)" />
              Meta CAPI Gateway
            </span>
            <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>9/9 Ativo (EMQ 8.8)</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              fontSize: '0.72rem',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
              <Flame size={12} color="#F59E0B" />
              Score Aquecedor
            </span>
            <span style={{ color: '#F59E0B', fontWeight: 700 }}>88/100 (Seguro)</span>
          </div>
        </div>

        {/* Lead Intake Toggle */}
        <div
          style={{
            marginTop: '12px',
            padding: '8px 10px',
            background: isReceivingLeads ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${isReceivingLeads ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isReceivingLeads ? 'var(--accent-green)' : '#EF4444',
              }}
            />
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#fff' }}>
              {isReceivingLeads ? 'Recebendo Leads' : 'Entrada Pausada'}
            </span>
          </div>
          {onToggleReceivingLeads && (
            <button
              onClick={onToggleReceivingLeads}
              style={{
                background: 'transparent',
                border: 'none',
                color: isReceivingLeads ? 'var(--accent-green)' : '#EF4444',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {isReceivingLeads ? 'Pausar' : 'Ativar'}
            </button>
          )}
        </div>
      </div>

      {/* Main Navigation List */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-dim)', padding: '0 8px 6px 8px', letterSpacing: '0.06em' }}>
          MENU DO CLIENTE
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isCrmItem = item.id === 'crm';
          const isWhatsAppItem = item.id === 'whatsapp';

          return (
            <div key={item.id} style={{ marginBottom: '2px' }}>
              <button
                type="button"
                onClick={() => handleMainMenuClick(item.id)}
                aria-expanded={isCrmItem ? isCrmExpanded : isWhatsAppItem ? isWhatsAppExpanded : undefined}
                aria-controls={isCrmItem ? 'crm-submenu' : isWhatsAppItem ? 'whatsapp-submenu' : undefined}
                style={{
                  width: '100%',
                  background: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                  border: isActive ? '1px solid var(--border-default)' : '1px solid transparent',
                  borderLeft: isActive ? '3px solid var(--accent-cyan)' : '3px solid transparent',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  textAlign: 'left',
                  transition: 'all 0.12s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isActive ? 'var(--accent-cyan)' : 'currentColor',
                    }}
                  >
                    <Icon size={15} strokeWidth={isActive ? 2 : 1.75} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: isActive ? 700 : 600, color: isActive ? '#fff' : 'inherit' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '0.67rem', color: 'var(--text-dim)' }}>{item.desc}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {item.badge && (
                    <span
                      className={`badge ${isActive ? 'badge-cyan' : 'badge-green'}`}
                      style={{ fontSize: '0.62rem', padding: '2px 6px' }}
                    >
                      {item.badge}
                    </span>
                  )}
                  {(isCrmItem || isWhatsAppItem) && (
                    <ChevronDown
                      size={14}
                      style={{
                        transform: (isCrmItem && isCrmExpanded) || (isWhatsAppItem && isWhatsAppExpanded)
                          ? 'rotate(180deg)'
                          : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        color: isActive ? 'var(--accent-cyan)' : 'var(--text-dim)',
                      }}
                    />
                  )}
                </div>
              </button>

              {/* Expandable CRM Submenu */}
              {isCrmItem && isCrmExpanded && (
                <div
                  id="crm-submenu"
                  role="region"
                  aria-label="Submenu do CRM"
                  style={{
                    margin: '4px 0 8px 14px',
                    paddingLeft: '10px',
                    borderLeft: '2px solid rgba(6, 182, 212, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  {CRM_SUB_ITEMS.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = activeTab === 'crm' && crmSubTab === sub.id;
                    const notifBadge =
                      sub.id === 'notifications' && unreadNotificationsCount > 0
                        ? `${unreadNotificationsCount}`
                        : undefined;
                    const displayBadge = sub.badge || notifBadge;

                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          if (activeTab !== 'crm') onSelectTab('crm');
                          if (onSelectCrmSubTab) onSelectCrmSubTab(sub.id);
                        }}
                        style={{
                          width: '100%',
                          background: isSubActive ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                          border: isSubActive ? '1px solid rgba(6, 182, 212, 0.35)' : '1px solid transparent',
                          borderRadius: '8px',
                          padding: '7px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          color: isSubActive ? '#fff' : 'var(--text-muted)',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                          fontSize: '0.78rem',
                          fontWeight: isSubActive ? 700 : 500,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <SubIcon size={14} color={isSubActive ? 'var(--accent-cyan)' : 'currentColor'} />
                          <span style={{ color: isSubActive ? '#fff' : 'inherit' }}>{sub.label}</span>
                        </div>
                        {displayBadge && (
                          <span
                            className="badge badge-cyan"
                            style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: '4px' }}
                          >
                            {displayBadge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Expandable WhatsApp Submenu */}
              {isWhatsAppItem && isWhatsAppExpanded && (
                <div
                  id="whatsapp-submenu"
                  role="region"
                  aria-label="Submenu do WhatsApp"
                  style={{
                    margin: '4px 0 8px 14px',
                    paddingLeft: '10px',
                    borderLeft: '2px solid rgba(16, 185, 129, 0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  {WHATSAPP_SUB_ITEMS.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = activeTab === 'whatsapp' && whatsappSubTab === sub.id;

                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          if (activeTab !== 'whatsapp') onSelectTab('whatsapp');
                          if (onSelectWhatsAppSubTab) onSelectWhatsAppSubTab(sub.id);
                        }}
                        style={{
                          width: '100%',
                          background: isSubActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                          border: isSubActive ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid transparent',
                          borderRadius: '8px',
                          padding: '7px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          color: isSubActive ? '#fff' : 'var(--text-muted)',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                          fontSize: '0.78rem',
                          fontWeight: isSubActive ? 700 : 500,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <SubIcon size={14} color={isSubActive ? 'var(--accent-green)' : 'currentColor'} />
                          <span style={{ color: isSubActive ? '#fff' : 'inherit' }}>{sub.label}</span>
                        </div>
                        {sub.badge && (
                          <span
                            className="badge badge-green"
                            style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: '4px' }}
                          >
                            {sub.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer Profile & Agency Switcher */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(6, 9, 17, 0.6)' }}>
        {userRole === 'MASTER_AGENCY' && onSwitchToAgency && (
          <button
            onClick={onSwitchToAgency}
            style={{
              width: '100%',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              padding: '8px 10px',
              color: 'var(--accent-green)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={13} color="var(--accent-green)" />
              Voltar à Agência Master
            </span>
            <ChevronRight size={13} />
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: userRole === 'CLIENT_ATTENDANT' ? 'var(--accent-green)' : 'var(--accent-cyan)',
              }}
            />
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>
                {userRole === 'CLIENT_ATTENDANT'
                  ? 'Carla Atendente'
                  : userRole === 'CLIENT_OWNER'
                  ? clientName
                  : 'Gisley (Agência Master)'}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                {userRole === 'CLIENT_ATTENDANT'
                  ? 'Atendimento WhatsApp'
                  : userRole === 'CLIENT_OWNER'
                  ? 'Dona da Conta'
                  : 'Gestão Master'}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              if (userRole === 'MASTER_AGENCY' && onSwitchToAgency) {
                onSwitchToAgency();
              }
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: userRole === 'MASTER_AGENCY' ? 'pointer' : 'default',
              padding: '4px',
            }}
            title={userRole === 'MASTER_AGENCY' ? 'Voltar ao portal da agência' : 'Sessão ativa'}
          >
            {userRole === 'MASTER_AGENCY' ? <LogOut size={14} /> : <CheckCircle2 size={14} color="var(--accent-green)" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
