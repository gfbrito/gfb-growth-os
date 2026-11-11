import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  Users,
  Plus,
  Trash2,
  Edit2,
  Check,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import {
  type TaskRoutine,
  type TaskRoutineTemplate,
  type TaskArea,
  type TaskPriority,
  type TaskRecurrenceFrequency,
  type AssignableUser,
  AREA_CONFIG,
  PRIORITY_CONFIG,
} from './taskTypes';
import {
  fetchTaskRoutines,
  createTaskRoutine,
  updateTaskRoutine,
  deleteTaskRoutine,
  fetchClientRoutines,
  setClientRoutine,
  fetchAssignableUsers,
} from './taskApi';

interface TaskRoutinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Array<{ id: string; name: string }>;
  currentClientId?: string | null;
  viewerRole?: string;
  onRoutinesChanged?: () => void;
}

export function TaskRoutinesModal({
  isOpen,
  onClose,
  clients,
  currentClientId,
  viewerRole = 'MASTER_AGENCY',
  onRoutinesChanged,
}: TaskRoutinesModalProps) {
  const [activeTab, setActiveTab] = useState<'routines' | 'client_activation'>('routines');
  const [routines, setRoutines] = useState<TaskRoutine[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);

  // Selected client for activation tab
  const [selectedClientId, setSelectedClientId] = useState<string>(
    currentClientId || (clients[0]?.id || '')
  );
  const [clientSubscriptions, setClientSubscriptions] = useState<any[]>([]);

  // Routine editor modal
  const [isEditingRoutine, setIsEditingRoutine] = useState(false);
  const [routineFormId, setRoutineFormId] = useState<string | null>(null);
  const [routineFormName, setRoutineFormName] = useState('');
  const [routineFormDesc, setRoutineFormDesc] = useState('');
  const [routineTemplates, setRoutineTemplates] = useState<TaskRoutineTemplate[]>([]);

  // Feedback banner
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadRoutines();
      fetchAssignableUsers(viewerRole)
        .then((res) => setAssignableUsers(res.users))
        .catch(console.error);
    }
  }, [isOpen, viewerRole]);

  useEffect(() => {
    if (isOpen && activeTab === 'client_activation' && selectedClientId) {
      loadClientSubscriptions(selectedClientId);
    }
  }, [isOpen, activeTab, selectedClientId]);

  const loadRoutines = async () => {
    setLoading(true);
    try {
      const res = await fetchTaskRoutines(viewerRole);
      setRoutines(res.routines || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadClientSubscriptions = async (clientId: string) => {
    try {
      const res = await fetchClientRoutines(clientId, viewerRole);
      setClientSubscriptions(res.subscriptions || []);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  // Open Routine Editor
  const handleOpenNewRoutine = () => {
    setRoutineFormId(null);
    setRoutineFormName('');
    setRoutineFormDesc('');
    setRoutineTemplates([
      {
        id: `tpl_${Date.now()}`,
        title: '',
        descriptionMarkdown: '',
        kind: 'ROUTINE',
        area: 'META_ADS',
        priority: 'NORMAL',
        visibility: 'INTERNAL',
        frequency: 'WEEKLY',
        weekday: 1, // Segunda
        defaultChecklists: ['Verificar métricas do dia anterior'],
      },
    ]);
    setIsEditingRoutine(true);
  };

  const handleEditRoutine = (rtn: TaskRoutine) => {
    setRoutineFormId(rtn.id);
    setRoutineFormName(rtn.name);
    setRoutineFormDesc(rtn.description || '');
    setRoutineTemplates(rtn.templates || []);
    setIsEditingRoutine(true);
  };

  const handleDeleteRoutine = async (rtnId: string) => {
    if (!window.confirm('Deseja excluir esta rotina padrão?')) return;
    try {
      await deleteTaskRoutine(rtnId, viewerRole);
      await loadRoutines();
      if (onRoutinesChanged) onRoutinesChanged();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir rotina');
    }
  };

  const handleSaveRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routineFormName.trim()) {
      alert('Nome da rotina é obrigatório');
      return;
    }
    if (routineTemplates.length === 0) {
      alert('A rotina precisa ter ao menos uma tarefa-modelo.');
      return;
    }
    for (const tpl of routineTemplates) {
      if (!tpl.title.trim()) {
        alert('Todas as tarefas-modelo devem ter um título.');
        return;
      }
    }

    try {
      if (routineFormId) {
        await updateTaskRoutine(
          routineFormId,
          {
            name: routineFormName.trim(),
            description: routineFormDesc.trim(),
            templates: routineTemplates,
          },
          viewerRole
        );
      } else {
        await createTaskRoutine(
          {
            name: routineFormName.trim(),
            description: routineFormDesc.trim(),
            templates: routineTemplates,
          },
          viewerRole
        );
      }
      setIsEditingRoutine(false);
      await loadRoutines();
      if (onRoutinesChanged) onRoutinesChanged();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar rotina');
    }
  };

  // Add template item in editor
  const handleAddTemplate = () => {
    setRoutineTemplates((prev) => [
      ...prev,
      {
        id: `tpl_${Date.now()}`,
        title: '',
        descriptionMarkdown: '',
        kind: 'ROUTINE',
        area: 'META_ADS',
        priority: 'NORMAL',
        visibility: 'INTERNAL',
        frequency: 'WEEKLY',
        weekday: 5, // Sexta
        defaultChecklists: [],
      },
    ]);
  };

  const handleUpdateTemplate = (index: number, updates: Partial<TaskRoutineTemplate>) => {
    setRoutineTemplates((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const handleRemoveTemplate = (index: number) => {
    setRoutineTemplates((prev) => prev.filter((_, i) => i !== index));
  };

  // Toggle routine for client
  const handleToggleClientRoutine = async (routineId: string, currentEnabled: boolean, defaultAssignee?: string | null) => {
    if (!selectedClientId) return;
    const newEnabled = !currentEnabled;

    let assigneeToUse = defaultAssignee;
    if (newEnabled && !assigneeToUse) {
      assigneeToUse = assignableUsers[0]?.id || null;
    }

    try {
      const res = await setClientRoutine(
        selectedClientId,
        routineId,
        {
          enabled: newEnabled,
          assignedUserId: assigneeToUse || undefined,
        },
        viewerRole
      );

      setBannerMessage(res.enabled ? 'Rotina ativada com sucesso!' : 'Rotina desativada.');
      setTimeout(() => setBannerMessage(null), 4000);
      await loadClientSubscriptions(selectedClientId);
      if (onRoutinesChanged) onRoutinesChanged();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar rotina para o cliente');
    }
  };

  const weekdays = [
    { val: 0, label: 'Domingo' },
    { val: 1, label: 'Segunda-feira' },
    { val: 2, label: 'Terça-feira' },
    { val: 3, label: 'Quarta-feira' },
    { val: 4, label: 'Quinta-feira' },
    { val: 5, label: 'Sexta-feira' },
    { val: 6, label: 'Sábado' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '90vh',
          background: '#0B0F19',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-blue)',
              }}
            >
              <Layers size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Rotinas por Serviço
              </h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Pacotes de tarefas recorrentes padronizadas para clientes
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Banner Alert */}
        {bannerMessage && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              borderBottom: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '10px 24px',
              color: '#34D399',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Check size={16} />
            <span>{bannerMessage}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '12px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <button
            onClick={() => setActiveTab('routines')}
            className={`btn ${activeTab === 'routines' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              fontSize: '0.82rem',
              padding: '8px 16px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Layers size={14} />
            <span>Modelos de Rotinas</span>
          </button>

          <button
            onClick={() => setActiveTab('client_activation')}
            className={`btn ${activeTab === 'client_activation' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              fontSize: '0.82rem',
              padding: '8px 16px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Users size={14} />
            <span>Ativação por Cliente</span>
          </button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {activeTab === 'routines' && (
            <div>
              {!isEditingRoutine ? (
                <>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Rotinas configuradas na agência ({routines.length}):
                    </div>
                    <button
                      onClick={handleOpenNewRoutine}
                      className="btn btn-primary"
                      style={{
                        fontSize: '0.82rem',
                        padding: '8px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Plus size={15} />
                      <span>Nova Rotina</span>
                    </button>
                  </div>

                  {loading ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)' }}>
                      Carregando rotinas...
                    </div>
                  ) : routines.length === 0 ? (
                    <div
                      style={{
                        padding: '40px',
                        textAlign: 'center',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '12px',
                        border: '1px dashed rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <Layers size={32} color="var(--text-dim)" style={{ marginBottom: '10px' }} />
                      <div style={{ color: '#fff', fontWeight: 600 }}>Nenhuma rotina cadastrada</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                        Crie pacotes de tarefas padrão para facilitar a ativação em novos clientes.
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {routines.map((rtn) => (
                        <div
                          key={rtn.id}
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            padding: '18px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                                {rtn.name}
                              </div>
                              {rtn.description && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                  {rtn.description}
                                </div>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => handleEditRoutine(rtn)}
                                className="btn btn-secondary"
                                style={{ padding: '6px 10px', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Edit2 size={13} />
                                <span>Editar</span>
                              </button>
                              <button
                                onClick={() => handleDeleteRoutine(rtn.id)}
                                className="btn btn-secondary"
                                style={{
                                  padding: '6px 10px',
                                  fontSize: '0.76rem',
                                  color: '#F43F5E',
                                  borderColor: 'rgba(244, 63, 94, 0.3)',
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Templates list */}
                          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '10px' }}>
                            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '8px' }}>
                              Tarefas-modelo incluídas ({rtn.templates?.length || 0}):
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {rtn.templates?.map((tpl) => {
                                const areaInfo = AREA_CONFIG[tpl.area];
                                const prioInfo = PRIORITY_CONFIG[tpl.priority];
                                const scheduleText =
                                  tpl.frequency === 'WEEKLY'
                                    ? `Semanal (${weekdays.find((w) => w.val === tpl.weekday)?.label || 'Segunda'})`
                                    : tpl.frequency === 'BIWEEKLY'
                                    ? `A cada 15 dias (${weekdays.find((w) => w.val === tpl.weekday)?.label || 'Sexta'})`
                                    : `Mensal (Dia ${tpl.dayOfMonth || 1})`;

                                return (
                                  <div
                                    key={tpl.id}
                                    style={{
                                      background: 'rgba(0, 0, 0, 0.25)',
                                      border: '1px solid rgba(255, 255, 255, 0.05)',
                                      borderRadius: '8px',
                                      padding: '8px 12px',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      flexWrap: 'wrap',
                                      gap: '8px',
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>
                                        {tpl.title}
                                      </span>
                                      {areaInfo && (
                                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                          {areaInfo.iconEmoji} {areaInfo.label}
                                        </span>
                                      )}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span
                                        style={{
                                          fontSize: '0.68rem',
                                          color: prioInfo.color,
                                          background: `${prioInfo.color}15`,
                                          padding: '2px 6px',
                                          borderRadius: '4px',
                                          fontWeight: 700,
                                        }}
                                      >
                                        {prioInfo.label}
                                      </span>
                                      <span
                                        style={{
                                          fontSize: '0.7rem',
                                          color: 'var(--accent-blue)',
                                          background: 'rgba(56, 189, 248, 0.1)',
                                          padding: '2px 8px',
                                          borderRadius: '6px',
                                          fontWeight: 600,
                                        }}
                                      >
                                        {scheduleText}
                                      </span>
                                      {tpl.defaultChecklists && tpl.defaultChecklists.length > 0 && (
                                        <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                                          ☑ {tpl.defaultChecklists.length} itens
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Edit Routine Form */
                <form onSubmit={handleSaveRoutine} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                      {routineFormId ? 'Editar Rotina' : 'Nova Rotina de Serviço'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsEditingRoutine(false)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '5px 10px' }}
                    >
                      Voltar à Lista
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Nome da Rotina *
                      </label>
                      <input
                        type="text"
                        value={routineFormName}
                        onChange={(e) => setRoutineFormName(e.target.value)}
                        placeholder="Ex: Meta Ads Padrão, SEO Mensal"
                        required
                        style={{
                          width: '100%',
                          background: '#040711',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          color: '#fff',
                          fontSize: '0.84rem',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Descrição
                      </label>
                      <input
                        type="text"
                        value={routineFormDesc}
                        onChange={(e) => setRoutineFormDesc(e.target.value)}
                        placeholder="Ex: Gestão semanal de tráfego pago e relatórios"
                        style={{
                          width: '100%',
                          background: '#040711',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          color: '#fff',
                          fontSize: '0.84rem',
                        }}
                      />
                    </div>
                  </div>

                  {/* Template Tasks in Routine */}
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                        Tarefas-Modelo da Rotina ({routineTemplates.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleAddTemplate}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.76rem', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Plus size={13} />
                        <span>Adicionar Tarefa-Modelo</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {routineTemplates.map((tpl, idx) => (
                        <div
                          key={tpl.id || idx}
                          style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '10px',
                            padding: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                              #{idx + 1} Modelo
                            </span>
                            {routineTemplates.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveTemplate(idx)}
                                style={{ background: 'none', border: 'none', color: '#F43F5E', cursor: 'pointer' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px' }}>
                            <div>
                              <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '3px' }}>
                                Título da Tarefa
                              </label>
                              <input
                                type="text"
                                value={tpl.title}
                                onChange={(e) => handleUpdateTemplate(idx, { title: e.target.value })}
                                placeholder="Ex: Check diário de campanhas"
                                required
                                style={{
                                  width: '100%',
                                  background: '#040711',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  borderRadius: '6px',
                                  padding: '6px 10px',
                                  color: '#fff',
                                  fontSize: '0.8rem',
                                }}
                              />
                            </div>

                            <div>
                              <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '3px' }}>
                                Área
                              </label>
                              <select
                                value={tpl.area}
                                onChange={(e) => handleUpdateTemplate(idx, { area: e.target.value as TaskArea })}
                                style={{
                                  width: '100%',
                                  background: '#040711',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  borderRadius: '6px',
                                  padding: '6px 8px',
                                  color: '#fff',
                                  fontSize: '0.8rem',
                                }}
                              >
                                {Object.entries(AREA_CONFIG).map(([k, conf]) => (
                                  <option key={k} value={k}>
                                    {conf.iconEmoji} {conf.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '3px' }}>
                                Prioridade
                              </label>
                              <select
                                value={tpl.priority}
                                onChange={(e) => handleUpdateTemplate(idx, { priority: e.target.value as TaskPriority })}
                                style={{
                                  width: '100%',
                                  background: '#040711',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  borderRadius: '6px',
                                  padding: '6px 8px',
                                  color: '#fff',
                                  fontSize: '0.8rem',
                                }}
                              >
                                {Object.entries(PRIORITY_CONFIG).map(([k, conf]) => (
                                  <option key={k} value={k}>
                                    {conf.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Recurrence frequency & day */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                            <div>
                              <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '3px' }}>
                                Frequência
                              </label>
                              <select
                                value={tpl.frequency}
                                onChange={(e) =>
                                  handleUpdateTemplate(idx, {
                                    frequency: e.target.value as TaskRecurrenceFrequency,
                                  })
                                }
                                style={{
                                  width: '100%',
                                  background: '#040711',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  borderRadius: '6px',
                                  padding: '6px 8px',
                                  color: '#fff',
                                  fontSize: '0.8rem',
                                }}
                              >
                                <option value="WEEKLY">Toda semana</option>
                                <option value="BIWEEKLY">A cada 15 dias</option>
                                <option value="MONTHLY">Todo mês</option>
                              </select>
                            </div>

                            {tpl.frequency !== 'MONTHLY' ? (
                              <div>
                                <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '3px' }}>
                                  Dia da Semana
                                </label>
                                <select
                                  value={tpl.weekday !== undefined ? tpl.weekday : 1}
                                  onChange={(e) => handleUpdateTemplate(idx, { weekday: Number(e.target.value) })}
                                  style={{
                                    width: '100%',
                                    background: '#040711',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '6px',
                                    padding: '6px 8px',
                                    color: '#fff',
                                    fontSize: '0.8rem',
                                  }}
                                >
                                  {weekdays.map((w) => (
                                    <option key={w.val} value={w.val}>
                                      {w.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <div>
                                <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '3px' }}>
                                  Dia do Mês (1-31)
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  max={31}
                                  value={tpl.dayOfMonth || 1}
                                  onChange={(e) =>
                                    handleUpdateTemplate(idx, { dayOfMonth: Math.max(1, Math.min(31, Number(e.target.value))) })
                                  }
                                  style={{
                                    width: '100%',
                                    background: '#040711',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '6px',
                                    padding: '6px 8px',
                                    color: '#fff',
                                    fontSize: '0.8rem',
                                  }}
                                />
                              </div>
                            )}

                            <div>
                              <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '3px' }}>
                                Visibilidade Padrão
                              </label>
                              <select
                                value={tpl.visibility}
                                onChange={(e) => handleUpdateTemplate(idx, { visibility: e.target.value as any })}
                                style={{
                                  width: '100%',
                                  background: '#040711',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  borderRadius: '6px',
                                  padding: '6px 8px',
                                  color: '#fff',
                                  fontSize: '0.8rem',
                                }}
                              >
                                <option value="INTERNAL">🔒 Interna</option>
                                <option value="CLIENT">👥 Visível ao Cliente</option>
                              </select>
                            </div>
                          </div>

                          {/* Default checklists */}
                          <div>
                            <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '3px' }}>
                              Itens de Checklist Padrão (separados por vírgula ou linha)
                            </label>
                            <input
                              type="text"
                              value={tpl.defaultChecklists ? tpl.defaultChecklists.join('; ') : ''}
                              onChange={(e) =>
                                handleUpdateTemplate(idx, {
                                  defaultChecklists: e.target.value
                                    .split(';')
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                })
                              }
                              placeholder="Ex: Verificar saldo; Ajustar lances; Checar criativos"
                              style={{
                                width: '100%',
                                background: '#040711',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                color: '#fff',
                                fontSize: '0.78rem',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setIsEditingRoutine(false)}
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px' }}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ padding: '8px 20px', fontWeight: 800 }}>
                      Salvar Rotina
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === 'client_activation' && (
            <div>
              {/* Client Selection */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Selecione o Cliente para Gerenciar Rotinas:
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    style={{
                      width: '100%',
                      maxWidth: '360px',
                      background: '#040711',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#fff',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                    }}
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', maxWidth: '300px' }}>
                  Ao ligar uma rotina, a 1ª ocorrência das tarefas é gerada automaticamente com a data correta.
                </div>
              </div>

              {/* Routines Grid for this client */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {routines.map((rtn) => {
                  const sub = clientSubscriptions.find((s) => s.routineId === rtn.id);
                  const isEnabled = Boolean(sub?.enabled);

                  return (
                    <div
                      key={rtn.id}
                      style={{
                        background: isEnabled ? 'rgba(56, 189, 248, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${isEnabled ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.06)'}`,
                        borderRadius: '12px',
                        padding: '18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '16px',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '240px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#fff' }}>
                            {rtn.name}
                          </span>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              color: isEnabled ? '#34D399' : 'var(--text-dim)',
                              background: isEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                              border: `1px solid ${isEnabled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                              padding: '2px 8px',
                              borderRadius: '12px',
                            }}
                          >
                            {isEnabled ? '● ATIVA' : '○ INATIVA'}
                          </span>
                        </div>
                        {rtn.description && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {rtn.description}
                          </div>
                        )}
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                          {rtn.templates?.length || 0} tarefas-modelo incluídas
                        </div>
                      </div>

                      {/* Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {isEnabled ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              Responsável: <strong>{assignableUsers.find((u) => u.id === sub?.assignedUserId)?.name || 'Bruna Santos'}</strong>
                            </span>
                            <button
                              onClick={() => handleToggleClientRoutine(rtn.id, true)}
                              className="btn btn-secondary"
                              style={{
                                color: '#F43F5E',
                                borderColor: 'rgba(244, 63, 94, 0.3)',
                                fontSize: '0.76rem',
                                padding: '6px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <ToggleRight size={16} />
                              <span>Desligar Rotina</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleToggleClientRoutine(rtn.id, false)}
                            className="btn btn-primary"
                            style={{
                              fontSize: '0.78rem',
                              padding: '6px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <ToggleLeft size={16} />
                            <span>Ativar Rotina</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
