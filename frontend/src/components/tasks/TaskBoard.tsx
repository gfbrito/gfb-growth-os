import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Kanban,
  List as ListIcon,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  User,
  ArrowUpDown,
  Eye,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronRight,
  Layers,
} from 'lucide-react';
import {
  type Task,
  type TaskCounts,
  type TaskScope,
  type TaskStatus,
  type TaskPriority,
  type TaskArea,
  type AssignableUser,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  AREA_CONFIG,
} from './taskTypes';
import {
  fetchTasks,
  fetchAssignableUsers,
  createTask,
  updateTask,
  updateTaskStatus,
  toggleChecklistItem,
  deleteTask,
  fetchTaskConfig,
  updateTaskConfig,
} from './taskApi';
import { TaskCard } from './TaskCard';
import { TaskDetailDrawer } from './TaskDetailDrawer';
import { TaskForm } from './TaskForm';
import { TaskRoutinesModal } from './TaskRoutinesModal';

interface TaskBoardProps {
  scope: TaskScope;
  viewerRole?: 'MASTER_AGENCY' | 'CLIENT_OWNER' | 'CLIENT_ATTENDANT';
}

const KANBAN_COLUMNS: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'WAITING', 'AWAITING_APPROVAL', 'DONE'];

export function TaskBoard({ scope, viewerRole = 'MASTER_AGENCY' }: TaskBoardProps) {
  const isAgencyScope = scope.kind === 'agency';
  const isAgencyMaster = viewerRole === 'MASTER_AGENCY';
  const isAttendant = viewerRole === 'CLIENT_ATTENDANT';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [counts, setCounts] = useState<TaskCounts>({ open: 0, overdue: 0, awaitingApproval: 0, dueToday: 0 });
  const [loading, setLoading] = useState(true);
  const [timeTrackingEnabled, setTimeTrackingEnabled] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);

  // View & Filter States
  const [viewMode, setViewMode] = useState<'KANBAN' | 'LIST'>('KANBAN');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterArea, setFilterArea] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterClient, setFilterClient] = useState<string>('ALL');
  const [filterKind, setFilterKind] = useState<string>('ALL');
  const [filterAssignee, setFilterAssignee] = useState<string>('ALL');
  const [filterOverdue, setFilterOverdue] = useState<boolean>(false);
  const [filterDueToday, setFilterDueToday] = useState<boolean>(false);

  // Grouping state for List View (spec 8.4)
  const [groupBy, setGroupBy] = useState<'CLIENT' | 'ASSIGNEE' | 'NONE'>('CLIENT');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Modals & Drawers
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isRoutinesModalOpen, setIsRoutinesModalOpen] = useState(false);

  // Agency clients and assignable users
  const [agencyClients, setAgencyClients] = useState<Array<{ id: string; name: string }>>([]);
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);

  // Fetch task config (time tracking)
  useEffect(() => {
    fetchTaskConfig(viewerRole)
      .then((cfg) => setTimeTrackingEnabled(cfg.timeTrackingEnabled))
      .catch(console.error);
  }, [viewerRole]);

  // Fetch assignable users
  useEffect(() => {
    fetchAssignableUsers(viewerRole)
      .then((res) => setAssignableUsers(res.users || []))
      .catch(console.error);
  }, [viewerRole]);

  // Fetch agency clients for the agency selector
  useEffect(() => {
    if (isAgencyScope) {
      fetch('/api/dashboard/agency', { headers: { 'X-User-Role': viewerRole } })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.clients) {
            setAgencyClients(data.clients.map((c: any) => ({ id: c.id, name: c.name })));
          }
        })
        .catch(console.error);
    }
  }, [isAgencyScope, viewerRole]);

  // Toggle time tracking
  const handleToggleTimeTracking = async () => {
    try {
      const nextVal = !timeTrackingEnabled;
      const res = await updateTaskConfig(nextVal, viewerRole);
      setTimeTrackingEnabled(res.timeTrackingEnabled);
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar apontamento de tempo');
    }
  };

  // Load tasks function
  const loadData = useCallback(async () => {
    if (isAttendant) {
      setTasks([]);
      setCounts({ open: 0, overdue: 0, awaitingApproval: 0, dueToday: 0 });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params: any = {
        q: searchQuery || undefined,
        priority: filterPriority !== 'ALL' ? filterPriority : undefined,
        area: filterArea !== 'ALL' ? filterArea : undefined,
        status: filterStatus !== 'ALL' ? filterStatus : undefined,
        kind: filterKind !== 'ALL' ? filterKind : undefined,
        assignedUserId: filterAssignee !== 'ALL' ? filterAssignee : undefined,
        overdue: filterOverdue || undefined,
        dueToday: filterDueToday || undefined,
      };

      if (scope.kind === 'client') {
        params.clientId = scope.clientId;
      } else if (filterClient !== 'ALL') {
        params.clientId = filterClient;
      }

      const res = await fetchTasks(params, viewerRole);
      setTasks(res.tasks || []);
      setCounts(res.counts || { open: 0, overdue: 0, awaitingApproval: 0, dueToday: 0 });
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [
    isAttendant,
    searchQuery,
    filterPriority,
    filterArea,
    filterStatus,
    filterKind,
    filterAssignee,
    filterOverdue,
    filterDueToday,
    filterClient,
    scope,
    viewerRole,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Task Actions
  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (taskToEdit) {
      await updateTask(taskToEdit.id, taskData, viewerRole);
    } else {
      await createTask(taskData, viewerRole);
    }
    await loadData();
    setIsFormOpen(false);
    setTaskToEdit(null);
  };

  const handleUpdateTask = async (taskId: string, partial: Partial<Task>) => {
    const res = await updateTask(taskId, partial, viewerRole);
    if (res?.task) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? res.task : t)));
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(res.task);
      }
    }
  };

  // Drag and Drop with Rollback (A2.3)
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const prevTasks = [...tasks];
    const prevSelected = selectedTask ? { ...selectedTask } : null;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      setDropError(null);
      await updateTaskStatus(taskId, newStatus, viewerRole);
      await loadData();
    } catch (err: any) {
      console.error('Status change failed, rolling back:', err);
      // Rollback to original state
      setTasks(prevTasks);
      if (prevSelected) setSelectedTask(prevSelected);
      setDropError(err.message || 'Erro ao mover tarefa. A alteração foi desfeita.');
      setTimeout(() => setDropError(null), 4000);
    }
  };

  const handleToggleChecklist = async (taskId: string, checklistId: string) => {
    try {
      const res = await toggleChecklistItem(taskId, checklistId, viewerRole);
      if (res?.task) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? res.task : t)));
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(res.task);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId, viewerRole);
      await loadData();
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Sorted tasks for List View (due date ascending, overdue first)
  const sortedListTasks = [...tasks].sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    if (!a.dueDate && b.dueDate) return 1;
    if (a.dueDate && !b.dueDate) return -1;
    return (a.dueDate || '').localeCompare(b.dueDate || '');
  });

  // Grouped tasks calculation for List View (spec 8.4: por Cliente, por Responsável ou sem agrupamento)
  const groupedTasks = useMemo(() => {
    if (groupBy === 'NONE') return null;
    const map = new Map<string, Task[]>();
    for (const t of sortedListTasks) {
      const key = groupBy === 'CLIENT'
        ? (t.clientName || 'Interna (Agência)')
        : (t.assigneeName || 'Sem responsável');
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(t);
    }
    return Array.from(map.entries());
  }, [groupBy, sortedListTasks]);

  if (isAttendant) {
    return (
      <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          🔒 O perfil de atendente não possui permissão para visualizar o quadro de tarefas.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Error alert banner (e.g. rollback notice) */}
      {dropError && (
        <div
          style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid #F43F5E',
            borderRadius: '10px',
            padding: '12px 16px',
            color: '#fff',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} color="#F43F5E" />
          <span>{dropError}</span>
        </div>
      )}

      {/* Top Header & Metrics Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
              <CheckCircle2 size={11} />
              GESTÃO DE SPRINT
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Sincronizado em tempo real com o backend
            </span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            {isAgencyScope ? 'Quadro Geral de Tarefas' : `Tarefas • ${scope.clientName}`}
          </h2>
        </div>

        {/* Action Controls & Top Switches */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Apontamento de Horas Switch (MASTER_AGENCY only) */}
          {isAgencyScope && isAgencyMaster && (
            <button
              onClick={handleToggleTimeTracking}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: timeTrackingEnabled ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${timeTrackingEnabled ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                borderRadius: '8px',
                padding: '7px 12px',
                color: timeTrackingEnabled ? 'var(--accent-cyan)' : 'var(--text-dim)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Ligar ou desligar apontamento de minutos nas tarefas"
            >
              {timeTrackingEnabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              <span>Apontamento de Horas: {timeTrackingEnabled ? 'Ligado' : 'Desligado'}</span>
            </button>
          )}

          {/* Routines Button (Agency Master) */}
          {isAgencyMaster && (
            <button
              className="btn btn-secondary"
              onClick={() => setIsRoutinesModalOpen(true)}
              style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Gerenciar rotinas e tarefas recorrentes por serviço"
            >
              <Layers size={16} />
              <span>Rotinas por Serviço</span>
            </button>
          )}

          {/* New Task Button */}
          <button
            className="btn btn-primary"
            onClick={() => {
              setTaskToEdit(null);
              setIsFormOpen(true);
            }}
            style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            <span>Nova Tarefa</span>
          </button>
        </div>
      </div>

      {/* KPI Counters Bar (spec 8.4: Clicar num contador aplica o filtro correspondente) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        <div
          onClick={() => {
            setFilterStatus('ALL');
            setFilterOverdue(false);
            setFilterDueToday(false);
          }}
          className="glass-panel"
          style={{
            padding: '14px 18px',
            borderLeft: '4px solid var(--accent-cyan)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            outline: filterStatus === 'ALL' && !filterOverdue && !filterDueToday ? '2px solid var(--accent-cyan)' : 'none',
          }}
          title="Clique para ver todas as tarefas abertas"
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Tarefas Abertas</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{counts.open}</div>
        </div>

        <div
          onClick={() => {
            setFilterOverdue((prev) => !prev);
            setFilterDueToday(false);
          }}
          className="glass-panel"
          style={{
            padding: '14px 18px',
            borderLeft: '4px solid #F43F5E',
            background: counts.overdue > 0 ? 'rgba(244, 63, 94, 0.05)' : undefined,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            outline: filterOverdue ? '2px solid #F43F5E' : 'none',
          }}
          title="Clique para filtrar tarefas atrasadas"
        >
          <div style={{ fontSize: '0.75rem', color: '#F43F5E', marginBottom: '4px', fontWeight: 700 }}>
            Atrasadas {filterOverdue && '✓'}
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: counts.overdue > 0 ? '#F43F5E' : '#fff' }}>
            {counts.overdue}
          </div>
        </div>

        <div
          onClick={() => {
            setFilterStatus((prev) => (prev === 'AWAITING_APPROVAL' ? 'ALL' : 'AWAITING_APPROVAL'));
            setFilterOverdue(false);
            setFilterDueToday(false);
          }}
          className="glass-panel"
          style={{
            padding: '14px 18px',
            borderLeft: '4px solid var(--accent-purple)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            outline: filterStatus === 'AWAITING_APPROVAL' ? '2px solid var(--accent-purple)' : 'none',
          }}
          title="Clique para filtrar tarefas aguardando aprovação"
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
            Aguardando Aprovação {filterStatus === 'AWAITING_APPROVAL' && '✓'}
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{counts.awaitingApproval}</div>
        </div>

        <div
          onClick={() => {
            setFilterDueToday((prev) => !prev);
            setFilterOverdue(false);
          }}
          className="glass-panel"
          style={{
            padding: '14px 18px',
            borderLeft: '4px solid var(--accent-amber)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            outline: filterDueToday ? '2px solid var(--accent-amber)' : 'none',
          }}
          title="Clique para filtrar tarefas que vencem hoje"
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
            Vencendo Hoje {filterDueToday && '✓'}
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{counts.dueToday}</div>
        </div>
      </div>

      {/* Filter and View Toggle Toolbar */}
      <div
        className="glass-panel"
        style={{
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Left: View Mode Toggle & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* View Toggle */}
          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '2px' }}>
            <button
              onClick={() => setViewMode('KANBAN')}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'KANBAN' ? 'var(--accent-green)' : 'transparent',
                color: viewMode === 'KANBAN' ? '#080C15' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Kanban size={13} /> Quadro
            </button>
            <button
              onClick={() => setViewMode('LIST')}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'LIST' ? 'var(--accent-green)' : 'transparent',
                color: viewMode === 'LIST' ? '#080C15' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ListIcon size={13} /> Lista
            </button>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-dim)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar tarefas..."
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '6px 12px 6px 30px',
                color: '#fff',
                fontSize: '0.8rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Right: Dropdown Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Client Filter (Agency Scope only) */}
          {isAgencyScope && (
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                color: '#fff',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="ALL">Todos os Clientes</option>
              <option value="internal">Somente Internas (Agência)</option>
              {agencyClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {/* Kind Filter (spec 8.4) */}
          <select
            value={filterKind}
            onChange={(e) => setFilterKind(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              color: '#fff',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="ALL">Todos os Tipos</option>
            <option value="PROJECT">Projeto</option>
            <option value="RECURRING">Recorrente</option>
          </select>

          {/* Area Filter */}
          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              color: '#fff',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="ALL">Todas as Áreas</option>
            {(Object.keys(AREA_CONFIG) as TaskArea[]).map((a) => (
              <option key={a} value={a}>
                {AREA_CONFIG[a].iconEmoji} {AREA_CONFIG[a].label}
              </option>
            ))}
          </select>

          {/* Assignee Filter (spec 8.4) */}
          {isAgencyScope && (
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                color: '#fff',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="ALL">Todos os Responsáveis</option>
              {assignableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          )}

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              color: '#fff',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="ALL">Todas as Prioridades</option>
            {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map((p) => (
              <option key={p} value={p}>
                {PRIORITY_CONFIG[p].label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              color: '#fff',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="ALL">Todos os Status</option>
            {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_CONFIG[s].label}
              </option>
            ))}
          </select>

          {/* Somente Atrasadas toggle button */}
          <button
            type="button"
            onClick={() => setFilterOverdue((prev) => !prev)}
            style={{
              background: filterOverdue ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              color: filterOverdue ? '#F43F5E' : 'var(--text-muted)',
              border: `1px solid ${filterOverdue ? '#F43F5E' : 'var(--border-subtle)'}`,
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <AlertCircle size={13} />
            <span>Atrasadas</span>
          </button>

          {/* Group By Selector (List View Only, spec 8.4) */}
          {viewMode === 'LIST' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>Agrupar:</span>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'var(--accent-cyan)',
                  fontWeight: 600,
                  border: '1px solid var(--accent-cyan)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="CLIENT">Por Cliente (padrão)</option>
                <option value="ASSIGNEE">Por Responsável</option>
                <option value="NONE">Sem agrupamento</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Board View */}
      {viewMode === 'KANBAN' ? (
        /* KANBAN BOARD WITH HTML5 DRAG AND DROP */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
            alignItems: 'start',
          }}
        >
          {KANBAN_COLUMNS.map((columnStatus) => {
            const colConfig = STATUS_CONFIG[columnStatus];
            const columnTasks = tasks.filter((t) => t.status === columnStatus);

            return (
              <div
                key={columnStatus}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const taskId = e.dataTransfer.getData('text/plain');
                  if (taskId) {
                    handleStatusChange(taskId, columnStatus);
                  }
                }}
                style={{
                  background: 'rgba(11, 17, 32, 0.65)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '14px',
                  padding: '16px',
                  minHeight: '420px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {/* Column Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '10px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: colConfig.color,
                      }}
                    />
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>
                      {colConfig.label}
                    </span>
                  </div>
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: 'var(--text-dim)',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                    }}
                  >
                    {columnTasks.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      scope={scope}
                      viewerRole={viewerRole}
                      timeTrackingEnabled={timeTrackingEnabled}
                      onSelect={(t) => setSelectedTask(t)}
                    />
                  ))}

                  {columnTasks.length === 0 && (
                    <div
                      style={{
                        padding: '28px 16px',
                        textAlign: 'center',
                        color: 'var(--text-dim)',
                        fontSize: '0.78rem',
                        border: '1px dashed rgba(255, 255, 255, 0.06)',
                        borderRadius: '10px',
                      }}
                    >
                      Arraste uma tarefa aqui
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW (Ordenação por prazo crescente, com agrupamento conforme spec 8.4) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sortedListTasks.length === 0 ? (
            <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-dim)', borderRadius: '12px' }}>
              Nenhuma tarefa encontrada com os filtros selecionados.
            </div>
          ) : groupBy !== 'NONE' && groupedTasks ? (
            groupedTasks.map(([groupName, groupList]) => {
              const isCollapsed = Boolean(collapsedGroups[groupName]);

              return (
                <div key={groupName} className="glass-panel" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                  {/* Collapsible Accordion Header */}
                  <div
                    onClick={() => toggleGroup(groupName)}
                    style={{
                      padding: '14px 18px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      borderBottom: isCollapsed ? 'none' : '1px solid var(--border-subtle)',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {isCollapsed ? <ChevronRight size={16} color="var(--text-dim)" /> : <ChevronDown size={16} color="var(--accent-cyan)" />}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {groupBy === 'CLIENT' ? <Building2 size={14} color="var(--accent-cyan)" /> : <User size={14} color="var(--accent-cyan)" />}
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>
                          {groupName}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: 'var(--accent-cyan)',
                          background: 'rgba(56, 189, 248, 0.1)',
                          padding: '2px 8px',
                          borderRadius: '10px',
                        }}
                      >
                        {groupList.length} {groupList.length === 1 ? 'tarefa' : 'tarefas'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                      {isCollapsed ? 'Clique para expandir' : 'Clique para recolher'}
                    </span>
                  </div>

                  {/* Group Table */}
                  {!isCollapsed && (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255, 255, 255, 0.02)' }}>
                            <th style={{ padding: '12px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>STATUS</th>
                            <th style={{ padding: '12px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>TÍTULO</th>
                            <th style={{ padding: '12px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>PRIORIDADE</th>
                            <th style={{ padding: '12px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>ÁREA</th>
                            {isAgencyScope && groupBy !== 'CLIENT' && (
                              <th style={{ padding: '12px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>CLIENTE</th>
                            )}
                            {groupBy !== 'ASSIGNEE' && (
                              <th style={{ padding: '12px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>RESPONSÁVEL</th>
                            )}
                            <th style={{ padding: '12px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>PRAZO</th>
                            {timeTrackingEnabled && (
                              <th style={{ padding: '12px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>TEMPO GASTO</th>
                            )}
                            <th style={{ padding: '12px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>AÇÕES</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupList.map((task) => {
                            const colConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.TODO;
                            const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.NORMAL;
                            const areaInfo = task.area ? AREA_CONFIG[task.area] : null;

                            return (
                              <tr
                                key={task.id}
                                onClick={() => setSelectedTask(task)}
                                style={{
                                  borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                                  cursor: 'pointer',
                                  transition: 'background 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'transparent';
                                }}
                              >
                                <td style={{ padding: '12px 16px' }}>
                                  <span
                                    style={{
                                      background: colConfig.bg,
                                      color: colConfig.color,
                                      border: `1px solid ${colConfig.border}`,
                                      padding: '3px 8px',
                                      borderRadius: '6px',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                    }}
                                  >
                                    {colConfig.label}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#fff' }}>
                                  {task.title}
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                  <span
                                    style={{
                                      color: priorityInfo.color,
                                      background: `${priorityInfo.color}15`,
                                      padding: '2px 8px',
                                      borderRadius: '10px',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                    }}
                                  >
                                    {priorityInfo.label}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                                  {areaInfo ? `${areaInfo.iconEmoji} ${areaInfo.label}` : '—'}
                                </td>
                                {isAgencyScope && groupBy !== 'CLIENT' && (
                                  <td style={{ padding: '12px 16px', color: 'var(--accent-cyan)' }}>
                                    {task.clientName || 'Interna'}
                                  </td>
                                )}
                                {groupBy !== 'ASSIGNEE' && (
                                  <td style={{ padding: '12px 16px', color: '#CBD5E1' }}>
                                    {task.assigneeName || 'Sem responsável'}
                                  </td>
                                )}
                                <td
                                  style={{
                                    padding: '12px 16px',
                                    color: task.isOverdue ? '#EF4444' : 'var(--text-dim)',
                                    fontWeight: task.isOverdue ? 700 : 400,
                                  }}
                                >
                                  {task.dueDate ? (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      {task.isOverdue && <span style={{ color: '#EF4444', fontWeight: 800 }}>⚠️ Atrasada:</span>}
                                      <span>{task.dueDate.split('-').reverse().join('/')}</span>
                                    </span>
                                  ) : '—'}
                                </td>
                                {timeTrackingEnabled && (
                                  <td style={{ padding: '12px 16px', color: 'var(--accent-cyan)' }}>
                                    {task.timeSpentMinutes || 0}m / {task.timeEstimateMinutes || 0}m
                                  </td>
                                )}
                                <td style={{ padding: '12px 16px' }}>
                                  <button
                                    className="btn btn-secondary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedTask(task);
                                    }}
                                    style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    <Eye size={12} /> Detalhes
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            /* Non-grouped flat table */
            <div className="glass-panel" style={{ overflowX: 'auto', borderRadius: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255, 255, 255, 0.02)' }}>
                    <th style={{ padding: '12px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>STATUS</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>TÍTULO</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>PRIORIDADE</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>ÁREA</th>
                    {isAgencyScope && (
                      <th style={{ padding: '12px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>CLIENTE</th>
                    )}
                    <th style={{ padding: '12px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>RESPONSÁVEL</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>PRAZO</th>
                    {timeTrackingEnabled && (
                      <th style={{ padding: '12px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>TEMPO GASTO</th>
                    )}
                    <th style={{ padding: '12px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>AÇÕES</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedListTasks.map((task) => {
                    const colConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.TODO;
                    const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.NORMAL;
                    const areaInfo = task.area ? AREA_CONFIG[task.area] : null;

                    return (
                      <tr
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              background: colConfig.bg,
                              color: colConfig.color,
                              border: `1px solid ${colConfig.border}`,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                            }}
                          >
                            {colConfig.label}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#fff' }}>
                          {task.title}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              color: priorityInfo.color,
                              background: `${priorityInfo.color}15`,
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                            }}
                          >
                            {priorityInfo.label}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                          {areaInfo ? `${areaInfo.iconEmoji} ${areaInfo.label}` : '—'}
                        </td>
                        {isAgencyScope && (
                          <td style={{ padding: '12px 16px', color: 'var(--accent-cyan)' }}>
                            {task.clientName || 'Interna'}
                          </td>
                        )}
                        <td style={{ padding: '12px 16px', color: '#CBD5E1' }}>
                          {task.assigneeName || 'Sem responsável'}
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            color: task.isOverdue ? '#EF4444' : 'var(--text-dim)',
                            fontWeight: task.isOverdue ? 700 : 400,
                          }}
                        >
                          {task.dueDate ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {task.isOverdue && <span style={{ color: '#EF4444', fontWeight: 800 }}>⚠️ Atrasada:</span>}
                              <span>{task.dueDate.split('-').reverse().join('/')}</span>
                            </span>
                          ) : '—'}
                        </td>
                        {timeTrackingEnabled && (
                          <td style={{ padding: '12px 16px', color: 'var(--accent-cyan)' }}>
                            {task.timeSpentMinutes || 0}m / {task.timeEstimateMinutes || 0}m
                          </td>
                        )}
                        <td style={{ padding: '12px 16px' }}>
                          <button
                            className="btn btn-secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTask(task);
                            }}
                            style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Eye size={12} /> Detalhes
                          </button>
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

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdateStatus={handleStatusChange}
        onToggleChecklist={handleToggleChecklist}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDelete}
        onEditTask={(t) => {
          setSelectedTask(null);
          setTaskToEdit(t);
          setIsFormOpen(true);
        }}
        onSelectTask={(t) => setSelectedTask(t)}
        scope={scope}
        viewerRole={viewerRole}
        timeTrackingEnabled={timeTrackingEnabled}
      />

      {/* Task Form Modal */}
      <TaskForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setTaskToEdit(null);
        }}
        onSave={handleSaveTask}
        initialTask={taskToEdit}
        scope={scope}
        clients={agencyClients}
        viewerRole={viewerRole}
        timeTrackingEnabled={timeTrackingEnabled}
      />

      {/* Task Routines Modal (spec 9.1 & 9.2) */}
      <TaskRoutinesModal
        isOpen={isRoutinesModalOpen}
        onClose={() => setIsRoutinesModalOpen(false)}
        clients={agencyClients}
        currentClientId={scope.kind === 'client' ? scope.clientId : filterClient !== 'ALL' ? filterClient : undefined}
        viewerRole={viewerRole}
        onRoutinesChanged={loadData}
      />
    </div>
  );
}
