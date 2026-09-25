import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  ShieldCheck,
  MessageSquare,
  Flame,
  Video,
  Users,
  TrendingUp,
  DollarSign,
  Target,
  Sparkles,
  Copy,
  Check,
  Plus,
  ArrowRight,
  ExternalLink,
  Radio
} from 'lucide-react';

export function App() {
  const [activePortal, setActivePortal] = useState<'agency' | 'client'>('agency');
  const [agencyTab, setAgencyTab] = useState<'overview' | 'tasks' | 'capi' | 'whatsapp' | 'launches'>('overview');

  // Agency data state
  const [agencyData, setAgencyData] = useState<any>(null);
  const [clientData, setClientData] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('NORMAL');

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

  const handleCopySnippet = () => {
    const code = `<script src="${window.location.origin}/s/brunaortiz_ppp.js" async></script>`;
    navigator.clipboard.writeText(code);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask = {
      id: `tsk_${Date.now()}`,
      title: newTaskTitle,
      status: 'TODO',
      priority: newTaskPriority,
      clientName: 'Bruna Ortiz - PPP',
      assigneeName: 'Arthur Gestor',
      assigneeAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arthur',
      timeEstimateMinutes: 60,
      labels: ['Novo'],
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    setShowNewTaskModal(false);
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
      {/* Top Navbar */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(8, 12, 21, 0.85)',
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
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
                ALL-IN-ONE TRAFFIC & INTELLIGENCE
              </div>
            </div>
          </div>

          <div
            style={{
              height: '24px',
              width: '1px',
              background: 'var(--border-subtle)',
            }}
          />

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
              Portal da Agência
            </button>
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
              Portal do Cliente (Bruna Ortiz)
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

      {/* Main Body Content */}
      <main style={{ flex: 1, padding: '24px', maxWidth: '1600px', width: '100%', margin: '0 auto' }}>
        {activePortal === 'agency' ? (
          /* ======================================================== */
          /* PORTAL DA AGÊNCIA (FOCO: PRIORIDADE, TAREFAS, DIAGNÓSTICO) */
          /* ======================================================== */
          <div>
            {/* Agency Tabs */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '14px',
                marginBottom: '24px',
              }}
            >
              {[
                { id: 'overview', label: 'Visão Geral & Carteira', icon: LayoutDashboard },
                { id: 'tasks', label: 'Quadro de Tarefas (ClickUp)', icon: CheckSquare },
                { id: 'capi', label: 'Central CAPI & Snippets', icon: ShieldCheck },
                { id: 'whatsapp', label: 'WhatsApp & Aquecedor Anti-Ban', icon: Flame },
                { id: 'launches', label: 'Grupos & Lançamentos (SendFlow)', icon: Users },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = agencyTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setAgencyTab(tab.id as any)}
                    style={{
                      background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                      border: isActive ? '1px solid var(--border-highlight)' : '1px solid transparent',
                      color: isActive ? '#fff' : 'var(--text-muted)',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={16} color={isActive ? 'var(--accent-green)' : 'currentColor'} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* TAB 1: OVERVIEW */}
            {agencyTab === 'overview' && (
              <div>
                {/* Macro KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>FATURAMENTO CONSOLIDADO</span>
                      <DollarSign size={18} color="var(--accent-green)" />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>R$ 229.400,00</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent-green)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <TrendingUp size={14} /> +24% em relação ao mês anterior
                    </div>
                  </div>

                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>VENDAS HOJE (CHECKOUTS)</span>
                      <Sparkles size={18} color="var(--accent-cyan)" />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>R$ 21.470,00</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', marginTop: '4px' }}>
                      18 compras aprovadas (Kiwify & Hotmart)
                    </div>
                  </div>

                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>META DA CARTEIRA</span>
                      <Target size={18} color="var(--accent-amber)" />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>65,5% atingido</div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
                      <div style={{ width: '65.5%', height: '100%', background: 'linear-gradient(90deg, #F59E0B, #10B981)', borderRadius: '3px' }} />
                    </div>
                  </div>

                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>ESTEIRAS CAPI ATIVAS</span>
                      <ShieldCheck size={18} color="var(--accent-purple)" />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>99,98% taxa de dedup</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Zero duplicidade navegador/servidor
                    </div>
                  </div>
                </div>

                {/* Clients Table / Cards */}
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} color="var(--accent-green)" />
                  Saúde das Contas da Carteira
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '16px' }}>
                  {agencyData?.clients?.map((client: any) => (
                    <div key={client.id} className="glass-panel" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                        <div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{client.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Gestor responsável: {client.assignedGestor}</div>
                        </div>
                        <span className="badge badge-green">{client.healthStatus}</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '10px' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Faturamento Mês</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                            R$ {client.currentRevenue.toLocaleString('pt-BR')}
                          </div>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '10px' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Hoje</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                            R$ {client.todayRevenue.toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </div>

                      <div style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Progresso da Meta (R$ {client.revenueGoal.toLocaleString('pt-BR')})</span>
                          <span style={{ fontWeight: 700 }}>{client.progressPct}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${client.progressPct}%`, height: '100%', background: 'linear-gradient(90deg, #10B981, #06B6D4)' }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{client.pendingTasks} tarefas pendentes no ClickUp</span>
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            setActivePortal('client');
                          }}
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        >
                          Acessar Visão do Cliente <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: CLICKUP STYLE TASKS */}
            {agencyTab === 'tasks' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Workspace de Tarefas da Agência (ClickUp Style)</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Gestão de rotinas de tráfego, criativos, validações de CAPI e lançamentos.
                    </p>
                  </div>
                  <button className="btn btn-primary" onClick={() => setShowNewTaskModal(true)}>
                    <Plus size={16} /> Nova Tarefa
                  </button>
                </div>

                {/* Kanban Board */}
                <div className="kanban-board">
                  {[
                    { id: 'TODO', title: 'A Fazer', color: 'var(--accent-amber)' },
                    { id: 'IN_PROGRESS', title: 'Em Execução', color: 'var(--accent-cyan)' },
                    { id: 'REVIEW', title: 'Em Revisão', color: 'var(--accent-purple)' },
                    { id: 'DONE', title: 'Concluído', color: 'var(--accent-green)' },
                  ].map((col) => {
                    const colTasks = tasks.filter((t) => t.status === col.id);
                    return (
                      <div key={col.id} className="kanban-col">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: col.color, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                            {col.title}
                          </span>
                          <span className="badge" style={{ background: 'rgba(255,255,255,0.06)' }}>{colTasks.length}</span>
                        </div>

                        <div style={{ flex: 1 }}>
                          {colTasks.map((task) => (
                            <div key={task.id} className="task-card">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                <span className={`badge ${task.priority === 'URGENT' ? 'badge-rose' : task.priority === 'HIGH' ? 'badge-amber' : 'badge-cyan'}`} style={{ fontSize: '0.65rem' }}>
                                  {task.priority}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{task.timeEstimateMinutes}m</span>
                              </div>

                              <div style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>{task.title}</div>
                              {task.descriptionMarkdown && (
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                                  {task.descriptionMarkdown}
                                </p>
                              )}

                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                                {task.labels?.map((lbl: string, idx: number) => (
                                  <span key={idx} style={{ fontSize: '0.68rem', padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', color: 'var(--text-dim)' }}>
                                    #{lbl}
                                  </span>
                                ))}
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <img src={task.assigneeAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gisley'} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{task.clientName}</span>
                                </div>

                                {/* Quick Move Select */}
                                <select
                                  value={task.status}
                                  onChange={(e) => handleMoveTask(task.id, e.target.value)}
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    color: '#fff',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: '6px',
                                    fontSize: '0.7rem',
                                    padding: '2px 6px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <option value="TODO">A Fazer</option>
                                  <option value="IN_PROGRESS">Execução</option>
                                  <option value="REVIEW">Revisão</option>
                                  <option value="DONE">Concluído</option>
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: CAPI & TRACKING */}
            {agencyTab === 'capi' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={20} color="var(--accent-green)" />
                    Snippet CAPI v3.0 (Meta Graph API v20)
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Este código substitui completamente o GTM Server-Side e Stape. Aguarda até 2.000ms pelo _fbp, injeta os tokens de checkout s2/s3 e garante deduplicação precisa com EMQ 8.8+.
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
                      {`<!-- GFB Digital CAPI Gateway Snippet -->
<script 
  src="${window.location.origin}/s/brunaortiz_ppp.js" 
  async>
</script>`}
                    </pre>
                    <button
                      className="btn btn-secondary"
                      onClick={handleCopySnippet}
                      style={{ position: 'absolute', top: '10px', right: '10px', padding: '6px 12px', fontSize: '0.75rem' }}
                    >
                      {copiedSnippet ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                      {copiedSnippet ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>

                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--accent-green)', marginBottom: '6px' }}>
                      ✓ Proteção contra Sequestro de Clique Ativa
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      O token de intenção de compra nasce no carregamento da página e viaja silenciosamente nas URLs do checkout da Kiwify e Hotmart. Se o comprador abrir em nova aba, a atribuição é mantida com 100% de precisão.
                    </p>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '14px' }}>Diagnóstico de Prontidão (9/9)</h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { item: 'Espera do _fbp nativo (2.000ms)', status: 'OK' },
                      { item: 'Geração de _fbc a partir do fbclid', status: 'OK' },
                      { item: 'Deduplicação de event_id browser/server', status: 'OK' },
                      { item: 'Indexador s2/s3 no checkout Kiwify', status: 'OK' },
                      { item: 'Lock transacional contra duplo Order Bump', status: 'OK' },
                      { item: 'Circuit Breaker da Meta Graph API', status: 'OK' },
                      { item: 'Redação de CPF e PII sensíveis (LGPD)', status: 'OK' },
                      { item: 'Normalização do 9º dígito BR (+55)', status: 'OK' },
                      { item: 'Nota de correspondência Meta (EMQ > 8.5)', status: 'OK' },
                    ].map((row, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                        }}
                      >
                        <span>{row.item}</span>
                        <span className="badge badge-green">{row.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: WHATSAPP & AQUECEDOR */}
            {agencyTab === 'whatsapp' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>WhatsApp Master Agência</div>
                      <span className="badge badge-green">Conectado</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '14px' }}>Instância: gfb_master_01 (+55 11 99999-0001)</div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Score de Aquecimento</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-green)' }}>92/100</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--accent-green)' }}>Chip Quente (Veterano)</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Risco de Banimento</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>4%</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--accent-cyan)' }}>Nível Seguro</div>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Disparos hoje: <strong>42 / 150</strong> (Cap diário com coffee breaks de 30s)
                    </div>
                  </div>

                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>Atendimento Bruna Ortiz</div>
                      <span className="badge badge-green">Conectado</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '14px' }}>Instância: aqc_bruna_01 (+55 11 99999-0002)</div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Score de Aquecimento</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-green)' }}>84/100</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--accent-green)' }}>Chip Quente</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Risco de Banimento</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>8%</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--accent-cyan)' }}>Nível Seguro</div>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Disparos hoje: <strong>26 / 80</strong> (Régua de recuperação ativa)
                    </div>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '10px' }}>O Que Torna o SendGate Anti-Ban Único?</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    Diferente de disparadores comuns, nosso motor combina <strong>jitter gaussiano (1.5s a 3.5s)</strong>, pausas automáticas (*coffee breaks* de 20-40s a cada 25 envios) e uma rede peer-to-peer de aquecimento cruzado com frases coloquiais reais em PT-BR. Se o score de risco do chip subir para 70%, o sistema coloca o número em quarentena preventiva instantânea para não perder a esteira.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 5: LAUNCHES & GROUPS */}
            {agencyTab === 'launches' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span className="badge badge-purple">Lançamento Meteórico</span>
                      <span className="badge badge-green">96% Ocupado</span>
                    </div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>Bruna Ortiz - Turma Outubro VIP</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                      Redirecionamento dinâmico entre grupos de WhatsApp e Telegram por lotação de vagas.
                    </p>

                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                        <span>Lotação do Grupo 4</span>
                        <strong>984 / 1.024 membros</strong>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: '96%', height: '100%', background: 'linear-gradient(90deg, #8B5CF6, #06B6D4)' }} />
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', marginTop: '8px' }}>
                        ✓ Fila de criação rate-limited pronta para acionar o Grupo 5 automaticamente ao bater 1.000 membros.
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <a href="/l/bruna-vip" target="_blank" rel="noreferrer" className="btn btn-primary" style={{ flex: 1, textDecoration: 'none' }}>
                        Testar Link Inteligente (/l/bruna-vip) <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ======================================================== */
          /* PORTAL DO CLIENTE (FOCO: CERTEZA, FATURAMENTO, ROI, VÍDEO) */
          /* ======================================================== */
          <div>
            {/* Executive Welcome & Certainty Banner */}
            <div
              className="glass-panel"
              style={{
                padding: '24px 30px',
                marginBottom: '24px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.08))',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--accent-green)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    CERTEZA DE RESULTADO
                  </div>
                  <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '4px 0' }}>
                    Olá, Bruna Ortiz! Aqui está o resultado da sua operação.
                  </h1>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                    {clientData?.executiveSummary?.headline || 'Operação em ritmo acelerado com vendas comprovadas.'}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Velocidade do Faturamento</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                    R$ {clientData?.executiveSummary?.currentDailyPace?.toLocaleString('pt-BR') || '3.496'}/dia
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Big Numbers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>FATURADO HOJE</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-green)', margin: '6px 0' }}>
                  R$ {clientData?.executiveSummary?.todayRevenue?.toLocaleString('pt-BR') || '8.970,00'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Vendas aprovadas no checkout da Kiwify</div>
              </div>

              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL ACUMULADO NO MÊS</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: '6px 0' }}>
                  R$ {clientData?.executiveSummary?.currentRevenue?.toLocaleString('pt-BR') || '87.400,00'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>88 pedidos confirmados</div>
              </div>

              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>META DO MÊS</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-amber)', margin: '6px 0' }}>
                  R$ {clientData?.executiveSummary?.revenueGoal?.toLocaleString('pt-BR') || '150.000,00'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  58% atingido (restam R$ 62.600)
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>RITMO NECESSÁRIO</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-cyan)', margin: '6px 0' }}>
                  R$ {clientData?.executiveSummary?.requiredDailyPace?.toLocaleString('pt-BR') || '12.520'}/dia
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Para bater a meta até o último dia</div>
              </div>
            </div>

            {/* Sales Feed & Temperature Split */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', marginBottom: '24px' }}>
              {/* Sales Feed */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DollarSign size={18} color="var(--accent-green)" />
                  Vendas Aprovadas em Tempo Real
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {clientData?.recentSales?.map((sale: any) => (
                    <div
                      key={sale.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{sale.leadName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {sale.productName} • Origem: <span style={{ color: 'var(--accent-cyan)' }}>{sale.adCampaignName || 'Tráfego Pago CAPI'}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                          R$ {sale.grossAmount?.toLocaleString('pt-BR')}
                        </div>
                        <span className="badge badge-green" style={{ fontSize: '0.62rem' }}>
                          ✓ CAPI ENVIADO
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lead Temperature CRM */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Flame size={18} color="var(--accent-amber)" />
                  Temperatura da Sua Base de Leads
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, color: '#F87171' }}>🔥 Leads Quentes (Prontos pra Comprar)</span>
                      <strong style={{ fontSize: '1.1rem' }}>{clientData?.temperatureBreakdown?.hot || 2}</strong>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Interagiram nos últimos 30 dias ou têm mais de 200 pontos RFM no CRM.
                    </p>
                  </div>

                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, color: '#FBBF24' }}>⚡ Leads Mornos</span>
                      <strong style={{ fontSize: '1.1rem' }}>{clientData?.temperatureBreakdown?.warm || 1}</strong>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Geraram PIX ou carrinho nos últimos 90 dias. Régua de recuperação ativada.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Video & Audio AI Tools Section */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Video size={20} color="var(--accent-purple)" />
                    Suíte de Mídia & Inteligência de Vídeo
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Ferramentas gratuitas liberadas para a sua operação: legendas automáticas 9:16 estilo TikTok e diarização de oradores.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* 9:16 Video Captioner Preview */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Legenda Rápida 9:16 (Passagem Única FFmpeg)</span>
                    <span className="badge badge-purple">Renderizado</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    Reenquadramento vertical com fundo desfocado, corte de silêncio seco e destaque de palavra falada em verde.
                  </p>

                  <div
                    style={{
                      height: '180px',
                      background: '#040711',
                      borderRadius: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px dashed var(--border-subtle)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ textAlign: 'center', padding: '16px' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                        "Como blindar o <span style={{ color: '#10B981', background: 'rgba(16,185,129,0.2)', padding: '2px 6px', borderRadius: '4px' }}>rastreamento</span> no WhatsApp?"
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '8px' }}>
                        Duração: 0:58s • 1080×1920 • 6 silêncios removidos
                      </div>
                    </div>
                  </div>

                  <button className="btn btn-secondary" style={{ width: '100%', marginTop: '12px', fontSize: '0.8rem' }}>
                    Subir Novo Vídeo para Legendar
                  </button>
                </div>

                {/* Event Audio Diarization & Speaker Registry Preview */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Diarização & Reconhecimento de Oradores</span>
                    <span className="badge badge-cyan">WhisperX + PyAnnote</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    Processamento de áudios de mesa de som (3h+) com identificação de oradores cadastrados e rejeição de desconhecidos.
                  </p>

                  <div
                    style={{
                      background: '#040711',
                      borderRadius: '10px',
                      padding: '12px',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      lineHeight: 1.6,
                      maxHeight: '180px',
                      overflowY: 'auto',
                    }}
                  >
                    <div style={{ color: 'var(--accent-green)', fontWeight: 700 }}>[00:12:31] Gisley Fernandes (Confiança: 94%):</div>
                    <div style={{ color: '#fff', marginBottom: '8px' }}>"Agora vamos começar a próxima parte do encontro de tráfego avançado."</div>

                    <div style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>[00:12:44] Bruna Ortiz (Confiança: 91%):</div>
                    <div style={{ color: '#fff', marginBottom: '8px' }}>"Antes disso, eu queria fazer uma observação sobre a nossa oferta de abertura."</div>

                    <div style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>[00:13:05] ORADOR_DESCONHECIDO_01:</div>
                    <div style={{ color: '#fff' }}>"Vocês poderiam explicar como o Pixel e o CAPI se conversam no WhatsApp?"</div>
                  </div>

                  <button className="btn btn-secondary" style={{ width: '100%', marginTop: '12px', fontSize: '0.8rem' }}>
                    Exportar Ata para o n8n / LLM
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal for Creating New ClickUp Task */}
      {showNewTaskModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div className="glass-panel-elevated" style={{ width: '460px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '14px' }}>Nova Tarefa no ClickUp</h3>
            <form onSubmit={handleCreateTask}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Título da Tarefa</label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Ex: Subir campanha de escala no Meta Ads"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '10px',
                    color: '#fff',
                    fontSize: '0.88rem',
                  }}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Prioridade</label>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#0F172A',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '10px',
                    color: '#fff',
                    fontSize: '0.88rem',
                  }}
                >
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">Alta</option>
                  <option value="URGENT">Urgente</option>
                  <option value="LOW">Baixa</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewTaskModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Criar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
