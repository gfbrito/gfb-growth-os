import React, { useState } from 'react';
import type { Launch, LaunchGroup, LaunchScheduledGroupAction } from '../launchTypes';
import { createLaunchAction } from '../launchApi';
import { X, Lock, Unlock, Type, FileText, Image as ImageIcon, Calendar, Clock, Check } from 'lucide-react';

interface ScheduleActionModalProps {
  launch: Launch;
  groups: LaunchGroup[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ScheduleActionModal({
  launch,
  groups,
  isOpen,
  onClose,
  onSuccess,
}: ScheduleActionModalProps) {
  const [type, setType] = useState<LaunchScheduledGroupAction['type']>('LOCK_MESSAGES');
  const [payload, setPayload] = useState<string>('');
  const [applyToAll, setApplyToAll] = useState<boolean>(true);
  const [applyToFuture, setApplyToFuture] = useState<boolean>(true);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [runImmediate, setRunImmediate] = useState<boolean>(true);
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const scheduledAt = runImmediate ? new Date().toISOString() : new Date(scheduledDate).toISOString();

      await createLaunchAction(launch.id, {
        type,
        payload: type === 'LOCK_MESSAGES' || type === 'UNLOCK_MESSAGES' ? '' : payload,
        scheduledAt,
        applyToAllGroups: applyToAll,
        applyToFuture,
        selectedGroupIds: applyToAll ? undefined : selectedGroupIds,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Erro ao agendar ação');
    } finally {
      setSubmitting(false);
    }
  };

  const actionTypes: Array<{ id: LaunchScheduledGroupAction['type']; label: string; desc: string; icon: any }> = [
    { id: 'LOCK_MESSAGES', label: 'Silenciar Grupos', desc: 'Apenas admins podem enviar mensagens', icon: Lock },
    { id: 'UNLOCK_MESSAGES', label: 'Abrir Grupos', desc: 'Permitir que todos conversem', icon: Unlock },
    { id: 'CHANGE_NAME', label: 'Alterar Nome', desc: 'Atualizar padrão de nome dos grupos', icon: Type },
    { id: 'CHANGE_DESCRIPTION', label: 'Alterar Descrição', desc: 'Modificar texto fixo de descrição', icon: FileText },
    { id: 'CHANGE_PHOTO', label: 'Alterar Foto', desc: 'Atualizar ícone de perfil dos grupos', icon: ImageIcon },
  ];

  return (
    <div className="modal-backdrop" style={{ zIndex: 1200 }}>
      <div className="modal-card" style={{ maxWidth: '560px', width: '100%', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Agendar Ação nos Grupos</h3>
          <button onClick={onClose} className="btn-icon" style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Action Type Selector */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>
              Tipo de Ação
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {actionTypes.map((item) => {
                const Icon = item.icon;
                const isSelected = type === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                      color: isSelected ? 'var(--accent-cyan)' : '#fff',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <Icon size={18} />
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{item.label}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payload inputs for Name, Description, Photo */}
          {type === 'CHANGE_NAME' && (
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
                Novo Padrão de Nome (suporta {'{nome}'} e {'{n}'})
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="{nome} - Grupo {n}"
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                required
              />
            </div>
          )}

          {type === 'CHANGE_DESCRIPTION' && (
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
                Nova Descrição do Grupo
              </label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Insira as regras e avisos do grupo..."
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                required
              />
            </div>
          )}

          {type === 'CHANGE_PHOTO' && (
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
                URL da Foto / Ícone (JPEG ou PNG)
              </label>
              <input
                type="url"
                className="input-field"
                placeholder="https://..."
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                required
              />
            </div>
          )}

          {/* Group Scope */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer', color: '#fff' }}>
              <input type="checkbox" checked={applyToAll} onChange={(e) => setApplyToAll(e.target.checked)} />
              Aplicar a todos os grupos atuais do lançamento ({groups.length})
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer', color: '#fff' }}>
              <input type="checkbox" checked={applyToFuture} onChange={(e) => setApplyToFuture(e.target.checked)} />
              Replicar automaticamente em novos grupos gerados pela fila
            </label>
          </div>

          {/* Schedule Time */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '6px', display: 'block' }}>
              Momento da Execução
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <button
                type="button"
                onClick={() => setRunImmediate(true)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  background: runImmediate ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  border: runImmediate ? '1px solid var(--accent-green)' : '1px solid var(--border-subtle)',
                  color: runImmediate ? 'var(--accent-green)' : 'var(--text-dim)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Imediato (Agora)
              </button>
              <button
                type="button"
                onClick={() => setRunImmediate(false)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  background: !runImmediate ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  border: !runImmediate ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                  color: !runImmediate ? 'var(--accent-cyan)' : 'var(--text-dim)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Agendar Data & Hora
              </button>
            </div>

            {!runImmediate && (
              <input
                type="datetime-local"
                className="input-field"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                required
              />
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={16} /> {submitting ? 'Salvando...' : 'Confirmar Ação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
