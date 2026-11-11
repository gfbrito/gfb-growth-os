import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Calendar,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Edit3,
  User,
  Building2,
  AlertCircle,
  Paperclip,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Send,
  History,
  ArrowUp,
  ArrowDown,
  ShieldAlert,
  Check,
  CheckCircle2,
  Repeat,
} from 'lucide-react';
import {
  type Task,
  type TaskScope,
  type TaskStatus,
  type TaskChecklistItem,
  type TaskAttachment,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  AREA_CONFIG,
  VISIBILITY_CONFIG,
} from './taskTypes';
import {
  fetchTaskComments,
  createTaskComment,
  fetchTaskHistory,
  approveTask,
  requestTaskChanges,
  endTaskSeries,
  fetchTaskById,
  type TaskComment,
  type TaskHistoryEvent,
} from './taskApi';

interface TaskDetailDrawerProps {
  task: Task | null;
  onClose: () => void;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  onToggleChecklist: (taskId: string, checklistId: string) => Promise<void>;
  onUpdateTask?: (taskId: string, partial: Partial<Task>) => Promise<void>;
  onDeleteTask?: (taskId: string) => Promise<void>;
  onEditTask?: (task: Task) => void;
  onSelectTask?: (task: Task) => void;
  scope: TaskScope;
  viewerRole?: string;
  timeTrackingEnabled?: boolean;
}

