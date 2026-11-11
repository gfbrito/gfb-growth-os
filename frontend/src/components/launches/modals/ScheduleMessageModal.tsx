import React, { useState } from 'react';
import type { Launch, LaunchGroup, LaunchMessage } from '../launchTypes';
import { createLaunchMessage } from '../launchApi';
import { MessageComposer, type ComposerData } from '../shared/MessageComposer';
import { WhatsAppPreview } from '../shared/WhatsAppPreview';
import { X, Send, Calendar, Users } from 'lucide-react';

interface ScheduleMessageModalProps {
  launch: Launch;
  groups: LaunchGroup[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ScheduleMessageModal({
  launch,
  groups,
  isOpen,
  onClose,
  onSuccess,
}: ScheduleMessageModalProps) {
  const [composerData, setComposerData] = useState<ComposerData>({
    type: 'TEXT',
    content: '',
    delayMinSeconds: 8,
    delayMaxSeconds: 25,
  });

  const [targetType, setTargetType] = useState<'ALL' | 'SPECIFIC'>('ALL');
  const [targetGroupIds, setTargetGroupIds] = useState<string[]>([]);
  const [sendNow, setSendNow] = useState<boolean>(true);
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (composerData.type === 'TEXT' && !composerData.content.trim()) {
      alert('Digite o texto da mensagem');
      return;
    }

    try {
      setSubmitting(true);
      const scheduledAt = sendNow ? null : new Date(scheduledDate).toISOString();

      await createLaunchMessage(launch.id, {
        type: composerData.type,
        content: composerData.content,
        mediaUrl: composerData.mediaUrl,
        caption: composerData.caption,
        pollOptions: composerData.pollOptions,
        targetGroups: targetType,
        targetGroupIds: targetType === 'SPECIFIC' ? targetGroupIds : undefined,
        scheduledAt,
        delayMinSeconds: composerData.delayMinSeconds,
        delayMaxSeconds: composerData.delayMaxSeconds,
        status: sendNow ? 'SENDING' : 'SCHEDULED',
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Erro ao agendar disparo');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleGroupSelect = (id: string) => {
    setTargetGroupIds((prev) =>
      prev.includes(id) ? prev.filter((gid) => gid !== id) : [...prev, id]
    );
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 1200 }}>
      <div
        className="modal-card"
        style={{
          maxWidth: '1000px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Nova Mensagem para os Grupos</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              Disparo humanizado com anti-ban SendGate, Spintax e prévia em tempo real.
            </p>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Main 2-column layout: Form vs Preview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)', gap: '24px' }}>
            {/* Left: Composer Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <MessageComposer
                initialData={composerData}
                onChange={(data) => setComposerData(data)}
                showDelays={true}
              />

              {/* Group Destination */}
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>
                  Grupos de Destino
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setTargetType('ALL')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '6px',
                      background: targetType === 'ALL' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: targetType === 'ALL' ? '1px solid var(--accent-green)' : '1px solid var(--border-subtle)',
                      color: targetType === 'ALL' ? 'var(--accent-green)' : 'var(--text-dim)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Todos os Grupos ({groups.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('SPECIFIC')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '6px',
                      background: targetType === 'SPECIFIC' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: targetType === 'SPECIFIC' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                      color: targetType === 'SPECIFIC' ? 'var(--accent-cyan)' : 'var(--text-dim)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Selecionar Específicos
                  </button>
                </div>

                {targetType === 'SPECIFIC' && (
                  <div
                    style={{
                      maxHeight: '120px',
                      overflowY: 'auto',
                      background: 'rgba(0,0,0,0.2)',
                      padding: '8px',
                      borderRadius: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    {groups.map((g) => (
                      <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#fff', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={targetGroupIds.includes(g.id)}
                          onChange={() => toggleGroupSelect(g.id)}
                        />
                        {g.name} ({g.memberCount} membros)
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Schedule Timing */}
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>
                  Agendamento
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setSendNow(true)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '6px',
                      background: sendNow ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: sendNow ? '1px solid var(--accent-green)' : '1px solid var(--border-subtle)',
                      color: sendNow ? 'var(--accent-green)' : 'var(--text-dim)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Enviar Agora
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendNow(false)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '6px',
                      background: !sendNow ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: !sendNow ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                      color: !sendNow ? 'var(--accent-cyan)' : 'var(--text-dim)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Agendar Horário
                  </button>
                </div>

                {!sendNow && (
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    required
                  />
                )}
              </div>
            </div>

            {/* Right: Realistic WhatsApp Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Prévia ao Vivo no WhatsApp
              </span>
              <WhatsAppPreview
                data={composerData}
                senderName="GFB Digital"
                groupName={launch.name}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Send size={15} /> {submitting ? 'Processando...' : sendNow ? 'Iniciar Disparo' : 'Agendar Mensagem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
