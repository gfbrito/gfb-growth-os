import React, { useState, useEffect } from 'react';
import type { Launch, LaunchGroup, LaunchScheduledGroupAction } from '../launchTypes';
import { fetchLaunchActions, cancelLaunchAction, fetchLaunchGroups } from '../launchApi';
import { ScheduleActionModal } from '../modals/ScheduleActionModal';
import {
  Calendar,
  Plus,
  Lock,
  Unlock,
  Type,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
} from 'lucide-react';

interface ActionsTabProps {
  launch: Launch;
}

export function ActionsTab({ launch }: ActionsTabProps) {
  const [actions, setActions] = useState<LaunchScheduledGroupAction[]>([]);
  const [groups, setGroups] = useState<LaunchGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [act, grp] = await Promise.all([
        fetchLaunchActions(launch.id),
        fetchLaunchGroups(launch.id),
      ]);
      setActions(act);
      setGroups(grp);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [launch.id]);

  const handleCancel = async (actionId: string) => {
    if (confirm('Deseja realmente cancelar este agendamento?')) {
      try {
        await cancelLaunchAction(launch.id, actionId);
        loadData();
      } catch (e: any) {
        alert(e.message || 'Erro ao cancelar ação');
      }
    }
  };

  const getActionIcon = (type: LaunchScheduledGroupAction['type']) => {
    switch (type) {
      case 'LOCK_MESSAGES':
        return <Lock size={16} color="var(--accent-rose)" />;
      case 'UNLOCK_MESSAGES':
        return <Unlock size={16} color="var(--accent-green)" />;
      case 'CHANGE_NAME':
        return <Type size={16} color="var(--accent-cyan)" />;
      case 'CHANGE_DESCRIPTION':
        return <FileText size={16} color="var(--accent-amber)" />;
      case 'CHANGE_PHOTO':
        return <ImageIcon size={16} color="var(--accent-purple)" />;
    }
  };

  const getActionLabel = (type: LaunchScheduledGroupAction['type']) => {
    switch (type) {
      case 'LOCK_MESSAGES':
        return 'Silenciar Grupos (Apenas Admins)';
      case 'UNLOCK_MESSAGES':
        return 'Liberar Conversas (Todos)';
      case 'CHANGE_NAME':
        return 'Alterar Nome dos Grupos';
      case 'CHANGE_DESCRIPTION':
        return 'Atualizar Descrição';
      case 'CHANGE_PHOTO':
        return 'Atualizar Foto de Perfil';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div
        className="glass-panel"
        style={{
          padding: '18px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>Ações Agendadas nos Grupos</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Automações sincronizadas: abrir/fechar grupos, alterar links ou descrições no momento exato do lançamento.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem' }}
        >
          <Plus size={15} /> Agendar Ação em Massa
        </button>
      </div>

      {/* Actions List */}
      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          Carregando histórico de ações...
        </div>
      ) : actions.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Nenhuma ação agendada para os grupos deste lançamento.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {actions.map((act) => {
            const isScheduled = act.status === 'SCHEDULED';
            const isExecuted = act.status === 'EXECUTED';

            return (
              <div
                key={act.id}
                className="glass-panel"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {getActionIcon(act.type)}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.92rem', fontWeight: 750, color: '#fff' }}>
                        {getActionLabel(act.type)}
                      </span>
                      <span
                        className={
                          isScheduled
                            ? 'badge badge-cyan'
                            : isExecuted
                            ? 'badge badge-green'
                            : 'badge badge-gray'
                        }
                        style={{ fontSize: '0.68rem' }}
                      >
                        {isScheduled ? 'Agendada' : isExecuted ? 'Executada' : 'Cancelada'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '3px' }}>
                      {act.applyToAllGroups
                        ? `Aplicado a todos os grupos (${groups.length})`
                        : `Aplicado a ${(act.selectedGroupIds || []).length} grupo(s)`}
                      {act.applyToFuture && ' · Ativo para novos grupos'}
                    </div>

                    {act.payload && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', marginTop: '2px' }}>
                        Parâmetro: <code>{act.payload}</code>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600 }}>
                      {new Date(act.scheduledAt).toLocaleDateString('pt-BR')}{' '}
                      {new Date(act.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                      {isExecuted ? 'Executado com sucesso' : 'Horário programado'}
                    </div>
                  </div>

                  {isScheduled && (
                    <button
                      onClick={() => handleCancel(act.id)}
                      className="btn-icon"
                      title="Cancelar Agendamento"
                      style={{ background: 'transparent', color: 'var(--accent-rose)', padding: '6px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <ScheduleActionModal
        launch={launch}
        groups={groups}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
