import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  LayoutDashboard,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { AlertBanner } from './components/AlertBanner';
import { ClientList } from './components/ClientList';
import { ClientRegistration } from './components/ClientRegistration';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ClientSidebar, type ClientNavTab } from './components/ClientSidebar';
import { OrganicPanel } from './components/organic/OrganicPanel';
import { ClientDashboard } from './components/ClientDashboard';
import { ClientReports } from './components/ClientReports';
import { ClientCrm } from './components/ClientCrm';
import { ClientWhatsApp } from './components/ClientWhatsApp';
import { ClientMedia } from './components/ClientMedia';
import { ClientMiniClickUp } from './components/ClientMiniClickUp';
import type { CrmSubTab, WhatsAppSubTab } from './types/crm';

type AgencyView = 'clients' | 'new-client' | 'edit-client' | 'client-portal';

export function App() {
  const [userRole, setUserRole] = useState<'MASTER_AGENCY' | 'CLIENT_OWNER' | 'CLIENT_ATTENDANT'>('MASTER_AGENCY');
  const [agencyView, setAgencyView] = useState<AgencyView>('client-portal');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [activeClient, setActiveClient] = useState<any>(null);

  // Client Portal Tabs
  const [clientTab, setClientTab] = useState<ClientNavTab>('organic');
  const [crmSubTab, setCrmSubTab] = useState<CrmSubTab>('leads');
  const [whatsappSubTab, setWhatsappSubTab] = useState<WhatsAppSubTab>('groups');

  // Load clients on initial mount
  useEffect(() => {
    fetch('/api/clients')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.clients || []);
        if (list.length > 0 && !activeClient) {
          const defaultClient = list.find((c: any) => c.slug?.includes('ar-advocacia')) || list[0];
          setActiveClient(defaultClient);
        }
      })
      .catch((err) => console.error('Error fetching clients:', err));
  }, []);

  const handleRoleChange = (role: 'MASTER_AGENCY' | 'CLIENT_OWNER' | 'CLIENT_ATTENDANT') => {
    setUserRole(role);
  };

  const handleClientSaved = () => {
    fetch('/api/clients')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.clients || []);
        if (list.length > 0) {
          setActiveClient(list[0]);
        }
        setAgencyView('clients');
      });
  };

  const handleOpenClientPortal = (client: any, tab: ClientNavTab = 'organic') => {
    fetch(`/api/clients/${client.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setActiveClient(d?.client || client);
        setClientTab(tab);
        setAgencyView('client-portal');
      })
      .catch(() => {
        setActiveClient(client);
        setClientTab(tab);
        setAgencyView('client-portal');
      });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-canvas)' }}>
      {/* Top Alert Banner */}
      <AlertBanner onResolve={() => {}} />

      {/* Global Top Navbar (Dark GFB Theme) */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(9, 13, 20, 0.95)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Logo Mark */}
          <div
            onClick={() => setAgencyView('clients')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#0F1626',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
              }}
            >
              <TrendingUp size={17} color="var(--accent-green)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 800, fontSize: '0.98rem', letterSpacing: '-0.02em', color: '#fff' }}>
                  GFB <span style={{ color: 'var(--accent-green)' }}>GROWTH OS</span>
                </span>
                <span className="badge" style={{ fontSize: '0.62rem', padding: '1px 5px', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.04)' }}>
                  v2.4
                </span>
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.04em', fontWeight: 500 }}>
                TRAFFIC · CAPI GATEWAY · CRM · ORGANIC
              </div>
            </div>
          </div>

          <div style={{ height: '20px', width: '1px', background: 'var(--border-subtle)' }} />

          {/* Active Section Indicator & Breadcrumbs */}
          {agencyView === 'client-portal' && activeClient ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setAgencyView('clients')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94A3B8',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={13} />
                Clientes
              </button>
              <ChevronRight size={13} color="#64748B" />
              <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#F1F5F9' }}>
                {activeClient.tradeName || activeClient.name}
              </span>
              <ChevronRight size={13} color="#64748B" />
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: clientTab === 'organic' ? '#F472B6' : 'var(--accent-cyan)',
                  background: clientTab === 'organic' ? 'rgba(244, 114, 182, 0.15)' : 'rgba(56, 189, 248, 0.12)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                {clientTab === 'organic' ? 'ORGÂNICO (INSTAGRAM)' : clientTab.toUpperCase()}
              </span>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 14px',
                background: 'rgba(14, 165, 233, 0.08)',
                border: '1px solid rgba(14, 165, 233, 0.2)',
                borderRadius: '6px',
              }}
            >
              <LayoutDashboard size={14} color="#0EA5E9" />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#F8FAFC' }}>
                Portal da Agência · Carteira de Clientes
              </span>
            </div>
          )}
        </div>

        {/* Right Status & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="badge badge-green" title="Meta Conversions API">
            <span className="status-dot status-dot-green animate-pulse" />
            CAPI 9/9 · EMQ 8.8
          </div>
          <div className="badge badge-cyan" title="Anti-Ban SendGate">
            <span className="status-dot" style={{ background: '#0EA5E9' }} />
            SendGate P2P
          </div>

          {/* Role Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '8px', borderLeft: '1px solid var(--border-subtle)' }}>
            <select
              value={userRole}
              onChange={(e) => handleRoleChange(e.target.value as any)}
              style={{
                background: '#0B0F19',
                color: '#E2E8F0',
                border: '1px solid var(--border-default)',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <option value="MASTER_AGENCY">Agência (Master)</option>
              <option value="CLIENT_OWNER">Cliente (Dono)</option>
              <option value="CLIENT_ATTENDANT">Atendente (WhatsApp)</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {agencyView === 'client-portal' && activeClient ? (
        <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 58px)' }}>
          {/* Client Left Navigation Sidebar */}
          <ClientSidebar
            activeTab={clientTab}
            onSelectTab={setClientTab}
            crmSubTab={crmSubTab}
            onSelectCrmSubTab={setCrmSubTab}
            whatsappSubTab={whatsappSubTab}
            onSelectWhatsAppSubTab={setWhatsappSubTab}
            clientName={activeClient.tradeName || activeClient.name}
            onSwitchToAgency={() => setAgencyView('clients')}
            userRole={userRole}
          />

          {/* Client Main Workspace */}
          <main style={{ flex: 1, padding: '24px 28px', overflowY: 'auto', background: 'var(--bg-canvas)' }}>
            <ErrorBoundary>
              {clientTab === 'organic' && (
                <OrganicPanel client={activeClient} />
              )}
              {clientTab === 'dashboard' && (
                <ClientDashboard
                  clientData={{}}
                  clientName={activeClient.tradeName || activeClient.name}
                  onNavigateToTab={(tab: ClientNavTab) => setClientTab(tab)}
                />
              )}
              {clientTab === 'reports' && (
                <ClientReports clientId={activeClient.id} />
              )}
              {clientTab === 'crm' && (
                <ClientCrm
                  clientId={activeClient.id}
                  clientName={activeClient.tradeName || activeClient.name}
                  userRole={userRole}
                  subTab={crmSubTab}
                  onChangeSubTab={setCrmSubTab}
                />
              )}
              {clientTab === 'whatsapp' && (
                <ClientWhatsApp
                  subTab={whatsappSubTab}
                  onChangeSubTab={setWhatsappSubTab}
                />
              )}
              {clientTab === 'media' && (
                <ClientMedia />
              )}
              {clientTab === 'tasks' && (
                <ClientMiniClickUp
                  clientId={activeClient.id}
                  clientName={activeClient.tradeName || activeClient.name}
                  userRole={userRole}
                />
              )}
            </ErrorBoundary>
          </main>
        </div>
      ) : (
        <main style={{ flex: 1, padding: '32px 28px' }}>
          <ErrorBoundary>
            {agencyView === 'clients' && (
              <ClientList
                onNewClient={() => {
                  setSelectedClientId(null);
                  setAgencyView('new-client');
                }}
                onSelectClient={(client) => {
                  setSelectedClientId(client.id);
                  setAgencyView('edit-client');
                }}
                onOpenOrganic={(client) => {
                  handleOpenClientPortal(client, 'organic');
                }}
              />
            )}
            {agencyView === 'new-client' && (
              <ClientRegistration
                onClientCreated={handleClientSaved}
                onCancel={() => setAgencyView('clients')}
              />
            )}
            {agencyView === 'edit-client' && (
              <ClientRegistration
                clientId={selectedClientId}
                onClientCreated={handleClientSaved}
                onCancel={() => {
                  setSelectedClientId(null);
                  setAgencyView('clients');
                }}
              />
            )}
          </ErrorBoundary>
        </main>
      )}
    </div>
  );
}

export default App;
