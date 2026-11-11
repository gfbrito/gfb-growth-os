import React, { useState, useEffect } from 'react';
import { X, Check, Calendar, AlertCircle } from 'lucide-react';
import {
  type Task,
  type TaskScope,
  type TaskPriority,
  type TaskArea,
  type TaskVisibility,
  type TaskKind,
  type AssignableUser,
  PRIORITY_CONFIG,
  AREA_CONFIG,
  VISIBILITY_CONFIG,
} from './taskTypes';
import { fetchAssignableUsers } from './taskApi';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => Promise<void>;
  initialTask?: Task | null;
  scope: TaskScope;
  clients?: Array<{ id: string; name: string }>;
  viewerRole?: string;
  timeTrackingEnabled?: boolean;
}

export function TaskForm({
  isOpen,
  onClose,
  onSave,
  initialTask,
  scope,
  clients = [],
  viewerRole,
  timeTrackingEnabled = false,
}: TaskFormProps) {
  const isEditing = Boolean(initialTask);
  const isAgencyScope = scope.kind === 'agency';
  const todayStr = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState(initialTask?.title || '');
  const [descriptionMarkdown, setDescriptionMarkdown] = useState(initialTask?.descriptionMarkdown || '');
  const [priority, setPriority] = useState<TaskPriority>(initialTask?.priority || 'NORMAL');
  const [kind, setKind] = useState<TaskKind>(initialTask?.kind || 'PROJECT');
  const [area, setArea] = useState<TaskArea>(initialTask?.area || 'OTHER');
  const [visibility, setVisibility] = useState<TaskVisibility>(
    initialTask?.visibility || (isAgencyScope ? 'INTERNAL' : 'CLIENT')
  );
  const [clientId, setClientId] = useState<string | null>(
    initialTask?.clientId !== undefined
      ? initialTask.clientId
      : scope.kind === 'client'
      ? scope.clientId
      : null
  );
  const [assignedUserId, setAssignedUserId] = useState<string | null>(initialTask?.assignedUserId || null);
  const [dueDate, setDueDate] = useState<string>(initialTask?.dueDate || todayStr);
  const [timeEstimateMinutes, setTimeEstimateMinutes] = useState<number>(initialTask?.timeEstimateMinutes || 60);

  const [frequency, setFrequency] = useState<'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'>(
    initialTask?.recurrence?.frequency || 'WEEKLY'
  );
  const [weekday, setWeekday] = useState<number>(
    initialTask?.recurrence?.weekday !== undefined ? initialTask.recurrence.weekday : 1
  );
  const [dayOfMonth, setDayOfMonth] = useState<number>(
    initialTask?.recurrence?.dayOfMonth || 1
  );
  const [applyToSeries, setApplyToSeries] = useState<boolean>(false);

  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAgencyScope && isOpen) {
      fetchAssignableUsers(viewerRole)
        .then((res) => setAssignableUsers(res.users))
        .catch(console.error);
    }
  }, [isAgencyScope, isOpen, viewerRole]);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTask?.title || '');
      setDescriptionMarkdown(initialTask?.descriptionMarkdown || '');
      setPriority(initialTask?.priority || 'NORMAL');
      setKind(initialTask?.kind || 'PROJECT');
      setArea(initialTask?.area || 'OTHER');
      setVisibility(initialTask?.visibility || (isAgencyScope ? 'INTERNAL' : 'CLIENT'));
      setClientId(
        initialTask?.clientId !== undefined
          ? initialTask.clientId
          : scope.kind === 'client'
          ? scope.clientId
          : null
      );
      setAssignedUserId(initialTask?.assignedUserId || null);
      setDueDate(initialTask?.dueDate || todayStr);
      setTimeEstimateMinutes(initialTask?.timeEstimateMinutes || 60);
      setFrequency(initialTask?.recurrence?.frequency || 'WEEKLY');
      setWeekday(initialTask?.recurrence?.weekday !== undefined ? initialTask.recurrence.weekday : 1);
      setDayOfMonth(initialTask?.recurrence?.dayOfMonth || 1);
      setApplyToSeries(false);
      setError(null);
    }
  }, [isOpen, initialTask, isAgencyScope, scope, todayStr]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('O título é obrigatório.');
      return;
    }
    if (title.trim().length > 140) {
      setError('O título não pode exceder 140 caracteres.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const targetClientId = isAgencyScope ? (clientId || null) : scope.clientId;
      const targetVisibility = !targetClientId ? 'INTERNAL' : (isAgencyScope ? visibility : 'CLIENT');

      const payload: any = {
        title: title.trim(),
        descriptionMarkdown,
        priority,
        kind,
        area,
        visibility: targetVisibility,
        clientId: targetClientId,
        assignedUserId: isAgencyScope ? assignedUserId : null,
        dueDate: dueDate || null,
        timeEstimateMinutes: Number(timeEstimateMinutes) || 0,
      };

      if (kind === 'RECURRING') {
        payload.recurrence = {
          frequency,
          weekday: frequency === 'MONTHLY' ? undefined : weekday,
          dayOfMonth: frequency === 'MONTHLY' ? dayOfMonth : undefined,
          anchorDate: dueDate || todayStr,
        };
      }

      if (initialTask?.seriesId) {
        payload.applyToSeries = applyToSeries;
      }

      await onSave(payload);

      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar tarefa');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#0B1120',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
              {isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}
            </h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              {scope.kind === 'client' ? `Conta: ${scope.clientName}` : 'Gestão de Tarefas da Agência'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '10px 14px',
                borderRadius: '8px',
                color: '#EF4444',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Title Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Título da Tarefa * ({title.length}/140)
            </label>
            <input
              type="text"
              value={title}
              maxLength={140}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Blindagem do CAPI v3.0 e validação de tokens"
              required
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#fff',
                fontSize: '0.88rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Client Select (Agency Scope only) */}
          {isAgencyScope && (
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Cliente Vinculado
              </label>
              <select
                value={clientId || ''}
                onChange={(e) => setClientId(e.target.value ? e.target.value : null)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              >
                <option value="">Interna (sem cliente)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Assignee & Priority Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: isAgencyScope ? '1fr 1fr' : '1fr', gap: '14px' }}>
            {isAgencyScope && (
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Responsável
                </label>
                <select
                  value={assignedUserId || ''}
                  onChange={(e) => setAssignedUserId(e.target.value ? e.target.value : null)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                >
                  <option value="">Sem responsável</option>
                  {assignableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              >
                {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_CONFIG[p].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tipo, Área, Visibilidade & Prazo Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: isAgencyScope ? '1fr 1fr' : '1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Tipo da Tarefa
              </label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as TaskKind)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              >
                <option value="PROJECT">Projeto (Pontual)</option>
                <option value="RECURRING">Recorrente (Rotina)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Área de Atuação
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value as TaskArea)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              >
                {(Object.keys(AREA_CONFIG) as TaskArea[]).map((a) => (
                  <option key={a} value={a}>
                    {AREA_CONFIG[a].iconEmoji} {AREA_CONFIG[a].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Configuração de Recorrência (spec 9.1: Frequência, Dia da semana ou Dia do mês) */}
          {kind === 'RECURRING' && (
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.05)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '10px',
                padding: '14px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '6px' }}>
                  Frequência da Recorrência
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  style={{
                    width: '100%',
                    background: '#040711',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.82rem',
                    outline: 'none',
                  }}
                >
                  <option value="WEEKLY">Semanal</option>
                  <option value="BIWEEKLY">Quinzenal</option>
                  <option value="MONTHLY">Mensal</option>
                </select>
              </div>

              {frequency !== 'MONTHLY' ? (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '6px' }}>
                    Dia da Semana
                  </label>
                  <select
                    value={weekday}
                    onChange={(e) => setWeekday(Number(e.target.value))}
                    style={{
                      width: '100%',
                      background: '#040711',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#fff',
                      fontSize: '0.82rem',
                      outline: 'none',
                    }}
                  >
                    <option value={1}>Segunda-feira</option>
                    <option value={2}>Terça-feira</option>
                    <option value={3}>Quarta-feira</option>
                    <option value={4}>Quinta-feira</option>
                    <option value={5}>Sexta-feira</option>
                    <option value={6}>Sábado</option>
                    <option value={0}>Domingo</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '6px' }}>
                    Dia do Mês (1 a 31)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(Math.max(1, Math.min(31, Number(e.target.value))))}
                    style={{
                      width: '100%',
                      background: '#040711',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#fff',
                      fontSize: '0.82rem',
                      outline: 'none',
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Opção para aplicar edição a toda a série (spec 9.1 regra 5) */}
          {Boolean(initialTask?.seriesId) && (
            <div
              style={{
                background: 'rgba(234, 179, 8, 0.08)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FCD34D' }}>
                Esta tarefa faz parte de uma série recorrente. Como deseja salvar?
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: '#fff' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="applyToSeries"
                    checked={!applyToSeries}
                    onChange={() => setApplyToSeries(false)}
                  />
                  <span>Só esta tarefa</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="applyToSeries"
                    checked={applyToSeries}
                    onChange={() => setApplyToSeries(true)}
                  />
                  <span>Esta e as próximas</span>
                </label>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: isAgencyScope ? '1fr 1fr' : '1fr', gap: '14px' }}>
            {viewerRole === 'MASTER_AGENCY' && isAgencyScope && (
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Visibilidade {!clientId && <span style={{ color: 'var(--accent-amber)', fontSize: '0.7rem' }}>(Travada em Interna)</span>}
                </label>
                <select
                  value={!clientId ? 'INTERNAL' : visibility}
                  disabled={!clientId}
                  onChange={(e) => setVisibility(e.target.value as TaskVisibility)}
                  style={{
                    width: '100%',
                    background: !clientId ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    color: !clientId ? 'var(--text-dim)' : '#fff',
                    fontSize: '0.85rem',
                    outline: 'none',
                    cursor: !clientId ? 'not-allowed' : 'pointer',
                  }}
                >
                  <option value="INTERNAL">Interna (só agência)</option>
                  <option value="CLIENT">Visível ao cliente</option>
                </select>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Prazo Final
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Description Markdown */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Descrição e Instruções (Markdown)
            </label>
            <textarea
              rows={4}
              value={descriptionMarkdown}
              onChange={(e) => setDescriptionMarkdown(e.target.value)}
              placeholder="Instruções da tarefa, links de apoio ou critérios de validação..."
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
                resize: 'vertical',
                lineHeight: 1.5,
              }}
            />
          </div>

          {/* Time Estimate (só aparece se apontamento de tempo estiver ligado) */}
          {timeTrackingEnabled && (
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Estimativa de Tempo (Minutos)
              </label>
              <input
                type="number"
                min={0}
                step={15}
                value={timeEstimateMinutes}
                onChange={(e) => setTimeEstimateMinutes(Number(e.target.value))}
                style={{
                  width: '100%',
                  maxWidth: '160px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>
          )}

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ padding: '8px 20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Check size={16} />
              {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar Tarefa' : 'Criar Tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
