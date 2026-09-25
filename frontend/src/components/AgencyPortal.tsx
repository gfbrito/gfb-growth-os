import React, { useState } from 'react';
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
  Server
} from 'lucide-react';

interface AgencyPortalProps {
  agencyData: any;
  tasks: any[];
  onMoveTask: (taskId: string, newStatus: string) => void;
  onCreateTask: (title: string, priority: string) => void;
  onOpenClientPortal: (clientId: string) => void;
}

export function AgencyPortal({
  agencyData,
  tasks,
  onMoveTask,
  onCreateTask,
  onOpenClientPortal,
}: AgencyPortalProps) {
  const [agencyTab, setAgencyTab] = useState<'overview' | 'tasks' | 'capi' | 'whatsapp'>('overview');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('NORMAL');

  const handleCopySnippet = () => {
    const code = `<script src="${window.location.origin}/s/brunaortiz_ppp.js" async></script>`;
    navigator.clipboard.writeText(code);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleFormCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onCreateTask(newTaskTitle, newTaskPriority);
    setNewTaskTitle('');
    setShowNewTaskModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Agency Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
        {[
          { id: 'overview', label: 'Visão Geral & Carteira', icon: LayoutDashboard },
          { id: 'tasks', label: 'Quadro ClickUp de Tarefas', icon: CheckSquare, badge: `${tasks.length}` },
          { id: 'capi', label: 'Central CAPI Gateway (9/9)', icon: ShieldCheck, badge: 'EMQ 8.8' },
          { id: 'whatsapp', label: 'Instâncias & Aquecedor', icon: Flame, badge: 'Anti-Ban' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = agencyTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAgencyTab(tab.id as any)}
              style={{
                background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                border: isActive ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
                borderRadius: '10px',
                padding: '8px 16px',
                color: isActive ? '#fff' : 'var(--text-muted)',
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
              {tab.badge && (
                <span className={`badge ${isActive ? 'badge-green' : 'badge'}`} style={{ fontSize: '0.62rem' }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: OVERVIEW & CARTEIRA DE CLIENTES */}
      {/* ======================================================== */}
      {agencyTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Macro KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>FATURAMENTO CONSOLIDADO</span>
                <DollarSign size={18} color="var(--accent-green)" />
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800 }}>R$ 229.400,00</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--accent-green)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <TrendingUp size={13} /> +24% vs mês anterior
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>VENDAS HOJE (CHECKOUTS)</span>
                <Sparkles size={18} color="var(--accent-cyan)" />
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800 }}>R$ 21.470,00</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', marginTop: '4px' }}>
                18 compras aprovadas (Kiwify & Hotmart)
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>META DA CARTEIRA</span>
                <Target size={18} color="var(--accent-amber)" />
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800 }}>65,5% atingido</div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
                <div style={{ width: '65.5%', height: '100%', background: 'linear-gradient(90deg, #F59E0B, #10B981)' }} />
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>ESTEIRAS CAPI ATIVAS</span>
                <ShieldCheck size={18} color="var(--accent-purple)" />
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800 }}>99,98% taxa dedup</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Zero duplicidade navegador/servidor
              </div>
            </div>
          </div>

          {/* Accounts Cards */}
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="var(--accent-green)" />
              Contas da Carteira (Acesse com 1 Clique)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '16px' }}>
              {agencyData?.clients?.map((client: any) => (
                <div key={client.id} className="glass-panel" style={{ padding: '22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>{client.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Gestor responsável: {client.assignedGestor}</div>
                    </div>
                    <span className="badge badge-green">{client.healthStatus}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Faturamento Mês</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                        R$ {client.currentRevenue?.toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Hoje</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                        R$ {client.todayRevenue?.toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Progresso da Meta (R$ {client.revenueGoal?.toLocaleString('pt-BR')})</span>
                      <strong>{client.progressPct}%</strong>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${client.progressPct}%`, height: '100%', background: 'linear-gradient(90deg, #10B981, #06B6D4)' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{client.pendingTasks} tarefas no ClickUp</span>
                    <button
                      onClick={() => onOpenClientPortal(client.id)}
                      className="btn btn-primary"
                      style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                    >
                      Acessar Painel do Cliente <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: CLICKUP WORKSPACE (KANBAN DE TAREFAS) */}
      {/* ======================================================== */}
      {agencyTab === 'tasks' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Workspace de Tarefas da Agência (ClickUp Style)</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Gestão de rotinas de tráfego, criativos, validações de CAPI e lançamentos da equipe.
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowNewTaskModal(true)}>
              <Plus size={16} /> Nova Tarefa
            </button>
          </div>

          {/* Kanban Columns */}
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
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: col.color, display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                            {task.descriptionMarkdown}
                          </p>
                        )}

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                          {task.labels?.map((lbl: string, idx: number) => (
                            <span key={idx} style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', color: 'var(--text-dim)' }}>
                              #{lbl}
                            </span>
                          ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{task.clientName}</span>
                          <select
                            value={task.status}
                            onChange={(e) => onMoveTask(task.id, e.target.value)}
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

            <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--accent-green)', marginBottom: '4px' }}>
                ✓ Proteção contra Sequestro de Clique Ativa
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                O token de intenção viaja silenciosamente nas URLs do checkout da Kiwify e Hotmart. Se o comprador abrir em nova aba, a atribuição é mantida com 100% de precisão.
              </p>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '14px' }}>Diagnóstico de Prontidão (9/9)</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { item: 'Espera do _fbp nativo (2.000ms)', status: 'OK' },
                { item: 'Geração de _fbc a partir do fbclid', status: 'OK' },
                { item: 'Deduplicação de event_id browser/server', status: 'OK' },
                { item: 'Indexador s2/s3 no checkout Kiwify', status: 'OK' },
                { item: 'Lock transacional contra duplo Order Bump', status: 'OK' },
                { item: 'Circuit Breaker da Meta Graph API', status: 'OK' },
                { item: 'Redação de CPF e PII sensíveis (LGPD)', status: 'OK' },
                { item: 'Normalização do 9º dígito BR (+55)', status: 'OK' },
                { item: 'Nota de correspondência Meta (EMQ 8.8+)', status: 'OK' },
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
                    fontSize: '0.78rem',
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

      {/* ======================================================== */}
      {/* TAB 4: INSTÂNCIAS WHATSAPP DA AGÊNCIA */}
      {/* ======================================================== */}
      {agencyTab === 'whatsapp' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="badge badge-green">Conectado · Ativo</span>
              <span className="badge badge-cyan">Master Agency</span>
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>WhatsApp Master Agência</h4>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '14px' }}>
              Instância: gfb_master_01 (+55 11 99999-0001)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Score de Aquecimento</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-green)' }}>92/100</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Risco de Banimento</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>4%</div>
              </div>
            </div>
          </div>
        </div>
      )}

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
            <form onSubmit={handleFormCreateTask}>
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