function formatDatePtBr(isoString?: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

function getRecurrenceLabel(recurrence?: any): string {
  if (!recurrence) return 'Recorrente';
  const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  if (recurrence.frequency === 'WEEKLY') {
    const day = recurrence.weekday !== undefined ? weekdays[recurrence.weekday] : 'dia fixo';
    return `Toda semana (${day})`;
  }
  if (recurrence.frequency === 'BIWEEKLY') {
    const day = recurrence.weekday !== undefined ? weekdays[recurrence.weekday] : 'dia fixo';
    return `A cada 15 dias (${day})`;
  }
  if (recurrence.frequency === 'MONTHLY') {
    return `Todo mês (dia ${recurrence.dayOfMonth || 1})`;
  }
  return 'Recorrente';
}

export function TaskDetailDrawer({
  task,
  onClose,
  onUpdateStatus,
  onToggleChecklist,
  onUpdateTask,
  onDeleteTask,
  onEditTask,
  onSelectTask,
  scope,
  viewerRole,
  timeTrackingEnabled = false,
}: TaskDetailDrawerProps) {
  const isAgencyRole = viewerRole === 'MASTER_AGENCY' || viewerRole === 'AGENCY_OPERATOR';
  const isClientOwner = viewerRole === 'CLIENT_OWNER';

  // Checklist states
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [editingChecklistText, setEditingChecklistText] = useState('');

  // Attachment states
  const [showAddAttachment, setShowAddAttachment] = useState(false);
  const [attachmentTitle, setAttachmentTitle] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  // Comments states
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newCommentBody, setNewCommentBody] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(Boolean(task?.visibility === 'INTERNAL' && isAgencyRole));
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // History states
  const [historyEvents, setHistoryEvents] = useState<TaskHistoryEvent[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Approval states
  const [showRequestChangesModal, setShowRequestChangesModal] = useState(false);
  const [changeRequestComment, setChangeRequestComment] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isRequestingChanges, setIsRequestingChanges] = useState(false);
  const [seriesOccurrences, setSeriesOccurrences] = useState<any[]>(task?.seriesOccurrences || []);
  const [isEndingSeries, setIsEndingSeries] = useState(false);

  // Load comments & history
  useEffect(() => {
    if (task?.id) {
      setIsInternalComment(Boolean(task.visibility === 'INTERNAL' && isAgencyRole));
      fetchTaskComments(task.id, viewerRole)
        .then((res) => setComments(res.comments))
        .catch(console.error);

      fetchTaskHistory(task.id, viewerRole)
        .then((res) => setHistoryEvents(res.events))
        .catch(console.error);

      if (task.seriesId) {
        fetchTaskById(task.id, viewerRole)
          .then((res) => {
            if (res.task?.seriesOccurrences) {
              setSeriesOccurrences(res.task.seriesOccurrences);
            }
          })
          .catch(console.error);
      } else {
        setSeriesOccurrences([]);
      }
    }
  }, [task?.id, task?.seriesId, task?.visibility, viewerRole, isAgencyRole]);

  if (!task) return null;

  const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.NORMAL;
  const statusInfo = STATUS_CONFIG[task.status] || STATUS_CONFIG.TODO;
  const areaInfo = task.area ? AREA_CONFIG[task.area] : null;
  const visibilityInfo = task.visibility ? VISIBILITY_CONFIG[task.visibility] : null;

  const checklists = task.checklists || [];
  const doneChecklists = checklists.filter((c) => c.done).length;

  // Checklist handlers
  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistTitle.trim() || !onUpdateTask) return;
    const newItem: TaskChecklistItem = {
      id: `chk_${Date.now()}`,
      title: newChecklistTitle.trim(),
      done: false,
      position: checklists.length,
    };
    await onUpdateTask(task.id, { checklists: [...checklists, newItem] });
    setNewChecklistTitle('');
  };

  const handleSaveRenameChecklist = async (id: string) => {
    if (!onUpdateTask || !editingChecklistText.trim()) {
      setEditingChecklistId(null);
      return;
    }
    const updated = checklists.map((item) =>
      item.id === id ? { ...item, title: editingChecklistText.trim() } : item
    );
    await onUpdateTask(task.id, { checklists: updated });
    setEditingChecklistId(null);
  };

  const handleRemoveChecklist = async (id: string) => {
    if (!onUpdateTask) return;
    const updated = checklists.filter((c) => c.id !== id);
    await onUpdateTask(task.id, { checklists: updated });
  };

  const handleReorderChecklist = async (index: number, direction: 'up' | 'down') => {
    if (!onUpdateTask) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= checklists.length) return;

    const newArr = [...checklists];
    const [moved] = newArr.splice(index, 1);
    newArr.splice(targetIndex, 0, moved);

    // update positions
    const reindexed = newArr.map((item, idx) => ({ ...item, position: idx }));
    await onUpdateTask(task.id, { checklists: reindexed });
  };

  // Attachment handlers
  const handleAddAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttachmentError(null);
    if (!attachmentTitle.trim()) {
      setAttachmentError('O título do anexo é obrigatório.');
      return;
    }
    const urlTrimmed = attachmentUrl.trim();
    if (!urlTrimmed.startsWith('http://') && !urlTrimmed.startsWith('https://')) {
      setAttachmentError('A URL deve começar com http:// ou https://');
      return;
    }
    if (!onUpdateTask) return;

    const newAtt: TaskAttachment = {
      id: `att_${Date.now()}`,
      title: attachmentTitle.trim(),
      url: urlTrimmed,
      createdAt: new Date().toISOString(),
    };
    const updated = [...(task.attachments || []), newAtt];
    await onUpdateTask(task.id, { attachments: updated });
    setAttachmentTitle('');
    setAttachmentUrl('');
    setShowAddAttachment(false);
  };

  const handleRemoveAttachment = async (attId: string) => {
    if (!onUpdateTask) return;
    const updated = (task.attachments || []).filter((a) => a.id !== attId);
    await onUpdateTask(task.id, { attachments: updated });
  };

  // Comments handler
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentBody.trim()) return;
    try {
      setIsSubmittingComment(true);
      const res = await createTaskComment(
        task.id,
        { body: newCommentBody.trim(), internal: isInternalComment },
        viewerRole
      );
      setComments((prev) => [...prev, res.comment]);
      setNewCommentBody('');
      setIsInternalComment(false);
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar comentário');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Time Spent increment handler
  const handleAddTimeSpent = async (minutes: number) => {
    if (!onUpdateTask) return;
    const current = task.timeSpentMinutes || 0;
    await onUpdateTask(task.id, { timeSpentMinutes: current + minutes });
  };

  // Delete handler with required confirmation text
  const handleDeleteTask = async () => {
    const msg = `Excluir a tarefa "${task.title}"? Esta ação não pode ser desfeita pela tela.`;
    if (window.confirm(msg)) {
      if (onDeleteTask) {
        await onDeleteTask(task.id);
        onClose();
      }
    }
  };

  // Approval Handlers (spec 8.3)
  const handleApproveTask = async () => {
    try {
      setIsApproving(true);
      const res = await approveTask(task.id, viewerRole);
      if (onUpdateTask) {
        await onUpdateTask(task.id, res.task);
      }
      onClose();
    } catch (err: any) {
      alert(err.message || 'Erro ao aprovar tarefa');
    } finally {
      setIsApproving(false);
    }
  };

  const handleRequestChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeRequestComment.trim()) {
      alert('O comentário é obrigatório para pedir ajuste');
      return;
    }
    try {
      setIsRequestingChanges(true);
      const res = await requestTaskChanges(task.id, changeRequestComment.trim(), viewerRole);
      if (onUpdateTask) {
        await onUpdateTask(task.id, res.task);
      }
      setShowRequestChangesModal(false);
      setChangeRequestComment('');
      onClose();
    } catch (err: any) {
      alert(err.message || 'Erro ao solicitar ajustes');
    } finally {
      setIsRequestingChanges(false);
    }
  };


  const handleEndSeries = async () => {
    if (!task) return;
    const ok = window.confirm('Deseja realmente encerrar esta série recorrente? Nenhuma nova ocorrência automática será criada após esta.');
    if (!ok) return;
    try {
      setIsEndingSeries(true);
      await endTaskSeries(task.id, viewerRole);
      if (onUpdateTask) {
        await onUpdateTask(task.id, { seriesEndedAt: new Date().toISOString() });
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao encerrar série');
    } finally {
      setIsEndingSeries(false);
    }
  };

  const handleOpenOccurrence = async (occId: string) => {
    try {
      const res = await fetchTaskById(occId, viewerRole);
      if (res.task && onSelectTask) {
        onSelectTask(res.task);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao carregar ocorrência');
    }
  };

  // Status Click Interceptor (WAITING, AWAITING_APPROVAL)
  const handleStatusClick = async (targetStatus: TaskStatus) => {
    if (targetStatus === 'WAITING') {
      const reason = window.prompt('O que estamos esperando? (Obrigatório)');
      if (!reason || !reason.trim()) {
        alert('É obrigatório informar o que estamos esperando.');
        return;
      }
      if (onUpdateTask) {
        await onUpdateTask(task.id, { status: 'WAITING', waitingReason: reason.trim() });
      } else {
        await onUpdateStatus(task.id, 'WAITING');
      }
      return;
    }

    if (targetStatus === 'AWAITING_APPROVAL') {
      if (task.visibility === 'INTERNAL') {
        const ok = window.confirm('Esta tarefa é interna. Torná-la visível ao cliente para pedir aprovação?');
        if (!ok) return;
        if (onUpdateTask) {
          await onUpdateTask(task.id, { status: 'AWAITING_APPROVAL', visibility: 'CLIENT' });
        } else {
          await onUpdateStatus(task.id, 'AWAITING_APPROVAL');
        }
        return;
      }
    }

    await onUpdateStatus(task.id, targetStatus);
  };

  const allStatuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'WAITING', 'AWAITING_APPROVAL', 'DONE'];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 90,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '620px',
          height: '100%',
          background: '#0B1120',
          borderLeft: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* 1. Header: Title, badges, edit & delete buttons */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.8)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: priorityInfo.color,
                background: `${priorityInfo.color}18`,
                border: `1px solid ${priorityInfo.color}35`,
                padding: '3px 8px',
                borderRadius: '6px',
              }}
            >
              {priorityInfo.label}
            </span>

            {areaInfo && (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                }}
              >
                {areaInfo.iconEmoji} {areaInfo.label}
              </span>
            )}

            {isAgencyRole && visibilityInfo && (
              <span
                style={{
                  fontSize: '0.72rem',
                  color: visibilityInfo.color,
                  background: `${visibilityInfo.color}15`,
                  padding: '3px 8px',
                  borderRadius: '6px',
                }}
              >
                {visibilityInfo.label}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isAgencyRole && onEditTask && (
              <button
                onClick={() => onEditTask(task)}
                className="btn btn-secondary"
                style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Editar Tarefa"
              >
                <Edit3 size={13} />
                <span>Editar</span>
              </button>
            )}

            {isAgencyRole && onDeleteTask && (
              <button
                onClick={handleDeleteTask}
                className="btn btn-secondary"
                style={{ padding: '6px 10px', fontSize: '0.75rem', color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)' }}
                title="Excluir Tarefa"
              >
                <Trash2 size={13} />
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Title */}
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', lineHeight: 1.35 }}>
              {task.title}
            </h2>

            {task.link && (
              <div style={{ marginTop: '8px' }}>
                <button
                  onClick={() => {
                    onClose();
                    window.dispatchEvent(new CustomEvent('growth_navigate', { detail: { link: task.link } }));
                  }}
                  className="btn btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #0284C7, #2563EB)',
                    fontSize: '0.82rem',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                  }}
                >
                  <ExternalLink size={14} />
                  <span>Abrir onde resolver</span>
                </button>
              </div>
            )}
          </div>

          {/* 2. Info Bar: Client, Assignee, Prazo (with Atrasada badge when overdue) */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '14px 16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '14px',
              fontSize: '0.78rem',
            }}
          >
            <div>
              <div style={{ color: 'var(--text-dim)', marginBottom: '4px' }}>Cliente</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                <Building2 size={14} />
                <span>{task.clientName || 'Interna (Agência)'}</span>
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--text-dim)', marginBottom: '4px' }}>Responsável</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', fontWeight: 600 }}>
                {task.assigneeAvatar ? (
                  <img src={task.assigneeAvatar} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                ) : (
                  <User size={14} color="var(--text-dim)" />
                )}
                <span>{task.assigneeName || 'Sem responsável'}</span>
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--text-dim)', marginBottom: '4px' }}>Prazo</div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: task.isOverdue ? '#EF4444' : '#fff',
                  fontWeight: task.isOverdue ? 700 : 600,
                }}
              >
                {task.isOverdue ? <AlertCircle size={14} /> : <Calendar size={14} color="var(--text-dim)" />}
                <span>{task.dueDate ? task.dueDate.split('-').reverse().join('/') : 'Sem prazo'}</span>
                {task.isOverdue && (
                  <span
                    style={{
                      fontSize: '0.62rem',
                      color: '#fff',
                      background: '#F43F5E',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      fontWeight: 800,
                    }}
                  >
                    Atrasada
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Waiting Reason Banner */}
          {task.status === 'WAITING' && task.waitingReason && (
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '10px',
                padding: '12px 16px',
                color: '#F59E0B',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Clock size={16} />
              <span><strong>Em Espera:</strong> {task.waitingReason}</span>
            </div>
          )}

          {/* Client Approval Box (spec 8.3) */}
          {isClientOwner && task.status === 'AWAITING_APPROVAL' && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.12), rgba(16, 185, 129, 0.12))',
                border: '1px solid rgba(234, 179, 8, 0.4)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} color="#F59E0B" />
                <div>
                  <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem' }}>
                    Aprovação Pendente
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    Esta tarefa foi concluída pela agência e está aguardando sua revisão e aprovação.
                  </div>
                </div>
              </div>

              {!showRequestChangesModal ? (
                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button
                    onClick={handleApproveTask}
                    disabled={isApproving}
                    className="btn btn-primary"
                    style={{
                      flex: 1,
                      background: 'var(--accent-green)',
                      color: '#040711',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px',
                      fontSize: '0.84rem',
                    }}
                  >
                    <CheckSquare size={16} />
                    <span>{isApproving ? 'Aprovando...' : 'Aprovar Tarefa'}</span>
                  </button>

                  <button
                    onClick={() => setShowRequestChangesModal(true)}
                    className="btn btn-secondary"
                    style={{
                      flex: 1,
                      borderColor: 'rgba(234, 179, 8, 0.4)',
                      color: '#F59E0B',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px',
                      fontSize: '0.84rem',
                    }}
                  >
                    <MessageSquare size={16} />
                    <span>Pedir Ajuste</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRequestChanges} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  <div style={{ fontSize: '0.78rem', color: '#FCD34D', fontWeight: 600 }}>
                    O que precisa ser ajustado na tarefa? (Obrigatório)
                  </div>
                  <textarea
                    rows={3}
                    value={changeRequestComment}
                    onChange={(e) => setChangeRequestComment(e.target.value)}
                    placeholder="Descreva detalhadamente o ajuste necessário..."
                    required
                    autoFocus
                    style={{
                      width: '100%',
                      background: '#040711',
                      border: '1px solid rgba(234, 179, 8, 0.5)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#fff',
                      fontSize: '0.82rem',
                      outline: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRequestChangesModal(false);
                        setChangeRequestComment('');
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.76rem' }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isRequestingChanges || !changeRequestComment.trim()}
                      className="btn btn-primary"
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.76rem',
                        background: '#F59E0B',
                        color: '#000',
                        fontWeight: 800,
                      }}
                    >
                      {isRequestingChanges ? 'Enviando...' : 'Confirmar Pedido de Ajuste'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* 3. Mover Status (Agency Role) */}
          {isAgencyRole && (
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                Mover Status
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {allStatuses.map((st) => {
                  const conf = STATUS_CONFIG[st];
                  const isCurrent = task.status === st;
                  return (
                    <button
                      key={st}
                      onClick={() => handleStatusClick(st)}
                      style={{
                        background: isCurrent ? conf.color : 'rgba(255, 255, 255, 0.04)',
                        color: isCurrent ? '#fff' : conf.color,
                        border: `1px solid ${isCurrent ? conf.color : conf.border}`,
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {conf.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Time Tracking (só se timeTrackingEnabled ligado) */}
          {timeTrackingEnabled && isAgencyRole && (
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.05)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Apontamento de Horas</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff' }}>
                  {task.timeSpentMinutes || 0}m <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>/ {task.timeEstimateMinutes || 0}m estimados</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                {[15, 30, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => handleAddTimeSpent(mins)}
                    className="btn btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                  >
                    +{mins}m
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Series / Recurrence Block (spec 7.2) */}
          {task.seriesId && (
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.05)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Repeat size={16} color="#38BDF8" />
                  <div>
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#fff' }}>
                      Série: {getRecurrenceLabel(task.recurrence)}
                    </span>
                    {task.seriesEndedAt ? (
                      <div style={{ fontSize: '0.72rem', color: '#EF4444', marginTop: '2px', fontWeight: 600 }}>
                        Série encerrada em {formatDatePtBr(task.seriesEndedAt)}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Nova ocorrência gerada automaticamente ao concluir
                      </div>
                    )}
                  </div>
                </div>

                {isAgencyRole && !task.seriesEndedAt && (
                  <button
                    onClick={handleEndSeries}
                    disabled={isEndingSeries}
                    className="btn btn-secondary"
                    style={{
                      borderColor: 'rgba(239, 68, 68, 0.4)',
                      color: '#F43F5E',
                      fontSize: '0.74rem',
                      padding: '5px 10px',
                      borderRadius: '6px',
                    }}
                  >
                    {isEndingSeries ? 'Encerrando...' : 'Encerrar Série'}
                  </button>
                )}
              </div>

              {/* Mini-list of occurrences */}
              {seriesOccurrences.length > 0 && (
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.07)', paddingTop: '10px' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '8px' }}>
                    Ocorrências da série ({seriesOccurrences.length}):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                    {seriesOccurrences.map((occ) => {
                      const isCurrent = occ.id === task.id;
                      const occStatusConf = STATUS_CONFIG[occ.status as TaskStatus] || STATUS_CONFIG.TODO;
                      const dateStr = occ.completedAt
                        ? `Concluída em ${formatDatePtBr(occ.completedAt)}`
                        : occ.dueDate
                        ? `Prazo: ${occ.dueDate.split('-').reverse().join('/')}`
                        : 'Sem data';

                      return (
                        <div
                          key={occ.id}
                          onClick={() => {
                            if (!isCurrent) handleOpenOccurrence(occ.id);
                          }}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: isCurrent ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                            border: `1px solid ${isCurrent ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.05)'}`,
                            borderRadius: '8px',
                            padding: '7px 10px',
                            fontSize: '0.76rem',
                            cursor: isCurrent ? 'default' : 'pointer',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: isCurrent ? '#38BDF8' : '#fff', fontWeight: isCurrent ? 700 : 500 }}>
                              {occ.title}
                            </span>
                            {isCurrent && (
                              <span style={{ fontSize: '0.65rem', background: '#0284C7', color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                                Atual
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{dateStr}</span>
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                color: occStatusConf.color,
                                background: `${occStatusConf.color}15`,
                                border: `1px solid ${occStatusConf.border}`,
                                padding: '1px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              {occStatusConf.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. Checklist: marcar, adicionar, renomear, remover, reordenar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                Checklist ({doneChecklists} de {checklists.length})
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {checklists.map((chk, idx) => {
                const isEditingThis = editingChecklistId === chk.id;

                return (
                  <div
                    key={chk.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                      <span
                        onClick={() => {
                          if (isAgencyRole) onToggleChecklist(task.id, chk.id);
                        }}
                        style={{ cursor: isAgencyRole ? 'pointer' : 'default', display: 'flex', alignItems: 'center' }}
                      >
                        {chk.done ? (
                          <CheckSquare size={16} color="var(--accent-green)" />
                        ) : (
                          <Square size={16} color="var(--text-dim)" />
                        )}
                      </span>

                      {isEditingThis ? (
                        <input
                          type="text"
                          value={editingChecklistText}
                          onChange={(e) => setEditingChecklistText(e.target.value)}
                          onBlur={() => handleSaveRenameChecklist(chk.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRenameChecklist(chk.id);
                            if (e.key === 'Escape') setEditingChecklistId(null);
                          }}
                          autoFocus
                          style={{
                            background: '#040711',
                            border: '1px solid var(--accent-cyan)',
                            borderRadius: '4px',
                            color: '#fff',
                            fontSize: '0.82rem',
                            padding: '3px 6px',
                            width: '100%',
                            outline: 'none',
                          }}
                        />
                      ) : (
                        <span
                          onClick={() => {
                            if (isAgencyRole) {
                              setEditingChecklistId(chk.id);
                              setEditingChecklistText(chk.title);
                            }
                          }}
                          title={isAgencyRole ? 'Clique para renomear' : undefined}
                          style={{
                            fontSize: '0.82rem',
                            color: chk.done ? 'var(--text-dim)' : '#fff',
                            textDecoration: chk.done ? 'line-through' : 'none',
                            cursor: isAgencyRole ? 'pointer' : 'default',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {chk.title}
                        </span>
                      )}
                    </div>

                    {isAgencyRole && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <button
                          type="button"
                          onClick={() => handleReorderChecklist(idx, 'up')}
                          disabled={idx === 0}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: idx === 0 ? 'rgba(255,255,255,0.1)' : 'var(--text-dim)',
                            cursor: idx === 0 ? 'default' : 'pointer',
                            padding: '2px',
                          }}
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReorderChecklist(idx, 'down')}
                          disabled={idx === checklists.length - 1}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: idx === checklists.length - 1 ? 'rgba(255,255,255,0.1)' : 'var(--text-dim)',
                            cursor: idx === checklists.length - 1 ? 'default' : 'pointer',
                            padding: '2px',
                          }}
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveChecklist(chk.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                            padding: '2px 4px',
                          }}
                          title="Remover item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {checklists.length === 0 && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontStyle: 'italic', padding: '4px 0' }}>
                  Nenhum item no checklist.
                </div>
              )}

              {/* Add checklist item */}
              {isAgencyRole && (
                <form onSubmit={handleAddChecklist} style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <input
                    type="text"
                    value={newChecklistTitle}
                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                    placeholder="Adicionar item ao checklist..."
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '7px 12px',
                      color: '#fff',
                      fontSize: '0.8rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!newChecklistTitle.trim()}
                    className="btn btn-secondary"
                    style={{ padding: '7px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Plus size={14} /> Adicionar
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* 5. Descrição renderizada */}
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
              Descrição
            </div>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '14px 16px',
                fontSize: '0.85rem',
                color: task.descriptionMarkdown ? '#E2E8F0' : 'var(--text-dim)',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
              }}
            >
              {task.descriptionMarkdown || 'Nenhuma descrição informada.'}
            </div>
          </div>

          {/* 6. Anexos: lista de links com título; adicionar e remover */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Paperclip size={14} /> Anexos e Links de Apoio ({task.attachments?.length || 0})
              </div>
              {isAgencyRole && (
                <button
                  type="button"
                  onClick={() => setShowAddAttachment(!showAddAttachment)}
                  className="btn btn-secondary"
                  style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={12} /> {showAddAttachment ? 'Cancelar' : 'Novo Anexo'}
                </button>
              )}
            </div>

            {/* Add Attachment Form */}
            {showAddAttachment && isAgencyRole && (
              <form
                onSubmit={handleAddAttachment}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '12px',
                  marginBottom: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <input
                  type="text"
                  placeholder="Título do link (ex: Briefing no Google Docs)"
                  value={attachmentTitle}
                  onChange={(e) => setAttachmentTitle(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '7px 10px',
                    color: '#fff',
                    fontSize: '0.8rem',
                    outline: 'none',
                  }}
                />
                <input
                  type="url"
                  placeholder="URL (deve iniciar com https:// ou http://)"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '7px 10px',
                    color: '#fff',
                    fontSize: '0.8rem',
                    outline: 'none',
                  }}
                />
                {attachmentError && (
                  <div style={{ color: '#EF4444', fontSize: '0.72rem' }}>{attachmentError}</div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '5px 12px', fontSize: '0.75rem' }}>
                    Salvar Anexo
                  </button>
                </div>
              </form>
            )}

            {/* Attachments List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(task.attachments || []).map((att) => (
                <div
                  key={att.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                  }}
                >
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'var(--accent-cyan)',
                      textDecoration: 'none',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <ExternalLink size={14} />
                    <span>{att.title}</span>
                  </a>

                  {isAgencyRole && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-dim)',
                        cursor: 'pointer',
                        padding: '3px',
                      }}
                      title="Remover anexo"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}

              {(!task.attachments || task.attachments.length === 0) && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontStyle: 'italic', padding: '4px 0' }}>
                  Nenhum anexo adicionado.
                </div>
              )}
            </div>
          </div>

          {/* 7. Comentários: ordem cronológica, autor, data e hora pt-BR, novo comentário */}
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={14} /> Comentários ({comments.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
              {comments.map((cmt) => (
                <div
                  key={cmt.id}
                  style={{
                    background: cmt.internal ? 'rgba(100, 116, 139, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    border: cmt.internal ? '1px dashed rgba(148, 163, 184, 0.4)' : '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, color: '#fff' }}>{cmt.authorName}</span>
                      {cmt.internal && (
                        <span className="badge badge-gray" style={{ fontSize: '0.62rem' }}>
                          🔒 Interno Agência
                        </span>
                      )}
                    </div>
                    <span style={{ color: 'var(--text-dim)' }}>{formatDatePtBr(cmt.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#CBD5E1', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {cmt.body}
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontStyle: 'italic', padding: '4px 0' }}>
                  Nenhum comentário registrado.
                </div>
              )}
            </div>

            {/* New Comment Input */}
            <form onSubmit={handlePostComment} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <textarea
                rows={2}
                value={newCommentBody}
                onChange={(e) => setNewCommentBody(e.target.value)}
                placeholder="Escreva um comentário..."
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  color: '#fff',
                  fontSize: '0.82rem',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {isAgencyRole ? (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isInternalComment}
                      onChange={(e) => setIsInternalComment(e.target.checked)}
                    />
                    <span>Comentário interno (invisível para cliente)</span>
                  </label>
                ) : <span />}

                <button
                  type="submit"
                  disabled={isSubmittingComment || !newCommentBody.trim()}
                  className="btn btn-primary"
                  style={{ padding: '6px 14px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={13} /> Comentar
                </button>
              </div>
            </form>
          </div>

          {/* 8. Histórico: recolhido por padrão */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '14px' }}>
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '6px 0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <History size={14} /> Histórico de Alterações ({historyEvents.length})
              </div>
              {showHistory ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            {showHistory && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                {historyEvents.map((evt) => (
                  <div
                    key={evt.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '0.74rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <strong style={{ color: '#fff' }}>{evt.type}:</strong>{' '}
                      {evt.from !== undefined && evt.to !== undefined && (
                        <span style={{ color: 'var(--text-dim)' }}>
                          {String(evt.from)} → <span style={{ color: 'var(--accent-cyan)' }}>{String(evt.to)}</span>
                        </span>
                      )}
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Por: {evt.authorName}</div>
                    </div>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.68rem' }}>{formatDatePtBr(evt.createdAt)}</span>
                  </div>
                ))}

                {historyEvents.length === 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                    Nenhum registro de histórico encontrado.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
