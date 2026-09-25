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
  Server,
  Kanban,
  List,
  Search,
  Flag,
  Clock,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit3,
  X,
  PlusCircle,
  Play,
  RotateCcw,
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

  // Mini ClickUp Nativo State
  const [taskView, setTaskView] = useState<'KANBAN' | 'LIST'>('KANBAN');
  const [taskSearch, setTaskSearch] = useState('');
  const [taskFilterPriority, setTaskFilterPriority] = useState<string>('ALL');
  const [taskFilterClient, setTaskFilterClient] = useState<string>('ALL');
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('NORMAL');
  const [newTaskClient, setNewTaskClient] = useState('cli_bruna_ppp');
  const [newTaskDue, setNewTaskDue] = useState('2026-10-02');
  const [newTaskEstimate, setNewTaskEstimate] = useState(60);

  const handleCopySnippet = () => {
    const code = `<script src="${window.location.origin}/s/brunaortiz_ppp.js" async></script>`;
    navigator.clipboard.writeText(code);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleFormCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: newTaskClient,
        title: newTaskTitle,
        priority: newTaskPriority,
        dueDate: newTaskDue,
        timeEstimateMinutes: newTaskEstimate,
        labels: ['Mini ClickUp'],
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.task) {
          onCreateTask(newTaskTitle, newTaskPriority);
        }
      })
      .catch((err) => console.error(err));

    setNewTaskTitle('');
    setShowNewTaskModal(false);
  };

  // Toggle checklist item via API
  const handleToggleChecklist = (taskId: string, checklistId: string) => {
    fetch(`/api/tasks/${taskId}/checklist/${checklistId}`, {
      method: 'PATCH',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.task && selectedTask?.id === taskId) {
          setSelectedTask(data.task);
        }
      })
      .catch((err) => console.error(err));
  };

  // Add subtask
  const handleAddSubtask = (taskId: string) => {
    if (!newSubtaskTitle.trim() || !selectedTask) return;

    const currentChecklists = selectedTask.checklists || [];
    const newChecklists = [
      ...currentChecklists,
      { id: `chk_${Date.now()}`, title: newSubtaskTitle.trim(), done: false },
    ];

    fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checklists: newChecklists }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.task) {
          setSelectedTask(data.task);
          setNewSubtaskTitle('');
        }
      })
      .catch((err) => console.error(err));
  };

  // Add time spent
  const handleAddTimeSpent = (taskId: string, minutes: number) => {
    if (!selectedTask) return;
    const newTime = (selectedTask.timeSpentMinutes || 0) + minutes;

    fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeSpentMinutes: newTime }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.task) {
          setSelectedTask(data.task);
        }
      })
      .catch((err) => console.error(err));
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      !taskSearch ||
      t.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
      t.descriptionMarkdown?.toLowerCase().includes(taskSearch.toLowerCase());

    const matchesPriority = taskFilterPriority === 'ALL' || t.priority === taskFilterPriority;
    const matchesClient = taskFilterClient === 'ALL' || t.clientId === taskFilterClient || t.clientName?.includes(taskFilterClient);

    return matchesSearch && matchesPriority && matchesClient;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <span className="badge badge-rose" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem' }}><Flag size={10} /> Urgente</span>;
      case 'HIGH':
        return <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem' }}><Flag size={10} /> Alta</span>;
      case 'NORMAL':
        return <span className="badge badge-cyan" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem' }}><Flag size={10} /> Normal</span>;
      default:
        return <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem' }}><Flag size={10} /> Baixa</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Agency Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px', flexWrap: 'wrap' }}>
        {[
          { id: 'overview', label: 'Visão Geral & Carteira', icon: LayoutDashboard },
          { id: 'tasks', label: 'Mini ClickUp Nativo', icon: CheckSquare, badge: `${filteredTasks.length} Tarefas` },
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
      {/* TAB 1: VISÃO GERAL & CARTEIRA */}
      {/* ======================================================== */}
      {agencyTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Big Numbers Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>MRR da Agência</span>
                <DollarSign size={16} color="var(--accent-green)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-green)' }}>
                R$ {(agencyData?.totalMrrCents / 100 || 48500).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                +14% em relação ao mês anterior
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Leads sob Gestão</span>
                <Users size={16} color="var(--accent-cyan)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>
                {(agencyData?.totalLeadsManaged || 24890).toLocaleString('pt-BR')}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', marginTop: '4px' }}>
                Em 6 contas ativas
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Chips Ativos</span>
                <Flame size={16} color="var(--accent-amber)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-amber)' }}>
                {agencyData?.activeWhatsAppChips || 8}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                Esteira anti-ban operando 100%
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Status CAPI Gateway</span>
                <ShieldCheck size={16} color="var(--accent-purple)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-purple)' }}>
                {agencyData?.capiStatus || 'OPERATIONAL'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                EMQ médio: 8.8 / 10
              </div>
            </div>
          </div>

          {/* Accounts List */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px' }}>Contas dos Clientes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {agencyData?.clients?.map((client: any) => (
                <div
                  key={client.id}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>{client.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      Faturamento Mês: <strong>R$ {(client.currentRevenue || 87400).toLocaleString('pt-BR')}</strong> de Meta R$ {(client.revenueGoal || 150000).toLocaleString('pt-BR')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={() => onOpenClientPortal(client.id)}
                      className="btn btn-primary"
                      style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
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
      {/* TAB 2: MINI CLICKUP NATIVO (KANBAN + LISTA + SUBTAREFAS) */}
      {/* ======================================================== */}
      {agencyTab === 'tasks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* ClickUp Toolbar */}
          <div
            className="glass-panel"
            style={{
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            {/* Left: View Switcher & Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckSquare size={18} color="var(--accent-purple)" />
                  Mini ClickUp Nativo GFB
                </h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  Gestão interna de rotinas, tráfego, criativos e prazos operacionais
                </span>
              </div>

              {/* View Toggle */}
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '3px' }}>
                <button
                  onClick={() => setTaskView('KANBAN')}
                  style={{
                    background: taskView === 'KANBAN' ? 'var(--accent-purple)' : 'transparent',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Kanban size={13} /> Quadro
                </button>
                <button
                  onClick={() => setTaskView('LIST')}
                  style={{
                    background: taskView === 'LIST' ? 'var(--accent-purple)' : 'transparent',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <List size={13} /> Lista
                </button>
              </div>
            </div>

            {/* Right: Search, Filters & New Task */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="Filtrar tarefas..."
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '6px 10px 6px 30px',
                    color: '#fff',
                    fontSize: '0.78rem',
                    width: '160px',
                  }}
                />
              </div>

              {/* Priority Filter */}
              <select
                value={taskFilterPriority}
                onChange={(e) => setTaskFilterPriority(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  color: '#fff',
                  fontSize: '0.78rem',
                }}
              >
                <option value="ALL">Todas Prioridades</option>
                <option value="URGENT">🚩 Urgente</option>
                <option value="HIGH">🚩 Alta</option>
                <option value="NORMAL">🚩 Normal</option>
                <option value="LOW">🚩 Baixa</option>
              </select>

              <button
                className="btn btn-primary"
                onClick={() => setShowNewTaskModal(true)}
                style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={14} /> + Nova Tarefa
              </button>
            </div>
          </div>

          {/* VIEW 1: KANBAN BOARD ESTILO CLICKUP */}
          {taskView === 'KANBAN' && (
            <div className="kanban-board">
              {[
                { id: 'TODO', title: 'A Fazer', color: 'var(--accent-amber)' },
                { id: 'IN_PROGRESS', title: 'Em Execução', color: 'var(--accent-cyan)' },
                { id: 'REVIEW', title: 'Em Revisão', color: 'var(--accent-purple)' },
                { id: 'DONE', title: 'Concluído', color: 'var(--accent-green)' },
              ].map((col) => {
                const colTasks = filteredTasks.filter((t) => t.status === col.id);
                return (
                  <div key={col.id} className="kanban-col">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: col.color, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                        {col.title}
                      </span>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.06)' }}>{colTasks.length}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {colTasks.map((task) => {
                        const checklists = task.checklists || [];
                        const doneCount = checklists.filter((c: any) => c.done).length;
                        return (
                          <div
                            key={task.id}
                            className="task-card"
                            onClick={() => setSelectedTask(task)}
                            style={{ cursor: 'pointer', transition: 'transform 0.15s ease, border-color 0.15s ease' }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                              {getPriorityBadge(task.priority)}
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Clock size={11} /> {task.timeSpentMinutes || 0}m / {task.timeEstimateMinutes || 60}m
                              </span>
                            </div>

                            <div style={{ fontSize: '0.86rem', fontWeight: 600, marginBottom: '6px', color: '#fff' }}>
                              {task.title}
                            </div>

                            {/* Subtasks Progress */}
                            {checklists.length > 0 && (
                              <div style={{ marginBottom: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-dim)', marginBottom: '3px' }}>
                                  <span>Subtarefas</span>
                                  <span style={{ color: doneCount === checklists.length ? 'var(--accent-green)' : '#fff' }}>
                                    ✓ {doneCount}/{checklists.length}
                                  </span>
                                </div>
                                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                                  <div
                                    style={{
                                      width: `${(doneCount / checklists.length) * 100}%`,
                                      height: '100%',
                                      background: doneCount === checklists.length ? 'var(--accent-green)' : 'var(--accent-purple)',
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                              {task.labels?.map((lbl: string, idx: number) => (
                                <span key={idx} style={{ fontSize: '0.65rem', padding: '1px 5px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', color: 'var(--text-dim)' }}>
                                  #{lbl}
                                </span>
                              ))}
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingTop: '8px',
                                borderTop: '1px solid rgba(255,255,255,0.05)',
                                fontSize: '0.72rem',
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span style={{ color: 'var(--text-muted)' }}>{task.clientName}</span>
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
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW 2: LIST VIEW ESTILO TABELA CLICKUP */}
          {taskView === 'LIST' && (
            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-dim)' }}>
                    <th style={{ padding: '12px 16px' }}>Nome da Tarefa</th>
                    <th style={{ padding: '12px' }}>Cliente</th>
                    <th style={{ padding: '12px' }}>Subtarefas</th>
                    <th style={{ padding: '12px' }}>Prioridade</th>
                    <th style={{ padding: '12px' }}>Prazo</th>
                    <th style={{ padding: '12px' }}>Tempo Gasto</th>
                    <th style={{ padding: '12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => {
                    const checklists = task.checklists || [];
                    const doneCount = checklists.filter((c: any) => c.done).length;
                    return (
                      <tr
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#fff' }}>
                          {task.title}
                        </td>
                        <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                          {task.clientName}
                        </td>
                        <td style={{ padding: '12px' }}>
                          {checklists.length > 0 ? (
                            <span style={{ color: doneCount === checklists.length ? 'var(--accent-green)' : 'var(--text-dim)', fontSize: '0.75rem' }}>
                              ✓ {doneCount}/{checklists.length}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '12px' }}>
                          {getPriorityBadge(task.priority)}
                        </td>
                        <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          {task.dueDate}
                        </td>
                        <td style={{ padding: '12px', color: 'var(--accent-cyan)', fontSize: '0.75rem' }}>
                          {task.timeSpentMinutes || 0}m / {task.timeEstimateMinutes || 60}m
                        </td>
                        <td style={{ padding: '12px' }} onClick={(e) => e.stopPropagation()}>
                          <select
                            value={task.status}
                            onChange={(e) => onMoveTask(task.id, e.target.value)}
                            style={{
                              background: 'rgba(255, 255, 255, 0.08)',
                              color: '#fff',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              cursor: 'pointer',
                            }}
                          >
                            <option value="TODO">A Fazer</option>
                            <option value="IN_PROGRESS">Em Execução</option>
                            <option value="REVIEW">Em Revisão</option>
                            <option value="DONE">Concluído</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
            <button onClick={() => onOpenClientPortal('cli_bruna_ppp')} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
              Abrir Painel Completo de WhatsApp do Cliente
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CLICKUP TASK DRAWER / DETALHES DA TAREFA */}
      {/* ======================================================== */}
      {selectedTask && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 120,
          }}
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="glass-panel-elevated"
            style={{ width: '640px', maxHeight: '85vh', overflowY: 'auto', padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge badge-purple" style={{ marginBottom: '6px' }}>
                  ClickUp Task #{selectedTask.id}
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{selectedTask.title}</h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Properties Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Status</span>
                <select
                  value={selectedTask.status}
                  onChange={(e) => {
                    const newSt = e.target.value;
                    onMoveTask(selectedTask.id, newSt);
                    setSelectedTask({ ...selectedTask, status: newSt });
                  }}
                  style={{
                    width: '100%',
                    background: '#0F172A',
                    color: '#fff',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '6px',
                    fontSize: '0.78rem',
                    marginTop: '4px',
                  }}
                >
                  <option value="TODO">A Fazer</option>
                  <option value="IN_PROGRESS">Em Execução</option>
                  <option value="REVIEW">Em Revisão</option>
                  <option value="DONE">Concluído</option>
                </select>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Prioridade</span>
                <select
                  value={selectedTask.priority}
                  onChange={(e) => {
                    const newPr = e.target.value;
                    fetch(`/api/tasks/${selectedTask.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ priority: newPr }),
                    });
                    setSelectedTask({ ...selectedTask, priority: newPr });
                  }}
                  style={{
                    width: '100%',
                    background: '#0F172A',
                    color: '#fff',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '6px',
                    fontSize: '0.78rem',
                    marginTop: '4px',
                  }}
                >
                  <option value="URGENT">🚩 Urgente</option>
                  <option value="HIGH">🚩 Alta</option>
                  <option value="NORMAL">🚩 Normal</option>
                  <option value="LOW">🚩 Baixa</option>
                </select>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Prazo</span>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '8px' }}>
                  {selectedTask.dueDate || '2026-10-02'}
                </div>
              </div>
            </div>

            {/* Time Tracking Widget */}
            <div style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '14px', borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} /> Time Tracking (Tempo Gasto vs Estimado)
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>
                  {selectedTask.timeSpentMinutes || 0}m / {selectedTask.timeEstimateMinutes || 60}m
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleAddTimeSpent(selectedTask.id, 15)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                >
                  +15 min
                </button>
                <button
                  onClick={() => handleAddTimeSpent(selectedTask.id, 30)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                >
                  +30 min
                </button>
                <button
                  onClick={() => handleAddTimeSpent(selectedTask.id, 60)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                >
                  +1 hora
                </button>
              </div>
            </div>

            {/* Subtasks / Checklist estilo ClickUp */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} color="var(--accent-green)" />
                  Subtarefas & Checklist
                </h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {selectedTask.checklists?.filter((c: any) => c.done).length || 0} de {selectedTask.checklists?.length || 0} concluídas
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                {selectedTask.checklists?.map((item: any) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleChecklist(selectedTask.id, item.id)}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      readOnly
                      style={{ cursor: 'pointer', accentColor: 'var(--accent-green)' }}
                    />
                    <span
                      style={{
                        fontSize: '0.85rem',
                        color: item.done ? 'var(--text-dim)' : '#fff',
                        textDecoration: item.done ? 'line-through' : 'none',
                      }}
                    >
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add Subtask Input */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="+ Adicionar nova subtarefa..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddSubtask(selectedTask.id);
                  }}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.82rem',
                  }}
                />
                <button
                  onClick={() => handleAddSubtask(selectedTask.id)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.78rem' }}
                >
                  Adicionar
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
                Descrição & Notas da Operação
              </span>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {selectedTask.descriptionMarkdown || 'Nenhuma descrição adicionada.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Tarefa */}
      {showNewTaskModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
          }}
          onClick={() => setShowNewTaskModal(false)}
        >
          <div className="glass-panel-elevated" style={{ width: '480px', padding: '28px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px' }}>Nova Tarefa ClickUp</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Adicione uma tarefa operacional para a equipe com prazo e prioridade.
            </p>

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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                <div>
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

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Tempo Estimado (min)</label>
                  <input
                    type="number"
                    value={newTaskEstimate}
                    onChange={(e) => setNewTaskEstimate(Number(e.target.value))}
                    style={{
                      width: '100%',
                      background: '#0F172A',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '10px',
                      color: '#fff',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
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
