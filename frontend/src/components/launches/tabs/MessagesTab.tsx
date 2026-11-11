import React, { useState, useEffect } from 'react';
import type { Launch, LaunchGroup, LaunchMessage } from '../launchTypes';
import { fetchLaunchMessages, cancelLaunchMessage, fetchLaunchGroups } from '../launchApi';
import { ScheduleMessageModal } from '../modals/ScheduleMessageModal';
import {
  MessageSquare,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Mic,
  FileCheck,
  BarChart2,
} from 'lucide-react';

interface MessagesTabProps {
  launch: Launch;
}

export function MessagesTab({ launch }: MessagesTabProps) {
  const [messages, setMessages] = useState<LaunchMessage[]>([]);
  const [groups, setGroups] = useState<LaunchGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [msgs, grps] = await Promise.all([
        fetchLaunchMessages(launch.id),
        fetchLaunchGroups(launch.id),
      ]);
      setMessages(msgs);
      setGroups(grps);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [launch.id]);

  const handleCancel = async (msgId: string) => {
    if (confirm('Cancelar o envio desta mensagem?')) {
      try {
        await cancelLaunchMessage(launch.id, msgId);
        loadData();
      } catch (e: any) {
        alert(e.message || 'Erro ao cancelar mensagem');
      }
    }
  };

  const getTypeIcon = (type: LaunchMessage['type']) => {
    switch (type) {
      case 'TEXT': return <FileText size={15} color="var(--accent-cyan)" />;
      case 'IMAGE': return <ImageIcon size={15} color="var(--accent-green)" />;
      case 'VIDEO': return <VideoIcon size={15} color="var(--accent-purple)" />;
      case 'AUDIO': return <Mic size={15} color="var(--accent-amber)" />;
      case 'DOCUMENT': return <FileCheck size={15} color="var(--accent-cyan)" />;
      case 'POLL': return <BarChart2 size={15} color="var(--accent-rose)" />;
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
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>Mensagens para os Grupos</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Envios em massa e agendamentos com intervalo anti-ban SendGate ({messages.length} mensagens no histórico).
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem' }}
        >
          <Plus size={15} /> Nova Mensagem para os Grupos
        </button>
      </div>

      {/* Messages List */}
      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          Carregando histórico de mensagens...
        </div>
      ) : messages.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Nenhuma mensagem disparada ou agendada para os grupos deste lançamento.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.map((msg) => {
            const isSent = msg.status === 'SENT';
            const isScheduled = msg.status === 'SCHEDULED';
            const isSending = msg.status === 'SENDING';
            const isFailed = msg.status === 'FAILED';

            return (
              <div
                key={msg.id}
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
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: '260px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '2px',
                    }}
                  >
                    {getTypeIcon(msg.type)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span
                        className={
                          isSent
                            ? 'badge badge-green'
                            : isScheduled
                            ? 'badge badge-cyan'
                            : isSending
                            ? 'badge badge-amber'
                            : isFailed
                            ? 'badge badge-rose'
                            : 'badge badge-gray'
                        }
                        style={{ fontSize: '0.68rem' }}
                      >
                        {isSent ? 'Enviada' : isScheduled ? 'Agendada' : isSending ? 'Enviando...' : isFailed ? 'Falhou' : 'Cancelada'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        {msg.targetGroups === 'ALL'
                          ? `Todos os grupos (${groups.length})`
                          : `${(msg.targetGroupIds || []).length} grupo(s)`}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.84rem', color: '#e2e8f0', lineHeight: 1.4, maxHeight: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {msg.content || msg.caption || `[Arquivo ${msg.type}]`}
                    </div>

                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                      Intervalo: {msg.delayMinSeconds}s a {msg.delayMaxSeconds}s
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600 }}>
                      {msg.scheduledAt
                        ? new Date(msg.scheduledAt).toLocaleDateString('pt-BR') + ' ' + new Date(msg.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                        : new Date(msg.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                      {isSent ? 'Disparo concluído' : isScheduled ? 'Programado' : 'Data de criação'}
                    </div>
                  </div>

                  {(isScheduled || isSending) && (
                    <button
                      onClick={() => handleCancel(msg.id)}
                      className="btn-icon"
                      title="Cancelar Envio"
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
      <ScheduleMessageModal
        launch={launch}
        groups={groups}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
