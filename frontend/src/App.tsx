import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  Radio,
  MessageSquare,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { AlertBanner } from './components/AlertBanner';
import { ClientSidebar, type ClientNavTab } from './components/ClientSidebar';
import { ClientDashboard } from './components/ClientDashboard';
import { ClientReports } from './components/ClientReports';
import { ClientCrm } from './components/ClientCrm';
import { ClientWhatsApp } from './components/ClientWhatsApp';
import { ClientMedia } from './components/ClientMedia';
import { AgencyPortal } from './components/AgencyPortal';

export function App() {
  const [activePortal, setActivePortal] = useState<'agency' | 'client'>('client');
  const [clientTab, setClientTab] = useState<ClientNavTab>('dashboard');

  // Agency data state
  const [agencyData, setAgencyData] = useState<any>(null);
  const [clientData, setClientData] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isReceivingLeads, setIsReceivingLeads] = useState(true);

  // Fetch initial mock/API data
  useEffect(() => {
    fetch('/api/dashboard/agency')
      .then((res) => res.json())
      .then((data) => setAgencyData(data))
      .catch((err) => console.error('Error fetching agency dashboard:', err));

    fetch('/api/dashboard/client/cli_bruna_ppp')
      .then((res) => res.json())
      .then((data) => setClientData(data))
      .catch((err) => console.error('Error fetching client dashboard:', err));

    fetch('/api/tasks')
      .then((res) => res.json())
      .then((data) => setTasks(data.tasks || []))
      .catch((err) => console.error('Error fetching tasks:', err));
  }, []);

  const handleCreateTask = (title: string, priority: string) => {
    const newTask = {
      id: `tsk_${Date.now()}`,
      title,
      status: 'TODO',
      priority,
      clientName: 'Bruna Ortiz - PPP',
      assigneeName: 'Arthur Gestor',
      assigneeAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arthur',
      timeEstimateMinutes: 60,
      labels: ['Novo'],
    };

    setTasks([newTask, ...tasks]);
  };

  const handleMoveTask = (taskId: string, newStatus: string) => {
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    }).catch((err) => console.error(err));
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Disconnected Chip Alert Banner (padrão aquecedor) */}
      <AlertBanner
        onResolve={() => {
          setActivePortal('client');
          setClientTab('whatsapp');
        }}
      />

      {/* Global Top Navbar */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(8, 12, 21, 0.95)',
          backdropFilter: 'blur(20px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10B981, #06B6D4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)',
              }}
            >
              <TrendingUp size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
                GFB <span style={{ color: 'var(--accent-green)' }}>GROWTH OS</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
                ALL-IN-ONE TRAFFIC, TRACKING & CRM
              </div>
            </div>
          </div>

          <div style={{ height: '24px', width: '1px', background: 'var(--border-subtle)' }} />

          {/* Dual View Toggle Switcher */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '4px',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              onClick={() => setActivePortal('client')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: activePortal === 'client' ? 'var(--accent-cyan)' : 'transparent',
                color: activePortal === 'client' ? '#080C15' : 'var(--text-muted)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <DollarSign size={14} />
              Painel do Cliente (Bruna Ortiz)
            </button>
            <button
              onClick={() => setActivePortal('agency')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: activePortal === 'agency' ? 'var(--accent-green)' : 'transparent',
                color: activePortal === 'agency' ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <LayoutDashboard size={14} />
              Portal da Agência (GFB Master)
            </button>
          </div>
        </div>

        {/* Right Status Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="badge badge-green">
            <Radio size={12} className="animate-pulse" />
            CAPI 9/9 Blindado (EMQ 8.8)
          </div>
          <div className="badge badge-cyan">
            <MessageSquare size={12} />
            SendGate Anti-Ban Ativo
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              paddingLeft: '8px',
              borderLeft: '1px solid var(--border-subtle)',
            }}
          >
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Gisley"
              alt="Avatar"
              style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--border-highlight)' }}
            />
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Gisley Fernandes</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Agency Owner</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {activePortal === 'client' ? (
        /* ======================================================== */
        /* PAINEL EXCLUSIVO DO CLIENTE (COM SIDEBAR DEDICADA) */
        /* ======================================================== */
        <div style={{ display: 'flex', flex: 1 }}>
          <ClientSidebar
            activeTab={clientTab}
            onSelectTab={setClientTab}
            onSwitchToAgency={() => setActivePortal('agency')}
            isReceivingLeads={isReceivingLeads}
            onToggleReceivingLeads={() => setIsReceivingLeads(!isReceivingLeads)}
          />

          <main style={{ flex: 1, padding: '28px', maxWidth: '1440px', width: '100%', margin: '0 auto', overflowY: 'auto' }}>
            {clientTab === 'dashboard' && (
              <ClientDashboard clientData={clientData} onNavigateToTab={setClientTab} />
            )}

            {clientTab === 'reports' && (
              <ClientReports />
            )}

            {clientTab === 'crm' && (
              <ClientCrm />
            )}

            {clientTab === 'whatsapp' && (
              <ClientWhatsApp />
            )}

            {clientTab === 'media' && (
              <ClientMedia />
            )}
          </main>
        </div>
      ) : (
        /* ======================================================== */
        /* PORTAL DA AGÊNCIA (GFB MASTER CLICKUP & CAPI GATEWAY) */
        /* ======================================================== */
        <main style={{ flex: 1, padding: '28px', maxWidth: '1600px', width: '100%', margin: '0 auto' }}>
          <AgencyPortal
            agencyData={agencyData}
            tasks={tasks}
            onMoveTask={handleMoveTask}
            onCreateTask={handleCreateTask}
            onOpenClientPortal={() => {
              setActivePortal('client');
              setClientTab('dashboard');
            }}
          />
        </main>
      )}
    </div>
  );
}

export default App;
