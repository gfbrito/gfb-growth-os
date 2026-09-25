import React, { useState, useEffect } from 'react';
import {
  Kanban,
  List,
  Search,
  Plus,
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
  Sparkles,
  Users,
  CheckSquare,
  AlertCircle,
  Layers,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface TaskChecklist {
  id: string;
  title: string;
  done: boolean;
}

interface MiniTask {
  id: string;
  clientId: string;
  clientName?: string;
  title: string;
  descriptionMarkdown?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  dueDate?: string;
  timeSpentMinutes?: number;
  timeEstimateMinutes?: number;
  labels?: string[];
  checklists?: TaskChecklist[];
  assigneeName?: string;
}

interface ClientMiniClickUpProps {
  clientId?: string;
  clientName?: string;
}

export function ClientMiniClickUp({
  clientId = 'cli_bruna_ppp',
  clientName = 'Bruna Ortiz (Pílula da Produtividade)',
}: ClientMiniClickUpProps) {
  const [tasks, setTasks] = useState<MiniTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskView, setTaskView] = useState<'KANBAN' | 'LIST'>('KANBAN');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal / Drawer state
  const [selectedTask, setSelectedTask] = useState<MiniTask | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formPriority, setFormPriority] = useState<'URGENT' | 'HIGH' | 'NORMAL' | 'LOW'>('NORMAL');
  const [formDueDate, setFormDueDate] = useState('2026-10-02');
  const [formEstimate, setFormEstimate] = useState(90);
  const [formDescription, setFormDescription] = useState('');

  const fetchTasks = () => {
    setLoading(true);
    fetch('/api/tasks')
      .then((res) => res.json())
      .then((data) => {
        if (data.tasks) {
          // Filtrar tarefas relevantes ao escopo
          const filtered = data.tasks.filter(
            (t: MiniTask) => !clientId || t.clientId === clientId || t.clientId === 'all'
          );
          setTasks(filtered);
        }
      })
      .catch((err) => console.error('Erro ao buscar tarefas:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTasks();
  }, [clientId]);

  // Create Task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        title: formTitle.trim(),
        priority: formPriority,
        dueDate: formDueDate,
        timeEstimateMinutes: Number(formEstimate),
        descriptionMarkdown: formDescription,
        labels: ['Mini ClickUp', 'Sprint Lançamento'],
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.task) {
          setTasks((prev) => [data.task, ...prev]);
          setFormTitle('');
          setFormDescription('');
          setShowNewTaskModal(false);
        }
      })
      .catch((err) => console.error(err));
  };

  // Move Task Status
  const handleMoveStatus = (taskId: string, newStatus: MiniTask['status']) => {
    fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.task) {
          setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
          );
          if (selectedTask?.id === taskId) {
            setSelectedTask((prev) => (prev ? { ...prev, status: newStatus } : null));
          }
        }
      })
      .catch((err) => console.error(err));
  };

  // Toggle Subtask
  const handleToggleSubtask = (taskId: string, checklistId: string) => {
    fetch(`/api/tasks/${taskId}/checklist/${checklistId}`, {
      method: 'PATCH',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.task) {
          setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));
          if (selectedTask?.id === taskId) {
            setSelectedTask(data.task);
          }
        }
      })
      .catch((err) => console.error(err));
  };

  // Add Subtask
  const handleAddSubtask = (taskId: string) => {
    if (!newSubtaskTitle.trim() || !selectedTask) return;

    const current = selectedTask.checklists || [];
    const updated = [
      ...current,
      { id: `chk_${Date.now()}`, title: newSubtaskTitle.trim(), done: false },
    ];

    fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checklists: updated }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.task) {
          setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));
          setSelectedTask(data.task);
          setNewSubtaskTitle('');
        }
      })
      .catch((err) => console.error(err));
  };

  // Log Time
  const handleLogTime = (taskId: string, minutes: number) => {
    if (!selectedTask) return;
    const newSpent = (selectedTask.timeSpentMinutes || 0) + minutes;

    fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeSpentMinutes: newSpent }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.task) {
          setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));
          setSelectedTask(data.task);
        }
      })
      .catch((err) => console.error(err));
  };

  // Priority Badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="badge badge-rose" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem' }}>
            <Flag size={10} /> Urgente
          </span>
        );
      case 'HIGH':
        return (
          <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem' }}>
            <Flag size={10} /> Alta
          </span>
        );
      case 'NORMAL':
        return (
          <span className="badge badge-cyan" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem' }}>
            <Flag size={10} /> Normal
          </span>
        );
      default:
        return (
          <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem' }}>
            <Flag size={10} /> Baixa
          </span>
        );
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchSearch =
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.descriptionMarkdown?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPriority = selectedPriority === 'ALL' || t.priority === selectedPriority;
    const matchStatus = selectedStatus === 'ALL' || t.status === selectedStatus;
    return matchSearch && matchPriority && matchStatus;
  });

  const columns: { id: MiniTask['status']; title: string; color: string }[] = [
    { id: 'TODO', title: 'A Fazer', color: 'var(--accent-amber)' },
    { id: 'IN_PROGRESS', title: 'Em Execução', color: 'var(--accent-cyan)' },
    { id: 'REVIEW', title: 'Em Revisão', color: 'var(--accent-purple)' },
    { id: 'DONE', title: 'Concluído', color: 'var(--accent-green)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(16, 185, 129, 0.08))',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #A855F7, #EC4899)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckSquare size={18} color="#fff" />
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Mini ClickUp Nativo <span style={{ color: 'var(--accent-purple)', fontSize: '0.85rem', fontWeight: 600 }}>GFB OS</span>
            </h1>
            <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
              Workspace Integrado
            </span>
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', margin: 0 }}>
            Quadro operacional nativo com checklists, estimativas e apontamento de tempo sem depender de ferramentas externas.
          </p>
        </div>

        {/* View Switcher & Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              background: 'rgba(0,0,0,0.3)',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              onClick={() => setTaskView('KANBAN')}
              style={{
                background: taskView === 'KANBAN' ? 'var(--accent-purple)' : 'transparent',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Kanban size={14} /> Kanban
            </button>
            <button
              onClick={() => setTaskView('LIST')}
              style={{
                background: taskView === 'LIST' ? 'var(--accent-purple)' : 'transparent',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <List size={14} /> Lista
            </button>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setShowNewTaskModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
          >
            <Plus size={15} /> + Criar Tarefa
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          background: 'rgba(255,255,255,0.02)',
          padding: '12px 16px',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Buscar tarefas ou subtarefas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '7px 12px 7px 32px',
                color: '#fff',
                fontSize: '0.8rem',
                width: '240px',
              }}
            />
          </div>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            style={{
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '7px 12px',
              color: '#fff',
              fontSize: '0.8rem',
            }}
          >
            <option value="ALL">Todas Prioridades</option>
            <option value="URGENT">🚩 Urgente</option>
            <option value="HIGH">🚩 Alta</option>
            <option value="NORMAL">🚩 Normal</option>
            <option value="LOW">🚩 Baixa</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '7px 12px',
              color: '#fff',
              fontSize: '0.8rem',
            }}
          >
            <option value="ALL">Todos Status</option>
            <option value="TODO">A Fazer</option>
            <option value="IN_PROGRESS">Em Execução</option>
            <option value="REVIEW">Em Revisão</option>
            <option value="DONE">Concluído</option>
          </select>
        </div>

        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
          Exibindo <strong>{filteredTasks.length}</strong> tarefas de {tasks.length}
        </div>
      </div>

      {/* VIEW: KANBAN BOARD */}
      {taskView === 'KANBAN' && (
        <div className="kanban-board">
          {columns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className="kanban-col">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '14px',
                    borderBottom: '1px solid var(--border-subtle)',
                    paddingBottom: '8px',
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      color: col.color,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                    {col.title}
                  </span>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    {colTasks.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {colTasks.map((task) => {
                    const checklists = task.checklists || [];
                    const doneCount = checklists.filter((c) => c.done).length;
                    return (
                      <div
                        key={task.id}
                        className="task-card"
                        onClick={() => setSelectedTask(task)}
                        style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '6px',
                          }}
                        >
                          {getPriorityBadge(task.priority)}
                          <span
                            style={{
                              fontSize: '0.68rem',
                              color: 'var(--text-dim)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            <Clock size={11} /> {task.timeSpentMinutes || 0}m / {task.timeEstimateMinutes || 60}m
                          </span>
                        </div>

                        <div style={{ fontSize: '0.86rem', fontWeight: 600, marginBottom: '6px', color: '#fff' }}>
                          {task.title}
                        </div>

                        {/* Checklist progress */}
                        {checklists.length > 0 && (
                          <div style={{ marginBottom: '8px' }}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '0.68rem',
                                color: 'var(--text-dim)',
                                marginBottom: '3px',
                              }}
                            >
                              <span>Subtarefas</span>
                              <span style={{ color: doneCount === checklists.length ? 'var(--accent-green)' : '#fff' }}>
                                ✓ {doneCount}/{checklists.length}
                              </span>
                            </div>
                            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${(doneCount / checklists.length) * 100}%`,
                                  height: '100%',
                                  background: doneCount === checklists.length ? 'var(--accent-green)' : 'var(--accent-purple)',
                                  transition: 'width 0.2s ease',
                                }}
                              />
                            </div>
                          </div>
                        )}

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.72rem',
                            color: 'var(--text-dim)',
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                            paddingTop: '6px',
                            marginTop: '6px',
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={11} /> {task.dueDate || 'S/ Prazo'}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-cyan)' }}>
                            <Users size={11} /> {task.assigneeName || 'Gisley F.'}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {colTasks.length === 0 && (
                    <div
                      style={{
                        padding: '24px 12px',
                        textAlign: 'center',
                        color: 'var(--text-dim)',
                        fontSize: '0.75rem',
                        border: '1px dashed var(--border-subtle)',
                        borderRadius: '10px',
                      }}
                    >
                      Nenhuma tarefa nesta etapa
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW: LIST VIEW */}
      {taskView === 'LIST' && (
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 120px 80px',
              padding: '12px 18px',
              background: 'rgba(255,255,255,0.03)',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--text-dim)',
              letterSpacing: '0.04em',
            }}
          >
            <span>TAREFA & SUBTAREFAS</span>
            <span>STATUS</span>
            <span>PRIORIDADE</span>
            <span>RESPONSÁVEL</span>
            <span>TEMPO (REAL/EST)</span>
            <span style={{ textAlign: 'right' }}>AÇÕES</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredTasks.map((task) => {
              const checklists = task.checklists || [];
              const doneCount = checklists.filter((c) => c.done).length;
              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 120px 80px',
                    padding: '14px 18px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff', marginBottom: '2px' }}>
                      {task.title}
                    </div>
                    {checklists.length > 0 && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        ✓ {doneCount}/{checklists.length} subtarefas concluídas
                      </div>
                    )}
                  </div>

                  <div>
                    <span
                      className="badge"
                      style={{
                        background:
                          task.status === 'DONE'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : task.status === 'IN_PROGRESS'
                            ? 'rgba(6, 182, 212, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                        color:
                          task.status === 'DONE'
                            ? 'var(--accent-green)'
                            : task.status === 'IN_PROGRESS'
                            ? 'var(--accent-cyan)'
                            : 'var(--accent-amber)',
                      }}
                    >
                      {task.status === 'TODO' && 'A Fazer'}
                      {task.status === 'IN_PROGRESS' && 'Em Execução'}
                      {task.status === 'REVIEW' && 'Revisão'}
                      {task.status === 'DONE' && 'Concluído'}
                    </span>
                  </div>

                  <div>{getPriorityBadge(task.priority)}</div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--accent-purple)', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      G
                    </div>
                    {task.assigneeName || 'Gisley F.'}
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {task.timeSpentMinutes || 0}m / {task.timeEstimateMinutes || 60}m
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <button
                      className="btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTask(task);
                      }}
                      style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                    >
                      Detalhes
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: NOVA TAREFA CLICKUP */}
      {showNewTaskModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '20px',
          }}
        >
          <div className="glass-panel" style={{ width: '100%', maxWidth: '540px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckSquare size={18} color="var(--accent-purple)" />
                Nova Tarefa no Mini ClickUp
              </h3>
              <button
                onClick={() => setShowNewTaskModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
                  Título da Tarefa
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Configurar CAPI Server + Disparar Lembrete D-1"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
                    Prioridade
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      color: '#fff',
                      fontSize: '0.8rem',
                    }}
                  >
                    <option value="URGENT">🚩 Urgente</option>
                    <option value="HIGH">🚩 Alta</option>
                    <option value="NORMAL">🚩 Normal</option>
                    <option value="LOW">🚩 Baixa</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
                    Prazo de Entrega
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      color: '#fff',
                      fontSize: '0.8rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
                  Estimativa de Tempo (Minutos)
                </label>
                <input
                  type="number"
                  min="5"
                  step="15"
                  value={formEstimate}
                  onChange={(e) => setFormEstimate(Number(e.target.value))}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: '#fff',
                    fontSize: '0.8rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
                  Descrição / Notas
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalhes operacionais da tarefa..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: '#fff',
                    fontSize: '0.8rem',
                    resize: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowNewTaskModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER SLIDE-OVER: DETALHES DA TAREFA & SUBTAREFAS */}
      {selectedTask && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 1000,
          }}
          onClick={() => setSelectedTask(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              height: '100%',
              background: 'rgba(15, 23, 42, 0.98)',
              borderLeft: '1px solid var(--border-subtle)',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              overflowY: 'auto',
              boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {getPriorityBadge(selectedTask.priority)}
                <span className="badge" style={{ fontSize: '0.7rem' }}>
                  {selectedTask.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
                {selectedTask.title}
              </h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span>📅 Prazo: {selectedTask.dueDate || 'Sem prazo'}</span>
                <span>👤 {selectedTask.assigneeName || 'Gisley F.'}</span>
              </div>
            </div>

            {/* Status Pipeline Buttons */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
                MOVER STATUS
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleMoveStatus(selectedTask.id, st)}
                    style={{
                      background: selectedTask.status === st ? 'var(--accent-purple)' : 'rgba(255,255,255,0.05)',
                      color: '#fff',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      padding: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {st === 'TODO' && 'A Fazer'}
                    {st === 'IN_PROGRESS' && 'Execução'}
                    {st === 'REVIEW' && 'Revisão'}
                    {st === 'DONE' && 'Concluído'}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Tracking Widget */}
            <div className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} color="var(--accent-green)" />
                  Apontamento de Horas
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-green)', fontWeight: 700 }}>
                  {selectedTask.timeSpentMinutes || 0}m de {selectedTask.timeEstimateMinutes || 60}m
                </span>
              </div>

              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
                <div
                  style={{
                    width: `${Math.min(100, (((selectedTask.timeSpentMinutes || 0) / (selectedTask.timeEstimateMinutes || 60)) * 100))}%`,
                    height: '100%',
                    background: 'var(--accent-green)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn"
                  onClick={() => handleLogTime(selectedTask.id, 15)}
                  style={{ flex: 1, fontSize: '0.72rem', padding: '5px' }}
                >
                  +15 min
                </button>
                <button
                  className="btn"
                  onClick={() => handleLogTime(selectedTask.id, 30)}
                  style={{ flex: 1, fontSize: '0.72rem', padding: '5px' }}
                >
                  +30 min
                </button>
                <button
                  className="btn"
                  onClick={() => handleLogTime(selectedTask.id, 60)}
                  style={{ flex: 1, fontSize: '0.72rem', padding: '5px' }}
                >
                  +1 hora
                </button>
              </div>
            </div>

            {/* Checklists / Subtasks */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckSquare size={15} color="var(--accent-cyan)" />
                  Checklist & Subtarefas
                </h4>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  {selectedTask.checklists?.filter((c) => c.done).length || 0} de {selectedTask.checklists?.length || 0}
                </span>
              </div>

              {/* Subtask list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                {selectedTask.checklists?.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleSubtask(selectedTask.id, item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: 'rgba(255,255,255,0.03)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => {}}
                      style={{ cursor: 'pointer' }}
                    />
                    <span
                      style={{
                        fontSize: '0.82rem',
                        color: item.done ? 'var(--text-dim)' : '#fff',
                        textDecoration: item.done ? 'line-through' : 'none',
                        flex: 1,
                      }}
                    >
                      {item.title}
                    </span>
                  </div>
                ))}

                {(!selectedTask.checklists || selectedTask.checklists.length === 0) && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', padding: '12px' }}>
                    Nenhuma subtarefa adicionada.
                  </div>
                )}
              </div>

              {/* Add subtask input */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Adicionar nova subtarefa..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask(selectedTask.id)}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.8rem',
                  }}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => handleAddSubtask(selectedTask.id)}
                  style={{ padding: '8px 12px', fontSize: '0.78rem' }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
                DESCRIÇÃO / DOCUMENTAÇÃO
              </label>
              <div
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '0.8rem',
                  color: 'var(--text-dim)',
                  lineHeight: '1.5',
                }}
              >
                {selectedTask.descriptionMarkdown || 'Nenhuma descrição detalhada informada.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
